#! /usr/bin/env node
// @ts-check
const {promisify} = require('util');
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const retry = require('async-retry');
const babel = require('@babel/core');
const chalk = require('chalk').default;
const yargs = require('yargs');
// @ts-ignore
const report = require('yurnalist');
// @ts-ignore
const project = require('@lerna/project');

const rmdir = promisify(require('rimraf'));
const mkdir = promisify(require('mkdirp'));
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

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
 * @typedef {Object} BuildOptions
 * @property {Boolean | undefined} [version]
 * @property {Boolean | undefined} [clean]
 * @property {Boolean | undefined} [force]
 * @property {Boolean | undefined} [verbose]
 * @property {Boolean | undefined} [help]
 */

class ActivityReporter {
  /** @param {Activity} activity */
  constructor(activity) {
    this._activity = activity;
  }
  /**
   * @param {'built' | 'skipped' | 'cleaned'} result
   * @param {string} [reason]
   */
  _report(result, reason) {
    if (this._activity._result) {
      throw new Error(`Activity already ${this._activity._result}`);
    }
    this._activity._result = result;
    if (reason) this._activity._reason = reason;
  }
  /** @param {string} [reason] */
  skip(reason) {
    this._report('skipped', reason);
  }
  /** @param {string} [reason] */
  build(reason) {
    this._report('built', reason);
  }
  /** @param {string} [reason] */
  clean(reason) {
    this._report('cleaned', reason);
  }
}

class Activity {
  /** @param {string} name */
  constructor(name) {
    this._name = name;
    /** @type {'built' | 'skipped' | 'cleaned' | null} */
    this._result = null;
    /** @type {string | undefined} */
    this._reason;
  }
  start() {
    return new ActivityReporter(this);
  }
}

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
 * @param {string} filename
 * @param {string} format
 * @returns {Promise<string | undefined>}
 */
const isStale = async (pkg, filename, format) => {
  const dist = path.join(pkg.dir, format);
  const basename = path.basename(filename).replace(/\.(?:j|t)sx?$/, '.js');
  const filepath = path.join(
    dist,
    path.dirname(path.relative(pkg.src, filename)),
    basename,
  );
  const srcStat = await stat(filename);
  const pkgStat = await stat(path.join(pkg.dir, 'package.json'));
  // Reasons src should be considered stale:
  try {
    // ...if it is newer than the output file
    const destStat = await stat(filepath);
    if (destStat.mtime <= srcStat.mtime) {
      return `${path.basename(filepath)} outdated!`;
    }
    // ...if the associated package.json is newer than the output file
    if (destStat.mtime <= pkgStat.mtime) {
      return `package.json updated!`;
    }
  } catch {
    return `${path.basename(filepath)} outdated!`;
  }

  try {
    // ...if it is newer than the output sourcemap
    const mapStat = await stat(`${filepath}.map`);
    if (mapStat.mtime <= srcStat.mtime) {
      return `${path.basename(`${filepath}.map`)} outdated!`;
    }
    // ...if the associated package.json is newer than the output sourcemap
    if (mapStat.mtime <= pkgStat.mtime) {
      return `package.json updated!`;
    }
  } catch {
    return `${path.basename(`${filepath}.map`)} outdated!`;
  }

  // we got this far, so maybe it's safe to assume the build
  // is up-to-date for this file.
  return;
};

/**
 * @param {Pkg} pkg
 * @returns {Promise<string | undefined>}
 */
const needsBuild = async pkg =>
  (await Promise.all(
    glob
      .sync(path.join(pkg.src, SRC_GLOB), {ignore: EXCLUDE_GLOBS})
      .map(async input =>
        (await Promise.all([
          isStale(pkg, input, 'es'),
          isStale(pkg, input, 'cjs'),
        ])).find(Boolean),
      ),
  )).find(Boolean);

/**
 * @param {Pkg} pkg
 * @param {ActivityReporter} activity
 * @param {boolean} [force]
 * @returns {Promise<void>}
 */
