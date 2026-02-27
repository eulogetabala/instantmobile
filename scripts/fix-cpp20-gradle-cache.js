#!/usr/bin/env node

/**
 * Script pre-build pour fixer les erreurs C++20 dans le cache Gradle transformé
 * Ce script s'exécute avant le build EAS ou local
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GRADLE_CACHE = path.join(process.env.HOME || process.env.USERPROFILE, '.gradle', 'caches');
const TRANSFORMS_DIR = path.join(GRADLE_CACHE, '8.14.3', 'transforms');
const LOG_FILE = path.join(__dirname, '..', '..', '.cursor', 'debug.log');

function writeLog(entry) {
  try {
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
  } catch (e) {
    // Ignore log errors
  }
}

function addInclude(filePath, include, pattern) {
  try {
    // #region agent log
    writeLog({
      timestamp: Date.now(),
      location: 'fix-cpp20-gradle-cache.js:addInclude',
      message: 'Attempting to fix file',
      data: { filePath, include, pattern },
      runId: 'pre-fix',
      hypothesisId: 'E'
    });
    // #endregion
    
    // Vérifier les permissions en écriture
    try {
      fs.accessSync(filePath, fs.constants.W_OK);
    } catch (accessError) {
      // #region agent log
      writeLog({
        timestamp: Date.now(),
        location: 'fix-cpp20-gradle-cache.js:addInclude',
        message: 'File not writable',
        data: { filePath, error: accessError.message },
        runId: 'pre-fix',
        hypothesisId: 'E'
      });
      // #endregion
      return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Vérifier si le pattern existe et l'include n'existe pas
    if (content.includes(pattern) && !content.includes(include)) {
      // Trouver la dernière ligne #include et ajouter après
      const lines = content.split('\n');
      let lastIncludeIndex = -1;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('#include <')) {
          lastIncludeIndex = i;
        }
      }
      
      if (lastIncludeIndex >= 0) {
        lines.splice(lastIncludeIndex + 1, 0, include);
        fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
        console.log(`✅ Fixed: ${filePath}`);
        
        // #region agent log
        writeLog({
          timestamp: Date.now(),
          location: 'fix-cpp20-gradle-cache.js:addInclude',
          message: 'File fixed successfully',
          data: { filePath, method: 'after_include' },
          runId: 'pre-fix',
          hypothesisId: 'E'
        });
        // #endregion
        
        return true;
      } else {
        // Si pas de #include trouvé, ajouter au début après #pragma once
        const pragmaIndex = lines.findIndex(line => line.includes('#pragma once'));
        if (pragmaIndex >= 0) {
          lines.splice(pragmaIndex + 1, 0, include);
          fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
          console.log(`✅ Fixed: ${filePath} (added after #pragma once)`);
          
          // #region agent log
          writeLog({
            timestamp: Date.now(),
            location: 'fix-cpp20-gradle-cache.js:addInclude',
            message: 'File fixed successfully',
            data: { filePath, method: 'after_pragma' },
            runId: 'pre-fix',
            hypothesisId: 'E'
          });
          // #endregion
          
          return true;
        }
      }
    } else if (content.includes(include)) {
      console.log(`ℹ️  Already fixed: ${filePath}`);
      
      // #region agent log
      writeLog({
        timestamp: Date.now(),
        location: 'fix-cpp20-gradle-cache.js:addInclude',
        message: 'File already fixed',
        data: { filePath },
        runId: 'pre-fix',
        hypothesisId: 'E'
      });
      // #endregion
    }
  } catch (error) {
    // #region agent log
    writeLog({
      timestamp: Date.now(),
      location: 'fix-cpp20-gradle-cache.js:addInclude',
      message: 'Error fixing file',
      data: { filePath, error: error.message },
      runId: 'pre-fix',
      hypothesisId: 'E'
    });
    // #endregion
    
    console.log(`⚠️  Could not fix ${filePath}: ${error.message}`);
  }
  return false;
}

function replaceCodePattern(filePath, oldPattern, newPattern, description) {
  try {
    // #region agent log
    writeLog({
      timestamp: Date.now(),
      location: 'fix-cpp20-gradle-cache.js:replaceCodePattern',
      message: 'Attempting to replace code pattern',
      data: { filePath, description },
      runId: 'pre-fix',
      hypothesisId: 'H'
    });
    // #endregion
    
    // Vérifier les permissions en écriture
    try {
      fs.accessSync(filePath, fs.constants.W_OK);
    } catch (accessError) {
      // #region agent log
      writeLog({
        timestamp: Date.now(),
        location: 'fix-cpp20-gradle-cache.js:replaceCodePattern',
        message: 'File not writable',
        data: { filePath, error: accessError.message },
        runId: 'pre-fix',
        hypothesisId: 'H'
      });
      // #endregion
      return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Vérifier si le pattern existe et n'a pas déjà été remplacé
    if (content.includes(oldPattern)) {
      content = content.replace(oldPattern, newPattern);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath} (${description})`);
      
      // #region agent log
      writeLog({
        timestamp: Date.now(),
        location: 'fix-cpp20-gradle-cache.js:replaceCodePattern',
        message: 'Code pattern replaced successfully',
        data: { filePath, description },
        runId: 'pre-fix',
        hypothesisId: 'H'
      });
      // #endregion
      
      return true;
    } else if (content.includes("std::to_string") && description.includes("std::format")) {
      console.log(`ℹ️  Already fixed: ${filePath} (${description})`);
      
      // #region agent log
      writeLog({
        timestamp: Date.now(),
        location: 'fix-cpp20-gradle-cache.js:replaceCodePattern',
        message: 'File already fixed',
        data: { filePath, description },
        runId: 'pre-fix',
        hypothesisId: 'H'
      });
      // #endregion
    }
  } catch (error) {
    // #region agent log
    writeLog({
      timestamp: Date.now(),
      location: 'fix-cpp20-gradle-cache.js:replaceCodePattern',
      message: 'Error replacing code pattern',
      data: { filePath, error: error.message, description },
      runId: 'pre-fix',
      hypothesisId: 'H'
    });
    // #endregion
    
    console.log(`⚠️  Could not fix ${filePath}: ${error.message}`);
  }
  return false;
}

function findAndFixFiles(dir, fileName, include, pattern) {
  // #region agent log
  writeLog({
    timestamp: Date.now(),
    location: 'fix-cpp20-gradle-cache.js:findAndFixFiles',
    message: 'Starting file search',
    data: { dir, fileName, dirExists: fs.existsSync(dir) },
    runId: 'pre-fix',
    hypothesisId: 'B'
  });
  // #endregion
  
  if (!fs.existsSync(dir)) {
    // #region agent log
    writeLog({
      timestamp: Date.now(),
      location: 'fix-cpp20-gradle-cache.js:findAndFixFiles',
      message: 'Directory does not exist',
      data: { dir },
      runId: 'pre-fix',
      hypothesisId: 'B'
    });
    // #endregion
    return;
  }
  
  let filesFound = 0;
  let filesFixed = 0;
  
  function walkDir(currentPath) {
    try {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.name === fileName) {
          filesFound++;
          // #region agent log
          writeLog({
            timestamp: Date.now(),
            location: 'fix-cpp20-gradle-cache.js:walkDir',
            message: 'File found',
            data: { filePath: fullPath, fileName },
            runId: 'pre-fix',
            hypothesisId: 'B'
          });
          // #endregion
          
          if (addInclude(fullPath, include, pattern)) {
            filesFixed++;
          }
        }
      }
    } catch (error) {
      // #region agent log
      writeLog({
        timestamp: Date.now(),
        location: 'fix-cpp20-gradle-cache.js:walkDir',
        message: 'Error walking directory',
        data: { error: error.message, path: currentPath },
        runId: 'pre-fix',
        hypothesisId: 'B'
      });
      // #endregion
    }
  }
  
  walkDir(dir);
  
  // #region agent log
  writeLog({
    timestamp: Date.now(),
    location: 'fix-cpp20-gradle-cache.js:findAndFixFiles',
    message: 'File search completed',
    data: { dir, fileName, filesFound, filesFixed },
    runId: 'pre-fix',
    hypothesisId: 'B'
  });
  // #endregion
}

// Also search in node_modules
function findAndFixFilesInNodeModules(fileName, include, pattern) {
  const nodeModulesPath = path.join(__dirname, '..', 'node_modules', 'react-native');
  
  // #region agent log
  writeLog({
    timestamp: Date.now(),
    location: 'fix-cpp20-gradle-cache.js:findAndFixFilesInNodeModules',
    message: 'Starting node_modules search',
    data: { nodeModulesPath, fileName, nodeModulesExists: fs.existsSync(nodeModulesPath) },
    runId: 'pre-fix',
    hypothesisId: 'C'
  });
  // #endregion
  
  if (!fs.existsSync(nodeModulesPath)) {
    // #region agent log
    writeLog({
      timestamp: Date.now(),
      location: 'fix-cpp20-gradle-cache.js:findAndFixFilesInNodeModules',
      message: 'node_modules/react-native does not exist',
      data: { nodeModulesPath },
      runId: 'pre-fix',
      hypothesisId: 'C'
    });
    // #endregion
    return;
  }
  
  const searchPaths = [
    path.join(nodeModulesPath, 'ReactCommon', 'react', 'utils', fileName),
    path.join(nodeModulesPath, 'ReactCommon', 'react', 'utils', fileName)
  ];
  
  // Recherche récursive dans ReactCommon
  function searchRecursive(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          searchRecursive(fullPath);
        } else if (entry.name === fileName) {
          // #region agent log
          writeLog({
            timestamp: Date.now(),
            location: 'fix-cpp20-gradle-cache.js:findAndFixFilesInNodeModules',
            message: 'File found in node_modules',
            data: { filePath: fullPath, fileName },
            runId: 'pre-fix',
            hypothesisId: 'C'
          });
          // #endregion
          
          addInclude(fullPath, include, pattern);
        }
      }
    } catch (error) {
      // Ignorer les erreurs
    }
  }
  
  const reactCommonPath = path.join(nodeModulesPath, 'ReactCommon');
  if (fs.existsSync(reactCommonPath)) {
    searchRecursive(reactCommonPath);
  }
}

// #region agent log
// Vérifier la version NDK configurée
let ndkVersion = 'unknown';
try {
  const appJsonPath = path.join(__dirname, '..', 'app.json');
  if (fs.existsSync(appJsonPath)) {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    ndkVersion = appJson?.expo?.plugins?.find(p => p?.[0] === 'expo-build-properties')?.[1]?.android?.ndkVersion || 'not found in app.json';
  }
} catch (e) {
  // Ignore
}

// Vérifier la version NDK dans build.gradle
let ndkVersionGradle = 'unknown';
try {
  const buildGradlePath = path.join(__dirname, '..', 'android', 'build.gradle');
  if (fs.existsSync(buildGradlePath)) {
    const buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
    const match = buildGradle.match(/ndkVersion\s*=\s*["']([^"']+)["']/);
    if (match) {
      ndkVersionGradle = match[1];
    }
  }
} catch (e) {
  // Ignore
}

writeLog({
  timestamp: Date.now(),
  location: 'fix-cpp20-gradle-cache.js:main',
  message: 'Script started',
  data: { 
    transformsDir: TRANSFORMS_DIR,
    transformsDirExists: fs.existsSync(TRANSFORMS_DIR),
    ndkVersionAppJson: ndkVersion,
    ndkVersionGradle: ndkVersionGradle,
    nodeVersion: process.version,
    platform: process.platform
  },
  runId: 'pre-fix',
  hypothesisId: 'A'
});
// #endregion

console.log('🔧 Fixing C++20 includes in Gradle cache...');

// Fixer F14Table.h (Folly) - dans le cache transformé
findAndFixFiles(
  TRANSFORMS_DIR,
  'F14Table.h',
  '#include <concepts>',
  'std::regular'
);

// Fixer hash_combine.h (React Native) - dans le cache transformé ET node_modules
findAndFixFiles(
  TRANSFORMS_DIR,
  'hash_combine.h',
  '#include <concepts>',
  'Hashable'
);
findAndFixFilesInNodeModules('hash_combine.h', '#include <concepts>', 'Hashable');

// Fixer fnv1a.h (React Native) - dans le cache transformé ET node_modules
findAndFixFiles(
  TRANSFORMS_DIR,
  'fnv1a.h',
  '#include <functional>',
  'std::identity'
);
findAndFixFilesInNodeModules('fnv1a.h', '#include <functional>', 'std::identity');

// Fixer graphicsConversions.h (React Native) - remplacer std::format par std::to_string
function findAndFixGraphicsConversions(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }
  
  let filesFound = 0;
  let filesFixed = 0;
  
  function walkDir(currentPath) {
    try {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.name === 'graphicsConversions.h') {
          filesFound++;
          
          // Remplacer std::format par std::to_string
          // Pattern avec indentation exacte (6 espaces)
          const oldFormatPattern = '      return std::format("{}%", dimension.value);';
          const newFormatCode = `      {
        // Use std::to_string instead of std::format for Android NDK compatibility
        static thread_local std::string percentBuffer;
        percentBuffer = std::to_string(dimension.value) + "%";
        return percentBuffer;
      }`;
          
          // Remplacer #include <format> par #include <string>
          const oldIncludePattern = '#include <format>';
          const newIncludeCode = '#include <string>';
          
          let fixed = false;
          
          // D'abord remplacer le code std::format
          if (replaceCodePattern(fullPath, oldFormatPattern, newFormatCode, 'std::format -> std::to_string')) {
            fixed = true;
          }
          
          // Ensuite remplacer l'include
          if (replaceCodePattern(fullPath, oldIncludePattern, newIncludeCode, '#include <format> -> #include <string>')) {
            fixed = true;
          }
          
          if (fixed) {
            filesFixed++;
          }
        }
      }
    } catch (error) {
      // Ignorer les erreurs
    }
  }
  
  walkDir(dir);
  
  // #region agent log
  writeLog({
    timestamp: Date.now(),
    location: 'fix-cpp20-gradle-cache.js:findAndFixGraphicsConversions',
    message: 'GraphicsConversions fix completed',
    data: { dir, filesFound, filesFixed },
    runId: 'pre-fix',
    hypothesisId: 'H'
  });
  // #endregion
}

// Fixer graphicsConversions.h (React Native) - dans le cache transformé
findAndFixGraphicsConversions(TRANSFORMS_DIR);

// #region agent log
writeLog({
  timestamp: Date.now(),
  location: 'fix-cpp20-gradle-cache.js:main',
  message: 'Script completed',
  data: {},
  runId: 'pre-fix',
  hypothesisId: 'A'
});
// #endregion

// #region agent log
writeLog({
  timestamp: Date.now(),
  location: 'fix-cpp20-gradle-cache.js:main',
  message: 'Script execution completed',
  data: { 
    completed: true
  },
  runId: 'post-fix',
  hypothesisId: 'G'
});
// #endregion

console.log('✅ C++20 fixes completed');
