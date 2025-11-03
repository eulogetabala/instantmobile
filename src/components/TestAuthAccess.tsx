import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { brandColors, typography } from '../constants/theme';

const TestAuthAccess: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test d'Authentification</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Statut de connexion :</Text>
        <Text style={[
          styles.statusValue,
          { color: isAuthenticated ? brandColors.success : brandColors.error }
        ]}>
          {isAuthenticated ? 'Connecté' : 'Non connecté'}
        </Text>
      </View>

      {isAuthenticated && user && (
        <View style={styles.userInfo}>
          <Text style={styles.userLabel}>Utilisateur :</Text>
          <Text style={styles.userValue}>{user.firstName} {user.lastName}</Text>
          <Text style={styles.userPhone}>{user.phone}</Text>
        </View>
      )}

      <View style={styles.testInfo}>
        <Text style={styles.testTitle}>Test d'accès aux événements :</Text>
        <Text style={styles.testText}>
          • Événements gratuits : {isAuthenticated ? '✅ Accès autorisé' : '❌ Connexion requise'}
        </Text>
        <Text style={styles.testText}>
          • Événements en direct : {isAuthenticated ? '✅ Accès autorisé' : '❌ Connexion requise'}
        </Text>
        <Text style={styles.testText}>
          • Événements en vedette : {isAuthenticated ? '✅ Accès autorisé' : '❌ Connexion requise'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: brandColors.white,
    margin: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.darkGray,
    marginBottom: 20,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    padding: 12,
    backgroundColor: brandColors.lightGray,
    borderRadius: 8,
  },
  statusLabel: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.darkGray,
  },
  statusValue: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_700Bold',
  },
  userInfo: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: brandColors.lightGray,
    borderRadius: 8,
  },
  userLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.mediumGray,
    marginBottom: 4,
  },
  userValue: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.darkGray,
    marginBottom: 2,
  },
  userPhone: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
  },
  testInfo: {
    padding: 12,
    backgroundColor: brandColors.lightGray,
    borderRadius: 8,
  },
  testTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.darkGray,
    marginBottom: 8,
  },
  testText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.darkGray,
    marginBottom: 4,
  },
});

export default TestAuthAccess;
