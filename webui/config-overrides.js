const { override, addLessLoader } = require('customize-cra');

module.exports = override(
  addLessLoader({
    // If you are using less-loader@5 or older version, please spread the lessOptions to options directly.
    lessOptions: {
      javascriptEnabled: true,
      modifyVars: { 
        '@font-size-base': '12px',
        '@enable-ripple-effect': 'false',
        '@picker-tree-node-font-size': '12px',
        '@picker-children-check-item-padding-left': '12px',
        // '@base-color': '#f44336' 
      }
    }
  })
);