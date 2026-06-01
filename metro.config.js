const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const projectRoot = __dirname;

// Local packages that live outside `node_modules` and must be watched by Metro.
const localPackages = [path.resolve(projectRoot, 'wallet-manager-module')];

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  // Track sources of the in-repo packages so HMR works when they change.
  watchFolders: localPackages,

  resolver: {
    // The in-repo package may bring its own node_modules. Force every peer
    // dep (react / react-native / nitro / etc.) to resolve from the host
    // app's node_modules so we never end up with two copies of React.
    extraNodeModules: new Proxy(
      {},
      {
        get: (_target, name) => path.join(projectRoot, 'node_modules', name),
      },
    ),
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
