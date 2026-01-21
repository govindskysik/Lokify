import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/colors';

const HomeHeader = () => {
    const colors = useTheme();

    return (
        <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <View style={styles.container}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="musical-notes" size={32} backgroundColor={colors.text} borderRadius={"100%"} padding={8} color={colors.primary} />
                    <Text style={[styles.logo, { color: colors.text }]}>Lokify</Text>
                </View>
                <TouchableOpacity>
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
    logo: {
        fontSize: 32,
        fontWeight: 'bold',
    },
});

export default HomeHeader;
