import { apiService } from '../api';

export interface StreamConfig {
  streamKey: string;
  rtmpUrl: string;
  hlsUrl: string;
  dashUrl: string;
  obsConfig: {
    rtmpUrl: string;
    streamKey: string;
    bitrate: number;
    resolution: string;
    fps: number;
    audioBitrate: number;
  };
}

export interface StreamInfo {
  event: {
    id: string;
    title: string;
    description: string;
    category: string;
    startDate: string;
    endDate: string;
    organizer: {
      id: string;
      firstName: string;
      lastName: string;
    };
    streaming: {
      isLive: boolean;
      currentViewers: number;
      maxViewers: number;
      streamStatus: string;
    };
  };
  streamStats: {
    eventId: string;
    isLive: boolean;
    currentViewers: number;
    maxViewers: number;
    totalViewers: number;
    startedAt: string;
    endedAt?: string;
    streamStatus: string;
    streamStats: {
      totalWatchTime: number;
      averageViewers: number;
      peakViewers: number;
      bufferEvents: number;
    };
  };
}

export interface LiveEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  organizer: {
    id: string;
    firstName: string;
    lastName: string;
  };
  streaming: {
    isLive: boolean;
    currentViewers: number;
    maxViewers: number;
    streamStatus: string;
  };
  media: {
    poster: string;
  };
  streamStats: any;
}

export interface GetLiveEventsResponse {
  events: LiveEvent[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

class StreamingService {
  // Obtenir l'URL de stream pour un événement
  async getStreamUrl(eventId: string): Promise<{
    hlsUrl: string;
    dashUrl: string;
    streamKey: string;
    isLive: boolean;
    currentViewers: number;
  }> {
    try {
      const response = await apiService.get<{
        hlsUrl: string;
        dashUrl: string;
        streamKey: string;
        isLive: boolean;
        currentViewers: number;
      }>(`/streaming/${eventId}/stream-url`);

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la récupération de l\'URL de stream');
      }
    } catch (error) {
      console.error('Erreur getStreamUrl:', error);
      throw error;
    }
  }

  // Obtenir les informations d'un stream
  async getStreamInfo(eventId: string): Promise<StreamInfo> {
    try {
      const response = await apiService.get<StreamInfo>(`/streaming/${eventId}/stream-info`);

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la récupération des informations du stream');
      }
    } catch (error) {
      console.error('Erreur getStreamInfo:', error);
      throw error;
    }
  }

  // Obtenir tous les événements en direct
  async getLiveEvents(page: number = 1, limit: number = 20, category?: string): Promise<GetLiveEventsResponse> {
    try {
      const params: any = { page, limit };
      if (category) {
        params.category = category;
      }

      const response = await apiService.get<GetLiveEventsResponse>('/streaming/live/events', {
        params,
      });

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la récupération des événements en direct');
      }
    } catch (error) {
      console.error('Erreur getLiveEvents:', error);
      throw error;
    }
  }

  // Enregistrer qu'un spectateur rejoint le stream
  async joinStream(eventId: string): Promise<void> {
    try {
      const response = await apiService.post(`/streaming/${eventId}/viewer-join`);

      if (!response.success) {
        throw new Error(response.error?.message || 'Erreur lors de l\'enregistrement de la connexion');
      }
    } catch (error) {
      console.error('Erreur joinStream:', error);
      throw error;
    }
  }

  // Enregistrer qu'un spectateur quitte le stream
  async leaveStream(eventId: string, watchDuration: number): Promise<void> {
    try {
      const response = await apiService.post(`/streaming/${eventId}/viewer-leave`, {
        watchDuration,
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Erreur lors de l\'enregistrement de la déconnexion');
      }
    } catch (error) {
      console.error('Erreur leaveStream:', error);
      throw error;
    }
  }

  // Vérifier si un stream est actif
  async isStreamActive(eventId: string): Promise<boolean> {
    try {
      const streamInfo = await this.getStreamInfo(eventId);
      return streamInfo.streamStats.isLive;
    } catch (error) {
      console.error('Erreur isStreamActive:', error);
      return false;
    }
  }

  // Obtenir le nombre de spectateurs actuels
  async getCurrentViewers(eventId: string): Promise<number> {
    try {
      const streamInfo = await this.getStreamInfo(eventId);
      return streamInfo.streamStats.currentViewers;
    } catch (error) {
      console.error('Erreur getCurrentViewers:', error);
      return 0;
    }
  }

  // Obtenir les statistiques d'un stream
  async getStreamStats(eventId: string): Promise<any> {
    try {
      const streamInfo = await this.getStreamInfo(eventId);
      return streamInfo.streamStats;
    } catch (error) {
      console.error('Erreur getStreamStats:', error);
      throw error;
    }
  }

  // Formater la durée de visionnage
  formatWatchDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}min ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}min ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }

  // Formater le nombre de spectateurs
  formatViewerCount(count: number): string {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    } else {
      return count.toString();
    }
  }

  // Vérifier la qualité de la connexion
  async checkConnectionQuality(): Promise<'excellent' | 'good' | 'fair' | 'poor'> {
    try {
      // Simuler un test de connexion
      const startTime = Date.now();
      await apiService.get('/streaming/test-connection');
      const responseTime = Date.now() - startTime;

      if (responseTime < 100) {
        return 'excellent';
      } else if (responseTime < 300) {
        return 'good';
      } else if (responseTime < 1000) {
        return 'fair';
      } else {
        return 'poor';
      }
    } catch (error) {
      console.error('Erreur checkConnectionQuality:', error);
      return 'poor';
    }
  }

  // Obtenir la qualité de stream recommandée
  getRecommendedQuality(connectionQuality: 'excellent' | 'good' | 'fair' | 'poor'): {
    resolution: string;
    bitrate: number;
    fps: number;
  } {
    switch (connectionQuality) {
      case 'excellent':
        return {
          resolution: '1920x1080',
          bitrate: 5000,
          fps: 60
        };
      case 'good':
        return {
          resolution: '1280x720',
          bitrate: 2500,
          fps: 30
        };
      case 'fair':
        return {
          resolution: '854x480',
          bitrate: 1000,
          fps: 30
        };
      case 'poor':
        return {
          resolution: '640x360',
          bitrate: 500,
          fps: 24
        };
      default:
        return {
          resolution: '1280x720',
          bitrate: 2500,
          fps: 30
        };
    }
  }
}

export const streamingService = new StreamingService();