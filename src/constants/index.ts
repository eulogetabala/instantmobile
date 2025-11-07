// Constantes de l'application Instant+

export const APP_CONFIG = {
  name: 'Instant+',
  version: '1.0.0',
  description: 'Application de streaming d\'événements au Congo',
  supportEmail: 'support@instantplus.cd',
  website: 'https://instantplus.cd',
};

// Configuration de l'API via variables d'environnement
// Priorité: EXPO_PUBLIC_API_URL > EXPO_PUBLIC_USE_LOCALHOST > valeur par défaut
const getApiBaseURL = (): string => {
  // Si une URL d'API est explicitement définie, l'utiliser
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Sinon, utiliser la logique USE_LOCALHOST
  const useLocalhost = process.env.EXPO_PUBLIC_USE_LOCALHOST === 'true' || 
                       (process.env.EXPO_PUBLIC_USE_LOCALHOST === undefined && true); // Par défaut: true pour dev
  
  if (useLocalhost) {
    // Pour Android emulator: utiliser 10.0.2.2
    // Pour appareil physique: utiliser l'IP locale du Mac/PC
    const localIP = process.env.EXPO_PUBLIC_LOCAL_IP;
    if (localIP) {
      return `http://${localIP}:5001/api`;
    }
    // Par défaut pour développement local
    return 'http://localhost:5001/api';
  }
  
  // URL de production
  return 'https://instant-backend-2m5j.onrender.com/api';
};

export const API_CONFIG = {
  baseURL: getApiBaseURL(),
  timeout: 30000,
  retryAttempts: 3,
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'instant_plus_auth_token',
  REFRESH_TOKEN: 'instant_plus_refresh_token',
  USER_DATA: 'instant_plus_user_data',
  FCM_TOKEN: 'instant_plus_fcm_token',
  LANGUAGE: 'instant_plus_language',
  THEME: 'instant_plus_theme',
  ONBOARDING_COMPLETED: 'instant_plus_onboarding_completed',
  NOTIFICATION_SETTINGS: 'instant_plus_notification_settings',
};

export const EVENT_CATEGORIES = [
  { value: 'concert', label: 'Concert', icon: '🎵' },
  { value: 'seminar', label: 'Séminaire', icon: '🎓' },
  { value: 'sport', label: 'Sport', icon: '⚽' },
  { value: 'festival', label: 'Festival', icon: '🎪' },
  { value: 'theater', label: 'Théâtre', icon: '🎭' },
  { value: 'conference', label: 'Conférence', icon: '💼' },
  { value: 'workshop', label: 'Atelier', icon: '🔧' },
  { value: 'exhibition', label: 'Exposition', icon: '🖼️' },
  { value: 'other', label: 'Autre', icon: '📅' },
] as const;

export const EVENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  LIVE: 'live',
  ENDED: 'ended',
  CANCELLED: 'cancelled',
  POSTPONED: 'postponed',
} as const;

export const PAYMENT_METHODS = [
  { value: 'mtn_momo', label: 'MTN Mobile Money', icon: '📱' },
  { value: 'airtel_money', label: 'Airtel Money', icon: '📱' },
  { value: 'stripe', label: 'Carte Bancaire', icon: '💳' },
  { value: 'paypal', label: 'PayPal', icon: '💰' },
] as const;

export const CURRENCIES = {
  CDF: { symbol: 'FC', name: 'Franc Congolais' },
  USD: { symbol: '$', name: 'Dollar Américain' },
  EUR: { symbol: '€', name: 'Euro' },
} as const;

export const LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ln', name: 'Lingala', flag: '🇨🇩' },
  { code: 'sw', name: 'Swahili', flag: '🇨🇩' },
] as const;

