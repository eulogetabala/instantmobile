export interface EventCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  count: number;
}

export interface EventStatus {
  id: 'live' | 'past' | 'upcoming';
  name: string;
  description: string;
  icon: string;
  color: string;
  count: number;
}

export const EVENT_STATUSES: EventStatus[] = [
  {
    id: 'live',
    name: 'En cours',
    description: 'Événements en direct actuellement',
    icon: 'radio',
    color: '#FF4444',
    count: 0
  },
  {
    id: 'past',
    name: 'Passé',
    description: 'Événements terminés',
    icon: 'time',
    color: '#666666',
    count: 0
  },
  {
    id: 'upcoming',
    name: 'À venir',
    description: 'Événements à venir',
    icon: 'calendar',
    color: '#4CAF50',
    count: 0
  }
];

export const EVENT_CATEGORIES: EventCategory[] = [
  {
    id: 'concert',
    name: 'Concert',
    description: 'Concerts et spectacles musicaux',
    icon: 'musical-notes',
    color: '#FF6B35',
    count: 0
  },
  {
    id: 'seminar',
    name: 'Séminaire',
    description: 'Séminaires et formations',
    icon: 'school',
    color: '#2196F3',
    count: 0
  },
  {
    id: 'sport',
    name: 'Sport',
    description: 'Événements sportifs',
    icon: 'football',
    color: '#4CAF50',
    count: 0
  },
  {
    id: 'festival',
    name: 'Festival',
    description: 'Festivals et événements culturels',
    icon: 'star',
    color: '#FF9800',
    count: 0
  },
  {
    id: 'theater',
    name: 'Théâtre',
    description: 'Pièces de théâtre et spectacles',
    icon: 'theater-masks',
    color: '#9C27B0',
    count: 0
  },
  {
    id: 'conference',
    name: 'Conférence',
    description: 'Conférences et colloques',
    icon: 'people',
    color: '#607D8B',
    count: 0
  },
  {
    id: 'workshop',
    name: 'Atelier',
    description: 'Ateliers et formations pratiques',
    icon: 'construct',
    color: '#795548',
    count: 0
  },
  {
    id: 'exhibition',
    name: 'Exposition',
    description: 'Expositions et galeries',
    icon: 'image',
    color: '#E91E63',
    count: 0
  },
  {
    id: 'other',
    name: 'Autre',
    description: 'Autres types d\'événements',
    icon: 'ellipsis-horizontal',
    color: '#9E9E9E',
    count: 0
  }
];

// Fonction pour obtenir les événements par statut
export const getEventsByStatus = async (status: 'live' | 'past' | 'upcoming') => {
  const { eventService } = await import('./index');
  
  switch (status) {
    case 'live':
      return await eventService.getLiveEvents();
    case 'past':
      return await eventService.getPastEvents();
    case 'upcoming':
      return await eventService.getUpcomingEvents();
    default:
      return { success: false, error: { message: 'Statut invalide' } };
  }
};

// Fonction pour obtenir le texte du bouton selon le type d'événement
export const getEventButtonText = (event: any, isAuthenticated: boolean) => {
  if (!isAuthenticated) {
    return 'Se connecter';
  }

  if (event.isFree) {
    return 'Suivre';
  }

  if (event.isLive) {
    return 'Rejoindre le live';
  }

  if (new Date(event.startDate) > new Date()) {
    return 'S\'inscrire';
  }

  return 'Voir détails';
};

// Fonction pour obtenir l'action du bouton selon le type d'événement
export const getEventButtonAction = (event: any, isAuthenticated: boolean) => {
  if (!isAuthenticated) {
    return 'login';
  }

  if (event.isFree) {
    return 'follow';
  }

  if (event.isLive) {
    return 'join_live';
  }

  if (new Date(event.startDate) > new Date()) {
    return 'register';
  }

  return 'view_details';
};
