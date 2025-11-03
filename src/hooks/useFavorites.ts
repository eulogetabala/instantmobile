import { useState, useEffect, useCallback } from 'react';
import { favoriteService, FavoriteEvent } from '../services/favorites';
import { useAuth } from '../contexts/AuthContext';

export const useFavorites = () => {
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les favoris
  const loadFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavorites([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await favoriteService.getUserFavorites(1, 50);
      setFavorites(response.favorites);
    } catch (err) {
      console.error('Erreur lors du chargement des favoris:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Ajouter aux favoris
  const addToFavorites = useCallback(async (eventId: string) => {
    if (!isAuthenticated) {
      throw new Error('Vous devez être connecté pour ajouter aux favoris');
    }

    try {
      const newFavorite = await favoriteService.addToFavorites(eventId);
      setFavorites(prev => [newFavorite, ...prev]);
      return true;
    } catch (err) {
      console.error('Erreur lors de l\'ajout aux favoris:', err);
      throw err;
    }
  }, [isAuthenticated]);

  // Supprimer des favoris
  const removeFromFavorites = useCallback(async (eventId: string) => {
    if (!isAuthenticated) {
      throw new Error('Vous devez être connecté pour supprimer des favoris');
    }

    try {
      await favoriteService.removeFromFavorites(eventId);
      setFavorites(prev => prev.filter(fav => fav.eventId !== eventId));
      return true;
    } catch (err) {
      console.error('Erreur lors de la suppression des favoris:', err);
      throw err;
    }
  }, [isAuthenticated]);

  // Toggle favori
  const toggleFavorite = useCallback(async (eventId: string) => {
    if (!isAuthenticated) {
      throw new Error('Vous devez être connecté pour gérer les favoris');
    }

    try {
      const isNowFavorite = await favoriteService.toggleFavorite(eventId);
      
      if (isNowFavorite) {
        // L'événement a été ajouté aux favoris
        const response = await favoriteService.getUserFavorites(1, 1);
        if (response.favorites.length > 0) {
          setFavorites(prev => [response.favorites[0], ...prev]);
        }
      } else {
        // L'événement a été supprimé des favoris
        setFavorites(prev => prev.filter(fav => fav.eventId !== eventId));
      }
      
      return isNowFavorite;
    } catch (err) {
      console.error('Erreur lors du toggle favori:', err);
      throw err;
    }
  }, [isAuthenticated]);

  // Vérifier si un événement est en favori
  const isEventFavorite = useCallback((eventId: string): boolean => {
    return favorites.some(fav => fav.eventId === eventId);
  }, [favorites]);

  // Charger les favoris au montage du composant
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return {
    favorites,
    loading,
    error,
    loadFavorites,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isEventFavorite,
  };
};
