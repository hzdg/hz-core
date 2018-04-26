const babel = require('rollup-plugin-babel');
const json = require('rollup-plugin-json');

module.exports = {
  plugins: [
    json(),
    babel({
      exclude: 'node_modules/**',
      plugins: ['external-helpers'],
    }),
  ],
};
