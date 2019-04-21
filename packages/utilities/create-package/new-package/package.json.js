// @ts-check

/**
 * @param {Object} options
 * @param {string} options.name
 */
const PACKAGE_JSON = options => `
{
  "name": "@hzcore/${options.name}",
  "version": "0.0.1",
  "main": "cjs/index.js",
  "module": "es/index.js",
  "typings": "src/index.tsx",
  "license": "MIT",
  "private": true,
  "publishConfig": {
    "registry": "http://npmregistry.hzdg.com"
  },
  "files": [
    "cjs",
    "es",
    "src",
    "!*/__test*"
  ]
}
`;

/**
 * @param {import("../scripts/create-package").Options} options
 * @returns {string}
 */
module.exports = function createPackageJson(options) {
  const name = options.hzcore ? `@hzcore/${options.name}` : options.name;
  return PACKAGE_JSON({name});
};
