import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useAdvancedNotifications } from '../../hooks/useAdvancedNotifications';
import { brandColors, typography, borderRadius, shadows } from '../../constants/theme';
import { NotificationHistory } from '../../services/notifications/advanced';

const NotificationHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  const { 
    history, 
    unreadCount, 
    loading, 
    error, 
    loadHistory, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useAdvancedNotifications();
  
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: NotificationHistory) => {
    if (!notification.read) {
      try {
        await markAsRead(notification.id);
      } catch (error) {
        console.error('Erreur lors du marquage comme lu:', error);
      }
    }
  };

  const handleDeleteNotification = (notification: NotificationHistory) => {
    Alert.alert(
      'Supprimer la notification',
      'Voulez-vous supprimer cette notification ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNotification(notification.id);
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la notification');
            }
          },
        },
      ]
    );
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount === 0) return;

    Alert.alert(
      'Marquer tout comme lu',
      `Voulez-vous marquer les ${unreadCount} notifications non lues comme lues ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Marquer tout',
          onPress: async () => {
            try {
              await markAllAsRead();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de marquer toutes les notifications');
            }
          },
        },
      ]
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'event':
        return 'calendar';
      case 'payment':
        return 'card';
      case 'streaming':
        return 'videocam';
      case 'favorite':
        return 'heart';
      case 'organizer':
        return 'business';
      case 'system':
        return 'settings';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'event':
        return brandColors.primary;
      case 'payment':
        return brandColors.success;
      case 'streaming':
        return brandColors.warning;
      case 'favorite':
        return brandColors.error;
      case 'organizer':
        return brandColors.info;
      case 'system':
        return brandColors.mediumGray;
      default:
        return brandColors.primary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Il y a moins d\'une heure';
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)} heures`;
    } else if (diffInHours < 48) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  const renderNotificationItem = ({ item }: { item: NotificationHistory }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.read && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.notificationContent}>
        <View style={[
          styles.notificationIcon,
          { backgroundColor: getNotificationColor(item.type) + '15' }
        ]}>
          <Ionicons 
            name={getNotificationIcon(item.type) as any} 
            size={20} 
            color={getNotificationColor(item.type)} 
          />
        </View>
        
        <View style={styles.notificationText}>
          <Text style={[
            styles.notificationTitle,
            !item.read && styles.unreadText
          ]}>
            {item.title}
          </Text>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.notificationDate}>
            {formatDate(item.sentAt)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteNotification(item)}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={18} color={brandColors.mediumGray} />
        </TouchableOpacity>
      </View>
      
      {!item.read && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-outline" size={80} color={brandColors.lightGray} />
      <Text style={styles.emptyStateTitle}>Aucune notification</Text>
      <Text style={styles.emptyStateSubtitle}>
        Vos notifications apparaîtront ici
      </Text>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[brandColors.primary, '#FF8A50']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={brandColors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Historique</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>
        
        <View style={styles.authRequired}>
          <Ionicons name="lock-closed" size={60} color={brandColors.lightGray} />
          <Text style={styles.authRequiredTitle}>Connexion requise</Text>
          <Text style={styles.authRequiredSubtitle}>
            Connectez-vous pour voir votre historique de notifications
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => (navigation as any).navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header avec gradient orange */}
      <LinearGradient
        colors={[brandColors.primary, '#FF8A50']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={brandColors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Historique</Text>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={handleMarkAllAsRead}
              activeOpacity={0.8}
            >
              <Text style={styles.markAllButtonText}>Tout marquer</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Compteur de notifications non lues */}
      {unreadCount > 0 && (
        <View style={styles.unreadCounter}>
          <Text style={styles.unreadCounterText}>
            {unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Liste des notifications */}
      <FlatList
        data={history}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[brandColors.primary]}
            tintColor={brandColors.primary}
          />
        }
        ListEmptyComponent={!loading ? renderEmptyState : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    ...shadows.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    textTransform: 'none',
  },
  placeholder: {
    width: 40,
  },
  markAllButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
  },
  markAllButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.white,
    textTransform: 'none',
  },
  unreadCounter: {
    backgroundColor: brandColors.primary + '10',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.lightGray + '30',
  },
  unreadCounterText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.primary,
    textAlign: 'center',
    textTransform: 'none',
  },
  listContent: {
    padding: 16,
  },
  notificationItem: {
    backgroundColor: brandColors.white,
    borderRadius: borderRadius.lg,
    marginBottom: 12,
    overflow: 'hidden',
    ...shadows.sm,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: brandColors.primary,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
    marginRight: 12,
  },
  notificationTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.darkGray,
    marginBottom: 4,
    textTransform: 'none',
  },
  unreadText: {
    color: brandColors.darkGray,
    fontWeight: 'bold',
  },
  notificationMessage: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
    lineHeight: 18,
    marginBottom: 8,
    textTransform: 'none',
  },
  notificationDate: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.lightGray,
    textTransform: 'none',
  },
  deleteButton: {
    padding: 8,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: brandColors.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.darkGray,
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'none',
  },
  emptyStateSubtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
    textAlign: 'center',
    lineHeight: 22,
    textTransform: 'none',
  },
  authRequired: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  authRequiredTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.darkGray,
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'none',
  },
  authRequiredSubtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    textTransform: 'none',
  },
  loginButton: {
    backgroundColor: brandColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: borderRadius.lg,
  },
  loginButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.white,
    textTransform: 'none',
  },
});

export default NotificationHistoryScreen;
