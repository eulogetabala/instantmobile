import { apiService } from '../api';

export interface ChatMessage {
  id: string;
  event: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: 'user' | 'organizer' | 'admin' | 'moderator';
  };
  message: string;
  type: 'text' | 'emoji' | 'system' | 'moderator' | 'announcement';
  isModerated: boolean;
  moderationReason?: 'spam' | 'inappropriate' | 'offensive' | 'irrelevant' | 'other';
  isPinned: boolean;
  replyTo?: {
    id: string;
    message: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  reactions: Array<{
    emoji: string;
    users: string[];
    count: number;
  }>;
  metadata: {
    deviceInfo: {
      platform: string;
      version: string;
    };
    location?: {
      country: string;
      city: string;
    };
    readBy: Array<{
      user: string;
      readAt: string;
    }>;
  };
  status: 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface ChatStats {
  totalMessages: number;
  uniqueUsersCount: number;
  messagesByType: Array<{
    type: string;
    createdAt: string;
  }>;
  reactionsCount: number;
  averageMessagesPerUser: number;
  activeUsers: number;
  isActive: boolean;
}

export interface SendMessageRequest {
  message: string;
  type?: 'text' | 'emoji' | 'system';
  replyTo?: string;
}

export interface AddReactionRequest {
  emoji: string;
}

export interface SearchMessagesResponse {
  messages: ChatMessage[];
}

export interface GetMessagesResponse {
  messages: ChatMessage[];
  activeUsers: number;
}

class ChatService {
  private activeChats: Map<string, boolean> = new Map();
  private messageListeners: Map<string, (messages: ChatMessage[]) => void> = new Map();

  // Rejoindre le chat d'un événement
  async joinChat(eventId: string): Promise<{ activeUsers: number }> {
    try {
      const response = await apiService.post<{ activeUsers: number }>(`/chat/${eventId}/join`);

      if (response.success && response.data) {
        this.activeChats.set(eventId, true);
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la connexion au chat');
      }
    } catch (error) {
      console.error('Erreur joinChat:', error);
      throw error;
    }
  }

  // Quitter le chat d'un événement
  async leaveChat(eventId: string): Promise<{ activeUsers: number }> {
    try {
      const response = await apiService.post<{ activeUsers: number }>(`/chat/${eventId}/leave`);

      if (response.success && response.data) {
        this.activeChats.set(eventId, false);
        this.messageListeners.delete(eventId);
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la déconnexion du chat');
      }
    } catch (error) {
      console.error('Erreur leaveChat:', error);
      throw error;
    }
  }

  // Envoyer un message
  async sendMessage(eventId: string, messageData: SendMessageRequest): Promise<ChatMessage> {
    try {
      const response = await apiService.post<{ message: ChatMessage; activeUsers: number }>(
        `/chat/${eventId}/send`,
        messageData
      );

      if (response.success && response.data) {
        return response.data.message;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de l\'envoi du message');
      }
    } catch (error) {
      console.error('Erreur sendMessage:', error);
      throw error;
    }
  }

  // Obtenir les messages récents
  async getRecentMessages(eventId: string, limit: number = 50): Promise<GetMessagesResponse> {
    try {
      const response = await apiService.get<GetMessagesResponse>(`/chat/${eventId}/messages`, {
        params: { limit },
      });

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la récupération des messages');
      }
    } catch (error) {
      console.error('Erreur getRecentMessages:', error);
      throw error;
    }
  }

  // Obtenir les messages épinglés
  async getPinnedMessages(eventId: string): Promise<ChatMessage[]> {
    try {
      const response = await apiService.get<{ messages: ChatMessage[] }>(`/chat/${eventId}/pinned`);

      if (response.success && response.data) {
        return response.data.messages;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la récupération des messages épinglés');
      }
    } catch (error) {
      console.error('Erreur getPinnedMessages:', error);
      throw error;
    }
  }

  // Ajouter une réaction
  async addReaction(messageId: string, emoji: string): Promise<ChatMessage> {
    try {
      const response = await apiService.post<{ message: ChatMessage }>(
        `/chat/messages/${messageId}/reaction`,
        { emoji }
      );

      if (response.success && response.data) {
        return response.data.message;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de l\'ajout de la réaction');
      }
    } catch (error) {
      console.error('Erreur addReaction:', error);
      throw error;
    }
  }

  // Supprimer une réaction
  async removeReaction(messageId: string, emoji: string): Promise<ChatMessage> {
    try {
      const response = await apiService.delete<{ message: ChatMessage }>(
        `/chat/messages/${messageId}/reaction`,
        { data: { emoji } }
      );

      if (response.success && response.data) {
        return response.data.message;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la suppression de la réaction');
      }
    } catch (error) {
      console.error('Erreur removeReaction:', error);
      throw error;
    }
  }

  // Rechercher des messages
  async searchMessages(eventId: string, query: string, page: number = 1, limit: number = 20): Promise<SearchMessagesResponse> {
    try {
      const response = await apiService.get<SearchMessagesResponse>(`/chat/${eventId}/search`, {
        params: { q: query, page, limit },
      });

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la recherche');
      }
    } catch (error) {
      console.error('Erreur searchMessages:', error);
      throw error;
    }
  }

  // Obtenir les statistiques du chat
  async getChatStats(eventId: string): Promise<ChatStats> {
    try {
      const response = await apiService.get<{ stats: ChatStats }>(`/chat/${eventId}/stats`);

      if (response.success && response.data) {
        return response.data.stats;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la récupération des statistiques');
      }
    } catch (error) {
      console.error('Erreur getChatStats:', error);
      throw error;
    }
  }

  // Vérifier si l'utilisateur est connecté au chat
  isConnectedToChat(eventId: string): boolean {
    return this.activeChats.get(eventId) || false;
  }

  // Formater le temps d'un message
  formatMessageTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);

    if (diffInMinutes < 1) {
      return 'Maintenant';
    } else if (diffInMinutes < 60) {
      return `Il y a ${Math.floor(diffInMinutes)} min`;
    } else if (diffInMinutes < 1440) { // 24 heures
      return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  // Formater le nom d'utilisateur
  formatUserName(user: ChatMessage['user']): string {
    return `${user.firstName} ${user.lastName}`;
  }

  // Obtenir la couleur du rôle
  getRoleColor(role: string): string {
    switch (role) {
      case 'admin':
        return '#FF6B35'; // Orange
      case 'moderator':
        return '#4ECDC4'; // Turquoise
      case 'organizer':
        return '#45B7D1'; // Bleu
      default:
        return '#95A5A6'; // Gris
    }
  }

  // Obtenir l'icône du rôle
  getRoleIcon(role: string): string {
    switch (role) {
      case 'admin':
        return 'crown';
      case 'moderator':
        return 'shield-checkmark';
      case 'organizer':
        return 'star';
      default:
        return 'person';
    }
  }

  // Vérifier si un message est récent (moins de 5 minutes)
  isRecentMessage(timestamp: string): boolean {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
    return diffInMinutes < 5;
  }

  // Obtenir les emojis populaires
  getPopularEmojis(): string[] {
    return ['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🔥', '💯', '🎉'];
  }

  // Valider un message avant envoi
  validateMessage(message: string): { isValid: boolean; error?: string } {
    if (!message || message.trim().length === 0) {
      return { isValid: false, error: 'Le message ne peut pas être vide' };
    }

    if (message.length > 500) {
      return { isValid: false, error: 'Le message ne peut pas dépasser 500 caractères' };
    }

    // Vérifier les mots interdits (basique)
    const forbiddenWords = ['spam', 'scam', 'hack'];
    const lowerMessage = message.toLowerCase();
    
    for (const word of forbiddenWords) {
      if (lowerMessage.includes(word)) {
        return { isValid: false, error: 'Le message contient des mots interdits' };
      }
    }

    return { isValid: true };
  }

  // Nettoyer les chats inactifs
  cleanupInactiveChats(): void {
    this.activeChats.clear();
    this.messageListeners.clear();
  }

  // Simuler la réception de nouveaux messages (pour les tests)
  simulateNewMessage(eventId: string, message: ChatMessage): void {
    const listener = this.messageListeners.get(eventId);
    if (listener) {
      listener([message]);
    }
  }

  // Ajouter un écouteur de messages
  addMessageListener(eventId: string, callback: (messages: ChatMessage[]) => void): void {
    this.messageListeners.set(eventId, callback);
  }

  // Supprimer un écouteur de messages
  removeMessageListener(eventId: string): void {
    this.messageListeners.delete(eventId);
  }
}

export const chatService = new ChatService();
