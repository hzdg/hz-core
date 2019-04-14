// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  // An array of file extensions your modules use
  moduleFileExtensions: ['js', 'json', 'jsx', 'node', 'ts', 'tsx'],

  // A map from regular expressions to module names that allow to stub out resources with a single module
  moduleNameMapper: {
    'testutils(.*)$': '<rootDir>/testutils$1',
  },

  // An array of absolute paths to additional locations to search when resolving modules
  modulePaths: ['<rootDir>'],

  // The root directory that Jest should scan for tests and modules within
  rootDir: __dirname,

  // The paths to modules that run some code to configure or set up the testing framework before each test.
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // The regexp pattern Jest uses to detect test files
  testRegex: '.*/__tests__/.*test.(?:j|t)sx?$',

  // This option sets the URL for the jsdom environment. It is reflected in properties such as location.href
  testURL: 'http://localhost',
};
