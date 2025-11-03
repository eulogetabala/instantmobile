import { apiService } from '../api';
import { Ticket } from '../../types';

export interface TicketResponse {
  tickets: Ticket[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

export interface TicketStats {
  totalTickets: number;
  confirmedTickets: number;
  usedTickets: number;
  cancelledTickets: number;
  totalAmount: number;
}

class TicketService {
  // Obtenir les billets de l'utilisateur
  async getUserTickets(page = 1, limit = 20): Promise<TicketResponse> {
    try {
      const response = await apiService.get<TicketResponse>(
        `/tickets?page=${page}&limit=${limit}`
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la récupération des billets');
      }
    } catch (error) {
      console.error('Erreur getUserTickets:', error);
      throw error;
    }
  }

  // Obtenir un billet par ID
  async getTicketById(ticketId: string): Promise<Ticket> {
    try {
      const response = await apiService.get<{ ticket: Ticket }>(
        `/tickets/${ticketId}`
      );

      if (response.success && response.data) {
        return response.data.ticket;
      } else {
        throw new Error(response.error?.message || 'Billet non trouvé');
      }
    } catch (error) {
      console.error('Erreur getTicketById:', error);
      throw error;
    }
  }

  // Obtenir les statistiques des billets
  async getTicketStats(): Promise<TicketStats> {
    try {
      const response = await apiService.get<{ stats: TicketStats }>(
        '/tickets/stats'
      );

      if (response.success && response.data) {
        return response.data.stats;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la récupération des statistiques');
      }
    } catch (error) {
      console.error('Erreur getTicketStats:', error);
      throw error;
    }
  }

  // Valider un billet par QR code
  async validateTicketByQR(qrCode: string): Promise<Ticket> {
    try {
      const response = await apiService.get<{ ticket: Ticket }>(
        `/tickets/qr/${qrCode}`
      );

      if (response.success && response.data) {
        return response.data.ticket;
      } else {
        throw new Error(response.error?.message || 'Billet non trouvé ou invalide');
      }
    } catch (error) {
      console.error('Erreur validateTicketByQR:', error);
      throw error;
    }
  }

  // Marquer un billet comme utilisé
  async markTicketAsUsed(ticketId: string): Promise<void> {
    try {
      const response = await apiService.post<{ message: string }>(
        `/tickets/${ticketId}/validate`,
        {}
      );

      if (!response.success) {
        throw new Error(response.error?.message || 'Erreur lors de la validation du billet');
      }
    } catch (error) {
      console.error('Erreur markTicketAsUsed:', error);
      throw error;
    }
  }

  // Demander un remboursement
  async requestRefund(ticketId: string, reason: string): Promise<{ message: string }> {
    try {
      const response = await apiService.post<{ message: string }>(
        `/tickets/${ticketId}/refund`,
        { reason }
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la demande de remboursement');
      }
    } catch (error) {
      console.error('Erreur requestRefund:', error);
      throw error;
    }
  }

  // Obtenir l'historique des billets
  async getTicketHistory(ticketId: string): Promise<any[]> {
    try {
      const response = await apiService.get<{ history: any[] }>(
        `/tickets/${ticketId}/history`
      );

      if (response.success && response.data) {
        return response.data.history;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la récupération de l\'historique');
      }
    } catch (error) {
      console.error('Erreur getTicketHistory:', error);
      throw error;
    }
  }
}

export const ticketService = new TicketService();
