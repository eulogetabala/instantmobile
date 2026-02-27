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
import { streamingService } from '../../services/streaming';
import { eventService } from '../../services/events';
import { Event as ApiEvent } from '../../types';
import { getEventImage } from '../../utils/image';

const { width } = Dimensions.get('window');

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
  thumbnailUrl?: string;
  replayUrl?: string;
  organizer: {
    name: string;
    avatar?: string;
  };
}

const ReplaysScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [replays, setReplays] = useState<ReplayEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'free' | 'paid'>('all');

  useEffect(() => {
    loadReplays();
  }, []);

  const transformReplay = (event: ApiEvent): ReplayEvent => ({
    id: event.id,
    title: event.title,
    description: event.description || '',
    duration: event.duration || '0:00',
    views: event.stats?.views || 0,
    price: event.pricing?.isFree ? 0 : (event.pricing?.price?.amount || 0),
    isFree: event.pricing?.isFree || false,
    image: getEventImage(event.media?.poster),
    category: event.category,
    date: new Date(event.startDate).toLocaleDateString(),
    isNew: false,
    organizer: {
      name: event.organizer?.name || 'Organisateur',
      avatar: (event as any).organizer?.avatar || event.createdBy?.avatar,
    },
  });

  const loadReplays = async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des replays...');
      const response = await eventService.getReplays();
      
      if (response.data) {
        setReplays(response.data.map(transformReplay));
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des replays:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReplays();
    setRefreshing(false);
  };

  const handleReplayPress = (replay: ReplayEvent) => {
    if (replay.isFree || isAuthenticated) {
      // Navigation vers le replay
      (navigation as any).navigate('Streaming', { 
        eventId: replay.id, 
        isReplay: true 
      });
    } else {
      // Redirection vers la connexion pour les replays payants
      Alert.alert(
        'Connexion requise',
        'Connectez-vous pour accéder à ce replay payant',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => navigation.navigate('Login' as never) },
        ]
      );
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
          colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
          style={styles.replayGradient}
        />
        <View style={styles.replayOverlay}>
          <View style={styles.replayHeader}>
            <Text style={styles.replayCategory}>{replay.category}</Text>
            {replay.isNew && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NOUVEAU</Text>
              </View>
            )}
          </View>
          <View style={styles.playButtonContainer}>
            <View style={styles.playButton}>
              <Ionicons name="play" size={24} color={brandColors.white} />
            </View>
          </View>
        </View>
        <View style={styles.durationBadge}>
          <Ionicons name="time-outline" size={12} color={brandColors.white} />
          <Text style={styles.durationText}>{replay.duration}</Text>
        </View>
      </View>
      
      <View style={styles.replayContent}>
        <Text style={styles.replayTitle} numberOfLines={2}>
          {replay.title}
        </Text>
        <Text style={styles.replayDescription} numberOfLines={2}>
          {replay.description}
        </Text>
        
        <View style={styles.replayFooter}>
          <View style={styles.organizerInfo}>
            <Image 
              source={replay.organizer.avatar || replay.image} 
              style={styles.organizerAvatar} 
            />
            <Text style={styles.organizerName}>{replay.organizer.name}</Text>
          </View>
          
          <View style={styles.replayStats}>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={14} color={brandColors.mediumGray} />
              <Text style={styles.statText}>{replay.views.toLocaleString()}</Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={[
                styles.priceText,
                replay.isFree && styles.freePriceText
              ]}>
                {replay.isFree ? 'GRATUIT' : `${replay.price.toLocaleString()} FCFA`}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

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
          <Text style={styles.headerTitle}>Replays</Text>
          <Text style={styles.headerSubtitle}>
            {filteredReplays.length} replay{filteredReplays.length > 1 ? 's' : ''}
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
          {renderFilterButton('free', 'Gratuits')}
          {renderFilterButton('paid', 'Payants')}
        </View>

        {/* Liste des replays */}
        <View style={styles.section}>
          {filteredReplays.length > 0 ? (
            <FlatList
              data={filteredReplays}
              renderItem={renderReplayCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="play-circle-outline" size={64} color={brandColors.lightGray} />
              <Text style={styles.emptyStateTitle}>Aucun replay trouvé</Text>
              <Text style={styles.emptyStateDescription}>
                {selectedFilter === 'all' 
                  ? 'Il n\'y a pas encore de replays disponibles'
                  : `Aucun replay ${selectedFilter === 'free' ? 'gratuit' : 'payant'} trouvé`
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
  replayCard: {
    backgroundColor: brandColors.white,
    borderRadius: borderRadius.xl,
    marginBottom: 20,
    overflow: 'hidden',
    ...shadows.lg,
  },
  replayImageContainer: {
    height: 200,
    position: 'relative',
  },
  replayImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  replayGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  replayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 16,
  },
  replayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  replayCategory: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.white,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    textTransform: 'none',
  },
  newBadge: {
    backgroundColor: brandColors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  newBadgeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    textTransform: 'none',
  },
  playButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: brandColors.white,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  durationText: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.white,
    textTransform: 'none',
  },
  replayContent: {
    padding: 16,
  },
  replayTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.darkGray,
    marginBottom: 8,
    lineHeight: 24,
    textTransform: 'none',
  },
  replayDescription: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
    lineHeight: 20,
    marginBottom: 16,
    textTransform: 'none',
  },
  replayFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  organizerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  organizerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  organizerName: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.mediumGray,
    textTransform: 'none',
  },
  replayStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
    textTransform: 'none',
  },
  priceContainer: {
    backgroundColor: brandColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  priceText: {
    fontSize: typography.fontSize.xs,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    textTransform: 'none',
  },
  freePriceText: {
    backgroundColor: brandColors.success,
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
    textTransform: 'none',
  },
});

export default ReplaysScreen;