/* eslint-disable no-console */
const Packages = require('./packages');
const {rollup} = require('rollup');
const {ncp} = require('ncp');
const babel = require('rollup-plugin-babel');
const path = require('path');

const createBundle = pkg => {
  // TODO: Set conditional to skip bundle if needed

  const rollupConfig = {
    input: pkg.bundleInput,
    output: pkg.bundleOutput,
    plugins: [
      babel({
        exclude: 'node_modules/**',
      }),
    ],
  };

  try {
    rollup(rollupConfig)
      .then(response => {
        response.write(pkg.bundleOutput);
        console.log('Bundle', pkg.packageName, 'is complete');
      })
      .catch(response => {
        console.log('There was an error with rollup \n', response);
      });
  } catch (error) {
    console.log('There was an error! \n', error);
  }
};

const copyPackageFiles = ({packageDirectory, packageDistDirectory}) => {
  console.log(packageDirectory, packageDistDirectory);
  const filesToCopy = ['package.json', 'LICENSE', 'Makefile'];

  for (const fileName of filesToCopy) {
    ncp(
      path.join(packageDirectory, fileName),
      path.join(packageDistDirectory, fileName),
      error => {
        if (error) {
          if (error[0].code === 'ENOENT') {
            console.log(error[0].path, 'does not exist. Skipping.');
          } else {
            console.error(error);
          }
        }
      },
    );
  }
};

const buildPackage = pkg => {
  createBundle(pkg);
  copyPackageFiles(pkg);
};

const buildPackages = () => {
  for (const pkg of Packages.packages) {
    buildPackage(pkg);
  }
};

buildPackages();
