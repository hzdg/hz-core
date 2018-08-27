const emojiTypes = require('@hzcore/gitmoji');
const project = require('@lerna/project');

module.exports = async () => {
  const scopes = await project.getPackages(process.cwd());
  return {
    extends: ['@commitlint/config-conventional'],
    parserPreset: {
      parserOpts: {
        headerPattern: /^([^(\s]*)(?: \(([\w$./@\-* ]*)\))? (.*)$/,
        headerCorrespondence: ['emoji', 'scope', 'shortDesc'],
      },
    },
    rules: {
      'type-enum': [2, 'always', emojiTypes.map(({emoji}) => emoji)],
      'scope-enum': [2, 'always', scopes.map(({name}) => name)],
    },
  };
};
