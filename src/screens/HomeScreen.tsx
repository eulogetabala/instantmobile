import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeInUp,
  FadeInLeft,
  FadeInRight,
} from 'react-native-reanimated';
import { RootStackParamList } from '../types';
import { eventService } from '../services/events';
import { useAuth } from '../contexts/AuthContext';
import { brandColors, typography, borderRadius, shadows } from '../constants/theme';
import { EVENT_CATEGORIES } from '../constants';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EventImage from '../components/ui/EventImage';

const { width } = Dimensions.get('window');

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Requêtes pour les données
  const { data: featuredEventsData, isLoading: featuredLoading, refetch: refetchFeatured } = useQuery({
    queryKey: ['featuredEvents'],
    queryFn: () => eventService.getFeaturedEvents(),
  });

  const { data: upcomingEvents, isLoading: upcomingLoading, refetch: refetchUpcoming } = useQuery({
    queryKey: ['upcomingEvents'],
    queryFn: () => eventService.getUpcomingEvents(6),
  });

  const { data: liveEventsData, isLoading: liveLoading, refetch: refetchLive } = useQuery({
    queryKey: ['liveEvents'],
    queryFn: () => eventService.getLiveEvents(),
  });

  // Extraire les événements depuis les réponses API
  const liveEvents = liveEventsData?.events || [];
  const featuredEvents = featuredEventsData?.events || [];
  const upcomingEventsList = upcomingEvents?.events || [];

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchFeatured(),
        refetchUpcoming(),
        refetchLive(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // Fonction pour rendre une carte d'événement avec index de section
  const renderEventCard = (event: any, isLarge = false, index = 0, sectionIndex: number = 0) => {
    // Extraire l'eventId de manière fiable - CRITIQUE pour la distribution des images
    const eventId = event.id || event._id || event.id?.toString() || event._id?.toString() || `event-${index}`;
    // Comme dans Replay : utiliser EventImage avec posterUrl du backend si disponible
    const posterUrl = event.media?.poster || null;
    
    // Logs de débogage pour chaque événement
    if (__DEV__ && index < 3) {
      console.log(`🏠 HomeScreen - renderEventCard section=${sectionIndex} index=${index}:`, {
        eventId: eventId.substring(0, 20),
        eventIdFull: eventId,
        hasPosterUrl: !!posterUrl,
        posterUrl: posterUrl?.substring(0, 50),
        sectionIndex
      });
    }
    
    return (
      <Animated.View
        key={`event-card-${eventId}-${index}`}
        entering={FadeInUp.delay(index * 100).springify()}
        style={{
          width: isLarge ? width - 40 : width * 0.7,
          marginRight: 15,
        }}
      >
        <Card
          variant="elevated"
          padding="none"
          onPress={() => navigation.navigate('EventDetails', { eventId })}
          style={{
            overflow: 'hidden',
          }}
        >
          <View style={{ position: 'relative' }}>
            <EventImage
              posterUrl={posterUrl}
              eventId={eventId}
              sectionIndex={sectionIndex}
              style={{
                width: '100%',
                height: isLarge ? 200 : 150,
                backgroundColor: brandColors.lightGray,
              }}
              resizeMode="cover"
            />
          
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 80,
              justifyContent: 'flex-end',
              padding: 16,
            }}
          >
            <Text style={{
              color: brandColors.white,
              fontSize: isLarge ? typography.fontSize.lg : typography.fontSize.base,
              fontFamily: typography.fontFamily.bold,
              marginBottom: 4,
            }} numberOfLines={2}>
              {event.title}
            </Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="calendar-outline" size={12} color={brandColors.white} />
              <Text style={{
                color: brandColors.white,
                fontSize: typography.fontSize.xs,
                fontFamily: typography.fontFamily.regular,
                marginLeft: 4,
              }}>
                {new Date(event.startDate).toLocaleDateString('fr-FR')}
              </Text>
              
              {event.pricing.isFree && (
                <>
                  <Text style={{ color: brandColors.white, marginHorizontal: 8 }}>•</Text>
                  <Text style={{
                    color: brandColors.success,
                    fontSize: typography.fontSize.xs,
                    fontFamily: typography.fontFamily.bold,
                  }}>
                    GRATUIT
                  </Text>
                </>
              )}
            </View>
          </LinearGradient>

          {event.status === 'live' && (
            <View style={{
              position: 'absolute',
              top: 12,
              left: 12,
              backgroundColor: brandColors.error,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: borderRadius.base,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: brandColors.white,
                marginRight: 4,
              }} />
              <Text style={{
                color: brandColors.white,
                fontSize: typography.fontSize.xs,
                fontFamily: typography.fontFamily.bold,
              }}>
                EN DIRECT
              </Text>
            </View>
          )}
        </View>
      </Card>
    </Animated.View>
  );

  const renderCategoryCard = (category: any, index: number) => (
    <Animated.View
      key={category.value}
      entering={FadeInLeft.delay(index * 100).springify()}
      style={{ marginRight: 15, minWidth: 100 }}
    >
      <Card
        variant="elevated"
        padding="large"
        onPress={() => navigation.navigate('Events')}
        style={{ alignItems: 'center' }}
      >
        <Text style={{ fontSize: 32, marginBottom: 8 }}>
          {category.icon}
        </Text>
        <Text style={{
          fontSize: typography.fontSize.xs,
          fontFamily: typography.fontFamily.medium,
          color: brandColors.darkGray,
          textAlign: 'center',
        }}>
          {category.label}
        </Text>
      </Card>
    </Animated.View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: brandColors.lightGray }}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec salutation */}
        <Animated.View 
          entering={FadeInUp.delay(200).springify()}
          style={{
            padding: 20,
            paddingBottom: 10,
          }}
        >
          <Text style={{
            fontSize: typography.fontSize['2xl'],
            fontFamily: typography.fontFamily.bold,
            color: brandColors.darkGray,
            marginBottom: 4,
          }}>
            Bonjour {user?.firstName} 👋
          </Text>
          <Text style={{
            fontSize: typography.fontSize.base,
            fontFamily: typography.fontFamily.regular,
            color: brandColors.mediumGray,
          }}>
            Découvrez les meilleurs événements
          </Text>
        </Animated.View>

        {/* Événements en direct */}
        <Animated.View 
          entering={FadeInUp.delay(300).springify()}
          style={{ marginBottom: 30 }}
        >
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            marginBottom: 15,
          }}>
            <Text style={{
              fontSize: typography.fontSize.xl,
              fontFamily: typography.fontFamily.bold,
              color: brandColors.darkGray,
            }}>
              En Direct 🔴
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Live')}>
              <Text style={{
                color: brandColors.primary,
                fontSize: typography.fontSize.sm,
                fontFamily: typography.fontFamily.medium,
              }}>
                Voir tout
              </Text>
            </TouchableOpacity>
          </View>
          
          {liveEvents && liveEvents.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {liveEvents.map((event, index) => renderEventCard(event, false, index))}
            </ScrollView>
          ) : (
            <View style={{ paddingHorizontal: 20 }}>
              <Text style={{
                fontSize: typography.fontSize.base,
                fontFamily: typography.fontFamily.regular,
                color: brandColors.mediumGray,
                textAlign: 'center',
                paddingVertical: 20,
              }}>
                {liveLoading ? 'Chargement...' : 'Aucun événement en direct pour le moment'}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Événements en vedette */}
        {featuredEvents && featuredEvents.length > 0 && (
          <View style={{ marginBottom: 30 }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 20,
              marginBottom: 15,
            }}>
              <Text style={{
                fontSize: typography.fontSize.xl,
                fontFamily: typography.fontFamily.bold,
                color: brandColors.darkGray,
              }}>
                En Vedette ⭐
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Events')}>
                <Text style={{
                  color: brandColors.primary,
                  fontSize: typography.fontSize.sm,
                  fontFamily: typography.fontFamily.medium,
                }}>
                  Voir tout
                </Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {featuredEvents.map((event, index) => renderEventCard(event, true, index, 1))}
            </ScrollView>
          </View>
        )}

        {/* Catégories */}
        <Animated.View 
          entering={FadeInUp.delay(500).springify()}
          style={{ marginBottom: 30 }}
        >
          <Text style={{
            fontSize: typography.fontSize.xl,
            fontFamily: typography.fontFamily.bold,
            color: brandColors.darkGray,
            paddingHorizontal: 20,
            marginBottom: 15,
          }}>
            Catégories
          </Text>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {EVENT_CATEGORIES.map((category, index) => renderCategoryCard(category, index))}
          </ScrollView>
        </Animated.View>

        {/* Événements à venir */}
        {upcomingEvents && upcomingEvents.length > 0 && (
          <View style={{ marginBottom: 30 }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 20,
              marginBottom: 15,
            }}>
              <Text style={{
                fontSize: typography.fontSize.xl,
                fontFamily: typography.fontFamily.bold,
                color: brandColors.darkGray,
              }}>
                À Venir 📅
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Events')}>
                <Text style={{
                  color: brandColors.primary,
                  fontSize: typography.fontSize.sm,
                  fontFamily: typography.fontFamily.medium,
                }}>
                  Voir tout
                </Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {upcomingEventsList.map((event, index) => renderEventCard(event, false, index, 2))}
            </ScrollView>
          </View>
        )}

        {/* Bouton d'action rapide */}
        <Animated.View 
          entering={FadeInUp.delay(700).springify()}
          style={{
            padding: 20,
            paddingBottom: 40,
          }}
        >
          <Button
            title="Rechercher des événements"
            onPress={() => navigation.navigate('Events')}
            variant="primary"
            size="large"
            icon={<Ionicons name="search" size={20} color={brandColors.white} style={{ marginRight: 8 }} />}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

