import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { notificationService } from '../services/notifications';
import { getFCMToken, requestNotificationPermissions, setupBackgroundMessageListener } from '../config/firebase';

export const useNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    initializeNotifications();
    
    return () => {
      if (notificationListener.current) {
        try {
          Notifications.removeNotificationSubscription(notificationListener.current);
        } catch (error) {
          console.log('⚠️ Erreur lors de la suppression du listener:', error);
        }
      }
      if (responseListener.current) {
        try {
          Notifications.removeNotificationSubscription(responseListener.current);
        } catch (error) {
          console.log('⚠️ Erreur lors de la suppression du response listener:', error);
        }
      }
    };
  }, []);

  const initializeNotifications = async () => {
    try {
      // Demander les permissions
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        console.log('❌ Permission de notification refusée');
        return;
      }

      // Configurer les listeners de messages en arrière-plan (web)
      setupBackgroundMessageListener();

      // Obtenir le token FCM
      const token = await getFCMToken();
      if (token) {
        setExpoPushToken(token);
        // Enregistrer le token sur le serveur
        await notificationService.registerDeviceToken(token);
        console.log('✅ Token FCM obtenu et enregistré:', token);
      }

      // Écouter les notifications reçues
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        setNotification(notification);
        console.log('📱 Notification reçue:', notification);
      });

      // Écouter les interactions avec les notifications
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('👆 Notification cliquée:', response);
        handleNotificationResponse(response);
      });

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des notifications:', error);
    }
  };


  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const { notification } = response;
    const data = notification.request.content.data;

    console.log('📱 Données de la notification:', data);

    // Traiter les différents types de notifications
    if (data?.type) {
      switch (data.type) {
        case 'event_start':
          // Navigation vers l'événement en direct
          console.log('🎪 Événement démarré:', data.eventId);
          break;
        case 'event_reminder':
          // Navigation vers les détails de l'événement
          console.log('⏰ Rappel d\'événement:', data.eventId);
          break;
        case 'payment_success':
          // Navigation vers les billets
          console.log('💳 Paiement réussi:', data.paymentId);
          break;
        case 'new_event':
          // Navigation vers les événements
          console.log('🆕 Nouvel événement:', data.eventId);
          break;
        case 'replay_available':
          // Navigation vers les replays
          console.log('📺 Replay disponible:', data.eventId);
          break;
        default:
          console.log('📱 Notification générique:', data);
      }
    }
  };

  const sendTestNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Test Instant+",
          body: 'Ceci est une notification de test !',
          data: { type: 'test' },
        },
        trigger: { seconds: 2 },
      });
      console.log('✅ Notification de test programmée');
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de la notification de test:', error);
    }
  };

  const clearNotification = () => {
    setNotification(null);
  };

  return {
    expoPushToken,
    notification,
    sendTestNotification,
    clearNotification,
  };
};
