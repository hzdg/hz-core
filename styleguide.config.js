const { createConfig, babel, postcss } = require('webpack-blocks');

module.exports = {
  components: 'packages/**/src/**.js',
  webpackConfig: createConfig([babel(), postcss()]),
  theme: {
    color: {
      link: '#f38230',
      linkHover: 'rgb(67, 69, 77)',
      // sidebarBackground: 'rgb(67, 69, 77)',
      border: '#BABABA',
    },
  },
  getExampleFilename(componentPath) {
    return componentPath.replace(/src\/[A-Za-z]*\.js$/, 'readme.md');
  },
}
