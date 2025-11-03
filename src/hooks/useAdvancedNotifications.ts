import { useState, useEffect, useCallback } from 'react';
import { advancedNotificationService, NotificationSettings, NotificationHistory } from '../services/notifications/advanced';
import { useAuth } from '../contexts/AuthContext';

export const useAdvancedNotifications = () => {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les paramètres de notifications
  const loadSettings = useCallback(async () => {
    if (!isAuthenticated) {
      setSettings(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const notificationSettings = await advancedNotificationService.getNotificationSettings();
      setSettings(notificationSettings);
    } catch (err) {
      console.error('Erreur lors du chargement des paramètres:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Charger l'historique des notifications
  const loadHistory = useCallback(async (page: number = 1) => {
    if (!isAuthenticated) {
      setHistory([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await advancedNotificationService.getNotificationHistory(page, 50);
      setHistory(response.notifications);
      setUnreadCount(response.unreadCount);
    } catch (err) {
      console.error('Erreur lors du chargement de l\'historique:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Charger le nombre de notifications non lues
  const loadUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    try {
      const count = await advancedNotificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Erreur lors du chargement du nombre de notifications non lues:', err);
    }
  }, [isAuthenticated]);

  // Mettre à jour les paramètres
  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    if (!isAuthenticated) {
      throw new Error('Vous devez être connecté pour modifier les paramètres');
    }

    try {
      setLoading(true);
      setError(null);
      const updatedSettings = await advancedNotificationService.updateNotificationSettings(newSettings);
      setSettings(updatedSettings);
      return updatedSettings;
    } catch (err) {
      console.error('Erreur lors de la mise à jour des paramètres:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Marquer une notification comme lue
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!isAuthenticated) {
      throw new Error('Vous devez être connecté pour marquer les notifications');
    }

    try {
      await advancedNotificationService.markAsRead(notificationId);
      setHistory(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true, readAt: new Date().toISOString() }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Erreur lors du marquage comme lu:', err);
      throw err;
    }
  }, [isAuthenticated]);

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('Vous devez être connecté pour marquer les notifications');
    }

    try {
      await advancedNotificationService.markAllAsRead();
      setHistory(prev => 
        prev.map(notification => ({ 
          ...notification, 
          read: true, 
          readAt: new Date().toISOString() 
        }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Erreur lors du marquage de toutes les notifications:', err);
      throw err;
    }
  }, [isAuthenticated]);

  // Supprimer une notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!isAuthenticated) {
      throw new Error('Vous devez être connecté pour supprimer les notifications');
    }

    try {
      await advancedNotificationService.deleteNotification(notificationId);
      setHistory(prev => prev.filter(notification => notification.id !== notificationId));
      // Décrémenter le compteur si la notification n'était pas lue
      const notification = history.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      throw err;
    }
  }, [isAuthenticated, history]);

  // Tester les paramètres
  const testSettings = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('Vous devez être connecté pour tester les paramètres');
    }

    try {
      await advancedNotificationService.testNotificationSettings();
    } catch (err) {
      console.error('Erreur lors du test des paramètres:', err);
      throw err;
    }
  }, [isAuthenticated]);

  // Réinitialiser les paramètres par défaut
  const resetToDefaults = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('Vous devez être connecté pour réinitialiser les paramètres');
    }

    try {
      setLoading(true);
      setError(null);
      const defaultSettings = await advancedNotificationService.resetToDefaults();
      setSettings(defaultSettings);
      return defaultSettings;
    } catch (err) {
      console.error('Erreur lors de la réinitialisation:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Charger les données au montage du composant
  useEffect(() => {
    if (isAuthenticated) {
      loadSettings();
      loadHistory();
      loadUnreadCount();
    } else {
      setSettings(null);
      setHistory([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, loadSettings, loadHistory, loadUnreadCount]);

  return {
    settings,
    history,
    unreadCount,
    loading,
    error,
    loadSettings,
    loadHistory,
    loadUnreadCount,
    updateSettings,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    testSettings,
    resetToDefaults,
  };
};
