import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList, RootStackParamList } from '../types';
import { theme } from '../constants/theme';

// Import des écrans (même rendu que les invités mais avec fonctionnalités connectées)
import GuestHomeScreen from '../screens/guest/GuestHomeScreen';
import HomeScreen from '../screens/HomeScreen';
import GuestEventsScreen from '../screens/guest/GuestEventsScreen';
import GuestLiveScreen from '../screens/guest/GuestLiveScreen';
import GuestReplaysScreen from '../screens/guest/GuestReplaysScreen';
import GuestCategoriesScreen from '../screens/guest/GuestCategoriesScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import EventDetailsScreen from '../screens/events/EventDetailsScreen';
import StreamingScreen from '../screens/streaming/StreamingScreen';
import ReplaysScreen from '../screens/streaming/ReplaysScreen';
import PaymentScreen from '../screens/payments/PaymentScreen';
import TicketsScreen from '../screens/tickets/TicketsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import NotificationHistoryScreen from '../screens/notifications/NotificationHistoryScreen';
import UserHistoryScreen from '../screens/history/UserHistoryScreen';
import FavoritesScreen from '../screens/favorites/FavoritesScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

// Stack pour les événements (même rendu que les invités)
const EventsStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#ffffff' },
      }}
    >
      <Stack.Screen name="EventList" component={GuestEventsScreen} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
    </Stack.Navigator>
  );
};

// Stack pour le streaming (même rendu que les invités)
const StreamingStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#000000' },
      }}
    >
      <Stack.Screen name="Live" component={GuestLiveScreen} />
      <Stack.Screen name="Streaming" component={StreamingScreen} />
    </Stack.Navigator>
  );
};

// Stack pour les replays (utilise le nouveau ReplaysScreen pour les connectés)
const ReplaysStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#ffffff' },
      }}
    >
      <Stack.Screen name="Replays" component={ReplaysScreen} />
      <Stack.Screen name="Streaming" component={StreamingScreen} />
    </Stack.Navigator>
  );
};

// Stack pour le profil
const ProfileStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#ffffff' },
      }}
    >
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="Tickets" component={TicketsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="NotificationHistory" component={NotificationHistoryScreen} />
      <Stack.Screen name="UserHistory" component={UserHistoryScreen} />
    </Stack.Navigator>
  );
};

// Navigateur principal avec onglets
const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Events':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Live':
              iconName = focused ? 'radio' : 'radio-outline';
              break;
            case 'Replays':
              iconName = focused ? 'play-circle' : 'play-circle-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Accueil',
        }}
      />
      <Tab.Screen 
        name="Events" 
        component={EventsStack}
        options={{
          tabBarLabel: 'Événements',
        }}
      />
      <Tab.Screen 
        name="Live" 
        component={StreamingStack}
        options={{
          tabBarLabel: 'En Direct',
        }}
      />
      <Tab.Screen 
        name="Replays" 
        component={ReplaysStack}
        options={{
          tabBarLabel: 'Replays',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profil',
        }}
      />
    </Tab.Navigator>
  );
};

// Navigateur principal avec stack pour les écrans modaux
const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#ffffff' },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen 
        name="EventDetails" 
        component={EventDetailsScreen}
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="Streaming" 
        component={StreamingScreen}
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="Payment" 
        component={PaymentScreen}
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="Categories" 
        component={GuestCategoriesScreen}
        options={{
          presentation: 'card',
        }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;

