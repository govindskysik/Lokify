import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/colors';
import FavoritesScreen from '../screens/FavoritesScreen';
import PlaylistsScreen from '../screens/PlaylistsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import HomeScreen from '../screens/HomeScreen';
import DataTestScreen from '../screens/DataTestScreen';
import MiniPlayer from '../components/MiniPlayer';
import ExpandedPlayer from '../components/ExpandedPlayer';
import { usePlayerStore } from '../store/playerStore';

export type BottomTabsParamList = {
    HomeTab: undefined;
    DataTest: undefined;
    Favorites: undefined;
    Playlists: undefined;
    Settings: undefined;
};

const Tab = createBottomTabNavigator<BottomTabsParamList>();

const BottomTabs = () => {
    const colors = useTheme();
    const { showExpandedPlayer, setShowExpandedPlayer } = usePlayerStore();

    return (
        <View style={{ flex: 1 }}>
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
                    } else if (route.name === 'DataTest') {
                        iconName = focused ? 'code' : 'code-outline';
                    } else if (route.name === 'Favorites') {
                        iconName = focused ? 'heart' : 'heart-outline';
                    } else if (route.name === 'Playlists') {
                        iconName = focused ? 'musical-notes' : 'musical-notes-outline';
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
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Home',
                }}
            />
            <Tab.Screen
                name="DataTest"
                component={DataTestScreen}
                options={{
                    tabBarLabel: 'API Test',
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
                name="Playlists"
                component={PlaylistsScreen}
                options={{
                    tabBarLabel: 'Playlists',
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
            <View style={{ position: 'absolute', bottom: 108, left: 0, right: 0, zIndex: 100 }}>
                <MiniPlayer onPress={() => setShowExpandedPlayer(true)} />
            </View>
            <ExpandedPlayer isExpanded={showExpandedPlayer} onCollapse={() => setShowExpandedPlayer(false)} />
        </View>
    );
};

export default BottomTabs;
