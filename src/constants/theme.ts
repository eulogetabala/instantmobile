import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Couleurs principales selon la charte graphique
export const brandColors = {
  primary: '#FF6600',      // Orange principal
  white: '#FFFFFF',        // Blanc
  lightGray: '#F5F5F5',    // Gris clair pour les fonds neutres
  darkGray: '#333333',     // Gris foncé pour le texte
  mediumGray: '#666666',   // Gris moyen pour le texte secondaire
  lightOrange: '#FFF4F0',  // Orange très clair pour les fonds
  success: '#22C55E',      // Vert pour les succès
  error: '#EF4444',        // Rouge pour les erreurs
  warning: '#F59E0B',      // Orange pour les avertissements
  info: '#3B82F6',         // Bleu pour les informations
};

// Thème clair avec la nouvelle identité visuelle
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: brandColors.primary,
    secondary: brandColors.darkGray,
    tertiary: brandColors.mediumGray,
    surface: brandColors.white,
    background: brandColors.lightGray,
    error: brandColors.error,
    onPrimary: brandColors.white,
    onSecondary: brandColors.white,
    onSurface: brandColors.darkGray,
    onBackground: brandColors.darkGray,
    onError: brandColors.white,
    outline: '#E5E5E5',
    surfaceVariant: brandColors.lightOrange,
    onSurfaceVariant: brandColors.mediumGray,
  },
};

// Thème sombre
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: brandColors.primary,
    secondary: brandColors.white,
    tertiary: brandColors.mediumGray,
    surface: '#1a1a1a',
    background: '#0f0f0f',
    error: brandColors.error,
    onPrimary: brandColors.white,
    onSecondary: brandColors.darkGray,
    onSurface: brandColors.white,
    onBackground: brandColors.white,
    onError: brandColors.white,
    outline: '#333333',
    surfaceVariant: '#2a2a2a',
    onSurfaceVariant: brandColors.mediumGray,
  },
};

// Thème par défaut (clair)
export const theme = lightTheme;

// Typographie Montserrat
export const typography = {
  fontFamily: {
    regular: 'Montserrat_400Regular',
    medium: 'Montserrat_500Medium',
    semiBold: 'Montserrat_600SemiBold',
    bold: 'Montserrat_700Bold',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
};

// Couleurs personnalisées pour l'application
export const appColors = {
  // Couleurs principales selon la charte
  primary: brandColors.primary,
  white: brandColors.white,
  lightGray: brandColors.lightGray,
  darkGray: brandColors.darkGray,
  mediumGray: brandColors.mediumGray,
  lightOrange: brandColors.lightOrange,
  
  // Couleurs de statut
  success: brandColors.success,
  error: brandColors.error,
  warning: brandColors.warning,
  info: brandColors.info,
  
  // Couleurs spéciales pour les événements
  live: '#EF4444', // Rouge pour les événements en direct
  featured: '#F59E0B', // Orange pour les événements en vedette
  free: '#22C55E', // Vert pour les événements gratuits
  premium: '#8B5CF6', // Violet pour les événements premium
  
  // Gradients
  primaryGradient: [brandColors.primary, brandColors.white],
  lightGradient: [brandColors.lightOrange, brandColors.white],
};

// Espacements
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Tailles de police
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

// Rayons de bordure (coins arrondis selon le design)
export const borderRadius = {
  none: 0,
  sm: 6,
  base: 12,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  full: 9999,
};

// Ombres subtiles et modernes
export const shadows = {
  sm: {
    shadowColor: brandColors.darkGray,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  base: {
    shadowColor: brandColors.darkGray,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  md: {
    shadowColor: brandColors.darkGray,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: brandColors.darkGray,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: brandColors.darkGray,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  // Ombre spéciale pour les boutons
  button: {
    shadowColor: brandColors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
};

// Durées d'animation
export const animationDuration = {
  fast: 200,
  normal: 300,
  slow: 500,
};

// Z-index
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};

