import React, { useState, useRef, useCallback, useMemo } from 'react';
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
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { brandColors, typography, borderRadius, shadows } from '../constants/theme';
import { eventService } from '../services/events';
import { Event as ApiEvent } from '../types';
import EventImage from '../components/ui/EventImage';

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
  icon?: string;
  color?: string;
  value?: string;
  eventCount?: number;
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isAuthenticated, user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Données du slider
  const sliderData: SliderItem[] = [
    {
      id: '1',
      title: 'Bienvenue sur INSTANT+',
      subtitle: 'Événements exceptionnels',
      description: 'Découvrez des contenus premium en streaming',
      image: require('../../assets/images/on1.webp'),
    },
    {
      id: '2',
      title: 'Contenu Premium',
      subtitle: 'Accès exclusif',
      description: 'Profitez d\'événements en direct et de formations',
      image: require('../../assets/images/1.jpg'),
    },
    {
      id: '3',
      title: 'Communauté Active',
      subtitle: 'Rejoignez-nous',
      description: 'Connectez-vous pour accéder à tous nos contenus',
      image: require('../../assets/images/2.jpg'),
    },
  ];

  // Requêtes pour les données
  const { data: featuredEventsData, refetch: refetchFeatured } = useQuery({
    queryKey: ['featuredEvents'],
    queryFn: () => eventService.getFeaturedEvents(10),
    retry: 3,
    staleTime: 5 * 60 * 1000,
  });

  const { data: categoriesData, refetch: refetchCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { categoryService } = await import('../services/categories');
      const response = await categoryService.getCategories();
      return response.data?.categories || [];
    },
    retry: 3,
    staleTime: 10 * 60 * 1000,
  });

  const { data: liveEventsData, refetch: refetchLive } = useQuery({
    queryKey: ['liveEvents'],
    queryFn: () => eventService.getLiveEvents(),
    retry: 3,
    staleTime: 1 * 60 * 1000,
    refetchInterval: 30 * 1000,
  });

  const { data: freeEventsData, refetch: refetchFree } = useQuery({
    queryKey: ['freeEvents'],
    queryFn: () => eventService.getFreeEvents(10),
    retry: 3,
    staleTime: 5 * 60 * 1000,
  });

  const transformEvent = (event: ApiEvent): Event => ({
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
    image: event.media?.poster || null, // Passer directement l'URL pour EventImage
    category: event.category,
    isLive: event.streaming?.isLive || event.status === 'live',
  });

  const onRefresh = async () => {
    setRefreshing(true);
      await Promise.all([
        refetchFeatured(),
        refetchLive(),
      refetchFree(),
        refetchCategories(),
      ]);
      setRefreshing(false);
  };

  const handleEventPress = useCallback((event: Event) => {
    (navigation as any).navigate('EventDetails', { eventId: event.id });
  }, [navigation]);

  const handleLoginPress = () => {
    (navigation as any).navigate('Login');
  };

  const renderSliderItem = useCallback(({ item }: { item: SliderItem }) => (
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
  ), []);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentSlideIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderCategoryItem = useCallback(({ item }: { item: Category }) => {
    // Normaliser le nom de la catégorie (enlever accents, mettre en minuscules)
    const normalizeName = (name: string) => {
      return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
        .trim();
    };

    // Mapping des icônes par ID ou nom normalisé (correspond à eventCategories.ts)
    const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
      // Par ID
      'concert': 'musical-notes',
      'theater': 'theater-masks',
      'théâtre': 'theater-masks',
      'seminar': 'school',
      'séminaire': 'school',
      'gospel': 'heart',
      'sport': 'football',
      'festival': 'star',
      'conference': 'people',
      'conférence': 'people',
      'workshop': 'construct',
      'atelier': 'construct',
      'exhibition': 'image',
      'exposition': 'image',
      'other': 'ellipsis-horizontal',
      'autre': 'ellipsis-horizontal',
    };

    // Mapping des couleurs par ID ou nom normalisé
    const categoryColors: Record<string, string> = {
      'concert': '#FF6B35',
      'theater': '#9C27B0',
      'théâtre': '#9C27B0',
      'seminar': '#2196F3',
      'séminaire': '#2196F3',
      'gospel': '#96CEB4',
      'sport': '#4CAF50',
      'festival': '#FF9800',
      'conference': '#607D8B',
      'conférence': '#607D8B',
      'workshop': '#795548',
      'atelier': '#795548',
      'exhibition': '#E91E63',
      'exposition': '#E91E63',
      'other': '#9E9E9E',
      'autre': '#9E9E9E',
    };

    // Utiliser l'icône et la couleur de l'API si disponibles, sinon utiliser le mapping
    const normalizedName = normalizeName(item.name);
    const normalizedId = item.id ? normalizeName(item.id) : '';
    
    // Essayer d'abord par ID, puis par nom normalisé
    const icon = (item.icon as keyof typeof Ionicons.glyphMap) || 
                categoryIcons[normalizedId] || 
                categoryIcons[normalizedName] || 
                'grid';
    
    const color = item.color || 
                  categoryColors[normalizedId] || 
                  categoryColors[normalizedName] || 
                  '#9E9E9E';

    const handleCategoryPress = () => {
      // Navigation vers la page des événements avec filtre par catégorie
      const tabNavigator = isAuthenticated ? 'MainTabs' : 'GuestTabs';
      
      // Utiliser value (correspond à la valeur enum dans les événements), puis id, puis le nom normalisé
      const categoryValue = item.value || item.id || item.name.toLowerCase();
      
      (navigation as any).navigate(tabNavigator, { 
        screen: 'Events',
        params: {
          screen: 'EventList',
          params: {
            filter: 'all', 
            category: categoryValue,
            categoryName: item.name 
          }
        }
      });
    };

                return (
                      <TouchableOpacity
        style={styles.categoryItem}
        onPress={handleCategoryPress}
        activeOpacity={0.8}
      >
        <View style={[styles.categoryIconContainer, { backgroundColor: color }]}>
          <Ionicons name={icon} size={24} color={brandColors.white} />
                        </View>
        <Text style={styles.categoryName}>{item.name}</Text>
                      </TouchableOpacity>
    );
  }, [navigation, isAuthenticated]);

  const renderLiveEventCard = useCallback((event: Event) => (
    <TouchableOpacity
      key={event.id}
      style={styles.liveEventCard}
      onPress={() => handleEventPress(event)}
      activeOpacity={0.8}
    >
      <View style={styles.liveImageContainer}>
              <EventImage
          posterUrl={typeof event.image === 'string' ? event.image : null}
          eventId={event.id}
          sectionIndex={0}
          style={styles.liveEventImage}
                resizeMode="cover"
              />
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
  ), [handleEventPress]);

  const renderFreeEventCard = useCallback((event: Event) => (
    <TouchableOpacity
      key={event.id}
      style={styles.freeEventCard}
      onPress={() => handleEventPress(event)}
      activeOpacity={0.8}
    >
      <View style={styles.freeImageContainer}>
        <EventImage
          posterUrl={typeof event.image === 'string' ? event.image : null}
          eventId={event.id}
          sectionIndex={1}
          style={styles.freeEventImage}
          resizeMode="cover"
        />
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
  ), [handleEventPress]);

  const renderFeaturedEventCard = useCallback((event: Event) => (
      <TouchableOpacity
      key={event.id}
      style={styles.featuredEventCard}
      onPress={() => handleEventPress(event)}
        activeOpacity={0.8}
      >
      <View style={styles.featuredImageContainer}>
        <EventImage
          posterUrl={typeof event.image === 'string' ? event.image : null}
          eventId={event.id}
          sectionIndex={2}
          style={styles.featuredEventImage}
          resizeMode="cover"
        />
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
  ), [handleEventPress]);

  // Extraire et mémoriser les données pour éviter les re-renders
  const categories = useMemo(() => categoriesData || [], [categoriesData]);
  const liveEvents = useMemo(() => 
    (liveEventsData?.events || []).map(transformEvent), 
    [liveEventsData?.events, transformEvent]
  );
  const freeEvents = useMemo(() => 
    (freeEventsData?.events || []).map(transformEvent), 
    [freeEventsData?.events, transformEvent]
  );
  const featuredEvents = useMemo(() => 
    (featuredEventsData?.events || []).map(transformEvent), 
    [featuredEventsData?.events, transformEvent]
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
            source={require('../../assets/images/INSTANT+ 2.png')}
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
          removeClippedSubviews={true}
          maxToRenderPerBatch={3}
          windowSize={3}
          initialNumToRender={2}
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
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          windowSize={5}
          initialNumToRender={5}
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
          <FlatList
            data={liveEvents}
            renderItem={useCallback(({ item }) => renderLiveEventCard(item), [renderLiveEventCard])}
            keyExtractor={useCallback((item) => item.id, [])}
            horizontal
            showsHorizontalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={3}
            windowSize={3}
            initialNumToRender={2}
            getItemLayout={(data, index) => ({
              length: width * 0.85,
              offset: width * 0.85 * index,
              index,
            })}
          />
        </View>
      )}

      {/* Événements passés (gratuits) */}
      {freeEvents.length > 0 && (
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
          <FlatList
            data={freeEvents}
            renderItem={useCallback(({ item }) => renderFreeEventCard(item), [renderFreeEventCard])}
            keyExtractor={useCallback((item) => item.id, [])}
            horizontal
            showsHorizontalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={3}
            windowSize={3}
            initialNumToRender={2}
            getItemLayout={(data, index) => ({
              length: width * 0.85,
              offset: width * 0.85 * index,
              index,
            })}
          />
          </View>
        )}

      {/* Événements à venir (en vedette) */}
      {featuredEvents.length > 0 && (
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
          <FlatList
            data={featuredEvents}
            renderItem={useCallback(({ item }) => renderFeaturedEventCard(item), [renderFeaturedEventCard])}
            keyExtractor={useCallback((item) => item.id, [])}
            horizontal
            showsHorizontalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={3}
            windowSize={3}
            initialNumToRender={2}
            getItemLayout={(data, index) => ({
              length: width * 0.85,
              offset: width * 0.85 * index,
              index,
            })}
          />
        </View>
      )}

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
  // Styles pour la carte live
  liveEventCard: {
    width: 280,
    marginRight: 16,
    marginLeft: 20,
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
    marginLeft: 4,
    textTransform: 'none',
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
    marginLeft: 20,
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
    marginLeft: 20,
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
});

export default HomeScreen;
