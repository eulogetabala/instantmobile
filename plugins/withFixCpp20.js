const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Plugin Expo pour fixer les erreurs C++20 en ajoutant un hook Gradle
 * qui modifie les fichiers dans le cache Gradle transformé avant la compilation
 */
function withFixCpp20(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const gradleBuildFile = path.join(
        config.modRequest.platformProjectRoot,
        'build.gradle'
      );

      // Lire le fichier build.gradle
      let buildGradleContent = '';
      if (fs.existsSync(gradleBuildFile)) {
        buildGradleContent = fs.readFileSync(gradleBuildFile, 'utf8');
      }

      // Ajouter le hook pour fixer C++20 si pas déjà présent
      const hookCode = `
// Fix C++20: Hook pour ajouter les includes manquants dans les fichiers transformés
allprojects {
    tasks.whenTaskAdded { task ->
        if (task.name.contains("buildCMake") || task.name.contains("configureCMake")) {
            task.doFirst {
                def script = file("${path.join(config.modRequest.projectRoot, 'scripts', 'fix-cpp20-gradle-cache.js')}")
                if (script.exists()) {
                    exec {
                        commandLine "node", script.absolutePath
                    }
                }
            }
        }
    }
}
`;

      if (!buildGradleContent.includes('Fix C++20')) {
        buildGradleContent += hookCode;
        fs.writeFileSync(gradleBuildFile, buildGradleContent, 'utf8');
        console.log('✅ Added C++20 fix hook to build.gradle');
      }

      return config;
    },
  ]);
}

module.exports = withFixCpp20;
