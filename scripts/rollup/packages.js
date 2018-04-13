const path = require('path');
const glob = require('glob');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const PROJECT_DIST_DIRECTORY = path.resolve(PROJECT_ROOT, 'build', 'dist');

const {workspaces} = require(path.join(PROJECT_ROOT, 'package.json'));

const packages = workspaces
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
    const packageDirectory = path.dirname(pkg);
    const packageName = path.basename(packageDirectory);
    const packageDistDirectory = path.join(PROJECT_DIST_DIRECTORY, packageName);
    return {
      packageName,
      packageDirectory,
      packageDistDirectory,
      bundleInput: pkg,
      bundleOutput: {
        file: path.join(packageDistDirectory, 'index.js'),
        format: 'cjs',
      },
    };
  });

module.exports = {packages};
