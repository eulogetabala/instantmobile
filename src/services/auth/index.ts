import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { apiService } from '../api';
import { STORAGE_KEYS } from '../../constants';
import { User, LoginForm, RegisterForm, AuthState } from '../../types';

// Configuration pour OAuth
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
const FACEBOOK_APP_ID = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;

class AuthService {
  private currentUser: User | null = null;
  private authStateListeners: Array<(state: AuthState) => void> = [];

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      
      if (token && userData) {
        this.currentUser = JSON.parse(userData);
        apiService.setAuthToken(token);
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de l\'auth:', error);
    }
  }

  // Inscription
  async register(userData: RegisterForm): Promise<{ user: User; token: string; refreshToken: string }> {
    try {
      const response = await apiService.post<{
        user: User;
        token: string;
        refreshToken: string;
      }>('/auth/register', userData);

      if (response.success && response.data) {
        await this.setAuthData(response.data);
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de l\'inscription');
      }
    } catch (error) {
      console.error('Erreur inscription:', error);
      throw error;
    }
  }

  // Connexion
  async login(credentials: LoginForm): Promise<{ user: User; token: string; refreshToken: string }> {
    try {
      const response = await apiService.post<{
        user: User;
        token: string;
        refreshToken: string;
      }>('/auth/login', credentials);

      if (response.success && response.data) {
        await this.setAuthData(response.data);
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la connexion');
      }
    } catch (error) {
      console.error('Erreur connexion:', error);
      throw error;
    }
  }

  // Les méthodes OAuth sont maintenant gérées par le hook useClerkOAuth
  // Ces méthodes ont été supprimées pour éviter les conflits avec les données mockées

  // Déconnexion
  async logout(): Promise<void> {
    try {
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      
      if (refreshToken) {
        await apiService.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      await this.clearAuthData();
    }
  }

  // Mot de passe oublié
  async forgotPassword(phone: string): Promise<void> {
    try {
      const response = await apiService.post('/auth/forgot-password', { phone });
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Erreur lors de la demande de reset');
      }
    } catch (error) {
      console.error('Erreur mot de passe oublié:', error);
      throw error;
    }
  }

  // Mettre à jour le profil
  async updateProfile(profileData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    dateOfBirth?: string;
    gender?: string;
    location?: string;
    avatar?: string;
  }): Promise<User> {
    try {
      const response = await apiService.put('/users/me', profileData);
      
      if (response.success && response.data) {
        return response.data.user;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la mise à jour du profil');
      }
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      throw error;
    }
  }

  // Réinitialisation du mot de passe
  async resetPassword(token: string, password: string): Promise<void> {
    try {
      const response = await apiService.post('/auth/reset-password', { token, password });
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Erreur lors de la réinitialisation');
      }
    } catch (error) {
      console.error('Erreur réinitialisation mot de passe:', error);
      throw error;
    }
  }

  // Rafraîchir le token
  async refreshToken(): Promise<string> {
    try {
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      
      if (!refreshToken) {
        throw new Error('Aucun refresh token disponible');
      }

      const response = await apiService.post<{ token: string }>('/auth/refresh', { refreshToken });
      
      if (response.success && response.data) {
        await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
        apiService.setAuthToken(response.data.token);
        return response.data.token;
      } else {
        throw new Error(response.error?.message || 'Erreur lors du rafraîchissement');
      }
    } catch (error) {
      console.error('Erreur refresh token:', error);
      await this.clearAuthData();
      throw error;
    }
  }

  // Obtenir l'utilisateur actuel
  async getCurrentUser(): Promise<User | null> {
    try {
      if (this.currentUser) {
        return this.currentUser;
      }

      // Vérifier qu'on a un token avant de faire la requête
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) {
        return null;
      }

      const response = await apiService.get<{ user: User }>('/auth/me');
      
      if (response.success && response.data) {
        this.currentUser = response.data.user;
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(this.currentUser));
        return this.currentUser;
      } else {
        return null;
      }
    } catch (error: any) {
      // Ne pas logger les erreurs 401 comme des erreurs critiques (utilisateur simplement non connecté)
      if (error?.response?.status === 401) {
        // Utilisateur non authentifié, c'est normal
        return null;
      }
      console.error('Erreur getCurrentUser:', error);
      return null;
    }
  }

  // Mettre à jour le profil
  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      const response = await apiService.put<{ user: User }>('/users/profile', userData);
      
      if (response.success && response.data) {
        this.currentUser = response.data.user;
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(this.currentUser));
        this.notifyListeners();
        return this.currentUser;
      } else {
        throw new Error(response.error?.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur updateProfile:', error);
      throw error;
    }
  }

  // Changer le mot de passe
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const response = await apiService.put('/users/change-password', {
        currentPassword,
        newPassword,
      });
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Erreur lors du changement de mot de passe');
      }
    } catch (error) {
      console.error('Erreur changePassword:', error);
      throw error;
    }
  }

  // Vérifier si l'utilisateur est connecté
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      return !!token;
    } catch (error) {
      return false;
    }
  }

  // Obtenir l'état d'authentification
  getAuthState(): AuthState {
    return {
      user: this.currentUser,
      token: null, // Ne pas exposer le token
      refreshToken: null, // Ne pas exposer le refresh token
      isAuthenticated: !!this.currentUser,
      isLoading: false,
      error: null,
    };
  }

  // Écouter les changements d'état
  addAuthStateListener(listener: (state: AuthState) => void): () => void {
    this.authStateListeners.push(listener);
    
    // Retourner une fonction pour supprimer l'écouteur
    return () => {
      const index = this.authStateListeners.indexOf(listener);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  // Notifier les écouteurs
  private notifyListeners() {
    const state = this.getAuthState();
    this.authStateListeners.forEach(listener => listener(state));
  }

  // Sauvegarder les données d'authentification
  private async getClerkUserData(sessionId: string): Promise<any> {
    try {
      // Cette méthode devrait récupérer les données utilisateur depuis Clerk
      // Pour l'instant, on retourne null car on n'a pas accès direct aux hooks Clerk ici
      // Dans une vraie implémentation, on utiliserait useUser() ou une API Clerk
      return null;
    } catch (error) {
      console.error('Erreur récupération données Clerk:', error);
      return null;
    }
  }

  async setAuthData(data: { user: User; token: string; refreshToken: string }): Promise<void> {
    try {
      await Promise.all([
        SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, data.token),
        SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken),
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.user)),
      ]);

      this.currentUser = data.user;
      apiService.setAuthToken(data.token);
      this.notifyListeners();
    } catch (error) {
      console.error('Erreur setAuthData:', error);
      throw error;
    }
  }

  // Supprimer les données d'authentification
  private async clearAuthData(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN),
        SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
      ]);

      this.currentUser = null;
      apiService.removeAuthToken();
      this.notifyListeners();
    } catch (error) {
      console.error('Erreur clearAuthData:', error);
    }
  }
}

// Instance singleton
export const authService = new AuthService();
export default authService;

