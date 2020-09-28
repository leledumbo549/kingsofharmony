const path = require('path');
const { override, addDecoratorsLegacy, disableEsLint, addBabelPlugins, babelInclude } = require('customize-cra');
// const rewireMobX = require("react-app-rewire-mobx");

module.exports = override(
  addDecoratorsLegacy(),

  // disable eslint in webpack
  disableEsLint(),

  // ...addBabelPlugins('@babel/plugin-proposal-class-properties'),

  babelInclude([
    path.resolve(__dirname, 'node_modules/react-native-elements'),
    path.resolve(__dirname, 'node_modules/react-native-vector-icons'),
    path.resolve(__dirname, 'node_modules/react-native-ratings'),
    path.resolve(__dirname, 'src'),
  ])
);

// module.exports = function override(config, env) {
//   config = rewireMobX(config, env);
//   return config;
// }