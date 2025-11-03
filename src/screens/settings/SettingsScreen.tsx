import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { brandColors, typography, borderRadius, shadows } from '../../constants/theme';
import { notificationService } from '../../services/notifications';
import { useNotifications } from '../../hooks/useNotifications';
import { runAllFirebaseTests } from '../../utils/firebaseTest';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { sendTestNotification } = useNotifications();
  
  const [notificationSettings, setNotificationSettings] = useState({
    push: true,
    email: false,
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
  });

  const [appSettings, setAppSettings] = useState({
    language: 'fr',
    autoPlay: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Charger les paramètres de notifications
      const notificationSettingsData = await notificationService.getNotificationSettings();
      setNotificationSettings(notificationSettingsData);

      // Charger les paramètres de l'app
      const appSettingsData = await AsyncStorage.getItem('app_settings');
      if (appSettingsData) {
        setAppSettings(JSON.parse(appSettingsData));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    }
  };

  const updateNotificationSettings = async (key: string, value: boolean) => {
    try {
      const newSettings = { ...notificationSettings, [key]: value };
      setNotificationSettings(newSettings);
      await notificationService.updateNotificationSettings({ [key]: value });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour les paramètres');
    }
  };

  const updateAppSettings = async (key: string, value: any) => {
    try {
      const newSettings = { ...appSettings, [key]: value };
      setAppSettings(newSettings);
      await AsyncStorage.setItem('app_settings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              navigation.goBack();
            } catch (error) {
              Alert.alert('Erreur', 'Erreur lors de la déconnexion');
            }
          },
        },
      ]
    );
  };


  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Découvrez Instant+, la meilleure plateforme d\'événements en direct !',
        url: 'https://instantplus.cd',
        title: 'Instant+',
      });
    } catch (error) {
      console.error('Erreur lors du partage:', error);
    }
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@instantplus.cd?subject=Support Instant+');
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://instantplus.cd/privacy');
  };

  const handleTermsOfService = () => {
    Linking.openURL('https://instantplus.cd/terms');
  };

  const handleTestFirebase = async () => {
    Alert.alert(
      'Test Firebase',
      'Voulez-vous lancer tous les tests Firebase ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Tester',
          onPress: async () => {
            try {
              const success = await runAllFirebaseTests();
              Alert.alert(
                'Résultats des tests',
                success 
                  ? 'Tous les tests Firebase sont passés ! ✅'
                  : 'Certains tests ont échoué. Vérifiez les logs. ⚠️'
              );
            } catch (error) {
              Alert.alert('Erreur', 'Erreur lors des tests Firebase');
            }
          },
        },
      ]
    );
  };

  const handleNotificationSettings = () => {
    (navigation as any).navigate('NotificationSettings');
  };

  const handleNotificationHistory = () => {
    (navigation as any).navigate('NotificationHistory');
  };

  const renderSettingItem = (
    title: string,
    subtitle: string,
    icon: keyof typeof Ionicons.glyphMap,
    onPress?: () => void,
    rightComponent?: React.ReactNode,
    iconColor: string = brandColors.primary
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.settingIcon, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      {rightComponent || (
        onPress && <Ionicons name="chevron-forward" size={20} color={brandColors.lightGray} />
      )}
    </TouchableOpacity>
  );

  const renderSwitchSetting = (
    title: string,
    subtitle: string,
    icon: keyof typeof Ionicons.glyphMap,
    value: boolean,
    onValueChange: (value: boolean) => void,
    iconColor: string = brandColors.primary
  ) => (
    <View style={styles.settingItem}>
      <View style={[styles.settingIcon, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: brandColors.lightGray, true: brandColors.primary + '50' }}
        thumbColor={value ? brandColors.primary : brandColors.mediumGray}
      />
    </View>
  );

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
          <Text style={styles.headerTitle}>Paramètres</Text>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Compte */}
       

        {/* Section Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          {renderSettingItem(
            'Paramètres de notifications',
            'Configurer vos préférences de notifications',
            'settings-outline',
            handleNotificationSettings
          )}
          {renderSettingItem(
            'Historique des notifications',
            'Voir toutes vos notifications',
            'time-outline',
            handleNotificationHistory
          )}
          {renderSwitchSetting(
            'Notifications push',
            'Recevoir des notifications sur votre appareil',
            'notifications-outline',
            notificationSettings.push,
            (value) => updateNotificationSettings('push', value)
          )}
          {renderSwitchSetting(
            'Rappels d\'événements',
            'Notifications avant le début des événements',
            'alarm-outline',
            notificationSettings.eventReminders,
            (value) => updateNotificationSettings('eventReminders', value)
          )}
          {renderSwitchSetting(
            'Début d\'événement',
            'Notification quand un événement commence',
            'play-circle-outline',
            notificationSettings.eventStart,
            (value) => updateNotificationSettings('eventStart', value)
          )}
          {renderSwitchSetting(
            'Nouveaux événements',
            'Notifications pour les nouveaux événements',
            'add-circle-outline',
            notificationSettings.newEvents,
            (value) => updateNotificationSettings('newEvents', value)
          )}
          {renderSwitchSetting(
            'Replays disponibles',
            'Notification quand un replay est disponible',
            'play-outline',
            notificationSettings.replayAvailable,
            (value) => updateNotificationSettings('replayAvailable', value)
          )}
        </View>

        {/* Section Application */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Application</Text>
          {renderSwitchSetting(
            'Lecture automatique',
            'Lancer automatiquement les vidéos',
            'play-outline',
            appSettings.autoPlay,
            (value) => updateAppSettings('autoPlay', value)
          )}
          {renderSettingItem(
            'Langue',
            'Français',
            'language-outline',
            () => Alert.alert('Information', 'Fonctionnalité à venir')
          )}
        </View>

        {/* Section Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          {renderSettingItem(
            'Contacter le support',
            'Obtenir de l\'aide',
            'help-circle-outline',
            handleContactSupport
          )}
          {renderSettingItem(
            'Partager l\'application',
            'Inviter des amis',
            'share-outline',
            handleShareApp
          )}
          {renderSettingItem(
            'Évaluer l\'application',
            'Donner votre avis',
            'star-outline',
            () => Alert.alert('Information', 'Fonctionnalité à venir')
          )}
          {renderSettingItem(
            'Tester les notifications',
            'Envoyer une notification de test',
            'notifications-outline',
            sendTestNotification
          )}
          {renderSettingItem(
            'Test Firebase complet',
            'Vérifier la configuration Firebase',
            'flame-outline',
            handleTestFirebase
          )}
        </View>

        {/* Section Légal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Légal</Text>
          {renderSettingItem(
            'Politique de confidentialité',
            'Comment nous protégeons vos données',
            'document-text-outline',
            handlePrivacyPolicy
          )}
          {renderSettingItem(
            'Conditions d\'utilisation',
            'Termes et conditions',
            'document-outline',
            handleTermsOfService
          )}
          {renderSettingItem(
            'Version',
            '1.0.0',
            'information-circle-outline',
            undefined,
            undefined,
            brandColors.mediumGray
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.darkGray,
    marginBottom: 16,
    textTransform: 'none',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brandColors.white,
    padding: 16,
    marginBottom: 8,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.darkGray,
    marginBottom: 2,
    textTransform: 'none',
  },
  settingSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
    textTransform: 'none',
  },
  bottomSpacer: {
    height: 40,
  },
});

export default SettingsScreen;
