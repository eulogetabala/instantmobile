import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../api';
import { STORAGE_KEYS, NOTIFICATION_TYPES } from '../../constants';

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'success' | 'error';
  data?: any;
  timestamp: string;
  read: boolean;
}

export interface NotificationSettings {
  push: boolean;
  email: boolean;
  sms: boolean;
  eventReminders: boolean;
  eventStart: boolean;
  eventEnd: boolean;
  paymentSuccess: boolean;
  paymentFailed: boolean;
  newEvents: boolean;
  eventCancelled: boolean;
  eventPostponed: boolean;
  replayAvailable: boolean;
}

class NotificationService {
  private fcmToken: string | null = null;
  private notificationSettings: NotificationSettings | null = null;

  constructor() {
    this.initializeNotifications();
  }

  private async initializeNotifications() {
    try {
      // Configuration des notifications
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Obtenir les paramètres de notification
      await this.loadNotificationSettings();

      // Enregistrer pour les notifications push
      await this.registerForPushNotifications();

    } catch (error) {
      console.error('Erreur lors de l\'initialisation des notifications:', error);
    }
  }

  // Enregistrer pour les notifications push
  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log('Les notifications push ne fonctionnent que sur un appareil physique');
        return null;
      }

      // Vérifier les permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permission de notification refusée');
        return null;
      }

      // Obtenir le token FCM
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      this.fcmToken = token.data;
      await AsyncStorage.setItem(STORAGE_KEYS.FCM_TOKEN, this.fcmToken);

      // Envoyer le token au serveur
      await this.sendTokenToServer(this.fcmToken);

      // Configurer les canaux de notification (Android)
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        await Notifications.setNotificationChannelAsync('events', {
          name: 'Événements',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        await Notifications.setNotificationChannelAsync('payments', {
          name: 'Paiements',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return this.fcmToken;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des notifications:', error);
      return null;
    }
  }

  // Envoyer le token FCM au serveur
  private async sendTokenToServer(token: string): Promise<void> {
    try {
      await apiService.post('/notifications/register-token', {
        token,
        platform: Platform.OS,
        deviceId: Device.osInternalBuildId,
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi du token au serveur:', error);
    }
  }

  // Programmer une notification locale
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: trigger || null,
      });

      return notificationId;
    } catch (error) {
      console.error('Erreur lors de la programmation de la notification:', error);
      throw error;
    }
  }

  // Programmer un rappel d'événement
  async scheduleEventReminder(
    eventId: string,
    eventTitle: string,
    startDate: Date,
    reminderMinutes: number = 15
  ): Promise<string> {
    try {
      const reminderDate = new Date(startDate.getTime() - reminderMinutes * 60 * 1000);
      
      return await this.scheduleLocalNotification(
        `Rappel: ${eventTitle}`,
        `L'événement commence dans ${reminderMinutes} minutes`,
        {
          type: NOTIFICATION_TYPES.EVENT_STARTING,
          eventId,
        },
        {
          date: reminderDate,
        }
      );
    } catch (error) {
      console.error('Erreur lors de la programmation du rappel:', error);
      throw error;
    }
  }

  // Annuler une notification
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la notification:', error);
    }
  }

  // Annuler toutes les notifications
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Erreur lors de l\'annulation de toutes les notifications:', error);
    }
  }

  // Obtenir les notifications programmées
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      return [];
    }
  }

  // Obtenir l'historique des notifications
  async getNotificationHistory(): Promise<NotificationData[]> {
    try {
      const response = await apiService.get<{ notifications: NotificationData[] }>(
        '/notifications/history'
      );

      if (response.success && response.data) {
        return response.data.notifications;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      return [];
    }
  }

  // Marquer une notification comme lue
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await apiService.put(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
    }
  }

  // Marquer toutes les notifications comme lues
  async markAllNotificationsAsRead(): Promise<void> {
    try {
      await apiService.put('/notifications/mark-all-read');
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications:', error);
    }
  }

  // Obtenir les paramètres de notification
  async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      if (this.notificationSettings) {
        return this.notificationSettings;
      }

      const response = await apiService.get<{ settings: NotificationSettings }>(
        '/notifications/settings'
      );

      if (response.success && response.data) {
        this.notificationSettings = response.data.settings;
        await AsyncStorage.setItem(
          STORAGE_KEYS.NOTIFICATION_SETTINGS,
          JSON.stringify(this.notificationSettings)
        );
        return this.notificationSettings;
      } else {
        // Paramètres par défaut
        return this.getDefaultNotificationSettings();
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres:', error);
      return this.getDefaultNotificationSettings();
    }
  }

  // Mettre à jour les paramètres de notification
  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
      const response = await apiService.put('/notifications/settings', settings);

      if (response.success) {
        this.notificationSettings = { ...this.notificationSettings, ...settings };
        await AsyncStorage.setItem(
          STORAGE_KEYS.NOTIFICATION_SETTINGS,
          JSON.stringify(this.notificationSettings)
        );
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la mise à jour des paramètres');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error);
      throw error;
    }
  }

  // Charger les paramètres depuis le stockage local
  private async loadNotificationSettings(): Promise<void> {
    try {
      const settings = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
      if (settings) {
        this.notificationSettings = JSON.parse(settings);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    }
  }

  // Obtenir les paramètres par défaut
  private getDefaultNotificationSettings(): NotificationSettings {
    return {
      push: true,
      email: true,
      sms: false,
      eventReminders: true,
      eventStart: true,
      eventEnd: false,
      paymentSuccess: true,
      paymentFailed: true,
      newEvents: true,
      eventCancelled: true,
      eventPostponed: true,
      replayAvailable: true,
    };
  }

  // Vérifier si les notifications sont activées
  async areNotificationsEnabled(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error);
      return false;
    }
  }

  // Demander les permissions de notification
  async requestNotificationPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Erreur lors de la demande de permissions:', error);
      return false;
    }
  }

  // Obtenir le token FCM
  getFCMToken(): string | null {
    return this.fcmToken;
  }

  // Configurer l'écouteur de notifications reçues
  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  // Configurer l'écouteur de notifications ouvertes
  addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  // Supprimer un écouteur
  removeNotificationSubscription(subscription: Notifications.Subscription): void {
    Notifications.removeNotificationSubscription(subscription);
  }

  // Obtenir le badge de notification
  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Erreur lors de la récupération du badge:', error);
      return 0;
    }
  }

  // Définir le badge de notification
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Erreur lors de la définition du badge:', error);
    }
  }

  // Supprimer le badge de notification
  async clearBadge(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Erreur lors de la suppression du badge:', error);
    }
  }

  // Envoyer une notification de test
  async sendTestNotification(): Promise<void> {
    try {
      await this.scheduleLocalNotification(
        'Test de notification',
        'Ceci est une notification de test pour vérifier que les notifications fonctionnent correctement.',
        {
          type: 'info',
          test: true,
        }
      );
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification de test:', error);
      throw error;
    }
  }

  // Enregistrer le token de device
  async registerDeviceToken(token: string): Promise<void> {
    try {
      await this.sendTokenToServer(token);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du token:', error);
      throw error;
    }
  }
}

// Instance singleton
export const notificationService = new NotificationService();
export default notificationService;

