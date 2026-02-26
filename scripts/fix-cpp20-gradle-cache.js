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

function addInclude(filePath, include, pattern) {
  try {
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
        return true;
      }
    }
  } catch (error) {
    // Ignorer les erreurs (fichier peut ne pas exister ou être en lecture seule)
  }
  return false;
}

function findAndFixFiles(dir, fileName, include, pattern) {
  if (!fs.existsSync(dir)) {
    return;
  }
  
  function walkDir(currentPath) {
    try {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.name === fileName) {
          addInclude(fullPath, include, pattern);
        }
      }
    } catch (error) {
      // Ignorer les erreurs de permission
    }
  }
  
  walkDir(dir);
}

console.log('🔧 Fixing C++20 includes in Gradle cache...');

// Fixer F14Table.h (Folly)
findAndFixFiles(
  TRANSFORMS_DIR,
  'F14Table.h',
  '#include <concepts>',
  'std::regular'
);

// Fixer hash_combine.h (React Native)
findAndFixFiles(
  TRANSFORMS_DIR,
  'hash_combine.h',
  '#include <concepts>',
  'Hashable'
);

// Fixer fnv1a.h (React Native)
findAndFixFiles(
  TRANSFORMS_DIR,
  'fnv1a.h',
  '#include <functional>',
  'std::identity'
);

console.log('✅ C++20 fixes completed');
