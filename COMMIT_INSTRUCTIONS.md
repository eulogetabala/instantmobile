# Instructions pour commit les corrections npm

## Fichiers modifiés

Les fichiers suivants doivent être commités pour résoudre les erreurs npm dans EAS Build :

1. `package-lock.json` - Mis à jour avec toutes les dépendances
2. `package.json` - Ajout des dépendances manquantes (devDependencies)
3. `.npmrc` - Configuration npm pour gérer les peer dependencies

## Commandes à exécuter

```bash
cd mobile

# Vérifier les fichiers modifiés
git status

# Ajouter les fichiers
git add package-lock.json package.json .npmrc

# Commit
git commit -m "Fix: Add missing dependencies for EAS Build compatibility

- Add react-art, react-dom, react-native-web as devDependencies
- Update package-lock.json with all transitive dependencies
- Add .npmrc with legacy-peer-deps configuration"

# Push vers le dépôt
git push
```

## Après le push

Relancez votre build EAS :

```bash
eas build --platform android --profile preview
```

## Note

Les dépendances `react-art@16.13.1`, `react-dom@16.14.0`, et `react-native-web@0.9.13` sont nécessaires pour `modal-react-native-web` (dépendance de `react-native-country-picker-modal`). Elles sont installées comme devDependencies car elles ne sont utilisées que pour le build web, pas dans l'app mobile native.

