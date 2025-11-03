import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

const LoadingScreen: React.FC = () => {
  return (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.secondary]}
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}
    >
      <View style={{
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        padding: 40,
        backdropFilter: 'blur(10px)',
      }}>
        {/* Logo de l'application */}
        <View style={{
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: 50,
          padding: 20,
          marginBottom: 20,
        }}>
          <Ionicons 
            name="play-circle" 
            size={60} 
            color="white" 
          />
        </View>

        {/* Nom de l'application */}
        <Text style={{
          fontSize: 28,
          fontWeight: 'bold',
          color: 'white',
          marginBottom: 10,
          textAlign: 'center',
        }}>
          Instant+
        </Text>

        {/* Slogan */}
        <Text style={{
          fontSize: 16,
          color: 'rgba(255, 255, 255, 0.8)',
          marginBottom: 30,
          textAlign: 'center',
        }}>
          Vos événements en streaming
        </Text>

        {/* Indicateur de chargement */}
        <ActivityIndicator 
          size="large" 
          color="white" 
        />

        {/* Message de chargement */}
        <Text style={{
          fontSize: 14,
          color: 'rgba(255, 255, 255, 0.7)',
          marginTop: 20,
          textAlign: 'center',
        }}>
          Chargement...
        </Text>
      </View>
    </LinearGradient>
  );
};

export default LoadingScreen;

