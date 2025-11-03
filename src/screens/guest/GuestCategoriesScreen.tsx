import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { brandColors, typography, borderRadius, shadows } from '../../constants/theme';
import { categoryService, Category } from '../../services/categories';

const { width } = Dimensions.get('window');

// L'interface Category est maintenant importée du service

const GuestCategoriesScreen: React.FC = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setError(null);
      const response = await categoryService.getCategories();
      
      if (response.success && response.data) {
        setCategories(response.data.categories);
      } else {
        throw new Error('Erreur lors du chargement des catégories');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      setError('Impossible de charger les catégories');
      
      // Fallback vers des données mockées en cas d'erreur
      const fallbackCategories: Category[] = [
        {
          id: 'concert',
          name: 'Concert',
          icon: 'musical-notes',
          color: '#FF6B6B',
          gradient: ['#FF6B6B', '#FF8E8E'],
          eventCount: 0,
          description: 'Concerts et spectacles musicaux',
          value: 'concert'
        },
        {
          id: 'seminar',
          name: 'Formation',
          icon: 'school',
          color: '#45B7D1',
          gradient: ['#45B7D1', '#6BC5D8'],
          eventCount: 0,
          description: 'Formations et masterclasses',
          value: 'seminar'
        },
        {
          id: 'conference',
          name: 'Conférence',
          icon: 'mic',
          color: '#FFEAA7',
          gradient: ['#FFEAA7', '#FFF2CC'],
          eventCount: 0,
          description: 'Conférences et séminaires',
          value: 'conference'
        },
        {
          id: 'festival',
          name: 'Festival',
          icon: 'calendar',
          color: '#DDA0DD',
          gradient: ['#DDA0DD', '#E6B8E6'],
          eventCount: 0,
          description: 'Festivals et événements culturels',
          value: 'festival'
        },
        {
          id: 'workshop',
          name: 'Cuisine',
          icon: 'restaurant',
          color: '#FFA726',
          gradient: ['#FFA726', '#FFB74D'],
          eventCount: 0,
          description: 'Ateliers et cours de cuisine',
          value: 'workshop'
        }
      ];
      setCategories(fallbackCategories);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
  };

  const handleCategoryPress = (category: Category) => {
    if (category.eventCount > 0) {
      // Navigation vers la page des événements avec filtre par catégorie
      (navigation as any).navigate('Events', { 
        filter: 'all', 
        category: category.value,
        categoryName: category.name 
      });
    } else {
      Alert.alert(
        'Aucun événement',
        `Aucun événement disponible dans la catégorie "${category.name}" pour le moment.`,
        [{ text: 'OK' }]
      );
    }
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.8}
      disabled={item.eventCount === 0}
    >
      <LinearGradient
        colors={item.gradient}
        style={styles.categoryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.categoryContent}>
          <View style={styles.categoryIconContainer}>
            <Ionicons name={item.icon as any} size={32} color={brandColors.white} />
          </View>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{item.name}</Text>
            <Text style={styles.categoryDescription}>{item.description}</Text>
            <View style={styles.categoryFooter}>
              <Text style={styles.categoryCount}>
                {item.eventCount} événement{item.eventCount !== 1 ? 's' : ''}
              </Text>
              {item.eventCount > 0 ? (
                <Ionicons name="chevron-forward" size={16} color={brandColors.white} />
              ) : (
                <Text style={styles.emptyText}>Bientôt</Text>
              )}
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );


  return (
    <View style={styles.container}>
      {/* Header avec gradient */}
      <LinearGradient
        colors={[brandColors.primary, '#FF8A50']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color={brandColors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Catégories</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Section d'introduction */}
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Explorez nos catégories</Text>
          <Text style={styles.introDescription}>
            Découvrez tous les types d'événements disponibles sur INSTANT+
          </Text>
        </View>

        {/* Liste des catégories */}
        <View style={styles.section}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Chargement des catégories...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color={brandColors.error} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={loadCategories}
                activeOpacity={0.8}
              >
                <Text style={styles.retryButtonText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item.id}
              numColumns={1}
              scrollEnabled={false}
              contentContainerStyle={styles.categoriesList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Section d'information */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color={brandColors.primary} />
            <Text style={styles.infoText}>
              Cliquez sur une catégorie pour voir les événements disponibles
            </Text>
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    ...shadows.md,
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
    flex: 1,
    fontSize: typography.fontSize.xl,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    textAlign: 'center',
    textTransform: 'none',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  introSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  introTitle: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.darkGray,
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'none',
  },
  introDescription: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_400Regular',
    color: brandColors.mediumGray,
    textAlign: 'center',
    lineHeight: 24,
    textTransform: 'none',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoriesList: {
    gap: 16,
  },
  categoryItem: {
    marginBottom: 16,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  categoryGradient: {
    padding: 20,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: typography.fontSize.xl,
    fontFamily: 'Montserrat_700Bold',
    color: brandColors.white,
    marginBottom: 4,
    textTransform: 'none',
  },
  categoryDescription: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_400Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    textTransform: 'none',
  },
  categoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryCount: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.white,
    textTransform: 'none',
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_500Medium',
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
    textTransform: 'none',
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brandColors.white,
    padding: 16,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.mediumGray,
    lineHeight: 20,
    textTransform: 'none',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.mediumGray,
    textTransform: 'none',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_500Medium',
    color: brandColors.error,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    textTransform: 'none',
  },
  retryButton: {
    backgroundColor: brandColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: borderRadius.lg,
  },
  retryButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: 'Montserrat_600SemiBold',
    color: brandColors.white,
    textTransform: 'none',
  },
});

export default GuestCategoriesScreen;