const buildPackage = async (pkg, activity, force) => {
  if (pkg.meta.private) {
    activity.skip('package is private!');
  } else if (fs.existsSync(pkg.src)) {
    let stale;
    if (!force) {
      stale = await needsBuild(pkg);
    }
    if (force || stale) {
      try {
        await buildModules(pkg);
      } catch (error) {
        report.error(`[${pkg.meta.name}] There was an error!`);
        throw error;
      }
      activity.build(!force ? stale : undefined);
    } else {
      activity.skip('up to date!');
    }
  } else {
    activity.skip('no src dir found!');
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
 * @param {boolean} [force]
 * @returns {Promise<Activity[]>}
 */
const buildPackages = (workspaces, force) => {
  /** @type Promise<Activity[]> */
  let buildQueue = Promise.resolve([]);
  const tick = report.progress(workspaces.length);
  // Queue up a package build for each workspace.
  workspaces.forEach(workspace => {
    const pkg = workspaceToPackage(workspace);
    buildQueue = buildQueue.then(activities => {
      /** @type Activity */
      const activity = new Activity(pkg.name);
      activities.push(activity);
      return buildPackage(pkg, activity.start(), force)
        .then(() => {
          tick();
          return activities;
        })
        .catch(err => {
          throw err;
        });
    });
  });
  return buildQueue;
};

/**
 * @param {Pkg} pkg
 * @param {ActivityReporter} activity
 * @returns {Promise<void>}
 */
const cleanPackage = async (pkg, activity) => {
  try {
    await rmdir(path.join(pkg.dir, 'es'));
    await rmdir(path.join(pkg.dir, 'cjs'));
    await rmdir(path.join(pkg.dir, 'umd'));
    activity.clean();
  } catch (error) {
    report.error(`[${pkg.meta.name}] There was an error!`);
    throw error;
  }
};

/**
 * @param {Workspace[]} workspaces
 * @returns {Promise<Activity[]>}
 */
const cleanPackages = workspaces => {
  /** @type Promise<Activity[]> */
  let cleanQueue = Promise.resolve([]);
  const tick = report.progress(workspaces.length);
  // Queue up a package clean for each workspace.
  workspaces.forEach(workspace => {
    const pkg = workspaceToPackage(workspace);
    cleanQueue = cleanQueue.then(activities => {
      const activity = new Activity(pkg.name);
      activities.push(activity);
      return cleanPackage(pkg, activity.start())
        .then(() => {
          tick();
          return activities;
        })
        .catch(err => {
          throw err;
        });
    });
  });
  return cleanQueue;
};

/**
 *
 * @param {BuildOptions} [options]
 * @returns {Promise<void | Activity[]>}
 */
async function build(options) {
  const packages = await project.getPackages(PROJECT_ROOT);
  if (options && options.clean) {
    return cleanPackages(packages);
  } else {
    return buildPackages(packages, options && options.force);
  }
}

module.exports = build;

// If this is module is being run as a script, invoke the build function.
// @ts-ignore
if (typeof require !== 'undefined' && require.main === module) {
  const options = yargs
    .usage(
      '\nBuilds all public packages found in workspaces.\n\n' +
        'If the --clean option is specified, removes artifacts\n' +
        'from a previous build instead of building.',
    )
    .example('$0 --clean', 'Clean up previous build artifacts')
    .example('$0 --verbose', 'Find out why packages are being skipped')
    .example('$0 --force', 'Force all packages to rebuild')
    .alias('help', 'h')
    .option('clean', {
      alias: 'c',
      description: 'Clean up build artifacts in all packages',
      boolean: true,
    })
    .option('force', {
      alias: 'f',
      description: 'Force a build of all packages',
      boolean: true,
      conflicts: 'clean',
    })
    .option('verbose', {
      alias: 'v',
      description: 'Show more info about a build',
      boolean: true,
    }).argv;

  const {clean, force, verbose} = options;

  build({clean, force})
    .then(activities => {
      let skipped = 0;
      let built = 0;
      let cleaned = 0;
      if (Array.isArray(activities)) {
        activities.forEach(activity => {
          if (activity._result) {
            switch (activity._result) {
              case 'skipped':
                skipped += 1;
                break;
              case 'built':
                built += 1;
                break;
              case 'cleaned':
                cleaned += 1;
                break;
            }
            if (verbose) {
              report.log(
                `${chalk[activity._result === 'built' ? 'green' : 'yellow'](
                  activity._result,
                )} ${activity._name}${
                  activity._reason ? ` ${chalk.dim(activity._reason)}` : ''
                }`,
              );
            }
          }
        });
      }
      if (!verbose && skipped) {
        report.log(
          `${chalk.yellow('skipped')} ${skipped} package${
            skipped > 1 ? 's' : ''
          }! ${chalk.dim('(use --verbose to see why)')}`,
        );
      }
      if (cleaned) {
        report.success(`cleaned ${cleaned} package${cleaned > 1 ? 's' : ''}!`);
      } else if (built) {
        report.success(`built ${built} package${built > 1 ? 's' : ''}!`);
      } else {
        report.success(`packages already built!`);
      }
    })
    .catch(err => {
      report.error((err.stack && err.stack) || err);
      process.exit(1);
    });
}
