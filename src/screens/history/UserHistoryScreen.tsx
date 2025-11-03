import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useUserHistory } from '../../hooks/useUserHistory';
import { brandColors, typography, borderRadius, shadows } from '../../constants/theme';
import { UserHistory, HistoryFilters } from '../../services/history';

const UserHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  const { 
    history, 
    stats, 
    pagination, 
    loading, 
    error, 
    loadHistory, 
    deleteHistoryEntry, 
    clearHistory,
    exportHistory 
  } = useUserHistory();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<HistoryFilters['type'] | 'all'>('all');

  const onRefresh = async () => {
    setRefreshing(true);
    const filters: HistoryFilters = selectedFilter !== 'all' ? { type: selectedFilter } : {};
    await loadHistory(1, filters);
    setRefreshing(false);
  };

  const handleFilterChange = (filter: HistoryFilters['type'] | 'all') => {
    setSelectedFilter(filter);
    const filters: HistoryFilters = filter !== 'all' ? { type: filter } : {};
    loadHistory(1, filters);
  };

  const handleDeleteEntry = (entry: UserHistory) => {
    Alert.alert(
      'Supprimer l\'entrée',
      'Voulez-vous supprimer cette entrée de l\'historique ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHistoryEntry(entry.id);
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer l\'entrée');
            }
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Vider l\'historique',
      'Voulez-vous supprimer tout votre historique ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Vider tout',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearHistory();
              Alert.alert('Succès', 'Historique vidé avec succès');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de vider l\'historique');
            }
          },
        },
      ]
    );
  };

  const handleExport = async () => {
    Alert.alert(
      'Exporter l\'historique',
      'Choisissez le format d\'export',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'JSON',
          onPress: async () => {
            try {
              const downloadUrl = await exportHistory('json');
              Alert.alert('Succès', `Fichier exporté: ${downloadUrl}`);
            } catch (error) {
              Alert.alert('Erreur', 'Impossible d\'exporter l\'historique');
            }
          },
        },
        {
          text: 'CSV',
          onPress: async () => {
            try {
              const downloadUrl = await exportHistory('csv');
              Alert.alert('Succès', `Fichier exporté: ${downloadUrl}`);
            } catch (error) {
              Alert.alert('Erreur', 'Impossible d\'exporter l\'historique');
            }
          },
        },
      ]
    );
  };

  const getHistoryIcon = (type: string) => {
    switch (type) {
      case 'event_view':
        return 'eye';
      case 'event_purchase':
        return 'card';
      case 'streaming_watch':
        return 'videocam';
      case 'replay_watch':
        return 'play-circle';
      case 'favorite_add':
        return 'heart';
      case 'search':
        return 'search';
      default:
        return 'time';
    }
  };

  const getHistoryColor = (type: string) => {
    switch (type) {
      case 'event_view':
        return brandColors.info;
      case 'event_purchase':
        return brandColors.success;
      case 'streaming_watch':
        return brandColors.warning;
      case 'replay_watch':
        return brandColors.primary;
      case 'favorite_add':
        return brandColors.error;
      case 'search':
        return brandColors.mediumGray;
      default:
        return brandColors.primary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Il y a moins d\'une heure';
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)} heures`;
    } else if (diffInHours < 48) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    } else {
      return `${minutes}min`;
    }
  };

  const renderStatsCard = (title: string, value: string | number, icon: string, color: string) => (
    <View style={[styles.statsCard, { borderLeftColor: color }]}>
      <View style={[styles.statsIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <View style={styles.statsContent}>
        <Text style={styles.statsValue}>{value}</Text>
        <Text style={styles.statsTitle}>{title}</Text>
      </View>
    </View>
  );

  const renderFilterButton = (filter: HistoryFilters['type'] | 'all', label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive
      ]}
      onPress={() => handleFilterChange(filter)}
      activeOpacity={0.8}
    >
      <Text style={[
        styles.filterButtonText,
        selectedFilter === filter && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderHistoryItem = ({ item }: { item: UserHistory }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyContent}>
        <View style={[
          styles.historyIcon,
          { backgroundColor: getHistoryColor(item.type) + '15' }
        ]}>
          <Ionicons 
            name={getHistoryIcon(item.type) as any} 
            size={20} 
            color={getHistoryColor(item.type)} 
          />
        </View>
        
        <View style={styles.historyText}>
          <Text style={styles.historyAction}>{item.action}</Text>
          {item.eventTitle && (
            <Text style={styles.historyEvent} numberOfLines={1}>
              {item.eventTitle}
            </Text>
          )}
          {item.metadata?.searchQuery && (
            <Text style={styles.historyEvent} numberOfLines={1}>
              "{item.metadata.searchQuery}"
            </Text>
          )}
          {item.metadata?.duration && (
            <Text style={styles.historyMetadata}>
              Durée: {formatDuration(item.metadata.duration)}
            </Text>
          )}
          {item.metadata?.purchaseAmount && (
            <Text style={styles.historyMetadata}>
              Montant: {item.metadata.purchaseAmount.toLocaleString()} FCFA
            </Text>
          )}
          <Text style={styles.historyDate}>
            {formatDate(item.timestamp)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteEntry(item)}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={18} color={brandColors.mediumGray} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="time-outline" size={80} color={brandColors.lightGray} />
      <Text style={styles.emptyStateTitle}>Aucun historique</Text>
      <Text style={styles.emptyStateSubtitle}>
        Votre historique d'activité apparaîtra ici
      </Text>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
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
            >
              <Ionicons name="arrow-back" size={24} color={brandColors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Historique</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>
        
        <View style={styles.authRequired}>
          <Ionicons name="lock-closed" size={60} color={brandColors.lightGray} />
          <Text style={styles.authRequiredTitle}>Connexion requise</Text>
          <Text style={styles.authRequiredSubtitle}>
            Connectez-vous pour voir votre historique d'activité
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => (navigation as any).navigate('Login')}
            activeOpacity={0.8}
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={brandColors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Historique</Text>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExport}
            activeOpacity={0.8}
          >
            <Ionicons name="download-outline" size={20} color={brandColors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Statistiques */}
        {stats && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Statistiques</Text>
            <View style={styles.statsGrid}>
              {renderStatsCard(
                'Événements vus',
                stats.totalEventsViewed,
                'eye',
                brandColors.info
              )}
              {renderStatsCard(
                'Événements achetés',
                stats.totalEventsPurchased,
                'card',
                brandColors.success
              )}
              {renderStatsCard(
                'Temps de visionnage',
                formatDuration(stats.totalWatchTime),
                'time',
                brandColors.warning
              )}
              {renderStatsCard(
                'Total dépensé',
                `${stats.totalSpent.toLocaleString()} FCFA`,
                'cash',
                brandColors.primary
              )}
            </View>
          </View>
        )}

        {/* Filtres */}
        <View style={styles.filtersSection}>
          <Text style={styles.sectionTitle}>Filtrer par type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
            {renderFilterButton('all', 'Tout')}
            {renderFilterButton('event_view', 'Consultations')}
            {renderFilterButton('event_purchase', 'Achats')}
            {renderFilterButton('streaming_watch', 'Streaming')}
            {renderFilterButton('replay_watch', 'Replays')}
            {renderFilterButton('favorite_add', 'Favoris')}
            {renderFilterButton('search', 'Recherches')}
          </ScrollView>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleClearAll}
            activeOpacity={0.8}
          >
            <Ionicons name="trash" size={20} color={brandColors.error} />
            <Text style={[styles.actionButtonText, { color: brandColors.error }]}>
              Vider l'historique
            </Text>
          </TouchableOpacity>
        </View>

        {/* Liste de l'historique */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>
            Activité récente ({pagination.total} entrées)
          </Text>
          <FlatList
            data={history}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[brandColors.primary]}
                tintColor={brandColors.primary}
              />
            }
            ListEmptyComponent={!loading ? renderEmptyState : null}
          />
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    ...shadows.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    textTransform: 'none',
  },
  placeholder: {
    width: 40,
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  statsSection: {
    backgroundColor: brandColors.white,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.darkGray,
    marginBottom: 16,
    textTransform: 'none',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsCard: {
    width: '48%',
    backgroundColor: brandColors.lightGray + '10',
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statsContent: {
    flex: 1,
  },
  statsValue: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.darkGray,
    textTransform: 'none',
  },
  statsTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
    textTransform: 'none',
  },
  filtersSection: {
    backgroundColor: brandColors.white,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  filtersContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.lg,
    backgroundColor: brandColors.lightGray + '20',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: brandColors.primary,
  },
  filterButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.mediumGray,
    textTransform: 'none',
  },
  filterButtonTextActive: {
    color: brandColors.white,
  },
  actionsSection: {
    backgroundColor: brandColors.white,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: brandColors.error + '10',
    borderRadius: borderRadius.lg,
  },
  actionButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_600SemiBold',
    marginLeft: 12,
    textTransform: 'none',
  },
  historySection: {
    backgroundColor: brandColors.white,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  historyItem: {
    borderBottomWidth: 1,
    borderBottomColor: brandColors.lightGray + '30',
    paddingVertical: 16,
  },
  historyContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyText: {
    flex: 1,
    marginRight: 12,
  },
  historyAction: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.darkGray,
    marginBottom: 4,
    textTransform: 'none',
  },
  historyEvent: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
    marginBottom: 4,
    textTransform: 'none',
  },
  historyMetadata: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.lightGray,
    marginBottom: 4,
    textTransform: 'none',
  },
  historyDate: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.lightGray,
    textTransform: 'none',
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.darkGray,
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'none',
  },
  emptyStateSubtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
    textAlign: 'center',
    lineHeight: 22,
    textTransform: 'none',
  },
  authRequired: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  authRequiredTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.darkGray,
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'none',
  },
  authRequiredSubtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    textTransform: 'none',
  },
  loginButton: {
    backgroundColor: brandColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: borderRadius.lg,
  },
  loginButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.white,
    textTransform: 'none',
  },
});

export default UserHistoryScreen;
