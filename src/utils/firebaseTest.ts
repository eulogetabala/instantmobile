import { getFCMToken, requestNotificationPermissions } from '../config/firebase';
import { notificationService } from '../services/notifications';

export const testFirebaseConfiguration = async () => {
  console.log('🔥 Test de la configuration Firebase...');
  
  try {
    // 1. Tester les permissions
    console.log('1️⃣ Test des permissions...');
    const hasPermission = await requestNotificationPermissions();
    console.log('✅ Permissions:', hasPermission ? 'Accordées' : 'Refusées');
    
    if (!hasPermission) {
      console.log('❌ Les permissions sont requises pour les notifications');
      return false;
    }
    
    // 2. Tester l'obtention du token
    console.log('2️⃣ Test de l\'obtention du token FCM...');
    const token = await getFCMToken();
    
    if (token) {
      console.log('✅ Token FCM obtenu:', token.substring(0, 20) + '...');
      
      // 3. Tester l'enregistrement du token
      console.log('3️⃣ Test de l\'enregistrement du token...');
      try {
        await notificationService.registerDeviceToken(token);
        console.log('✅ Token enregistré avec succès');
      } catch (error) {
        console.log('⚠️ Erreur lors de l\'enregistrement du token:', error);
      }
      
      return true;
    } else {
      console.log('❌ Impossible d\'obtenir le token FCM');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test Firebase:', error);
    return false;
  }
};

export const testNotificationSending = async () => {
  console.log('📱 Test d\'envoi de notification...');
  
  try {
    // Envoyer une notification de test
    await notificationService.sendTestNotification();
    console.log('✅ Notification de test envoyée');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de notification:', error);
    return false;
  }
};

export const runAllFirebaseTests = async () => {
  console.log('🧪 === TESTS FIREBASE COMPLETS ===');
  
  const configTest = await testFirebaseConfiguration();
  const notificationTest = await testNotificationSending();
  
  console.log('📊 Résultats des tests:');
  console.log('- Configuration Firebase:', configTest ? '✅' : '❌');
  console.log('- Envoi de notifications:', notificationTest ? '✅' : '❌');
  
  if (configTest && notificationTest) {
    console.log('🎉 Tous les tests Firebase sont passés !');
  } else {
    console.log('⚠️ Certains tests ont échoué. Vérifiez la configuration.');
  }
  
  return configTest && notificationTest;
};
