# Instructions pour construire l'APK

## Méthode 1 : Build local avec Gradle (Recommandé pour test rapide)

```bash
cd mobile
npm run build:android
```

L'APK sera généré dans : `android/app/build/outputs/apk/debug/app-debug.apk`

## Méthode 2 : Build avec Expo CLI

```bash
cd mobile
npx expo run:android --variant release
```

## Méthode 3 : Build avec EAS (Cloud)

```bash
cd mobile
eas build --platform android --profile preview
```

## Installation sur appareil physique

1. Transférez l'APK sur votre appareil Android
2. Activez "Sources inconnues" dans les paramètres Android
3. Installez l'APK depuis le gestionnaire de fichiers

## Important pour tester les images

Assurez-vous que votre appareil mobile et votre Mac sont sur le même réseau WiFi, puis :

1. Trouvez l'IP locale de votre Mac :
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
   
2. Créez un fichier `.env` dans le dossier `mobile/` avec :
   ```
   EXPO_PUBLIC_LOCAL_IP=192.168.1.XXX  # Remplacez par l'IP de votre Mac
   ```

3. Reconstruisez l'APK après avoir défini l'IP :
   ```bash
   npm run build:android
   ```

Les images du backend seront accessibles via cette IP au lieu de `localhost`.


