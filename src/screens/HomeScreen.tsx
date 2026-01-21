import React from 'react';
import { StyleSheet } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import HomeTopTabs from '../navigation/HomeTopTabs';

const HomeScreen = () => {
  return (
    <ScreenWrapper>
      <HomeTopTabs />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({});

export default HomeScreen;
