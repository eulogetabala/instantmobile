#!/bin/bash

# Script pour push avec un token GitHub
# Usage: ./push-with-token.sh VOTRE_TOKEN

if [ -z "$1" ]; then
    echo "Usage: ./push-with-token.sh VOTRE_TOKEN_GITHUB"
    echo ""
    echo "Pour obtenir un token :"
    echo "1. Allez sur https://github.com/settings/tokens"
    echo "2. Cliquez sur 'Generate new token (classic)'"
    echo "3. Sélectionnez 'repo' dans les permissions"
    echo "4. Copiez le token généré"
    exit 1
fi

TOKEN=$1

# Ajouter les fichiers
git add package-lock.json package.json .npmrc

# Commit
git commit -m "Fix: Add missing dependencies for EAS Build compatibility

- Add react-art, react-dom, react-native-web as devDependencies
- Update package-lock.json with all transitive dependencies
- Add .npmrc with legacy-peer-deps configuration"

# Push avec le token
git push https://${TOKEN}@github.com/eulogetabala/instantmobile.git

echo ""
echo "✅ Push réussi !"
echo "Vous pouvez maintenant relancer votre build EAS :"
echo "  eas build --platform android --profile preview"

