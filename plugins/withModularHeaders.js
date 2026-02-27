const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * A simple config plugin to add use_modular_headers! to the Podfile.
 */
const withModularHeaders = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.projectRoot, 'ios', 'Podfile');
      let podfileContent = fs.readFileSync(podfilePath, 'utf8');

      if (!podfileContent.includes('use_modular_headers!')) {
        // Add it after the platform line
        podfileContent = podfileContent.replace(
          /platform :ios, .*/,
          (match) => `${match}\n\nuse_modular_headers!`
        );
        fs.writeFileSync(podfilePath, podfileContent);
      }

      return config;
    },
  ]);
};

module.exports = withModularHeaders;
