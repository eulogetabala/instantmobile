#!/bin/bash

# Script pour corriger minSdkVersion dans les modules problématiques

echo "🔧 Correction de minSdkVersion dans les modules natifs..."

# Liste des modules à corriger
MODULES=(
  "node_modules/react-native-worklets/android/build.gradle"
  "node_modules/expo-modules-core/android/build.gradle"
  "node_modules/react-native-screens/android/build.gradle"
)

for file in "${MODULES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ Correction de $file"
    # Remplacer minSdkVersion 22 par 24
    sed -i '' 's/minSdkVersion.*22/minSdkVersion 24/g' "$file" 2>/dev/null || \
    sed -i 's/minSdkVersion.*22/minSdkVersion 24/g' "$file" 2>/dev/null
  fi
done

echo "✅ Correction terminée !"

