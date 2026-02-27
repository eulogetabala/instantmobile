import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';
import { authService } from '../../services/auth';
import { theme, brandColors, typography, borderRadius, shadows } from '../../constants/theme';
import { VALIDATION_RULES } from '../../constants';
import { AuthStackParamList } from '../../types';

const forgotPasswordSchema = yup.object({
  phone: yup
    .string()
    .required('Le numéro de téléphone est requis')
    .matches(VALIDATION_RULES.phone, 'Format de numéro de téléphone invalide'),
});

type ForgotPasswordFormData = yup.InferType<typeof forgotPasswordSchema>;

type ForgotPasswordScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(false);
  const [country, setCountry] = useState<Country>({
    cca2: 'CG' as CountryCode,
    currency: ['XAF'],
    callingCode: ['242'],
    region: 'Africa',
    subregion: 'Middle Africa',
    flag: '🇨🇬',
    name: 'Congo',
  });
  const [phoneNumber, setPhoneNumber] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: {
      phone: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      await authService.forgotPassword(data.phone);
      Alert.alert(
        'Succès',
        'Si un compte est associé à ce numéro, un code de réinitialisation vous a été envoyé.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('ResetPassword', { }),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[brandColors.primary, '#FF8A50']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              
              <View style={styles.iconContainer}>
                <Ionicons name="lock-open-outline" size={60} color="white" />
              </View>
              
              <Text style={styles.title}>Mot de passe oublié ?</Text>
              
              <Text style={styles.subtitle}>
                Entrez votre numéro de téléphone pour recevoir un code de réinitialisation.
              </Text>
            </View>

            {/* Formulaire */}
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Numéro de téléphone</Text>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[
                      styles.phoneInputContainer,
                      errors.phone && styles.inputError
                    ]}>
                      <CountryPicker
                        countryCode={country.cca2}
                        withFlag
                        withCallingCode
                        withCallingCodeButton
                        withEmoji
                        onSelect={(selectedCountry) => {
                          setCountry(selectedCountry);
                          setPhoneNumber('');
                        }}
                        containerButtonStyle={styles.countryPicker}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="81 234 5678"
                        placeholderTextColor={brandColors.mediumGray}
                        value={phoneNumber}
                        onChangeText={(text) => {
                          setPhoneNumber(text);
                          const fullNumber = `+${country.callingCode[0]}${text}`;
                          onChange(fullNumber);
                        }}
                        onBlur={onBlur}
                        keyboardType="phone-pad"
                        autoCapitalize="none"
                      />
                    </View>
                  )}
                />
                {errors.phone && (
                  <Text style={styles.errorText}>{errors.phone.message}</Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSubmit(onSubmit)}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Envoi en cours...' : 'Envoyer le code'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginLink}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.loginLinkText}>
                  Retour à la connexion
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.primary,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 30,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 20,
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 60,
    padding: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: typography.fontFamily.bold,
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: typography.fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    paddingTop: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
    color: brandColors.darkGray,
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    paddingHorizontal: 16,
  },
  inputError: {
    borderColor: brandColors.error,
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#E9ECEF',
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: typography.fontFamily.regular,
    color: brandColors.darkGray,
  },
  errorText: {
    color: brandColors.error,
    fontSize: 12,
    marginTop: 4,
    fontFamily: typography.fontFamily.regular,
  },
  button: {
    backgroundColor: brandColors.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 10,
    ...shadows.base,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: typography.fontFamily.semiBold,
  },
  loginLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginLinkText: {
    color: brandColors.primary,
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
  },
});

export default ForgotPasswordScreen;

