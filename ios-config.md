# 🍎 Configuration iOS pour Firebase

## 📋 **Étapes de configuration**

### 1. **Dans Firebase Console**
1. Allez dans **Project Settings** (⚙️)
2. Section **"Your apps"**
3. Cliquez sur **"Ajouter une application"**
4. Sélectionnez l'icône **iOS** 🍎
5. **Bundle ID** : `com.instant.app`
6. **App nickname** : "Instant+ iOS"
7. Téléchargez `GoogleService-Info.plist`

### 2. **Placer le fichier de configuration**
```bash
# Placez le fichier téléchargé dans le dossier mobile/
mobile/GoogleService-Info.plist
```

### 3. **Configuration app.json** ✅
Le fichier `app.json` a été mis à jour avec :
- `bundleIdentifier`: "com.instant.app"
- `googleServicesFile`: "./GoogleService-Info.plist"
- `UIBackgroundModes`: ["remote-notification"]

### 4. **Permissions iOS**
Les permissions suivantes sont automatiquement configurées :
- **Push Notifications** : Pour recevoir les notifications
- **Background Modes** : Pour traiter les notifications en arrière-plan

## 🔧 **Configuration automatique**

Une fois le fichier `GoogleService-Info.plist` placé, Expo configurera automatiquement :
- ✅ Firebase SDK pour iOS
- ✅ Permissions de notifications
- ✅ Background modes
- ✅ Bundle identifier

## 🧪 **Test iOS**

### 1. **Build pour iOS**
```bash
# Build pour iOS (nécessite un compte Apple Developer)
expo build:ios
```

### 2. **Test sur simulateur iOS**
```bash
# Lancer sur simulateur iOS
expo start --ios
```

### 3. **Test sur appareil iOS**
```bash
# Lancer sur appareil iOS physique
expo start --ios --device
```

## 📱 **Différences iOS vs Android**

| Fonctionnalité | Android | iOS |
|---|---|---|
| Fichier config | `google-services.json` | `GoogleService-Info.plist` |
| Permissions | Automatiques | Configurées dans app.json |
| Background | Automatique | `UIBackgroundModes` requis |
| Test | Émulateur OK | Appareil physique recommandé |

## 🚀 **Prochaines étapes**

1. ✅ **Télécharger GoogleService-Info.plist**
2. ✅ **Placer le fichier dans mobile/**
3. ✅ **Tester sur iOS**

**Une fois le fichier placé, iOS sera configuré automatiquement !** 🎉
