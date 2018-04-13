/* eslint-disable no-console, no-process-exit */
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const report = require('yurnalist');
const babel = require('@babel/core');
const {rollup} = require('rollup');
const {uglify} = require('rollup-plugin-uglify');
const rollupConfig = require('../rollup.config');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PROJECT_DIST_DIRECTORY = path.resolve(PROJECT_ROOT, 'build', 'dist');
const WORKSPACES = require(path.join(PROJECT_ROOT, 'package.json')).workspaces;
const PACKAGE_FILES = ['package.json', 'LICENSE'];
const SRC_GLOB = '**/*.js';
const EXT_RE = /\..+$/;
const EXTENSIONS = {
  es: '.js',
  cjs: '.cjs.js',
};

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

const transformFile = (filename, options) =>
  new Promise((resolve, reject) => {
    try {
      babel.transformFile(
        filename,
        {
          envName: 'es',
          extends: path.resolve('.babelrc'),
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

const writeFile = (filename, data, options) =>
  new Promise((resolve, reject) => {
    fs.writeFile(filename, data, {encoding: 'utf8', ...options}, err => {
      if (err) reject(err);
      else resolve();
    });
  });

const buildModule = (filename, src, dist, format) =>
  transformFile(filename, {envName: format}).then(({code}) =>
    writeFile(
      path.join(
        dist,
        path.dirname(path.relative(src, filename)),
        path.basename(filename).replace(EXT_RE, EXTENSIONS[format]),
      ),
      code,
    ),
  );

const buildModules = ({dist, src}) =>
  Promise.all(
    glob
      .sync(path.join(src, SRC_GLOB))
      .map(input =>
        Promise.all([
          buildModule(input, src, dist, 'es'),
          buildModule(input, src, dist, 'cjs'),
        ]),
      ),
  );

const copyFile = (filename, dir, dist) =>
  new Promise((resolve, reject) => {
    try {
      fs.copyFile(
        path.join(dir, filename),
        path.join(dist, filename),
        error => {
          if (error) reject(error);
          else resolve();
        },
      );
    } catch (e) {
      reject(e);
    }
  });

const copyPackageFiles = ({meta, dir, dist}) =>
  Promise.all(
    PACKAGE_FILES.map(async filename => {
      try {
        await copyFile(filename, dir, dist);
      } catch (error) {
        if (error.code === 'ENOENT') {
          report.warn(`[${meta.name}] ${filename} does not exist. Skipping.`);
        } else {
          throw error;
        }
      }
    }),
  );

const buildBundle = async ({meta, src, dist}, env) => {
  const dev = env !== 'production';
  const {output, ...config} = rollupConfig;
  const bundle = await rollup({
    ...config,
    input: path.join(src, meta.module),
    external: [
      ...Object.keys(output.globals),
      ...Object.keys(meta.devDependencies || {}),
      ...Object.keys(meta.peerDependencies || {}),
    ],
    plugins: [...rollupConfig.plugins, ...(dev ? [] : [uglify()])],
  });

  const name = meta.name.replace(/@.+\/(.+)/, `hzcore-$1`);

  await bundle.write({
    ...output,
    name,
    file: path.join(dist, `${name}.umd.${dev ? 'js' : 'min.js'}`),
  });
};

const buildBundles = pkg =>
  Promise.all([
    buildBundle(pkg, 'development'),
    buildBundle(pkg, 'production'),
  ]);

const buildPackage = async (pkg, activity) => {
  try {
    activity.tick(`[${pkg.meta.name}] Copying package files ...`);
    await mkdir(pkg.dist);
    await copyPackageFiles(pkg);
    activity.tick(`[${pkg.meta.name}] Building modules ...`);
    await buildModules(pkg);
    activity.tick(`[${pkg.meta.name}] Building UMD bundles ...`);
    await buildBundles(pkg);
  } catch (error) {
    report.error(`[${pkg.meta.name}] There was an error!`);
    throw error;
  }
};

const buildPackages = () =>
  WORKSPACES
    // Find all of the package.json files in package workspaces.
    .reduce(
      (matches, pattern) =>
        matches.concat(
          glob.sync(path.join(PROJECT_ROOT, pattern, 'package.json')),
        ),
      [],
    )
    // Append any information needed for each package.
    .map(pkg => {
      const meta = require(pkg); // eslint-disable-line global-require
      const dir = path.dirname(pkg);
      const name = path.basename(dir);
      const dist = path.join(PROJECT_DIST_DIRECTORY, name);
      const src = path.join(dir, 'src');
      return {
        meta,
        dir,
        dist,
        src,
      };
    })
    // Queue up a package build for each workspace.
    .reduce(
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
    )
    .then(() => {
      report.success('All packages built!');
    })
    .catch(err => {
      report.error((err.stack && err.stack) || err);
      process.exit(1);
    });

module.exports = buildPackages;


// If this is module is being run as a script, invoke the build function.
if (typeof require !== 'undefined' && require.main === module) {
  buildPackages();
}
