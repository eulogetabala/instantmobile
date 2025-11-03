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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';
import { VALIDATION_RULES, ERROR_MESSAGES } from '../../constants';

const loginSchema = yup.object({
  phone: yup
    .string()
    .required('Le numéro de téléphone est requis')
    .matches(VALIDATION_RULES.phone, 'Format de numéro de téléphone invalide'),
  password: yup
    .string()
    .required('Le mot de passe est requis')
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

type LoginFormData = yup.InferType<typeof loginSchema>;

const LoginScreen: React.FC = () => {
  const { login, isLoading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
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
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      phone: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : ERROR_MESSAGES.AUTH_ERROR);
    }
  };


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={{
              alignItems: 'center',
              paddingTop: 40,
              paddingBottom: 20,
            }}>
              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 50,
                padding: 20,
                marginBottom: 20,
              }}>
                <Ionicons name="play-circle" size={60} color="white" />
              </View>
              
              <Text style={{
                fontSize: 28,
                fontWeight: 'bold',
                color: 'white',
                marginBottom: 8,
                fontFamily: 'Montserrat_700Bold',
              }}>
                Instant+
              </Text>
              
              <Text style={{
                fontSize: 16,
                color: 'rgba(255, 255, 255, 0.8)',
                textAlign: 'center',
                fontFamily: 'Montserrat_400Regular',
              }}>
                Connectez-vous pour accéder à vos événements
              </Text>
            </View>

            {/* Formulaire de connexion */}
            <View style={{
              flex: 1,
              backgroundColor: 'white',
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              padding: 30,
              paddingTop: 40,
            }}>
              <Text style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: theme.colors.onBackground,
                marginBottom: 30,
                textAlign: 'center',
                fontFamily: 'Montserrat_700Bold',
              }}>
                Connexion
              </Text>

              {/* Message d'erreur global */}
              {error && (
                <View style={{
                  backgroundColor: theme.colors.errorContainer,
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 20,
                }}>
                  <Text style={{
                    color: theme.colors.onErrorContainer,
                    fontSize: 14,
                    textAlign: 'center',
                    fontFamily: 'Montserrat_400Regular',
                  }}>
                    {error}
                  </Text>
                </View>
              )}

              {/* Champ Numéro de téléphone */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: theme.colors.onSurface,
                  marginBottom: 8,
                  fontFamily: 'Montserrat_500Medium',
                }}>
                  Numéro de téléphone
                </Text>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: theme.colors.surface,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: errors.phone ? theme.colors.error : theme.colors.outline,
                      paddingHorizontal: 16,
                    }}>
                      <CountryPicker
                        countryCode={country.cca2}
                        withFlag
                        withCallingCode
                        withCallingCodeButton
                        withEmoji
                        onSelect={(selectedCountry) => {
                          setCountry(selectedCountry);
                          setPhoneNumber(''); // Réinitialiser le numéro quand on change de pays
                        }}
                        containerButtonStyle={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingRight: 12,
                        }}
                        textInputStyle={{
                          fontSize: 16,
                          color: theme.colors.onSurface,
                          fontFamily: 'Montserrat_400Regular',
                        }}
                        theme={{
                          primaryColor: theme.colors.primary,
                          primaryColorVariant: theme.colors.primary,
                          backgroundColor: theme.colors.surface,
                          onBackgroundTextColor: theme.colors.onSurface,
                          fontSize: 16,
                        }}
                      />
                      <TextInput
                        style={{
                          flex: 1,
                          paddingVertical: 16,
                          fontSize: 16,
                          color: theme.colors.onSurface,
                          fontFamily: 'Montserrat_400Regular',
                        }}
                        placeholder="81 234 5678"
                        placeholderTextColor={theme.colors.onSurfaceVariant}
                        value={phoneNumber}
                        onChangeText={(text) => {
                          setPhoneNumber(text);
                          const fullNumber = `+${country.callingCode[0]}${text}`;
                          onChange(fullNumber);
                        }}
                        onBlur={onBlur}
                        keyboardType="phone-pad"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  )}
                />
                {errors.phone && (
                  <Text style={{
                    color: theme.colors.error,
                    fontSize: 12,
                    marginTop: 4,
                    fontFamily: 'Montserrat_400Regular',
                  }}>
                    {errors.phone.message}
                  </Text>
                )}
              </View>

              {/* Champ Mot de passe */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: theme.colors.onSurface,
                  marginBottom: 8,
                  fontFamily: 'Montserrat_500Medium',
                }}>
                  Mot de passe
                </Text>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: theme.colors.surface,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: errors.password ? theme.colors.error : theme.colors.outline,
                      paddingHorizontal: 16,
                    }}>
                      <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color={errors.password ? theme.colors.error : theme.colors.onSurfaceVariant}
                        style={{ marginRight: 12 }}
                      />
                      <TextInput
                        style={{
                          flex: 1,
                          paddingVertical: 16,
                          fontSize: 16,
                          color: theme.colors.onSurface,
                          fontFamily: 'Montserrat_400Regular',
                        }}
                        placeholder="Votre mot de passe"
                        placeholderTextColor={theme.colors.onSurfaceVariant}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={{ padding: 4 }}
                      >
                        <Ionicons
                          name={showPassword ? "eye-off-outline" : "eye-outline"}
                          size={20}
                          color={theme.colors.onSurfaceVariant}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                />
                {errors.password && (
                  <Text style={{
                    color: theme.colors.error,
                    fontSize: 12,
                    marginTop: 4,
                    fontFamily: 'Montserrat_400Regular',
                  }}>
                    {errors.password.message}
                  </Text>
                )}
              </View>

              {/* Lien mot de passe oublié */}
              <TouchableOpacity
                style={{ alignSelf: 'flex-end', marginBottom: 30 }}
                onPress={() => {/* Navigation vers mot de passe oublié */}}
              >
                <Text style={{
                  color: theme.colors.primary,
                  fontSize: 14,
                  fontWeight: '500',
                  fontFamily: 'Montserrat_500Medium',
                }}>
                  Mot de passe oublié ?
                </Text>
              </TouchableOpacity>

              {/* Bouton de connexion */}
              <TouchableOpacity
                style={{
                  backgroundColor: theme.colors.primary,
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: 'center',
                  marginBottom: 20,
                  opacity: isLoading ? 0.7 : 1,
                }}
                onPress={handleSubmit(onSubmit)}
                disabled={isLoading}
              >
                <Text style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: '600',
                  fontFamily: 'Montserrat_600SemiBold',
                }}>
                  {isLoading ? 'Connexion...' : 'Se connecter'}
                </Text>
              </TouchableOpacity>


              {/* Lien vers l'inscription */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'center',
                marginTop: 30,
              }}>
                <Text style={{
                  color: theme.colors.onSurfaceVariant,
                  fontSize: 14,
                  fontFamily: 'Montserrat_400Regular',
                }}>
                  Pas encore de compte ?{' '}
                </Text>
                <TouchableOpacity
                  onPress={() => {/* Navigation vers l'inscription */}}
                >
                  <Text style={{
                    color: theme.colors.primary,
                    fontSize: 14,
                    fontWeight: '500',
                    fontFamily: 'Montserrat_500Medium',
                  }}>
                    S'inscrire
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default LoginScreen;

