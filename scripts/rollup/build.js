/* eslint-disable no-console */
const Packages = require('./packages');
const {rollup} = require('rollup');
const babel = require('rollup-plugin-babel');

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
        console.log('Bundle', pkg.name, 'is complete');
      })
      .catch(response => {
        console.log('There was an error with rollup \n', response);
      });
  } catch (error) {
    console.log('There was an error! \n', error);
  }
};

const buildPackage = pkg => {
  createBundle(pkg);
};

const buildPackages = () => {
  for (const pkg of Packages.packages) {
    buildPackage(pkg);
  }
};

buildPackages();
