import { useState, useEffect, useCallback } from 'react';
import { historyService, UserHistory, UserStats, HistoryFilters } from '../services/history';
import { useAuth } from '../contexts/AuthContext';

export const useUserHistory = () => {
  const { isAuthenticated } = useAuth();
  const [history, setHistory] = useState<UserHistory[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
  });

  // Charger l'historique
  const loadHistory = useCallback(async (
    page: number = 1,
    filters?: HistoryFilters
  ) => {
    if (!isAuthenticated) {
      setHistory([]);
      setStats(null);
      setPagination({ current: 1, pages: 1, total: 0 });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await historyService.getUserHistory(page, 20, filters);
      setHistory(response.history);
      setStats(response.stats);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Erreur lors du chargement de l\'historique:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Charger les statistiques
  const loadStats = useCallback(async () => {
    if (!isAuthenticated) {
      setStats(null);
      return;
    }

    try {
      const userStats = await historyService.getUserStats();
      setStats(userStats);
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
    }
  }, [isAuthenticated]);

  // Enregistrer la visualisation d'un événement
  const recordEventView = useCallback(async (
    eventId: string,
    eventTitle: string,
    eventCategory: string,
    eventImage?: string
  ) => {
    if (!isAuthenticated) return;

    try {
      await historyService.recordEventView(eventId, eventTitle, eventCategory, eventImage);
      // Recharger les statistiques pour mettre à jour les compteurs
      await loadStats();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement de la visualisation:', err);
    }
  }, [isAuthenticated, loadStats]);

  // Enregistrer l'achat d'un événement
  const recordEventPurchase = useCallback(async (
    eventId: string,
    eventTitle: string,
    eventCategory: string,
    purchaseAmount: number,
    ticketQuantity: number,
    eventImage?: string
  ) => {
    if (!isAuthenticated) return;

    try {
      await historyService.recordEventPurchase(
        eventId,
        eventTitle,
        eventCategory,
        purchaseAmount,
        ticketQuantity,
        eventImage
      );
      // Recharger les statistiques pour mettre à jour les compteurs
      await loadStats();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement de l\'achat:', err);
    }
  }, [isAuthenticated, loadStats]);

  // Enregistrer le visionnage d'un streaming
  const recordStreamingWatch = useCallback(async (
    eventId: string,
    eventTitle: string,
    duration: number,
    watchProgress: number
  ) => {
    if (!isAuthenticated) return;

    try {
      await historyService.recordStreamingWatch(eventId, eventTitle, duration, watchProgress);
      // Recharger les statistiques pour mettre à jour les compteurs
      await loadStats();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement du visionnage:', err);
    }
  }, [isAuthenticated, loadStats]);

  // Enregistrer le visionnage d'un replay
  const recordReplayWatch = useCallback(async (
    eventId: string,
    eventTitle: string,
    duration: number,
    watchProgress: number
  ) => {
    if (!isAuthenticated) return;

    try {
      await historyService.recordReplayWatch(eventId, eventTitle, duration, watchProgress);
      // Recharger les statistiques pour mettre à jour les compteurs
      await loadStats();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement du replay:', err);
    }
  }, [isAuthenticated, loadStats]);

  // Enregistrer l'ajout d'un favori
  const recordFavoriteAdd = useCallback(async (
    eventId: string,
    eventTitle: string,
    eventCategory: string
  ) => {
    if (!isAuthenticated) return;

    try {
      await historyService.recordFavoriteAdd(eventId, eventTitle, eventCategory);
      // Recharger les statistiques pour mettre à jour les compteurs
      await loadStats();
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement du favori:', err);
    }
  }, [isAuthenticated, loadStats]);

  // Enregistrer une recherche
  const recordSearch = useCallback(async (searchQuery: string, resultsCount: number) => {
    if (!isAuthenticated) return;

    try {
      await historyService.recordSearch(searchQuery, resultsCount);
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement de la recherche:', err);
    }
  }, [isAuthenticated]);

  // Supprimer une entrée de l'historique
  const deleteHistoryEntry = useCallback(async (historyId: string) => {
    if (!isAuthenticated) return;

    try {
      await historyService.deleteHistoryEntry(historyId);
      setHistory(prev => prev.filter(entry => entry.id !== historyId));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
      // Recharger les statistiques
      await loadStats();
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      throw err;
    }
  }, [isAuthenticated, loadStats]);

  // Vider l'historique
  const clearHistory = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      await historyService.clearHistory();
      setHistory([]);
      setPagination({ current: 1, pages: 1, total: 0 });
      // Recharger les statistiques
      await loadStats();
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'historique:', err);
      throw err;
    }
  }, [isAuthenticated, loadStats]);

  // Exporter l'historique
  const exportHistory = useCallback(async (format: 'json' | 'csv' = 'json') => {
    if (!isAuthenticated) return;

    try {
      return await historyService.exportHistory(format);
    } catch (err) {
      console.error('Erreur lors de l\'export:', err);
      throw err;
    }
  }, [isAuthenticated]);

  // Charger les données au montage du composant
  useEffect(() => {
    if (isAuthenticated) {
      loadHistory();
      loadStats();
    } else {
      setHistory([]);
      setStats(null);
      setPagination({ current: 1, pages: 1, total: 0 });
    }
  }, [isAuthenticated, loadHistory, loadStats]);

  return {
    history,
    stats,
    pagination,
    loading,
    error,
    loadHistory,
    loadStats,
    recordEventView,
    recordEventPurchase,
    recordStreamingWatch,
    recordReplayWatch,
    recordFavoriteAdd,
    recordSearch,
    deleteHistoryEntry,
    clearHistory,
    exportHistory,
  };
};
