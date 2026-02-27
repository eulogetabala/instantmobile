import React, { useState } from 'react';
import { Image, ImageProps, StyleProp, ViewStyle, View, Platform } from 'react-native';
import { getEventImageSource, getLocalImageByEventId, ImageSource, isValidImageUrl, getAccessibleImageUrl } from '../../utils/imageUtils';
import VideoThumbnail from './VideoThumbnail';
import { isVideoUrl } from '../../utils/videoUtils';

interface EventImageProps extends Omit<ImageProps, 'source'> {
  /**
   * URL de l'image du backend (peut être null)
   */
  posterUrl?: string | null;
  /**
   * URL de la vidéo (YouTube ou Vimeo) - si fournie, affichera un thumbnail vidéo
   */
  videoUrl?: string | null;
  /**
   * ID de l'événement pour la distribution des images de fallback
   */
  eventId?: string | null;
  /**
   * Index de la section (0: en direct, 1: passés, 2: à venir) pour varier la distribution des images
   */
  sectionIndex?: number;
  /**
   * Style personnalisé pour le conteneur
   */
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * Afficher un placeholder pendant le chargement
   */
  showPlaceholder?: boolean;
  /**
   * Callback quand l'image échoue à charger
   */
  onError?: () => void;
  /**
   * Callback quand l'image se charge avec succès
   */
  onLoad?: () => void;
  /**
   * Callback quand on clique sur le thumbnail vidéo
   */
  onVideoPress?: () => void;
}

/**
 * Composant EventImage - Gère automatiquement le chargement des images d'événements
 * avec fallback intelligent vers les images locales
 * Peut également afficher un thumbnail vidéo si videoUrl est fourni
 */
const EventImage: React.FC<EventImageProps> = ({
  posterUrl,
  videoUrl,
  eventId,
  sectionIndex = 0,
  containerStyle,
  showPlaceholder = false,
  onError,
  onLoad,
  onVideoPress,
  style,
  ...imageProps
}) => {
  // Si une URL vidéo est fournie et valide, afficher un thumbnail vidéo
  if (videoUrl && isVideoUrl(videoUrl)) {
    return (
      <VideoThumbnail
        videoUrl={videoUrl}
        style={style}
        onPress={onVideoPress}
        showPlayButton={true}
        resizeMode={imageProps.resizeMode || 'cover'}
      />
    );
  }
  // Optimisation : Prioriser les images locales pour un chargement instantané
  // Essayer d'abord l'image locale, puis charger l'image backend en arrière-plan si disponible
  const calculatedSource = React.useMemo(() => {
    // Toujours utiliser l'image locale en premier pour un chargement instantané
    const localImage = getLocalImageByEventId(eventId, sectionIndex);
    
    // Si on a une URL backend valide, on l'utilisera mais l'image locale sera affichée en premier
    if (posterUrl && isValidImageUrl(posterUrl)) {
      const accessibleUrl = getAccessibleImageUrl(posterUrl);
      if (accessibleUrl) {
        // Retourner l'URL backend - l'image locale sera utilisée comme defaultSource
        return { uri: accessibleUrl };
      }
    }
    
    // Pas d'URL backend valide, utiliser uniquement l'image locale
    return localImage;
  }, [posterUrl, eventId, sectionIndex]);

  const [hasError, setHasError] = useState(false);

  // Source finale : utiliser l'image locale si erreur sur backend
  const finalSource = React.useMemo(() => {
    if (hasError && typeof calculatedSource === 'object' && 'uri' in calculatedSource) {
      // Erreur sur image backend, utiliser image locale avec sectionIndex
      return getLocalImageByEventId(eventId, sectionIndex);
    }
    return calculatedSource;
  }, [calculatedSource, hasError, eventId, sectionIndex]);

  const handleError = (error?: any) => {
    if (!hasError) {
      setHasError(true);
      // Logs réduits pour améliorer les performances
      // if (__DEV__) {
      //   console.log('⚠️ EventImage - Erreur chargement, utilisation image locale');
      // }
    }
    onError?.();
  };

  const handleLoad = () => {
    setHasError(false);
    // Logs réduits pour améliorer les performances
    // if (__DEV__) {
    //   console.log('✅ EventImage - Image chargée');
    // }
    onLoad?.();
  };

  // Toujours utiliser une image locale différente pour le defaultSource basée sur eventId et sectionIndex
  // Cela garantit un affichage instantané pendant le chargement de l'image backend
  const defaultSource = React.useMemo(() => {
    return getLocalImageByEventId(eventId, sectionIndex);
  }, [eventId, sectionIndex]);

  // Si c'est une image locale (pas d'URI), utiliser directement
  const source = typeof finalSource === 'object' && 'uri' in finalSource 
    ? finalSource 
    : finalSource;

  // Créer une clé unique basée sur eventId pour forcer le re-render
  // C'est CRITIQUE : chaque eventId doit avoir sa propre clé
  // Inclure l'eventId complet dans la clé pour garantir l'unicité
  const imageKey = React.useMemo(() => {
    if (!eventId) return `event-img-unknown-${Date.now()}`;
    // Utiliser l'eventId complet + un identifiant unique pour éviter tout cache
    return `event-img-${eventId}`;
  }, [eventId]);

  // Logs réduits pour améliorer les performances
  // if (__DEV__) {
  //   const isLocalImage = typeof source !== 'object' || !('uri' in source);
  //   console.log(`🖼️ EventImage render: eventId=${eventId?.substring(0, 20)}, sourceType=${isLocalImage ? 'local' : 'uri'}`);
  // }

  // Optimisation : Utiliser le cache par défaut pour améliorer les performances
  // 'default' permet au système de gérer le cache intelligemment
  const imagePropsWithCache = typeof source === 'object' && 'uri' in source
    ? { ...imageProps, cache: 'default' as const }
    : imageProps;

  return (
    <View style={containerStyle} key={`container-${eventId}`}>
      <Image
        {...imagePropsWithCache}
        key={imageKey} // Force le re-render si eventId change - CRITIQUE pour éviter le cache
        source={source}
        style={style}
        onError={handleError}
        onLoad={handleLoad}
        defaultSource={defaultSource}
      />
      {showPlaceholder && hasError && (
        <View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#f0f0f0',
              justifyContent: 'center',
              alignItems: 'center',
            },
            style as ViewStyle,
          ]}
        />
      )}
    </View>
  );
};

// Optimisation : Utiliser React.memo pour éviter les re-renders inutiles
export default React.memo(EventImage, (prevProps, nextProps) => {
  // Ne re-render que si les props importantes changent
  return (
    prevProps.posterUrl === nextProps.posterUrl &&
    prevProps.eventId === nextProps.eventId &&
    prevProps.sectionIndex === nextProps.sectionIndex &&
    prevProps.videoUrl === nextProps.videoUrl
  );
});

