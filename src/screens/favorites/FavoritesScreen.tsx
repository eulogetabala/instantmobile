import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../hooks/useFavorites';
import { brandColors, typography, borderRadius, shadows } from '../../constants/theme';
import { Event } from '../../types';

const { width } = Dimensions.get('window');

const FavoritesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  const { favorites, loading, error, loadFavorites, removeFromFavorites } = useFavorites();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const handleEventPress = (event: Event) => {
    (navigation as any).navigate('EventDetails', { eventId: event.id });
  };

  const handleRemoveFavorite = async (eventId: string, eventTitle: string) => {
    Alert.alert(
      'Supprimer des favoris',
      `Voulez-vous supprimer "${eventTitle}" de vos favoris ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFromFavorites(eventId);
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer des favoris');
            }
          },
        },
      ]
    );
  };

  const renderEventCard = ({ item }: { item: any }) => {
    const event = item.event;
    
    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => handleEventPress(event)}
        activeOpacity={0.8}
      >
        <View style={styles.eventImageContainer}>
          <Image source={event.image} style={styles.eventImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
            style={styles.eventGradient}
          />
          <View style={styles.eventOverlay}>
            <View style={styles.eventHeader}>
              <Text style={styles.eventCategory}>{event.category}</Text>
              {event.isLive && (
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => handleRemoveFavorite(event.id, event.title)}
              activeOpacity={0.8}
            >
              <Ionicons name="heart" size={20} color={brandColors.error} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.eventContent}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {event.title}
          </Text>
          <View style={styles.priceBadgeContainer}>
            <View style={[styles.priceBadge, event.isFree && styles.freePriceBadge]}>
              <Text style={[styles.priceBadgeText, event.isFree && styles.freePriceBadgeText]}>
                {event.isFree ? 'GRATUIT' : `${event.price.toLocaleString()} FCFA`}
              </Text>
            </View>
          </View>
          <Text style={styles.eventDescription} numberOfLines={2}>
            {event.description}
          </Text>
          <View style={styles.eventDateTime}>
            <Ionicons name="calendar-outline" size={14} color={brandColors.mediumGray} />
            <Text style={styles.eventDate}>{event.date}</Text>
            <Ionicons name="time-outline" size={14} color={brandColors.mediumGray} />
            <Text style={styles.eventTime}>{event.time}</Text>
          </View>
          <View style={styles.eventAction}>
            <View style={styles.joinButton}>
              <Ionicons name="arrow-forward" size={14} color={brandColors.white} />
              <Text style={styles.joinButtonText}>Voir détails</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="heart-outline" size={80} color={brandColors.lightGray} />
      <Text style={styles.emptyStateTitle}>Aucun favori</Text>
      <Text style={styles.emptyStateSubtitle}>
        Les événements que vous ajoutez aux favoris apparaîtront ici
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => (navigation as any).navigate('Events')}
        activeOpacity={0.8}
      >
        <Text style={styles.exploreButtonText}>Explorer les événements</Text>
      </TouchableOpacity>
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
            <Text style={styles.headerTitle}>Mes favoris</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>
        
        <View style={styles.authRequired}>
          <Ionicons name="lock-closed" size={60} color={brandColors.lightGray} />
          <Text style={styles.authRequiredTitle}>Connexion requise</Text>
          <Text style={styles.authRequiredSubtitle}>
            Connectez-vous pour voir vos événements favoris
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
          <Text style={styles.headerTitle}>Mes favoris</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      {/* Contenu */}
      <View style={styles.content}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadFavorites}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={favorites}
          renderItem={renderEventCard}
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
  content: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  eventCard: {
    backgroundColor: brandColors.white,
    borderRadius: borderRadius.xl,
    marginBottom: 16,
    overflow: 'hidden',
    ...shadows.md,
  },
  eventImageContainer: {
    position: 'relative',
    height: 200,
  },
  eventImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  eventGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  eventOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    justifyContent: 'space-between',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eventCategory: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.white,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    textTransform: 'none',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brandColors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: brandColors.white,
    marginRight: 4,
  },
  liveText: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    textTransform: 'none',
  },
  favoriteButton: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventContent: {
    padding: 16,
  },
  eventTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.darkGray,
    marginBottom: 6,
    lineHeight: 20,
    textTransform: 'none',
  },
  priceBadgeContainer: {
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  priceBadge: {
    backgroundColor: brandColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  freePriceBadge: {
    backgroundColor: brandColors.success,
  },
  priceBadgeText: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    textTransform: 'none',
  },
  freePriceBadgeText: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    textTransform: 'none',
  },
  eventDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
    marginBottom: 12,
    lineHeight: 18,
    textTransform: 'none',
  },
  eventDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  eventDate: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
    textTransform: 'none',
  },
  eventTime: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
    textTransform: 'none',
  },
  eventAction: {
    alignItems: 'flex-end',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brandColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.lg,
    gap: 6,
    ...shadows.md,
  },
  joinButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.white,
    textTransform: 'none',
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
    marginBottom: 24,
    textTransform: 'none',
  },
  exploreButton: {
    backgroundColor: brandColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: borderRadius.lg,
  },
  exploreButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.white,
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
  errorContainer: {
    backgroundColor: brandColors.error + '10',
    padding: 16,
    margin: 16,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.error,
    textAlign: 'center',
    marginBottom: 12,
    textTransform: 'none',
  },
  retryButton: {
    backgroundColor: brandColors.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.white,
    textTransform: 'none',
  },
});

export default FavoritesScreen;
