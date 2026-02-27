import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { brandColors, typography, borderRadius, shadows } from '../../constants/theme';
import { paymentService, PaymentRequest, PaymentResponse, PaymentStatus } from '../../services/payments';
import { eventService } from '../../services/events';
import { Event } from '../../types';
import { PAYMENT_METHODS, CURRENCIES } from '../../constants';
import Button from '../../components/ui/Button';
import EventImage from '../../components/ui/EventImage';

const { width } = Dimensions.get('window');

type PaymentMethod = 'mtn_momo' | 'airtel_money' | 'stripe' | 'paypal' | 'pawapay';

interface PaymentMethodOption {
  value: PaymentMethod;
  label: string;
  icon: string;
  description: string;
  color: string;
}

const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  {
    value: 'pawapay',
    label: 'Pawapay',
    icon: 'wallet',
    description: 'Paiement mobile sécurisé',
    color: '#FF6600',
  },
  {
    value: 'mtn_momo',
    label: 'MTN Mobile Money',
    icon: 'phone-portrait',
    description: 'Paiement via MTN',
    color: '#FFCC00',
  },
  {
    value: 'airtel_money',
    label: 'Airtel Money',
    icon: 'phone-portrait',
    description: 'Paiement via Airtel',
    color: '#E60012',
  },
  {
    value: 'stripe',
    label: 'Carte Bancaire',
    icon: 'card',
    description: 'Visa, Mastercard, etc.',
    color: '#635BFF',
  },
  {
    value: 'paypal',
    label: 'PayPal',
    icon: 'logo-paypal',
    description: 'Paiement PayPal',
    color: '#0070BA',
  },
];

const PaymentScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { eventId, quantity = 1 } = (route.params as any) || {};

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (eventId) {
      loadEventDetails();
    } else {
      Alert.alert('Erreur', 'Aucun événement sélectionné', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  }, [eventId]);

  const loadEventDetails = async () => {
    try {
      setLoading(true);
      const response = await eventService.getEventById(eventId);
      if (response.event) {
        setEvent(response.event);
      } else {
        Alert.alert('Erreur', 'Événement non trouvé', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error: any) {
      console.error('Erreur chargement événement:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'événement', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (): number => {
    if (!event) return 0;
    const unitPrice = event.pricing?.price?.amount || 0;
    return unitPrice * quantity;
  };

  const getCurrency = (): 'CDF' | 'USD' | 'EUR' => {
    if (!event) return 'CDF';
    return (event.pricing?.price?.currency as 'CDF' | 'USD' | 'EUR') || 'CDF';
  };

  const formatAmount = (amount: number): string => {
    const currency = getCurrency();
    const symbol = CURRENCIES[currency]?.symbol || currency;
    return `${symbol} ${amount.toLocaleString()}`;
  };

  const validateForm = (): boolean => {
    if (!selectedMethod) {
      Alert.alert('Erreur', 'Veuillez sélectionner une méthode de paiement');
      return false;
    }

    if (selectedMethod === 'mtn_momo' || selectedMethod === 'airtel_money' || selectedMethod === 'pawapay') {
      if (!phoneNumber.trim()) {
        Alert.alert('Erreur', 'Veuillez saisir votre numéro de téléphone');
        return false;
      }
      const operator = selectedMethod === 'mtn_momo' ? 'mtn' : selectedMethod === 'airtel_money' ? 'airtel' : 'mtn';
      if (!paymentService.validatePhoneNumber(phoneNumber, operator)) {
        Alert.alert('Erreur', 'Numéro de téléphone invalide');
        return false;
      }
    }

    if (selectedMethod === 'stripe' || selectedMethod === 'paypal') {
      if (!email.trim()) {
        Alert.alert('Erreur', 'Veuillez saisir votre adresse email');
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Alert.alert('Erreur', 'Adresse email invalide');
        return false;
      }
    }

    return true;
  };

  const handlePayment = async () => {
    if (!validateForm() || !event || !selectedMethod) return;

    try {
      setProcessing(true);

      const paymentRequest: PaymentRequest = {
        eventId: event.id,
        quantity,
        method: selectedMethod,
        currency: getCurrency(),
        phoneNumber: selectedMethod === 'mtn_momo' || selectedMethod === 'airtel_money' || selectedMethod === 'pawapay' 
          ? paymentService.formatPhoneNumber(phoneNumber) 
          : undefined,
        email: selectedMethod === 'stripe' || selectedMethod === 'paypal' ? email : undefined,
      };

      // Note: Le backend utilise /payments/create et /payments/:paymentId/process
      // On doit adapter selon l'API réelle
      const response = await paymentService.initiatePayment(paymentRequest);

      if (response.paymentId) {
        // Pour Mobile Money et Pawapay, on poll le statut
        if (selectedMethod === 'mtn_momo' || selectedMethod === 'airtel_money' || selectedMethod === 'pawapay') {
          startPolling(response.paymentId);
        } else {
          // Pour Stripe/PayPal, rediriger vers l'URL de paiement
          if (response.paymentUrl) {
            // Ouvrir le navigateur ou WebView pour le paiement
            Alert.alert(
              'Paiement',
              'Vous allez être redirigé vers la page de paiement',
              [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Continuer', onPress: () => {
                  // TODO: Ouvrir WebView ou navigateur
                  console.log('Ouvrir:', response.paymentUrl);
                }},
              ]
            );
          }
        }
      }
    } catch (error: any) {
      console.error('Erreur paiement:', error);
      Alert.alert('Erreur', error.message || 'Une erreur est survenue lors du paiement');
    } finally {
      setProcessing(false);
    }
  };

  const startPolling = (paymentId: string) => {
    setPolling(true);
    setPaymentStatus(null);

    paymentService.pollPaymentStatus(
      paymentId,
      (status) => {
        setPaymentStatus(status);
        if (status.status === 'completed') {
          setPolling(false);
          Alert.alert(
            'Paiement réussi !',
            'Votre billet a été acheté avec succès',
            [
              {
                text: 'Voir mes billets',
                onPress: () => {
                  navigation.navigate('Tickets' as never);
                },
              },
              {
                text: 'OK',
                onPress: () => navigation.goBack(),
              },
            ]
          );
        } else if (status.status === 'failed') {
          setPolling(false);
          Alert.alert('Paiement échoué', status.failureReason || 'Le paiement a échoué');
        }
      },
      5000, // Poll toutes les 5 secondes
      60 // Maximum 60 tentatives (5 minutes)
    ).catch((error) => {
      setPolling(false);
      console.error('Erreur polling:', error);
      Alert.alert('Erreur', 'Impossible de vérifier le statut du paiement');
    });
  };

  const renderPaymentMethod = (method: PaymentMethodOption) => {
    const isSelected = selectedMethod === method.value;
    return (
      <TouchableOpacity
        style={[
          styles.paymentMethodCard,
          isSelected && styles.paymentMethodCardSelected,
        ]}
        onPress={() => setSelectedMethod(method.value)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={isSelected ? [`${method.color}15`, `${method.color}05`] : ['transparent', 'transparent']}
          style={styles.paymentMethodGradient}
        >
          <View style={[styles.paymentMethodIcon, { backgroundColor: `${method.color}15` }]}>
            <Ionicons name={method.icon as any} size={28} color={method.color} />
          </View>
          <View style={styles.paymentMethodInfo}>
            <Text style={[styles.paymentMethodLabel, isSelected && styles.paymentMethodLabelSelected]}>
              {method.label}
            </Text>
            <Text style={styles.paymentMethodDescription}>{method.description}</Text>
          </View>
          {isSelected && (
            <View style={[styles.checkIcon, { backgroundColor: brandColors.primary }]}>
              <Ionicons name="checkmark" size={18} color={brandColors.white} />
            </View>
          )}
          {!isSelected && (
            <View style={styles.radioIcon}>
              <View style={styles.radioOuter} />
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderPaymentForm = () => {
    if (!selectedMethod) return null;

    if (selectedMethod === 'mtn_momo' || selectedMethod === 'airtel_money' || selectedMethod === 'pawapay') {
      return (
        <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.formContainer}>
          <View style={styles.formHeader}>
            <Ionicons name="call-outline" size={18} color={brandColors.primary} />
            <Text style={styles.formLabel}>Numéro de téléphone</Text>
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="phone-portrait" size={20} color={brandColors.mediumGray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="+242 65 644 210"
              placeholderTextColor={brandColors.mediumGray}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              autoComplete="tel"
            />
          </View>
          <View style={styles.formHintContainer}>
            <Ionicons name="information-circle-outline" size={14} color={brandColors.mediumGray} />
            <Text style={styles.formHint}>
              Format: +242 65 644 210 ou 065 644 210
            </Text>
          </View>
        </Animated.View>
      );
    }

    if (selectedMethod === 'stripe' || selectedMethod === 'paypal') {
      return (
        <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.formContainer}>
          <View style={styles.formHeader}>
            <Ionicons name="mail-outline" size={18} color={brandColors.primary} />
            <Text style={styles.formLabel}>Adresse email</Text>
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={20} color={brandColors.mediumGray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="votre@email.com"
              placeholderTextColor={brandColors.mediumGray}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              autoCapitalize="none"
            />
          </View>
        </Animated.View>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brandColors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={brandColors.error} />
          <Text style={styles.errorText}>Événement non trouvé</Text>
          <Button
            label="Retour"
            onPress={() => navigation.goBack()}
            variant="primary"
            style={{ marginTop: 20 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const total = calculateTotal();
  const currency = getCurrency();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header avec gradient */}
          <LinearGradient
            colors={[brandColors.primary, '#FF8A50']}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <SafeAreaView edges={['top']}>
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <Ionicons name="arrow-back" size={24} color={brandColors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Paiement</Text>
                <View style={styles.backButton} />
              </View>
            </SafeAreaView>
          </LinearGradient>

          {/* Event Card avec image */}
          <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.eventCardContainer}>
            <View style={styles.eventImageContainer}>
              <EventImage
                posterUrl={event.media?.poster}
                eventId={event.id}
                style={styles.eventImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.eventImageGradient}
              />
              <View style={styles.eventImageContent}>
                <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
                <View style={styles.eventMeta}>
                  <View style={styles.eventMetaItem}>
                    <Ionicons name="calendar-outline" size={14} color={brandColors.white} />
                    <Text style={styles.eventMetaText}>
                      {new Date(event.startDate).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                  {event.location?.venue && (
                    <View style={styles.eventMetaItem}>
                      <Ionicons name="location-outline" size={14} color={brandColors.white} />
                      <Text style={styles.eventMetaText} numberOfLines={1}>
                        {event.location.venue}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Summary Card */}
          <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Ionicons name="receipt-outline" size={20} color={brandColors.primary} />
              <Text style={styles.summaryHeaderTitle}>Récapitulatif</Text>
            </View>
            <View style={styles.summaryContent}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Quantité</Text>
                <Text style={styles.summaryValue}>{quantity} billet{quantity > 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Prix unitaire</Text>
                <Text style={styles.summaryValue}>
                  {formatAmount(event.pricing?.price?.amount || 0)}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total à payer</Text>
                <Text style={styles.totalValue}>{formatAmount(total)}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Payment Methods */}
          <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="wallet-outline" size={20} color={brandColors.primary} />
              <Text style={styles.sectionTitle}>Méthode de paiement</Text>
            </View>
            {PAYMENT_METHOD_OPTIONS.map((method, index) => (
              <Animated.View
                key={method.value}
                entering={FadeInDown.delay(300 + index * 50).springify()}
              >
                {renderPaymentMethod(method)}
              </Animated.View>
            ))}
          </Animated.View>

          {/* Payment Form */}
          {renderPaymentForm()}

          {/* Payment Status (if polling) */}
          {polling && (
            <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.statusContainer}>
              <View style={styles.statusCard}>
                <ActivityIndicator size="large" color={brandColors.primary} />
                <Text style={styles.statusText}>Vérification du paiement...</Text>
                {paymentStatus && (
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>
                      {paymentStatus.status === 'pending' ? '⏳ En attente' : 
                       paymentStatus.status === 'processing' ? '🔄 Traitement en cours' : 
                       paymentStatus.status === 'completed' ? '✅ Complété' :
                       paymentStatus.status}
                    </Text>
                  </View>
                )}
                <Text style={styles.statusSubtext}>
                  Veuillez patienter, nous vérifions votre paiement...
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Pay Button */}
          {!polling && (
            <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.buttonContainer}>
              <LinearGradient
                colors={[brandColors.primary, '#FF8A50']}
                style={styles.payButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <TouchableOpacity
                  style={[styles.payButtonTouchable, (!selectedMethod || processing) && styles.payButtonDisabled]}
                  onPress={handlePayment}
                  disabled={!selectedMethod || processing}
                  activeOpacity={0.8}
                >
                  {processing ? (
                    <ActivityIndicator size="small" color={brandColors.white} />
                  ) : (
                    <>
                      <Ionicons name="lock-closed" size={20} color={brandColors.white} />
                      <Text style={styles.payButtonText}>
                        Payer {formatAmount(total)}
                      </Text>
                      <Ionicons name="arrow-forward" size={20} color={brandColors.white} />
                    </>
                  )}
                </TouchableOpacity>
              </LinearGradient>
              <View style={styles.securityBadge}>
                <Ionicons name="shield-checkmark" size={14} color={brandColors.success} />
                <Text style={styles.securityText}>Paiement sécurisé</Text>
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.lightGray,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: brandColors.mediumGray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.medium,
    color: brandColors.darkGray,
    textAlign: 'center',
  },
  headerGradient: {
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: brandColors.white,
  },
  eventCardContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  eventImageContainer: {
    height: 200,
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventImageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  eventImageContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  eventTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: brandColors.white,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  eventMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  eventMetaText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: brandColors.white,
  },
  summaryCard: {
    backgroundColor: brandColors.white,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.lightGray,
  },
  summaryHeaderTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: brandColors.darkGray,
  },
  summaryContent: {
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: brandColors.mediumGray,
  },
  summaryValue: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
    color: brandColors.darkGray,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: brandColors.lightGray,
    marginVertical: 12,
  },
  totalRow: {
    marginTop: 4,
  },
  totalLabel: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: brandColors.darkGray,
  },
  totalValue: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: brandColors.primary,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: brandColors.darkGray,
  },
  paymentMethodCard: {
    marginBottom: 12,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  paymentMethodGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brandColors.white,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentMethodCardSelected: {
    borderColor: brandColors.primary,
    ...shadows.md,
  },
  paymentMethodIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodLabel: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
    color: brandColors.darkGray,
    marginBottom: 4,
  },
  paymentMethodLabelSelected: {
    color: brandColors.primary,
  },
  paymentMethodDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: brandColors.mediumGray,
  },
  checkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  radioIcon: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: brandColors.mediumGray,
  },
  formContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  formLabel: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
    color: brandColors.darkGray,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brandColors.white,
    borderWidth: 2,
    borderColor: brandColors.lightGray,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  inputIcon: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    padding: 16,
    paddingLeft: 12,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: brandColors.darkGray,
  },
  formHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingLeft: 4,
  },
  formHint: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: brandColors.mediumGray,
    flex: 1,
  },
  statusContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  statusCard: {
    backgroundColor: brandColors.white,
    borderRadius: borderRadius.xl,
    padding: 24,
    alignItems: 'center',
    ...shadows.md,
  },
  statusText: {
    marginTop: 16,
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: brandColors.darkGray,
  },
  statusBadge: {
    marginTop: 12,
    backgroundColor: brandColors.lightOrange,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
  },
  statusBadgeText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: brandColors.primary,
  },
  statusSubtext: {
    marginTop: 12,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: brandColors.mediumGray,
    textAlign: 'center',
  },
  buttonContainer: {
    marginHorizontal: 20,
    marginTop: 32,
    marginBottom: 20,
  },
  payButtonGradient: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  payButtonTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: brandColors.white,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  securityText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: brandColors.mediumGray,
  },
});

export default PaymentScreen;
