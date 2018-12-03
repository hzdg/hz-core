#! /usr/bin/env node
/* eslint-env node */
const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');
const glob = require('glob');
const chokidar = require('chokidar');
const report = require('yurnalist');
const yargs = require('yargs');

const HOME_DIR = require('os').homedir();

const PATHS_TO_SYNC = [
  'code',
  'design',
  'metadata',
  'node_modules',
  'package.json',
  'README.md',
  'tsconfig.json',
  'yarn.lock',
];

const FRAMERX_CONTAINER_DIRNAME = 'container';

const CWD = process.cwd();

const PROJECT_FILENAME = 'wireframe-ui-kit.framerx';

const PROJECT_ALIAS = `--- ${PROJECT_FILENAME} ---`;

// TODO: drill to find project?
// We might want to so we can run this script from repo root, for example.
const SRC_DIR = path.dirname(path.resolve(CWD, PROJECT_FILENAME));

const PROJECT_FILEPATH = fs.realpathSync(
  path.resolve(SRC_DIR, PROJECT_FILENAME),
);

const AUTOSAVE_DIR = path.resolve(HOME_DIR, 'Library/Autosave Information/');

const AUTOSAVE_PATTERN = path.join(AUTOSAVE_DIR, 'Framer-*/');

function shortpath(filepath, isDir) {
  if (!isDir && isDir !== false) {
    isDir = !path.basename(filepath).match(/\.[^/.]+$/);
  }
  if (filepath.includes(AUTOSAVE_DIR)) {
    return `${path.relative(AUTOSAVE_DIR, filepath)}${isDir ? '/' : ''}`;
  }
  return `${path.relative(path.dirname(SRC_DIR), filepath)}${isDir ? '/' : ''}`;
}

function getOriginalPath(aliasPath) {
  const script = path.resolve(__dirname, 'originalPath.applescript');
  return execSync(`osascript "${script}" "${aliasPath}"`)
    .toString()
    .split(/(?:\r\n|\r|\n)/g)
    .shift();
}

function withMethods(base, methods) {
  return Object.create(
    base,
    Object.keys(methods).reduce((descriptors, methodName) => {
      descriptors[methodName] = {
        configurable: true,
        enumerable: true,
        writable: true,
        value: methods[methodName],
      };
      return descriptors;
    }, {}),
  );
}

const activity = (description, opts = {quiet: false, verbose: false}) => {
  const reporter = report.createReporter({
    verbose: opts.verbose,
    isSlient: opts.quiet,
  });

  let task = reporter.activity(description);

  return withMethods(reporter, {
    info(msg) {
      reporter.info(msg);
      if (task) task.tick(msg);
    },
    success(msg) {
      reporter.success(msg);
      if (task) {
        task.end();
        task = null;
      }
    },
    error(error) {
      reporter.error(error);
      if (task) {
        task.end();
        task = null;
      }
    },
    // eslint-disable-next-line no-underscore-dangle
    _crud(action, color, srcPath, destPath, isDir) {
      if (this.isSlient) return;
      const msg = `${shortpath(srcPath, isDir)} => ${shortpath(
        destPath,
        isDir,
      )}`;
      if (task) {
        task.tick(`${action} ${msg}`);
      }
      if (this.isVerbose || !task) {
        // eslint-disable-next-line no-underscore-dangle
        reporter._logCategory(action, color, msg);
      }
    },
    add(srcPath, destPath, isDir) {
      // eslint-disable-next-line no-underscore-dangle
      this._crud('add', 'green', srcPath, destPath, isDir);
    },
    update(srcPath, destPath, isDir) {
      // eslint-disable-next-line no-underscore-dangle
      this._crud('update', 'yellow', srcPath, destPath, isDir);
    },
    delete(srcPath, destPath, isDir) {
      // eslint-disable-next-line no-underscore-dangle
      this._crud('delete', 'red', srcPath, destPath, isDir);
    },
  });
};

async function getSrcPath(opts) {
  const reporter = activity('Finding source', opts);
  reporter.success(`Found ${shortpath(SRC_DIR)}`);
  return SRC_DIR;
}

