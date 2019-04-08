#! /usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const rimraf = require('rimraf');
const report = require('yurnalist');
const babel = require('@babel/core');
const project = require('@lerna/project');
const {rollup} = require('rollup');
const uglify = require('rollup-plugin-uglify-es');
const rollupConfig = require('../rollup.config');

const PROJECT_ROOT = process.cwd();
const SRC_GLOB = '**/*.js';
const EXCLUDE_GLOBS = [
  '**/@(__tests__|tests|examples|docs)/**/*',
  '**/*_test.js',
];

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

const writeFile = (filename, data, options) =>
  new Promise((resolve, reject) => {
    fs.writeFile(filename, data, {encoding: 'utf8', ...options}, err => {
      if (err) reject(err);
      else resolve();
    });
  });

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

const buildBundle = async ({meta, src, dir}, env) => {
  const dist = path.join(dir, 'umd');
  await rmdir(dist);
  await mkdir(dist);

  const dev = env !== 'production';
  const {output, ...config} = rollupConfig;
  const bundle = await rollup({
    ...config,
    input: path.resolve(src, 'index.js'),
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
    file: path.join(dist, `${name}.${dev ? 'js' : 'min.js'}`),
  });
};

const buildBundles = pkg =>
  Promise.all([
    buildBundle(pkg, 'development'),
    buildBundle(pkg, 'production'),
  ]);

const buildPackage = async (pkg, activity) => {
  if (pkg.meta.private) {
    report.info(`[${pkg.meta.name}] is private! Skipping build step ...`);
  } else if (fs.existsSync(pkg.src)) {
    try {
      activity.tick(`[${pkg.meta.name}] Building modules ...`);
      await buildModules(pkg);
      activity.tick(`[${pkg.meta.name}] Building UMD bundles ...`);
      await buildBundles(pkg);
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

const buildPackages = () =>
  project
    .getPackages(PROJECT_ROOT)
    .then(workspaces =>
      // Queue up a package build for each workspace.
      workspaces
        .map(pkg => ({
          dir: pkg.location,
          meta: pkg,
          name: pkg.name,
          src: path.join(pkg.location, 'src'),
        }))
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
        ),
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
