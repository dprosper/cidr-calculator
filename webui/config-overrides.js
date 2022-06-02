const { override, addLessLoader, adjustStyleLoaders } = require('customize-cra');

module.exports = override(
  addLessLoader({
    lessOptions: {
      javascriptEnabled: true,
    }
  }),
  adjustStyleLoaders(({ use: [, , postcss] }) => {
    const postcssOptions = postcss.options;
    postcss.options = { postcssOptions };
  })
);