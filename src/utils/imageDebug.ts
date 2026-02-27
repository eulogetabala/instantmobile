/**
 * Utilitaires de debug pour les images
 */

import { API_CONFIG } from '../constants';

/**
 * Log détaillé d'une URL d'image pour le debug
 */
export const debugImageUrl = (url: string | null | undefined, context: string = '') => {
  if (__DEV__) {
    console.log(`🔍 DEBUG IMAGE [${context}]:`, {
      originalUrl: url,
      isValid: !!url && typeof url === 'string',
      startsWithHttp: url?.startsWith('http'),
      containsLocalhost: url?.includes('localhost'),
      containsRender: url?.includes('onrender.com'),
      containsIP: /192\.168\.\d+\.\d+/.test(url || ''),
      baseURL: API_CONFIG.baseURL,
      willBeConverted: url?.includes('localhost') || /192\.168\.\d+\.\d+/.test(url || ''),
    });
  }
};

/**
 * Teste si une URL d'image est accessible
 */
export const testImageUrl = async (url: string): Promise<{
  accessible: boolean;
  status?: number;
  error?: string;
}> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return {
      accessible: response.ok,
      status: response.status,
    };
  } catch (error: any) {
    return {
      accessible: false,
      error: error.message || 'Unknown error',
    };
  }
};

/**
 * Log toutes les informations sur une image d'événement
 */
export const debugEventImage = async (
  eventId: string | null | undefined,
  posterUrl: string | null | undefined,
  sectionIndex: number = 0
) => {
  if (!__DEV__) return;

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔍 DEBUG EVENT IMAGE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Event ID:', eventId);
  console.log('Poster URL (original):', posterUrl);
  console.log('Section Index:', sectionIndex);
  console.log('Base URL:', API_CONFIG.baseURL);
  console.log('');

  if (posterUrl) {
    debugImageUrl(posterUrl, 'Original');
    
    // Tester l'URL originale
    const originalTest = await testImageUrl(posterUrl);
    console.log('Test URL originale:', originalTest);

    // Tester l'URL convertie
    const { getAccessibleImageUrl } = await import('./imageUtils');
    const convertedUrl = getAccessibleImageUrl(posterUrl);
    if (convertedUrl && convertedUrl !== posterUrl) {
      console.log('URL convertie:', convertedUrl);
      const convertedTest = await testImageUrl(convertedUrl);
      console.log('Test URL convertie:', convertedTest);
    }
  } else {
    console.log('⚠️ Pas d\'URL poster, utilisation image locale');
  }

  console.log('═══════════════════════════════════════════════════════════');
};
