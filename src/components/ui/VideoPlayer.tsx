import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import YoutubePlayer from 'react-native-youtube-iframe';
import { parseVideoUrl, VideoInfo, getStreamType } from '../../utils/videoUtils';
import { brandColors, typography } from '../../constants/theme';

// Utiliser WebView si disponible, sinon utiliser expo-web-browser
let WebView: any = null;
try {
  WebView = require('react-native-webview').WebView;
} catch (e) {
  // WebView non disponible, on utilisera expo-web-browser pour ouvrir dans le navigateur
  console.warn('react-native-webview non disponible, utilisation de expo-web-browser');
}

const { width } = Dimensions.get('window');

interface VideoPlayerProps {
  /**
   * URL de la vidéo (YouTube, Vimeo, ou streaming HLS/DASH)
   */
  videoUrl?: string | null;
  /**
   * Style du conteneur
   */
  style?: any;
  /**
   * Hauteur du lecteur
   */
  height?: number;
  /**
   * Callback en cas d'erreur
   */
  onError?: (error: string) => void;
  /**
   * Mode de redimensionnement
   */
  resizeMode?: 'contain' | 'cover' | 'stretch';
  /**
   * Auto-play (pour les streams live)
   */
  shouldPlay?: boolean;
  /**
   * Masquer le bouton "Ouvrir dans le navigateur" (pour EventDetailsScreen)
   */
  hideOpenButton?: boolean;
}

/**
 * Composant VideoPlayer - Affiche une vidéo YouTube, Vimeo, ou streaming HLS/DASH
 */
