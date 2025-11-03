import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VolumeSlider } from './VolumeSlider';
import { PlaybackSpeedSelector } from './PlaybackSpeedSelector';
import { QualitySelector } from './QualitySelector';
import { AdaptiveQualityIndicator } from './AdaptiveQualityIndicator';
import { useNetworkQuality } from '../../hooks/useNetworkQuality';
import { adaptiveStreamingService } from '../../services/streaming/adaptiveStreaming';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface VideoPlayerProps {
  streamUrl: string;
  title: string;
  isLive?: boolean;
  eventId?: string;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  onError?: (error: string) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  streamUrl,
  title,
  isLive = false,
  eventId,
  onFullscreenChange,
  onError,
}) => {
  const videoRef = useRef<Video>(null);
  const insets = useSafeAreaInsets();
  const { networkQuality, isLoading: isNetworkLoading, refreshQuality, setQuality } = useNetworkQuality();
  
  // États du lecteur
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [error, setError] = useState<string | null>(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSpeedSelector, setShowSpeedSelector] = useState(false);
  const [showQualitySelector, setShowQualitySelector] = useState(false);
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [adaptiveQualityEnabled, setAdaptiveQualityEnabled] = useState(true);
  const [currentStreamUrl, setCurrentStreamUrl] = useState(streamUrl);

  // Timer pour masquer les contrôles
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Validation des props
  useEffect(() => {
    if (!streamUrl || typeof streamUrl !== 'string') {
      const errorMsg = 'URL de stream invalide';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [streamUrl, onError]);

  // Configuration du streaming adaptatif
  useEffect(() => {
    if (eventId && streamUrl) {
      // Extraire l'URL de base (sans la qualité spécifique)
      const baseUrl = streamUrl.replace(/\/\d+p\.m3u8$/, '');
      adaptiveStreamingService.configureStream(eventId, baseUrl);
    }
  }, [eventId, streamUrl]);

  // Mise à jour automatique de la qualité basée sur le réseau
  useEffect(() => {
    if (adaptiveQualityEnabled && networkQuality.quality !== 'auto') {
      setCurrentQuality(networkQuality.quality);
    }
  }, [networkQuality.quality, adaptiveQualityEnabled]);

  // Mise à jour de l'URL de streaming basée sur la qualité
  useEffect(() => {
    if (eventId && adaptiveStreamingService.hasStreamConfig(eventId)) {
      const optimalUrl = adaptiveStreamingService.getOptimalStreamUrl(eventId, networkQuality);
      if (optimalUrl && optimalUrl !== currentStreamUrl) {
        setCurrentStreamUrl(optimalUrl);
      }
    }
  }, [eventId, networkQuality, currentStreamUrl]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Masquer les contrôles après 3 secondes
  const hideControlsAfterDelay = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  // Afficher les contrôles et redémarrer le timer
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    hideControlsAfterDelay();
  }, [hideControlsAfterDelay]);

  // Gestion du statut de lecture
  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      setIsLoading(status.isBuffering);
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);
    } else if ('error' in status && status.error) {
      const errorMessage = `Erreur de chargement: ${status.error}`;
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [onError]);

  // Contrôles de lecture
  const togglePlayPause = useCallback(async () => {
    try {
      if (!videoRef.current) return;
      
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      showControlsTemporarily();
    } catch (err) {
      console.error('Erreur play/pause:', err);
      const errorMsg = 'Erreur lors de la lecture/pause';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [isPlaying, showControlsTemporarily, onError]);

  const toggleMute = useCallback(async () => {
    try {
      if (!videoRef.current) return;
      
      const newMuted = !isMuted;
      await videoRef.current.setIsMutedAsync(newMuted);
      setIsMuted(newMuted);
      showControlsTemporarily();
    } catch (err) {
      console.error('Erreur mute/unmute:', err);
    }
  }, [isMuted, showControlsTemporarily]);

  const showVolumeSliderTemporarily = useCallback(() => {
    setShowVolumeSlider(true);
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const changeVolume = useCallback(async (newVolume: number) => {
    try {
      if (!videoRef.current) return;
      
      await videoRef.current.setVolumeAsync(newVolume);
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
      showControlsTemporarily();
    } catch (err) {
      console.error('Erreur changement volume:', err);
    }
  }, [showControlsTemporarily]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!videoRef.current) return;
      
      const newFullscreen = !isFullscreen;
      
      if (newFullscreen) {
        await videoRef.current.presentFullscreenPlayer();
        StatusBar.setHidden(true, 'fade');
      } else {
        await videoRef.current.dismissFullscreenPlayer();
        StatusBar.setHidden(false, 'fade');
      }
      
      setIsFullscreen(newFullscreen);
      onFullscreenChange?.(newFullscreen);
      showControlsTemporarily();
    } catch (err) {
      console.error('Erreur fullscreen:', err);
    }
  }, [isFullscreen, onFullscreenChange, showControlsTemporarily]);

  const changePlaybackRate = useCallback(async (rate: number) => {
    try {
      if (!videoRef.current) return;
      
      await videoRef.current.setRateAsync(rate, true);
      setPlaybackRate(rate);
      showControlsTemporarily();
    } catch (err) {
      console.error('Erreur changement vitesse:', err);
    }
  }, [showControlsTemporarily]);

  const handleQualitySelect = useCallback((quality: string) => {
    setCurrentQuality(quality);
    setAdaptiveQualityEnabled(quality === 'auto');
    
    if (quality !== 'auto' && eventId) {
      setQuality(quality as any);
      // Mettre à jour l'URL de streaming immédiatement
      const newUrl = adaptiveStreamingService.getOptimalStreamUrl(eventId, {
        ...networkQuality,
        quality: quality as any,
      });
      if (newUrl) {
        setCurrentStreamUrl(newUrl);
      }
    }
    
    showControlsTemporarily();
  }, [setQuality, showControlsTemporarily, eventId, networkQuality]);

  const seekTo = useCallback(async (positionMillis: number) => {
    try {
      if (!videoRef.current || isLive) return;
      
      await videoRef.current.setPositionAsync(positionMillis);
      showControlsTemporarily();
    } catch (err) {
      console.error('Erreur seek:', err);
    }
  }, [isLive, showControlsTemporarily]);

  // Formatage du temps
  const formatTime = useCallback((millis: number) => {
    if (!millis || millis < 0) return '0:00';
    
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Gestion des erreurs
  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Ionicons name="alert-circle" size={48} color="#FF6B6B" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setIsLoading(true);
          }}
        >
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Validation de l'URL
  if (!streamUrl) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Ionicons name="videocam-off" size={48} color="#FF6B6B" />
        <Text style={styles.errorText}>Aucune source vidéo disponible</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
      <TouchableOpacity
        style={styles.videoContainer}
        activeOpacity={1}
        onPress={showControlsTemporarily}
      >
        <Video
          ref={videoRef}
          source={{ uri: currentStreamUrl }}
          style={[styles.video, isFullscreen && styles.fullscreenVideo]}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={isPlaying}
          isLooping={false}
          isMuted={isMuted}
          volume={volume}
          rate={playbackRate}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          onLoadStart={() => setIsLoading(true)}
          onLoad={() => setIsLoading(false)}
          onError={(error) => {
            console.error('Erreur vidéo:', error);
            setError('Erreur de chargement de la vidéo');
          }}
        />

        {/* Overlay de chargement */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <Ionicons name="refresh" size={32} color="#FFFFFF" />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        )}

        {/* Indicateur live */}
        {isLive && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}

        {/* Indicateur de qualité adaptative */}
        <View style={styles.adaptiveQualityContainer}>
          <AdaptiveQualityIndicator
            networkQuality={networkQuality}
            isLoading={isNetworkLoading}
            onRefresh={refreshQuality}
            onQualityPress={() => setShowQualitySelector(true)}
          />
        </View>

        {/* Contrôles */}
        {showControls && (
          <View style={[styles.controlsOverlay, isFullscreen && { paddingTop: insets.top }]}>
            {/* Barre supérieure */}
            <View style={styles.topControls}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  if (isFullscreen) {
                    toggleFullscreen();
                  }
                }}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              
              <View style={styles.titleContainer}>
                <Text style={styles.title} numberOfLines={1}>
                  {title || 'Vidéo'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.fullscreenButton}
                onPress={toggleFullscreen}
              >
                <Ionicons
                  name={isFullscreen ? "contract" : "expand"}
                  size={24}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>

            {/* Contrôles centraux */}
            <View style={styles.centerControls}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={togglePlayPause}
              >
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={48}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>

            {/* Barre inférieure */}
            <View style={styles.bottomControls}>
              {/* Barre de progression (seulement pour les replays) */}
              {!isLive && duration > 0 && (
                <View style={styles.progressContainer}>
                  <Text style={styles.timeText}>
                    {formatTime(position)}
                  </Text>
                  
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.min(100, Math.max(0, (position / duration) * 100))}%` }
                      ]}
                    />
                    <TouchableOpacity
                      style={[
                        styles.progressThumb,
                        { left: `${Math.min(100, Math.max(0, (position / duration) * 100))}%` }
                      ]}
                      onPress={() => {
                        // Ici on pourrait implémenter un seek interactif
                      }}
                    />
                  </View>
                  
                  <Text style={styles.timeText}>
                    {formatTime(duration)}
                  </Text>
                </View>
              )}

              {/* Contrôles de volume et vitesse */}
              <View style={styles.controlButtons}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={showVolumeSliderTemporarily}
                >
                  <Ionicons
                    name={isMuted ? "volume-mute" : "volume-high"}
                    size={24}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

                {!isLive && (
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={() => setShowSpeedSelector(true)}
                  >
                    <Text style={styles.speedText}>{playbackRate}x</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => setShowQualitySelector(true)}
                >
                  <Ionicons name="settings" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Composants modaux */}
      <VolumeSlider
        volume={volume}
        onVolumeChange={changeVolume}
        isVisible={showVolumeSlider}
        onClose={() => setShowVolumeSlider(false)}
      />

      <PlaybackSpeedSelector
        isVisible={showSpeedSelector}
        currentSpeed={playbackRate}
        onSpeedSelect={changePlaybackRate}
        onClose={() => setShowSpeedSelector(false)}
        isLive={isLive}
      />

      <QualitySelector
        isVisible={showQualitySelector}
        currentQuality={currentQuality}
        onQualitySelect={handleQualitySelect}
        onClose={() => setShowQualitySelector(false)}
        availableQualities={['auto', '1080p', '720p', '480p', '360p']}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    position: 'relative',
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  fullscreenVideo: {
    width: screenWidth,
    height: screenHeight,
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
    zIndex: 10,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 8,
    fontFamily: 'Montserrat-Medium',
  },
  liveIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
  },
  adaptiveQualityContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 20,
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'space-between',
    zIndex: 15,
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
  },
  fullscreenButton: {
    padding: 8,
  },
  centerControls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 50,
    padding: 16,
  },
  bottomControls: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
    minWidth: 40,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 8,
    borderRadius: 2,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlButton: {
    padding: 8,
  },
  speedText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    height: 200,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
    fontFamily: 'Montserrat-Medium',
  },
  retryButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
  },
});
