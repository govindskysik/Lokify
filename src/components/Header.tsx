import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/colors';

const HomeHeader = () => {
    const colors = useTheme();
    const navigation = useNavigation<any>();

    return (
        <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <View style={styles.container}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.text }]}>
                        <Ionicons name="musical-notes" size={32} color={colors.primary} />
                    </View>
                    <Text style={[styles.logo, { color: colors.text }]}>Lokify</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                    <Ionicons name="search" size={32} color={colors.text} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        paddingHorizontal: 16,
    },
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    iconContainer: {
        padding: 8,
        borderRadius: 24, // Half of (32 + 8*2) for circular shape
    },
    logo: {
        fontSize: 32,
        fontWeight: 'bold',
    },
});

export default HomeHeader;
