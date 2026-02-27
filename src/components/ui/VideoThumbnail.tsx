import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { parseVideoUrl, getVideoThumbnail, getStreamType } from '../../utils/videoUtils';
import { brandColors } from '../../constants/theme';

interface VideoThumbnailProps {
  /**
   * URL de la vidéo (YouTube ou Vimeo)
   */
  videoUrl?: string | null;
  /**
   * URL du thumbnail (optionnel, sera généré automatiquement si non fourni)
   */
  thumbnailUrl?: string | null;
  /**
   * Style du conteneur
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Style de l'image
   */
  imageStyle?: StyleProp<ImageStyle>;
  /**
   * Callback quand on clique sur le thumbnail
   */
  onPress?: () => void;
  /**
   * Afficher un overlay avec l'icône play
   */
  showPlayButton?: boolean;
  /**
   * Mode de redimensionnement de l'image
   */
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

/**
 * Composant VideoThumbnail - Affiche un thumbnail pour une vidéo YouTube ou Vimeo
 */
const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  videoUrl,
  thumbnailUrl,
  style,
  imageStyle,
  onPress,
  showPlayButton = true,
  resizeMode = 'cover',
}) => {
  // Obtenir l'URL du thumbnail
  const streamType = videoUrl ? getStreamType(videoUrl) : 'unknown';
  const videoInfo = parseVideoUrl(videoUrl || null);
  const finalThumbnailUrl = thumbnailUrl || getVideoThumbnail(videoUrl || null);

  // Pour les streams HLS/DASH, on peut utiliser un placeholder ou essayer de générer un thumbnail
  // Pour l'instant, on affiche un placeholder avec icône vidéo
  if (!finalThumbnailUrl && !videoInfo && streamType !== 'hls' && streamType !== 'dash' && streamType !== 'rtmp') {
    // Pas de vidéo reconnue, retourner null ou un placeholder
    return null;
  }

  const content = (
    <View style={[styles.container, style]}>
      {finalThumbnailUrl ? (
        <Image
          source={{ uri: finalThumbnailUrl }}
          style={[styles.image, imageStyle]}
          resizeMode={resizeMode}
        />
      ) : (
        <View style={[styles.placeholder, imageStyle]}>
          <Ionicons name="videocam" size={32} color={brandColors.mediumGray} />
        </View>
      )}
      
      {showPlayButton && (
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)']}
          style={styles.overlay}
        >
          <View style={styles.playButtonContainer}>
            <View style={styles.playButton}>
              <Ionicons name="play" size={24} color={brandColors.white} />
            </View>
          </View>
        </LinearGradient>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: brandColors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: brandColors.white,
  },
});

export default VideoThumbnail;

