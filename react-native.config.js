// =============================================================================
// react-native.config.js (host app)
// -----------------------------------------------------------------------------
// RN's autolinker by default only discovers packages whose names start with
// `react-native-` (or `@react-native-*`). Our local Nitro module is named
// `wallet-manager-module`, so we declare it explicitly here.
//
// Without this, `npx react-native config` returns it missing, `pod install`
// never loads our podspec, and Nitro autolinking glue never registers
// `WalletCore` on the JS side.
// =============================================================================

const path = require('path');

module.exports = {
  dependencies: {
    'wallet-manager-module': {
      root: path.join(__dirname, 'wallet-manager-module'),
      platforms: {
        ios: {
          podspecPath: path.join(
            __dirname,
            'wallet-manager-module',
            'WalletManagerModule.podspec',
          ),
        },
        android: {
          sourceDir: path.join(__dirname, 'wallet-manager-module', 'android'),
        },
      },
    },
  },
};
