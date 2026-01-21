import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/colors';
import { searchSongs } from '../api/search';
import { Song } from '../types';

const DataTestScreen = () => {
  const colors = useTheme();
  const [data, setData] = useState<Song[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      console.log('Fetching songs...');
      const results = await searchSongs('love');
      console.log('Results received:', results.length, 'songs');
      setData(results);
    };

    fetchData();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <Text style={[styles.title, { color: colors.text }]}>
          API Test Screen - Songs Data
        </Text>
        <Text style={[styles.count, { color: colors.primary }]}>
          Total Songs: {data.length}
        </Text>
        <Text style={[styles.json, { color: colors.text }]}>
          {JSON.stringify(data, null, 2)}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  count: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  json: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
});

export default DataTestScreen;
