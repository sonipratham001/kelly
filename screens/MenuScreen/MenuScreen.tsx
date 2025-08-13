import React, { useEffect } from 'react';
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigationTypes';
import Orientation from 'react-native-orientation-locker';
import styles from './MenuScreen.styles';
import BottomNavBar from '../components/BottomNavBar';

const MenuScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    Orientation.lockToLandscape();
    return () => Orientation.unlockAllOrientations();
  }, []);

  const menuItems = [
    { label: 'Home', icon: 'home-circle', screen: 'Home', color: '#60a5fa' },
    { label: 'Motor Health', icon: 'cog-outline', screen: 'MotorHealth', color: '#facc15' },
    { label: 'Battery Health', icon: 'battery-high', screen: 'BatteryHealth', color: '#34d399' },
    { label: 'Export Data', icon: 'arrow-up-circle-outline', screen: 'ExportDataScreen', color: '#eab308' },
    {
      label: 'YouTube',
      icon: 'youtube',
      screen: '',
      color: '#ef4444',
      onPress: async () => {
        const youtubeAppUrl = 'vnd.youtube://';
        const fallbackWebUrl = 'https://www.youtube.com/';
        try {
          const supported = await Linking.canOpenURL(youtubeAppUrl);
          if (supported) {
            await Linking.openURL(youtubeAppUrl);
          } else {
            await Linking.openURL(fallbackWebUrl);
          }
        } catch (err) {
          await Linking.openURL(fallbackWebUrl);
        }
      },
    },
    {
      label: 'Maps',
      icon: 'map-marker',
      screen: 'Map', // ✅ Switch to in-app screen
      color: '#3b82f6',
    },
  ];

  return (
    <LinearGradient
      colors={['#0a0f1c', '#1f2937', '#111827']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      <View style={styles.grid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.iconBox}
            onPress={() => {
              if (item.onPress) {
                item.onPress();
              } else if (item.screen) {
                navigation.navigate(item.screen as keyof RootStackParamList);
              }
            }}
          >
            <Icon name={item.icon} size={50} color={item.color} />
            <Text style={styles.label}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <BottomNavBar />
    </LinearGradient>
  );
};

export default MenuScreen;