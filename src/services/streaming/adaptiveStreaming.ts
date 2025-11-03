import { NetworkQuality } from '../../hooks/useNetworkQuality';

export interface StreamQuality {
  quality: 'auto' | '1080p' | '720p' | '480p' | '360p';
  url: string;
  bitrate: number;
  resolution: string;
}

export interface AdaptiveStreamConfig {
  baseUrl: string;
  qualities: StreamQuality[];
}

export class AdaptiveStreamingService {
  private static instance: AdaptiveStreamingService;
  private streamConfigs: Map<string, AdaptiveStreamConfig> = new Map();

  static getInstance(): AdaptiveStreamingService {
    if (!AdaptiveStreamingService.instance) {
      AdaptiveStreamingService.instance = new AdaptiveStreamingService();
    }
    return AdaptiveStreamingService.instance;
  }

  // Configurer les URLs de streaming pour un événement
  configureStream(eventId: string, baseUrl: string): void {
    const qualities: StreamQuality[] = [
      {
        quality: '1080p',
        url: `${baseUrl}/1080p.m3u8`,
        bitrate: 5000,
        resolution: '1920x1080',
      },
      {
        quality: '720p',
        url: `${baseUrl}/720p.m3u8`,
        bitrate: 2500,
        resolution: '1280x720',
      },
      {
        quality: '480p',
        url: `${baseUrl}/480p.m3u8`,
        bitrate: 1500,
        resolution: '854x480',
      },
      {
        quality: '360p',
        url: `${baseUrl}/360p.m3u8`,
        bitrate: 800,
        resolution: '640x360',
      },
    ];

    this.streamConfigs.set(eventId, {
      baseUrl,
      qualities,
    });
  }

  // Obtenir l'URL de streaming optimale basée sur la qualité réseau
  getOptimalStreamUrl(eventId: string, networkQuality: NetworkQuality): string {
    const config = this.streamConfigs.get(eventId);
    if (!config) {
      console.warn(`Configuration de stream non trouvée pour l'événement ${eventId}`);
      return '';
    }

    // Si la qualité est définie manuellement (pas auto), utiliser cette qualité
    if (networkQuality.quality !== 'auto') {
      const quality = config.qualities.find(q => q.quality === networkQuality.quality);
      return quality?.url || config.qualities[1].url; // Fallback sur 720p
    }

    // Sélection automatique basée sur la bande passante
    const availableBitrate = networkQuality.bitrate;
    
    // Trouver la meilleure qualité supportée
    for (const quality of config.qualities) {
      if (availableBitrate >= quality.bitrate) {
        return quality.url;
      }
    }

    // Fallback sur la qualité la plus basse
    return config.qualities[config.qualities.length - 1].url;
  }

  // Obtenir toutes les qualités disponibles pour un événement
  getAvailableQualities(eventId: string): StreamQuality[] {
    const config = this.streamConfigs.get(eventId);
    return config?.qualities || [];
  }

  // Obtenir la configuration complète pour un événement
  getStreamConfig(eventId: string): AdaptiveStreamConfig | null {
    return this.streamConfigs.get(eventId) || null;
  }

  // Vérifier si un événement a une configuration de streaming
  hasStreamConfig(eventId: string): boolean {
    return this.streamConfigs.has(eventId);
  }

  // Nettoyer la configuration d'un événement
  clearStreamConfig(eventId: string): void {
    this.streamConfigs.delete(eventId);
  }

  // Obtenir des statistiques de qualité
  getQualityStats(eventId: string, currentQuality: string): {
    currentBitrate: number;
    recommendedQuality: string;
    availableQualities: string[];
  } {
    const config = this.streamConfigs.get(eventId);
    if (!config) {
      return {
        currentBitrate: 0,
        recommendedQuality: '720p',
        availableQualities: [],
      };
    }

    const currentQualityConfig = config.qualities.find(q => q.quality === currentQuality);
    const availableQualities = config.qualities.map(q => q.quality);

    return {
      currentBitrate: currentQualityConfig?.bitrate || 0,
      recommendedQuality: config.qualities[1].quality, // 720p par défaut
      availableQualities,
    };
  }

  // Simuler un test de bande passante
  async testBandwidth(testUrl: string = 'https://www.google.com/favicon.ico'): Promise<number> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(testUrl, {
        method: 'HEAD',
        cache: 'no-cache',
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Estimation basée sur le temps de réponse
      if (duration < 200) return 5000; // Très rapide
      if (duration < 500) return 2500; // Rapide
      if (duration < 1000) return 1500; // Moyen
      return 800; // Lent
    } catch (error) {
      console.warn('Test de bande passante échoué:', error);
      return 800; // Valeur conservatrice
    }
  }

  // Obtenir des recommandations de qualité basées sur l'historique
  getQualityRecommendation(
    eventId: string,
    networkQuality: NetworkQuality,
    userPreference?: 'quality' | 'data' | 'balanced'
  ): string {
    const config = this.streamConfigs.get(eventId);
    if (!config) return '720p';

    const preference = userPreference || 'balanced';

    switch (preference) {
      case 'quality':
        // Privilégier la qualité
        if (networkQuality.bitrate >= 4000) return '1080p';
        if (networkQuality.bitrate >= 2000) return '720p';
        return '480p';

      case 'data':
        // Économiser les données
        if (networkQuality.bitrate >= 2000) return '480p';
        return '360p';

      case 'balanced':
      default:
        // Équilibre qualité/données
        if (networkQuality.bitrate >= 5000) return '1080p';
        if (networkQuality.bitrate >= 2500) return '720p';
        if (networkQuality.bitrate >= 1500) return '480p';
        return '360p';
    }
  }
}

export const adaptiveStreamingService = AdaptiveStreamingService.getInstance();
