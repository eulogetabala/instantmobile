import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { brandColors, typography, borderRadius, shadows } from '../../constants/theme';

interface AccessRequiredModalProps {
  visible: boolean;
  onClose: () => void;
  onLogin: () => void;
  onRegister: () => void;
  title?: string;
  message?: string;
  eventType?: 'free' | 'featured' | 'live' | 'paid';
}

const { width } = Dimensions.get('window');

const AccessRequiredModal: React.FC<AccessRequiredModalProps> = ({
  visible,
  onClose,
  onLogin,
  onRegister,
  title = 'Connexion requise',
  message = 'Vous devez vous connecter pour accéder à cette fonctionnalité.',
  eventType = 'free',
}) => {
  const getEventTypeInfo = () => {
    switch (eventType) {
      case 'free':
        return {
          icon: 'gift-outline',
          color: brandColors.success,
          title: 'Événement gratuit',
          description: 'Connectez-vous pour accéder aux événements gratuits',
        };
      case 'featured':
        return {
          icon: 'star-outline',
          color: brandColors.warning,
          title: 'Événement en vedette',
          description: 'Connectez-vous pour accéder aux événements en vedette',
        };
      case 'live':
        return {
          icon: 'radio-outline',
          color: brandColors.error,
          title: 'Streaming en direct',
          description: 'Connectez-vous pour regarder le streaming en direct',
        };
      case 'paid':
        return {
          icon: 'card-outline',
          color: brandColors.primary,
          title: 'Événement payant',
          description: 'Connectez-vous pour acheter un billet',
        };
      default:
        return {
          icon: 'lock-closed-outline',
          color: brandColors.mediumGray,
          title: 'Accès requis',
          description: 'Connectez-vous pour accéder à cette fonctionnalité',
        };
    }
  };

  const eventInfo = getEventTypeInfo();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header avec icône */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: `${eventInfo.color}20` }]}>
              <Ionicons
                name={eventInfo.icon as any}
                size={32}
                color={eventInfo.color}
              />
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={brandColors.mediumGray} />
            </TouchableOpacity>
          </View>

          {/* Contenu */}
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.eventTypeTitle}>{eventInfo.title}</Text>
            <Text style={styles.message}>{message}</Text>
            <Text style={styles.description}>{eventInfo.description}</Text>

            {/* Avantages de la connexion */}
            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>Avec un compte, vous pouvez :</Text>
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color={brandColors.success} />
                  <Text style={styles.benefitText}>Accéder aux événements gratuits</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color={brandColors.success} />
                  <Text style={styles.benefitText}>Regarder le streaming en direct</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color={brandColors.success} />
                  <Text style={styles.benefitText}>Acheter des billets</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color={brandColors.success} />
                  <Text style={styles.benefitText}>Participer au chat</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Boutons d'action */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={onLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>Se connecter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={onRegister}
              activeOpacity={0.8}
            >
              <Text style={styles.registerButtonText}>Créer un compte</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: brandColors.white,
    borderRadius: borderRadius.xl,
    width: width - 40,
    maxWidth: 400,
    ...shadows.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 0,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.darkGray,
    textAlign: 'center',
    marginBottom: 8,
  },
  eventTypeTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.darkGray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  description: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  benefitsContainer: {
    backgroundColor: brandColors.lightGray,
    borderRadius: borderRadius.lg,
    padding: 16,
  },
  benefitsTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.darkGray,
    marginBottom: 12,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.darkGray,
    flex: 1,
  },
  actionsContainer: {
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  loginButton: {
    backgroundColor: brandColors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    ...shadows.md,
  },
  loginButtonText: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
  },
  registerButton: {
    backgroundColor: brandColors.white,
    borderRadius: borderRadius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: brandColors.primary,
  },
  registerButtonText: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.primary,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.mediumGray,
  },
});

export default AccessRequiredModal;
