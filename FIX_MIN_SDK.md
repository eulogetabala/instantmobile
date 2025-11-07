# Correction du problème minSdkVersion

## Problème

L'erreur suivante apparaît lors de la compilation :
```
User has minSdkVersion 22 but library was built for 24 [//ReactAndroid/hermestooling]
```

## Solution appliquée

1. **Forcer minSdkVersion à 24 dans tous les modules** (`android/build.gradle`)
2. **Désactiver react-native-worklets** qui cause des conflits
3. **Limiter les architectures à arm64-v8a** pour éviter les problèmes CMake

## Fichiers modifiés

- `android/build.gradle` : Ajout de la configuration pour forcer minSdkVersion 24
- `android/gradle.properties` : Ajout des configurations pour désactiver worklets

## Pour compiler maintenant

```bash
cd mobile/android
./gradlew clean
./gradlew assembleRelease --no-daemon
```

Ou utiliser le script :
```bash
cd mobile
npm run build:apk:release
```



