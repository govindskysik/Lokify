import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from './Header';
import { useTheme } from '../theme/colors';

type ScreenWrapperProps = {
	children: ReactNode;
};

const ScreenWrapper = ({ children }: ScreenWrapperProps) => {
	const colors = useTheme();

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<Header />
			<SafeAreaView edges={['left', 'right', 'bottom']} style={styles.content}>
				{children}
			</SafeAreaView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
	},
});

export default ScreenWrapper;
