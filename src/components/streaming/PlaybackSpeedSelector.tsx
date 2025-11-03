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

interface PlaybackSpeedSelectorProps {
  isVisible: boolean;
  currentSpeed: number;
  onSpeedSelect: (speed: number) => void;
  onClose: () => void;
  isLive?: boolean;
}

const SPEED_OPTIONS = [
  { value: 0.25, label: '0.25x' },
  { value: 0.5, label: '0.5x' },
  { value: 0.75, label: '0.75x' },
  { value: 1.0, label: '1x (Normal)' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' },
  { value: 2.0, label: '2x' },
];

export const PlaybackSpeedSelector: React.FC<PlaybackSpeedSelectorProps> = ({
  isVisible,
  currentSpeed,
  onSpeedSelect,
  onClose,
  isLive = false,
}) => {
  const handleSpeedSelect = (speed: number) => {
    onSpeedSelect(speed);
    onClose();
  };

  const renderSpeedOption = ({ item }: { item: typeof SPEED_OPTIONS[0] }) => (
    <TouchableOpacity
      style={[
        styles.speedOption,
        currentSpeed === item.value && styles.selectedSpeedOption,
      ]}
      onPress={() => handleSpeedSelect(item.value)}
    >
      <Text
        style={[
          styles.speedText,
          currentSpeed === item.value && styles.selectedSpeedText,
        ]}
      >
        {item.label}
      </Text>
      {currentSpeed === item.value && (
        <Ionicons name="checkmark" size={20} color="#FF6B35" />
      )}
    </TouchableOpacity>
  );

  if (isLive) {
    return (
      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.liveModal}>
            <View style={styles.liveHeader}>
              <Ionicons name="radio" size={24} color="#FF0000" />
              <Text style={styles.liveTitle}>Diffusion en direct</Text>
            </View>
            <Text style={styles.liveMessage}>
              La vitesse de lecture n'est pas disponible pour les diffusions en direct.
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

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
            <Text style={styles.title}>Vitesse de lecture</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#333333" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={SPEED_OPTIONS}
            renderItem={renderSpeedOption}
            keyExtractor={(item) => item.value.toString()}
            style={styles.speedList}
            showsVerticalScrollIndicator={false}
          />
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
    width: '80%',
    maxHeight: '60%',
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
  speedList: {
    maxHeight: 300,
  },
  speedOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedSpeedOption: {
    backgroundColor: '#FFF5F0',
  },
  speedText: {
    fontSize: 16,
    color: '#333333',
    fontFamily: 'Montserrat-Medium',
  },
  selectedSpeedText: {
    color: '#FF6B35',
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
  },
  liveModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  liveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  liveTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginLeft: 8,
    fontFamily: 'Montserrat-Bold',
  },
  liveMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    fontFamily: 'Montserrat-Medium',
  },
  closeButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
  },
});
