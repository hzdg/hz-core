#! /usr/bin/env node
// @ts-check
const {promisify} = require('util');
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const rimraf = require('rimraf');
// @ts-ignore
const report = require('yurnalist');
const babel = require('@babel/core');
// @ts-ignore
const project = require('@lerna/project');

const rmdir = promisify(rimraf);
const writeFile = promisify(fs.writeFile);

const PROJECT_ROOT = process.cwd();
const SRC_GLOB = '**/*.{ts,tsx,js,jsx}';
const EXCLUDE_GLOBS = [
  '**/@(__tests__|tests|examples|docs)/**/*',
  '**/*_test.js',
];

/**
 * @typedef {Object} Workspace
 * @property {string} name
 * @property {string} location
 * @property {Object[]} [devDependencies]
 * @property {Object[]} [peerDependencies]
 * @property {Boolean} [private]
 */

/**
 * @typedef {Object} Pkg
 * @property {Workspace} meta
 * @property {string} name
 * @property {string} dir
 * @property {string} src
 */

/**
 * @param {string} dirpath
 * @returns {Promise<void>}
 */
const mkdir = dirpath =>
  new Promise((resolve, reject) => {
    fs.mkdir(dirpath, err => {
      if (err) {
        if (err.code === 'EEXIST') {
          resolve();
        } else if (err.code === 'ENOENT') {
          // Make the parent path, then try again.
          mkdir(path.dirname(dirpath)).then(
            () => mkdir(dirpath).then(resolve, reject),
            reject,
          );
        } else {
          reject(err);
        }
      } else {
        resolve();
      }
    });
  });

/**
 * @param {string} filename
 * @param {Object} [options]
 * @returns {Promise<babel.BabelFileResult | null>}
 */
const transformFile = (filename, options) =>
  new Promise((resolve, reject) => {
    try {
      babel.transformFile(
        filename,
        {
          envName: 'es',
          extends: path.resolve('babel.config.js'),
          ...options,
        },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        },
      );
    } catch (e) {
      reject(e);
    }
  });

/**
 *
 * @param {string} code
 */
const hasExports = code => Boolean(code) && /export/.test(code);

/**
 * @param {Pkg} pkg
 * @param {string} filename
 * @param {string} format
 * @returns {Promise<void>}
 */
const buildModule = async (pkg, filename, format) => {
  const dist = path.join(pkg.dir, format);
  await rmdir(dist);
  await mkdir(dist);
  const result = await transformFile(filename, {envName: format});
  if (!result) {
    throw new Error(`Could not transform file ${filename}`);
  }
  let {code, map} = result;
  if (!code || !hasExports(code)) {
    report.info(
      `[${pkg.meta.name}] ${path.relative(
        pkg.src,
        filename,
      )} has no exports! Skipping ${format} module ...`,
    );
    return;
  }
  if (!map) throw new Error(`No sourcemap found in transform of ${filename}`);
  const basename = path.basename(filename);
  const filepath = path.join(
    dist,
    path.dirname(path.relative(pkg.src, filename)),
    basename,
  );
  code = `${code}\n//# sourceMappingURL=${basename}.map`;
  map.file = basename;
  await writeFile(`${filepath}.map`, JSON.stringify(map));
  await writeFile(filepath, code);
};

/**
 * @param {Pkg} pkg
 * @returns {Promise<[void, void][]>}
 */
const buildModules = pkg =>
  Promise.all(
    glob
      .sync(path.join(pkg.src, SRC_GLOB), {ignore: EXCLUDE_GLOBS})
      .map(input =>
        Promise.all([
          buildModule(pkg, input, 'es'),
          buildModule(pkg, input, 'cjs'),
        ]),
      ),
  );

/**
 * @param {Pkg} pkg
 * @param {Object} activity
 * @returns {Promise<void>}
 */
const buildPackage = async (pkg, activity) => {
  if (pkg.meta.private) {
    report.info(`[${pkg.meta.name}] is private! Skipping build step ...`);
  } else if (fs.existsSync(pkg.src)) {
    try {
      activity.tick(`[${pkg.meta.name}] Building modules ...`);
      await buildModules(pkg);
    } catch (error) {
      report.error(`[${pkg.meta.name}] There was an error!`);
      throw error;
    }
  } else {
    report.info(
      `[${pkg.meta.name}] No src dir found! Assuming no build step ...`,
    );
  }
};

/**
 * @param {Workspace} workspace
 * @returns {Pkg}
 */
const workspaceToPackage = workspace => {
  return {
    dir: workspace.location,
    meta: workspace,
    name: workspace.name,
    src: path.join(workspace.location, 'src'),
  };
};

/**
 * @param {Workspace[]} workspaces
 * @returns {Promise<void>}
 */
const buildPackages = workspaces =>
  // Queue up a package build for each workspace.
  workspaces.map(workspaceToPackage).reduce(
    (buildQueue, pkg, step, {length: steps}) =>
      buildQueue.then(() => {
        report.step(step + 1, steps, `[${pkg.meta.name}]`);
        const activity = report.activity();
        return buildPackage(pkg, activity)
          .then(() => activity.end())
          .catch(err => {
            activity.end();
            throw err;
          });
      }),
    Promise.resolve(),
  );

/**
 * @param {Pkg} pkg
 * @param {Object} activity
 * @returns {Promise<void>}
 */
const cleanPackage = async (pkg, activity) => {
  try {
    activity.tick(`[${pkg.meta.name}] Cleaning modules ...`);
    await rmdir(path.join(pkg.dir, 'es'));
    await rmdir(path.join(pkg.dir, 'cjs'));
    await rmdir(path.join(pkg.dir, 'umd'));
  } catch (error) {
    report.error(`[${pkg.meta.name}] There was an error!`);
    throw error;
  }
};

/**
 * @param {Workspace[]} workspaces
 * @returns {Promise<void>}
 */
const cleanPackages = workspaces =>
  // Queue up a package clean for each workspace.
  workspaces.map(workspaceToPackage).reduce(
    (cleanQueue, pkg, step, {length: steps}) =>
      cleanQueue.then(() => {
        report.step(step + 1, steps, `[${pkg.meta.name}]`);
        const activity = report.activity();
        return cleanPackage(pkg, activity)
          .then(() => activity.end())
          .catch(err => {
            activity.end();
            throw err;
          });
      }),
    Promise.resolve(),
  );

/**
 *
 * @param {Object} [options]
 * @param {Boolean} options.clean
 * @returns {Promise<void>}
 */
async function build(options) {
  const packages = await project.getPackages(PROJECT_ROOT);
  if (options && options.clean) {
    return cleanPackages(packages);
  } else {
    return buildPackages(packages);
  }
}

module.exports = build;

// If this is module is being run as a script, invoke the build function.
// @ts-ignore
if (typeof require !== 'undefined' && require.main === module) {
  const clean = process.argv.includes('--clean');
  build({clean})
    .then(() => {
      report.success(`All packages ${clean ? 'clean' : 'built'}!`);
    })
    // @ts-ignore
    .catch(err => {
      report.error((err.stack && err.stack) || err);
      process.exit(1);
    });
}
