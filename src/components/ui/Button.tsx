import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { brandColors, typography, borderRadius, shadows } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius.xl,
      overflow: 'hidden',
      opacity: disabled ? 0.6 : 1,
    };

    const sizeStyles = {
      small: {
        paddingVertical: 12,
        paddingHorizontal: 20,
      },
      medium: {
        paddingVertical: 16,
        paddingHorizontal: 24,
      },
      large: {
        paddingVertical: 20,
        paddingHorizontal: 32,
      },
    };

    const variantStyles = {
      primary: {
        ...shadows.button,
      },
      secondary: {
        backgroundColor: brandColors.lightGray,
        ...shadows.base,
      },
      outline: {
        borderWidth: 2,
        borderColor: brandColors.primary,
        backgroundColor: 'transparent',
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontFamily: typography.fontFamily.semiBold,
      textAlign: 'center',
    };

    const sizeStyles = {
      small: {
        fontSize: typography.fontSize.sm,
      },
      medium: {
        fontSize: typography.fontSize.base,
      },
      large: {
        fontSize: typography.fontSize.lg,
      },
    };

    const variantStyles = {
      primary: {
        color: brandColors.white,
      },
      secondary: {
        color: brandColors.darkGray,
      },
      outline: {
        color: brandColors.primary,
      },
      ghost: {
        color: brandColors.primary,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const renderButtonContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? brandColors.white : brandColors.primary}
        />
      );
    }

    return (
      <>
        {icon && <>{icon}</>}
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      </>
    );
  };

  const renderButton = () => {
    if (variant === 'primary') {
      return (
        <LinearGradient
          colors={[brandColors.primary, brandColors.primary]}
          style={getButtonStyle()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <TouchableOpacity
            style={styles.buttonContent}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled || loading}
            activeOpacity={0.8}
          >
            {renderButtonContent()}
          </TouchableOpacity>
        </LinearGradient>
      );
    }

    return (
      <TouchableOpacity
        style={[getButtonStyle(), style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        <View style={styles.buttonContent}>
          {renderButtonContent()}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View style={animatedStyle}>
      {renderButton()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Button;
