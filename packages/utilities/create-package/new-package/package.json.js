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
    "types",
    "!*/__test*"
  ]
}
`;

/**
 * @param {import("../bin/create-package").Options} options
 * @returns {string}
 */
module.exports = function createPackageJson(options) {
  return PACKAGE_JSON(options);
};
