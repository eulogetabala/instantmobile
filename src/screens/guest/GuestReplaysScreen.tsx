import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { brandColors, typography, borderRadius, shadows } from '../../constants/theme';

interface ReplayEvent {
  id: string;
  title: string;
  description: string;
  duration: string;
  views: number;
  price: number;
  isFree: boolean;
  image: any;
  category: string;
  date: string;
  isNew: boolean;
}

const GuestReplaysScreen: React.FC = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [replays, setReplays] = useState<ReplayEvent[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'free' | 'paid'>('all');

  useEffect(() => {
    loadReplays();
  }, []);

  const loadReplays = async () => {
    // Simulation de données - synchronisées avec GuestHomeScreen (en version replay)
    const mockReplays: ReplayEvent[] = [
      {
        id: '1',
        title: 'Concert Gospel International - Replay',
        description: 'Un concert exceptionnel avec les plus grandes voix du gospel',
        duration: '2h',
        views: 15420,
        price: 0,
        isFree: true,
        image: require('../../../assets/images/1.jpg'),
        category: 'Concert',
        date: '2024-01-10',
        isNew: true,
      },
      {
        id: '2',
        title: 'Séminaire Leadership Premium - Replay',
        description: 'Développez vos compétences en leadership avec des experts internationaux',
        duration: '8h',
        views: 8750,
        price: 25000,
        isFree: false,
        image: require('../../../assets/images/2.jpg'),
        category: 'Formation',
        date: '2024-01-08',
        isNew: false,
      },
      {
        id: '3',
        title: 'Festival de Musique Traditionnelle - Replay',
        description: 'Découvrez la richesse de la musique traditionnelle',
        duration: '5h',
        views: 12300,
        price: 0,
        isFree: true,
        image: require('../../../assets/images/3.jpg'),
        category: 'Festival',
        date: '2024-01-05',
        isNew: false,
      },
      {
        id: '4',
        title: 'Conférence Tech Innovation - Replay',
        description: 'Les dernières tendances technologiques avec les leaders du secteur',
        duration: '4h',
        views: 6800,
        price: 35000,
        isFree: false,
        image: require('../../../assets/images/4.webp'),
        category: 'Conférence',
        date: '2024-01-03',
        isNew: true,
      },
      {
        id: '5',
        title: 'Masterclass Art Culinaire - Replay',
        description: 'Apprenez les secrets des plus grands chefs avec des recettes exclusives',
        duration: '4h',
        views: 4200,
        price: 18000,
        isFree: false,
        image: require('../../../assets/images/6.png'),
        category: 'Cuisine',
        date: '2024-01-01',
        isNew: false,
      },
      {
        id: '6',
        title: 'Concert Jazz Intime - Replay',
        description: 'Une soirée jazz exceptionnelle dans une ambiance intimiste',
        duration: '2h 30min',
        views: 3200,
        price: 0,
        isFree: true,
        image: require('../../../assets/images/7.jpg'),
        category: 'Concert',
        date: '2023-12-28',
        isNew: false,
      },
      {
        id: '7',
        title: 'Conférence Crypto & Blockchain - Replay',
        description: 'Les dernières tendances de la cryptomonnaie et de la blockchain',
        duration: '2h 30min',
        views: 8900,
        price: 45000,
        isFree: false,
        image: require('../../../assets/images/1.jpg'),
        category: 'Conférence',
        date: '2023-12-25',
        isNew: false,
      },
      {
        id: '8',
        title: 'Masterclass Trading Premium - Replay',
        description: 'Apprenez les stratégies de trading avancées avec des experts',
        duration: '2h',
        views: 5600,
        price: 60000,
        isFree: false,
        image: require('../../../assets/images/2.jpg'),
        category: 'Formation',
        date: '2023-12-22',
        isNew: false,
      },
    ];

    setReplays(mockReplays);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReplays();
    setRefreshing(false);
  };

  const handleReplayPress = (replay: ReplayEvent) => {
    if (replay.isFree) {
      // Navigation vers le replay gratuit
      navigation.navigate('Streaming' as never, { eventId: replay.id, isReplay: true } as never);
    } else {
      // Redirection vers la connexion pour les replays payants
      navigation.navigate('Login' as never);
    }
  };

  const handleLoginPress = () => {
    navigation.navigate('Login' as never);
  };

  const filteredReplays = replays.filter(replay => {
    switch (selectedFilter) {
      case 'free':
        return replay.isFree;
      case 'paid':
        return !replay.isFree;
      default:
        return true;
    }
  });

  const renderFilterButton = (filter: 'all' | 'free' | 'paid', label: string) => (
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

  const renderReplayCard = ({ item: replay }: { item: ReplayEvent }) => (
    <TouchableOpacity
      style={styles.replayCard}
      onPress={() => handleReplayPress(replay)}
      activeOpacity={0.8}
    >
      <View style={styles.replayImageContainer}>
        <Image source={replay.image} style={styles.replayImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)']}
          style={styles.replayGradient}
        />
        <View style={styles.playOverlay}>
          <View style={styles.playButton}>
            <Ionicons name="play" size={24} color={brandColors.white} />
          </View>
        </View>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{replay.duration}</Text>
        </View>
        {replay.isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newText}>NOUVEAU</Text>
          </View>
        )}
      </View>
      
      <View style={styles.replayContent}>
        <View style={styles.replayHeader}>
          <Text style={styles.replayCategory}>{replay.category}</Text>
          <View style={styles.viewsContainer}>
            <Ionicons name="eye" size={14} color={brandColors.textSecondary} />
            <Text style={styles.viewsText}>{replay.views.toLocaleString()}</Text>
          </View>
        </View>
        
        <Text style={styles.replayTitle} numberOfLines={2}>
          {replay.title}
        </Text>
        
        <Text style={styles.replayDescription} numberOfLines={2}>
          {replay.description}
        </Text>
        
        <View style={styles.replayFooter}>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={14} color={brandColors.textSecondary} />
            <Text style={styles.dateText}>{replay.date}</Text>
          </View>
          
          <View style={[styles.priceContainer, replay.isFree && styles.freePriceContainer]}>
            <Text style={[styles.priceText, replay.isFree && styles.freePriceText]}>
              {replay.isFree ? 'GRATUIT' : `${replay.price.toLocaleString()} FCFA`}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.watchButton, replay.isFree && styles.freeWatchButton]}
          onPress={() => handleReplayPress(replay)}
          activeOpacity={0.8}
        >
          <Ionicons 
            name="play-circle" 
            size={16} 
            color={replay.isFree ? brandColors.primary : brandColors.white} 
          />
          <Text style={[styles.watchButtonText, replay.isFree && styles.freeWatchButtonText]}>
            {replay.isFree ? 'Regarder' : 'Acheter'}
          </Text>
        </TouchableOpacity>
        
        {!replay.isFree && (
          <View style={styles.loginPrompt}>
            <Ionicons name="lock-closed" size={16} color={brandColors.textSecondary} />
            <Text style={styles.loginPromptText}>
              Connectez-vous pour accéder à ce replay
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Ionicons name="play-circle" size={24} color={brandColors.primary} />
            <Text style={styles.headerTitle}>Replays</Text>
          </View>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLoginPress}
            activeOpacity={0.8}
          >
            <Ionicons name="person-outline" size={20} color={brandColors.primary} />
            <Text style={styles.loginButtonText}>Connexion</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>
          Revivez vos événements préférés
        </Text>
      </View>

      {/* Filtres */}
      <View style={styles.filtersContainer}>
        {renderFilterButton('all', 'Tous')}
        {renderFilterButton('free', 'Gratuits')}
        {renderFilterButton('paid', 'Payants')}
      </View>

      {/* Statistiques */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{replays.length}</Text>
          <Text style={styles.statLabel}>Replays disponibles</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {replays.reduce((total, replay) => total + replay.views, 0).toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Vues totales</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {replays.filter(replay => replay.isFree).length}
          </Text>
          <Text style={styles.statLabel}>Gratuits</Text>
        </View>
      </View>

      {/* Liste des replays */}
      <FlatList
        data={filteredReplays}
        renderItem={renderReplayCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.replaysList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
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
    backgroundColor: brandColors.white,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    ...shadows.sm,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: brandColors.text,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: brandColors.textSecondary,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: brandColors.primary,
    gap: 6,
  },
  loginButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: brandColors.primary,
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
    borderColor: brandColors.outline,
  },
  activeFilterButton: {
    backgroundColor: brandColors.primary,
    borderColor: brandColors.primary,
  },
  filterButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: brandColors.textSecondary,
  },
  activeFilterButtonText: {
    color: brandColors.white,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: brandColors.white,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: borderRadius.lg,
    padding: 20,
    ...shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: brandColors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: brandColors.textSecondary,
    textAlign: 'center',
  },
  replaysList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  replayCard: {
    backgroundColor: brandColors.white,
    borderRadius: borderRadius.lg,
    marginBottom: 15,
    overflow: 'hidden',
    ...shadows.md,
  },
  replayImageContainer: {
    position: 'relative',
  },
  replayImage: {
    width: '100%',
    height: 200,
  },
  replayGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 2,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 102, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  durationText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: brandColors.white,
  },
  newBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#ff4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  newText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: brandColors.white,
  },
  replayContent: {
    padding: 15,
    position: 'relative',
    zIndex: 1,
  },
  replayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  replayCategory: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 3,
  },
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewsText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: brandColors.textSecondary,
  },
  replayTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
    textTransform: 'none',
  },
  replayDescription: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    marginBottom: 15,
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    textTransform: 'none',
  },
  replayFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.white,
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  priceContainer: {
    backgroundColor: brandColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 3,
  },
  freePriceContainer: {
    backgroundColor: '#22c55e',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 3,
  },
  priceText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  freePriceText: {
    color: brandColors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brandColors.primary,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    gap: 8,
    marginBottom: 10,
  },
  freeWatchButton: {
    backgroundColor: 'rgba(255, 102, 0, 0.1)',
    borderWidth: 1,
    borderColor: brandColors.primary,
  },
  watchButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: brandColors.white,
  },
  freeWatchButtonText: {
    color: brandColors.primary,
  },
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 102, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    gap: 8,
  },
  loginPromptText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: brandColors.primary,
    flex: 1,
  },
});

export default GuestReplaysScreen;
