import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { brandColors, typography, borderRadius, shadows } from '../../constants/theme';
import { eventService } from '../../services/events';
import EventImage from '../../components/ui/EventImage';

const { width } = Dimensions.get('window');

interface LiveEvent {
  id: string;
  title: string;
  description: string;
  viewers: number;
  price: number;
  isFree: boolean;
  image: string | null; // URL de l'image du backend ou null
  category: string;
  startTime: string;
}

const GuestLiveScreen: React.FC = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);

  useEffect(() => {
    loadLiveEvents();
  }, []);

  const loadLiveEvents = async () => {
    try {
      console.log('🔄 Chargement des événements live...');
      console.log('📡 Appel API: getLiveEvents');
      
      const response = await eventService.getLiveEvents();
      
      console.log('✅ Réponse API live reçue:', response);
      
      // Si aucun événement live, créer un événement de démonstration
      if (!response.events || response.events.length === 0) {
        console.log('📺 Aucun événement live, création d\'un événement de démonstration');
        const demoEvent: LiveEvent = {
          id: 'demo-live-1',
          title: 'Concert Live Demo - Instant+',
          description: 'Événement de démonstration en direct',
          viewers: 127,
          price: 0,
          isFree: true,
          image: null, // Utilisera l'image locale via EventImage
          category: 'concert',
          startTime: new Date().toISOString(),
        };
        
        setLiveEvents([demoEvent]);
        return;
      }
      
      // Transformer les événements de l'API vers le format attendu par l'interface
      const transformedEvents: LiveEvent[] = response.events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        viewers: event.streaming?.currentViewers || 0,
        price: event.pricing?.isFree ? 0 : (event.pricing?.price?.amount || 0),
        isFree: event.pricing?.isFree || false,
        image: event.media?.poster || null, // URL de l'image du backend ou null
        category: event.category,
        startTime: new Date(event.startDate).toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
      }));
      
      console.log('🎯 Événements live transformés:', transformedEvents.length);
      setLiveEvents(transformedEvents);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des événements live:', error);
      console.error('📊 Détails de l\'erreur:', error instanceof Error ? error.message : String(error));
      
      // Pas de fallback - on veut voir si l'API fonctionne vraiment
      setLiveEvents([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLiveEvents();
    setRefreshing(false);
  };

  const handleEventPress = (event: LiveEvent) => {
    // Navigation vers le streaming en direct
    (navigation as any).navigate('Streaming', { eventId: event.id, isReplay: false });
  };


  const renderLiveEventCard = ({ item: event }: { item: LiveEvent }) => (
    <TouchableOpacity
      style={styles.liveEventCard}
      onPress={() => handleEventPress(event)}
      activeOpacity={0.8}
    >
      <View style={styles.liveImageContainer}>
        <EventImage 
          posterUrl={typeof event.image === 'string' ? event.image : null}
          eventId={event.id}
          style={styles.liveEventImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
          style={styles.liveGradient}
        />
        <View style={styles.liveOverlay}>
          <View style={styles.liveBadgeTop}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
          <View style={styles.viewersContainer}>
            <Ionicons name="eye" size={14} color="rgba(255,255,255,0.9)" />
            <Text style={styles.viewersText}>{event.viewers.toLocaleString()}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.liveEventContent}>
        <View style={styles.liveEventHeader}>
          <Text style={styles.liveEventCategory}>{event.category}</Text>
          <View style={[
            styles.livePriceContainer,
            event.isFree && styles.liveFreePriceContainer
          ]}>
            <Text style={[
              styles.livePriceText,
              event.isFree && styles.liveFreePriceText
            ]}>
              {event.isFree ? 'GRATUIT' : `${event.price.toLocaleString()} FCFA`}
            </Text>
          </View>
        </View>
        <Text style={styles.liveEventTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.liveEventDescription} numberOfLines={2}>
          {event.description}
        </Text>
        <View style={styles.liveEventFooter}>
          <View style={styles.liveEventDateTime}>
            <Ionicons name="time" size={14} color={brandColors.primary} />
            <Text style={styles.liveEventTime}>{event.startTime}</Text>
          </View>
          <View style={styles.joinButton}>
            <Ionicons name="play" size={14} color={brandColors.white} />
            <Text style={styles.joinButtonText}>Rejoindre</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
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
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color={brandColors.white} />
          </TouchableOpacity>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
        
        <View style={styles.headerMain}>
          <Text style={styles.headerTitle}>En Direct</Text>
          <Text style={styles.headerSubtitle}>
            Découvrez les événements en cours de diffusion
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Statistiques */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="radio" size={24} color={brandColors.primary} />
            </View>
            <Text style={styles.statNumber}>{liveEvents.length}</Text>
            <Text style={styles.statLabel}>Lives actifs</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="eye" size={24} color={brandColors.primary} />
            </View>
            <Text style={styles.statNumber}>
              {liveEvents.reduce((total, event) => total + event.viewers, 0).toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Spectateurs</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="gift" size={24} color={brandColors.primary} />
            </View>
            <Text style={styles.statNumber}>
              {liveEvents.filter(event => event.isFree).length}
            </Text>
            <Text style={styles.statLabel}>Gratuits</Text>
          </View>
        </View>

        {/* Section des événements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Événements en direct</Text>
          {liveEvents.length > 0 ? (
            <View style={styles.eventsGrid}>
              {liveEvents.map((event) => (
                <View key={event.id} style={styles.eventCardWrapper}>
                  {renderLiveEventCard({ item: event })}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="radio-outline" size={64} color={brandColors.lightGray} />
              <Text style={styles.emptyStateTitle}>Aucun événement en direct</Text>
              <Text style={styles.emptyStateDescription}>
                Il n'y a actuellement aucun événement en cours de diffusion
              </Text>
            </View>
          )}
        </View>
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
    paddingBottom: 25,
    paddingHorizontal: 20,
    ...shadows.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerMain: {
    alignItems: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'none',
  },
  headerSubtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_400Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    textTransform: 'none',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: brandColors.white,
    borderRadius: borderRadius.lg,
    padding: 16,
    alignItems: 'center',
    ...shadows.md,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 102, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: typography.fontSize.xl,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.darkGray,
    marginBottom: 4,
    textTransform: 'none',
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.mediumGray,
    textAlign: 'center',
    textTransform: 'none',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.darkGray,
    marginBottom: 16,
    textTransform: 'none',
  },
  eventsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  eventCardWrapper: {
    width: (width - 60) / 2, // 2 colonnes avec espacement
    marginBottom: 16,
  },
  liveEventCard: {
    backgroundColor: brandColors.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
    flex: 1,
  },
  liveImageContainer: {
    position: 'relative',
    height: 160,
  },
  liveEventImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  liveGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  liveOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
    zIndex: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    gap: 4,
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 3,
  },
  viewersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    gap: 3,
  },
  viewersText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: 'rgba(255,255,255,0.9)',
  },
  eventContent: {
    padding: 15,
    position: 'relative',
    zIndex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  eventCategory: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 3,
  },
  startTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  startTime: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.white,
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  eventTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
    textTransform: 'none',
  },
  eventDescription: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    marginBottom: 15,
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    textTransform: 'none',
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceContainer: {
    backgroundColor: brandColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
  },
  freePriceContainer: {
    backgroundColor: '#22c55e',
  },
  priceText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: brandColors.white,
  },
  freePriceText: {
    color: brandColors.white,
  },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brandColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  freeWatchButton: {
    backgroundColor: 'rgba(255, 102, 0, 0.1)',
    borderWidth: 1,
    borderColor: brandColors.primary,
  },
  watchButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: brandColors.white,
  },
  freeWatchButtonText: {
    color: brandColors.primary,
  },
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 102, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    gap: 8,
  },
  loginPromptText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: brandColors.primary,
    flex: 1,
  },
  liveBadgeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    gap: 3,
    ...shadows.sm,
  },
  liveEventContent: {
    padding: 16,
  },
  liveEventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveEventCategory: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.primary,
    textTransform: 'none',
  },
  liveEventTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.darkGray,
    marginBottom: 6,
    lineHeight: 20,
    textTransform: 'none',
  },
  liveEventDescription: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
    marginBottom: 10,
    lineHeight: 16,
    textTransform: 'none',
  },
  liveEventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveEventDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveEventTime: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.mediumGray,
    textTransform: 'none',
  },
  liveEventViewers: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.mediumGray,
    textTransform: 'none',
  },
  livePriceContainer: {
    backgroundColor: brandColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  liveFreePriceContainer: {
    backgroundColor: brandColors.success,
  },
  livePriceText: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    textTransform: 'none',
  },
  liveFreePriceText: {
    color: brandColors.white,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brandColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    gap: 4,
    ...shadows.sm,
  },
  joinButtonText: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.white,
    textTransform: 'none',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.darkGray,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    textTransform: 'none',
  },
  emptyStateDescription: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
    textAlign: 'center',
    lineHeight: 24,
    textTransform: 'none',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: brandColors.white,
  },
  liveText: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    textTransform: 'none',
  },
});

export default GuestLiveScreen;
