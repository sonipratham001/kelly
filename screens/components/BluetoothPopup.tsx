import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { BluetoothContext } from '../../services/BluetoothServices';
import { BatteryBluetoothContext } from '../../services/BatteryBluetoothProvider';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBluetoothPopup } from '../Context/BluetoothPopupContext';

import manager from '../../services/BleManagerInstance';

const BluetoothPopup = () => {
  const { isVisible: visible, hidePopup: onClose } = useBluetoothPopup();
  const [isActuallyConnected, setIsActuallyConnected] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isBluetoothOff, setIsBluetoothOff] = useState(false);

  const {
    connectToDevice: connectBldc,
    disconnectDevice: disconnectBldc,
    connectedDevice: bldcDevice,
  } = useContext(BluetoothContext);

  const {
    connectToDevice: connectBattery,
    disconnectDevice: disconnectBattery,
    connectedDevice: batteryDevice,
  } = useContext(BatteryBluetoothContext);

  useEffect(() => {
    const checkConnection = async () => {
      let stillConnected = false;

      try {
        if (bldcDevice) {
          const connected = await bldcDevice.isConnected();
          if (!connected) {
            await disconnectBldc();
          } else {
            stillConnected = true;
          }
        }

        if (batteryDevice) {
          const connected = await batteryDevice.isConnected();
          if (!connected) {
            await disconnectBattery();
          } else {
            stillConnected = true;
          }
        }
      } catch (err) {
        console.warn("🔌 BLE check failed:", err);
      }

      setIsActuallyConnected(stillConnected);
    };
    checkConnection();
    const interval = setInterval(checkConnection, 3000); // check every 3s

    return () => clearInterval(interval);
  }, [bldcDevice, batteryDevice]);

  useEffect(() => {
    if (visible) {
      checkBluetoothAndStartScan();
      autoConnectToLastDevice();
    }
    return () => {
      if (manager) {
        try {
          manager.stopDeviceScan();
        } catch (err) {
          console.warn("BLE scan stop failed:", err);
        }
      }
    };
  }, [visible]);

  const requestBluetoothPermissions = async () => {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 31) {
          const scan = await request(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);
          const connect = await request(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);
          const fineLoc = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
          return (
            scan === RESULTS.GRANTED &&
            connect === RESULTS.GRANTED &&
            fineLoc === RESULTS.GRANTED
          );
        } else {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      }
      return true;
    } catch (err) {
      console.error('Permission error:', err);
      return false;
    }
  };

  const checkBluetoothAndStartScan = async () => {
    const hasPermission = await requestBluetoothPermissions();
    if (!hasPermission) {
      console.warn('Bluetooth permissions not granted');
      return;
    }

    const state = await manager.state();
    setIsBluetoothOff(state !== 'PoweredOn');

    if (state === 'PoweredOn') {
      setIsScanning(true);

      // Start with connected devices
      const initialDevices: Device[] = [];
      if (bldcDevice) initialDevices.push(bldcDevice);
      if (batteryDevice && batteryDevice.id !== bldcDevice?.id) {
        initialDevices.push(batteryDevice);
      }
      setDevices(initialDevices); // 👈 include connected devices immediately

      manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          setIsScanning(false);
          return;
        }

        if (device && device.name) {
          setDevices(prev => {
            const index = prev.findIndex(d => d.id === device.id);
            if (index === -1) return [...prev, device];

            const updated = [...prev];
            updated[index] = device; // refresh info
            return updated;
          });
        }
      });

      setTimeout(() => {
        manager.stopDeviceScan();
        setIsScanning(false);
      }, 8000);
    }
  };

  const autoConnectToLastDevice = async () => {
    const lastId = await AsyncStorage.getItem('lastConnectedDeviceId');
    if (!lastId || isBluetoothOff) return;

    manager.startDeviceScan(null, null, async (error, device) => {
      if (error) return;

      if (device?.id === lastId) {
        manager.stopDeviceScan();
        await handleConnect(device);
      }
    });

    setTimeout(() => manager.stopDeviceScan(), 8000);
  };

  const handleConnect = async (device: Device) => {
    const timeout = setTimeout(() => {
      console.warn("⏳ Connection timed out, stopping scan");
      manager.stopDeviceScan();
      setIsScanning(false);
    }, 8000); // timeout fallback

    try {
      await disconnectBldc();
      await disconnectBattery();
      await connectBldc(device);
      await connectBattery(device);
      await AsyncStorage.setItem('lastConnectedDeviceId', device.id);
      setIsActuallyConnected(true);
    } catch (err) {
      console.error('❌ Connection error:', err);
    } finally {
      clearTimeout(timeout);
      setIsScanning(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnectBldc();
    await disconnectBattery();
  };

  const handleClose = () => {
    if (isBluetoothOff) {
      onClose(); // Close the entire popup if Bluetooth is off and warning is dismissed
    } else {
      onClose(); // Normal close behavior when Bluetooth is on
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.popup}>
          {isBluetoothOff ? (
            <>
              <Text style={styles.title}>Bluetooth is Off</Text>
              <Text style={styles.bluetoothOffText}>Please enable Bluetooth to scan for devices.</Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>Bluetooth Devices</Text>

              {isScanning && (
                <ActivityIndicator size="large" color="#4CAF50" style={{ marginVertical: 10 }} />
              )}

              <FlatList
                data={devices}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <View style={styles.deviceItem}>
                    <View>
                      <Text style={styles.deviceName}>{item.name}</Text>
                      <Text style={styles.deviceId}>{item.id}</Text>
                    </View>

                    {bldcDevice?.id === item.id || batteryDevice?.id === item.id ? (
                      <Icon name="check-circle" size={24} color="#10b981" />
                    ) : (
                      <TouchableOpacity
                        style={styles.connectBtn}
                        onPress={() => handleConnect(item)}
                      >
                        <Text style={styles.connectText}>Connect</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                ListEmptyComponent={
                  !isScanning
                    ? () => <Text style={styles.empty}>No devices found</Text>
                    : undefined
                }
              />

              {(bldcDevice || batteryDevice) && isActuallyConnected && (
                <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
                  <Text style={styles.disconnectText}>Disconnect</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default BluetoothPopup;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  popup: {
    width: '50%',
    maxHeight: 400,
    backgroundColor: '#1f2937',
    borderRadius: 20,
    padding: 20,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#374151',
    marginVertical: 6,
    borderRadius: 12,
  },
  connectBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  connectText: {
    color: '#fff',
    fontWeight: '600',
  },
  deviceName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  deviceId: {
    fontSize: 12,
    color: '#9ca3af',
  },
  empty: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 20,
  },
  disconnectButton: {
    marginTop: 16,
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  disconnectText: {
    color: '#fff',
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 8,
    backgroundColor: '#111827',
    borderRadius: 20,
  },
  bluetoothOffText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 20,
  },
});