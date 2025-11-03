import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
    this.api = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor pour ajouter le token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor pour gérer les erreurs et le refresh token
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
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
}

// Instance singleton
export const apiService = new ApiService();

// Export de l'URL de base pour les autres services
export const API_BASE_URL = API_CONFIG.baseURL;

export default apiService;

