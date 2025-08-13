import React from 'react';
import { StyleSheet, TouchableOpacity, View, Image, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigationTypes';
import { useBluetoothPopup } from '../Context/BluetoothPopupContext';

const BottomNavBar: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { showPopup } = useBluetoothPopup();

  const openMapsApp = async () => {
    const url = 'https://www.google.com/maps';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.warn("Can't handle map URL");
      }
    } catch (err) {
      console.error('Error opening maps:', err);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.bottomNav}>
        {/* Bluetooth Icon */}
        <TouchableOpacity onPress={showPopup}>
          <Icon name="bluetooth" size={28} color="#3b82f6" />
        </TouchableOpacity>

        {/* Menu Icon */}
        <TouchableOpacity onPress={() => navigation.navigate('MenuScreen')}>
          <Icon name="view-grid" size={28} color="#e5e7eb" />
        </TouchableOpacity>


        {/* Home Icon */}
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Icon name="home" size={28} color="#facc15" />
        </TouchableOpacity>

        {/* Map Icon - Opens external map app */}
        <TouchableOpacity onPress={() => navigation.navigate('Map')}>
          <Icon name="map-marker" size={28} color="#3b82f6" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#0a0f1c',
    width: '100%',
    position: 'relative',
  },
});

export default BottomNavBar;