import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { brandColors, typography, borderRadius, shadows } from '../../constants/theme';

const { width } = Dimensions.get('window');

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, logout, isAuthenticated } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Erreur', 'Erreur lors de la déconnexion');
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    // Navigation vers l'édition du profil
    (navigation as any).navigate('EditProfile');
  };

  const handleViewTickets = () => {
    // Navigation vers les billets
    (navigation as any).navigate('Tickets');
  };

  const handleViewFavorites = () => {
    // Navigation vers les favoris
    (navigation as any).navigate('Favorites');
  };

  const handleViewHistory = () => {
    // Navigation vers l'historique
    (navigation as any).navigate('UserHistory');
  };

  const handleSettings = () => {
    // Navigation vers les paramètres
    (navigation as any).navigate('Settings');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Rafraîchir les données utilisateur
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={64} color={brandColors.mediumGray} />
          <Text style={styles.errorText}>Aucun utilisateur connecté</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header orange avec avatar et informations */}
        <View style={styles.header}>
          <View style={styles.headerBackground} />
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={50} color={brandColors.primary} />
              </View>
            </View>
            
            <Text style={styles.userName}>
              {user.firstName} {user.lastName}
            </Text>
            
            {user.email && (
              <View style={styles.infoRow}>
                <Ionicons name="mail" size={16} color={brandColors.white} />
                <Text style={styles.infoTextWhite}>{user.email}</Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Ionicons name="call" size={16} color={brandColors.white} />
              <Text style={styles.infoTextWhite}>{user.phone}</Text>
            </View>
            
            {user.isOAuthUser && (
              <View style={styles.oauthBadge}>
                <Ionicons 
                  name={user.oauthProvider === 'google' ? 'logo-google' : 'logo-facebook'} 
                  size={18} 
                  color={brandColors.white} 
                />
                <Text style={styles.oauthTextWhite}>
                  Connecté via {user.oauthProvider === 'google' ? 'Google' : 'Facebook'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Statistiques en grille */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: brandColors.primary + '20' }]}>
              <Ionicons name="calendar" size={24} color={brandColors.primary} />
            </View>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Événements</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: brandColors.success + '20' }]}>
              <Ionicons name="ticket" size={24} color={brandColors.success} />
            </View>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Billets</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: brandColors.warning + '20' }]}>
              <Ionicons name="play-circle" size={24} color={brandColors.warning} />
            </View>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Replays</Text>
          </View>
        </View>

        {/* Menu principal avec icônes colorées */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={handleViewTickets}>
            <View style={[styles.menuIcon, { backgroundColor: brandColors.success + '15' }]}>
              <Ionicons name="ticket" size={24} color={brandColors.success} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Mes billets</Text>
              <Text style={styles.menuSubtitle}>Voir vos billets d'événements</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={brandColors.lightGray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleViewFavorites}>
            <View style={[styles.menuIcon, { backgroundColor: brandColors.error + '15' }]}>
              <Ionicons name="heart" size={24} color={brandColors.error} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Mes favoris</Text>
              <Text style={styles.menuSubtitle}>Événements sauvegardés</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={brandColors.lightGray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleViewHistory}>
            <View style={[styles.menuIcon, { backgroundColor: brandColors.info + '15' }]}>
              <Ionicons name="time" size={24} color={brandColors.info} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Mon historique</Text>
              <Text style={styles.menuSubtitle}>Activité et statistiques</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={brandColors.lightGray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
            <View style={[styles.menuIcon, { backgroundColor: brandColors.primary + '15' }]}>
              <Ionicons name="create" size={24} color={brandColors.primary} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Modifier le profil</Text>
              <Text style={styles.menuSubtitle}>Mettre à jour vos informations</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={brandColors.lightGray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleSettings}>
            <View style={[styles.menuIcon, { backgroundColor: brandColors.warning + '15' }]}>
              <Ionicons name="settings" size={24} color={brandColors.warning} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Paramètres</Text>
              <Text style={styles.menuSubtitle}>Préférences et notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={brandColors.lightGray} />
          </TouchableOpacity>
        </View>

        {/* Informations du compte en cartes */}
        <View style={styles.accountSection}>
          <Text style={styles.sectionTitle}>Informations du compte</Text>
          
          <View style={styles.accountCard}>
            <View style={styles.accountItem}>
              <View style={styles.accountLabelContainer}>
                <Ionicons name="shield-checkmark" size={20} color={brandColors.mediumGray} />
                <Text style={styles.accountLabel}>Statut du compte</Text>
              </View>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: user.isVerified ? brandColors.success : brandColors.warning }]} />
                <Text style={styles.statusText}>
                  {user.isVerified ? 'Vérifié' : 'En attente'}
                </Text>
              </View>
            </View>

            <View style={styles.accountItem}>
              <View style={styles.accountLabelContainer}>
                <Ionicons name="key" size={20} color={brandColors.mediumGray} />
                <Text style={styles.accountLabel}>Type de compte</Text>
              </View>
              <Text style={styles.accountValue}>
                {user.isOAuthUser ? 'OAuth' : 'Standard'}
              </Text>
            </View>

            <View style={styles.accountItem}>
              <View style={styles.accountLabelContainer}>
                <Ionicons name="person-circle" size={20} color={brandColors.mediumGray} />
                <Text style={styles.accountLabel}>Rôle</Text>
              </View>
              <Text style={styles.accountValue}>
                {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
              </Text>
            </View>
          </View>
        </View>

        {/* Bouton de déconnexion avec style moderne */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <View style={styles.logoutIconContainer}>
              <Ionicons name="log-out" size={20} color={brandColors.white} />
            </View>
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
    </View>

        {/* Espace en bas */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.mediumGray,
    marginTop: 16,
  },
  
  // Header orange
  header: {
    position: 'relative',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: brandColors.primary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...shadows.sm,
  },
  avatarContainer: {
    position: 'relative',
    zIndex: 1,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: brandColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: brandColors.white,
  },

  // Section informations utilisateur
  userInfoSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  userName: {
    fontSize: typography.fontSize.xl,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
    marginLeft: 8,
  },
  infoTextWhite: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.white,
    marginLeft: 8,
  },
  oauthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    marginTop: 8,
  },
  oauthText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.primary,
    marginLeft: 6,
  },
  oauthTextWhite: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.white,
    marginLeft: 6,
  },

  // Statistiques en grille
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 30,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: brandColors.white,
    padding: 20,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: typography.fontSize.xl,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.darkGray,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.mediumGray,
    textAlign: 'center',
  },

  // Menu principal
  menuSection: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brandColors.white,
    padding: 16,
    borderRadius: borderRadius.lg,
    marginBottom: 12,
    ...shadows.sm,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.darkGray,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
  },

  // Section compte
  accountSection: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.darkGray,
    marginBottom: 16,
  },
  accountCard: {
    backgroundColor: brandColors.white,
    borderRadius: borderRadius.lg,
    padding: 20,
    ...shadows.sm,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.lightGray,
  },
  accountLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountLabel: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.darkGray,
    marginLeft: 12,
  },
  accountValue: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.mediumGray,
  },

  // Bouton de déconnexion
  logoutSection: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brandColors.error,
    paddingVertical: 16,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  logoutIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoutText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.white,
  },
  bottomSpacer: {
    height: 30,
  },
});

export default ProfileScreen;