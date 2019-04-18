#! /usr/bin/env node
// @ts-check
const {execSync, spawn} = require('child_process');
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
  const source = spawn(command, args, {
    stdio: ['ignore', process.stdout, process.stderr],
    ...options,
  });
  return onExit(source);
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
  return pkgsToPublish;
}

async function getBranch() {
  return execSync(`git rev-parse --abbrev-ref HEAD`).toString(); // TODO: Remove this?
}

/**
 * @returns {Promise<Record<string, Pkg>>}
 */
async function versionPkgs() {
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
  const pkgsToPublish = await collectPkgsToPublish();
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
 *
 * @param {string} packagePath
 * @returns {Promise<() => Promise<void>>}
 */
async function createTemporaryNodePackage(packagePath) {
  const spinner = report.activity();
  spinner.tick(`creating temporary node package`);
  await mkdirp(packagePath);
  try {
    await run('yarn', ['init', '-y'], {cwd: packagePath});
  } catch (e) {
    await rmdir(packagePath);
    spinner.end();
    throw e;
  }
  spinner.end();
  report.success(`Created new package.json at ${packagePath}!`);
  return async () => {
    await rmdir(packagePath);
  };
}

/**
 * @param {Record<string, Pkg>} pkgs
 * @param {string} registry
 * @returns {Promise<void>}
 */
async function publishPkgs(pkgs, registry) {
  const spinner = report.activity();
  spinner.tick(`publishing packages`);
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
}

/**
 *
 * @param {Record<string, Pkg>} pkgs
 * @param {string} registry
 * @returns {Promise<void>}
 */
async function testPublishedPkgs(pkgs, registry) {
  const packagePath = path.join(os.tmpdir(), 'hzcore', 'test');
  const cleanup = await createTemporaryNodePackage(packagePath);
  const publishedPkgs = Object.values(pkgs).filter(pkg => !pkg.private);
  /** @type Set<string> */
  const pkgsToInstall = new Set();
  for (const pkg of publishedPkgs) {
    pkgsToInstall.add(`${pkg.name}@hzcore-dev`);
    for (const dep in pkg.peerDependencies) {
      pkgsToInstall.add(`${dep}@${pkg.peerDependencies[dep]}`);
    }
  }

  let error;
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
    await run(
      'jest',
      ['--testRegex', '.*/__tests__/publish_smoketest.(?:j|t)sx?$'],
      {
        env: {
          ...process.env,
          PACKAGE_INSTALL_PATH: JSON.stringify(packagePath),
          PACKAGES_TO_TEST: JSON.stringify(publishedPkgs),
        },
      },
    );
  } catch (e) {
    error = e;
  } finally {
    await cleanup();
  }
  if (error) {
    throw error;
  }
}

/**
 * @returns {Promise<Record<string, Pkg> | undefined>}
 */
async function testPublish() {
  let error = false;
  let pkgsToPublish;
  let registry;
  try {
    // get list of packages that need publish and version them all temporarily.
    pkgsToPublish = await versionPkgs();
    // spin up verdaccio
    registry = await startRegistry();
    // publish packages to verdaccio
    await publishPkgs(pkgsToPublish, registry.url);
    // run smoke tests for each package.
    await testPublishedPkgs(pkgsToPublish, registry.url);
  } catch (e) {
    error = e;
  } finally {
    // stop the verdaccio server
    if (registry) {
      await registry.stop();
      report.info('Verdaccio server stopped!');
    }
    // roll back the version commit
    if (pkgsToPublish) {
      await rollbackVersions(pkgsToPublish);
    }
  }
  if (error) throw error;
  return pkgsToPublish;
}

// If this is module is being run as a script,
// then invoke the testPublish function.
// @ts-ignore
if (typeof require !== 'undefined' && require.main === module) {
  testPublish()
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
