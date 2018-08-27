#! /usr/bin/env node
/* eslint-disable no-console, no-process-exit */
const path = require('path');
const glob = require('glob');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const WORKSPACES = require(path.join(PROJECT_ROOT, 'package.json')).workspaces;

const listPackages = () =>
  WORKSPACES
    // Find all of the package.json files in package workspaces.
    .reduce(
      (matches, pattern) =>
        matches.concat(
          glob.sync(path.join(PROJECT_ROOT, pattern, 'package.json')),
        ),
      [],
    )
    // Queue up a package build for each workspace.
    .map(pkg => ({
      dir: path.dirname(pkg),
      meta: require(pkg), // eslint-disable-line global-require
      name: path.basename(path.dirname(pkg)),
      src: path.join(path.dirname(pkg), 'src'),
    }));

module.exports = listPackages;

// If this is module is being run as a script, invoke the build function.
if (typeof require !== 'undefined' && require.main === module) {
  console.log(
    listPackages()
      .map(({name}) => name)
      .join('\n'),
  );
}
