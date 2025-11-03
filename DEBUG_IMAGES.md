# Guide de débogage des images

## Problème identifié

Le backend retourne des URLs comme `http://localhost:5001/uploads/events/...` mais le mobile ne peut pas les charger car :
- Sur Android Emulator : `localhost` ne fonctionne pas, il faut utiliser `10.0.2.2`
- Sur iOS Simulator : `localhost` fonctionne parfois
- Sur iOS Device : Il faut utiliser l'IP locale de votre machine (ex: `192.168.1.100`)

## Solution actuelle

Le composant `EventImage` devrait automatiquement convertir `localhost` en l'IP correcte selon la plateforme.

## Comment vérifier que ça fonctionne

### 1. Vérifier l'API backend

```bash
curl http://localhost:5001/api/events | jq '.data.events[0].media.poster'
```

Devrait retourner une URL comme : `http://localhost:5001/uploads/events/...`

### 2. Tester depuis le mobile

Dans la console du mobile (React Native Debugger ou console Expo), cherchez :
- `✅ EventImage - Image chargée avec succès` → Image backend chargée
- `⚠️ EventImage - Erreur chargement image backend` → Bascule vers image locale

### 3. Vérifier la conversion localhost

Pour Android Emulator, l'URL devrait être convertie en `http://10.0.2.2:5001/uploads/events/...`

Pour iOS Device, vous devez définir `EXPO_PUBLIC_LOCAL_IP` dans votre `.env` :

```env
EXPO_PUBLIC_LOCAL_IP=192.168.1.100  # Votre IP locale
```

### 4. Si les images ne se chargent toujours pas

1. **Vérifier que le serveur backend est accessible**
   - Depuis votre ordinateur : `curl http://localhost:5001/health`
   - Depuis le mobile : Tester avec `http://<VOTRE_IP>:5001/health`

2. **Vérifier que les fichiers existent**
   ```bash
   ls -la backend/uploads/events/
   ```

3. **Vérifier les logs du composant**
   - Ouvrir React Native Debugger
   - Chercher les logs `EventImage` dans la console

4. **Tester avec une URL externe**
   - Créer un événement avec une image Cloudinary
   - Vérifier si elle se charge correctement

## Solutions alternatives

### Option 1 : Utiliser Cloudinary pour toutes les images

Modifier le backend pour uploader toutes les images sur Cloudinary au lieu du stockage local.

### Option 2 : Utiliser ngrok pour exposer le backend

```bash
ngrok http 5001
```

Puis utiliser l'URL ngrok dans `API_CONFIG.baseURL`.

### Option 3 : Utiliser un serveur de développement accessible

Déployer le backend sur un service accessible depuis le mobile (Render, Heroku, etc.)

