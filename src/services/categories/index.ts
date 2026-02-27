import { apiService } from '../api';
import { ApiResponse, PaginationResponse } from '../../types';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  gradient: [string, string, ...string[]];
  eventCount: number;
  description: string;
  value: string;
}

export interface CategoryStats {
  totalEvents: number;
  totalViews: number;
  totalLikes: number;
  totalTicketsSold: number;
  totalRevenue: number;
  averageRating: number;
}

export interface CategoryFilters {
  page?: number;
  limit?: number;
  status?: 'all' | 'published' | 'live' | 'ended';
}

class CategoryService {
  /**
   * Récupère toutes les catégories avec le nombre d'événements
   */
  async getCategories(): Promise<ApiResponse<{ categories: Category[]; total: number; totalEvents: number }>> {
    try {
      const response = await apiService.getWithRetry<{ categories: Category[]; total: number; totalEvents: number }>('/categories');
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      throw error;
    }
  }

  /**
   * Récupère les événements d'une catégorie spécifique
   */
  async getCategoryEvents(categoryId: string, filters: CategoryFilters = {}): Promise<PaginationResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.status) params.append('status', filters.status);

      const queryString = params.toString();
      const url = `/categories/${categoryId}/events${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiService.get<PaginationResponse>(url);
      return response.data!;
    } catch (error) {
      console.error(`Erreur lors de la récupération des événements de la catégorie ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques d'une catégorie
   */
  async getCategoryStats(categoryId: string): Promise<ApiResponse<CategoryStats>> {
    try {
      const response = await apiService.get<CategoryStats>(`/categories/${categoryId}/stats`);
      return response;
    } catch (error) {
      console.error(`Erreur lors de la récupération des statistiques de la catégorie ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Recherche des catégories par nom
   */
  async searchCategories(query: string): Promise<ApiResponse<{ categories: Category[]; total: number; totalEvents: number }>> {
    try {
      const response = await apiService.get<{ categories: Category[]; total: number; totalEvents: number }>(`/categories?search=${encodeURIComponent(query)}`);
      return response;
    } catch (error) {
      console.error('Erreur lors de la recherche de catégories:', error);
      throw error;
    }
  }

  /**
   * Récupère les catégories les plus populaires (avec le plus d'événements)
   */
  async getPopularCategories(limit: number = 6): Promise<ApiResponse<{ categories: Category[]; total: number; totalEvents: number }>> {
    try {
      const response = await apiService.get<{ categories: Category[]; total: number; totalEvents: number }>(`/categories?limit=${limit}&sort=popular`);
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories populaires:', error);
      throw error;
    }
  }

  /**
   * Récupère les catégories avec des événements en cours
   */
  async getActiveCategories(): Promise<ApiResponse<{ categories: Category[]; total: number; totalEvents: number }>> {
    try {
      const response = await apiService.get<{ categories: Category[]; total: number; totalEvents: number }>('/categories?status=live');
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories actives:', error);
      throw error;
    }
  }
}

export const categoryService = new CategoryService();
export default categoryService;
