import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../theme/colors';
import BottomTabs from './BottomTabs';
import ArtistDetailScreen from '../screens/ArtistDetailScreen';

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
    </Stack.Navigator>
  );
};

export default AppNavigator;
