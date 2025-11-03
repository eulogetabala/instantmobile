import { useAuth } from '../contexts/AuthContext';
import { Event } from '../types';
import { useNavigation } from '@react-navigation/native';

export interface EventAccessResult {
  canAccess: boolean;
  requiresAuth: boolean;
  accessType: 'free' | 'paid' | 'featured' | 'live';
  message?: string;
  action?: () => void;
}

export const useEventAccess = () => {
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation();

  const checkEventAccess = (event: Event): EventAccessResult => {
    // Événements gratuits - connexion requise
    if (event.pricing.isFree) {
      if (!isAuthenticated) {
        return {
          canAccess: false,
          requiresAuth: true,
          accessType: 'free',
          message: 'Connexion requise pour accéder aux événements gratuits',
          action: () => navigation.navigate('Auth' as never)
        };
      }
      return {
        canAccess: true,
        requiresAuth: false,
        accessType: 'free'
      };
    }

    // Événements en vedette - connexion requise
    if (event.isFeatured) {
      if (!isAuthenticated) {
        return {
          canAccess: false,
          requiresAuth: true,
          accessType: 'featured',
          message: 'Connexion requise pour accéder aux événements en vedette',
          action: () => navigation.navigate('Auth' as never)
        };
      }
      return {
        canAccess: true,
        requiresAuth: false,
        accessType: 'featured'
      };
    }

    // Événements en direct - connexion requise
    if (event.streaming.isLive) {
      if (!isAuthenticated) {
        return {
          canAccess: false,
          requiresAuth: true,
          accessType: 'live',
          message: 'Connexion requise pour accéder au streaming en direct',
          action: () => navigation.navigate('Auth' as never)
        };
      }
      return {
        canAccess: true,
        requiresAuth: false,
        accessType: 'live'
      };
    }

    // Événements payants - vérifier si l'utilisateur a un billet
    if (!event.pricing.isFree) {
      if (!isAuthenticated) {
        return {
          canAccess: false,
          requiresAuth: true,
          accessType: 'paid',
          message: 'Connexion requise pour acheter un billet',
          action: () => navigation.navigate('Auth' as never)
        };
      }
      
      // TODO: Vérifier si l'utilisateur a un billet valide pour cet événement
      // Pour l'instant, on considère qu'il n'a pas de billet
      return {
        canAccess: false,
        requiresAuth: false,
        accessType: 'paid',
        message: 'Billet requis pour accéder à cet événement',
        action: () => navigation.navigate('Payment' as never, { eventId: event.id, quantity: 1 })
      };
    }

    // Par défaut, accès autorisé
    return {
      canAccess: true,
      requiresAuth: false,
      accessType: 'free'
    };
  };

  const canViewEventDetails = (event: Event): boolean => {
    // Les détails de l'événement sont toujours visibles
    return true;
  };

  const canJoinEvent = (event: Event): boolean => {
    const access = checkEventAccess(event);
    return access.canAccess;
  };

  const getAccessMessage = (event: Event): string | undefined => {
    const access = checkEventAccess(event);
    return access.message;
  };

  const getAccessAction = (event: Event): (() => void) | undefined => {
    const access = checkEventAccess(event);
    return access.action;
  };

  return {
    checkEventAccess,
    canViewEventDetails,
    canJoinEvent,
    getAccessMessage,
    getAccessAction,
    isAuthenticated
  };
};
