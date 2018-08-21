const {createConfig, babel, css, setDevTool} = require('webpack-blocks');
const {generateJSReferences} = require('mini-html-webpack-plugin');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = __dirname;
const WORKSPACES = require(path.join(PROJECT_ROOT, 'package.json')).workspaces;
const NAMESPACE = 'hzcore';
const COMPONENT_GLOB = `${NAMESPACE}-*/src/index.js`;

const capFirst = word => `${word[0].toUpperCase()}${word.slice(1)}`;

const dumbTitleCase = str =>
  str
    .split(/[\s-_]/)
    .map(capFirst)
    .join(' ');

const pathnameFromWorkspace = workspace =>
  path.dirname(path.relative(PROJECT_ROOT, workspace));

const nameFromWorkspace = workspace =>
  dumbTitleCase(path.basename(pathnameFromWorkspace(workspace)));

const componentGlobFromWorkspace = workspace =>
  path.join(pathnameFromWorkspace(workspace), COMPONENT_GLOB);

function resolve(filePath, {js, publicPath}) {
  const jsReference = generateJSReferences(js, publicPath);
  return fs
    .readFileSync(filePath)
    .toString()
    .replace('<!-- jsReference -->', jsReference);
}

module.exports = {
  components: 'packages/**/src/**.js',
  webpackConfig: createConfig([
    setDevTool('cheap-module-source-map'),
    babel(),
    css(),
  ]),
  usageMode: 'expand',
  pagePerSection: true,
  title: 'HZ Core Component Library',
  require: [
    'babel-polyfill',
    path.join(__dirname, 'conf', 'styleguide', 'styles.css'),
  ],
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
  sections:
    // Create a section for each workspace.
    WORKSPACES.map(workspace => ({
      name: nameFromWorkspace(workspace),
      components: componentGlobFromWorkspace(workspace),
    })),
  getComponentPathLine(componentPath) {
    const pkgName = componentPath.replace(
      new RegExp(`.*/?${NAMESPACE}-([^/]*).*`),
      '$1',
    );
    let moduleName = path.basename(componentPath, '.js');
    while (moduleName === 'index' || moduleName === 'src') {
      componentPath = path.dirname(componentPath);
      moduleName = path.basename(componentPath);
    }
    moduleName = moduleName
      .replace(`${NAMESPACE}-`, '')
      .split('-')
      .map(capFirst)
      .join('');
    return `import ${moduleName} from '@${NAMESPACE}/${pkgName}';`;
  },
  updateDocs(docs) {
    if (docs.doclets.version) {
      const versionFilePath = path.resolve(__dirname, 'package.json');
      const thisThing = require(versionFilePath); // eslint-disable-line global-require
      const version = thisThing.version; // eslint-disable-line prefer-destructuring
      docs.doclets.version = version;
      docs.tags.version[0].description = version;
    }
    return docs;
  },
};
