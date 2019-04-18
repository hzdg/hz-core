#! /usr/bin/env node
// @ts-check
const {promisify} = require('util');
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const retry = require('async-retry');
const babel = require('@babel/core');
// @ts-ignore
const report = require('yurnalist');
// @ts-ignore
const project = require('@lerna/project');

const rmdir = promisify(require('rimraf'));
const mkdir = promisify(require('mkdirp'));
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
  // HACK: Retry these fs ops a few times, cuz there are some
  // weird edge case race conditions that sometimes pop up.
  // It's a hack, i know, but, uh i also don't know.
  await retry(
    async () => {
      await rmdir(dist);
      await mkdir(dist);
    },
    {
      retries: 3,
    },
  );
  const result = await transformFile(filename, {envName: format});
  if (!result) {
    throw new Error(`Could not transform file ${filename}`);
  }
  let {code, map} = result;
  if (!map) throw new Error(`No sourcemap found in transform of ${filename}`);
  const basename = path.basename(filename).replace(/\.(?:j|t)sx?$/, '.js');
  const filepath = path.join(
    dist,
    path.dirname(path.relative(pkg.src, filename)),
    basename,
  );
  code = `${code}\n//# sourceMappingURL=${basename}.map`;
  map.file = basename;
  // HACK: Retry these fs ops a few times, cuz there are some
  // weird edge case race conditions that sometimes pop up.
  // It's a hack, i know, but, uh i also don't know.
  await retry(
    async () => {
      await writeFile(`${filepath}.map`, JSON.stringify(map));
      await writeFile(filepath, code);
    },
    {
      retries: 3,
    },
  );
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
