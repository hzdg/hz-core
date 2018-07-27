const path = require('path');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');

const GLOBALS = {
  react: 'React',
  'react-dom': 'ReactDOM',
  'prop-types': 'PropTypes',
  'react-spring': 'ReactSpring',
  'react-motion': 'ReactMotion',
};

module.exports = {
  external: Object.keys(GLOBALS),
  output: {
    format: 'umd',
    globals: GLOBALS,
    exports: 'named',
  },
  plugins: [
    babel({
      extends: path.resolve('.babelrc'),
      exclude: 'node_modules/**',
      envName: 'umd',
    }),
    resolve({
      customResolveOptions: {
        moduleDirectory: [path.resolve('node_modules'), '../'],
      },
    }),
    commonjs({
      include: /node_modules/,
    }),
  ],
};
