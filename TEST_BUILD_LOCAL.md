# 🧪 Test du build local avec le fix C++20

## ✅ Fichiers corrigés

Le script `scripts/fix-cpp20-gradle-cache.js` a été exécuté et a corrigé :
- ✅ `hash_combine.h` : Ajouté `#include <concepts>`
- ✅ `F14Table.h` : Déjà corrigé (a `#include <concepts>`)
- ✅ `fnv1a.h` : Déjà corrigé (a `#include <functional>`)

## ⚠️ Important

Le cache Gradle est régénéré lors de `./gradlew clean`, donc les modifications sont perdues. Le hook Gradle dans `build.gradle` doit s'exécuter **avant chaque compilation CMake** pour re-corriger les fichiers.

## Test du build

### Option 1 : Build sans clean (recommandé)
```bash
cd mobile/android
./gradlew assembleRelease
```

Le hook devrait s'exécuter automatiquement avant la compilation CMake et corriger les fichiers.

### Option 2 : Build avec clean
```bash
cd mobile/android
./gradlew clean
./gradlew assembleRelease
```

Le hook devrait corriger les fichiers après le clean mais avant la compilation.

## Vérification

Si le build échoue encore, vérifier que :
1. Le hook Gradle est bien dans `android/build.gradle`
2. Le script `scripts/fix-cpp20-gradle-cache.js` existe et est exécutable
3. Les fichiers dans le cache Gradle sont modifiables (pas en lecture seule)

## Si ça ne fonctionne pas

Exécuter manuellement le script avant le build :
```bash
cd mobile
node scripts/fix-cpp20-gradle-cache.js
cd android
./gradlew assembleRelease
```
