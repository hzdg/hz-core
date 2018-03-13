const {readdirSync} = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const PROJECT_DIST_DIRECTORY = path.resolve(PROJECT_ROOT, 'build', 'dist');
const PACKAGE_DIRECTORY = path.resolve(PROJECT_ROOT, 'packages');

// Append any information needed for each package
const gatherPackages = () => {
  const packageList = readdirSync(PACKAGE_DIRECTORY);
  const packageListObject = packageList.map(packageName => ({
    name: packageName,
    bundleInput: path.join(PACKAGE_DIRECTORY, packageName, 'src', 'index.js'),
    bundleOutput: {
      file: path.join(PROJECT_DIST_DIRECTORY, packageName, 'index.js'),
      format: 'cjs',
    },
  }));

  return packageListObject;
};

module.exports = {
  packages: gatherPackages(),
};
