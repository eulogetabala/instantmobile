#!/bin/bash

# Script de compilation d'APK Android pour Instant+
# Usage: ./build-apk.sh [debug|release] [local|production]

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration par défaut
BUILD_TYPE=${1:-release}
API_MODE=${2:-production}

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🚀 Compilation APK Android - Instant+${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur: Ce script doit être exécuté depuis le dossier mobile/${NC}"
    exit 1
fi

# Vérifier les dépendances
echo -e "${YELLOW}📦 Vérification des dépendances...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Installation des dépendances...${NC}"
    npm install
fi

# Corriger minSdkVersion dans les modules problématiques
echo -e "${YELLOW}🔧 Correction de minSdkVersion dans les modules natifs...${NC}"
if [ -f "fix-minsdk.sh" ]; then
    ./fix-minsdk.sh
fi

# Configuration de l'API selon le mode
if [ "$API_MODE" = "local" ]; then
    echo -e "${YELLOW}🔧 Configuration pour backend local...${NC}"
    
    # Obtenir l'IP locale du Mac
    if [[ "$OSTYPE" == "darwin"* ]]; then
        LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)
    else
        LOCAL_IP=$(hostname -I | awk '{print $1}')
    fi
    
    if [ -z "$LOCAL_IP" ]; then
        echo -e "${RED}❌ Impossible de détecter l'IP locale${NC}"
        echo -e "${YELLOW}💡 Vous pouvez définir EXPO_PUBLIC_LOCAL_IP manuellement${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ IP locale détectée: ${LOCAL_IP}${NC}"
    export EXPO_PUBLIC_LOCAL_IP=$LOCAL_IP
    export EXPO_PUBLIC_USE_LOCALHOST=true
    export EXPO_PUBLIC_API_URL=""
else
    echo -e "${YELLOW}🔧 Configuration pour backend de production...${NC}"
    export EXPO_PUBLIC_USE_LOCALHOST=false
    export EXPO_PUBLIC_API_URL=""
fi

# Nettoyer complètement le projet
echo -e "${YELLOW}🧹 Nettoyage complet du projet...${NC}"

# Supprimer le dossier android complètement pour éviter les erreurs CMake
if [ -d "android" ]; then
    echo -e "${YELLOW}🗑️  Suppression du dossier android (sera régénéré)...${NC}"
    rm -rf android
fi

# Supprimer le dossier android et le régénérer
echo -e "${YELLOW}📱 Préparation du build Android (prebuild)...${NC}"
npx expo prebuild --platform android --clean

# Vérifier que le dossier android a été créé
if [ ! -d "android" ]; then
    echo -e "${RED}❌ Erreur: Le dossier android n'a pas été créé${NC}"
    exit 1
fi

# Compiler l'APK
echo -e "${BLUE}🔨 Compilation de l'APK (${BUILD_TYPE})...${NC}"
echo ""

if [ "$BUILD_TYPE" = "debug" ]; then
    cd android
    echo -e "${BLUE}Compilation en cours... (cela peut prendre plusieurs minutes)${NC}"
    ./gradlew assembleDebug --no-daemon
    cd ..
    
    APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo -e "${GREEN}✅ APK Debug compilé avec succès !${NC}"
else
    # Vérifier le keystore pour release
    if [ ! -f "android/app/debug.keystore" ]; then
        echo -e "${YELLOW}⚠️  Keystore debug non trouvé, création...${NC}"
        cd android/app
        keytool -genkeypair -v -storetype PKCS12 -keystore debug.keystore -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 -storepass android -keypass android
        cd ../..
    fi
    
    cd android
    echo -e "${BLUE}Compilation en cours... (cela peut prendre plusieurs minutes)${NC}"
    ./gradlew assembleRelease --no-daemon
    cd ..
    
    APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
    echo ""
    echo -e "${GREEN}✅ APK Release compilé avec succès !${NC}"
fi

# Afficher les informations de l'APK
if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}📦 APK généré avec succès !${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}📍 Emplacement:${NC} $(pwd)/$APK_PATH"
    echo -e "${BLUE}📏 Taille:${NC} $APK_SIZE"
    echo ""
    echo -e "${YELLOW}💡 Pour installer sur un appareil:${NC}"
    echo -e "   adb install $APK_PATH"
    echo ""
    echo -e "${YELLOW}💡 Ou transférez l'APK sur votre appareil et installez-le manuellement${NC}"
    echo ""
else
    echo -e "${RED}❌ Erreur: L'APK n'a pas été généré${NC}"
    exit 1
fi

