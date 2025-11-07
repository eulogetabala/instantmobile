# Correction des erreurs npm

## Problème

Lors de l'utilisation de `npm ci` (notamment avec EAS Build), vous obtenez des erreurs indiquant que plusieurs packages sont manquants dans le `package-lock.json` :

```
npm error Missing: react-art@16.13.1 from lock file
npm error Missing: react-dom@16.14.0 from lock file
npm error Missing: react-native-web@0.9.13 from lock file
...
```

## Solution

Le `package-lock.json` était désynchronisé avec `package.json`. Il a été régénéré avec :

```bash
cd mobile
rm -f package-lock.json
npm install
```

## Vérification

Vérifiez que le fichier `package-lock.json` existe et est à jour :

```bash
ls -lh package-lock.json
```

## Pour EAS Build

Si vous utilisez EAS Build, assurez-vous que le `package-lock.json` est commité dans votre dépôt Git :

```bash
git add package-lock.json
git commit -m "Fix: Update package-lock.json"
git push
```

## Note importante

- **Ne supprimez jamais** `package-lock.json` en production sans le régénérer
- **Commitez toujours** `package-lock.json` dans votre dépôt Git
- Utilisez `npm install` pour mettre à jour, pas `npm ci` si le lock file est corrompu

