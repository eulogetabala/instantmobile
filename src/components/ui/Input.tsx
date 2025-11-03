import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { brandColors, typography, borderRadius } from '../../constants/theme';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  numberOfLines?: number;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
}

const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline = false,
  numberOfLines = 1,
  leftIcon,
  rightIcon,
  onRightIconPress,
  disabled = false,
  style,
  inputStyle,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const focusScale = useSharedValue(1);

  const handleFocus = () => {
    setIsFocused(true);
    focusScale.value = withTiming(1.02, { duration: 200 });
  };

  const handleBlur = () => {
    setIsFocused(false);
    focusScale.value = withTiming(1, { duration: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: focusScale.value }],
  }));

  const getContainerStyle = (): ViewStyle => {
    return {
      borderWidth: 2,
      borderColor: error
        ? brandColors.error
        : isFocused
        ? brandColors.primary
        : brandColors.lightGray,
      borderRadius: borderRadius.base,
      backgroundColor: disabled ? brandColors.lightGray : brandColors.white,
      paddingHorizontal: 16,
      paddingVertical: multiline ? 16 : 0,
      minHeight: multiline ? 100 : 56,
    };
  };

  const getInputStyle = (): TextStyle => {
    return {
      flex: 1,
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.regular,
      color: brandColors.darkGray,
      paddingVertical: multiline ? 0 : 16,
      textAlignVertical: multiline ? 'top' : 'center',
    };
  };

  const getLabelStyle = (): TextStyle => {
    return {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.medium,
      color: error ? brandColors.error : brandColors.darkGray,
      marginBottom: 8,
    };
  };

  const getErrorStyle = (): TextStyle => {
    return {
      fontSize: typography.fontSize.xs,
      fontFamily: typography.fontFamily.regular,
      color: brandColors.error,
      marginTop: 4,
    };
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={getLabelStyle()}>{label}</Text>}
      
      <Animated.View style={[animatedStyle]}>
        <View style={getContainerStyle()}>
          <View style={styles.inputContainer}>
            {leftIcon && (
              <Ionicons
                name={leftIcon}
                size={20}
                color={error ? brandColors.error : brandColors.mediumGray}
                style={styles.leftIcon}
              />
            )}
            
            <TextInput
              style={[getInputStyle(), inputStyle]}
              placeholder={placeholder}
              placeholderTextColor={brandColors.mediumGray}
              value={value}
              onChangeText={onChangeText}
              onFocus={handleFocus}
              onBlur={handleBlur}
              secureTextEntry={secureTextEntry && !showPassword}
              keyboardType={keyboardType}
              autoCapitalize={autoCapitalize}
              multiline={multiline}
              numberOfLines={numberOfLines}
              editable={!disabled}
            />
            
            {secureTextEntry && (
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.rightIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={brandColors.mediumGray}
                />
              </TouchableOpacity>
            )}
            
            {rightIcon && !secureTextEntry && (
              <TouchableOpacity
                onPress={onRightIconPress}
                style={styles.rightIcon}
              >
                <Ionicons
                  name={rightIcon}
                  size={20}
                  color={brandColors.mediumGray}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>
      
      {error && <Text style={getErrorStyle()}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftIcon: {
    marginRight: 12,
  },
  rightIcon: {
    marginLeft: 12,
    padding: 4,
  },
});

export default Input;
