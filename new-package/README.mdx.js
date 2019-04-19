// @ts-check

/* prettier-ignore */
/**
 * @param {Object} options
 * @param {string} options.name
 * @param {string} options.main
 * @param {string} options.menu
 * @param {string} options.route
 * @param {boolean} options.isDefault
 */
const README = ({name, main, menu, route, isDefault}) => `
---
name: ${main}
menu: ${menu}
route: ${route}
---

# ${main}

## Installation

\`\`\`shell
yarn add @hzcore/${name}
\`\`\`

## Usage

\`\`\`js
import ${isDefault ? main : `{${main}}`} from '@hzcore/${name}';
\`\`\`

## TODO: write some [docz](https://docz.site)!
`;

/**
 * @param {import("../scripts/create-package").Options} options
 * @returns {string}
 */
module.exports = function renderReadme(options) {
  return README(options);
};