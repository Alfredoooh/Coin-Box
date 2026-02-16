<p>const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  minifierConfig: {
    compress: {
      dead_code: true,
      drop_console: true,
      drop_debugger: true,
      unused: true,
    },
    mangle: true,
    output: {
      comments: false,
    },
  },
};

config.resolver = {
  ...config.resolver,
  blacklistRE: [
    /\/__tests__\//,
    /\/__mocks__\//,
    /\.test\.(js|jsx|ts|tsx)$/,
    /\.spec\.(js|jsx|ts|tsx)$/,
  ],
};

module.exports = config;</p>
