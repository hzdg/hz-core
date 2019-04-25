#! /usr/bin/env node
// @ts-check
const childProcess = require('child_process');
const {onExit} = require('@rauschma/stringio');
const path = require('path');
const os = require('os');
const fs = require('fs');
const {promisify} = require('util');
const rmdir = promisify(require('rimraf'));
const mkdirp = promisify(require('mkdirp'));
const stoppable = require('stoppable');
// @ts-ignore
const report = require('yurnalist');
// @ts-ignore
const {default: verdaccio} = require('verdaccio');

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);
const rm = promisify(fs.unlink);

/**
 * @typedef {Object} Pkg
 * @property {string} name
 * @property {string} version
 * @property {boolean} private
 * @property {string} location
 * @property {{[name: string]: string}} peerDependencies
 */

/**
 * @typedef {Object} PkgJson
 * @property {string} name
 * @property {string} version
 * @property {boolean} private
 * @property {{[name: string]: string}} peerDependencies
 * @property {{registry: string}} publishConfig
 */

/**
 * @typedef {Object} Registry
 * @property {string} url
 * @property {() => void} stop
 */

/**
 * @typedef {Object} Project
 * @property {string} path
 * @property {Pkg[]} installedPackages
 * @property {() => Promise<void>} cleanup
 */

const verdaccioConfig = {
  storage: path.join(os.tmpdir(), `verdaccio`, `storage`),
  port: 4873, // default
  web: {
    enable: true,
    title: `hzcore-dev`,
  },
  logs: [{type: `stdout`, format: `pretty-timestamped`, level: `warn`}],
  packages: {
    '**': {
      access: `$all`,
      publish: `$all`,
      proxy: `npmjs`,
    },
  },
  uplinks: {
    npmjs: {
      url: `https://registry.npmjs.org/`,
    },
  },
};

/**
 * @param {string} command
 * @param {string[]} args
 * @param {import('child_process').SpawnOptions | undefined} [options]
 * @returns {Promise<void>}
 */
async function run(command, args, options) {
  report.command(`${command} ${args.join(' ')}`);
  const source = childProcess.spawn(command, args, {
    stdio: ['ignore', process.stdout, process.stderr],
    ...options,
  });
  return onExit(source);
}

/**
 *
 * @param {string} command
 * @param {import('child_process').ExecSyncOptionsWithStringEncoding | undefined} [options]
 */
function execSync(command, options) {
  report.command(command);
  return childProcess.execSync(command, options);
}

/**
 *
 * @param {Pkg} pkg
 * @returns {Promise<PkgJson>}
 */
async function readPackageJson({location}) {
  const pkgJsonPath = path.join(location, 'package.json');
  return JSON.parse((await readFile(pkgJsonPath)).toString());
}
/**
 *
 * @param {Pkg} pkg
 * @param {PkgJson} pkgJson
 * @returns {Promise<void>}
 */
function writePackageJson({location}, pkgJson) {
  const pkgJsonPath = path.join(location, 'package.json');
  return writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
}

/**
 * @param {Record<string, Pkg>} pkgs
 * @returns {Promise<void>}
 */
async function ensureCleanWorkingDirs(pkgs) {
  for (const pkg of Object.values(pkgs)) {
    const diff = execSync(`git diff --stat ${pkg.location}`).toString();
    if (diff) {
      throw new Error(
        `${path.relative(
          process.cwd(),
          pkg.location,
        )} has uncommited changes!\n${diff}`,
      );
    }
  }
}

/**
 * @returns {Promise<Record<string, Pkg>>}
 */
async function collectPkgsToPublish() {
  /** @type Record<string, Pkg> */
  const pkgsToPublish = {};
  for (const pkg of JSON.parse(
    execSync('lerna changed --all --json --loglevel=error').toString(),
  )) {
    const meta = await readPackageJson(pkg);
    pkgsToPublish[pkg.name] = {...meta, ...pkg};
  }
  if (!Object.keys(pkgsToPublish).length) {
    throw new Error('No packages need publishing!');
  }
  if (Object.values(pkgsToPublish).every(pkg => pkg.private)) {
    throw new Error(
      `No public packages need publishing!\nChanged packages are:\n${Object.keys(
        pkgsToPublish,
      )
        .map(n => `  ${n}`)
        .join('\n')}`,
    );
  }
  return pkgsToPublish;
}

async function getBranch() {
  return execSync(`git rev-parse --abbrev-ref HEAD`).toString(); // TODO: Remove this?
}

/**
 * @returns {Promise<Record<string, Pkg>>}
 */
