import { apiService } from '../api';

export interface NotificationSettings {
  id: string;
  userId: string;
  // Notifications générales
  general: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  // Notifications d'événements
  events: {
    newEvents: boolean;
    eventReminders: boolean;
    eventStart: boolean;
    eventEnd: boolean;
    eventCancelled: boolean;
    eventPostponed: boolean;
  };
  // Notifications de paiement
  payments: {
    paymentConfirmed: boolean;
    paymentFailed: boolean;
    refundProcessed: boolean;
    paymentReminder: boolean;
  };
  // Notifications de streaming
  streaming: {
    liveStarted: boolean;
    replayAvailable: boolean;
    streamQuality: boolean;
    streamIssues: boolean;
  };
  // Notifications de favoris
  favorites: {
    favoriteEventStarting: boolean;
    favoriteEventCancelled: boolean;
    newEventsInFavoriteCategories: boolean;
  };
  // Notifications d'organisateur (si applicable)
  organizer: {
    ticketSales: boolean;
    eventAnalytics: boolean;
    attendeeFeedback: boolean;
    paymentIssues: boolean;
  };
  // Préférences de timing
  timing: {
    reminderMinutes: number[]; // [30, 60, 120] minutes avant
    quietHours: {
      enabled: boolean;
      start: string; // "22:00"
      end: string;   // "08:00"
    };
    timezone: string;
  };
  // Fréquence des notifications
  frequency: {
    digest: 'none' | 'daily' | 'weekly';
    maxPerDay: number;
    priorityOnly: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NotificationHistory {
  id: string;
  userId: string;
  type: 'event' | 'payment' | 'streaming' | 'favorite' | 'organizer' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  actionTaken?: string;
}

export interface GetNotificationHistoryResponse {
  notifications: NotificationHistory[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
  unreadCount: number;
}

class AdvancedNotificationService {
  // Obtenir les paramètres de notifications de l'utilisateur
  async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const response = await apiService.get<NotificationSettings>('/notifications/settings');

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la récupération des paramètres');
      }
    } catch (error) {
      console.error('Erreur getNotificationSettings:', error);
      throw error;
    }
  }

  // Mettre à jour les paramètres de notifications
  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    try {
      const response = await apiService.put<NotificationSettings>('/notifications/settings', settings);

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la mise à jour des paramètres');
      }
    } catch (error) {
      console.error('Erreur updateNotificationSettings:', error);
      throw error;
    }
  }

  // Obtenir l'historique des notifications
  async getNotificationHistory(page: number = 1, limit: number = 20): Promise<GetNotificationHistoryResponse> {
    try {
      const response = await apiService.get<GetNotificationHistoryResponse>('/notifications/history', {
        params: { page, limit },
      });

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la récupération de l\'historique');
      }
    } catch (error) {
      console.error('Erreur getNotificationHistory:', error);
      throw error;
    }
  }

  // Marquer une notification comme lue
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const response = await apiService.patch(`/notifications/${notificationId}/read`);

      if (!response.success) {
        throw new Error(response.error?.message || 'Erreur lors du marquage comme lu');
      }
    } catch (error) {
      console.error('Erreur markAsRead:', error);
      throw error;
    }
  }

  // Marquer toutes les notifications comme lues
  async markAllAsRead(): Promise<void> {
    try {
      const response = await apiService.patch('/notifications/mark-all-read');

      if (!response.success) {
        throw new Error(response.error?.message || 'Erreur lors du marquage de toutes les notifications');
      }
    } catch (error) {
      console.error('Erreur markAllAsRead:', error);
      throw error;
    }
  }

  // Supprimer une notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const response = await apiService.delete(`/notifications/${notificationId}`);

      if (!response.success) {
        throw new Error(response.error?.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur deleteNotification:', error);
      throw error;
    }
  }

  // Obtenir le nombre de notifications non lues
  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiService.get<{ count: number }>('/notifications/unread-count');

      if (response.success && response.data) {
        return response.data.count;
      } else {
        return 0;
      }
    } catch (error) {
      console.error('Erreur getUnreadCount:', error);
      return 0;
    }
  }

  // Tester les paramètres de notifications
  async testNotificationSettings(): Promise<void> {
    try {
      const response = await apiService.post('/notifications/test-settings');

      if (!response.success) {
        throw new Error(response.error?.message || 'Erreur lors du test des paramètres');
      }
    } catch (error) {
      console.error('Erreur testNotificationSettings:', error);
      throw error;
    }
  }

  // Réinitialiser les paramètres par défaut
  async resetToDefaults(): Promise<NotificationSettings> {
    try {
      const response = await apiService.post<NotificationSettings>('/notifications/reset-defaults');

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la réinitialisation');
      }
    } catch (error) {
      console.error('Erreur resetToDefaults:', error);
      throw error;
    }
  }
}

export const advancedNotificationService = new AdvancedNotificationService();
