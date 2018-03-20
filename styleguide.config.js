const {createConfig, babel, postcss, css} = require('webpack-blocks');

module.exports = {
  components: 'packages/**/src/**.js',
  webpackConfig: createConfig([babel(), css()]),
  showUsage: true,
  theme: {
    color: {
      link: '#f38230',
      linkHover: 'rgb(67, 69, 77)',
      border: '#BABABA',
    },
  },
  getExampleFilename(componentPath) {
    return componentPath.replace(/src\/[A-Za-z]*\.js$/, 'readme.md');
  },
  sections: [
    {
      name: 'Simple Actions',
      components: './packages/simple-actions/**/src/index.js',
    },
    {
      name: 'Animations',
      components: './packages/animations/**/src/index.js',
    },
  ],
};
