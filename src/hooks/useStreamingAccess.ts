import { useState, useEffect, useCallback } from 'react';
import { streamingAccessService, StreamingAccess, UserAccess } from '../services/streaming/streamingAccess';

export interface UseStreamingAccessResult {
  // État
  hasAccess: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Données
  streamingAccess: StreamingAccess | null;
  userAccess: UserAccess | null;
  
  // Actions
  checkAccess: (eventId: string) => Promise<void>;
  getStreamingLink: (ticketId: string) => Promise<void>;
  recordAccess: (ticketId: string, watchTime?: number) => Promise<void>;
  refreshAccess: () => Promise<void>;
  
  // Utilitaires
  canWatch: boolean;
  canChat: boolean;
  canReplay: boolean;
  isAccessValid: boolean;
}

export const useStreamingAccess = (eventId?: string): UseStreamingAccessResult => {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingAccess, setStreamingAccess] = useState<StreamingAccess | null>(null);
  const [userAccess, setUserAccess] = useState<UserAccess | null>(null);

  // Vérifier l'accès à un événement
  const checkAccess = useCallback(async (eventId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await streamingAccessService.checkUserAccess(eventId);
      
      if (result.success && result.data) {
        setUserAccess(result.data);
        setHasAccess(result.data.hasAccess);
      } else {
        setHasAccess(false);
        setError(result.error?.message || 'Erreur lors de la vérification d\'accès');
      }
    } catch (err) {
      setHasAccess(false);
      setError('Erreur lors de la vérification d\'accès');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Obtenir le lien de streaming pour un billet
  const getStreamingLink = useCallback(async (ticketId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await streamingAccessService.getStreamingLink(ticketId);
      
      if (result.success && result.data) {
        setStreamingAccess(result.data);
        setHasAccess(true);
      } else {
        setHasAccess(false);
        setError(result.error?.message || 'Erreur lors de la récupération du lien de streaming');
      }
    } catch (err) {
      setHasAccess(false);
      setError('Erreur lors de la récupération du lien de streaming');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Enregistrer l'accès au streaming
  const recordAccess = useCallback(async (ticketId: string, watchTime: number = 0) => {
    try {
      const result = await streamingAccessService.recordAccess(ticketId, watchTime);
      
      if (!result.success) {
        console.error('Erreur enregistrement accès:', result.error?.message);
      }
    } catch (err) {
      console.error('Erreur enregistrement accès:', err);
    }
  }, []);

  // Rafraîchir l'accès
  const refreshAccess = useCallback(async () => {
    if (eventId) {
      await checkAccess(eventId);
    }
  }, [eventId, checkAccess]);

  // Vérifier l'accès automatiquement si eventId fourni
  useEffect(() => {
    if (eventId) {
      checkAccess(eventId);
    }
  }, [eventId, checkAccess]);

  // Calculer les permissions
  const canWatch = hasAccess && (streamingAccess?.access.permissions.canWatch || userAccess?.ticket?.canAccessLive);
  const canChat = hasAccess && (streamingAccess?.access.permissions.canChat || true);
  const canReplay = hasAccess && (streamingAccess?.access.permissions.canReplay || userAccess?.ticket?.canAccessReplay);
  
  // Vérifier si l'accès est valide
  const isAccessValid = hasAccess && !error && (
    streamingAccess?.access.expiresAt ? 
    new Date(streamingAccess.access.expiresAt) > new Date() : 
    true
  );

  return {
    // État
    hasAccess,
    isLoading,
    error,
    
    // Données
    streamingAccess,
    userAccess,
    
    // Actions
    checkAccess,
    getStreamingLink,
    recordAccess,
    refreshAccess,
    
    // Utilitaires
    canWatch,
    canChat,
    canReplay,
    isAccessValid,
  };
};

// Hook spécialisé pour les billets
export const useTicketStreamingAccess = (ticketId?: string) => {
  const [streamingAccess, setStreamingAccess] = useState<StreamingAccess | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStreamingAccess = useCallback(async (ticketId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await streamingAccessService.getStreamingLink(ticketId);
      
      if (result.success && result.data) {
        setStreamingAccess(result.data);
      } else {
        setError(result.error?.message || 'Erreur lors de la récupération du lien de streaming');
      }
    } catch (err) {
      setError('Erreur lors de la récupération du lien de streaming');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const recordAccess = useCallback(async (watchTime: number = 0) => {
    if (!ticketId) return;
    
    try {
      await streamingAccessService.recordAccess(ticketId, watchTime);
    } catch (err) {
      console.error('Erreur enregistrement accès:', err);
    }
  }, [ticketId]);

  useEffect(() => {
    if (ticketId) {
      loadStreamingAccess(ticketId);
    }
  }, [ticketId, loadStreamingAccess]);

  return {
    streamingAccess,
    isLoading,
    error,
    loadStreamingAccess,
    recordAccess,
    hasAccess: !!streamingAccess,
    canWatch: streamingAccess?.access.permissions.canWatch || false,
    canChat: streamingAccess?.access.permissions.canChat || false,
    canReplay: streamingAccess?.access.permissions.canReplay || false,
  };
};
