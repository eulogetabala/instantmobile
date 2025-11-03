import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QualityOption {
  value: string;
  label: string;
  resolution: string;
  bitrate: string;
  description: string;
}

interface QualitySelectorProps {
  isVisible: boolean;
  currentQuality: string;
  onQualitySelect: (quality: string) => void;
  onClose: () => void;
  availableQualities?: string[];
}

const QUALITY_OPTIONS: QualityOption[] = [
  {
    value: 'auto',
    label: 'Auto',
    resolution: 'Adaptatif',
    bitrate: 'Variable',
    description: 'Qualité adaptée à votre connexion',
  },
  {
    value: '1080p',
    label: '1080p',
    resolution: '1920x1080',
    bitrate: '5-8 Mbps',
    description: 'Haute qualité (connexion rapide requise)',
  },
  {
    value: '720p',
    label: '720p',
    resolution: '1280x720',
    bitrate: '2-4 Mbps',
    description: 'Qualité HD (recommandée)',
  },
  {
    value: '480p',
    label: '480p',
    resolution: '854x480',
    bitrate: '1-2 Mbps',
    description: 'Qualité standard',
  },
  {
    value: '360p',
    label: '360p',
    resolution: '640x360',
    bitrate: '0.5-1 Mbps',
    description: 'Qualité basse (connexion lente)',
  },
];

export const QualitySelector: React.FC<QualitySelectorProps> = ({
  isVisible,
  currentQuality,
  onQualitySelect,
  onClose,
  availableQualities = ['auto', '720p', '480p', '360p'],
}) => {
  const handleQualitySelect = (quality: string) => {
    onQualitySelect(quality);
    onClose();
  };

  const filteredOptions = QUALITY_OPTIONS.filter(option =>
    availableQualities.includes(option.value)
  );

  const renderQualityOption = ({ item }: { item: QualityOption }) => {
    const isSelected = currentQuality === item.value;
    const isRecommended = item.value === '720p';

    return (
      <TouchableOpacity
        style={[
          styles.qualityOption,
          isSelected && styles.selectedQualityOption,
        ]}
        onPress={() => handleQualitySelect(item.value)}
      >
        <View style={styles.qualityInfo}>
          <View style={styles.qualityHeader}>
            <Text
              style={[
                styles.qualityLabel,
                isSelected && styles.selectedQualityLabel,
              ]}
            >
              {item.label}
            </Text>
            {isRecommended && (
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>Recommandé</Text>
              </View>
            )}
            {isSelected && (
              <Ionicons name="checkmark-circle" size={20} color="#FF6B35" />
            )}
          </View>
          
          <Text style={styles.qualityDetails}>
            {item.resolution} • {item.bitrate}
          </Text>
          
          <Text style={styles.qualityDescription}>
            {item.description}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Qualité de la vidéo</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#333333" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={filteredOptions}
            renderItem={renderQualityOption}
            keyExtractor={(item) => item.value}
            style={styles.qualityList}
            showsVerticalScrollIndicator={false}
          />
          
          <View style={styles.footer}>
            <Ionicons name="information-circle" size={16} color="#666666" />
            <Text style={styles.footerText}>
              La qualité s'adapte automatiquement à votre connexion
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '90%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    fontFamily: 'Montserrat-Bold',
  },
  closeButton: {
    padding: 4,
  },
  qualityList: {
    maxHeight: 400,
  },
  qualityOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedQualityOption: {
    backgroundColor: '#FFF5F0',
  },
  qualityInfo: {
    flex: 1,
  },
  qualityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  qualityLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    fontFamily: 'Montserrat-Bold',
    marginRight: 8,
  },
  selectedQualityLabel: {
    color: '#FF6B35',
  },
  recommendedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  recommendedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
  },
  qualityDetails: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Montserrat-Medium',
    marginBottom: 2,
  },
  qualityDescription: {
    fontSize: 12,
    color: '#999999',
    fontFamily: 'Montserrat-Regular',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 8,
    fontFamily: 'Montserrat-Medium',
  },
});
