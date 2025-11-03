import { useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';

export interface NetworkQuality {
  quality: 'auto' | '1080p' | '720p' | '480p' | '360p';
  bitrate: number;
  isConnected: boolean;
  connectionType: string | null;
  speed: 'slow' | 'medium' | 'fast' | 'unknown';
}

export const useNetworkQuality = () => {
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>({
    quality: 'auto',
    bitrate: 2000,
    isConnected: true,
    connectionType: null,
    speed: 'unknown',
  });

  const [isLoading, setIsLoading] = useState(false);

  // Détecter la qualité basée sur la connexion
  const detectQuality = useCallback((connectionType: string | null, isConnected: boolean): NetworkQuality => {
    if (!isConnected) {
      return {
        quality: '360p',
        bitrate: 500,
        isConnected: false,
        connectionType,
        speed: 'slow',
      };
    }

    switch (connectionType) {
      case 'wifi':
        return {
          quality: '1080p',
          bitrate: 5000,
          isConnected: true,
          connectionType,
          speed: 'fast',
        };
      case 'cellular':
        // Pour la 4G/5G, on peut supporter 720p
        return {
          quality: '720p',
          bitrate: 2500,
          isConnected: true,
          connectionType,
          speed: 'medium',
        };
      case 'ethernet':
        return {
          quality: '1080p',
          bitrate: 8000,
          isConnected: true,
          connectionType,
          speed: 'fast',
        };
      default:
        // Connexion inconnue, qualité conservatrice
        return {
          quality: '480p',
          bitrate: 1500,
          isConnected: true,
          connectionType,
          speed: 'medium',
        };
    }
  }, []);

  // Tester la vitesse de connexion
  const testConnectionSpeed = useCallback(async (): Promise<number> => {
    const startTime = Date.now();
    
    try {
      // Test simple avec une petite requête
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Estimation basée sur le temps de réponse
      if (duration < 200) return 5000; // Très rapide
      if (duration < 500) return 2500; // Rapide
      if (duration < 1000) return 1500; // Moyen
      return 800; // Lent
    } catch (error) {
      console.warn('Test de vitesse échoué:', error);
      return 800; // Valeur par défaut conservatrice
    }
  }, []);

  // Mettre à jour la qualité basée sur le test de vitesse
  const updateQualityFromSpeed = useCallback(async (bitrate: number) => {
    let quality: NetworkQuality['quality'];
    
    if (bitrate >= 4000) {
      quality = '1080p';
    } else if (bitrate >= 2000) {
      quality = '720p';
    } else if (bitrate >= 1000) {
      quality = '480p';
    } else {
      quality = '360p';
    }

    setNetworkQuality(prev => ({
      ...prev,
      quality,
      bitrate,
    }));
  }, []);

  // Surveiller les changements de réseau
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const newQuality = detectQuality(state.type, state.isConnected ?? false);
      setNetworkQuality(newQuality);
    });

    return unsubscribe;
  }, [detectQuality]);

  // Tester la vitesse au démarrage et périodiquement
  useEffect(() => {
    const testSpeed = async () => {
      if (!networkQuality.isConnected) return;
      
      setIsLoading(true);
      try {
        const bitrate = await testConnectionSpeed();
        await updateQualityFromSpeed(bitrate);
      } catch (error) {
        console.warn('Erreur test vitesse:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Test initial
    testSpeed();

    // Test périodique toutes les 30 secondes
    const interval = setInterval(testSpeed, 30000);

    return () => clearInterval(interval);
  }, [networkQuality.isConnected, testConnectionSpeed, updateQualityFromSpeed]);

  // Fonction pour forcer un test de qualité
  const refreshQuality = useCallback(async () => {
    setIsLoading(true);
    try {
      const bitrate = await testConnectionSpeed();
      await updateQualityFromSpeed(bitrate);
    } catch (error) {
      console.warn('Erreur refresh qualité:', error);
    } finally {
      setIsLoading(false);
    }
  }, [testConnectionSpeed, updateQualityFromSpeed]);

  // Fonction pour définir manuellement la qualité
  const setQuality = useCallback((quality: NetworkQuality['quality']) => {
    const bitrateMap = {
      'auto': networkQuality.bitrate,
      '1080p': 5000,
      '720p': 2500,
      '480p': 1500,
      '360p': 800,
    };

    setNetworkQuality(prev => ({
      ...prev,
      quality,
      bitrate: bitrateMap[quality],
    }));
  }, [networkQuality.bitrate]);

  return {
    networkQuality,
    isLoading,
    refreshQuality,
    setQuality,
  };
};
