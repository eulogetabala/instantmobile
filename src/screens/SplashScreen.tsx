import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { brandColors, typography, borderRadius } from '../constants/theme';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationFinish }) => {
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(50);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(30);
  const backgroundOpacity = useSharedValue(0);

  useEffect(() => {
    // Animation d'entrée
    const startAnimation = () => {
      // Animation du fond
      backgroundOpacity.value = withTiming(1, { duration: 500 });
      
      // Animation du logo (apparition en fondu + slide-up)
      logoOpacity.value = withTiming(1, { duration: 800 });
      logoTranslateY.value = withTiming(0, { duration: 800 });
      logoScale.value = withSequence(
        withTiming(1.1, { duration: 600 }),
        withTiming(1, { duration: 200 })
      );
      
      // Animation du texte avec délai
      textOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
      textTranslateY.value = withDelay(400, withTiming(0, { duration: 600 }));
      
      // Fin de l'animation après 2.5 secondes
      setTimeout(() => {
        runOnJS(onAnimationFinish)();
      }, 2500);
    };

    startAnimation();
  }, []);

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { translateY: logoTranslateY.value },
      { scale: logoScale.value },
    ],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={brandColors.primary} />
      
      <Animated.View style={[styles.background, backgroundAnimatedStyle]}>
        <LinearGradient
          colors={[brandColors.primary, brandColors.white]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <View style={styles.content}>
        {/* Logo animé */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <View style={styles.logoBackground}>
            <Ionicons 
              name="play-circle" 
              size={80} 
              color={brandColors.white} 
            />
          </View>
        </Animated.View>

        {/* Texte animé */}
        <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
          <Text style={styles.appName}>Instant+</Text>
          <Text style={styles.tagline}>Vos événements en streaming</Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.primary,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    ...brandColors.shadows?.lg || {},
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: typography.fontSize['4xl'],
    fontFamily: typography.fontFamily.bold,
    color: brandColors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.medium,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.lg,
  },
});

export default SplashScreen;
