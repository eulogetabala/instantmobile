import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { notificationService, NotificationData, NotificationSettings } from '../services/notifications';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  settings: NotificationSettings | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  scheduleEventReminder: (eventId: string, eventTitle: string, startDate: Date, reminderMinutes?: number) => Promise<string>;
  cancelEventReminder: (notificationId: string) => Promise<void>;
  clearError: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      initializeNotifications();
    } else {
      // Si l'utilisateur n'est pas connecté, réinitialiser l'état
      setNotifications([]);
      setSettings(null);
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const initializeNotifications = async () => {
    if (!isAuthenticated) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Charger les paramètres de notification
      const notificationSettings = await notificationService.getNotificationSettings();
      setSettings(notificationSettings);

      // Charger l'historique des notifications
      await loadNotifications();

    } catch (error) {
      // Ne pas logger les erreurs 401 comme des erreurs critiques
      if (error instanceof Error && error.message.includes('401')) {
        // Utilisateur non authentifié, c'est normal
        setNotifications([]);
        setSettings(null);
        return;
      }
      console.error('Erreur lors de l\'initialisation des notifications:', error);
      setError(error instanceof Error ? error.message : 'Erreur d\'initialisation');
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotifications = async (): Promise<void> => {
    try {
      setError(null);
      
      const notificationHistory = await notificationService.getNotificationHistory();
      setNotifications(notificationHistory);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
      setError(error instanceof Error ? error.message : 'Erreur de chargement');
    }
  };

  const markAsRead = async (notificationId: string): Promise<void> => {
    try {
      setError(null);
      
      await notificationService.markNotificationAsRead(notificationId);
      
      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
      setError(error instanceof Error ? error.message : 'Erreur de marquage');
    }
  };

  const markAllAsRead = async (): Promise<void> => {
    try {
      setError(null);
      
      await notificationService.markAllNotificationsAsRead();
      
      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications:', error);
      setError(error instanceof Error ? error.message : 'Erreur de marquage');
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>): Promise<void> => {
    try {
      setError(null);
      
      await notificationService.updateNotificationSettings(newSettings);
      
      // Mettre à jour l'état local
      setSettings(prev => prev ? { ...prev, ...newSettings } : null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error);
      setError(error instanceof Error ? error.message : 'Erreur de mise à jour');
      throw error;
    }
  };

  const scheduleEventReminder = async (
    eventId: string, 
    eventTitle: string, 
    startDate: Date, 
    reminderMinutes: number = 15
  ): Promise<string> => {
    try {
      setError(null);
      
      const notificationId = await notificationService.scheduleEventReminder(
        eventId,
        eventTitle,
        startDate,
        reminderMinutes
      );
      
      return notificationId;
    } catch (error) {
      console.error('Erreur lors de la programmation du rappel:', error);
      setError(error instanceof Error ? error.message : 'Erreur de programmation');
      throw error;
    }
  };

  const cancelEventReminder = async (notificationId: string): Promise<void> => {
    try {
      setError(null);
      
      await notificationService.cancelNotification(notificationId);
    } catch (error) {
      console.error('Erreur lors de l\'annulation du rappel:', error);
      setError(error instanceof Error ? error.message : 'Erreur d\'annulation');
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Calculer le nombre de notifications non lues
  const unreadCount = notifications.filter(notification => !notification.read).length;

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    settings,
    isLoading,
    error,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    updateSettings,
    scheduleEventReminder,
    cancelEventReminder,
    clearError,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications doit être utilisé dans un NotificationProvider');
  }
  return context;
};

export default NotificationContext;

