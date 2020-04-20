const path = require('path');
const wrap = require('wrap-ansi');
const pad = require('pad');
const fuzzy = require('fuzzy');
const chalk = require('chalk');
const style = require('ansi-styles');
const autocompletePrompt = require('inquirer-autocomplete-prompt');
const emojis = require('@hzdg/gitmoji');
const project = require('@lerna/project');

const config = require('commitizen').configLoader.load();

/**
 * This commitizen config is based on https://github.com/ngryman/cz-emoji
 * and https://github.com/commitizen/cz-conventional-changelog
 */

const options = {
  maxHeaderWidth:
    (process.env.CZ_MAX_HEADER_WIDTH &&
      parseInt(process.env.CZ_MAX_HEADER_WIDTH)) ||
    config.maxHeaderWidth ||
    100,
  maxLineWidth:
    (process.env.CZ_MAX_LINE_WIDTH &&
      parseInt(process.env.CZ_MAX_LINE_WIDTH)) ||
    config.maxLineWidth ||
    100,
};

(function(options) {
  try {
    const commitlintLoad = require('@commitlint/load');
    commitlintLoad().then(function(clConfig) {
      if (clConfig.rules) {
        const maxHeaderLengthRule = clConfig.rules['header-max-length'];
        if (
          typeof maxHeaderLengthRule === 'object' &&
          maxHeaderLengthRule.length >= 3 &&
          !process.env.CZ_MAX_HEADER_WIDTH &&
          !config.maxHeaderWidth
        ) {
          options.maxHeaderWidth = maxHeaderLengthRule[2];
        }
      }
    });
  } catch (err) {
    /** BOOP! */
  }
})(options);

function autocomplete({name, message, choices, keys}) {
  const options = {
    pre: `${style.yellow.open}${style.bold.open}`,
    post: `${style.bold.close}${style.yellow.close}`,
    extract: v => keys.map(k => v[k]).join(''),
  };
  return {
    type: 'autocomplete',
    name,
    message,
    async source(_, q) {
      if (!q) return choices;
      const results = fuzzy.filter(q, await choices, options);
      return Promise.resolve(
        results.map(result => ({...result.original, name: result.string})),
      );
    },
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

async function getScopeChoices() {
  const scopes = await project.getPackages(process.cwd());
  const maxNameLength = scopes
    .map(({name}) => name)
    .reduce((max, {length}) => (length > max ? length : max), 0);
  return [
    {name: pad('<none>', maxNameLength), value: ' '},
    ...scopes.map(({location, name}) => ({
      name: `${pad(name, maxNameLength)}  ${path.relative('.', location)}`,
      value: name,
      location,
    })),
  ];
}

function format({type, scope, subject, issues, body}) {
  const wrapOptions = {
    trim: true,
    cut: false,
    newline: '\n',
    indent: '',
    width: options.maxLineWidth,
  };
  // parentheses are only needed when a scope is present
  scope = scope ? (scope.trim() ? `(${scope.trim()}) ` : '') : '';
  // build head line and limit it to 100
  const head = `${type} ${scope}${subject.trim()}`;
  // wrap body at `options.maxLineWidth`
  body = body ? wrap(body, wrapOptions) : false;
  // wrap issues at `options.maxLineWidth`
  issues = issues ? wrap(issues, wrapOptions) : false;
  return [head, body, issues].filter(v => v).join('\n\n');
}

module.exports = {
  prompter(cz, commit) {
    cz.prompt.registerPrompt('autocomplete', autocompletePrompt);
    return cz
      .prompt([
        autocomplete({
          name: 'type',
          message: "Select the type of change you're committing:",
          choices: getTypeChoices(),
          keys: ['name'],
        }),
        autocomplete({
          name: 'scope',
          message: 'Specify a scope:',
          choices: getScopeChoices(),
          keys: ['name'],
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
        console.error(e);
        process.exit(1);
      });
  },
};
