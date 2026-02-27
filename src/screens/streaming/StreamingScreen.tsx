import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { brandColors, typography, borderRadius, shadows } from '../../constants/theme';
import { streamingService } from '../../services/streaming';
import { eventService } from '../../services/events';
import { AgoraVideoPlayer } from '../../components/streaming/AgoraVideoPlayer';
import VideoPlayer from '../../components/ui/VideoPlayer';
import { getEventImage } from '../../utils/image';

const { width, height } = Dimensions.get('window');

interface StreamingScreenProps {
  route?: {
    params?: {
      eventId: string;
      isReplay?: boolean;
    };
  };
}

const StreamingScreen: React.FC<StreamingScreenProps> = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { isAuthenticated } = useAuth();
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [eventInfo, setEventInfo] = useState<any>(null);
  const [agoraAccess, setAgoraAccess] = useState<any>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const eventId = (route.params as any)?.eventId;
  const isReplay = (route.params as any)?.isReplay || false;
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (eventId) {
      loadEventInfo();
      if (!isReplay) {
        joinLiveStream();
      } else {
        loadReplay();
      }
    }
    
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [eventId, isReplay]);

  const loadEventInfo = async () => {
    try {
      setIsLoading(true);
      const data = await eventService.getEventById(eventId);
      setEventInfo(data.event);
      setViewerCount(data.event.streaming?.currentViewers || 0);
    } catch (error) {
      console.error('Erreur lors du chargement des infos événement:', error);
      setError('Impossible de charger les informations de l\'événement');
    } finally {
      setIsLoading(false);
    }
  };

  const joinLiveStream = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const access = await streamingService.getAgoraToken(eventId);
      setAgoraAccess(access);
    } catch (error: any) {
      console.error('Erreur lors de la connexion au stream:', error);
      setError(error.message || 'Erreur lors de la connexion au live');
    } finally {
      setIsLoading(false);
    }
  };

  const loadReplay = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await streamingService.getStreamUrl(eventId);
      console.log('🔗 URL du Replay récupérée:', data.hlsUrl);
      setStreamUrl(data.hlsUrl);
      setIsLoading(false);
      setIsPlaying(true);
    } catch (error: any) {
      console.error('Erreur lors du chargement du replay:', error);
      setError(error.message || 'Erreur lors du chargement de la vidéo');
      setIsLoading(false);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    StatusBar.setHidden(!isFullscreen, 'fade');
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const sendMessage = () => {
    if (newMessage.trim() && isAuthenticated) {
      const message = {
        id: Date.now().toString(),
        user: 'Vous',
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
        isOwn: true,
      };
      setChatMessages(prev => [...prev, message]);
      setNewMessage('');
    } else if (!isAuthenticated) {
      Alert.alert('Connexion requise', 'Connectez-vous pour participer au chat');
    }
  };

  const formatTime = (timeInMs: number) => {
    const hours = Math.floor(timeInMs / 3600000);
    const minutes = Math.floor((timeInMs % 3600000) / 60000);
    const seconds = Math.floor((timeInMs % 60000) / 1000);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderVideoPlayer = () => (
    <View style={[styles.videoContainer, isFullscreen && styles.fullscreenVideo]}>
      {/* Lecteur vidéo Agora ou Placeholder Replay */}
      <TouchableOpacity
        style={styles.videoArea}
        onPress={showControlsTemporarily}
        activeOpacity={1}
      >
        {!isReplay && agoraAccess ? (
          <AgoraVideoPlayer
            appId={agoraAccess.agoraAppId}
            channelName={agoraAccess.channelName}
            token={agoraAccess.token}
            uid={parseInt(agoraAccess.uid)}
            title={eventInfo?.title}
            onClose={() => navigation.goBack()}
          />
        ) : isReplay && streamUrl ? (
          <VideoPlayer
            videoUrl={streamUrl}
            height={isFullscreen ? height : height * 0.4}
            shouldPlay={isPlaying}
            resizeMode="contain"
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <View style={styles.videoPlaceholder}>
            {error ? (
              <>
                <Ionicons name="alert-circle" size={60} color="#ff4444" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={isReplay ? loadReplay : joinLiveStream}>
                  <Text style={styles.retryText}>Réessayer</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Ionicons 
                  name={isReplay ? "play-circle" : "radio"} 
                  size={80} 
                  color={brandColors.white} 
                />
                <Text style={styles.videoPlaceholderText}>
                  {isReplay ? 'Chargement du Replay...' : 'Connexion au direct...'}
                </Text>
              </>
            )}
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={brandColors.white} />
                <Text style={styles.loadingText}>Patientez...</Text>
              </View>
            )}
          </View>
        )}

        {/* Contrôles vidéo */}
        {showControls && (
          <View style={styles.videoControls}>
            <View style={styles.topControls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color={brandColors.white} />
              </TouchableOpacity>
              
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle} numberOfLines={1}>
                  {eventInfo?.title || 'Événement'}
                </Text>
                {!isReplay && (
                  <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                    <Text style={styles.viewerCount}>{viewerCount} spectateurs</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.controlButton}
                onPress={toggleFullscreen}
              >
                <Ionicons 
                  name={isFullscreen ? "contract" : "expand"} 
                  size={24} 
                  color={brandColors.white} 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.centerControls}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={togglePlayPause}
              >
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={40} 
                  color={brandColors.white} 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.bottomControls}>
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Text>
              </View>

              <View style={styles.volumeContainer}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={toggleMute}
                >
                  <Ionicons 
                    name={isMuted ? "volume-mute" : "volume-high"} 
                    size={20} 
                    color={brandColors.white} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderChat = () => (
    <View style={styles.chatContainer}>
      <View style={styles.chatHeader}>
        <Text style={styles.chatTitle}>Chat</Text>
        <Text style={styles.chatSubtitle}>
          {viewerCount} participant{viewerCount > 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView 
        style={styles.chatMessages}
        showsVerticalScrollIndicator={false}
      >
        {chatMessages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageContainer,
              message.isOwn && styles.ownMessage
            ]}
          >
            <Text style={styles.messageUser}>{message.user}</Text>
            <Text style={styles.messageText}>{message.message}</Text>
            <Text style={styles.messageTime}>
              {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        ))}
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatInputContainer}
      >
        <TextInput
          style={styles.chatInput}
          placeholder={isAuthenticated ? "Tapez votre message..." : "Connectez-vous pour chatter"}
          value={newMessage}
          onChangeText={setNewMessage}
          editable={isAuthenticated}
          multiline
          maxLength={200}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newMessage.trim() || !isAuthenticated) && styles.sendButtonDisabled
          ]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || !isAuthenticated}
        >
          <Ionicons name="send" size={20} color={brandColors.white} />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );

  if (isFullscreen) {
    return (
      <View style={styles.fullscreenContainer}>
        {renderVideoPlayer()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {renderVideoPlayer()}
      
      {!isFullscreen && (
        <View style={styles.contentContainer}>
          {renderChat()}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  videoContainer: {
    width: '100%',
    height: height * 0.4,
    backgroundColor: '#000000',
  },
  fullscreenVideo: {
    height: height,
  },
  videoArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    width: '100%',
  },
  videoPlaceholderText: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.white,
    marginTop: 16,
    textTransform: 'none',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.white,
    textTransform: 'none',
  },
  videoControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 16,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 40,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventInfo: {
    flex: 1,
    marginHorizontal: 16,
  },
  eventTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.white,
    textAlign: 'center',
    textTransform: 'none',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
    marginRight: 6,
  },
  liveText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_700Bold',
    color: '#ff4444',
    marginRight: 8,
    textTransform: 'none',
  },
  viewerCount: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.white,
    textTransform: 'none',
  },
  centerControls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 20,
  },
  timeContainer: {
    flex: 1,
  },
  timeText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.white,
    textTransform: 'none',
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: brandColors.white,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: brandColors.white,
  },
  chatHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.lightGray,
  },
  chatTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.darkGray,
    textTransform: 'none',
  },
  chatSubtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
    marginTop: 2,
    textTransform: 'none',
  },
  chatMessages: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: brandColors.lightGray + '30',
    borderRadius: borderRadius.md,
  },
  ownMessage: {
    backgroundColor: brandColors.primary + '15',
    alignSelf: 'flex-end',
    marginLeft: 40,
  },
  messageUser: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.primary,
    marginBottom: 4,
    textTransform: 'none',
  },
  messageText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.darkGray,
    lineHeight: 20,
    textTransform: 'none',
  },
  messageTime: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
    marginTop: 4,
    textTransform: 'none',
  },
  chatInputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: brandColors.lightGray,
    alignItems: 'flex-end',
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: brandColors.lightGray,
    borderRadius: borderRadius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.darkGray,
    maxHeight: 100,
    marginRight: 12,
    textTransform: 'none',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: brandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: brandColors.lightGray,
  },
  errorText: {
    color: brandColors.white,
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 30,
    fontFamily: 'Montserrat_500Medium',
  },
  retryButton: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: brandColors.primary,
    borderRadius: borderRadius.md,
  },
  retryText: {
    color: brandColors.white,
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: typography.fontSize.sm,
  },
});

export default StreamingScreen;