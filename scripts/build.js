#! /usr/bin/env node
// @ts-check
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const rimraf = require('rimraf');
// @ts-ignore
const report = require('yurnalist');
const babel = require('@babel/core');
// @ts-ignore
const project = require('@lerna/project');

const PROJECT_ROOT = process.cwd();
const SRC_GLOB = '**/*.js';
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
 */
const rmdir = dirpath =>
  new Promise((resolve, reject) => {
    rimraf(dirpath, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

/**
 * @param {string} dirpath
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
 * @param {string} filename
 * @param {string | Buffer} data
 * @param {Object} [options]
 */
const writeFile = (filename, data, options) =>
  new Promise((resolve, reject) => {
    fs.writeFile(filename, data, {encoding: 'utf8', ...options}, err => {
      if (err) reject(err);
      else resolve();
    });
  });

/**
 * @param {string} filename
 * @param {string} src
 * @param {string} dir
 * @param {string} format
 */
const buildModule = async (filename, src, dir, format) => {
  const dist = path.join(dir, format);
  await rmdir(dist);
  await mkdir(dist);
  let {code, map} = await transformFile(filename, {envName: format});
  const basename = path.basename(filename);
  const filepath = path.join(
    dist,
    path.dirname(path.relative(src, filename)),
    basename,
  );
  code = `${code}\n//# sourceMappingURL=${basename}.map`;
  map.file = basename;
  await writeFile(`${filepath}.map`, JSON.stringify(map));
  await writeFile(filepath, code);
};

/**
 * @param {Pkg} pkg
 */
const buildModules = ({dir, src}) =>
  Promise.all(
    glob
      .sync(path.join(src, SRC_GLOB), {ignore: EXCLUDE_GLOBS})
      .map(input =>
        Promise.all([
          buildModule(input, src, dir, 'es'),
          buildModule(input, src, dir, 'cjs'),
        ]),
      ),
  );

/**
 * @param {Pkg} pkg
 * @param {Object} activity
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
 * @returns {Promise}
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

const build = () => project.getPackages(PROJECT_ROOT).then(buildPackages);

module.exports = build;

// If this is module is being run as a script, invoke the build function.
// @ts-ignore
if (typeof require !== 'undefined' && require.main === module) {
  build()
    .then(() => {
      report.success('All packages built!');
    })
    // @ts-ignore
    .catch(err => {
      report.error((err.stack && err.stack) || err);
      process.exit(1);
    });
}
