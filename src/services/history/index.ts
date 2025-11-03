import { apiService } from '../api';

export interface UserHistory {
  id: string;
  userId: string;
  type: 'event_view' | 'event_purchase' | 'streaming_watch' | 'replay_watch' | 'favorite_add' | 'search';
  eventId?: string;
  eventTitle?: string;
  eventCategory?: string;
  eventImage?: string;
  action: string;
  metadata?: {
    duration?: number; // en secondes pour les vidéos
    searchQuery?: string;
    purchaseAmount?: number;
    ticketQuantity?: number;
    watchProgress?: number; // pourcentage de visionnage
    deviceInfo?: {
      platform: string;
      version: string;
    };
  };
  timestamp: string;
  createdAt: string;
}

export interface UserStats {
  totalEventsViewed: number;
  totalEventsPurchased: number;
  totalWatchTime: number; // en secondes
  totalSpent: number;
  favoriteCategories: Array<{
    category: string;
    count: number;
  }>;
  recentActivity: UserHistory[];
  monthlyStats: {
    month: string;
    eventsViewed: number;
    eventsPurchased: number;
    watchTime: number;
    amountSpent: number;
  }[];
}

export interface GetUserHistoryResponse {
  history: UserHistory[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
  stats: UserStats;
}

export interface HistoryFilters {
  type?: 'event_view' | 'event_purchase' | 'streaming_watch' | 'replay_watch' | 'favorite_add' | 'search';
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

class HistoryService {
  // Obtenir l'historique de l'utilisateur
  async getUserHistory(
    page: number = 1,
    limit: number = 20,
    filters?: HistoryFilters
  ): Promise<GetUserHistoryResponse> {
    try {
      const params: any = { page, limit };
      if (filters) {
        Object.assign(params, filters);
      }

      const response = await apiService.get<GetUserHistoryResponse>('/users/history', {
        params,
      });

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la récupération de l\'historique');
      }
    } catch (error) {
      console.error('Erreur getUserHistory:', error);
      throw error;
    }
  }

  // Ajouter une entrée à l'historique
  async addHistoryEntry(entry: Omit<UserHistory, 'id' | 'userId' | 'createdAt'>): Promise<UserHistory> {
    try {
      const response = await apiService.post<UserHistory>('/users/history', entry);

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de l\'ajout à l\'historique');
      }
    } catch (error) {
      console.error('Erreur addHistoryEntry:', error);
      throw error;
    }
  }

  // Enregistrer la visualisation d'un événement
  async recordEventView(eventId: string, eventTitle: string, eventCategory: string, eventImage?: string): Promise<void> {
    try {
      await this.addHistoryEntry({
        type: 'event_view',
        eventId,
        eventTitle,
        eventCategory,
        eventImage,
        action: 'Événement consulté',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Erreur recordEventView:', error);
      // Ne pas faire échouer l'action principale
    }
  }

  // Enregistrer l'achat d'un événement
  async recordEventPurchase(
    eventId: string,
    eventTitle: string,
    eventCategory: string,
    purchaseAmount: number,
    ticketQuantity: number,
    eventImage?: string
  ): Promise<void> {
    try {
      await this.addHistoryEntry({
        type: 'event_purchase',
        eventId,
        eventTitle,
        eventCategory,
        eventImage,
        action: 'Billet acheté',
        metadata: {
          purchaseAmount,
          ticketQuantity,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Erreur recordEventPurchase:', error);
      // Ne pas faire échouer l'action principale
    }
  }

  // Enregistrer le visionnage d'un streaming
  async recordStreamingWatch(
    eventId: string,
    eventTitle: string,
    duration: number,
    watchProgress: number
  ): Promise<void> {
    try {
      await this.addHistoryEntry({
        type: 'streaming_watch',
        eventId,
        eventTitle,
        action: 'Streaming regardé',
        metadata: {
          duration,
          watchProgress,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Erreur recordStreamingWatch:', error);
      // Ne pas faire échouer l'action principale
    }
  }

  // Enregistrer le visionnage d'un replay
  async recordReplayWatch(
    eventId: string,
    eventTitle: string,
    duration: number,
    watchProgress: number
  ): Promise<void> {
    try {
      await this.addHistoryEntry({
        type: 'replay_watch',
        eventId,
        eventTitle,
        action: 'Replay regardé',
        metadata: {
          duration,
          watchProgress,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Erreur recordReplayWatch:', error);
      // Ne pas faire échouer l'action principale
    }
  }

  // Enregistrer l'ajout d'un favori
  async recordFavoriteAdd(eventId: string, eventTitle: string, eventCategory: string): Promise<void> {
    try {
      await this.addHistoryEntry({
        type: 'favorite_add',
        eventId,
        eventTitle,
        eventCategory,
        action: 'Ajouté aux favoris',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Erreur recordFavoriteAdd:', error);
      // Ne pas faire échouer l'action principale
    }
  }

  // Enregistrer une recherche
  async recordSearch(searchQuery: string, resultsCount: number): Promise<void> {
    try {
      await this.addHistoryEntry({
        type: 'search',
        action: 'Recherche effectuée',
        metadata: {
          searchQuery,
          resultsCount,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Erreur recordSearch:', error);
      // Ne pas faire échouer l'action principale
    }
  }

  // Obtenir les statistiques de l'utilisateur
  async getUserStats(): Promise<UserStats> {
    try {
      const response = await apiService.get<UserStats>('/users/stats');

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la récupération des statistiques');
      }
    } catch (error) {
      console.error('Erreur getUserStats:', error);
      throw error;
    }
  }

  // Supprimer une entrée de l'historique
  async deleteHistoryEntry(historyId: string): Promise<void> {
    try {
      const response = await apiService.delete(`/users/history/${historyId}`);

      if (!response.success) {
        throw new Error(response.error?.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur deleteHistoryEntry:', error);
      throw error;
    }
  }

  // Vider l'historique
  async clearHistory(): Promise<void> {
    try {
      const response = await apiService.delete('/users/history');

      if (!response.success) {
        throw new Error(response.error?.message || 'Erreur lors de la suppression de l\'historique');
      }
    } catch (error) {
      console.error('Erreur clearHistory:', error);
      throw error;
    }
  }

  // Exporter l'historique
  async exportHistory(format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const response = await apiService.get<{ downloadUrl: string }>(`/users/history/export?format=${format}`);

      if (response.success && response.data) {
        return response.data.downloadUrl;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de l\'export');
      }
    } catch (error) {
      console.error('Erreur exportHistory:', error);
      throw error;
    }
  }
}

export const historyService = new HistoryService();
