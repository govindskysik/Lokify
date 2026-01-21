import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../theme/colors';
import BottomTabs from './BottomTabs';
import ArtistDetailScreen from '../screens/ArtistDetailScreen';
import PlayerScreen from '../screens/PlayerScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  ArtistDetail: {
    artistId: string;
    artistName: string;
    artistImage?: string;
  };
  GenreSongs: {
    genreName: string;
    genreQuery: string;
  };
  Player: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const colors = useTheme();

  return (
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
        name="ArtistDetail" 
        component={ArtistDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Player" 
        component={PlayerScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
