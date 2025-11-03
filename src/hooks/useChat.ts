import { useState, useEffect, useCallback, useRef } from 'react';
import { chatService, ChatMessage, ChatStats } from '../services/chat';
import { useAuth } from '../contexts/AuthContext';

export const useChat = (eventId: string) => {
  const { isAuthenticated, user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([]);
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [activeUsers, setActiveUsers] = useState(0);
  
  const lastMessageId = useRef<string | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // Rejoindre le chat
  const joinChat = useCallback(async () => {
    if (!isAuthenticated || !eventId) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await chatService.joinChat(eventId);
      setActiveUsers(result.activeUsers);
      setIsConnected(true);
      
      // Démarrer le polling pour les nouveaux messages
      startPolling();
    } catch (err) {
      console.error('Erreur lors de la connexion au chat:', err);
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, eventId]);

  // Quitter le chat
  const leaveChat = useCallback(async () => {
    if (!isAuthenticated || !eventId) return;

    try {
      const result = await chatService.leaveChat(eventId);
      setActiveUsers(result.activeUsers);
      setIsConnected(false);
      
      // Arrêter le polling
      stopPolling();
    } catch (err) {
      console.error('Erreur lors de la déconnexion du chat:', err);
    }
  }, [isAuthenticated, eventId]);

  // Envoyer un message
  const sendMessage = useCallback(async (message: string, type: 'text' | 'emoji' = 'text', replyTo?: string) => {
    if (!isAuthenticated || !eventId || !message.trim()) return;

    try {
      setIsSending(true);
      setError(null);

      // Valider le message
      const validation = chatService.validateMessage(message);
      if (!validation.isValid) {
        setError(validation.error || 'Message invalide');
        return;
      }

      const newMessage = await chatService.sendMessage(eventId, {
        message: message.trim(),
        type,
        replyTo
      });

      // Ajouter le message à la liste locale
      setMessages(prev => [...prev, newMessage]);
      lastMessageId.current = newMessage.id;
    } catch (err) {
      console.error('Erreur lors de l\'envoi du message:', err);
      setError(err instanceof Error ? err.message : 'Erreur d\'envoi');
    } finally {
      setIsSending(false);
    }
  }, [isAuthenticated, eventId]);

  // Ajouter une réaction
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!isAuthenticated) return;

    try {
      const updatedMessage = await chatService.addReaction(messageId, emoji);
      
      // Mettre à jour le message dans la liste
      setMessages(prev => 
        prev.map(msg => msg.id === messageId ? updatedMessage : msg)
      );
    } catch (err) {
      console.error('Erreur lors de l\'ajout de la réaction:', err);
    }
  }, [isAuthenticated]);

  // Supprimer une réaction
  const removeReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!isAuthenticated) return;

    try {
      const updatedMessage = await chatService.removeReaction(messageId, emoji);
      
      // Mettre à jour le message dans la liste
      setMessages(prev => 
        prev.map(msg => msg.id === messageId ? updatedMessage : msg)
      );
    } catch (err) {
      console.error('Erreur lors de la suppression de la réaction:', err);
    }
  }, [isAuthenticated]);

  // Charger les messages récents
  const loadRecentMessages = useCallback(async () => {
    if (!eventId) return;

    try {
      setIsLoading(true);
      const result = await chatService.getRecentMessages(eventId, 50);
      setMessages(result.messages);
      setActiveUsers(result.activeUsers);
      lastMessageId.current = result.messages[result.messages.length - 1]?.id || null;
    } catch (err) {
      console.error('Erreur lors du chargement des messages:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  // Charger les messages épinglés
  const loadPinnedMessages = useCallback(async () => {
    if (!eventId) return;

    try {
      const pinned = await chatService.getPinnedMessages(eventId);
      setPinnedMessages(pinned);
    } catch (err) {
      console.error('Erreur lors du chargement des messages épinglés:', err);
    }
  }, [eventId]);

  // Charger les statistiques
  const loadStats = useCallback(async () => {
    if (!eventId) return;

    try {
      const chatStats = await chatService.getChatStats(eventId);
      setStats(chatStats);
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
    }
  }, [eventId]);

  // Démarrer le polling pour les nouveaux messages
  const startPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }

    pollingInterval.current = setInterval(async () => {
      if (!isConnected || !eventId) return;

      try {
        const result = await chatService.getRecentMessages(eventId, 50);
        const newMessages = result.messages.filter(msg => 
          !lastMessageId.current || msg.id !== lastMessageId.current
        );

        if (newMessages.length > 0) {
          setMessages(prev => [...prev, ...newMessages]);
          lastMessageId.current = newMessages[newMessages.length - 1].id;
        }

        setActiveUsers(result.activeUsers);
      } catch (err) {
        console.error('Erreur lors du polling des messages:', err);
      }
    }, 2000); // Polling toutes les 2 secondes
  }, [isConnected, eventId]);

  // Arrêter le polling
  const stopPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  }, []);

  // Rechercher des messages
  const searchMessages = useCallback(async (query: string) => {
    if (!eventId || !query.trim()) return [];

    try {
      const result = await chatService.searchMessages(eventId, query.trim());
      return result.messages;
    } catch (err) {
      console.error('Erreur lors de la recherche:', err);
      return [];
    }
  }, [eventId]);

  // Formater le temps d'un message
  const formatMessageTime = useCallback((timestamp: string) => {
    return chatService.formatMessageTime(timestamp);
  }, []);

  // Formater le nom d'utilisateur
  const formatUserName = useCallback((user: ChatMessage['user']) => {
    return chatService.formatUserName(user);
  }, []);

  // Obtenir la couleur du rôle
  const getRoleColor = useCallback((role: string) => {
    return chatService.getRoleColor(role);
  }, []);

  // Obtenir l'icône du rôle
  const getRoleIcon = useCallback((role: string) => {
    return chatService.getRoleIcon(role);
  }, []);

  // Vérifier si un message est récent
  const isRecentMessage = useCallback((timestamp: string) => {
    return chatService.isRecentMessage(timestamp);
  }, []);

  // Obtenir les emojis populaires
  const getPopularEmojis = useCallback(() => {
    return chatService.getPopularEmojis();
  }, []);

  // Effet pour charger les données initiales
  useEffect(() => {
    if (eventId) {
      loadRecentMessages();
      loadPinnedMessages();
      loadStats();
    }
  }, [eventId, loadRecentMessages, loadPinnedMessages, loadStats]);

  // Effet pour rejoindre le chat si authentifié
  useEffect(() => {
    if (isAuthenticated && eventId && !isConnected) {
      joinChat();
    }
  }, [isAuthenticated, eventId, isConnected, joinChat]);

  // Effet pour nettoyer à la déconnexion
  useEffect(() => {
    return () => {
      if (isConnected) {
        leaveChat();
      }
      stopPolling();
    };
  }, [isConnected, leaveChat, stopPolling]);

  // Effet pour nettoyer le polling
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    // État
    messages,
    pinnedMessages,
    stats,
    isConnected,
    isLoading,
    error,
    isSending,
    activeUsers,
    
    // Actions
    joinChat,
    leaveChat,
    sendMessage,
    addReaction,
    removeReaction,
    loadRecentMessages,
    loadPinnedMessages,
    loadStats,
    searchMessages,
    
    // Utilitaires
    formatMessageTime,
    formatUserName,
    getRoleColor,
    getRoleIcon,
    isRecentMessage,
    getPopularEmojis,
    
    // État de l'utilisateur
    currentUser: user,
    isAuthenticated,
  };
};
