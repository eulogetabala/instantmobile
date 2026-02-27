import { API_CONFIG } from '../constants';
import { getAccessibleImageUrl } from './imageUtils';

/**
 * Résout l'URL d'une image provenant de l'API ou retourne une image locale par défaut
 * Gère automatiquement le backend local et Render
 * @param imagePath Chemin ou URL de l'image
 * @param fallbackImage Image locale par défaut (facultatif)
 */
export const getEventImage = (imagePath: string | null | undefined, fallbackImage = require('../../assets/images/1.jpg')) => {
  if (!imagePath) {
    return fallbackImage;
  }

  // Si c'est déjà une URL complète
  if (imagePath.startsWith('http')) {
    // Utiliser getAccessibleImageUrl pour convertir correctement l'URL
    const accessibleUrl = getAccessibleImageUrl(imagePath);
    if (accessibleUrl) {
      return { uri: accessibleUrl };
    }
    // Si la conversion échoue, retourner l'URL originale
    return { uri: imagePath };
  }

  // Si c'est un chemin relatif (ex: uploads/events/xxx.jpg)
  const apiDomain = API_CONFIG.baseURL.split('/api')[0];
  const fullUrl = `${apiDomain}/${imagePath.startsWith('/') ? imagePath.slice(1) : imagePath}`;
  
  // Utiliser getAccessibleImageUrl pour s'assurer que l'URL est accessible
  const accessibleUrl = getAccessibleImageUrl(fullUrl);
  if (accessibleUrl) {
    return { uri: accessibleUrl };
  }
  
  return { uri: fullUrl };
};
