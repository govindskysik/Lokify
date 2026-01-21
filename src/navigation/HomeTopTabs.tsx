import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTheme } from '../theme/colors';
import SuggestedScreen from '../screens/Home/SuggestedScreen';
import SongsScreen from '../screens/Home/SongsScreen';
import ArtistsScreen from '../screens/Home/ArtistsScreen';
import AlbumsScreen from '../screens/Home/AlbumsScreen';

export type HomeTopTabsParamList = {
  Suggested: undefined;
  Songs: undefined;
  Artists: undefined;
  Albums: undefined;
};

const Tab = createMaterialTopTabNavigator<HomeTopTabsParamList>();

const HomeTopTabs = () => {
  const colors = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarScrollEnabled: true,
        tabBarStyle: {
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarIndicatorStyle: {
          backgroundColor: colors.primary,
          height: 3,
        },
        tabBarLabelStyle: {
          fontSize: 16,
          fontWeight: '700',
          textTransform: 'none',
        },
        tabBarItemStyle: {
          width: 'auto',
          paddingHorizontal: 16,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subText,
        swipeEnabled: true,
        lazy: false,
      }}
    >
      <Tab.Screen
        name="Suggested"
        component={SuggestedScreen}
        options={{ tabBarLabel: 'Suggested' }}
      />
      <Tab.Screen
        name="Songs"
        component={SongsScreen}
        options={{ tabBarLabel: 'Songs' }}
      />
      <Tab.Screen
        name="Artists"
        component={ArtistsScreen}
        options={{ tabBarLabel: 'Artists' }}
      />
      <Tab.Screen
        name="Albums"
        component={AlbumsScreen}
        options={{ tabBarLabel: 'Albums' }}
      />
    </Tab.Navigator>
  );
};

export default HomeTopTabs;
