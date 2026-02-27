import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { brandColors, typography, borderRadius, shadows } from '../../constants/theme';
import { apiService } from '../../services/api';
import { eventService } from '../../services/events';
import { Event as ApiEvent } from '../../types';
import { getEventImage } from '../../utils/image';

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

interface SliderItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: any;
}

interface Category {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const GuestHomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isAuthenticated, user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [freeEvents, setFreeEvents] = useState<Event[]>([]);
  const [liveEvents, setLiveEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setRefreshing(true);
    await Promise.all([
      loadCategories(),
      loadEvents()
    ]);
    setRefreshing(false);
  };

  // Données du slider
  const sliderData: SliderItem[] = [
    {
      id: '1',
      title: 'Bienvenue sur INSTANT+',
      subtitle: 'Événements exceptionnels',
      description: 'Découvrez des contenus premium en streaming',
      image: require('../../../assets/images/on1.webp'),
    },
    {
      id: '2',
      title: 'Contenu Premium',
      subtitle: 'Accès exclusif',
      description: 'Profitez d\'événements en direct et de formations',
      image: require('../../../assets/images/1.jpg'),
    },
    {
      id: '3',
      title: 'Communauté Active',
      subtitle: 'Rejoignez-nous',
      description: 'Connectez-vous pour accéder à tous nos contenus',
      image: require('../../../assets/images/2.jpg'),
    },
  ];

  const loadCategories = async () => {
    try {
      const response = await apiService.get('/categories');
      if (response.success && response.data.categories) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      // Fallback local en cas d'erreur API
      setCategories([
        { id: '1', name: 'Concert', icon: 'musical-notes', color: '#FF6B6B' },
        { id: '2', name: 'Théâtre', icon: 'film', color: '#9C27B0' },
        { id: '3', name: 'Formation', icon: 'school', color: '#45B7D1' },
        { id: '4', name: 'Gospel', icon: 'heart', color: '#96CEB4' },
      ]);
    }
  };

  const transformEvent = (event: ApiEvent): Event => ({
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
  });

  const loadEvents = async () => {
    try {
      const [liveRes, freeRes, featuredRes] = await Promise.allSettled([
        eventService.getLiveEvents(),
        eventService.getFreeEvents(10),
        eventService.getFeaturedEvents(10)
      ]);

      if (liveRes.status === 'fulfilled') {
        setLiveEvents(liveRes.value.events.map(transformEvent));
      }

      if (freeRes.status === 'fulfilled') {
        setFreeEvents(freeRes.value.events.map(transformEvent));
      }

      if (featuredRes.status === 'fulfilled') {
        setFeaturedEvents(featuredRes.value.events.map(transformEvent));
      }
    } catch (error) {
      console.error('Erreur critique lors du chargement des événements:', error);
    }
  };

  const onRefresh = async () => {
    await loadData();
  };

  const handleEventPress = (event: Event) => {
    // Navigation directe vers les détails de l'événement (temporaire pour les tests)
    (navigation as any).navigate('EventDetails', { eventId: event.id });
  };

  const handleLoginPress = () => {
    navigation.navigate('Login' as never);
  };


