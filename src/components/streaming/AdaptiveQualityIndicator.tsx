import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NetworkQuality } from '../../hooks/useNetworkQuality';

interface AdaptiveQualityIndicatorProps {
  networkQuality: NetworkQuality;
  isLoading: boolean;
  onRefresh: () => void;
  onQualityPress?: () => void;
}

export const AdaptiveQualityIndicator: React.FC<AdaptiveQualityIndicatorProps> = ({
  networkQuality,
  isLoading,
  onRefresh,
  onQualityPress,
}) => {
  const getQualityColor = (quality: NetworkQuality['quality']) => {
    switch (quality) {
      case '1080p':
        return '#4CAF50'; // Vert
      case '720p':
        return '#FF9800'; // Orange
      case '480p':
        return '#FF5722'; // Rouge-orange
      case '360p':
        return '#F44336'; // Rouge
      default:
        return '#9E9E9E'; // Gris
    }
  };

  const getQualityIcon = (quality: NetworkQuality['quality']) => {
    switch (quality) {
      case '1080p':
        return 'wifi';
      case '720p':
        return 'cellular';
      case '480p':
        return 'cellular-outline';
      case '360p':
        return 'warning';
      default:
        return 'help-circle';
    }
  };

  const getConnectionStatus = () => {
    if (!networkQuality.isConnected) {
      return { text: 'Hors ligne', color: '#F44336' };
    }

    switch (networkQuality.connectionType) {
      case 'wifi':
        return { text: 'WiFi', color: '#4CAF50' };
      case 'cellular':
        return { text: 'Données mobiles', color: '#FF9800' };
      case 'ethernet':
        return { text: 'Ethernet', color: '#2196F3' };
      default:
        return { text: 'Connexion', color: '#9E9E9E' };
    }
  };

  const connectionStatus = getConnectionStatus();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.qualityButton}
        onPress={onQualityPress}
        activeOpacity={0.7}
      >
        <View style={styles.qualityInfo}>
          <Ionicons
            name={getQualityIcon(networkQuality.quality)}
            size={16}
            color={getQualityColor(networkQuality.quality)}
          />
          <Text style={[styles.qualityText, { color: getQualityColor(networkQuality.quality) }]}>
            {networkQuality.quality.toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.connectionInfo}>
          <View style={[styles.connectionDot, { backgroundColor: connectionStatus.color }]} />
          <Text style={styles.connectionText}>{connectionStatus.text}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.refreshButton}
        onPress={onRefresh}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FF6B35" />
        ) : (
          <Ionicons name="refresh" size={16} color="#FF6B35" />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  qualityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qualityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  qualityText: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
  },
  connectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  connectionText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Medium',
  },
  refreshButton: {
    padding: 4,
  },
});
