const emojiTypes = require('@hzcore/gitmoji');

module.exports = {
  extends: ['@commitlint/config-conventional'],
  parserPreset: '@hzcore/conventional-changelog',
  rules: {
    'type-enum': [2, 'always', emojiTypes.map(({emoji}) => emoji)],
  },
  husky: {
    hooks: {
      commitmsg: 'commitlint -E HUSKY_GIT_PARAMS',
    },
  },
};
