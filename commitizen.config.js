const path = require('path');
const truncate = require('cli-truncate');
const wrap = require('wrap-ansi');
const pad = require('pad');
const Fuse = require('fuse.js');
const autocompletePrompt = require('inquirer-autocomplete-prompt');
const emojis = require('./cz-emoji-types.json');
const workspaces = require('./scripts/list-workspaces')();

/**
 * This commitizen config is based on https://github.com/ngryman/cz-emoji
 */

const FUSE_OPTIONS = {
  shouldSort: true,
  threshold: 0.4,
  location: 0,
  distance: 100,
  maxPatternLength: 32,
  minMatchCharLength: 1,
};

function autocomplete({name, message, choices, keys}) {
  const search = new Fuse(choices, {...FUSE_OPTIONS, keys});
  return {
    type: 'autocomplete',
    name,
    message,
    source: (_, q) => Promise.resolve(q ? search.search(q) : choices),
  };
}

function getTypeChoices() {
  const maxNameLength = emojis
    .map(({name}) => name)
    .reduce((max, {length}) => (length > max ? length : max), 0);
  return emojis.map(({name, emoji, code, description}) => ({
    name: `${pad(name, maxNameLength)}  ${emoji}  ${description}`,
    value: emoji,
    code,
  }));
}

function getScopeChoices() {
  const maxNameLength = workspaces
    .map(({meta: {name}}) => name)
    .reduce((max, {length}) => (length > max ? length : max), 0);
  return [
    {name: pad('<none>', maxNameLength), value: ' '},
    ...workspaces.map(({dir, meta: {name}}) => ({
      name: `${pad(name, maxNameLength)}  ${path.relative('.', dir)}`,
      value: name,
      dir,
    })),
  ];
}

function format({type, scope, subject, issues, body}) {
  // parentheses are only needed when a scope is present
  scope = scope ? (scope.trim() ? `(${scope.trim()}) ` : '') : '';
  // build head line and limit it to 100
  const head = truncate(`${type} ${scope}${subject.trim()}`, 100);
  // wrap body at 100
  body = wrap(body, 100);
  const footer = (issues.match(/#\d+/g) || [])
    .map(issue => `Closes ${issue}`)
    .join('\n');
  return [head, body, footer].join('\n\n').trim();
}

module.exports = {
  prompter(cz, commit) {
    cz.prompt.registerPrompt('autocomplete', autocompletePrompt);
    cz
      .prompt([
        autocomplete({
          name: 'type',
          message: "Select the type of change you're committing:",
          choices: getTypeChoices(),
          keys: ['name', 'code'],
        }),
        autocomplete({
          name: 'scope',
          message: 'Specify a scope:',
          choices: getScopeChoices(),
          keys: ['name', 'dir'],
        }),
        {
          type: 'input',
          name: 'subject',
          message: 'Write a short description:',
        },
        {
          type: 'input',
          name: 'issues',
          message: 'List any issue closed (#1, ...):',
        },
        {
          type: 'input',
          name: 'body',
          message: 'Provide a longer description:',
        },
      ])
      .then(format)
      .then(commit)
      .catch(e => {
        console.error(e); // eslint-disable-line no-console
        process.exit(1); // eslint-disable-line no-process-exit
      });
  },
};
