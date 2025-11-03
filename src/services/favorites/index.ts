import { apiService } from '../api';
import { Event } from '../../types';

export interface FavoriteEvent {
  id: string;
  eventId: string;
  userId: string;
  event: Event;
  createdAt: string;
}

export interface GetFavoritesResponse {
  favorites: FavoriteEvent[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

class FavoriteService {
  // Obtenir tous les favoris de l'utilisateur
  async getUserFavorites(page: number = 1, limit: number = 20): Promise<GetFavoritesResponse> {
    try {
      const response = await apiService.get<GetFavoritesResponse>(`/favorites`, {
        params: { page, limit },
      });

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la récupération des favoris');
      }
    } catch (error) {
      console.error('Erreur getUserFavorites:', error);
      throw error;
    }
  }

  // Ajouter un événement aux favoris
  async addToFavorites(eventId: string): Promise<FavoriteEvent> {
    try {
      const response = await apiService.post<FavoriteEvent>(`/favorites`, {
        eventId,
      });

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de l\'ajout aux favoris');
      }
    } catch (error) {
      console.error('Erreur addToFavorites:', error);
      throw error;
    }
  }

  // Supprimer un événement des favoris
  async removeFromFavorites(eventId: string): Promise<void> {
    try {
      const response = await apiService.delete(`/favorites/${eventId}`);

      if (!response.success) {
        throw new Error(response.error?.message || 'Erreur lors de la suppression des favoris');
      }
    } catch (error) {
      console.error('Erreur removeFromFavorites:', error);
      throw error;
    }
  }

  // Vérifier si un événement est en favori
  async isEventFavorite(eventId: string): Promise<boolean> {
    try {
      const response = await apiService.get<{ isFavorite: boolean }>(`/favorites/${eventId}/status`);

      if (response.success && response.data) {
        return response.data.isFavorite;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Erreur isEventFavorite:', error);
      return false;
    }
  }

  // Toggle favori (ajouter ou supprimer)
  async toggleFavorite(eventId: string): Promise<boolean> {
    try {
      const isFavorite = await this.isEventFavorite(eventId);
      
      if (isFavorite) {
        await this.removeFromFavorites(eventId);
        return false;
      } else {
        await this.addToFavorites(eventId);
        return true;
      }
    } catch (error) {
      console.error('Erreur toggleFavorite:', error);
      throw error;
    }
  }
}

export const favoriteService = new FavoriteService();
