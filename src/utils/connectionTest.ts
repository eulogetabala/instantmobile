import { apiService } from '../services/api';
import { API_CONFIG } from '../constants';

/**
 * Teste la connexion au backend et affiche des informations détaillées
 */
export const testBackendConnection = async (): Promise<void> => {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🔍 TEST DE CONNEXION AU BACKEND');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('📋 Configuration actuelle:');
  console.log('   Base URL:', API_CONFIG.baseURL);
  console.log('   Timeout:', API_CONFIG.timeout, 'ms');
  console.log('');

  const result = await apiService.testConnection();

  console.log('\n📊 Résultat du test:');
  console.log('   Succès:', result.success ? '✅' : '❌');
  console.log('   Accessible:', result.reachable ? '✅' : '❌');
  
  if (result.responseTime) {
    console.log('   Temps de réponse:', result.responseTime, 'ms');
  }
  
  if (result.error) {
    console.log('   Erreur:', result.error);
  }
  
  if (result.details) {
    console.log('   Détails:', JSON.stringify(result.details, null, 2));
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');

  if (!result.success) {
    console.log('💡 Actions recommandées:');
    console.log('   1. Vérifiez que le backend est démarré:');
    console.log('      cd backend && npm start');
    console.log('');
    console.log('   2. Vérifiez l\'URL du backend:');
    console.log('      Actuel:', API_CONFIG.baseURL);
    console.log('      Health check:', API_CONFIG.baseURL.replace('/api', '') + '/health');
    console.log('');
    console.log('   3. Testez depuis un navigateur ou curl:');
    const healthUrl = API_CONFIG.baseURL.replace('/api', '') + '/health';
    console.log('      curl', healthUrl);
    console.log('');
    console.log('   4. Vérifiez le firewall:');
    console.log('      - macOS: Préférences Système > Sécurité > Pare-feu');
    console.log('      - Autorisez Node.js dans les exceptions');
    console.log('');
    console.log('   5. Pour Android Emulator, utilisez:');
    console.log('      export EXPO_PUBLIC_LOCAL_IP=10.0.2.2');
    console.log('');
    console.log('   6. Pour appareil physique, utilisez votre IP locale:');
    console.log('      export EXPO_PUBLIC_LOCAL_IP=192.168.1.XXX');
    console.log('');
  }
};

/**
 * Trouve un backend accessible parmi plusieurs URLs possibles
 */
export const findWorkingBackend = async (): Promise<string | null> => {
  console.log('\n🔍 Recherche d\'un backend accessible...\n');
  
  const workingUrl = await apiService.findWorkingBackend();
  
  if (workingUrl) {
    console.log('✅ Backend accessible trouvé:', workingUrl);
    console.log('💡 Vous pouvez utiliser cette URL avec:');
    console.log('   export EXPO_PUBLIC_API_URL=' + workingUrl);
  } else {
    console.log('❌ Aucun backend accessible trouvé');
    console.log('💡 Assurez-vous que le backend est démarré');
  }
  
  return workingUrl;
};







