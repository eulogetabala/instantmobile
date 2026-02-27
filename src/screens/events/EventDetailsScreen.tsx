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
import NetInfo from '@react-native-community/netinfo';
import { brandColors, typography, borderRadius, shadows } from '../../constants/theme';
import { useEventAccess } from '../../hooks/useEventAccess';
import { useStreamingAccess } from '../../hooks/useStreamingAccess';
import { useAuth } from '../../contexts/AuthContext';
import { Event } from '../../types';
import AccessRequiredModal from '../../components/ui/AccessRequiredModal';
import { eventService } from '../../services/events';
import { streamingAccessService } from '../../services/streaming/streamingAccess';
import EventImage from '../../components/ui/EventImage';
import Button from '../../components/ui/Button';

const { width } = Dimensions.get('window');

const EventDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<{ message: string; isNetworkError: boolean } | null>(null);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const { checkEventAccess, canJoinEvent, getAccessMessage, getAccessAction } = useEventAccess();
  const { hasAccess: hasStreamingAccess, checkAccess: checkStreamingAccess } = useStreamingAccess();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    loadEventDetails();
  }, []);

  useEffect(() => {
    if (event) {
      const isFree = event.pricing?.isFree === true;
      
      // Pour les événements gratuits, l'accès est automatiquement autorisé
      // Pour les événements payants, vérifier l'accès si l'utilisateur est connecté
      if (isAuthenticated && !isFree) {
        loadUserTickets();
        checkStreamingAccess(event.id);
      }
    }
  }, [event?.id, isAuthenticated, checkStreamingAccess]);

  useEffect(() => {
    // Vérifier l'accès après le chargement de l'événement
    if (event && !loading) {
      checkEventAccessAndShowModal();
    }
  }, [event, loading, isAuthenticated]);

  // Afficher la modal automatiquement si l'utilisateur n'est pas connecté
  useEffect(() => {
    const eventIsLive = event?.streaming?.isLive || event?.status === 'live';
    if (event && !loading && !isAuthenticated && (event.pricing?.isFree || eventIsLive)) {
      setShowAccessModal(true);
    }
  }, [event, loading, isAuthenticated]);

  const loadEventDetails = async (retry = false) => {
    try {
      setError(null);
      setLoading(true);
      
      const eventId = route.params?.eventId;
      
      if (!eventId) {
        console.error('ID d\'événement manquant');
        setError({ message: 'ID d\'événement manquant', isNetworkError: false });
        setLoading(false);
        return;
      }

      // Vérifier la connectivité réseau avant de faire la requête
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        setError({ 
          message: 'Aucune connexion réseau. Vérifiez votre connexion internet.', 
          isNetworkError: true 
        });
        setLoading(false);
        return;
      }

      // Charger les détails de l'événement depuis l'API avec retry automatique
      // Le retry est activé par défaut dans getEventById pour les erreurs réseau
      if (retry) {
        setRetrying(true);
      }
      
      const response = await eventService.getEventById(eventId, true);
      
      if (response.event) {
        // Utiliser directement les données de l'API sans transformation - comme HomeScreen
        setEvent(response.event);
        setError(null);
        setRetrying(false);
      } else {
        console.error('Événement non trouvé');
        setError({ message: 'Événement non trouvé', isNetworkError: false });
        setRetrying(false);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des détails de l\'événement:', error);
      
      // Détecter le type d'erreur
      const isNetworkError = 
        error.code === 'ERR_NETWORK' || 
        error.code === 'ECONNABORTED' ||
        error.message === 'Network Error' ||
        !error.response;
      
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
      
      let errorMessage = 'Impossible de charger les détails de l\'événement';
      if (isNetworkError || isTimeout) {
        errorMessage = 'Erreur de connexion après plusieurs tentatives.\n\nVérifications:\n• Le backend est démarré\n• L\'IP est correcte (voir les logs du backend)\n• Le même réseau WiFi est utilisé\n• Le firewall autorise le port 5001';
      } else if (error.response?.status === 404) {
        errorMessage = 'Événement non trouvé';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
      }
      
      setError({ 
        message: errorMessage, 
        isNetworkError: isNetworkError || isTimeout 
      });
      setRetrying(false);
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

    // Utiliser directement l'événement de l'API pour la vérification d'accès
    const access = checkEventAccess(event);
    const eventIsLive = event.streaming?.isLive || event.status === 'live';

    // Si l'utilisateur n'est pas connecté et que l'événement nécessite une connexion
    if (!isAuthenticated && (event.pricing?.isFree || eventIsLive)) {
      setShowAccessModal(true);
    }
  };

  const handleReservePress = () => {
    if (!event) return;
    
    // Pour les événements gratuits : inscription directe (pas de paiement)
    if (event.pricing?.isFree) {
      if (!isAuthenticated) {
        Alert.alert(
          'Connexion requise',
          'Vous devez être connecté pour vous inscrire à cet événement',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Se connecter', onPress: () => (navigation as any).navigate('Login') },
          ]
        );
        return;
      }
      // TODO: Implémenter l'inscription aux événements gratuits
      Alert.alert('Inscription', 'Vous êtes maintenant inscrit à cet événement !');
      return;
    }
    
    // Pour les événements payants : navigation vers l'écran de paiement
    if (!isAuthenticated) {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour réserver un billet',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => (navigation as any).navigate('Login') },
        ]
      );
      return;
    }
    
    // Navigation vers l'écran de paiement
    (navigation as any).navigate('Payment', { 
      eventId: event.id,
      quantity: 1,
    });
  };

  const handleJoinLivePress = () => {
    if (!event) return;

    // Pour les événements gratuits : accès direct, pas besoin de ticket
    const isFree = event.pricing?.isFree === true;
    
    if (isFree) {
      // Pour les événements gratuits, lancer directement la vidéo
      setIsVideoPlaying(true);
      // Scroll vers le haut pour voir la vidéo
      return;
    }

    // Pour les événements payants, vérifier l'authentification et les tickets
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
  const eventIsLive = event?.streaming?.isLive || event?.status === 'live';
  if (!isAuthenticated && event && (event.pricing?.isFree || eventIsLive) && showAccessModal) {
    return (
      <AccessRequiredModal
        visible={true}
        onClose={handleCloseModal}
        onLogin={handleLoginPress}
        onRegister={handleRegisterPress}
        title="Connexion requise"
        message="Vous devez vous connecter pour voir les détails de cet événement."
        eventType={eventIsLive ? 'live' : 'free'}
      />
    );
  }

  // Afficher l'écran d'erreur si erreur et pas d'événement
  if (error && !event) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.errorContainer}>
          <Ionicons 
            name={error.isNetworkError ? "cloud-offline-outline" : "alert-circle-outline"} 
            size={64} 
            color={brandColors.mediumGray} 
          />
          <Text style={styles.errorTitle}>
            {error.isNetworkError ? 'Erreur de connexion' : 'Erreur'}
          </Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          
          {error.isNetworkError && (
            <View style={styles.errorTips}>
              <Text style={styles.errorTipsTitle}>Vérifications à faire :</Text>
              <Text style={styles.errorTip}>• Vérifiez votre connexion internet</Text>
              <Text style={styles.errorTip}>• Vérifiez que le backend est démarré</Text>
              <Text style={styles.errorTip}>• Vérifiez que l'IP du backend est correcte</Text>
            </View>
          )}
          
          <View style={styles.errorActions}>
            <Button
              title="Réessayer"
              onPress={() => loadEventDetails(true)}
              variant="primary"
              size="large"
              icon={<Ionicons name="refresh" size={20} color={brandColors.white} style={{ marginRight: 8 }} />}
            />
            <TouchableOpacity
              style={styles.backButtonError}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>Retour</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (loading || !event) {
    return (
      <View style={styles.loadingContainer}>
        {retrying ? (
          <>
            <Ionicons name="refresh" size={32} color={brandColors.primary} />
            <Text style={styles.loadingText}>Nouvelle tentative de connexion...</Text>
            <Text style={styles.loadingSubtext}>Vérification de la connexion au serveur</Text>
          </>
        ) : (
          <Text style={styles.loadingText}>Chargement...</Text>
        )}
      </View>
    );
  }

  // Calculer les valeurs pour l'affichage
  // Dans EventDetailsScreen : TOUJOURS afficher l'image (pas de vidéo)
  // Les vidéos sont uniquement visibles dans HomeScreen pour les événements passés (replays)
  const isLive = event?.streaming?.isLive || event?.status === 'live' || false;
  
  // Vérification plus robuste pour isFree (peut être true, "true", 1, etc.)
  const pricingIsFree = event?.pricing?.isFree;
  const isFree = pricingIsFree === true || pricingIsFree === 'true' || pricingIsFree === 1 || pricingIsFree === '1';

  // Note: Dans EventDetailsScreen, on affiche toujours l'image
  // Les vidéos sont uniquement pour les événements passés dans HomeScreen

  // Fonction pour rendre le contenu image
  // Dans EventDetailsScreen : TOUJOURS afficher l'image de l'événement
  // Les vidéos sont uniquement visibles dans HomeScreen pour les événements passés (replays)
  // Pour les événements à venir : l'utilisateur recevra un lien privé de streaming le jour J
  const renderVideoContent = () => {
    if (__DEV__) {
      console.log(`🖼️ EventDetailsScreen - Affichage image (toujours):`, {
        eventId: event?.id?.substring(0, 20),
        eventStatus: event?.status,
        posterUrl: event?.media?.poster ? '✅ Disponible' : '❌ Non disponible',
      });
    }
    
    // TOUJOURS afficher l'image dans EventDetailsScreen
    // Les vidéos sont uniquement pour les événements passés dans HomeScreen
    return (
      <EventImage
        posterUrl={event?.media?.poster || null}
        eventId={event?.id}
        sectionIndex={0}
        style={styles.eventImage}
        resizeMode="cover"
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header avec image ou vidéo - utiliser directement les données de l'API comme HomeScreen */}
      <View style={styles.header}>
        {/* Pour les événements en direct ou passés : afficher thumbnail cliquable qui lance la vidéo */}
        {renderVideoContent()}
        {/* Gradient avec pointerEvents="none" pour ne pas bloquer les clics sur la vidéo */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
          style={styles.imageGradient}
          pointerEvents="none"
        />
        
        {/* Bouton retour */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color={brandColors.white} />
        </TouchableOpacity>

        {/* Badges - utiliser directement les données de l'API comme HomeScreen */}
        <View style={styles.badgesContainer}>
          {(event.streaming?.isLive || event.status === 'live') && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>EN DIRECT</Text>
            </View>
          )}
          {hasStreamingAccess && (
            <View style={styles.streamingBadge}>
              <Ionicons name="videocam" size={12} color={brandColors.white} />
              <Text style={styles.streamingText}>STREAMING</Text>
            </View>
          )}
          <View style={[styles.categoryBadge, { backgroundColor: event.pricing?.isFree ? brandColors.success : brandColors.primary }]}>
            <Text style={styles.categoryText}>{event.category}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Titre et prix - utiliser directement les données de l'API comme HomeScreen */}
        <View style={styles.titleSection}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <View style={styles.priceContainer}>
            <Text style={[styles.priceText, event.pricing?.isFree && styles.freePriceText]}>
              {event.pricing?.isFree ? 'GRATUIT' : `${event.pricing?.price?.amount?.toLocaleString() || 0} ${event.pricing?.price?.currency || 'FCFA'}`}
            </Text>
          </View>
        </View>

        {/* Informations de base - utiliser directement les données de l'API comme HomeScreen */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={20} color={brandColors.primary} />
            <Text style={styles.infoText}>
              {new Date(event.startDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color={brandColors.primary} />
            <Text style={styles.infoText}>
              {new Date(event.startDate).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={20} color={brandColors.primary} />
            <Text style={styles.infoText}>
              {event.location?.type === 'online' ? 'En ligne' : (event.location?.address?.city || event.location?.address?.fullAddress || 'Lieu à confirmer')}
            </Text>
          </View>
        </View>

        {/* Organisateur - utiliser directement les données de l'API */}
        <View style={styles.organizerSection}>
          <Text style={styles.sectionTitle}>Organisateur</Text>
          <View style={styles.organizerCard}>
            <View style={styles.organizerIcon}>
              <Ionicons name="business" size={24} color={brandColors.primary} />
            </View>
            <View style={styles.organizerInfo}>
              <Text style={styles.organizerName}>
                {(() => {
                  // Debug: logger la structure complète de organizer et createdBy
                  if (__DEV__) {
                    console.log('🔍 Organizer debug:', {
                      organizerType: typeof event.organizer,
                      organizerIsObject: typeof event.organizer === 'object',
                      organizerIsNull: event.organizer === null,
                      organizerValue: event.organizer,
                      organizerKeys: event.organizer && typeof event.organizer === 'object' ? Object.keys(event.organizer) : null,
                      organizerHasName: event.organizer && typeof event.organizer === 'object' && 'name' in event.organizer,
                      organizerNameValue: event.organizer && typeof event.organizer === 'object' ? event.organizer.name : null,
                      createdByType: typeof event.createdBy,
                      createdByIsObject: typeof event.createdBy === 'object',
                      createdByIsNull: event.createdBy === null,
                      createdByValue: event.createdBy,
                      createdByKeys: event.createdBy && typeof event.createdBy === 'object' ? Object.keys(event.createdBy) : null,
                      createdByFirstName: event.createdBy && typeof event.createdBy === 'object' ? event.createdBy.firstName : null,
                      createdByLastName: event.createdBy && typeof event.createdBy === 'object' ? event.createdBy.lastName : null,
                    });
                  }
                  
                  // organizer peut être:
                  // 1. Un objet avec name (sous-document) - { name: "...", email: "...", phone: "..." }
                  // 2. Un objet avec firstName/lastName (populate) - { firstName: "...", lastName: "..." }
                  // 3. Un ObjectId string (si c'est une référence non peuplée) - "507f1f77bcf86cd799439011"
                  // 4. null/undefined
                  
                  if (event.organizer) {
                    if (typeof event.organizer === 'object' && event.organizer !== null && !Array.isArray(event.organizer)) {
                      // Si c'est un sous-document avec name (structure normale)
                      if ('name' in event.organizer && event.organizer.name) {
                        const name = String(event.organizer.name).trim();
                        if (name && name.length > 0) {
                          if (__DEV__) {
                            console.log('✅ Utilisation de organizer.name:', name);
                          }
                          return name;
                        }
                      }
                      // Si c'est un objet populate avec firstName/lastName (ObjectId peuplé)
                      if ('firstName' in event.organizer || 'lastName' in event.organizer) {
                        const firstName = event.organizer.firstName || '';
                        const lastName = event.organizer.lastName || '';
                        const name = `${firstName} ${lastName}`.trim();
                        if (name && name.length > 0) {
                          if (__DEV__) {
                            console.log('✅ Utilisation de organizer (peuplé):', { firstName, lastName, name });
                          }
                          return name;
                        }
                      }
                      // Si c'est un objet avec id (peuplé mais peut-être sans firstName/lastName)
                      if ('id' in event.organizer && !('name' in event.organizer)) {
                        // C'est un ObjectId peuplé mais sans données, utiliser createdBy
                        if (__DEV__) {
                          console.warn('⚠️ Organizer est un ObjectId peuplé mais sans firstName/lastName');
                        }
                      }
                    }
                    // Si c'est une string
                    if (typeof event.organizer === 'string') {
                      // Si c'est un ObjectId (24 caractères hexadécimaux), ne pas l'afficher
                      if (/^[0-9a-fA-F]{24}$/.test(event.organizer)) {
                        // C'est un ObjectId, ne pas l'afficher, utiliser createdBy à la place
                        if (__DEV__) {
                          console.warn('⚠️ Organizer est un ObjectId non peuplé:', event.organizer);
                        }
                      } else {
                        // C'est probablement un nom direct
                        return event.organizer.trim();
                      }
                    }
                  }
                  // Fallback sur createdBy
                  if (event.createdBy) {
                    if (typeof event.createdBy === 'object' && event.createdBy !== null) {
                      const firstName = event.createdBy.firstName || '';
                      const lastName = event.createdBy.lastName || '';
                      const name = `${firstName} ${lastName}`.trim();
                      if (name && name.length > 0) {
                        if (__DEV__) {
                          console.log('✅ Utilisation de createdBy:', { firstName, lastName, name });
                        }
                        return name;
                      }
                      // Si createdBy existe mais n'a pas de nom, essayer d'autres propriétés
                      if (event.createdBy.email) {
                        return event.createdBy.email;
                      }
                      if (event.createdBy.phone) {
                        return event.createdBy.phone;
                      }
                    } else if (typeof event.createdBy === 'string') {
                      // Si createdBy est une string (ObjectId), ne pas l'afficher
                      if (__DEV__) {
                        console.warn('⚠️ createdBy est un ObjectId non peuplé:', event.createdBy);
                      }
                    }
                  }
                  
                  if (__DEV__) {
                    console.warn('⚠️ Aucun organisateur trouvé - organizer:', event.organizer, 'createdBy:', event.createdBy);
                  }
                  // Dernier fallback : utiliser un nom par défaut
                  return 'Instant+ Events';
                })()}
              </Text>
              <Text style={styles.organizerType}>
                {event.organizer?.company || 
                 (event.organizer?.email ? `Email: ${event.organizer.email}` : 'Organisateur certifié')}
              </Text>
            </View>
          </View>
        </View>

        {/* Description - utiliser directement les données de l'API */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{event.description || 'Aucune description disponible'}</Text>
        </View>

        {/* Participants (si applicable) - utiliser directement les données de l'API */}
        {event.capacity?.total && (
          <View style={styles.participantsSection}>
            <Text style={styles.sectionTitle}>Participants</Text>
            <View style={styles.participantsInfo}>
              <View style={styles.participantsCount}>
                <Ionicons name="people" size={20} color={brandColors.primary} />
                <Text style={styles.participantsText}>
                  {event.streaming?.currentViewers || event.capacity.reserved || 0} / {event.capacity.total} participants
                </Text>
              </View>
              <View style={styles.participantsProgress}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${((event.streaming?.currentViewers || event.capacity.reserved || 0) / event.capacity.total) * 100}%` }
                  ]} 
                />
              </View>
            </View>
          </View>
        )}

        {/* Espace pour le bouton */}
        <View style={styles.buttonSpacer} />
      </ScrollView>

      {/* Bouton d'action fixe - utiliser directement les données de l'API */}
      <View style={styles.actionButtonContainer}>
        {(event.streaming?.isLive || event.status === 'live') ? (
          // Pour les événements en direct : afficher "Rejoindre le direct" UNIQUEMENT pour les payants
          // Pour les gratuits, la vidéo est déjà visible en haut
          !isFree ? (
            <TouchableOpacity
              style={styles.joinLiveButton}
              onPress={handleJoinLivePress}
              activeOpacity={0.8}
            >
              <Ionicons name="radio" size={20} color={brandColors.white} />
              <Text style={styles.joinLiveButtonText}>Rejoindre le direct</Text>
            </TouchableOpacity>
          ) : null
        ) : (
          <TouchableOpacity
            style={styles.reserveButton}
            onPress={handleReservePress}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar" size={20} color={brandColors.white} />
            <Text style={styles.reserveButtonText}>
              {event.pricing?.isFree ? 'S\'inscrire' : 'Réserver'}
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
    marginTop: 12,
  },
  loadingSubtext: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
    marginTop: 8,
    textAlign: 'center',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: brandColors.white,
  },
  errorTitle: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: brandColors.darkGray,
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: brandColors.mediumGray,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  errorTips: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: brandColors.lightGray,
    padding: 16,
    borderRadius: borderRadius.lg,
    marginBottom: 30,
  },
  errorTipsTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: brandColors.darkGray,
    marginBottom: 12,
  },
  errorTip: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: brandColors.mediumGray,
    marginBottom: 8,
    lineHeight: 20,
  },
  errorActions: {
    width: '100%',
    maxWidth: 300,
    gap: 12,
  },
  backButtonError: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: brandColors.primary,
  },
});

export default EventDetailsScreen;