# 🔧 Dépannage Firebase - Erreur Project ID

## ❌ **Erreur rencontrée**
```
ERROR Erreur lors de l'obtention du token FCM: [Error: No "projectId" found. If "projectId" can't be inferred from the manifest (for instance, in bare workflow), you have to pass it in yourself.]
```

## ✅ **Solutions appliquées**

### 1. **Configuration app.json mise à jour**
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "firecars-b2ed4"
      }
    }
  }
}
```

### 2. **Code Firebase amélioré**
```typescript
// Essayer d'abord le projectId Expo, puis Firebase
const expoProjectId = Constants.expoConfig?.extra?.eas?.projectId;
const firebaseProjectId = firebaseConfig.projectId;
const projectId = expoProjectId || firebaseProjectId;
```

### 3. **Logs de débogage ajoutés**
```typescript
console.log('🔧 Project ID Expo:', expoProjectId);
console.log('🔧 Project ID Firebase:', firebaseProjectId);
console.log('🔧 Project ID utilisé:', projectId);
```

## 🧪 **Tests à effectuer**

### 1. **Redémarrer l'application**
```bash
# Arrêter l'application
# Puis relancer
expo start --clear
```

### 2. **Vérifier les logs**
Dans la console, vous devriez voir :
```
🔧 Project ID Expo: firecars-b2ed4
🔧 Project ID Firebase: firecars-b2ed4
🔧 Project ID utilisé: firecars-b2ed4
```

### 3. **Test des notifications**
- Aller dans **Paramètres** → **Tester les notifications**
- Vérifier qu'aucune erreur n'apparaît

## 🔍 **Vérifications supplémentaires**

### 1. **Vérifier app.json**
```bash
cat app.json | grep -A 5 "extra"
```

### 2. **Vérifier les fichiers de configuration**
```bash
ls -la GoogleService-Info.plist
ls -la google-services.json
```

### 3. **Vérifier les logs de l'application**
- Ouvrir la console de l'application
- Chercher les messages de débogage Firebase

## 🚀 **Solutions alternatives**

### Si le problème persiste :

1. **Utiliser directement le projectId Firebase** :
   ```typescript
   const token = await Notifications.getExpoPushTokenAsync({
     projectId: 'firecars-b2ed4',
   });
   ```

2. **Vérifier la configuration Expo** :
   ```bash
   expo doctor
   ```

3. **Nettoyer le cache** :
   ```bash
   expo start --clear
   ```

## 📊 **État attendu**

Après les corrections, vous devriez voir :
- ✅ Aucune erreur de projectId
- ✅ Token FCM obtenu avec succès
- ✅ Notifications de test fonctionnelles
- ✅ Tests Firebase complets passent

## 🎯 **Prochaines étapes**

1. ✅ **Redémarrer l'application**
2. ✅ **Vérifier les logs**
3. ✅ **Tester les notifications**
4. ✅ **Confirmer que tout fonctionne**

**L'erreur devrait être résolue après le redémarrage !** 🎉