  const renderSliderItem = ({ item }: { item: SliderItem }) => (
    <View style={styles.sliderItem}>
      <Image source={item.image} style={styles.sliderImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
        style={styles.sliderGradient}
      />
      <View style={styles.sliderContent}>
        <Text style={styles.sliderTitle}>{item.title}</Text>
        <Text style={styles.sliderSubtitle}>{item.subtitle}</Text>
        <Text style={styles.sliderDescription}>{item.description}</Text>
      </View>
    </View>
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentSlideIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => {
        // Navigation vers la liste des événements filtrés par catégorie
        (navigation as any).navigate('Events', { category: item.name });
      }}
      activeOpacity={0.8}
    >
      <View style={[styles.categoryIconContainer, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon} size={24} color={brandColors.white} />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderEventCard = (event: Event, isLarge = false) => (
    <TouchableOpacity
      key={event.id}
      style={[styles.eventCard, isLarge && styles.largeEventCard]}
      onPress={() => handleEventPress(event)}
      activeOpacity={0.8}
    >
      <Image source={event.image} style={styles.eventImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
        style={styles.eventGradient}
      />
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventCategory}>{event.category}</Text>
          {event.isLive && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>
        <Text style={[styles.eventTitle, isLarge && styles.largeEventTitle]} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.eventDescription} numberOfLines={2}>
          {event.description}
        </Text>
        <View style={styles.eventFooter}>
          <View style={styles.eventDateTime}>
            <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.eventDate}>{event.date}</Text>
            <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.eventTime}>{event.time}</Text>
          </View>
          <View style={[styles.priceContainer, event.isFree && styles.freePriceContainer]}>
            <Text style={[styles.priceText, event.isFree && styles.freePriceText]}>
              {event.isFree ? 'GRATUIT' : `${event.price.toLocaleString()} FCFA`}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderLiveEventCard = (event: Event) => (
    <TouchableOpacity
      key={event.id}
      style={styles.liveEventCard}
      onPress={() => handleEventPress(event)}
      activeOpacity={0.8}
    >
      <View style={styles.liveImageContainer}>
        <Image source={event.image} style={styles.liveEventImage} />
        <View style={styles.liveOverlay}>
          <View style={styles.liveBadgeTop}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
      </View>
      <View style={styles.liveEventContent}>
        <Text style={styles.liveEventCategory}>{event.category}</Text>
        <Text style={styles.liveEventTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.liveEventDescription} numberOfLines={2}>
          {event.description}
        </Text>
        <View style={styles.liveEventFooter}>
          <View style={styles.liveEventDateTime}>
            <Ionicons name="calendar-outline" size={14} color={brandColors.mediumGray} />
            <Text style={styles.liveEventDate}>{event.date}</Text>
            <Ionicons name="time-outline" size={14} color={brandColors.mediumGray} />
            <Text style={styles.liveEventTime}>{event.time}</Text>
          </View>
          <View style={[styles.livePriceContainer, event.isFree && styles.liveFreePriceContainer]}>
            <Text style={[styles.livePriceText, event.isFree && styles.liveFreePriceText]}>
              {event.isFree ? 'GRATUIT' : `${event.price.toLocaleString()} FCFA`}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFreeEventCard = (event: Event) => (
    <TouchableOpacity
      key={event.id}
      style={styles.freeEventCard}
      onPress={() => handleEventPress(event)}
      activeOpacity={0.8}
    >
      <View style={styles.freeImageContainer}>
        <Image source={event.image} style={styles.freeEventImage} />
        <View style={styles.freeOverlay}>
          <View style={styles.freeBadge}>
            <Ionicons name="gift" size={12} color={brandColors.white} />
            <Text style={styles.freeBadgeText}>GRATUIT</Text>
          </View>
          {event.isLive && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveIndicatorText}>LIVE</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.freeEventContent}>
        <Text style={styles.freeEventCategory}>{event.category}</Text>
        <Text style={styles.freeEventTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.freeEventDescription} numberOfLines={2}>
          {event.description}
        </Text>
        <View style={styles.freeEventFooter}>
          <View style={styles.freeEventDateTime}>
            <Ionicons name="calendar-outline" size={14} color={brandColors.mediumGray} />
            <Text style={styles.freeEventDate}>{event.date}</Text>
            <Ionicons name="time-outline" size={14} color={brandColors.mediumGray} />
            <Text style={styles.freeEventTime}>{event.time}</Text>
          </View>
          <View style={styles.freeAccessContainer}>
            <Ionicons name="lock-open" size={14} color={brandColors.success} />
            <Text style={styles.freeAccessText}>Accès libre</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFeaturedEventCard = (event: Event) => (
    <TouchableOpacity
      key={event.id}
      style={styles.featuredEventCard}
      onPress={() => handleEventPress(event)}
      activeOpacity={0.8}
    >
      <View style={styles.featuredImageContainer}>
        <Image source={event.image} style={styles.featuredEventImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
          style={styles.featuredGradient}
        />
        <View style={styles.featuredOverlay}>
          <View style={styles.premiumBadgeTop}>
            <Ionicons name="diamond" size={12} color={brandColors.white} />
            <Text style={styles.premiumBadgeTopText}>PREMIUM</Text>
          </View>
          {event.isLive && (
            <View style={styles.featuredLiveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.featuredLiveText}>LIVE</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.featuredEventContent}>
        <Text style={styles.featuredEventCategory}>{event.category}</Text>
        <Text style={styles.featuredEventTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.featuredEventDescription} numberOfLines={2}>
          {event.description}
        </Text>
        <View style={styles.featuredEventFooter}>
          <View style={styles.featuredEventDateTime}>
            <Ionicons name="calendar-outline" size={14} color={brandColors.mediumGray} />
            <Text style={styles.featuredEventDate}>{event.date}</Text>
            <Ionicons name="time-outline" size={14} color={brandColors.mediumGray} />
            <Text style={styles.featuredEventTime}>{event.time}</Text>
          </View>
          <View style={styles.featuredPriceContainer}>
            <Text style={styles.featuredPriceText}>
              {event.price.toLocaleString()} FCFA
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header avec boutons de connexion ou message de bienvenue */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Image
            source={require('../../../assets/images/INSTANT+ 2.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          {isAuthenticated ? (
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>
                Bonjour, {user?.firstName || 'Utilisateur'} !
              </Text>
            </View>
          ) : (
            <View style={styles.authButtons}>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLoginPress}
                activeOpacity={0.8}
              >
                <Text style={styles.loginButtonText}>Connexion</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Slider d'accueil */}
      <View style={styles.sliderContainer}>
        <FlatList
          ref={flatListRef}
          data={sliderData}
          renderItem={renderSliderItem}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          style={styles.slider}
        />
        <View style={styles.sliderPagination}>
          {sliderData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentSlideIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Section Catégories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="grid" size={24} color={brandColors.primary} />
            <Text style={styles.sectionTitle}>Catégories</Text>
          </View>
          <TouchableOpacity
            style={styles.seeMoreButton}
            onPress={() => (navigation as any).navigate('Categories')}
            activeOpacity={0.8}
          >
            <Text style={styles.seeMoreText}>Voir plus</Text>
            <Ionicons name="chevron-forward" size={16} color={brandColors.primary} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Événements en direct */}
      {liveEvents.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="radio" size={24} color={brandColors.primary} />
              <Text style={styles.sectionTitle}>En direct maintenant</Text>
            </View>
            <TouchableOpacity
              style={styles.seeMoreButton}
              onPress={() => (navigation as any).navigate('Live')}
              activeOpacity={0.8}
            >
              <Text style={styles.seeMoreText}>Voir plus</Text>
              <Ionicons name="chevron-forward" size={16} color={brandColors.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {liveEvents.map(event => renderLiveEventCard(event))}
          </ScrollView>
        </View>
      )}

        {/* Événements passés */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="time" size={24} color={brandColors.primary} />
              <Text style={styles.sectionTitle}>Événements passés</Text>
            </View>
            <TouchableOpacity
              style={styles.seeMoreButton}
              onPress={() => (navigation as any).navigate('Events', { filter: 'past' })}
              activeOpacity={0.8}
            >
            <Text style={styles.seeMoreText}>Voir plus</Text>
            <Ionicons name="chevron-forward" size={16} color={brandColors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {freeEvents.map(event => renderFreeEventCard(event))}
        </ScrollView>
      </View>

        {/* Événements à venir */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="calendar" size={24} color={brandColors.primary} />
              <Text style={styles.sectionTitle}>Événements à venir</Text>
            </View>
            <TouchableOpacity
              style={styles.seeMoreButton}
              onPress={() => (navigation as any).navigate('Events', { filter: 'upcoming' })}
              activeOpacity={0.8}
            >
            <Text style={styles.seeMoreText}>Voir plus</Text>
            <Ionicons name="chevron-forward" size={16} color={brandColors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {featuredEvents.map(event => renderFeaturedEventCard(event))}
        </ScrollView>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: brandColors.white,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    ...shadows.sm,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 80,
  },
  authButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  loginButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: brandColors.primary,
  },
  loginButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.primary,
  },
  welcomeContainer: {
    alignItems: 'flex-end',
  },
  welcomeText: {
    color: brandColors.primary,
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_600SemiBold',
  },
  registerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    backgroundColor: brandColors.primary,
  },
  registerButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.white,
  },
  welcomeSection: {
    margin: 20,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
    position: 'relative',
  },
  welcomeBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  welcomeGradient: {
    padding: 30,
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  welcomeTitle: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    fontWeight: '900',
    textTransform: 'none',
  },
  welcomeSubtitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Montserrat_700Bold',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 24,
    fontWeight: '800',
    textTransform: 'none',
  },
  welcomeDescription: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_700Bold',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '700',
    textTransform: 'none',
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.darkGray,
    fontWeight: '800',
    textTransform: 'none',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brandColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  premiumBadgeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 102, 0, 0.1)',
    gap: 4,
  },
  seeMoreText: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.primary,
  },
  eventCard: {
    width: width * 0.7,
    marginLeft: 20,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: brandColors.white,
    ...shadows.md,
  },
  largeEventCard: {
    width: width * 0.8,
  },
  eventImage: {
    width: '100%',
    height: 180,
  },
  eventGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  eventContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  eventTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    marginBottom: 5,
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
    fontWeight: '800',
    textTransform: 'none',
  },
  largeEventTitle: {
    fontSize: typography.fontSize.xl,
    lineHeight: 26,
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
    fontWeight: '800',
  },
  eventDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    marginBottom: 10,
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    fontWeight: '700',
    textTransform: 'none',
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDate: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
    fontWeight: '700',
  },
  eventTime: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
    fontWeight: '700',
  },
  priceContainer: {
    backgroundColor: brandColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 3,
  },
  freePriceContainer: {
    backgroundColor: '#22c55e',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 3,
  },
  priceText: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontWeight: '800',
  },
  freePriceText: {
    color: brandColors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontWeight: '800',
  },
  // Styles pour la carte live
  liveEventCard: {
    width: 280,
    marginRight: 16,
    backgroundColor: brandColors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  liveImageContainer: {
    position: 'relative',
    height: 180,
  },
  liveEventImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  liveOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 12,
  },
  liveBadgeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    ...shadows.sm,
  },
  liveEventContent: {
    padding: 16,
  },
  liveEventCategory: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.primary,
    marginBottom: 8,
    textTransform: 'none',
  },
  liveEventTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.darkGray,
    marginBottom: 8,
    lineHeight: 20,
    textTransform: 'none',
  },
  liveEventDescription: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.mediumGray,
    marginBottom: 12,
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
  liveEventDate: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.mediumGray,
    textTransform: 'none',
  },
  liveEventTime: {
    fontSize: 10,
    fontFamily: 'Montserrat_500Medium',
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
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    textTransform: 'none',
  },
  liveFreePriceText: {
    color: brandColors.white,
  },
  // Styles pour la carte d'événement gratuit
  freeEventCard: {
    width: 280,
    marginRight: 16,
    backgroundColor: brandColors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
    borderWidth: 2,
    borderColor: brandColors.primary,
  },
  freeImageContainer: {
    position: 'relative',
    height: 180,
  },
  freeEventImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  freeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
  },
  freeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    ...shadows.sm,
  },
  freeBadgeText: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    marginLeft: 4,
    textTransform: 'none',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    ...shadows.sm,
  },
  liveIndicatorText: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    marginLeft: 4,
    textTransform: 'none',
  },
  freeEventContent: {
    padding: 16,
  },
  freeEventCategory: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.success,
    marginBottom: 8,
    textTransform: 'none',
  },
  freeEventTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.darkGray,
    marginBottom: 8,
    lineHeight: 20,
    textTransform: 'none',
  },
  freeEventDescription: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.mediumGray,
    marginBottom: 12,
    lineHeight: 16,
    textTransform: 'none',
  },
  freeEventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  freeEventDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  freeEventDate: {
    fontSize: 10,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.mediumGray,
    textTransform: 'none',
  },
  freeEventTime: {
    fontSize: 10,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.mediumGray,
    textTransform: 'none',
  },
  freeAccessContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  freeAccessText: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.success,
    marginLeft: 4,
    textTransform: 'none',
  },
  // Styles pour la carte d'événement en vedette
  featuredEventCard: {
    width: 280,
    marginRight: 16,
    backgroundColor: brandColors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.lg,
    borderWidth: 2,
    borderColor: brandColors.primary,
  },
  featuredImageContainer: {
    position: 'relative',
    height: 180,
  },
  featuredEventImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  featuredGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  featuredOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
  },
  premiumBadgeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 102, 0, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    ...shadows.sm,
  },
  premiumBadgeTopText: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    marginLeft: 4,
    textTransform: 'none',
  },
  featuredLiveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    ...shadows.sm,
  },
  featuredLiveText: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    marginLeft: 4,
    textTransform: 'none',
  },
  featuredEventContent: {
    padding: 16,
  },
  featuredEventCategory: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.primary,
    marginBottom: 8,
    textTransform: 'none',
  },
  featuredEventTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.darkGray,
    marginBottom: 8,
    lineHeight: 20,
    textTransform: 'none',
  },
  featuredEventDescription: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.mediumGray,
    marginBottom: 12,
    lineHeight: 16,
    textTransform: 'none',
  },
  featuredEventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  featuredEventDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredEventDate: {
    fontSize: 10,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.mediumGray,
    textTransform: 'none',
  },
  featuredEventTime: {
    fontSize: 10,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.mediumGray,
    textTransform: 'none',
  },
  featuredPriceContainer: {
    backgroundColor: brandColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  featuredPriceText: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    textTransform: 'none',
  },
  // Styles pour le slider
  sliderContainer: {
    height: 250,
    margin: 20,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.lg,
  },
  slider: {
    flex: 1,
  },
  sliderItem: {
    width: width - 40,
    height: 250,
    position: 'relative',
  },
  sliderImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  sliderGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sliderContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 30,
  },
  sliderTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    textTransform: 'none',
  },
  sliderSubtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_500Medium',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textTransform: 'none',
  },
  sliderDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_400Regular',
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textTransform: 'none',
  },
  sliderPagination: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  paginationDotActive: {
    backgroundColor: brandColors.primary,
    width: 24,
  },
  // Styles pour les catégories
  categoriesList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  categoryItem: {
    alignItems: 'center',
    width: 80,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...shadows.md,
  },
  categoryName: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.darkGray,
    textAlign: 'center',
    textTransform: 'none',
  },
});

export default GuestHomeScreen;
