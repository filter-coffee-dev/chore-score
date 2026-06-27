const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.platforms = ['ios', 'android', 'native', 'web'];
config.resolver.mainFields = ['browser', 'main'];

// Zustand ships ESM (.mjs) builds via the `exports` `import` condition which
// contains `import.meta` — invalid in Metro's non-module bundle. Force all
// zustand/* imports to the CJS builds in the package root.
const ZUSTAND_CJS = path.resolve(__dirname, 'node_modules/zustand');
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'zustand' || moduleName.startsWith('zustand/')) {
    const subpath = moduleName === 'zustand' ? 'index' : moduleName.slice('zustand/'.length);
    return {
      filePath: path.join(ZUSTAND_CJS, `${subpath}.js`),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
