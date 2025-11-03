import { apiService } from '../api';

export interface StreamingLink {
  hls: string;
  dash: string;
  chat: string;
  qualities: {
    '1080p': string;
    '720p': string;
    '480p': string;
    '360p': string;
  };
}

export interface StreamingAccess {
  streamingUrl: StreamingLink;
  event: {
    id: string;
    title: string;
    isLive: boolean;
    startDate: string;
    endDate: string;
    streaming: {
      isLive: boolean;
      currentViewers: number;
      maxViewers: number;
      streamStatus: string;
    };
  };
  ticket: {
    id: string;
    ticketNumber: string;
    accessToken: string;
    validUntil: string;
    canAccessLive: boolean;
    canAccessReplay: boolean;
  };
  access: {
    token: string;
    expiresAt: string;
    permissions: {
      canWatch: boolean;
      canChat: boolean;
      canReplay: boolean;
    };
  };
}

export interface UserAccess {
  hasAccess: boolean;
  ticket?: {
    id: string;
    ticketNumber: string;
    canAccessLive: boolean;
    canAccessReplay: boolean;
  };
  error?: {
    message: string;
  };
}

export interface AccessStats {
  totalTickets: number;
  totalViewers: number;
  totalWatchTime: number;
  uniqueViewerCount: number;
}

class StreamingAccessService {
  // Obtenir le lien de streaming pour un billet
  async getStreamingLink(ticketId: string): Promise<{ success: boolean; data?: StreamingAccess; error?: { message: string } }> {
    try {
      const response = await apiService.get(`/streaming-access/${ticketId}`);
      return response;
    } catch (error: any) {
      console.error('Erreur récupération lien streaming:', error);
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || 'Erreur lors de la récupération du lien de streaming'
        }
      };
    }
  }

  // Vérifier l'accès d'un utilisateur à un événement
  async checkUserAccess(eventId: string): Promise<{ success: boolean; data?: UserAccess; error?: { message: string } }> {
    try {
      const response = await apiService.get(`/streaming-access/check/${eventId}`);
      return response;
    } catch (error: any) {
      console.error('Erreur vérification accès:', error);
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || 'Erreur lors de la vérification d\'accès'
        }
      };
    }
  }

  // Valider un token de streaming
  async validateStreamingToken(token: string, eventId: string): Promise<{ success: boolean; data?: any; error?: { message: string } }> {
    try {
      const response = await apiService.post('/streaming-access/validate', {
        token,
        eventId
      });
      return response;
    } catch (error: any) {
      console.error('Erreur validation token:', error);
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || 'Token de streaming invalide'
        }
      };
    }
  }

  // Obtenir tous les billets de l'utilisateur avec accès streaming
  async getMyTicketsWithStreaming(options?: { status?: string; eventId?: string }): Promise<{ success: boolean; data?: { tickets: any[]; total: number }; error?: { message: string } }> {
    try {
      const params = new URLSearchParams();
      if (options?.status) params.append('status', options.status);
      if (options?.eventId) params.append('eventId', options.eventId);

      const response = await apiService.get(`/streaming-access/my-tickets?${params.toString()}`);
      return response;
    } catch (error: any) {
      console.error('Erreur récupération billets:', error);
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || 'Erreur lors de la récupération des billets'
        }
      };
    }
  }

  // Enregistrer l'accès au streaming
  async recordAccess(ticketId: string, watchTime: number = 0): Promise<{ success: boolean; data?: any; error?: { message: string } }> {
    try {
      const response = await apiService.post(`/streaming-access/${ticketId}/record-access`, {
        watchTime
      });
      return response;
    } catch (error: any) {
      console.error('Erreur enregistrement accès:', error);
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || 'Erreur lors de l\'enregistrement de l\'accès'
        }
      };
    }
  }

  // Obtenir les statistiques d'accès pour un événement (Admin)
  async getEventAccessStats(eventId: string): Promise<{ success: boolean; data?: AccessStats; error?: { message: string } }> {
    try {
      const response = await apiService.get(`/streaming-access/event/${eventId}/stats`);
      return response;
    } catch (error: any) {
      console.error('Erreur récupération stats:', error);
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || 'Erreur lors de la récupération des statistiques'
        }
      };
    }
  }

  // Générer tous les liens de streaming pour un événement (Admin)
  async generateEventStreamingLinks(eventId: string): Promise<{ success: boolean; data?: any; error?: { message: string } }> {
    try {
      const response = await apiService.post(`/streaming-access/event/${eventId}/generate-links`);
      return response;
    } catch (error: any) {
      console.error('Erreur génération liens:', error);
      return {
        success: false,
        error: {
          message: error.response?.data?.error?.message || 'Erreur lors de la génération des liens'
        }
      };
    }
  }

  // Vérifier si un utilisateur peut accéder à un événement
  async canUserAccessEvent(eventId: string): Promise<boolean> {
    try {
      const result = await this.checkUserAccess(eventId);
      return result.success && result.data?.hasAccess === true;
    } catch (error) {
      console.error('Erreur vérification accès:', error);
      return false;
    }
  }

  // Obtenir l'URL de streaming optimale pour un événement
  async getOptimalStreamingUrl(eventId: string): Promise<string | null> {
    try {
      // D'abord vérifier l'accès
      const accessResult = await this.checkUserAccess(eventId);
      if (!accessResult.success || !accessResult.data?.hasAccess) {
        return null;
      }

      // Obtenir les billets de l'utilisateur pour cet événement
      const ticketsResult = await this.getMyTicketsWithStreaming({ eventId });
      if (!ticketsResult.success || !ticketsResult.data?.tickets.length) {
        return null;
      }

      // Prendre le premier billet valide
      const validTicket = ticketsResult.data.tickets.find(ticket => 
        ticket.status === 'confirmed' && 
        ticket.streamingAccess?.hasAccess
      );

      if (!validTicket) {
        return null;
      }

      // Obtenir le lien de streaming
      const linkResult = await this.getStreamingLink(validTicket._id);
      if (!linkResult.success || !linkResult.data) {
        return null;
      }

      return linkResult.data.streamingUrl.hls;
    } catch (error) {
      console.error('Erreur obtention URL streaming:', error);
      return null;
    }
  }

  // Formater les statistiques d'accès pour l'affichage
  formatAccessStats(stats: AccessStats): {
    totalTickets: string;
    totalViewers: string;
    totalWatchTime: string;
    uniqueViewers: string;
  } {
    return {
      totalTickets: stats.totalTickets.toLocaleString(),
      totalViewers: stats.totalViewers.toLocaleString(),
      totalWatchTime: this.formatWatchTime(stats.totalWatchTime),
      uniqueViewers: stats.uniqueViewerCount.toLocaleString()
    };
  }

  // Formater le temps de visionnage
  private formatWatchTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    } else {
      return `${minutes}min`;
    }
  }
}

export const streamingAccessService = new StreamingAccessService();
