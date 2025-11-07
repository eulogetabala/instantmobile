# Guide de compilation APK Android - Instant+

Ce guide vous explique comment compiler correctement un APK Android pour l'application Instant+.

## 📋 Prérequis

1. **Node.js** (v18 ou supérieur)
2. **Java JDK** (v17 ou supérieur)
3. **Android Studio** avec Android SDK installé
4. **Variables d'environnement Android** configurées :
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   ```

## 🚀 Méthodes de compilation

### Méthode 1 : Script automatique (Recommandé)

Le script `build-apk.sh` automatise tout le processus :

```bash
cd mobile

# APK Debug avec backend local
./build-apk.sh debug local

# APK Release avec backend local
./build-apk.sh release local

# APK Release avec backend de production
./build-apk.sh release production
```

**Avantages :**
- ✅ Détection automatique de l'IP locale
- ✅ Configuration automatique des variables d'environnement
- ✅ Nettoyage automatique des builds précédents
- ✅ Messages clairs et colorés

### Méthode 2 : Compilation manuelle avec Expo

#### Pour un APK Debug (test rapide)

```bash
cd mobile

# Installer les dépendances si nécessaire
npm install

# Préparer le projet Android
npx expo prebuild --platform android --clean

# Compiler l'APK debug
cd android
./gradlew assembleDebug
cd ..

# L'APK sera dans : android/app/build/outputs/apk/debug/app-debug.apk
```

#### Pour un APK Release (production)

```bash
cd mobile

# Installer les dépendances
npm install

# Configurer les variables d'environnement (voir section ci-dessous)
export EXPO_PUBLIC_USE_LOCALHOST=false
# OU pour backend local :
# export EXPO_PUBLIC_LOCAL_IP=192.168.1.XXX
# export EXPO_PUBLIC_USE_LOCALHOST=true

# Préparer le projet Android
npx expo prebuild --platform android --clean

# Compiler l'APK release
cd android
./gradlew assembleRelease
cd ..

# L'APK sera dans : android/app/build/outputs/apk/release/app-release.apk
```

### Méthode 3 : Build avec EAS (Cloud - Expo Application Services)

```bash
cd mobile

# Installer EAS CLI si nécessaire
npm install -g eas-cli

# Se connecter à Expo
eas login

# Build preview (APK)
eas build --platform android --profile preview

# Build production (AAB pour Google Play)
eas build --platform android --profile production
```

## 🔧 Configuration des variables d'environnement

### Variables disponibles

| Variable | Description | Exemple |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | URL complète de l'API (priorité la plus haute) | `https://api.example.com/api` |
| `EXPO_PUBLIC_USE_LOCALHOST` | Utiliser le backend local (`true`/`false`) | `true` |
| `EXPO_PUBLIC_LOCAL_IP` | IP locale du Mac/PC pour accès depuis appareil physique | `192.168.1.100` |

### Configuration pour backend local

#### Option 1 : Via variables d'environnement (recommandé)

```bash
# Trouver l'IP locale de votre Mac
ifconfig | grep "inet " | grep -v 127.0.0.1

# Exporter les variables
export EXPO_PUBLIC_LOCAL_IP=192.168.1.XXX  # Remplacez par votre IP
export EXPO_PUBLIC_USE_LOCALHOST=true

# Puis compiler
./build-apk.sh release local
```

#### Option 2 : Via fichier .env (à créer)

Créez un fichier `.env` dans le dossier `mobile/` :

```env
EXPO_PUBLIC_LOCAL_IP=192.168.1.XXX
EXPO_PUBLIC_USE_LOCALHOST=true
```

**Note :** Expo ne charge pas automatiquement les fichiers `.env`. Vous devez utiliser `expo-constants` ou un package comme `react-native-dotenv`.

### Configuration pour backend de production

```bash
export EXPO_PUBLIC_USE_LOCALHOST=false
# OU
export EXPO_PUBLIC_API_URL=https://instant-backend-2m5j.onrender.com/api
```

## 📱 Installation sur appareil Android

### Méthode 1 : Via ADB (Android Debug Bridge)

