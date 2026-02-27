import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import { API_CONFIG, STORAGE_KEYS } from '../../constants';
import { ApiResponse } from '../../types';

class ApiService {
  private api: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  constructor() {
    console.log('🔧 ApiService - Initialisation avec baseURL:', API_CONFIG.baseURL);
    
    this.api = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
    
    // Tester la connexion au démarrage et détecter automatiquement le backend
    // IMPORTANT: Toujours essayer de détecter le backend, même si le test initial réussit
    // car localhost peut fonctionner en test mais pas pour les images
    this.testConnection().then(async (result) => {
      // Si le backend actuel est localhost et qu'on est sur un appareil physique,
      // essayer de trouver une meilleure URL
      const isLocalhost = API_CONFIG.baseURL.includes('localhost');
      const shouldFindBetterBackend = isLocalhost && Platform.OS !== 'web';
      
      if (!result.success || shouldFindBetterBackend) {
        if (!result.success) {
          console.warn('⚠️ Backend non accessible au démarrage:', result.error);
        } else if (shouldFindBetterBackend) {
          console.warn('⚠️ Backend localhost détecté, recherche d\'une meilleure URL pour les images...');
        }
        
        console.log('💡 Tentative de recherche automatique du backend (local puis Render)...');
        
        // Essayer de trouver un backend accessible (local ou Render)
        const workingBackend = await this.findWorkingBackend();
        if (workingBackend && workingBackend !== API_CONFIG.baseURL) {
          console.log('✅ Backend trouvé automatiquement:', workingBackend);
          console.log('🔄 Mise à jour de l\'URL de base:', API_CONFIG.baseURL, '→', workingBackend);
          this.setBaseURL(workingBackend);
          console.log('🔄 L\'app utilisera maintenant cette URL pour toutes les requêtes');
          
          // Tester à nouveau avec le nouveau backend
          const retestResult = await this.testConnection();
          if (retestResult.success) {
            console.log('✅ Connexion confirmée avec le nouveau backend');
          }
        } else if (workingBackend) {
          console.log('✅ Backend déjà correct:', workingBackend);
        } else {
          console.log('💡 Suggestions:');
          if (__DEV__) {
            console.log('   1. Vérifiez que le backend local est démarré (npm start dans backend/)');
            console.log('   2. Vérifiez l\'IP affichée au démarrage du backend');
            console.log('   3. Définissez: export EXPO_PUBLIC_LOCAL_IP=votre_ip');
            console.log('   4. Ou définissez: export EXPO_PUBLIC_API_URL=http://votre_ip:5001/api');
            console.log('   5. L\'app utilisera Render (https://instant-backend-1.onrender.com) comme fallback');
          } else {
            console.log('   1. Vérifiez votre connexion internet');
            console.log('   2. Vérifiez que Render est accessible: https://instant-backend-1.onrender.com/health');
          }
        }
      } else {
        console.log('✅ Backend accessible:', API_CONFIG.baseURL);
      }
    }).catch((error) => {
      console.error('❌ Erreur lors du test de connexion:', error);
      // En cas d'erreur, essayer quand même de trouver un backend
      this.findWorkingBackend();
    });
  }