const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  style,
  height = 200,
  onError,
  resizeMode = 'cover',
  shouldPlay = false,
  hideOpenButton = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = React.useRef<Video>(null);

  // Analyser l'URL directement au render (pas besoin d'état)
  const videoInfo = videoUrl ? parseVideoUrl(videoUrl) : null;
  const streamType = videoUrl ? getStreamType(videoUrl) : 'unknown';

  useEffect(() => {
    if (videoUrl) {
      if (__DEV__) {
        console.log(`🎥 VideoPlayer - Analyse URL:`, {
          videoUrl: videoUrl.substring(0, 80),
          hasVideoInfo: !!videoInfo,
          streamType: streamType,
          platform: videoInfo?.platform,
        });
      }
      
      if (videoInfo) {
        setError(null);
        setLoading(false);
      } else if (streamType === 'hls' || streamType === 'dash' || streamType === 'rtmp') {
        setError(null);
        setLoading(false);
      } else {
        setError(null);
        setLoading(false);
      }
    } else {
      setError('Aucune URL vidéo fournie');
      setLoading(false);
    }
  }, [videoUrl, videoInfo, streamType]);

  // Si c'est un stream HLS/DASH, utiliser expo-av directement
  if (videoUrl && (streamType === 'hls' || streamType === 'dash')) {
    return (
      <View style={[styles.container, { height }, style]}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={brandColors.primary} />
            <Text style={styles.loadingText}>Chargement du stream...</Text>
          </View>
        )}
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={[styles.video, { height }]}
          resizeMode={resizeMode === 'cover' ? ResizeMode.COVER : resizeMode === 'contain' ? ResizeMode.CONTAIN : ResizeMode.STRETCH}
          shouldPlay={shouldPlay}
          isLooping={false}
          isMuted={false}
          onLoadStart={() => setLoading(true)}
          onLoad={() => setLoading(false)}
          onError={(err) => {
            console.error('Erreur stream:', err);
            setError('Erreur lors du chargement du stream');
            setLoading(false);
            onError?.('Erreur lors du chargement du stream');
          }}
        />
      </View>
    );
  }

  // Si erreur ou pas d'URL
  if (error && !videoUrl) {
    return (
      <View style={[styles.container, { height }, style]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={32} color={brandColors.error} />
          <Text style={styles.errorText}>
            {error || 'Vidéo non disponible'}
          </Text>
        </View>
      </View>
    );
  }

  // Si pas d'URL, erreur
  if (!videoUrl) {
    return (
      <View style={[styles.container, { height }, style]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={32} color={brandColors.error} />
          <Text style={styles.errorText}>
            {error || 'Aucune URL vidéo fournie'}
          </Text>
        </View>
      </View>
    );
  }

  // Si WebView n'est pas disponible, afficher un bouton pour ouvrir dans le navigateur
  if (!WebView) {
    return (
      <View style={[styles.container, { height }, style]}>
        <View style={styles.fallbackContainer}>
          <Ionicons name="play-circle" size={64} color={brandColors.primary} />
          <Text style={styles.fallbackText}>Vidéo disponible</Text>
          <Text style={styles.fallbackSubtext}>
            {videoInfo?.platform === 'youtube' ? 'YouTube' : 'Vimeo'}
          </Text>
          <TouchableOpacity
            style={styles.openButton}
            onPress={() => Linking.openURL(videoInfo?.url || videoUrl || '')}
          >
            <Text style={styles.openButtonText}>Ouvrir la vidéo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Pour YouTube : utiliser react-native-youtube-iframe (évite l'erreur 153)
  // Pour Vimeo : utiliser WebView
  if (videoInfo && videoInfo.platform === 'youtube') {
    return (
      <View style={[styles.container, { height }, style]}>
        <YoutubePlayer
          height={height}
          videoId={videoInfo.videoId}
          play={shouldPlay}
          onChangeState={(event) => {
            if (__DEV__) {
              console.log('YouTube player state:', event);
            }
            if (event === 'playing') {
              setLoading(false);
            }
          }}
          onError={(error) => {
            console.error('Erreur YouTube player:', error);
            setError('Erreur lors du chargement de la vidéo YouTube');
            setLoading(false);
            onError?.('Erreur lors du chargement de la vidéo YouTube');
          }}
          webViewStyle={{ opacity: 0.99 }}
          webViewProps={{
            allowsInlineMediaPlayback: true,
            mediaPlaybackRequiresUserAction: false,
          }}
        />
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={brandColors.primary} />
            <Text style={styles.loadingText}>Chargement de la vidéo...</Text>
          </View>
        )}
      </View>
    );
  }

  // Pour Vimeo : utiliser WebView
  if (videoInfo && videoInfo.platform === 'vimeo') {
    if (!WebView) {
      return (
        <View style={[styles.container, { height }, style]}>
          <View style={styles.fallbackContainer}>
            <Ionicons name="play-circle" size={64} color={brandColors.primary} />
            <Text style={styles.fallbackText}>Vidéo disponible</Text>
            <Text style={styles.fallbackSubtext}>Vimeo</Text>
            <TouchableOpacity
              style={styles.openButton}
              onPress={() => Linking.openURL(videoInfo.url)}
            >
              <Text style={styles.openButtonText}>Ouvrir la vidéo</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    const autoplayValue = shouldPlay ? '1' : '0';
    const embedHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
            .video-container { position: relative; width: 100%; height: 100%; }
            iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
          </style>
        </head>
        <body>
          <div class="video-container">
            <iframe
              src="https://player.vimeo.com/video/${videoInfo.videoId}?autoplay=${autoplayValue}&controls=1&title=0&byline=0&portrait=0&playsinline=1"
              frameborder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowfullscreen
            ></iframe>
          </div>
        </body>
      </html>
    `;

    return (
      <View style={[styles.container, { height }, style]}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={brandColors.primary} />
            <Text style={styles.loadingText}>Chargement de la vidéo...</Text>
          </View>
        )}
        <WebView
          source={{ html: embedHtml }}
          style={styles.webview}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('Erreur WebView:', nativeEvent);
            setError('Erreur lors du chargement de la vidéo');
            setLoading(false);
            onError?.('Erreur lors du chargement de la vidéo');
          }}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          originWhitelist={['*']}
          mixedContentMode="always"
          allowsProtectedMedia={true}
          cacheEnabled={true}
          incognito={false}
          startInLoadingState={true}
          scalesPageToFit={true}
        />
      </View>
    );
  }

  // Si pas de videoInfo mais qu'on a une URL YouTube/Vimeo, essayer d'extraire l'ID
  if (!videoInfo && videoUrl && (streamType === 'youtube' || streamType === 'vimeo')) {
    // Extraire l'ID directement depuis l'URL
    const youtubeId = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)?.[1] ||
                      videoUrl.match(/youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/)?.[1];
    const vimeoId = videoUrl.match(/vimeo\.com\/(?:channels\/[^\/]+\/|groups\/[^\/]+\/videos\/|album\/\d+\/video\/|)(\d+)/)?.[1] ||
                    videoUrl.match(/player\.vimeo\.com\/video\/(\d+)/)?.[1];
    
    // Pour YouTube : utiliser react-native-youtube-iframe
    if (youtubeId) {
      return (
        <View style={[styles.container, { height }, style]}>
          <YoutubePlayer
            height={height}
            videoId={youtubeId}
            play={shouldPlay}
            onChangeState={(event) => {
              if (__DEV__) {
                console.log('YouTube player state:', event);
              }
              if (event === 'playing') {
                setLoading(false);
              }
            }}
            onError={(error) => {
              console.error('Erreur YouTube player:', error);
              setError('Erreur lors du chargement de la vidéo YouTube');
              setLoading(false);
              onError?.('Erreur lors du chargement de la vidéo YouTube');
            }}
            webViewStyle={{ opacity: 0.99 }}
            webViewProps={{
              allowsInlineMediaPlayback: true,
              mediaPlaybackRequiresUserAction: false,
            }}
          />
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={brandColors.primary} />
              <Text style={styles.loadingText}>Chargement de la vidéo...</Text>
            </View>
          )}
        </View>
      );
    }

    // Pour Vimeo : utiliser WebView
    if (vimeoId && WebView) {
      const autoplayValue = shouldPlay ? '1' : '0';
      const embedHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
              .video-container { position: relative; width: 100%; height: 100%; }
              iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
            </style>
          </head>
          <body>
            <div class="video-container">
              <iframe
                src="https://player.vimeo.com/video/${vimeoId}?autoplay=${autoplayValue}&controls=1&title=0&byline=0&portrait=0&playsinline=1"
                frameborder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowfullscreen
              ></iframe>
            </div>
          </body>
        </html>
      `;

      return (
        <View style={[styles.container, { height }, style]}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={brandColors.primary} />
              <Text style={styles.loadingText}>Chargement de la vidéo...</Text>
            </View>
          )}
          <WebView
            source={{ html: embedHtml }}
            style={styles.webview}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('Erreur WebView:', nativeEvent);
              setError('Erreur lors du chargement de la vidéo');
              setLoading(false);
              onError?.('Erreur lors du chargement de la vidéo');
            }}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={['*']}
            mixedContentMode="always"
            allowsProtectedMedia={true}
            cacheEnabled={true}
            incognito={false}
            startInLoadingState={true}
            scalesPageToFit={true}
          />
        </View>
      );
    }
  }

  // Si pas de videoInfo et pas YouTube/Vimeo, erreur
  if (!videoInfo) {
    return (
      <View style={[styles.container, { height }, style]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={32} color={brandColors.error} />
          <Text style={styles.errorText}>
            URL vidéo non valide ou non supportée
          </Text>
          {videoUrl && !hideOpenButton && (
            <TouchableOpacity
              style={styles.openButton}
              onPress={() => Linking.openURL(videoUrl)}
            >
              <Text style={styles.openButtonText}>Ouvrir dans le navigateur</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: brandColors.darkGray,
    borderRadius: 8,
    overflow: 'hidden',
  },
  webview: {
    backgroundColor: 'transparent',
    width: '100%',
    height: '100%',
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: brandColors.darkGray,
    zIndex: 1,
  },
  loadingText: {
    marginTop: 12,
    color: brandColors.white,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: brandColors.lightGray,
  },
  errorText: {
    marginTop: 12,
    color: brandColors.darkGray,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: brandColors.darkGray,
  },
  fallbackText: {
    marginTop: 16,
    color: brandColors.white,
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    textAlign: 'center',
  },
  fallbackSubtext: {
    marginTop: 8,
    color: brandColors.mediumGray,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
  },
  openButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: brandColors.primary,
    borderRadius: 8,
  },
  openButtonText: {
    color: brandColors.white,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
  },
  videoThumbnailContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: brandColors.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  thumbnailContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: brandColors.white,
  },
  playText: {
    color: brandColors.white,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    marginBottom: 8,
  },
  platformText: {
    color: brandColors.mediumGray,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
  },
});

export default VideoPlayer;

