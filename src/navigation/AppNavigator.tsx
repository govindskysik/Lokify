import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/colors';
import BottomTabs from './BottomTabs';
import PlayerScreen from '../screens/PlayerScreen';
import SearchScreen from '../screens/SearchScreen';
import MiniPlayer from '../components/MiniPlayer';
import ExpandedPlayer from '../components/ExpandedPlayer';
import { usePlayerStore } from '../store/playerStore';

export type RootStackParamList = {
  MainTabs: undefined;
  Player: undefined;
  Search: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const colors = useTheme();
  const { showExpandedPlayer, setShowExpandedPlayer } = usePlayerStore();

  return (
    <View style={{ flex: 1 }}>
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="MainTabs" 
          component={BottomTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Player" 
          component={PlayerScreen}
          options={{ headerShown: false }}
        />
        <Stack.Group screenOptions={{ presentation: 'modal' }}>
          <Stack.Screen 
            name="Search" 
            component={SearchScreen}
            options={{ headerShown: false }}
          />
        </Stack.Group>
      </Stack.Navigator>
      
      {/* Global MiniPlayer - shows on all screens above bottom tabs */}
      <View style={{ position: 'absolute', bottom: 100, left: 0, right: 0, zIndex: 100 }}>
        <MiniPlayer onPress={() => setShowExpandedPlayer(true)} />
      </View>
      
      {/* Global ExpandedPlayer */}
      <ExpandedPlayer isExpanded={showExpandedPlayer} onCollapse={() => setShowExpandedPlayer(false)} />
    </View>
  );
};

export default AppNavigator;
