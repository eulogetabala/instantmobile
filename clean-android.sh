#!/bin/bash

# Script de nettoyage complet pour Android
# Usage: ./clean-android.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧹 Nettoyage complet du projet Android...${NC}"
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur: Ce script doit être exécuté depuis le dossier mobile/${NC}"
    exit 1
fi

# Nettoyer les builds Android
if [ -d "android" ]; then
    echo -e "${YELLOW}📱 Nettoyage du dossier android...${NC}"
    cd android
    
    # Nettoyer Gradle
    ./gradlew clean 2>/dev/null || true
    
    # Supprimer les dossiers de build
    rm -rf app/build
    rm -rf app/.cxx
    rm -rf build
    rm -rf .gradle
    
    # Supprimer les fichiers codegen générés
    find . -type d -name "codegen" -exec rm -rf {} + 2>/dev/null || true
    find . -type d -path "*/build/generated/source/codegen" -exec rm -rf {} + 2>/dev/null || true
    
    cd ..
    echo -e "${GREEN}✓ Dossier android nettoyé${NC}"
fi

# Nettoyer le cache Metro
if [ -d ".metro" ]; then
    echo -e "${YELLOW}📦 Nettoyage du cache Metro...${NC}"
    rm -rf .metro
    echo -e "${GREEN}✓ Cache Metro nettoyé${NC}"
fi

# Nettoyer le cache Expo
if [ -d ".expo" ]; then
    echo -e "${YELLOW}📦 Nettoyage du cache Expo...${NC}"
    rm -rf .expo
    echo -e "${GREEN}✓ Cache Expo nettoyé${NC}"
fi

echo ""
echo -e "${GREEN}✅ Nettoyage terminé !${NC}"
echo ""
echo -e "${YELLOW}💡 Vous pouvez maintenant exécuter:${NC}"
echo -e "   npx expo prebuild --platform android --clean"
echo -e "   ou"
echo -e "   ./build-apk.sh release production"



