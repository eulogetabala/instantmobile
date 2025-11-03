import React, { useState } from 'react';
import { Image, ImageProps, StyleProp, ViewStyle, View, Platform } from 'react-native';
import { getEventImageSource, getLocalImageByEventId, ImageSource, isValidImageUrl, getAccessibleImageUrl } from '../../utils/imageUtils';

interface EventImageProps extends Omit<ImageProps, 'source'> {
  /**
   * URL de l'image du backend (peut être null)
   */
  posterUrl?: string | null;
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
}

/**
 * Composant EventImage - Gère automatiquement le chargement des images d'événements
 * avec fallback intelligent vers les images locales
 */
const EventImage: React.FC<EventImageProps> = ({
  posterUrl,
  eventId,
  sectionIndex = 0,
  containerStyle,
  showPlaceholder = false,
  onError,
  onLoad,
  style,
  ...imageProps
}) => {
  // Calculer la source d'image à chaque render pour s'assurer qu'elle est à jour
  // FORCER l'utilisation de l'image locale avec sectionIndex pour garantir la variété par section
  const calculatedSource = React.useMemo(() => {
    // Pour l'instant, utiliser TOUJOURS l'image locale basée sur eventId et sectionIndex
    // pour garantir que chaque section a des images différentes
    // TODO: Réactiver le backend une fois que la distribution fonctionne
    // if (posterUrl && isValidImageUrl(posterUrl)) {
    //   const accessibleUrl = getAccessibleImageUrl(posterUrl);
    //   if (accessibleUrl) {
    //     return { uri: accessibleUrl };
    //   }
    // }
    // Utiliser directement l'image locale basée sur eventId et sectionIndex
    const localImage = getLocalImageByEventId(eventId, sectionIndex);
    if (__DEV__) {
      console.log(`🖼️ EventImage - Utilisation image locale uniquement (sectionIndex=${sectionIndex}):`, {
        eventId: eventId?.substring(0, 20),
        sectionIndex
      });
    }
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

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      if (posterUrl) {
        setFailedUrls(prev => new Set(prev).add(posterUrl));
      }
      
      if (__DEV__) {
        const imageNumber = (() => {
          if (!eventId) return 'unknown';
          let h = 5381;
          const idStr = eventId.toString().trim();
          for (let i = 0; i < idStr.length; i++) {
            h = ((h << 5) + h) + idStr.charCodeAt(i);
          }
          return (Math.abs(h) % 9) + 1;
        })();
        console.log('⚠️ EventImage - Erreur chargement image backend:', {
          posterUrl: posterUrl?.substring(0, 50),
          eventId: eventId?.substring(0, 20),
          eventIdFull: eventId,
          imageNumber,
          platform: Platform.OS
        });
      }
    }
    onError?.();
  };

  const handleLoad = () => {
    setHasError(false);
    if (__DEV__) {
      const sourceType = typeof finalSource === 'object' && 'uri' in finalSource ? 'backend' : 'local';
      console.log('✅ EventImage - Image chargée:', {
        eventId: eventId?.substring(0, 20),
        sourceType,
        hasPosterUrl: !!posterUrl
      });
    }
    onLoad?.();
  };

  // Toujours utiliser une image locale différente pour le defaultSource basée sur eventId et sectionIndex
  const defaultSource = React.useMemo(() => {
    const local = getLocalImageByEventId(eventId, sectionIndex);
    if (__DEV__) {
      console.log(`🎯 EventImage defaultSource pour eventId=${eventId?.substring(0, 20)} section=${sectionIndex}:`, {
        eventId: eventId?.substring(0, 20),
        sectionIndex,
        isLocalImage: true
      });
    }
    return local;
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

  if (__DEV__) {
    const imageNumber = eventId ? (() => {
      let h = 5381;
      const idStr = eventId.toString().trim();
      for (let i = 0; i < idStr.length; i++) {
        h = ((h << 5) + h) + idStr.charCodeAt(i);
      }
      return (Math.abs(h) % 9) + 1;
    })() : 'unknown';
    
    const isLocalImage = typeof source !== 'object' || !('uri' in source);
    console.log(`🖼️ EventImage render: eventId=${eventId?.substring(0, 20)}, key=${imageKey}, imageNumber=${imageNumber}, sourceType=${isLocalImage ? 'local' : 'uri'}, hasPosterUrl=${!!posterUrl}, source=${isLocalImage ? 'local-image' : 'backend-url'}`);
  }

  // CRITIQUE : Utiliser cache="reload" pour iOS si c'est une URI backend pour éviter le cache
  const imagePropsWithCache = typeof source === 'object' && 'uri' in source
    ? { ...imageProps, cache: 'reload' as const }
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

export default EventImage;

