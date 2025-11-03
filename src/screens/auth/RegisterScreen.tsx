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

const registerSchema = yup.object({
  firstName: yup
    .string()
    .required('Le prénom est requis')
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne peut pas dépasser 50 caractères'),
  lastName: yup
    .string()
    .required('Le nom est requis')
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères'),
  phone: yup
    .string()
    .required('Le numéro de téléphone est requis')
    .matches(VALIDATION_RULES.phone, 'Format de numéro de téléphone invalide'),
  password: yup
    .string()
    .required('Le mot de passe est requis')
    .min(VALIDATION_RULES.password.minLength, `Le mot de passe doit contenir au moins ${VALIDATION_RULES.password.minLength} caractères`),
  confirmPassword: yup
    .string()
    .required('La confirmation du mot de passe est requise')
    .oneOf([yup.ref('password')], 'Les mots de passe ne correspondent pas'),
});

type RegisterFormData = yup.InferType<typeof registerSchema>;

const RegisterScreen: React.FC = () => {
  const { register, isLoading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await register(data);
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : ERROR_MESSAGES.AUTH_ERROR);
    }
  };


  const formatPhoneNumber = (text: string) => {
    // Supprimer tous les caractères non numériques
    const cleaned = text.replace(/\D/g, '');
    
    // Formater selon le format congolais
    if (cleaned.startsWith('243')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0')) {
      return `+243${cleaned.substring(1)}`;
    } else if (cleaned.length > 0) {
      return `+243${cleaned}`;
    }
    
    return cleaned;
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
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={{
              alignItems: 'center',
              paddingTop: 20,
              paddingBottom: 20,
            }}>
              <View style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 50,
                padding: 20,
                marginBottom: 20,
              }}>
                <Ionicons name="person-add" size={60} color="white" />
              </View>
              
              <Text style={{
                fontSize: 28,
                fontWeight: 'bold',
                color: 'white',
                marginBottom: 8,
                fontFamily: 'Montserrat_700Bold',
              }}>
                Rejoignez Instant+
              </Text>
              
              <Text style={{
                fontSize: 16,
                color: 'rgba(255, 255, 255, 0.8)',
                textAlign: 'center',
                paddingHorizontal: 20,
                fontFamily: 'Montserrat_400Regular',
              }}>
                Créez votre compte pour accéder aux meilleurs événements
              </Text>
            </View>

            {/* Formulaire d'inscription */}
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
                Créer un compte
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

              {/* Champs Prénom et Nom */}
              <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: theme.colors.onSurface,
                    marginBottom: 8,
                    fontFamily: 'Montserrat_500Medium',
                  }}>
                    Prénom
                  </Text>
                  <Controller
                    control={control}
                    name="firstName"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: theme.colors.surface,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: errors.firstName ? theme.colors.error : theme.colors.outline,
                        paddingHorizontal: 16,
                      }}>
                        <Ionicons
                          name="person-outline"
                          size={20}
                          color={errors.firstName ? theme.colors.error : theme.colors.onSurfaceVariant}
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
                          placeholder="Prénom"
                          placeholderTextColor={theme.colors.onSurfaceVariant}
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          autoCapitalize="words"
                          autoCorrect={false}
                        />
                      </View>
                    )}
                  />
                  {errors.firstName && (
                    <Text style={{
                      color: theme.colors.error,
                      fontSize: 12,
                      marginTop: 4,
                      fontFamily: 'Montserrat_400Regular',
                    }}>
                      {errors.firstName.message}
                    </Text>
                  )}
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: theme.colors.onSurface,
                    marginBottom: 8,
                    fontFamily: 'Montserrat_500Medium',
                  }}>
                    Nom
                  </Text>
                  <Controller
                    control={control}
                    name="lastName"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: theme.colors.surface,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: errors.lastName ? theme.colors.error : theme.colors.outline,
                        paddingHorizontal: 16,
                      }}>
                        <Ionicons
                          name="person-outline"
                          size={20}
                          color={errors.lastName ? theme.colors.error : theme.colors.onSurfaceVariant}
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
                          placeholder="Nom"
                          placeholderTextColor={theme.colors.onSurfaceVariant}
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          autoCapitalize="words"
                          autoCorrect={false}
                        />
                      </View>
                    )}
                  />
                  {errors.lastName && (
                    <Text style={{
                      color: theme.colors.error,
                      fontSize: 12,
                      marginTop: 4,
                      fontFamily: 'Montserrat_400Regular',
                    }}>
                      {errors.lastName.message}
                    </Text>
                  )}
                </View>
              </View>


              {/* Champ Téléphone */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: theme.colors.onSurface,
                  marginBottom: 8,
                  fontFamily: 'Montserrat_500Medium',
                }}>
                  Téléphone
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
                  }}>
                    {errors.password.message}
                  </Text>
                )}
              </View>

              {/* Champ Confirmation mot de passe */}
              <View style={{ marginBottom: 30 }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: theme.colors.onSurface,
                  marginBottom: 8,
                  fontFamily: 'Montserrat_500Medium',
                }}>
                  Confirmer le mot de passe
                </Text>
                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: theme.colors.surface,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: errors.confirmPassword ? theme.colors.error : theme.colors.outline,
                      paddingHorizontal: 16,
                    }}>
                      <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color={errors.confirmPassword ? theme.colors.error : theme.colors.onSurfaceVariant}
                        style={{ marginRight: 12 }}
                      />
                      <TextInput
                        style={{
                          flex: 1,
                          paddingVertical: 16,
                          fontSize: 16,
                          color: theme.colors.onSurface,
                        }}
                        placeholder="Confirmer votre mot de passe"
                        placeholderTextColor={theme.colors.onSurfaceVariant}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{ padding: 4 }}
                      >
                        <Ionicons
                          name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                          size={20}
                          color={theme.colors.onSurfaceVariant}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                />
                {errors.confirmPassword && (
                  <Text style={{
                    color: theme.colors.error,
                    fontSize: 12,
                    marginTop: 4,
                  }}>
                    {errors.confirmPassword.message}
                  </Text>
                )}
              </View>

              {/* Bouton d'inscription */}
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
                  {isLoading ? 'Création du compte...' : 'Créer mon compte'}
                </Text>
              </TouchableOpacity>


              {/* Lien vers la connexion */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'center',
                marginTop: 30,
                marginBottom: 20,
              }}>
                <Text style={{
                  color: theme.colors.onSurfaceVariant,
                  fontSize: 14,
                  fontFamily: 'Montserrat_400Regular',
                }}>
                  Déjà un compte ?{' '}
                </Text>
                <TouchableOpacity
                  onPress={() => {/* Navigation vers la connexion */}}
                >
                  <Text style={{
                    color: theme.colors.primary,
                    fontSize: 14,
                    fontWeight: '500',
                    fontFamily: 'Montserrat_500Medium',
                  }}>
                    Se connecter
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

export default RegisterScreen;