```bash
# Connecter votre appareil via USB
# Activer le mode développeur et le débogage USB sur l'appareil

# Installer l'APK
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Méthode 2 : Installation manuelle

1. Transférez l'APK sur votre appareil Android (via email, cloud, USB, etc.)
2. Sur l'appareil, allez dans **Paramètres > Sécurité**
3. Activez **"Sources inconnues"** ou **"Installer des applications inconnues"**
4. Ouvrez le fichier APK avec le gestionnaire de fichiers
5. Suivez les instructions d'installation

## 🔐 Keystore pour APK Release

### Keystore Debug (déjà configuré)

Le projet utilise déjà un keystore debug (`android/app/debug.keystore`) avec :
- **Alias :** `androiddebugkey`
- **Password :** `android`

### Keystore Production (pour Google Play)

Pour publier sur Google Play, vous devez créer un keystore de production :

```bash
cd mobile/android/app

keytool -genkeypair -v -storetype PKCS12 \
  -keystore release.keystore \
  -alias instant-release \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass VOTRE_MOT_DE_PASSE \
  -keypass VOTRE_MOT_DE_PASSE

# ⚠️ IMPORTANT : Sauvegardez ce keystore et les mots de passe !
# Sans eux, vous ne pourrez plus mettre à jour votre app sur Google Play
```

Puis modifiez `android/app/build.gradle` :

```gradle
signingConfigs {
    release {
        storeFile file('release.keystore')
        storePassword System.getenv("KEYSTORE_PASSWORD")
        keyAlias 'instant-release'
        keyPassword System.getenv("KEYSTORE_PASSWORD")
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        // ... autres configurations
    }
}
```

## 🐛 Résolution de problèmes

### Erreur : "SDK location not found"

```bash
# Créer le fichier local.properties dans android/
echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties
```

### Erreur : "Gradle sync failed" ou erreurs CMake codegen

```bash
cd mobile

# Option 1 : Nettoyage complet avec le script
./clean-android.sh
npx expo prebuild --platform android --clean

# Option 2 : Nettoyage manuel
rm -rf android
npx expo prebuild --platform android --clean
```

### Erreur : "CMake Error: add_subdirectory given source which is not an existing directory"

Cette erreur survient lorsque les fichiers codegen ne sont pas générés pour la nouvelle architecture React Native. Solution :

```bash
cd mobile

# Supprimer complètement le dossier android
rm -rf android

# Régénérer le projet
npx expo prebuild --platform android --clean

# Puis compiler
cd android
./gradlew assembleRelease --no-daemon
```

### Erreur : "Cannot find module"

```bash
cd mobile
rm -rf node_modules
npm install
```

### L'APK ne se connecte pas au backend local

1. Vérifiez que votre Mac/PC et votre appareil sont sur le même réseau WiFi
2. Vérifiez que le backend tourne sur le port 5001
3. Vérifiez que le firewall n'bloque pas le port 5001
4. Utilisez l'IP locale correcte (pas `localhost` ou `127.0.0.1`)

### Pour Android Emulator

L'émulateur Android utilise `10.0.2.2` pour accéder à `localhost` de votre machine. Le code gère cela automatiquement.

## 📊 Tailles d'APK typiques

- **APK Debug :** ~50-80 MB
- **APK Release (non optimisé) :** ~30-50 MB
- **APK Release (optimisé) :** ~20-35 MB

## ✅ Checklist avant compilation

- [ ] Dépendances installées (`npm install`)
- [ ] Variables d'environnement configurées
- [ ] Backend accessible (si mode local)
- [ ] Keystore configuré (pour release)
- [ ] Version et versionCode mis à jour dans `app.json`
- [ ] Tests effectués en mode debug

## 📝 Notes importantes

1. **APK vs AAB :** 
   - APK : Pour installation directe et tests
   - AAB (Android App Bundle) : Requis pour Google Play Store

2. **Architectures :** 
   - Le projet est configuré pour `arm64-v8a` uniquement (voir `gradle.properties`)
   - Pour supporter d'autres architectures, modifiez `reactNativeArchitectures`

3. **Nouvelle architecture React Native :** 
   - Activée par défaut (`newArchEnabled=true`)
   - Peut causer des problèmes avec certaines bibliothèques natives

4. **Hermes :** 
   - Activé par défaut pour de meilleures performances
   - Peut être désactivé dans `gradle.properties` si nécessaire

## 🔗 Ressources

- [Documentation Expo](https://docs.expo.dev/)
- [Documentation React Native](https://reactnative.dev/)
- [Guide Android Gradle](https://developer.android.com/studio/build)
