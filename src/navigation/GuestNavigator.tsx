import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

// Import des écrans
import GuestHomeScreen from '../screens/guest/GuestHomeScreen';
import GuestEventsScreen from '../screens/guest/GuestEventsScreen';
import GuestLiveScreen from '../screens/guest/GuestLiveScreen';
import GuestReplaysScreen from '../screens/guest/GuestReplaysScreen';
import GuestCategoriesScreen from '../screens/guest/GuestCategoriesScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import EventDetailsScreen from '../screens/events/EventDetailsScreen';
import StreamingScreen from '../screens/streaming/StreamingScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack pour les événements
const GuestEventsStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EventsList" component={GuestEventsScreen} />
      <Stack.Screen 
        name="EventDetails" 
        component={EventDetailsScreen}
        options={{
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};

// Stack pour le streaming
const GuestLiveStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LiveList" component={GuestLiveScreen} />
      <Stack.Screen 
        name="Streaming" 
        component={StreamingScreen}
        options={{
          presentation: 'fullScreenModal',
        }}
      />
    </Stack.Navigator>
  );
};

// Stack pour les replays
const GuestReplaysStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ReplaysList" component={GuestReplaysScreen} />
      <Stack.Screen 
        name="Streaming" 
        component={StreamingScreen}
        options={{
          presentation: 'fullScreenModal',
        }}
      />
    </Stack.Navigator>
  );
};

// Navigateur principal avec onglets pour les invités
const GuestTabNavigator: React.FC = () => {
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
        component={GuestHomeScreen}
        options={{
          tabBarLabel: 'Accueil',
        }}
      />
      <Tab.Screen 
        name="Events" 
        component={GuestEventsStack}
        options={{
          tabBarLabel: 'Événements',
        }}
      />
      <Tab.Screen 
        name="Live" 
        component={GuestLiveStack}
        options={{
          tabBarLabel: 'En Direct',
        }}
      />
      <Tab.Screen 
        name="Replays" 
        component={GuestReplaysStack}
        options={{
          tabBarLabel: 'Replays',
        }}
      />
    </Tab.Navigator>
  );
};

// Navigateur principal avec stack pour les écrans modaux
const GuestNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#ffffff' },
      }}
    >
      <Stack.Screen name="GuestTabs" component={GuestTabNavigator} />
      <Stack.Screen 
        name="Categories" 
        component={GuestCategoriesScreen}
        options={{
          presentation: 'card',
        }}
      />
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
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};

export default GuestNavigator;
