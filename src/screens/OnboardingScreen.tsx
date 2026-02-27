import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  interpolate,
  Extrapolate,
  Easing,
  useAnimatedProps,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { brandColors, typography, borderRadius, shadows } from '../constants/theme';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

interface SlideData {
  id: number;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
  backgroundImage: any;
}

const slides: SlideData[] = [
  {
    id: 1,
    icon: 'play-circle',
    title: 'Bienvenue sur INSTANT+',
    description: 'La plateforme de streaming d\'événements la plus innovante du Congo. Découvrez des concerts, séminaires, festivals et bien plus encore.',
    color: brandColors.primary,
    backgroundImage: require('../../assets/images/on1.webp'),
  },
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  
  // Animations créatives
  const logoScale = useSharedValue(0);
  const logoRotation = useSharedValue(0);
  const backgroundOpacity = useSharedValue(0);
  const slideOpacity = useSharedValue(1);
  const slideScale = useSharedValue(1);
  const iconBounce = useSharedValue(0);
  const textSlideY = useSharedValue(50);
  const textOpacity = useSharedValue(0);
  const particleScale = useSharedValue(0);
  const particleRotation = useSharedValue(0);
  const gradientRotation = useSharedValue(0);
  
  // Nouvelles animations d'entrée
  const titleScale = useSharedValue(1);
  const titleRotation = useSharedValue(0);
  const descriptionSlideX = useSharedValue(0);
  const descriptionOpacity = useSharedValue(1);
  const featuresSlideY = useSharedValue(0);
  const featuresOpacity = useSharedValue(1);
  const buttonSlideY = useSharedValue(0);
  const buttonOpacity = useSharedValue(1);
  const logoSlideY = useSharedValue(0);

  // Animation d'entrée spectaculaire
  useEffect(() => {
    // 1. Animation du logo (0ms)
    logoSlideY.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.back(1.2)) });
    logoScale.value = withSequence(
      withTiming(1.3, { duration: 600, easing: Easing.out(Easing.back(1.5)) }),
      withTiming(1, { duration: 300 })
    );
    logoRotation.value = withTiming(360, { duration: 1000, easing: Easing.out(Easing.cubic) });
    
    // 2. Animation du background (200ms)
    backgroundOpacity.value = withDelay(200, withTiming(1, { duration: 800 }));
    
    // 3. Animation des particules (400ms)
    particleScale.value = withDelay(400, withTiming(1, { duration: 600 }));
    particleRotation.value = withTiming(720, { duration: 2000, easing: Easing.linear });
    
    // 4. Animation du titre (600ms)
    titleScale.value = withDelay(600, withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(1.2, { duration: 500, easing: Easing.out(Easing.back(1.2)) }),
      withTiming(1, { duration: 300 })
    ));
    
    // 5. Animation de la description (800ms)
    descriptionSlideX.value = withDelay(800, withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }));
    descriptionOpacity.value = withDelay(800, withTiming(1, { duration: 600 }));
    
    // 6. Animation des features (1000ms)
    featuresSlideY.value = withDelay(1000, withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }));
    featuresOpacity.value = withDelay(1000, withTiming(1, { duration: 600 }));
    
    // 7. Animation du bouton (1200ms)
    buttonSlideY.value = withDelay(1200, withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }));
    buttonOpacity.value = withDelay(1200, withTiming(1, { duration: 600 }));
    
    // Animation de pulsation continue du bouton
    const pulseAnimation = () => {
      buttonScale.value = withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      );
    };
    
    const interval = setInterval(pulseAnimation, 2000);
    return () => clearInterval(interval);
  }, []);

  // Animation lors du changement de slide
  useEffect(() => {
    slideOpacity.value = withSequence(
      withTiming(0.3, { duration: 200 }),
      withTiming(1, { duration: 300 })
    );
    slideScale.value = withSequence(
      withTiming(0.9, { duration: 200 }),
      withTiming(1, { duration: 300 })
    );
    iconBounce.value = withSequence(
      withTiming(1.3, { duration: 200 }),
      withTiming(1, { duration: 300 })
    );
  }, [currentIndex]);

  const goToNext = () => {
    onComplete();
  };


  const handleNext = () => {
    // Animation du bouton au clic
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1.05, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    goToNext();
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleButtonPress = () => {
    buttonScale.value = withSpring(0.95, {}, () => {
      buttonScale.value = withSpring(1);
    });
    handleNext();
  };



  // Styles animés créatifs
  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: logoSlideY.value },
        { scale: logoScale.value },
        { rotate: `${logoRotation.value}deg` }
      ],
    };
  });

  const titleAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: titleScale.value }
      ],
      opacity: titleScale.value,
    };
  });

  const descriptionAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: descriptionOpacity.value,
    };
  });

  const featuresAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: featuresOpacity.value,
    };
  });

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
      opacity: buttonOpacity.value,
    };
  });

  const backgroundAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: backgroundOpacity.value,
    };
  });

  const slideAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: slideOpacity.value,
      transform: [{ scale: slideScale.value }],
    };
  });

  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: iconBounce.value }],
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
      transform: [{ translateY: textSlideY.value }],
    };
  });

  const particleAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: particleScale.value },
        { rotate: `${particleRotation.value}deg` }
      ],
    };
  });

  const gradientAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${gradientRotation.value}deg` }],
    };
  });


  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={brandColors.primary} />
      
      {/* Background avec image de fond */}
      <Animated.View style={[styles.backgroundContainer, backgroundAnimatedStyle]}>
        <Image
          source={require('../../assets/images/on1.webp')}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        
        {/* Overlay dégradé créatif */}
        <LinearGradient
          colors={['rgba(255, 102, 0, 0.8)', 'rgba(255, 102, 0, 0.4)', 'rgba(255, 255, 255, 0.9)']}
          style={styles.overlayGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* Particules flottantes créatives */}
        <Animated.View style={[styles.particle1, particleAnimatedStyle]}>
          <View style={[styles.particle, styles.particleLarge]} />
        </Animated.View>
        <Animated.View style={[styles.particle2, particleAnimatedStyle]}>
          <View style={[styles.particle, styles.particleMedium]} />
        </Animated.View>
        <Animated.View style={[styles.particle3, particleAnimatedStyle]}>
          <View style={[styles.particle, styles.particleSmall]} />
        </Animated.View>
        <Animated.View style={[styles.particle4, particleAnimatedStyle]}>
          <View style={[styles.particle, styles.particleLarge]} />
        </Animated.View>
        <Animated.View style={[styles.particle5, particleAnimatedStyle]}>
          <View style={[styles.particle, styles.particleMedium]} />
        </Animated.View>
      </Animated.View>

      {/* Logo INSTANT+ spectaculaire */}
      <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.8)']}
          style={styles.logoBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Image
            source={require('../../assets/images/INSTANT+ 2.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </LinearGradient>
      </Animated.View>

      {/* Contenu principal */}
      <View style={styles.contentContainer}>
        {/* Titre principal */}
        <Animated.Text style={[styles.mainTitle, titleAnimatedStyle]}>Bienvenue sur INSTANT+</Animated.Text>
        
        {/* Description élégante */}
        <View style={styles.descriptionSection}>
          <LinearGradient
            colors={['rgba(255, 102, 0, 0.9)', 'rgba(255, 102, 0, 0.7)', 'rgba(0, 0, 0, 0.8)']}
            style={styles.descriptionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.descriptionContainer}>
              <View style={styles.quoteContainer}>
                <Ionicons name="chatbubble" size={24} color="rgba(255, 255, 255, 0.6)" style={styles.quoteIcon} />
                <Text style={styles.mainDescription}>
                  La plateforme de streaming d'événements la plus innovante du Congo
                </Text>
                <Ionicons name="chatbubble" size={24} color="rgba(255, 255, 255, 0.6)" style={styles.quoteIconRight} />
              </View>
              <View style={styles.divider} />
              <Text style={styles.subDescription}>
                Découvrez des concerts, séminaires, festivals et bien plus encore
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Features en points */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="videocam" size={24} color={brandColors.primary} />
            <Text style={styles.featureText}>Streaming HD</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="card" size={24} color={brandColors.primary} />
            <Text style={styles.featureText}>Paiement sécurisé</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="people" size={24} color={brandColors.primary} />
            <Text style={styles.featureText}>Communauté active</Text>
          </View>
        </View>
      </View>

      {/* Bouton Commencer spectaculaire */}
      <View style={styles.buttonContainer}>
        <Animated.View style={buttonAnimatedStyle}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <View style={styles.buttonGradient}>
              <Text style={styles.startButtonText}>Commencer l'aventure</Text>
              <Ionicons
                name="rocket"
                size={24}
                color={brandColors.white}
                style={styles.buttonIcon}
              />
            </View>
          </TouchableOpacity>
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
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  overlayGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  logoContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  logoBackground: {
    borderRadius: borderRadius.lg,
    paddingHorizontal: 15,
    paddingVertical: 8,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 102, 0, 0.1)',
  },
  logoImage: {
    width: 250,
    height: 80,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 200,
  },
  mainTitle: {
    fontSize: typography.fontSize['3xl'],
    fontFamily: typography.fontFamily.bold,
    color: brandColors.white,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
    fontWeight: '900',
    lineHeight: 36,
  },
  descriptionSection: {
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  descriptionGradient: {
    borderRadius: borderRadius.xl,
  },
  descriptionContainer: {
    paddingVertical: 25,
    paddingHorizontal: 25,
  },
  quoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  quoteIcon: {
    marginRight: 10,
  },
  quoteIconRight: {
    marginLeft: 10,
    transform: [{ scaleX: -1 }],
  },
  mainDescription: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: brandColors.white,
    textAlign: 'center',
    lineHeight: typography.lineHeight.normal * typography.fontSize.lg,
    flex: 1,
    fontWeight: '600',
    fontStyle: 'italic',
    flexWrap: 'wrap',
  },
  divider: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginVertical: 20,
    marginHorizontal: 40,
    borderRadius: 1,
  },
  subDescription: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
    fontWeight: '400',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 40,
    paddingHorizontal: 20,
    gap: 15,
  },
  featureItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: borderRadius.xl,
    paddingVertical: 18,
    paddingHorizontal: 12,
    width: 100,
    ...shadows.lg,
    borderWidth: 2,
    borderColor: 'rgba(255, 102, 0, 0.2)',
  },
  featureText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: brandColors.primary,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: 16,
  },
  particle: {
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  particleLarge: {
    width: 12,
    height: 12,
  },
  particleMedium: {
    width: 8,
    height: 8,
  },
  particleSmall: {
    width: 6,
    height: 6,
  },
  particle1: {
    position: 'absolute',
    top: '15%',
    left: '8%',
  },
  particle2: {
    position: 'absolute',
    top: '25%',
    right: '12%',
  },
  particle3: {
    position: 'absolute',
    top: '45%',
    left: '15%',
  },
  particle4: {
    position: 'absolute',
    bottom: '35%',
    right: '8%',
  },
  particle5: {
    position: 'absolute',
    bottom: '20%',
    left: '25%',
  },
  buttonContainer: {
    paddingHorizontal: 50,
    paddingBottom: 30,
  },
  startButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
    backgroundColor: brandColors.primary,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
    backgroundColor: brandColors.primary,
  },
  startButtonText: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: brandColors.white,
    marginRight: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontWeight: '800',
  },
  buttonIcon: {
    marginLeft: 4,
  },
});

export default OnboardingScreen;
