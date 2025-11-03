import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  runOnJS,
} from 'react-native-reanimated';

interface VolumeSliderProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  isVisible: boolean;
  onClose: () => void;
}

export const VolumeSlider: React.FC<VolumeSliderProps> = ({
  volume,
  onVolumeChange,
  isVisible,
  onClose,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const translateY = useSharedValue(0);
  const sliderHeight = 200;
  const thumbSize = 20;

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      runOnJS(setIsDragging)(true);
    },
    onActive: (event) => {
      translateY.value = Math.max(
        -sliderHeight + thumbSize,
        Math.min(0, event.translationY)
      );
      
      const progress = Math.abs(translateY.value) / (sliderHeight - thumbSize);
      const newVolume = Math.max(0, Math.min(1, progress));
      runOnJS(onVolumeChange)(newVolume);
    },
    onEnd: () => {
      runOnJS(setIsDragging)(false);
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const volumeBarStyle = useAnimatedStyle(() => {
    const progress = Math.abs(translateY.value) / (sliderHeight - thumbSize);
    return {
      height: `${Math.max(0, Math.min(100, progress * 100))}%`,
    };
  });

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.sliderContainer}>
        <View style={styles.volumeIcon}>
          <Ionicons
            name={volume === 0 ? "volume-mute" : volume < 0.5 ? "volume-low" : "volume-high"}
            size={24}
            color="#FFFFFF"
          />
        </View>
        
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={[styles.slider, animatedStyle]}>
            <View style={styles.sliderTrack}>
              <Animated.View style={[styles.sliderFill, volumeBarStyle]} />
            </View>
            <View style={styles.thumb} />
          </Animated.View>
        </PanGestureHandler>
        
        <View style={styles.volumeText}>
          <Text style={styles.volumeValue}>
            {Math.round(volume * 100)}%
          </Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Ionicons name="close" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -100 }],
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    zIndex: 100,
  },
  sliderContainer: {
    alignItems: 'center',
    height: 200,
    justifyContent: 'space-between',
  },
  volumeIcon: {
    marginBottom: 8,
  },
  slider: {
    width: 4,
    height: 200,
    position: 'relative',
  },
  sliderTrack: {
    width: 4,
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    position: 'relative',
  },
  sliderFill: {
    position: 'absolute',
    bottom: 0,
    width: 4,
    backgroundColor: '#FF6B35',
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    top: -10,
    left: -8,
    width: 20,
    height: 20,
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  volumeText: {
    marginTop: 8,
  },
  volumeValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
  },
  closeButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
