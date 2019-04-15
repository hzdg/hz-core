const path = require('path');

module.exports = {
  extends: ['hzdg', 'hzdg/jest', 'hzdg/react', 'hzdg/typescript'],
  env: {
    node: true,
    es6: true,
  },
  settings: {
    'import/resolver': {
      jest: {
        jestConfigFile: path.resolve('jest.config.js'),
      },
    },
  },
};