async function versionPkgs() {
  // NOTE: We will do this again after the version has happened,
  // but we do it before versioning now to bail as early
  // as possible if we don't have any publishable packages,
  // or if we have uncommitted changes in any packages.
  let pkgsToPublish = await collectPkgsToPublish();
  await ensureCleanWorkingDirs(pkgsToPublish);
  // Get the current branch. This is to override lerna's configuration,
  // which normally only alows versioning/publishing from the default branch.
  const gitBranch = await getBranch();
  await run('lerna', [
    'version',
    'prerelease',
    '--yes',
    '--loglevel=error',
    '--no-progress',
    '--no-git-tag-version',
    '--preid=dev',
    `--allow-branch=${gitBranch}`,
  ]);
  pkgsToPublish = await collectPkgsToPublish();
  report.success('Created new versions!');
  return pkgsToPublish;
}

/**
 * @param {Record<string, Pkg>} pkgs
 * @returns {Promise<void>}
 */
async function rollbackVersions(pkgs) {
  const spinner = report.activity();
  spinner.tick('rolling back versions');
  for (const pkg in pkgs) {
    await run('git', ['checkout', `${pkgs[pkg].location}`]);
  }
  report.success('Rolled back versions!');
  spinner.end();
}

/**
 * @returns {Promise<Registry>}
 */
async function startRegistry() {
  const spinner = report.activity();
  spinner.tick('Starting local verdaccio server');
  // clear storage
  await rmdir(verdaccioConfig.storage);
  return new Promise(resolve => {
    verdaccio(
      verdaccioConfig,
      verdaccioConfig.port,
      verdaccioConfig.storage,
      `1.0.0`,
      `hzcore-dev`,
      // @ts-ignore
      (webServer, addr) => {
        webServer.listen(addr.port || addr.path, addr.host, () => {
          const registryUrl = `http://${addr.host}:${addr.port}`;
          const registry = stoppable(webServer);
          report.success(`Started local verdaccio server at ${registryUrl}`);
          spinner.end();
          resolve({
            url: registryUrl,
            stop: promisify(registry.stop.bind(registry)),
          });
        });
      },
    );
  });
}

/**
 * @param {Pkg} pkg
 * @param {string} registry
 * @returns {Promise<() => Promise<void>>}
 */
async function createTemporaryNPMRC({location}, registry) {
  const NPMRCPath = path.join(location, `.npmrc`);
  const NPMRC = `${registry.replace(/https?:/g, ``)}/:_authToken="hzcore-dev"`;
  await writeFile(NPMRCPath, NPMRC);
  return async () => {
    await rm(NPMRCPath);
  };
}

/**
 *
 * @param {Pkg} pkg
 * @param {string} registry
 */
async function updatePackageRegistry(pkg, registry) {
  const pkgJson = await readPackageJson(pkg);
  pkgJson.publishConfig = {registry};
  return writePackageJson(pkg, pkgJson);
}

/**
 * @param {Pkg[]} pkgs
 * @param {string} [root]
 * @returns {Promise<Record<string, string>>}
 */
async function collectProjectFiles(pkgs, root) {
  const templateRoot = root
    ? path.resolve(__dirname, '../test-package', root)
    : path.resolve(__dirname, '../test-package');
  const templateFilenames = await readdir(templateRoot);
  /** @type {Record<string, string>} */
  const projectFiles = {};
  const TemplatePattern = /%([^%]+)%/g;
  const ExtPattern = /(\.[^.]+)(?:\.js)?$/;
  for (const templateFilename of templateFilenames) {
    const templatePath = path.resolve(templateRoot, templateFilename);
    if ((await stat(templatePath)).isDirectory()) {
      Object.assign(
        projectFiles,
        await collectProjectFiles(
          pkgs,
          root ? path.join(root, templateFilename) : templateFilename,
        ),
      );
    } else if (TemplatePattern.test(templatePath)) {
      const template = require(templatePath);
      if (typeof template !== 'function') {
        throw new Error(
          `Expected ${templatePath} to export a template function, but got ${template}`,
        );
      }
      for (const pkg of pkgs) {
        const filepath = templateFilename
          .replace(TemplatePattern, (pattern, match) =>
            // @ts-ignore
            match ? pkg[match] : pattern,
          )
          .replace('@hzcore/', '')
          .replace(ExtPattern, '$1');
        projectFiles[root ? path.join(root, filepath) : filepath] = template(
          pkg,
        );
      }
    } else {
      const src = (await readFile(templatePath)).toString();
      if (!src) {
        throw new Error(`Could not read file at ${templatePath}`);
      }
      projectFiles[
        root ? path.join(root, templateFilename) : templateFilename
      ] = src;
    }
  }
  return projectFiles;
}

/**
 *
 * @param {string} packagePath
 * @param {Pkg[]} pkgs
 * @returns {Promise<() => Promise<void>>}
 */
async function createTestProject(packagePath, pkgs) {
  const spinner = report.activity();
  spinner.tick(`creating test project`);
  await rmdir(packagePath);
  await mkdirp(packagePath);

  try {
    const projectFiles = await collectProjectFiles(pkgs);
    for (const filepath in projectFiles) {
      const targetPath = path.resolve(packagePath, filepath);
      await mkdirp(path.dirname(targetPath));
      await writeFile(targetPath, projectFiles[filepath]);
    }
  } catch (e) {
    await rmdir(packagePath);
    spinner.end();
    throw e;
  }
  spinner.end();
  report.success(`Created test project at ${packagePath}!`);
  return async () => {
    await rmdir(packagePath);
  };
}