  private setupInterceptors() {
    // Request interceptor pour ajouter le token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Log pour déboguer
        if (__DEV__) {
          console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
            baseURL: config.baseURL,
            hasToken: !!token,
          });
        }
        
        return config;
      },
      (error) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor pour gérer les erreurs et le refresh token
    this.api.interceptors.response.use(
      (response) => {
        if (__DEV__) {
          console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            status: response.status,
          });
        }
        return response;
      },
      async (error) => {
        // Log détaillé des erreurs réseau
        const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
        const isNetworkError = error.code === 'NETWORK_ERROR' || error.message === 'Network Error' || !error.response;
        
        if (isTimeout) {
          console.error('⏱️ Timeout Error:', {
            message: error.message,
            code: error.code,
            baseURL: this.api.defaults.baseURL,
            url: error.config?.url,
            fullUrl: error.config ? `${this.api.defaults.baseURL}${error.config.url}` : 'N/A',
            suggestion: 'Vérifiez que le backend est démarré et accessible',
          });
        } else if (isNetworkError) {
          console.error('🌐 Network Error:', {
            message: error.message,
            code: error.code,
            baseURL: this.api.defaults.baseURL,
            url: error.config?.url,
            fullUrl: error.config ? `${this.api.defaults.baseURL}${error.config.url}` : 'N/A',
            suggestion: 'Vérifiez votre connexion réseau et que le backend est accessible',
          });
        } else {
          // Ne pas logger les erreurs 401 comme des erreurs critiques
          // C'est normal si l'utilisateur n'est pas connecté
          const isUnauthorized = error.response?.status === 401;
          
          if (isUnauthorized) {
            // Logger seulement en mode debug pour les erreurs 401
            if (__DEV__) {
              console.log('ℹ️ API 401 (Non authentifié):', {
                url: error.config?.url,
                message: 'Utilisateur non authentifié - c\'est normal si vous n\'êtes pas connecté',
              });
            }
          } else {
            console.error('❌ API Error:', {
              message: error.message,
              status: error.response?.status,
              statusText: error.response?.statusText,
              url: error.config?.url,
              baseURL: this.api.defaults.baseURL,
            });
          }
        }
        
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Si on est déjà en train de rafraîchir, on met en queue
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.api(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              const newToken = response.data.token;
              
              await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newToken);
              
              // Traiter la queue des requêtes en attente
              this.processQueue(null, newToken);
              
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.api(originalRequest);
            } else {
              // Pas de refresh token, déconnexion
              await this.logout();
              this.processQueue(new Error('No refresh token'), null);
              return Promise.reject(error);
            }
          } catch (refreshError) {
            await this.logout();
            this.processQueue(refreshError, null);
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: any, token: string | null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  private async refreshToken(refreshToken: string): Promise<AxiosResponse<ApiResponse<{ token: string }>>> {
    return this.api.post('/auth/refresh', { refreshToken });
  }

  private async logout() {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER_DATA,
    ]);
  }

  // Méthodes génériques
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.api.get(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.api.post(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.api.put(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.api.patch(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.api.delete(url, config);
    return response.data;
  }

  // Méthodes pour l'upload de fichiers
  async uploadFile<T = any>(
    url: string, 
    file: any, 
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  // Méthodes pour les requêtes avec retry
  async getWithRetry<T = any>(
    url: string, 
    config?: AxiosRequestConfig, 
    retries = API_CONFIG.retryAttempts
  ): Promise<ApiResponse<T>> {
    try {
      return await this.get<T>(url, config);
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.getWithRetry<T>(url, config, retries - 1);
      }
      throw error;
    }
  }

  async postWithRetry<T = any>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig, 
    retries = API_CONFIG.retryAttempts
  ): Promise<ApiResponse<T>> {
    try {
      return await this.post<T>(url, data, config);
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.postWithRetry<T>(url, data, config, retries - 1);
      }
      throw error;
    }
  }

  // Méthodes utilitaires
  setBaseURL(baseURL: string) {
    this.api.defaults.baseURL = baseURL;
  }

  setAuthToken(token: string) {
    this.api.defaults.headers.Authorization = `Bearer ${token}`;
  }

  removeAuthToken() {
    delete this.api.defaults.headers.Authorization;
  }

  getInstance(): AxiosInstance {
    return this.api;
  }

  // Tester la connexion au backend
  async testConnection(): Promise<{
    success: boolean;
    reachable: boolean;
    responseTime?: number;
    error?: string;
    details?: any;
  }> {
    const baseURL = this.api.defaults.baseURL || API_CONFIG.baseURL;
    const startTime = Date.now();
    
    try {
      // Vérifier d'abord la connectivité réseau générale
      const netInfo = await NetInfo.fetch();
      console.log('📡 État réseau:', {
        isConnected: netInfo.isConnected,
        type: netInfo.type,
        isInternetReachable: netInfo.isInternetReachable,
      });

      if (!netInfo.isConnected) {
        return {
          success: false,
          reachable: false,
          error: 'Aucune connexion réseau détectée',
          details: { netInfo },
        };
      }

      // Tester la connexion au backend avec un endpoint simple
      // Gérer les cas où baseURL se termine par /api ou non
      let baseUrl = baseURL;
      if (baseUrl.endsWith('/api')) {
        baseUrl = baseUrl.replace('/api', '');
      }
      // Pour Render, utiliser /api/health, pour local utiliser /health
      const healthUrl = baseURL.includes('onrender.com') 
        ? `${baseURL}/health` 
        : `${baseUrl}/health`;
      console.log('🔍 Test de connexion vers:', healthUrl);
      
      const response = await axios.get(healthUrl, {
        timeout: 5000, // Timeout court pour le test
        validateStatus: (status) => status < 500, // Accepter les codes < 500
      });

      const responseTime = Date.now() - startTime;

      if (response.status === 200) {
        console.log('✅ Backend accessible:', {
          url: healthUrl,
          responseTime: `${responseTime}ms`,
          status: response.status,
        });
        return {
          success: true,
          reachable: true,
          responseTime,
          details: response.data,
        };
      } else {
        console.warn('⚠️ Backend répond mais avec un statut inattendu:', response.status);
        return {
          success: false,
          reachable: true, // Le serveur répond
          responseTime,
          error: `Statut HTTP: ${response.status}`,
          details: response.data,
        };
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.error('⏱️ Timeout lors du test de connexion:', {
          url: baseURL,
          responseTime: `${responseTime}ms`,
        });
        return {
          success: false,
          reachable: false,
          responseTime,
          error: 'Timeout: Le backend ne répond pas dans les délais',
          details: { code: error.code, message: error.message },
        };
      } else if (error.code === 'ERR_NETWORK' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        console.error('🌐 Erreur réseau lors du test:', {
          url: baseURL,
          code: error.code,
          message: error.message,
        });
        return {
          success: false,
          reachable: false,
          responseTime,
          error: `Erreur réseau: ${error.message || error.code}`,
          details: { code: error.code, message: error.message },
        };
      } else {
        console.error('❌ Erreur inattendue lors du test:', error);
        return {
          success: false,
          reachable: false,
          responseTime,
          error: error.message || 'Erreur inconnue',
          details: error,
        };
      }
    }
  }

  // Tester plusieurs URLs possibles pour trouver celle qui fonctionne
  async findWorkingBackend(): Promise<string | null> {
    const RENDER_BACKEND_URL = 'https://instant-backend-1.onrender.com/api';
    const LOCAL_BACKEND_PORT = 5001;
    
    // Liste des IPs locales possibles à tester (les plus récentes en premier)
    const possibleIPs = ['192.168.1.119', '192.168.1.93', '192.168.1.96', '192.168.1.103', '192.168.1.105', '192.168.1.88'];
    
    const possibleUrls: string[] = [];

    // En développement, essayer local d'abord, puis Render
    // En production, essayer Render d'abord
    if (__DEV__) {
      // 1. URL configurée actuellement (priorité)
      if (API_CONFIG.baseURL && !API_CONFIG.baseURL.includes('onrender.com')) {
        possibleUrls.push(API_CONFIG.baseURL);
      }

      // 2. IP locale si définie (priorité élevée)
      const localIP = process.env.EXPO_PUBLIC_LOCAL_IP;
      if (localIP) {
        possibleUrls.push(`http://${localIP}:${LOCAL_BACKEND_PORT}/api`);
      }

      // 3. Toutes les IPs locales possibles
      possibleIPs.forEach(ip => {
        const url = `http://${ip}:${LOCAL_BACKEND_PORT}/api`;
        if (!possibleUrls.includes(url)) {
          possibleUrls.push(url);
        }
      });

      // 4. URLs spéciales pour les émulateurs
      possibleUrls.push('http://localhost:5001/api');
      possibleUrls.push('http://10.0.2.2:5001/api'); // Android emulator

      // 5. Render en dernier recours (fallback)
      possibleUrls.push(RENDER_BACKEND_URL);
    } else {
      // En production, Render en priorité
      possibleUrls.push(RENDER_BACKEND_URL);
      
      // Puis essayer les IPs locales (au cas où)
      possibleIPs.forEach(ip => {
        const url = `http://${ip}:${LOCAL_BACKEND_PORT}/api`;
        if (!possibleUrls.includes(url)) {
          possibleUrls.push(url);
        }
      });
    }

    console.log('🔍 Recherche d\'un backend accessible parmi:', possibleUrls);

    for (const url of possibleUrls) {
      try {
        // Pour Render, tester /api/health, pour local tester /health
        const healthUrl = url.includes('onrender.com') 
          ? `${url}/health` 
          : url.replace('/api', '') + '/health';
        
        const response = await axios.get(healthUrl, {
          timeout: 5000, // 5 secondes pour les connexions lentes
        });

        if (response.status === 200) {
          console.log('✅ Backend trouvé:', url);
          // Mettre à jour l'URL de base si on trouve un backend différent
          if (url !== API_CONFIG.baseURL) {
            console.log('🔄 Mise à jour de l\'URL de base:', API_CONFIG.baseURL, '→', url);
            this.setBaseURL(url);
          }
          return url;
        }
      } catch (error: any) {
        // Log silencieux pour ne pas polluer la console
        if (__DEV__) {
          console.log(`❌ Backend non accessible: ${url} (${error.message || 'timeout'})`);
        }
        continue;
      }
    }

    // Si aucun backend local n'est trouvé, utiliser Render comme fallback
    console.warn('⚠️ Aucun backend local accessible, utilisation de Render comme fallback');
    console.log('🔄 Mise à jour de l\'URL de base vers Render:', RENDER_BACKEND_URL);
    this.setBaseURL(RENDER_BACKEND_URL);
    return RENDER_BACKEND_URL;
  }
}

// Instance singleton
export const apiService = new ApiService();

// Export de l'URL de base pour les autres services
export const API_BASE_URL = API_CONFIG.baseURL;

export default apiService;

