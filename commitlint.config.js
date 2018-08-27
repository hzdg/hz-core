const workspaces = require('./scripts/list-workspaces')();
const emojiTypes = require('./cz-emoji-types.json');

module.exports = {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      headerPattern: /^([^(\s]*)(?: \(([\w$./@\-* ]*)\))? (.*)$/,
    },
  },
  rules: {
    'scope-enum': [2, 'always', workspaces.map(({meta: {name}}) => name)],
    'type-enum': [2, 'always', emojiTypes.map(({emoji}) => emoji)],
  },
};