/**
 * @param {Record<string, Pkg>} pkgs
 * @param {string} registry
 * @returns {Promise<Pkg[]>}
 */
async function publishPkgs(pkgs, registry) {
  const spinner = report.activity();
  spinner.tick(`publishing packages`);
  const publishedPkgs = [];
  for (const pkg of Object.values(pkgs)) {
    if (pkg.private) {
      report.warn(`skipping private package ${pkg.name}!`);
      continue;
    }

    const cleanup = await createTemporaryNPMRC(pkg, registry);
    let error;
    try {
      await updatePackageRegistry(pkg, registry);
      await run(
        'npm',
        [
          'publish',
          '--loglevel=silent',
          '--no-progress',
          '--tag',
          'hzcore-dev',
          `--registry=${registry}`,
        ],
        {cwd: pkg.location},
      );
      publishedPkgs.push(pkg);
    } catch (e) {
      error = e;
    } finally {
      await cleanup();
    }
    if (error) {
      spinner.end();
      throw error;
    }
    report.success(`Published ${pkg.name} to ${registry}!`);
  }
  spinner.end();
  return publishedPkgs;
}

/**
 *
 * @param {Pkg[]} pkgs
 * @param {string} registry
 * @returns {Promise<Project>}
 */
async function installPublishedPkgs(pkgs, registry) {
  const packagePath = path.join(os.tmpdir(), 'hzcore', 'test');
  const cleanup = await createTestProject(packagePath, pkgs);
  /** @type Set<string> */
  const pkgsToInstall = new Set();
  for (const pkg of pkgs) {
    pkgsToInstall.add(`${pkg.name}@hzcore-dev`);
    for (const dep in pkg.peerDependencies) {
      pkgsToInstall.add(`${dep}@${pkg.peerDependencies[dep]}`);
    }
  }

  try {
    await run(
      'yarn',
      [
        'add',
        ...Array.from(pkgsToInstall),
        '--no-progress',
        '--non-interactive',
        `--registry=${registry}`,
        '--exact',
      ],
      {cwd: packagePath},
    );
    report.success('installed packages!');
  } catch (error) {
    await cleanup();
    throw error;
  }
  return {path: packagePath, installedPackages: pkgs, cleanup};
}

/**
 *
 * @param {Record<string, Pkg>} pkgs
 * @param {Project} project
 * @returns {Promise<void>}
 */
async function testInstalledPackages(pkgs, project) {
  await run('jest', [], {cwd: project.path});
}

/**
 * @param {{open: string | false}} [options]
 * @returns {Promise<Record<string, Pkg> | undefined>}
 */
async function testPublish(options) {
  const openCmd = options ? options.open : false;
  const shouldOpen = typeof openCmd == 'string';
  let error = false;
  let pkgsToPublish;
  let registry;
  let project;
  try {
    // get list of packages that need publish and version them all temporarily.
    pkgsToPublish = await versionPkgs();
    // spin up verdaccio
    registry = await startRegistry();
    // publish packages to verdaccio
    const publishedPkgs = await publishPkgs(pkgsToPublish, registry.url);
    if (!publishedPkgs.length) {
      throw new Error(`no packages were published!`);
    }
    // install published packages in a test project.
    project = await installPublishedPkgs(publishedPkgs, registry.url);
    if (!shouldOpen) {
      // run smoke tests for each package.
      await testInstalledPackages(pkgsToPublish, project);
    }
  } catch (e) {
    error = e;
  } finally {
    // stop the verdaccio server
    if (registry && (error || !shouldOpen)) {
      await registry.stop();
      report.info('Verdaccio server stopped!');
    }
    if (project && (error || !shouldOpen)) {
      await project.cleanup();
      report.info('Test project cleaned!');
    }
    if (pkgsToPublish) {
      // roll back the version commit
      await rollbackVersions(pkgsToPublish);
    }

    if (!error && shouldOpen && project && registry) {
      report.info(`local registry available at ${registry.url}`);
      report.info(`opening test project at ${project.path}`);
      execSync(`${openCmd} ${project.path}`);
    }
  }
  if (error) throw error;
  return pkgsToPublish;
}

// If this is module is being run as a script,
// then invoke the testPublish function.
// @ts-ignore
if (typeof require !== 'undefined' && require.main === module) {
  const open = process.argv.includes('--open')
    ? process.argv[process.argv.indexOf('--open') + 1] || 'code'
    : false;
  testPublish({open})
    .then(pkgs => {
      if (!pkgs) {
        report.warn('No packages were checked?');
      } else {
        report.success('Good to go!');
      }
    })
    .catch(err => {
      report.error((err.stack && err.stack) || err);
      process.exit(1);
    });
}
