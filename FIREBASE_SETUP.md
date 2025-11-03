# 🔥 Configuration Firebase pour Instant+

## 📋 Étapes de configuration

### 1. **Configuration Firebase Console**

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez **Cloud Messaging** dans les fonctionnalités
4. Ajoutez votre application Android/iOS

### 2. **Configuration Android**

#### A. Télécharger google-services.json
1. Dans Firebase Console → Project Settings → Your apps
2. Téléchargez le fichier `google-services.json`
3. Placez-le à la racine du projet mobile (déjà fait ✅)

#### B. Configuration build.gradle
Ajoutez dans `android/build.gradle` (niveau projet) :
```gradle
buildscript {
  dependencies {
    // Add the dependency for the Google services Gradle plugin
    id("com.google.gms.google-services") version "4.4.3" apply false
  }
}
```

Ajoutez dans `android/app/build.gradle` :
```gradle
plugins {
  id("com.android.application")
  // Add the Google services Gradle plugin
  id("com.google.gms.google-services")
  // ...
}

dependencies {
  // Import the Firebase BoM
  implementation(platform("com.google.firebase:firebase-bom:34.3.0"))
  
  // Firebase Analytics
  implementation("com.google.firebase:firebase-analytics")
  
  // Firebase Messaging pour les notifications push
  implementation("com.google.firebase:firebase-messaging")
}
```

### 3. **Configuration iOS** (à faire plus tard)

1. Téléchargez `GoogleService-Info.plist`
2. Ajoutez-le au projet iOS
3. Configurez les capacités push notifications

### 4. **Variables d'environnement**

Créez un fichier `.env` à la racine du projet mobile :

```env
# Configuration Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
EXPO_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key

# Configuration Expo
EXPO_PROJECT_ID=your-expo-project-id
```

### 5. **Configuration Backend**

Dans `backend/.env`, ajoutez :

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_X509_CERT_URL=your-cert-url
```

### 6. **Test des notifications**

1. Lancez l'application
2. Allez dans **Paramètres** → **Tester les notifications**
3. Vérifiez que la notification de test s'affiche

## 🔧 Dépannage

### Problème : Token FCM non obtenu
- Vérifiez que `google-services.json` est bien placé
- Vérifiez les permissions de notification
- Testez sur un appareil physique (pas d'émulateur)

### Problème : Notifications non reçues
- Vérifiez la configuration Firebase Console
- Vérifiez les variables d'environnement
- Vérifiez les logs du backend

## 📱 Types de notifications supportées

- ✅ **Rappels d'événements** : 30 min avant le début
- ✅ **Début d'événement** : Quand un événement commence
- ✅ **Paiement confirmé** : Après un achat réussi
- ✅ **Nouveaux événements** : Annonce de nouveaux événements
- ✅ **Replays disponibles** : Quand un replay est prêt

## 🚀 Prochaines étapes

1. ✅ Configurer Firebase Console
2. ✅ Ajouter google-services.json
3. ✅ Configurer build.gradle
4. ⏳ Configurer iOS (plus tard)
5. ⏳ Tester les notifications
6. ⏳ Configurer le backend avec les vraies clés
