import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { brandColors, typography, borderRadius, shadows } from '../../constants/theme';
import { ticketService } from '../../services/tickets';
import { Ticket } from '../../types';

const { width } = Dimensions.get('window');

const TicketsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'confirmed' | 'used' | 'cancelled'>('all');

  useEffect(() => {
    if (isAuthenticated) {
      loadTickets();
    }
  }, [isAuthenticated]);

  const loadTickets = async () => {
    try {
      console.log('🔄 Chargement des billets...');
      const response = await ticketService.getUserTickets(1, 50);
      
      console.log('✅ Billets reçus:', response.tickets.length);
      setTickets(response.tickets);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des billets:', error);
      
      // Fallback vers des données mockées pour les tests
      const mockTickets: Ticket[] = [
        {
          id: '1',
          user: 'user123',
          event: 'event1',
          payment: 'payment1',
          ticketNumber: 'TKT-001-2024',
          qrCode: 'QR123456789',
          quantity: 1,
          unitPrice: 25000,
          totalAmount: 25000,
          currency: 'CDF',
          status: 'confirmed',
          access: {
            canAccessLive: true,
            canAccessReplay: true,
            accessToken: 'access_token_123',
            accessExpiresAt: '2024-12-31T23:59:59Z',
          },
          usage: {
            firstAccessAt: '2024-01-15T20:00:00Z',
            lastAccessAt: '2024-01-15T22:00:00Z',
            totalWatchTime: 7200000, // 2 heures en millisecondes
            accessCount: 1,
            isUsed: false,
          },
          metadata: {
            purchaseMethod: 'mobile_money',
            deviceInfo: {
              platform: 'ios',
            },
          },
          validFrom: '2024-01-15T19:00:00Z',
          validUntil: '2024-01-15T23:00:00Z',
          refund: {
            isRefundable: true,
            refundDeadline: '2024-01-14T23:59:59Z',
            refundAmount: 25000,
          },
          createdAt: '2024-01-10T10:00:00Z',
          updatedAt: '2024-01-15T20:00:00Z',
        },
        {
          id: '2',
          user: 'user123',
          event: 'event2',
          payment: 'payment2',
          ticketNumber: 'TKT-002-2024',
          qrCode: 'QR987654321',
          quantity: 2,
          unitPrice: 0,
          totalAmount: 0,
          currency: 'CDF',
          status: 'used',
          access: {
            canAccessLive: true,
            canAccessReplay: true,
            accessToken: 'access_token_456',
            accessExpiresAt: '2024-12-31T23:59:59Z',
          },
          usage: {
            firstAccessAt: '2024-01-20T18:00:00Z',
            lastAccessAt: '2024-01-20T21:30:00Z',
            totalWatchTime: 12600000, // 3.5 heures
            accessCount: 2,
            isUsed: true,
            usedAt: '2024-01-20T21:30:00Z',
          },
          metadata: {
            purchaseMethod: 'mobile_money',
            deviceInfo: {
              platform: 'ios',
            },
          },
          validFrom: '2024-01-20T17:00:00Z',
          validUntil: '2024-01-20T22:00:00Z',
          refund: {
            isRefundable: false,
            refundDeadline: '2024-01-19T23:59:59Z',
            refundAmount: 0,
          },
          createdAt: '2024-01-15T14:00:00Z',
          updatedAt: '2024-01-20T21:30:00Z',
        },
      ];

      setTickets(mockTickets);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTickets();
    setRefreshing(false);
  };

  const handleTicketPress = (ticket: Ticket) => {
    // Navigation vers les détails du billet
    (navigation as any).navigate('TicketDetails', { ticketId: ticket.id });
  };

  const handleQRCodePress = (ticket: Ticket) => {
    Alert.alert(
      'QR Code',
      `Code QR: ${ticket.qrCode}\n\nNuméro de billet: ${ticket.ticketNumber}`,
      [
        { text: 'Fermer', style: 'cancel' },
        { text: 'Partager', onPress: () => console.log('Partager QR code') },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return brandColors.success;
      case 'used':
        return brandColors.primary;
      case 'cancelled':
        return brandColors.error;
      case 'pending':
        return brandColors.warning;
      default:
        return brandColors.mediumGray;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmé';
      case 'used':
        return 'Utilisé';
      case 'cancelled':
        return 'Annulé';
      case 'pending':
        return 'En attente';
      default:
        return status;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    switch (selectedFilter) {
      case 'confirmed':
        return ticket.status === 'confirmed';
      case 'used':
        return ticket.status === 'used';
      case 'cancelled':
        return ticket.status === 'cancelled';
      default:
        return true;
    }
  });

  const renderFilterButton = (filter: 'all' | 'confirmed' | 'used' | 'cancelled', label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.activeFilterButton,
      ]}
      onPress={() => setSelectedFilter(filter)}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.filterButtonText,
          selectedFilter === filter && styles.activeFilterButtonText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderTicketCard = ({ item: ticket }: { item: Ticket }) => (
    <TouchableOpacity
      style={styles.ticketCard}
      onPress={() => handleTicketPress(ticket)}
      activeOpacity={0.8}
    >
      <View style={styles.ticketHeader}>
        <View style={styles.ticketInfo}>
          <Text style={styles.ticketNumber}>{ticket.ticketNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
            <Text style={styles.statusText}>{getStatusText(ticket.status)}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.qrButton}
          onPress={() => handleQRCodePress(ticket)}
          activeOpacity={0.8}
        >
          <Ionicons name="qr-code" size={24} color={brandColors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.ticketContent}>
        <View style={styles.ticketDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={brandColors.mediumGray} />
            <Text style={styles.detailText}>
              {new Date(ticket.validFrom).toLocaleDateString('fr-FR')}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={brandColors.mediumGray} />
            <Text style={styles.detailText}>
              {new Date(ticket.validFrom).toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="people-outline" size={16} color={brandColors.mediumGray} />
            <Text style={styles.detailText}>
              {ticket.quantity} {ticket.quantity > 1 ? 'places' : 'place'}
            </Text>
          </View>
        </View>

        <View style={styles.ticketFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>
              {ticket.totalAmount > 0 
                ? `${ticket.totalAmount.toLocaleString()} ${ticket.currency}`
                : 'GRATUIT'
              }
            </Text>
          </View>
          {ticket.status === 'confirmed' && (
            <View style={styles.accessBadge}>
              <Ionicons name="checkmark-circle" size={16} color={brandColors.success} />
              <Text style={styles.accessText}>Accès autorisé</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="ticket-outline" size={64} color={brandColors.lightGray} />
          <Text style={styles.emptyStateTitle}>Connexion requise</Text>
          <Text style={styles.emptyStateDescription}>
            Connectez-vous pour voir vos billets
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login' as never)}
          >
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header avec gradient orange */}
      <LinearGradient
        colors={[brandColors.primary, '#FF8A50']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Mes billets</Text>
          <Text style={styles.headerSubtitle}>
            {tickets.length} billet{tickets.length > 1 ? 's' : ''}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Filtres */}
        <View style={styles.filtersContainer}>
          {renderFilterButton('all', 'Tous')}
          {renderFilterButton('confirmed', 'Confirmés')}
          {renderFilterButton('used', 'Utilisés')}
          {renderFilterButton('cancelled', 'Annulés')}
        </View>

        {/* Liste des billets */}
        <View style={styles.section}>
          {filteredTickets.length > 0 ? (
            <FlatList
              data={filteredTickets}
              renderItem={renderTicketCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="ticket-outline" size={64} color={brandColors.lightGray} />
              <Text style={styles.emptyStateTitle}>Aucun billet trouvé</Text>
              <Text style={styles.emptyStateDescription}>
                {selectedFilter === 'all' 
                  ? 'Vous n\'avez pas encore de billets'
                  : `Aucun billet ${selectedFilter} trouvé`
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
    ...shadows.md,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    marginBottom: 4,
    textTransform: 'none',
  },
  headerSubtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_400Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    textTransform: 'none',
  },
  content: {
    flex: 1,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.lg,
    backgroundColor: brandColors.white,
    borderWidth: 1,
    borderColor: brandColors.lightGray,
  },
  activeFilterButton: {
    backgroundColor: brandColors.primary,
    borderColor: brandColors.primary,
  },
  filterButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: brandColors.mediumGray,
  },
  activeFilterButtonText: {
    color: brandColors.white,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  ticketCard: {
    backgroundColor: brandColors.white,
    borderRadius: borderRadius.xl,
    padding: 16,
    marginBottom: 16,
    ...shadows.lg,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketNumber: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.darkGray,
    marginBottom: 4,
    textTransform: 'none',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.white,
    textTransform: 'none',
  },
  qrButton: {
    padding: 8,
    borderRadius: borderRadius.md,
    backgroundColor: brandColors.primary + '15',
  },
  ticketContent: {
    gap: 12,
  },
  ticketDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
    textTransform: 'none',
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: brandColors.lightGray,
  },
  priceContainer: {
    backgroundColor: brandColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
  },
  priceText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    textTransform: 'none',
  },
  accessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  accessText: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.success,
    textTransform: 'none',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.darkGray,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    textTransform: 'none',
  },
  emptyStateDescription: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    textTransform: 'none',
  },
  loginButton: {
    backgroundColor: brandColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  loginButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.white,
    textTransform: 'none',
  },
});

export default TicketsScreen;
