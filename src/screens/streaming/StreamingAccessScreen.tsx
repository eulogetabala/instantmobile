import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useStreamingAccess } from '../../hooks/useStreamingAccess';
import { VideoPlayer } from '../../components/streaming/VideoPlayer';
import { brandColors, typography, borderRadius, shadows } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

const StreamingAccessScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  
  const { ticketId, eventId, eventTitle } = route.params as {
    ticketId: string;
    eventId: string;
    eventTitle: string;
  };

  const {
    hasAccess,
    isLoading,
    error,
    streamingAccess,
    getStreamingLink,
    recordAccess,
    canWatch,
    canChat,
    canReplay,
    isAccessValid,
  } = useStreamingAccess(eventId);

  const [isStreaming, setIsStreaming] = useState(false);
  const [watchTime, setWatchTime] = useState(0);

  useEffect(() => {
    if (ticketId) {
      getStreamingLink(ticketId);
    }
  }, [ticketId, getStreamingLink]);

  // Enregistrer le temps de visionnage périodiquement
  useEffect(() => {
    if (isStreaming && ticketId) {
      const interval = setInterval(() => {
        setWatchTime(prev => prev + 10); // +10 secondes
        recordAccess(ticketId, 10);
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [isStreaming, ticketId, recordAccess]);

  const handleStreamStart = () => {
    setIsStreaming(true);
    if (ticketId) {
      recordAccess(ticketId, 0);
    }
  };

  const handleStreamEnd = () => {
    setIsStreaming(false);
    if (ticketId && watchTime > 0) {
      recordAccess(ticketId, watchTime);
    }
  };

  const handleError = (error: string) => {
    Alert.alert('Erreur de streaming', error);
  };

  const formatWatchTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}min ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}min ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={brandColors.primary} />
      <Text style={styles.loadingText}>Chargement du streaming...</Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={64} color={brandColors.error} />
      <Text style={styles.errorTitle}>Erreur d'accès</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => getStreamingLink(ticketId)}
      >
        <Text style={styles.retryButtonText}>Réessayer</Text>
      </TouchableOpacity>
    </View>
  );

  const renderNoAccessState = () => (
    <View style={styles.noAccessContainer}>
      <Ionicons name="lock-closed" size={64} color={brandColors.mediumGray} />
      <Text style={styles.noAccessTitle}>Accès non autorisé</Text>
      <Text style={styles.noAccessMessage}>
        Vous n'avez pas accès au streaming pour cet événement.
      </Text>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Retour</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStreamingContent = () => {
    if (!streamingAccess) return null;

    const { streamingUrl, event, ticket } = streamingAccess;

    return (
      <View style={styles.streamingContainer}>
        {/* Header avec informations */}
        <View style={styles.streamingHeader}>
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={brandColors.white} />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {event.title}
            </Text>
            <View style={styles.headerDetails}>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>
                  {event.streaming.isLive ? 'LIVE' : 'REPLAY'}
                </Text>
              </View>
              <Text style={styles.viewerCount}>
                {event.streaming.currentViewers} spectateurs
              </Text>
            </View>
          </View>
        </View>

        {/* Lecteur vidéo */}
        <View style={styles.videoContainer}>
          <VideoPlayer
            streamUrl={streamingUrl.hls}
            title={event.title}
            isLive={event.streaming.isLive}
            eventId={event.id}
            onFullscreenChange={(isFullscreen) => {
              // Gérer le changement de mode plein écran
            }}
            onError={handleError}
          />
        </View>

        {/* Informations du billet */}
        <View style={styles.ticketInfo}>
          <View style={styles.ticketRow}>
            <Ionicons name="ticket" size={16} color={brandColors.mediumGray} />
            <Text style={styles.ticketText}>
              Billet: {ticket.ticketNumber}
            </Text>
          </View>
          
          <View style={styles.ticketRow}>
            <Ionicons name="time" size={16} color={brandColors.mediumGray} />
            <Text style={styles.ticketText}>
              Temps de visionnage: {formatWatchTime(watchTime)}
            </Text>
          </View>
          
          <View style={styles.ticketRow}>
            <Ionicons name="shield-checkmark" size={16} color={brandColors.success} />
            <Text style={styles.ticketText}>
              Accès valide jusqu'au {new Date(ticket.validUntil).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        </View>

        {/* Permissions */}
        <View style={styles.permissionsContainer}>
          <Text style={styles.permissionsTitle}>Permissions d'accès</Text>
          <View style={styles.permissionsList}>
            <View style={styles.permissionItem}>
              <Ionicons 
                name={canWatch ? "checkmark-circle" : "close-circle"} 
                size={20} 
                color={canWatch ? brandColors.success : brandColors.error} 
              />
              <Text style={styles.permissionText}>
                {canWatch ? 'Visionnage autorisé' : 'Visionnage non autorisé'}
              </Text>
            </View>
            
            <View style={styles.permissionItem}>
              <Ionicons 
                name={canChat ? "checkmark-circle" : "close-circle"} 
                size={20} 
                color={canChat ? brandColors.success : brandColors.error} 
              />
              <Text style={styles.permissionText}>
                {canChat ? 'Chat autorisé' : 'Chat non autorisé'}
              </Text>
            </View>
            
            <View style={styles.permissionItem}>
              <Ionicons 
                name={canReplay ? "checkmark-circle" : "close-circle"} 
                size={20} 
                color={canReplay ? brandColors.success : brandColors.error} 
              />
              <Text style={styles.permissionText}>
                {canReplay ? 'Replay autorisé' : 'Replay non autorisé'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return renderLoadingState();
  }

  if (error || !hasAccess) {
    return renderErrorState();
  }

  if (!isAccessValid) {
    return renderNoAccessState();
  }

  return (
    <View style={styles.container}>
      {renderStreamingContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: brandColors.white,
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_500Medium',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 40,
  },
  errorTitle: {
    color: brandColors.white,
    fontSize: typography.fontSize.xl,
    fontFamily: 'Montserrat_700Bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    color: brandColors.lightGray,
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_400Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: brandColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: borderRadius.lg,
  },
  retryButtonText: {
    color: brandColors.white,
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_600SemiBold',
  },
  noAccessContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 40,
  },
  noAccessTitle: {
    color: brandColors.white,
    fontSize: typography.fontSize.xl,
    fontFamily: 'Montserrat_700Bold',
    marginTop: 16,
    marginBottom: 8,
  },
  noAccessMessage: {
    color: brandColors.lightGray,
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_400Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: brandColors.mediumGray,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: borderRadius.lg,
  },
  backButtonText: {
    color: brandColors.white,
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_600SemiBold',
  },
  streamingContainer: {
    flex: 1,
  },
  streamingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    color: brandColors.white,
    fontSize: typography.fontSize.lg,
    fontFamily: 'Montserrat_700Bold',
    marginBottom: 4,
  },
  headerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: brandColors.white,
  },
  liveText: {
    color: brandColors.white,
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_700Bold',
  },
  viewerCount: {
    color: brandColors.lightGray,
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_500Medium',
  },
  videoContainer: {
    height: height * 0.4,
  },
  ticketInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  ticketText: {
    color: brandColors.lightGray,
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_400Regular',
  },
  permissionsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  permissionsTitle: {
    color: brandColors.white,
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_600SemiBold',
    marginBottom: 12,
  },
  permissionsList: {
    gap: 8,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  permissionText: {
    color: brandColors.lightGray,
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_400Regular',
  },
});

export default StreamingAccessScreen;
