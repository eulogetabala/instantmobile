import { apiService } from '../api';
import { Event, PaginationResponse, ApiResponse } from '../../types';

export interface EventFilters {
  category?: string;
  status?: string;
  isFree?: boolean;
  isFeatured?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface EventStats {
  event: {
    id: string;
    title: string;
    stats: {
      views: number;
      likes: number;
      shares: number;
      ticketsSold: number;
      revenue: number;
      averageRating: number;
      totalRatings: number;
    };
  };
  ticketStats: {
    totalSold: number;
    totalRevenue: number;
    byStatus: Record<string, number>;
    byMethod: Record<string, number>;
  };
}

class EventService {
  // Obtenir la liste des événements
  async getEvents(filters: EventFilters = {}): Promise<PaginationResponse<Event>> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await apiService.get<PaginationResponse<Event>>(
        `/events?${params.toString()}`
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la récupération des événements');
      }
    } catch (error) {
      console.error('Erreur getEvents:', error);
      throw error;
    }
  }

  // Obtenir les événements en vedette (Premium)
  async getFeaturedEvents(limit = 10): Promise<{ events: Event[]; stats: any }> {
    try {
      const response = await apiService.get<{ events: Event[]; stats: any }>(
        `/events/featured?limit=${limit}`
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la récupération des événements en vedette');
      }
    } catch (error) {
      console.error('Erreur getFeaturedEvents:', error);
      throw error;
    }
  }

  // Obtenir les événements à venir
  async getUpcomingEvents(limit = 8): Promise<Event[]> {
    try {
      const response = await apiService.get<{ events: Event[] }>(
        `/events/upcoming?limit=${limit}`
      );

      if (response.success && response.data) {
        return response.data.events;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la récupération des événements à venir');
      }
    } catch (error) {
      console.error('Erreur getUpcomingEvents:', error);
      throw error;
    }
  }

  // Obtenir les événements en cours (live)
  async getLiveEvents(): Promise<{ events: Event[]; stats: any }> {
    try {
      const response = await apiService.get<{ events: Event[]; stats: any }>(
        '/events/live'
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la récupération des événements en cours');
      }
    } catch (error) {
      console.error('Erreur getLiveEvents:', error);
      throw error;
    }
  }

  // Obtenir les événements passés
  async getPastEvents(): Promise<{ events: Event[]; stats: any }> {
    try {
      const response = await apiService.get<{ events: Event[]; stats: any }>(
        '/events/past'
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la récupération des événements passés');
      }
    } catch (error) {
      console.error('Erreur getPastEvents:', error);
      throw error;
    }
  }


  // Obtenir les replays disponibles
  async getReplays(filters: EventFilters = {}): Promise<PaginationResponse<Event>> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await apiService.get<PaginationResponse<Event>>(
        `/events/replays?${params.toString()}`
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la récupération des replays');
      }
    } catch (error) {
      console.error('Erreur getReplays:', error);
      throw error;
    }
  }

  // Obtenir les détails d'un événement
  async getEventById(eventId: string): Promise<{ event: Event; hasAccess: boolean }> {
    try {
      if (!eventId || eventId.trim().length === 0) {
        throw new Error('ID d\'événement manquant ou invalide');
      }

      const response = await apiService.get<{ event: Event; hasAccess: boolean }>(
        `/events/${eventId.trim()}`
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Événement non trouvé');
      }
    } catch (error: any) {
      console.error('Erreur getEventById:', {
        eventId,
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  // Créer un nouvel événement
  async createEvent(eventData: Partial<Event>): Promise<Event> {
    try {
      const response = await apiService.post<{ event: Event }>('/events', eventData);

      if (response.success && response.data) {
        return response.data.event;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la création de l\'événement');
      }
    } catch (error) {
      console.error('Erreur createEvent:', error);
      throw error;
    }
  }

  // Mettre à jour un événement
  async updateEvent(eventId: string, eventData: Partial<Event>): Promise<Event> {
    try {
      const response = await apiService.put<{ event: Event }>(`/events/${eventId}`, eventData);

      if (response.success && response.data) {
        return response.data.event;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la mise à jour de l\'événement');
      }
    } catch (error) {
      console.error('Erreur updateEvent:', error);
      throw error;
    }
  }

  // Mettre à jour l'affiche de l'événement
  async updateEventPoster(eventId: string, imageUri: string): Promise<Event> {
    try {
      const formData = new FormData();
      formData.append('poster', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'poster.jpg',
      } as any);

      const response = await apiService.post<{ event: Event }>(
        `/events/${eventId}/poster`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.success && response.data) {
        return response.data.event;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la mise à jour de l\'affiche');
      }
    } catch (error) {
      console.error('Erreur updateEventPoster:', error);
      throw error;
    }
  }

  // Modifier le statut d'un événement
  async updateEventStatus(eventId: string, status: string): Promise<Event> {
    try {
      const response = await apiService.put<{ event: Event }>(
        `/events/${eventId}/status`,
        { status }
      );

      if (response.success && response.data) {
        return response.data.event;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la mise à jour du statut');
      }
    } catch (error) {
      console.error('Erreur updateEventStatus:', error);
      throw error;
    }
  }

  // Supprimer un événement
  async deleteEvent(eventId: string): Promise<void> {
    try {
      const response = await apiService.delete(`/events/${eventId}`);

      if (!response.success) {
        throw new Error(response.error?.message || 'Erreur lors de la suppression de l\'événement');
      }
    } catch (error) {
      console.error('Erreur deleteEvent:', error);
      throw error;
    }
  }

  // Obtenir les statistiques d'un événement
  async getEventStats(eventId: string): Promise<EventStats> {
    try {
      const response = await apiService.get<EventStats>(`/events/${eventId}/stats`);

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la récupération des statistiques');
      }
    } catch (error) {
      console.error('Erreur getEventStats:', error);
      throw error;
    }
  }

  // Aimer/Ne plus aimer un événement
  async toggleEventLike(eventId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    try {
      const response = await apiService.post<{ isLiked: boolean; likesCount: number }>(
        `/events/${eventId}/like`
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de l\'action like');
      }
    } catch (error) {
      console.error('Erreur toggleEventLike:', error);
      throw error;
    }
  }

  // Rechercher des événements
  async searchEvents(query: string, filters: EventFilters = {}): Promise<PaginationResponse<Event>> {
    try {
      const searchFilters = { ...filters, search: query };
      return this.getEvents(searchFilters);
    } catch (error) {
      console.error('Erreur searchEvents:', error);
      throw error;
    }
  }

  // Obtenir les événements par catégorie
  async getEventsByCategory(category: string, filters: EventFilters = {}): Promise<PaginationResponse<Event>> {
    try {
      const categoryFilters = { ...filters, category };
      return this.getEvents(categoryFilters);
    } catch (error) {
      console.error('Erreur getEventsByCategory:', error);
      throw error;
    }
  }

  // Obtenir les événements gratuits
  async getFreeEvents(limit = 10): Promise<{ events: Event[]; stats: any }> {
    try {
      const response = await apiService.get<{ events: Event[]; stats: any }>(
        `/events/free?limit=${limit}`
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la récupération des événements gratuits');
      }
    } catch (error) {
      console.error('Erreur getFreeEvents:', error);
      throw error;
    }
  }

  // Obtenir les événements gratuits avec filtres (méthode alternative)
  async getFreeEventsWithFilters(filters: EventFilters = {}): Promise<PaginationResponse<Event>> {
    try {
      const freeFilters = { ...filters, isFree: true };
      return this.getEvents(freeFilters);
    } catch (error) {
      console.error('Erreur getFreeEventsWithFilters:', error);
      throw error;
    }
  }

  // Obtenir les événements payants
  async getPaidEvents(filters: EventFilters = {}): Promise<PaginationResponse<Event>> {
    try {
      const paidFilters = { ...filters, isFree: false };
      return this.getEvents(paidFilters);
    } catch (error) {
      console.error('Erreur getPaidEvents:', error);
      throw error;
    }
  }

  // Obtenir les événements d'un organisateur
  async getOrganizerEvents(organizerId: string, filters: EventFilters = {}): Promise<PaginationResponse<Event>> {
    try {
      const response = await apiService.get<PaginationResponse<Event>>(
        `/organizers/${organizerId}/events`,
        { params: filters }
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la récupération des événements de l\'organisateur');
      }
    } catch (error) {
      console.error('Erreur getOrganizerEvents:', error);
      throw error;
    }
  }

  // Obtenir les événements similaires
  async getSimilarEvents(eventId: string, limit = 5): Promise<Event[]> {
    try {
      const response = await apiService.get<{ events: Event[] }>(
        `/events/${eventId}/similar?limit=${limit}`
      );

      if (response.success && response.data) {
        return response.data.events;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la récupération des événements similaires');
      }
    } catch (error) {
      console.error('Erreur getSimilarEvents:', error);
      throw error;
    }
  }
}

// Instance singleton
export const eventService = new EventService();
export default eventService;

