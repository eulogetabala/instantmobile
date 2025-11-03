import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { brandColors, typography, borderRadius, shadows } from '../../constants/theme';
import { useEventAccess } from '../../hooks/useEventAccess';
import { useStreamingAccess } from '../../hooks/useStreamingAccess';
import { useAuth } from '../../contexts/AuthContext';
import { Event } from '../../types';
import AccessRequiredModal from '../../components/ui/AccessRequiredModal';
import { eventService } from '../../services/events';
import { streamingAccessService } from '../../services/streaming/streamingAccess';
import EventImage from '../../components/ui/EventImage';

const { width } = Dimensions.get('window');

interface EventDetails {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  date: string;
  time: string;
  price: number;
  isFree: boolean;
  image: any;
  category: string;
  isLive: boolean;
  organizer: string;
  location: string;
  duration: string;
  maxParticipants?: number;
  currentParticipants?: number;
}

const EventDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const { checkEventAccess, canJoinEvent, getAccessMessage, getAccessAction } = useEventAccess();
  const { hasAccess: hasStreamingAccess, checkAccess: checkStreamingAccess } = useStreamingAccess();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    loadEventDetails();
  }, []);

  useEffect(() => {
    if (event && isAuthenticated) {
      loadUserTickets();
      checkStreamingAccess(event.id);
    }
  }, [event, isAuthenticated, checkStreamingAccess]);

  useEffect(() => {
    // Vérifier l'accès après le chargement de l'événement
    if (event && !loading) {
      checkEventAccessAndShowModal();
    }
  }, [event, loading, isAuthenticated]);

  // Afficher la modal automatiquement si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (event && !loading && !isAuthenticated && (event.isFree || event.isLive)) {
      setShowAccessModal(true);
    }
  }, [event, loading, isAuthenticated]);

  const loadEventDetails = async () => {
    try {
      const eventId = route.params?.eventId;
      
      if (!eventId) {
        console.error('ID d\'événement manquant');
        setLoading(false);
        return;
      }

      // Charger les détails de l'événement depuis l'API
      const response = await eventService.getEventById(eventId);
      
      if (response.event) {
        // Utiliser l'image du backend si elle existe et est valide, sinon utiliser une image locale différente
        const posterUrl = response.event.media?.poster;
        
        // Transformer les données de l'API vers le format attendu par l'interface
        const eventDetails: EventDetails = {
          id: response.event.id,
          title: response.event.title,
          description: response.event.description,
          longDescription: response.event.description, // Utiliser la description comme description longue
          date: new Date(response.event.startDate).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          time: new Date(response.event.startDate).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          price: response.event.pricing?.isFree ? 0 : (response.event.pricing?.price?.amount || 0),
          isFree: response.event.pricing?.isFree || false,
          image: { posterUrl, eventId: response.event.id || eventId }, // Image du backend ou fallback local différente par événement
          category: response.event.category,
          isLive: response.event.streaming?.isLive || false,
          organizer: response.event.organizer 
            ? (typeof response.event.organizer === 'object' 
                ? `${response.event.organizer.firstName || ''} ${response.event.organizer.lastName || ''}`.trim() 
                : 'Organisateur inconnu')
            : (response.event.createdBy
                ? `${response.event.createdBy.firstName || ''} ${response.event.createdBy.lastName || ''}`.trim()
                : 'Organisateur inconnu'),
          location: response.event.location?.type === 'online' ? 'En ligne' : (response.event.location?.address?.city || 'Lieu à confirmer'),
          duration: response.event.duration ? `${Math.round(response.event.duration / (1000 * 60 * 60))}h` : 'Durée non spécifiée',
          maxParticipants: response.event.capacity?.total || 0,
          currentParticipants: response.event.streaming?.currentViewers || 0,
        };
        
        setEvent(eventDetails);
      } else {
        console.error('Événement non trouvé');
        // Fallback vers des données mockées en cas d'erreur
        setEvent({
          id: eventId,
          title: 'Événement non trouvé',
          description: 'Cet événement n\'existe pas ou a été supprimé',
          longDescription: 'Désolé, cet événement n\'est plus disponible.',
          date: 'Date inconnue',
          time: 'Heure inconnue',
          price: 0,
          isFree: true,
          image: require('../../../assets/images/1.jpg'),
          category: 'Autre',
          isLive: false,
          organizer: 'Organisateur inconnu',
          location: 'Lieu inconnu',
          duration: 'Durée inconnue',
          maxParticipants: 0,
          currentParticipants: 0,
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des détails de l\'événement:', error);
      
      // Fallback vers des données mockées en cas d'erreur
      const eventId = route.params?.eventId || '1';
      setEvent({
        id: eventId,
        title: 'Concert Gospel International',
        description: 'Un concert exceptionnel avec les plus grandes voix du gospel',
        longDescription: 'Ce concert unique en son genre rassemble des talents exceptionnels du monde entier pour célébrer la musique gospel. Attendez-vous à des performances vocales puissantes, des arrangements musicaux inspirants et une ambiance électrisante.',
        date: '15 Janvier 2024',
        time: '20h',
        price: 0,
        isFree: true,
        image: require('../../../assets/images/1.jpg'),
        category: 'Concert',
        isLive: true,
        organizer: 'Instant+ Events',
        location: 'En ligne',
        duration: '2h',
        maxParticipants: 1000,
        currentParticipants: 1250,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserTickets = async () => {
    if (!event || !isAuthenticated) return;
    
    try {
      const result = await streamingAccessService.getMyTicketsWithStreaming({ eventId: event.id });
      if (result.success && result.data) {
        setUserTickets(result.data.tickets || []);
      }
    } catch (error: any) {
      // Ignorer les erreurs 401 (non authentifié) et 400 (pas de billets) - c'est normal
      if (error.response?.status !== 401 && error.response?.status !== 400) {
        console.error('Erreur chargement billets:', error);
      }
    }
  };

  const checkEventAccessAndShowModal = () => {
    if (!event) return;

    // Convertir EventDetails en Event pour la vérification d'accès
    const eventForAccess: Event = convertToEventType(event);
    const access = checkEventAccess(eventForAccess);

    // Si l'utilisateur n'est pas connecté et que l'événement nécessite une connexion
    if (!isAuthenticated && (event.isFree || event.isLive)) {
      setShowAccessModal(true);
    }
  };

  const convertToEventType = (eventDetails: EventDetails): Event => {
    return {
      id: eventDetails.id,
      title: eventDetails.title,
      description: eventDetails.description,
      organizer: {
        id: '1',
        firstName: eventDetails.organizer.split(' ')[0],
        lastName: eventDetails.organizer.split(' ')[1] || '',
      },
      category: eventDetails.category.toLowerCase() as any,
      tags: [],
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      timezone: 'Africa/Kinshasa',
      location: {
        type: 'physical',
        address: {
          city: eventDetails.location,
          country: 'Congo',
        },
      },
      media: {
        poster: '',
        gallery: [],
      },
      streaming: {
        isLive: eventDetails.isLive,
        isReplayAvailable: false,
        replayAccess: 'free',
        maxViewers: eventDetails.maxParticipants || 1000,
        currentViewers: eventDetails.currentParticipants || 0,
      },
      pricing: {
        isFree: eventDetails.isFree,
        price: eventDetails.isFree ? undefined : {
          amount: eventDetails.price,
          currency: 'CDF',
        },
      },
      capacity: {
        total: eventDetails.maxParticipants || 1000,
        available: (eventDetails.maxParticipants || 1000) - (eventDetails.currentParticipants || 0),
        reserved: eventDetails.currentParticipants || 0,
      },
      status: 'published',
      visibility: 'public',
      isFeatured: false,
      stats: {
        views: 0,
        likes: 0,
        shares: 0,
        ticketsSold: 0,
        revenue: 0,
        averageRating: 0,
        totalRatings: 0,
      },
      settings: {
        allowChat: true,
        allowReactions: true,
        requireApproval: false,
        autoStart: false,
        recordingEnabled: false,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleReservePress = () => {
    if (!event) return;
    
    const eventForAccess = convertToEventType(event);
    const access = checkEventAccess(eventForAccess);
    
    if (access.canAccess) {
      (navigation as any).navigate('Reservation', { eventId: event.id });
    } else {
      const action = getAccessAction(eventForAccess);
      if (action) {
        action();
      } else {
        Alert.alert('Accès requis', access.message || 'Connexion requise');
      }
    }
  };

  const handleJoinLivePress = () => {
    if (!event) return;

    if (!isAuthenticated) {
      setShowAccessModal(true);
      return;
    }

    // Vérifier si l'utilisateur a des billets valides
    const validTicket = userTickets.find(ticket => 
      ticket.status === 'confirmed' && 
      ticket.streamingAccess?.hasAccess
    );

    if (validTicket) {
      // Navigation vers l'écran de streaming avec accès
      (navigation as any).navigate('StreamingAccess', {
        ticketId: validTicket._id,
        eventId: event.id,
        eventTitle: event.title,
      });
    } else {
      Alert.alert(
        'Accès au streaming',
        'Vous n\'avez pas de billet valide pour accéder au streaming de cet événement.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Acheter un billet', onPress: () => {
            // Navigation vers l'achat de billet
            (navigation as any).navigate('Payment', { eventId: event.id });
          }}
        ]
      );
    }
  };

  const handleLoginPress = () => {
    setShowAccessModal(false);
    (navigation as any).navigate('Login');
  };

  const handleRegisterPress = () => {
    setShowAccessModal(false);
    (navigation as any).navigate('Register');
  };

  const handleCloseModal = () => {
    setShowAccessModal(false);
    navigation.goBack();
  };

  // Si l'utilisateur n'est pas connecté et que l'événement nécessite une connexion, afficher la modal
  if (!isAuthenticated && event && (event.isFree || event.isLive) && showAccessModal) {
    return (
      <AccessRequiredModal
        visible={true}
        onClose={handleCloseModal}
        onLogin={handleLoginPress}
        onRegister={handleRegisterPress}
        title="Connexion requise"
        message="Vous devez vous connecter pour voir les détails de cet événement."
        eventType={event.isLive ? 'live' : 'free'}
      />
    );
  }

  if (loading || !event) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header avec image */}
      <View style={styles.header}>
        <EventImage
          posterUrl={typeof event.image === 'object' && 'posterUrl' in event.image ? event.image.posterUrl : null}
          eventId={typeof event.image === 'object' && 'eventId' in event.image ? event.image.eventId : event.id}
          style={styles.eventImage}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
          style={styles.imageGradient}
        />
        
        {/* Bouton retour */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color={brandColors.white} />
        </TouchableOpacity>

        {/* Badges */}
        <View style={styles.badgesContainer}>
          {event.isLive && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
          {hasStreamingAccess && (
            <View style={styles.streamingBadge}>
              <Ionicons name="videocam" size={12} color={brandColors.white} />
              <Text style={styles.streamingText}>STREAMING</Text>
            </View>
          )}
          <View style={[styles.categoryBadge, { backgroundColor: event.isFree ? brandColors.success : brandColors.primary }]}>
            <Text style={styles.categoryText}>{event.category}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Titre et prix */}
        <View style={styles.titleSection}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <View style={styles.priceContainer}>
            <Text style={[styles.priceText, event.isFree && styles.freePriceText]}>
              {event.isFree ? 'GRATUIT' : `${event.price.toLocaleString()} FCFA`}
            </Text>
          </View>
        </View>

        {/* Informations de base */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={20} color={brandColors.primary} />
            <Text style={styles.infoText}>{event.date}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color={brandColors.primary} />
            <Text style={styles.infoText}>{event.time}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={20} color={brandColors.primary} />
            <Text style={styles.infoText}>{event.location}</Text>
          </View>
        </View>

        {/* Organisateur */}
        <View style={styles.organizerSection}>
          <Text style={styles.sectionTitle}>Organisateur</Text>
          <View style={styles.organizerCard}>
            <View style={styles.organizerIcon}>
              <Ionicons name="business" size={24} color={brandColors.primary} />
            </View>
            <View style={styles.organizerInfo}>
              <Text style={styles.organizerName}>{event.organizer}</Text>
              <Text style={styles.organizerType}>Organisateur certifié</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{event.longDescription}</Text>
        </View>

        {/* Participants (si applicable) */}
        {event.maxParticipants && (
          <View style={styles.participantsSection}>
            <Text style={styles.sectionTitle}>Participants</Text>
            <View style={styles.participantsInfo}>
              <View style={styles.participantsCount}>
                <Ionicons name="people" size={20} color={brandColors.primary} />
                <Text style={styles.participantsText}>
                  {event.currentParticipants} / {event.maxParticipants} participants
                </Text>
              </View>
              <View style={styles.participantsProgress}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${(event.currentParticipants! / event.maxParticipants) * 100}%` }
                  ]} 
                />
              </View>
            </View>
          </View>
        )}

        {/* Espace pour le bouton */}
        <View style={styles.buttonSpacer} />
      </ScrollView>

      {/* Bouton d'action fixe */}
      <View style={styles.actionButtonContainer}>
        {event.isLive ? (
          <TouchableOpacity
            style={styles.joinLiveButton}
            onPress={handleJoinLivePress}
            activeOpacity={0.8}
          >
            <Ionicons name="radio" size={20} color={brandColors.white} />
            <Text style={styles.joinLiveButtonText}>Rejoindre le direct</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.reserveButton}
            onPress={handleReservePress}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar" size={20} color={brandColors.white} />
            <Text style={styles.reserveButtonText}>
              {event.isFree ? 'S\'inscrire' : 'Réserver'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: brandColors.white,
  },
  loadingText: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.mediumGray,
  },
  header: {
    height: 300,
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  badgesContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    gap: 8,
  },
  liveBadge: {
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
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    textTransform: 'none',
  },
  streamingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brandColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  streamingText: {
    color: brandColors.white,
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
    textTransform: 'none',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    ...shadows.sm,
  },
  categoryText: {
    fontSize: 10,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    textTransform: 'none',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  eventTitle: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.darkGray,
    marginBottom: 12,
    lineHeight: 32,
    textTransform: 'none',
  },
  priceContainer: {
    alignSelf: 'flex-start',
    backgroundColor: brandColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
  },
  priceText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    textTransform: 'none',
  },
  freePriceText: {
    backgroundColor: brandColors.success,
  },
  infoSection: {
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  infoText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.darkGray,
    textTransform: 'none',
  },
  organizerSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.darkGray,
    marginBottom: 12,
    textTransform: 'none',
  },
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brandColors.lightGray,
    padding: 16,
    borderRadius: borderRadius.lg,
    gap: 12,
  },
  organizerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: brandColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.darkGray,
    marginBottom: 4,
    textTransform: 'none',
  },
  organizerType: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.mediumGray,
    textTransform: 'none',
  },
  descriptionSection: {
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.darkGray,
    lineHeight: 24,
    textTransform: 'none',
  },
  participantsSection: {
    marginBottom: 24,
  },
  participantsInfo: {
    backgroundColor: brandColors.lightGray,
    padding: 16,
    borderRadius: borderRadius.lg,
  },
  participantsCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  participantsText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.darkGray,
    textTransform: 'none',
  },
  participantsProgress: {
    height: 6,
    backgroundColor: 'rgba(255, 102, 0, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: brandColors.primary,
    borderRadius: 3,
  },
  buttonSpacer: {
    height: 100,
  },
  actionButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: brandColors.white,
    borderTopWidth: 1,
    borderTopColor: brandColors.lightGray,
  },
  joinLiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brandColors.primary,
    paddingVertical: 16,
    borderRadius: borderRadius.lg,
    gap: 8,
    ...shadows.lg,
  },
  joinLiveButtonText: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    textTransform: 'none',
  },
  reserveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brandColors.primary,
    paddingVertical: 16,
    borderRadius: borderRadius.lg,
    gap: 8,
    ...shadows.lg,
  },
  reserveButtonText: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    textTransform: 'none',
  },
});

export default EventDetailsScreen;