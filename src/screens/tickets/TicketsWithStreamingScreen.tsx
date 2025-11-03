import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useStreamingAccess } from '../../hooks/useStreamingAccess';
import { streamingAccessService } from '../../services/streaming/streamingAccess';
import { brandColors, typography, borderRadius, shadows } from '../../constants/theme';

interface TicketWithStreaming {
  _id: string;
  ticketNumber: string;
  status: string;
  quantity: number;
  totalAmount: number;
  currency: string;
  validUntil: string;
  event: {
    _id: string;
    title: string;
    startDate: string;
    endDate: string;
    media: {
      poster: string;
    };
  };
  streamingAccess: {
    success: boolean;
    hasAccess: boolean;
    error?: {
      message: string;
    };
  };
}

const TicketsWithStreamingScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketWithStreaming[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const result = await streamingAccessService.getMyTicketsWithStreaming();
      
      if (result.success && result.data) {
        setTickets(result.data.tickets);
      } else {
        Alert.alert('Erreur', result.error?.message || 'Impossible de charger les billets');
      }
    } catch (error) {
      console.error('Erreur chargement billets:', error);
      Alert.alert('Erreur', 'Erreur lors du chargement des billets');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTickets();
    setRefreshing(false);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleTicketPress = (ticket: TicketWithStreaming) => {
    if (ticket.streamingAccess.hasAccess) {
      // Navigation vers l'écran de streaming
      (navigation as any).navigate('StreamingScreen', {
        ticketId: ticket._id,
        eventId: ticket.event._id,
        eventTitle: ticket.event.title,
      });
    } else {
      Alert.alert(
        'Accès non disponible',
        ticket.streamingAccess.error?.message || 'Vous n\'avez pas accès au streaming pour ce billet',
        [{ text: 'OK' }]
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return brandColors.success;
      case 'pending':
        return brandColors.warning;
      case 'used':
        return brandColors.mediumGray;
      case 'cancelled':
        return brandColors.error;
      default:
        return brandColors.mediumGray;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmé';
      case 'pending':
        return 'En attente';
      case 'used':
        return 'Utilisé';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTicket = ({ item: ticket }: { item: TicketWithStreaming }) => (
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
        
        {ticket.streamingAccess.hasAccess && (
          <View style={styles.streamingBadge}>
            <Ionicons name="videocam" size={16} color={brandColors.white} />
            <Text style={styles.streamingText}>STREAMING</Text>
          </View>
        )}
      </View>

      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle} numberOfLines={2}>
          {ticket.event.title}
        </Text>
        <Text style={styles.eventDate}>
          {formatDate(ticket.event.startDate)}
        </Text>
      </View>

      <View style={styles.ticketDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="ticket" size={16} color={brandColors.mediumGray} />
          <Text style={styles.detailText}>
            {ticket.quantity} billet{ticket.quantity > 1 ? 's' : ''}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="cash" size={16} color={brandColors.mediumGray} />
          <Text style={styles.detailText}>
            {ticket.totalAmount.toLocaleString()} {ticket.currency}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="time" size={16} color={brandColors.mediumGray} />
          <Text style={styles.detailText}>
            Valide jusqu'au {formatDate(ticket.validUntil)}
          </Text>
        </View>
      </View>

      <View style={styles.ticketActions}>
        {ticket.streamingAccess.hasAccess ? (
          <View style={styles.streamingButton}>
            <Ionicons name="play-circle" size={20} color={brandColors.white} />
            <Text style={styles.streamingButtonText}>Accéder au streaming</Text>
          </View>
        ) : (
          <View style={styles.noAccessButton}>
            <Ionicons name="lock-closed" size={20} color={brandColors.mediumGray} />
            <Text style={styles.noAccessText}>Accès non disponible</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="ticket-outline" size={64} color={brandColors.lightGray} />
      <Text style={styles.emptyStateTitle}>Aucun billet trouvé</Text>
      <Text style={styles.emptyStateDescription}>
        Vous n'avez pas encore acheté de billets pour des événements avec streaming.
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => (navigation as any).navigate('Events')}
      >
        <Text style={styles.exploreButtonText}>Explorer les événements</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[brandColors.primary, '#FF8A50']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color={brandColors.white} />
          </TouchableOpacity>
          
          <View style={styles.headerMain}>
            <Text style={styles.headerTitle}>Mes Billets</Text>
            <Text style={styles.headerSubtitle}>
              Accès au streaming inclus
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <FlatList
        data={tickets}
        renderItem={renderTicket}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={!loading ? renderEmptyState : null}
        showsVerticalScrollIndicator={false}
      />
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  headerMain: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_400Regular',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  listContainer: {
    padding: 20,
  },
  ticketCard: {
    backgroundColor: brandColors.white,
    borderRadius: borderRadius.xl,
    padding: 20,
    marginBottom: 16,
    ...shadows.lg,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketNumber: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.darkGray,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.white,
  },
  streamingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brandColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  streamingText: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
  },
  eventInfo: {
    marginBottom: 16,
  },
  eventTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.darkGray,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
  },
  ticketDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
  },
  ticketActions: {
    marginTop: 8,
  },
  streamingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brandColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: borderRadius.lg,
    gap: 8,
  },
  streamingButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.white,
  },
  noAccessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brandColors.lightGray,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: borderRadius.lg,
    gap: 8,
  },
  noAccessText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.mediumGray,
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
  },
  emptyStateDescription: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: brandColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: borderRadius.lg,
  },
  exploreButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.white,
  },
});

export default TicketsWithStreamingScreen;