export const PROVINCES_DRC = [
  'Kinshasa',
  'Kongo-Central',
  'Kwango',
  'Kwilu',
  'Mai-Ndombe',
  'Kasaï',
  'Kasaï-Central',
  'Kasaï-Oriental',
  'Lomami',
  'Sankuru',
  'Maniema',
  'Sud-Kivu',
  'Nord-Kivu',
  'Ituri',
  'Haut-Uele',
  'Bas-Uele',
  'Tshopo',
  'Mongala',
  'Nord-Ubangi',
  'Sud-Ubangi',
  'Équateur',
  'Tshuapa',
  'Tanganyika',
  'Haut-Lomami',
  'Lualaba',
  'Haut-Katanga',
] as const;

export const STREAMING_CONFIG = {
  AGORA_APP_ID: process.env.EXPO_PUBLIC_AGORA_APP_ID || '',
  AGORA_APP_CERTIFICATE: process.env.EXPO_PUBLIC_AGORA_APP_CERTIFICATE || '',
  DEFAULT_CHANNEL_PROFILE: 'communication',
  DEFAULT_CLIENT_ROLE: 'audience',
  TOKEN_EXPIRY_TIME: 3600, // 1 heure
};

export const NOTIFICATION_TYPES = {
  EVENT_STARTING: 'event_starting',
  EVENT_STARTED: 'event_started',
  EVENT_ENDING: 'event_ending',
  EVENT_ENDED: 'event_ended',
  TICKET_PURCHASED: 'ticket_purchased',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  NEW_EVENT: 'new_event',
  EVENT_CANCELLED: 'event_cancelled',
  EVENT_POSTPONED: 'event_postponed',
  REPLAY_AVAILABLE: 'replay_available',
} as const;

export const THEME_COLORS = {
  primary: '#0ea5e9',
  secondary: '#d946ef',
  accent: '#f97316',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  background: '#ffffff',
  surface: '#f8fafc',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
} as const;

export const ANIMATION_DURATION = {
  fast: 200,
  normal: 300,
  slow: 500,
} as const;

export const SCREEN_NAMES = {
  // Auth Stack
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
  RESET_PASSWORD: 'ResetPassword',
  
  // Main Tabs
  HOME: 'Home',
  EVENTS: 'Events',
  LIVE: 'Live',
  REPLAYS: 'Replays',
  PROFILE: 'Profile',
  
  // Event Stack
  EVENT_LIST: 'EventList',
  EVENT_DETAILS: 'EventDetails',
  EVENT_SEARCH: 'EventSearch',
  EVENT_FILTERS: 'EventFilters',
  
  // Other Screens
  STREAMING: 'Streaming',
  PAYMENT: 'Payment',
  TICKETS: 'Tickets',
  SETTINGS: 'Settings',
  NOTIFICATIONS: 'Notifications',
} as const;

export const VALIDATION_RULES = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+[1-9]\d{1,14}$/, // Format international E.164
  password: {
    minLength: 6,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
  },
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur de connexion. Vérifiez votre internet.',
  SERVER_ERROR: 'Erreur du serveur. Veuillez réessayer plus tard.',
  AUTH_ERROR: 'Erreur d\'authentification. Veuillez vous reconnecter.',
  VALIDATION_ERROR: 'Veuillez vérifier les informations saisies.',
  PAYMENT_ERROR: 'Erreur de paiement. Veuillez réessayer.',
  STREAMING_ERROR: 'Erreur de streaming. Vérifiez votre connexion.',
  UNKNOWN_ERROR: 'Une erreur inattendue s\'est produite.',
} as const;

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Connexion réussie !',
  REGISTER_SUCCESS: 'Inscription réussie !',
  PAYMENT_SUCCESS: 'Paiement effectué avec succès !',
  TICKET_PURCHASED: 'Billet acheté avec succès !',
  PROFILE_UPDATED: 'Profil mis à jour !',
  PASSWORD_RESET: 'Mot de passe réinitialisé !',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 50,
  LOAD_MORE_THRESHOLD: 0.8,
} as const;

export const CACHE_CONFIG = {
  EVENTS_CACHE_TIME: 5 * 60 * 1000, // 5 minutes
  USER_CACHE_TIME: 10 * 60 * 1000, // 10 minutes
  TICKETS_CACHE_TIME: 2 * 60 * 1000, // 2 minutes
} as const;

