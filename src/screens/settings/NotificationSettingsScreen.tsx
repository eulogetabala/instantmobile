import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useAdvancedNotifications } from '../../hooks/useAdvancedNotifications';
import { brandColors, typography, borderRadius, shadows } from '../../constants/theme';
import { NotificationSettings } from '../../services/notifications/advanced';

const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  const { 
    settings, 
    loading, 
    error, 
    loadSettings, 
    updateSettings, 
    testSettings, 
    resetToDefaults 
  } = useAdvancedNotifications();
  
  const [localSettings, setLocalSettings] = useState<NotificationSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
      setHasChanges(false);
    }
  }, [settings]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSettings();
    setRefreshing(false);
  };

  const handleToggle = (path: string, value: boolean) => {
    if (!localSettings) return;

    const newSettings = { ...localSettings };
    const keys = path.split('.');
    let current: any = newSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setLocalSettings(newSettings);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!localSettings || !hasChanges) return;

    try {
      await updateSettings(localSettings);
      setHasChanges(false);
      Alert.alert('Succès', 'Paramètres de notifications mis à jour');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour les paramètres');
    }
  };

  const handleTest = async () => {
    try {
      await testSettings();
      Alert.alert('Test envoyé', 'Une notification de test a été envoyée');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer le test');
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Réinitialiser',
      'Voulez-vous réinitialiser tous les paramètres aux valeurs par défaut ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetToDefaults();
              Alert.alert('Succès', 'Paramètres réinitialisés');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de réinitialiser les paramètres');
            }
          },
        },
      ]
    );
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderToggle = (
    label: string,
    path: string,
    description?: string
  ) => {
    if (!localSettings) return null;

    const keys = path.split('.');
    let value: any = localSettings;
    for (const key of keys) {
      value = value[key];
    }

    return (
      <View style={styles.toggleItem}>
        <View style={styles.toggleContent}>
          <Text style={styles.toggleLabel}>{label}</Text>
          {description && (
            <Text style={styles.toggleDescription}>{description}</Text>
          )}
        </View>
        <Switch
          value={value}
          onValueChange={(newValue) => handleToggle(path, newValue)}
          trackColor={{ false: brandColors.lightGray, true: brandColors.primary + '40' }}
          thumbColor={value ? brandColors.primary : brandColors.mediumGray}
        />
      </View>
    );
  };

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
            <Text style={styles.headerTitle}>Notifications</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>
        
        <View style={styles.authRequired}>
          <Ionicons name="lock-closed" size={60} color={brandColors.lightGray} />
          <Text style={styles.authRequiredTitle}>Connexion requise</Text>
          <Text style={styles.authRequiredSubtitle}>
            Connectez-vous pour configurer vos notifications
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

  if (loading && !localSettings) {
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
            <Text style={styles.headerTitle}>Notifications</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>
        
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement des paramètres...</Text>
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
          <Text style={styles.headerTitle}>Notifications</Text>
          {hasChanges && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[brandColors.primary]}
            tintColor={brandColors.primary}
          />
        }
      >
        {/* Notifications générales */}
        {renderSection('Notifications générales', (
          <>
            {renderToggle('Notifications push', 'general.push', 'Recevoir des notifications sur votre appareil')}
            {renderToggle('Notifications email', 'general.email', 'Recevoir des notifications par email')}
            {renderToggle('Notifications SMS', 'general.sms', 'Recevoir des notifications par SMS')}
          </>
        ))}

        {/* Notifications d'événements */}
        {renderSection('Événements', (
          <>
            {renderToggle('Nouveaux événements', 'events.newEvents', 'Être informé des nouveaux événements')}
            {renderToggle('Rappels d\'événements', 'events.eventReminders', 'Rappels avant le début des événements')}
            {renderToggle('Début d\'événement', 'events.eventStart', 'Quand un événement commence')}
            {renderToggle('Fin d\'événement', 'events.eventEnd', 'Quand un événement se termine')}
            {renderToggle('Événement annulé', 'events.eventCancelled', 'Si un événement est annulé')}
            {renderToggle('Événement reporté', 'events.eventPostponed', 'Si un événement est reporté')}
          </>
        ))}

        {/* Notifications de paiement */}
        {renderSection('Paiements', (
          <>
            {renderToggle('Paiement confirmé', 'payments.paymentConfirmed', 'Confirmation de paiement réussi')}
            {renderToggle('Échec de paiement', 'payments.paymentFailed', 'En cas d\'échec de paiement')}
            {renderToggle('Remboursement', 'payments.refundProcessed', 'Remboursement traité')}
            {renderToggle('Rappel de paiement', 'payments.paymentReminder', 'Rappels de paiement en attente')}
          </>
        ))}

        {/* Notifications de streaming */}
        {renderSection('Streaming', (
          <>
            {renderToggle('Début de diffusion', 'streaming.liveStarted', 'Quand un événement commence en direct')}
            {renderToggle('Replay disponible', 'streaming.replayAvailable', 'Quand un replay est disponible')}
            {renderToggle('Qualité de diffusion', 'streaming.streamQuality', 'Problèmes de qualité de diffusion')}
            {renderToggle('Problèmes de diffusion', 'streaming.streamIssues', 'Problèmes techniques de diffusion')}
          </>
        ))}

        {/* Notifications de favoris */}
        {renderSection('Favoris', (
          <>
            {renderToggle('Événement favori qui commence', 'favorites.favoriteEventStarting', 'Vos événements favoris qui commencent')}
            {renderToggle('Événement favori annulé', 'favorites.favoriteEventCancelled', 'Vos événements favoris annulés')}
            {renderToggle('Nouveaux événements dans vos catégories', 'favorites.newEventsInFavoriteCategories', 'Nouveaux événements dans vos catégories préférées')}
          </>
        ))}

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleTest}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications" size={20} color={brandColors.primary} />
            <Text style={styles.actionButtonText}>Tester les notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.resetButton]}
            onPress={handleReset}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={20} color={brandColors.error} />
            <Text style={[styles.actionButtonText, styles.resetButtonText]}>Réinitialiser</Text>
          </TouchableOpacity>
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
  placeholder: {
    width: 40,
  },
  saveButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.lg,
  },
  saveButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.white,
    textTransform: 'none',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: brandColors.white,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.darkGray,
    marginBottom: 16,
    textTransform: 'none',
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.lightGray + '30',
  },
  toggleContent: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.darkGray,
    marginBottom: 4,
    textTransform: 'none',
  },
  toggleDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
    lineHeight: 18,
    textTransform: 'none',
  },
  actionsSection: {
    backgroundColor: brandColors.white,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: brandColors.lightGray + '20',
    borderRadius: borderRadius.lg,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.primary,
    marginLeft: 12,
    textTransform: 'none',
  },
  resetButton: {
    backgroundColor: brandColors.error + '10',
  },
  resetButtonText: {
    color: brandColors.error,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
    textTransform: 'none',
  },
  bottomSpacer: {
    height: 40,
  },
});

export default NotificationSettingsScreen;
