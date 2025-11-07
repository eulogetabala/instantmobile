# 📱 Guide de compilation avec EAS Build

Ce projet utilise **Expo Application Services (EAS)** pour compiler les applications Android et iOS.

## 🚀 Prérequis

1. **Compte Expo** : Créez un compte sur [expo.dev](https://expo.dev)
2. **EAS CLI** : Installez EAS CLI globalement ou utilisez `npx`

```bash
npm install -g eas-cli
# ou
npx eas-cli --version
```

3. **Connexion** : Connectez-vous à votre compte Expo

```bash
eas login
```

## 📋 Configuration du projet

Le projet est déjà configuré avec :
- `minSdkVersion: 24` pour Android
- Profils de build : `development`, `preview`, `production`
- Type de build : `apk` pour Android

### Configurer le Project ID

1. Lancez la configuration initiale :

```bash
eas build:configure
```

2. Suivez les instructions pour créer ou lier un projet EAS
3. Le `projectId` sera automatiquement ajouté à `app.json`

## 🔨 Compiler l'application

### Build Android (APK)

#### Build de preview (interne)
```bash
npm run build:android:preview
# ou
eas build --platform android --profile preview
```

#### Build de production
```bash
npm run build:android:production
# ou
eas build --platform android --profile production
```

#### Build de développement
```bash
eas build --platform android --profile development
```

### Build iOS

```bash
npm run build:ios
# ou
eas build --platform ios --profile production
```

## 📥 Télécharger l'APK

Après la compilation, vous pouvez :

1. **Via le site web** :
   - Allez sur [expo.dev](https://expo.dev)
   - Connectez-vous et accédez à votre projet
   - Téléchargez l'APK depuis l'onglet "Builds"

2. **Via la CLI** :
   ```bash
   eas build:list
   eas build:download [BUILD_ID]
   ```

## 📤 Soumettre au Play Store / App Store

### Android (Play Store)
```bash
npm run submit:android
# ou
eas submit --platform android --profile production
```

**Note** : Vous devez avoir un fichier `google-services.json` avec les credentials du service account Google Play.

### iOS (App Store)
```bash
npm run submit:ios
# ou
eas submit --platform ios --profile production
```

**Note** : Configurez vos credentials Apple dans `eas.json` :
- `appleId` : Votre email Apple Developer
- `ascAppId` : ID de votre app dans App Store Connect
- `appleTeamId` : Votre Team ID Apple

## ⚙️ Profils de build configurés

### 1. Development
- **Type** : Client de développement
- **Distribution** : Interne
- **Build** : Debug APK
- **Usage** : Développement et tests locaux

### 2. Preview
- **Type** : Version de prévisualisation
- **Distribution** : Interne
- **Build** : APK release
- **Usage** : Tests avec utilisateurs internes

### 3. Production
- **Type** : Version de production
- **Distribution** : Stores (Play Store / App Store)
- **Build** : APK/AAB signé
- **Usage** : Déploiement en production

## 🔍 Surveiller les builds

```bash
# Voir la liste des builds
eas build:list

# Voir les détails d'un build spécifique
eas build:view [BUILD_ID]

# Voir les logs en temps réel
eas build:watch
```

## 🐛 Dépannage

### Erreur : "Project ID not found"
```bash
eas build:configure
```

### Erreur : "Not authenticated"
```bash
eas login
```

### Build échoue avec erreurs de minSdkVersion
- Vérifiez que `app.json` contient `"minSdkVersion": 24`
- Vérifiez que `android/app/build.gradle` a `minSdkVersion 24`
- EAS Build devrait gérer automatiquement ces configurations

### Voir les logs complets
```bash
eas build:view [BUILD_ID] --logs
```

## 📚 Ressources

- [Documentation EAS Build](https://docs.expo.dev/build/introduction/)
- [Configuration EAS](https://docs.expo.dev/build/eas-json/)
- [Expo Dashboard](https://expo.dev)

## 🎯 Commandes rapides

```bash
# Build Android APK (preview)
npm run build:android:preview

# Build Android APK (production)
npm run build:android:production

# Build iOS
npm run build:ios

# Voir les builds
eas build:list

# Télécharger un build
eas build:download [BUILD_ID]
```






