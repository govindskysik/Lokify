import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/colors';
import FavoritesScreen from '../screens/FavoritesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import HomeScreen from '../screens/HomeScreen';
import ArtistDetailScreen from '../screens/ArtistDetailScreen';
import AlbumDetailScreen from '../screens/AlbumDetailScreen';

export type BottomTabsParamList = {
    HomeTab: undefined;
    Favorites: undefined;
    Settings: undefined;
};

export type HomeStackParamList = {
    Home: undefined;
    ArtistDetail: {
        artistId: string;
        artistName: string;
        artistImage?: string;
    };
    AlbumDetail: {
        albumId: string;
        albumName: string;
        albumImage?: string;
    };
};

const Tab = createBottomTabNavigator<BottomTabsParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();

const HomeStackNavigator = () => {
    return (
        <HomeStack.Navigator screenOptions={{ headerShown: false }}>
            <HomeStack.Screen name="Home" component={HomeScreen} />
            <HomeStack.Screen name="ArtistDetail" component={ArtistDetailScreen} />
            <HomeStack.Screen name="AlbumDetail" component={AlbumDetailScreen} />
        </HomeStack.Navigator>
    );
};

const BottomTabs = () => {
    const colors = useTheme();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                sceneContainerStyle: {
                    paddingBottom: 0,
                },
                tabBarStyle: {
                    backgroundColor: colors.tabBarBackground,
                    borderTopLeftRadius: 25,
                    borderTopRightRadius: 25,
                    height: 100,
                    paddingBottom: 8,
                    paddingTop: 16,
                    borderTopWidth: 0,
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    justifyContent: 'center',
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.subText,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: React.ComponentProps<typeof Ionicons>['name'] = 'home';

                    if (route.name === 'HomeTab') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Favorites') {
                        iconName = focused ? 'heart' : 'heart-outline';
                    } else if (route.name === 'Settings') {
                        iconName = focused ? 'settings' : 'settings-outline';
                    }

                    return <Ionicons name={iconName} size={focused ? size + 2 : size} color={color} />;
                },
                tabBarLabel: route.name === 'HomeTab' ? 'Home' : route.name,
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                    marginTop: 2,
                },
            })}
        >
            <Tab.Screen
                name="HomeTab"
                component={HomeStackNavigator}
                options={{
                    tabBarLabel: 'Home',
                }}
            />
            <Tab.Screen
                name="Favorites"
                component={FavoritesScreen}
                options={{
                    tabBarLabel: 'Favorites',
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarLabel: 'Settings',
                }}
            />
        </Tab.Navigator>
    );
};

export default BottomTabs;
