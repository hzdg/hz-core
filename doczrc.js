export default {
  title: 'HZ Core',
  description: "HZ's internal library of React Components",
  src: './packages',
  public: './static',
  files: '**/*.{md,mdx}',
  typescript: false,
  ignore: ['**/changelog.*', '**/{animations,simple-actions}/**'],
  menu: [
    'About',
    'Headless Components',
    'Hooks',
    'Styled Components',
    'Utilities',
  ],
  htmlContext: {
    favicon: 'public/favicon.ico',
  },
  themeConfig: {
    showPlaygroundEditor: true,
    logo: {
      src: 'public/logo.svg',
      width: 150,
    },
    colors: {
      primary: 'rgb(243,130,48)',
      text: 'rgb(67,69,77)',
      link: 'rgb(243,130,48)',
      sidebarText: 'rgb(127,129,134)',
      blockquoteBorder: 'rgb(190,141,190)',
    },
    styles: {
      logo: {
        alignItems: 'center',
      },
    },
  },
};