async function getFramerXContainerPath(opts) {
  const reporter = activity('Finding Framerx Container', opts);
  const match = glob
    .sync(AUTOSAVE_PATTERN)
    .reduce((matches, candidate) => {
      const alias = path.resolve(candidate, PROJECT_ALIAS);
      if (fs.existsSync(alias) && getOriginalPath(alias) === PROJECT_FILEPATH) {
        matches.push({
          filepath: candidate,
          mtime: fs.statSync(candidate).mtime.getTime(),
        });
      }
      return matches;
    }, [])
    .sort((a, b) => a.mtime - b.mtime)
    .pop();

  if (match && match.filepath) {
    const destDir = path.join(match.filepath, FRAMERX_CONTAINER_DIRNAME);
    if (fs.existsSync(destDir)) {
      reporter.success(`Found FramerX container ${shortpath(destDir)}`);
      return destDir;
    }
  }
  const error = new Error(
    `Could not find a FramerX container to sync! Did you open ${PROJECT_FILENAME}?`,
  );
  reporter.error(error.message);
  throw error;
}

function watch(patternsToWatch, srcDir, destDir, opts) {
  const reporter = activity(`indexing ${shortpath(srcDir)}`, opts);
  const sourcePaths = patternsToWatch.map(fp => path.join(srcDir, fp));
  return new Promise((resolve, reject) => {
    const watchOptions = {alwaysStat: true, usePolling: true};
    const watcher = chokidar.watch(sourcePaths, watchOptions);

    watcher.on('all', (event, srcPath, srcStat) => {
      const destPath = srcPath.replace(srcDir, destDir);

      switch (event) {
        case 'add':
        case 'addDir': {
          if (fs.existsSync(destPath)) {
            const destStat = fs.statSync(destPath);
            if (srcStat.mtime.getTime() > destStat.mtime.getTime()) {
              fs.copyFileSync(srcPath, destPath);
              reporter.update(srcPath, destPath);
            }
          } else {
            fs.copyFileSync(srcPath, destPath);
            reporter.add(srcPath, destPath);
          }
          break;
        }

        case 'change': {
          const destStat = fs.statSync(destPath);
          if (destStat.size !== srcStat.size) {
            const srcData = fs.readFileSync(srcPath, 'utf8');
            fs.writeFileSync(destPath, srcData);
            reporter.update(srcPath, destPath);
          }
          break;
        }

        case 'unlink':
        case 'unlinkDir': {
          if (fs.existsSync(destPath)) {
            fs.unlinkSync(destPath);
            reporter.delete(srcPath, destPath);
          }
          break;
        }

        default: {
          reporter.warn(`${event} ${shortpath(srcPath)}`);
        }
      }
    });

    watcher.on('error', error => {
      reporter.error(error);
      reject(error);
    });

    watcher.on('ready', () => {
      reporter.success(`Indexed ${shortpath(srcDir)}`);
      resolve(watcher);
    });
  });
}

async function sync(opts = {watch: false, quiet: true, verbose: false}) {
  const srcDir = await getSrcPath(opts);
  const destDir = await getFramerXContainerPath(opts);

  const srcWatcher = await watch(PATHS_TO_SYNC, srcDir, destDir, opts);
  const destWatcher = await watch(PATHS_TO_SYNC, destDir, srcDir, opts);

  if (opts.watch) {
    if (!opts.quiet) {
      report.info(`watching ${shortpath(srcDir)} <=> ${shortpath(destDir)}`);
    }
  } else {
    srcWatcher.close();
    destWatcher.close();
  }
}

module.exports = sync;

// If this is module is being run as a script,
// process options from argv and invoke the sync function.
if (typeof require !== 'undefined' && require.main === module) {
  const opts = yargs()
    .usage('Usage: $0 [options]')
    .option('verbose', {
      default: false,
      type: 'boolean',
      describe: 'Turn on verbose output',
    })
    .option('quiet', {
      default: false,
      type: 'boolean',
      describe: 'Disable output entirely',
    })
    .option('watch', {
      default: false,
      type: 'boolean',
      describe: 'Turn on watch mode',
    })
    .alias('h', 'help')
    .alias('v', 'verbose')
    .alias('q', 'quiet')
    .alias('w', 'watch')
    .strict()
    .parse(process.argv);

  sync(opts).catch(e => {
    // eslint-disable-next-line no-console
    console.error(e);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  });
}
