// @ts-check

const CHANGELOG = () => `
# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.
`;

/**
 * @param {import("../scripts/create-package").Options} options
 * @returns {string}
 */
module.exports = function renderChangelog(options) {
  return CHANGELOG();
};
