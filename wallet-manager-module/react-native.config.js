// =============================================================================
// wallet-manager-module/react-native.config.js
// -----------------------------------------------------------------------------
// Tells React Native's autolinker where this package's native code lives.
// Podspec is at the package root (RN/Nitro convention — required because
// `add_nitrogen_files` uses paths relative to the podspec).
// =============================================================================

const path = require('path');

module.exports = {
  dependency: {
    platforms: {
      ios: {
        podspecPath: path.join(__dirname, 'WalletManagerModule.podspec'),
      },
      android: {
        sourceDir: path.join(__dirname, 'android'),
      },
    },
  },
};
