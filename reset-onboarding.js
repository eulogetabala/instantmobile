// Script pour réinitialiser l'onboarding (pour les tests)
// Utilisation: node reset-onboarding.js

const AsyncStorage = require('@react-native-async-storage/async-storage');

async function resetOnboarding() {
  try {
    await AsyncStorage.removeItem('hasSeenOnboarding');
    console.log('✅ Onboarding réinitialisé ! L\'onboarding s\'affichera au prochain lancement.');
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error);
  }
}

resetOnboarding();
