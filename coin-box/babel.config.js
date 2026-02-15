// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'], // ou ['module:metro-react-native-babel-preset'] se não usas Expo
    plugins: ['nativewind/babel'],
  };
};