import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../hooks/useFavorites';
import { brandColors, typography, borderRadius, shadows } from '../../constants/theme';
import { eventService } from '../../services/events';
import { Event as ApiEvent } from '../../types';
import { getEventImage } from '../../utils/image';
import { EVENT_STATUSES, getEventButtonText, getEventButtonAction } from '../../services/events/eventCategories';

const { width } = Dimensions.get('window');

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  price: number;
  isFree: boolean;
  image: any;
  category: string;
  isLive: boolean;
}

const GuestEventsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { isAuthenticated } = useAuth();
  const { toggleFavorite, isEventFavorite } = useFavorites();
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'live' | 'past' | 'upcoming'>('upcoming');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    // Récupérer le filtre et la catégorie depuis les paramètres de route
    const filter = (route.params as any)?.filter || 'upcoming';
    const category = (route.params as any)?.category || null;
    setSelectedFilter(filter);
    setSelectedCategory(category);
    loadEvents();
  }, [route.params]);

  const loadEvents = async () => {
    try {
      console.log('🔄 Chargement des événements...');
      console.log('📂 Catégorie sélectionnée:', selectedCategory);
      console.log('🔍 Filtre sélectionné:', selectedFilter);
      
      // Normaliser la valeur de catégorie pour correspondre aux valeurs enum du backend
      const normalizeCategory = (cat: string | null): string | undefined => {
        if (!cat) return undefined;
        // Convertir en minuscules et enlever les accents
        const normalized = cat
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim();
        
        // Mapping des noms de catégories vers les valeurs enum
        const categoryMap: Record<string, string> = {
          'concert': 'concert',
          'theater': 'theater',
          'theatre': 'theater',
          'seminar': 'seminar',
          'seminaire': 'seminar',
          'sport': 'sport',
          'festival': 'festival',
          'conference': 'conference',
          'workshop': 'workshop',
          'atelier': 'workshop',
          'exhibition': 'exhibition',
          'exposition': 'exhibition',
          'formation': 'formation',
          'gospel': 'gospel',
          'other': 'other',
          'autre': 'other',
        };
        
        return categoryMap[normalized] || normalized;
      };
      
      const normalizedCategory = normalizeCategory(selectedCategory);
      
      // Si une catégorie est sélectionnée, utiliser l'endpoint /api/events avec le filtre category
      if (normalizedCategory) {
        console.log('📡 Appel API: getEvents avec catégorie', normalizedCategory);
        
        // Déterminer le statut selon le filtre
        let status = 'published';
        if (selectedFilter === 'live') {
          status = 'live';
        } else if (selectedFilter === 'past') {
          status = 'ended';
        }
        
        // Utiliser getEvents avec les filtres appropriés
        const filters: any = {
          category: normalizedCategory,
          status: status,
        };
        
        // Si c'est "all", on ne filtre pas par statut
        if (selectedFilter === 'all') {
          delete filters.status;
        }
        
        const response = await eventService.getEvents(filters);
        const events: ApiEvent[] = response.events || [];
        
        const transformedEvents: Event[] = events.map((event: ApiEvent) => ({
          id: event.id,
          title: event.title,
          description: event.description || event.shortDescription || '',
          date: new Date(event.startDate).toLocaleDateString('fr-FR'),
          time: new Date(event.startDate).toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          price: event.pricing?.isFree ? 0 : (event.pricing?.price?.amount || 0),
          isFree: event.pricing?.isFree || false,
          image: getEventImage(event.media?.poster),
          category: event.category,
          isLive: event.streaming?.isLive || event.status === 'live',
        }));
        
        setEvents(transformedEvents);
        return;
      }
      
      // Sinon, utiliser les méthodes spécifiques comme avant
      let response;
      
      // Charger les événements selon le statut sélectionné
      switch (selectedFilter) {
        case 'live':
          console.log('📡 Appel API: getLiveEvents');
          response = await eventService.getLiveEvents();
          break;
        case 'past':
          console.log('📡 Appel API: getPastEvents');
          response = await eventService.getPastEvents();
          break;
        case 'upcoming':
        default:
          console.log('📡 Appel API: getUpcomingEvents');
          response = await eventService.getUpcomingEvents();
          break;
      }
      
      console.log('✅ Réponse API reçue:', response);
      
      // Transformer les événements de l'API vers le format attendu par l'interface
      let events: ApiEvent[] = [];
      if (Array.isArray(response)) {
        events = response;
      } else if (response && typeof response === 'object') {
        if ('events' in response && Array.isArray(response.events)) {
          events = response.events;
        } else if ('data' in response && Array.isArray(response.data)) {
          events = response.data;
        }
      }
      
      const transformedEvents: Event[] = events.map((event: ApiEvent) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        date: new Date(event.startDate).toLocaleDateString('fr-FR'),
        time: new Date(event.startDate).toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        price: event.pricing?.isFree ? 0 : (event.pricing?.price?.amount || 0),
        isFree: event.pricing?.isFree || false,
        image: getEventImage(event.media?.poster),
        category: event.category,
        isLive: event.streaming?.isLive || false,
        organizer: event.organizer?.name || (event.createdBy ? `${event.createdBy.firstName} ${event.createdBy.lastName}` : 'Organisateur'),
        location: event.location?.address || 'Lieu à confirmer',
        duration: event.duration || '2h',
        maxParticipants: event.capacity?.max || undefined,
        currentParticipants: event.capacity?.current || undefined,
      }));
      
      console.log('🎯 Événements transformés:', transformedEvents.length);
      setEvents(transformedEvents);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des événements:', error);
      console.error('📊 Détails de l\'erreur:', error instanceof Error ? error.message : String(error));
      
      // Pas de fallback - on veut voir si l'API fonctionne vraiment
      setEvents([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const handleEventPress = (event: Event) => {
    // Si l'utilisateur est connecté, navigation directe vers les détails
    if (isAuthenticated) {
      (navigation as any).navigate('EventDetails', { eventId: event.id });
    } else {
      // Si l'utilisateur n'est pas connecté, navigation vers les détails
      // (la logique d'accès sera gérée dans EventDetailsScreen)
      (navigation as any).navigate('EventDetails', { eventId: event.id });
    }
  };

  const handleFavoritePress = async (event: Event) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour ajouter des événements aux favoris',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => (navigation as any).navigate('Login') },
        ]
      );
      return;
    }

    try {
      await toggleFavorite(event.id);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier les favoris');
    }
  };

  const handleLoginPress = () => {
    navigation.navigate('Login' as never);
  };

  const handleEventAction = (event: Event) => {
    const action = getEventButtonAction(event, isAuthenticated);
    
    switch (action) {
      case 'login':
        (navigation as any).navigate('Login');
        break;
      case 'follow':
        // Logique pour suivre un événement gratuit
        Alert.alert('Suivi activé', `Vous suivez maintenant "${event.title}"`);
        break;
      case 'join_live':
        (navigation as any).navigate('StreamingAccess', { 
          eventId: event.id, 
          eventTitle: event.title 
        });
        break;
      case 'register':
        (navigation as any).navigate('Payment', { eventId: event.id });
        break;
      case 'view_details':
      default:
        (navigation as any).navigate('EventDetails', { eventId: event.id });
        break;
    }
  };

  const getEventButtonIcon = (event: Event, isAuthenticated: boolean) => {
    if (!isAuthenticated) return 'log-in';
    if (event.isFree) return 'heart';
    if (event.isLive) return 'videocam';
    if (new Date(event.date) > new Date()) return 'ticket';
    return 'arrow-forward';
  };

  const filteredEvents = events; // Le filtrage est maintenant fait côté API


  const renderEventCard = ({ item: event }: { item: Event }) => (
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
            onPress={() => handleFavoritePress(event)}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={isEventFavorite(event.id) ? "heart" : "heart-outline"} 
              size={20} 
              color={isEventFavorite(event.id) ? brandColors.error : brandColors.white} 
            />
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
          <TouchableOpacity 
            style={styles.joinButton}
            onPress={() => handleEventAction(event)}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={getEventButtonIcon(event, isAuthenticated)} 
              size={14} 
              color={brandColors.white} 
            />
            <Text style={styles.joinButtonText}>
              {getEventButtonText(event, isAuthenticated)}
            </Text>
          </TouchableOpacity>
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
          <View style={styles.headerMain}>
            <Text style={styles.headerTitle}>Événements</Text>
            <Text style={styles.headerSubtitle}>
              Découvrez tous nos événements
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Filtres de catégorie actifs */}
        {selectedCategory && (
          <View style={styles.activeCategoryContainer}>
            <LinearGradient
              colors={[brandColors.primary, '#FF9800']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.activeCategoryGradient}
            >
              <View style={styles.activeCategoryContent}>
                <View style={styles.activeCategoryTextContainer}>
                  <Ionicons name="pricetag" size={16} color={brandColors.white} />
                  <Text style={styles.activeCategoryLabel}>
                    Catégorie : <Text style={styles.activeCategoryName}>{selectedCategory}</Text>
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.clearCategoryButton}
                  onPress={() => {
                    setSelectedCategory(null);
                    // Mettre à jour les paramètres de navigation pour éviter de recharger la catégorie au prochain rendu
                    navigation.setParams({ category: null } as any);
                  }}
                >
                  <Ionicons name="close-circle" size={24} color={brandColors.white} />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Filtres */}
        <View style={styles.filtersContainer}>
          {EVENT_STATUSES.map((status) => (
            <TouchableOpacity
              key={status.id}
              style={[styles.filterButton, selectedFilter === status.id && styles.filterButtonActive]}
              onPress={() => setSelectedFilter(status.id)}
            >
              <Ionicons 
                name={status.icon as any} 
                size={16} 
                color={selectedFilter === status.id ? brandColors.white : status.color}
                style={styles.filterIcon}
              />
              <Text style={[styles.filterText, selectedFilter === status.id && styles.filterTextActive]}>
                {status.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Section des événements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedCategory ? `Événements ${selectedCategory}` :
             selectedFilter === 'live' ? 'Événements en cours' : 
             selectedFilter === 'past' ? 'Événements passés' : 'Événements à venir'}
          </Text>
          {filteredEvents.length > 0 ? (
            <View style={styles.eventsGrid}>
              {filteredEvents.map((event) => (
                <View key={event.id} style={styles.eventCardWrapper}>
                  {renderEventCard({ item: event })}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color={brandColors.lightGray} />
              <Text style={styles.emptyStateTitle}>Aucun événement trouvé</Text>
              <Text style={styles.emptyStateDescription}>
                {selectedFilter === 'live' ? 'Aucun événement en cours pour le moment' :
                 selectedFilter === 'past' ? 'Aucun événement passé disponible' :
                 'Aucun événement à venir disponible'}
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
    marginRight: 20,
  },
  headerMain: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    marginBottom: 4,
    textTransform: 'none',
  },
  headerSubtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_400Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    textTransform: 'none',
  },
  content: {
    flex: 1,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.lg,
    backgroundColor: brandColors.white,
    borderWidth: 1,
    borderColor: brandColors.lightGray,
  },
  activeCategoryContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
  },
  activeCategoryGradient: {
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  activeCategoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  activeCategoryTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeCategoryLabel: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Montserrat_500Medium',
  },
  activeCategoryName: {
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
  },
  clearCategoryButton: {
    padding: 2,
  },
  activeFilterButton: {
    backgroundColor: brandColors.primary,
    borderColor: brandColors.primary,
  },
  filterButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: brandColors.mediumGray,
  },
  activeFilterButtonText: {
    color: brandColors.white,
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
  eventCard: {
    backgroundColor: brandColors.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
    flex: 1,
  },
  eventImageContainer: {
    position: 'relative',
    height: 160,
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
  },
  eventContent: {
    padding: 16,
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
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  eventTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.darkGray,
    marginBottom: 6,
    lineHeight: 20,
    textTransform: 'none',
  },
  eventDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
    marginBottom: 10,
    lineHeight: 18,
    textTransform: 'none',
  },
  eventDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  eventDate: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.mediumGray,
    textTransform: 'none',
  },
  eventTime: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.mediumGray,
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
  eventAction: {
    marginTop: 12,
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
  filterIcon: {
    marginRight: 4,
  },
  filterButtonActive: {
    backgroundColor: brandColors.primary,
  },
  filterText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.mediumGray,
  },
  filterTextActive: {
    color: brandColors.white,
  },
});

export default GuestEventsScreen;
