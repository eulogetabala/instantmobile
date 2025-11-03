import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { brandColors, typography, borderRadius, shadows } from '../../constants/theme';
import * as Notifications from 'expo-notifications';

const { width } = Dimensions.get('window');

interface NotificationToastProps {
  notification: Notifications.Notification | null;
  onDismiss: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
}) => {
  const [visible, setVisible] = useState(false);
  const slideAnim = useState(new Animated.Value(-100))[0];
  const opacityAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (notification) {
      showToast();
    }
  }, [notification]);

  const showToast = () => {
    setVisible(true);
    
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss après 5 secondes
    setTimeout(() => {
      hideToast();
    }, 5000);
  };

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      onDismiss();
    });
  };

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'event_start':
        return 'play-circle';
      case 'event_reminder':
        return 'alarm';
      case 'payment_success':
        return 'checkmark-circle';
      case 'new_event':
        return 'add-circle';
      case 'replay_available':
        return 'play';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type?: string) => {
    switch (type) {
      case 'event_start':
        return brandColors.success;
      case 'event_reminder':
        return brandColors.warning;
      case 'payment_success':
        return brandColors.success;
      case 'new_event':
        return brandColors.primary;
      case 'replay_available':
        return brandColors.primary;
      default:
        return brandColors.primary;
    }
  };

  if (!visible || !notification) {
    return null;
  }

  const notificationType = notification.request.content.data?.type;
  const iconName = getNotificationIcon(notificationType);
  const iconColor = getNotificationColor(notificationType);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.toast}
        onPress={hideToast}
        activeOpacity={0.9}
      >
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
            <Ionicons name={iconName as any} size={24} color={iconColor} />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {notification.request.content.title}
            </Text>
            <Text style={styles.body} numberOfLines={2}>
              {notification.request.content.body}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={hideToast}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color={brandColors.mediumGray} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  toast: {
    backgroundColor: brandColors.white,
    borderRadius: borderRadius.lg,
    padding: 16,
    ...shadows.lg,
    borderLeftWidth: 4,
    borderLeftColor: brandColors.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.darkGray,
    marginBottom: 2,
    textTransform: 'none',
  },
  body: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
    lineHeight: 18,
    textTransform: 'none',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default NotificationToast;
