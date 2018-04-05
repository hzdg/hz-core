const {createConfig, babel, css} = require('webpack-blocks');
const {generateJSReferences} = require('mini-html-webpack-plugin');
const path = require('path');
const fs = require('fs');

function resolve(filePath, {js, publicPath}) {
  const jsReference = generateJSReferences(js, publicPath);
  return fs
    .readFileSync(filePath)
    .toString()
    .replace('<!-- jsReference -->', jsReference);
}

module.exports = {
  components: 'packages/**/src/**.js',
  webpackConfig: createConfig([babel(), css()]),
  showUsage: true,
  pagePerSection: true,
  title: 'HZ Core Component Library',
  require: [path.join(__dirname, 'conf', 'styleguide', 'styles.css')],
  template: ({js, publicPath}) =>
    resolve(path.join(__dirname, 'conf', 'styleguide', 'template.html'), {
      js,
      publicPath,
    }),
  theme: {
    color: {
      link: '#f38230',
      linkHover: 'rgb(67, 69, 77)',
      border: '#BABABA',
    },
  },
  styles: {
    ReactComponent: {
      root: {
        padding: '35px',
        boxShadow: '0 0 10px 1px #e8e8e8',
      },
    },
    SectionHeading: {
      heading: {
        marginTop: 50,
      },
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
