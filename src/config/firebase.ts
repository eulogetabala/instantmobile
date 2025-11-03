import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Configuration Firebase - Projet Firecars (iOS + Android)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDn-vou88F1KRf6USn_F2Ne6yfcpswEd2M", // iOS API Key
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "firecars-b2ed4.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "firecars-b2ed4",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "firecars-b2ed4.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "83910631762",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:83910631762:ios:4cb067016e347bd0dada8b", // iOS App ID
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Fonction pour obtenir le token FCM
export const getFCMToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      // Pour le web
      const messaging = getMessaging(app);
      const token = await getToken(messaging, {
        vapidKey: process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY || 'your-vapid-key',
      });
      return token;
    } else {
      // Pour mobile (iOS/Android) - utilise Expo Notifications
      const expoProjectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      console.log('🔧 Project ID Expo:', expoProjectId);
      
      // Vérifier si le projectId Expo est valide (doit être un UUID)
      if (expoProjectId && expoProjectId !== 'your-expo-project-uuid-here') {
        console.log('✅ Utilisation du projectId Expo:', expoProjectId);
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: expoProjectId,
        });
        return token.data;
      } else {
        console.log('⚠️ ProjectId Expo non configuré ou invalide, utilisation de Firebase direct');
        // Fallback : utiliser Firebase directement sans Expo Notifications
        return null;
      }
    }
  } catch (error) {
    console.error('Erreur lors de l\'obtention du token FCM:', error);
    return null;
  }
};

// Fonction pour écouter les messages en arrière-plan (web uniquement)
export const setupBackgroundMessageListener = () => {
  if (Platform.OS === 'web') {
    const messaging = getMessaging(app);
    
    onMessage(messaging, (payload) => {
      console.log('Message reçu en arrière-plan:', payload);
      
      // Afficher une notification personnalisée
      if (payload.notification) {
        // Vous pouvez implémenter votre propre système de notification ici
        console.log('Notification:', payload.notification);
      }
    });
  }
};

// Fonction pour demander les permissions de notification
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      // Pour le web, demander la permission
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } else {
      // Pour mobile, utiliser Expo Notifications
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    }
  } catch (error) {
    console.error('Erreur lors de la demande de permission:', error);
    return false;
  }
};

export default app;
