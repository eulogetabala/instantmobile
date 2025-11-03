import { Platform } from 'react-native';

/**
 * Images locales disponibles pour le fallback
 * Distribuées de manière cohérente basée sur l'ID de l'événement
 */
const LOCAL_EVENT_IMAGES: { [key: number]: any } = {
  1: require('../../assets/images/1.jpg'),
  2: require('../../assets/images/2.jpg'),
  3: require('../../assets/images/3.jpg'),
  4: require('../../assets/images/4.webp'),
  5: require('../../assets/images/6.png'),
  6: require('../../assets/images/7.jpg'),
  7: require('../../assets/images/8.jpeg'),
  8: require('../../assets/images/9.jpg'),
  9: require('../../assets/images/INSTANT+ 2.png'),
};

const IMAGE_COUNT = Object.keys(LOCAL_EVENT_IMAGES).length;

/**
 * Obtient une image locale différente basée sur l'ID de l'événement et la section
 * Utilise un hash djb2 pour une meilleure distribution
 * @param eventId - ID de l'événement
 * @param sectionIndex - Index de la section (0: en direct, 1: passés, 2: à venir) pour varier la distribution
 */
export const getLocalImageByEventId = (eventId?: string | null, sectionIndex: number = 0): any => {
  if (!eventId) {
    return LOCAL_EVENT_IMAGES[1];
  }

  // Hash djb2 pour une meilleure distribution
  let hash = 5381;
  const idStr = eventId.toString().trim();
  
  // S'assurer qu'on a bien un ID non vide
  if (idStr.length === 0) {
    return LOCAL_EVENT_IMAGES[1];
  }
  
  // CRITIQUE : Multiplier sectionIndex par un grand nombre pour créer un décalage significatif
  // Cela garantit que chaque section commence avec un hash différent
  hash = hash + (sectionIndex * 5381); // Multiplier par la même valeur initiale pour un décalage significatif
  
  // Ajouter aussi sectionIndex dans la boucle de hash pour une meilleure distribution
  for (let i = 0; i < idStr.length; i++) {
    hash = ((hash << 5) + hash) + idStr.charCodeAt(i);
    // Ajouter sectionIndex à chaque itération pour plus de variation
    if (i % 3 === 0) {
      hash = hash + (sectionIndex * 100);
    }
  }
  
  // Utiliser la valeur absolue du hash et prendre modulo pour avoir 1-9
  const imageNumber = (Math.abs(hash) % IMAGE_COUNT) + 1;
  
  const selectedImage = LOCAL_EVENT_IMAGES[imageNumber] || LOCAL_EVENT_IMAGES[1];
  
  // Log en mode dev pour vérifier la distribution
  if (__DEV__) {
    console.log(`🎲 getLocalImageByEventId: eventId=${idStr.substring(0, 12)}, sectionIndex=${sectionIndex}, hash=${hash}, imageNumber=${imageNumber}`);
  }
  
  return selectedImage;
};

/**
 * Convertit une URL avec localhost/127.0.0.1 en URL accessible depuis le mobile
 */
export const getAccessibleImageUrl = (url: string | null | undefined): string | null => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Vérifier si c'est déjà une URL valide
  let trimmedUrl = url.trim();
  if (trimmedUrl.length === 0) {
    return null;
  }

  // Si ce n'est pas une URL HTTP(S), ce n'est pas valide
  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    return null;
  }

  // Remplacer localhost par l'IP correcte selon la plateforme
  if (trimmedUrl.includes('localhost') || trimmedUrl.includes('127.0.0.1')) {
    if (Platform.OS === 'android') {
      // Android emulator utilise 10.0.2.2 pour accéder à localhost
      trimmedUrl = trimmedUrl.replace(/localhost/g, '10.0.2.2').replace(/127\.0\.0\.1/g, '10.0.2.2');
    } else if (Platform.OS === 'ios') {
      // iOS simulator peut utiliser localhost, mais pour appareil physique, utiliser l'IP locale
      const localIP = process.env.EXPO_PUBLIC_LOCAL_IP;
      if (localIP) {
        trimmedUrl = trimmedUrl.replace(/localhost/g, localIP).replace(/127\.0\.0\.1/g, localIP);
      }
      // iOS simulator peut utiliser localhost, on garde tel quel
    }
    // Si c'est web, on garde localhost tel quel
  }

  return trimmedUrl;
};

/**
 * Vérifie si une URL est valide et accessible
 */
export const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const trimmedUrl = url.trim();
  
  // Rejeter les chaînes vides
  if (trimmedUrl.length === 0) {
    return false;
  }
  
  // Vérifier les domaines invalides (exemples, placeholders, etc.)
  const invalidDomains = [
    'example.com',
    'placeholder',
    'test.com',
    'dummy.com',
    'fake.com',
    'localhost:undefined',
    '127.0.0.1:undefined',
  ];

  const isInvalid = invalidDomains.some(domain => 
    trimmedUrl.toLowerCase().includes(domain)
  );

  if (isInvalid) {
    return false;
  }

  // Accepter les URLs HTTP(S) - y compris localhost (pour développement)
  // localhost sera converti par getAccessibleImageUrl
  return trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://');
};

/**
 * Génère la source d'image optimale pour un événement
 * Retourne soit l'URL du backend (si valide), soit une image locale
 * @param posterUrl - URL de l'image du backend
 * @param eventId - ID de l'événement
 * @param sectionIndex - Index de la section (0: en direct, 1: passés, 2: à venir) pour varier la distribution
 */
export const getEventImageSource = (
  posterUrl: string | null | undefined,
  eventId?: string | null,
  sectionIndex: number = 0
): any => {
  // D'abord essayer d'utiliser l'URL du backend si elle est valide
  if (isValidImageUrl(posterUrl)) {
    const accessibleUrl = getAccessibleImageUrl(posterUrl);
    if (accessibleUrl) {
      if (__DEV__) {
        console.log('🖼️ getEventImageSource - Utilisation URL backend:', {
          original: posterUrl?.substring(0, 80),
          converted: accessibleUrl.substring(0, 80),
          platform: Platform.OS,
          eventId: eventId?.substring(0, 12),
          hash: eventId ? (() => {
            let h = 5381;
            for (let i = 0; i < eventId.length; i++) {
              h = ((h << 5) + h) + eventId.charCodeAt(i);
            }
            return (Math.abs(h) % 9) + 1;
          })() : null
        });
      }
      return { uri: accessibleUrl };
    } else {
      if (__DEV__) {
        console.log('⚠️ getEventImageSource - Conversion URL échouée:', {
          original: posterUrl?.substring(0, 80),
          platform: Platform.OS,
          eventId: eventId?.substring(0, 12)
        });
      }
    }
  } else if (__DEV__ && posterUrl) {
    console.log('⚠️ getEventImageSource - URL invalide:', {
      posterUrl: posterUrl.substring(0, 80),
      platform: Platform.OS,
      eventId: eventId?.substring(0, 12)
    });
  }

  // Sinon, utiliser une image locale différente basée sur l'eventId et la section
  const localImage = getLocalImageByEventId(eventId, sectionIndex);
  // Le log est déjà fait dans getLocalImageByEventId
  return localImage;
};

/**
 * Type pour la source d'image
 */
export type ImageSource = 
  | { uri: string }
  | ReturnType<typeof require>;

