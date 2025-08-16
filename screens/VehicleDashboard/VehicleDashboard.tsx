import React, { useContext, useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import VehicleDashboardUI from './VehicleDashboardUI';
import { BatteryBluetoothContext } from '../../services/BatteryBluetoothProvider';
import { BluetoothContext } from '../../services/BluetoothServices';
import Orientation from 'react-native-orientation-locker';

const VehicleDashboard = () => {
  const { data: batteryData, connectedDevice: batteryConnected } = useContext(BatteryBluetoothContext);
  const { connectedDevice: bldcConnected } = useContext(BluetoothContext);
const [time, setTime] = useState(
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
);
  const [isBluetoothPopupVisible, setBluetoothPopupVisible] = useState(false);

  useEffect(() => {
  const interval = setInterval(() => {
    setTime(
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  }, 1000);
  return () => clearInterval(interval);
}, []);

  useEffect(() => {
    Orientation.lockToLandscape();
    return () => Orientation.unlockAllOrientations();
  }, []);

  const mcu1 = batteryData.messageMCU1 || {};
  const diu4 = batteryData.messageDIU4 || {};
  const diu2 = batteryData.messageDIU2 || {};
  const driveParams = batteryData.messageDriveParameters || {};
  const gpio = batteryData.gpioStates?.states || {};
  const batteryFaults = batteryData.messageDIU1?.faultMessages;
const motorFaults = batteryData.messageMCU3?.faultMessages;

const batteryHasFault = batteryFaults && batteryFaults.length > 0 && !batteryFaults.includes('No Faults Detected');
const motorHasFault = motorFaults && motorFaults.length > 0 && !motorFaults.includes('No Faults Detected');

 let gear: 'f' | 'n' | 'r' = 'f';
  // If reverse is asserted, override to R
  if (gpio.REV_OUT) {
    gear = 'r';
  // Else if neutral is asserted, override to N
  } else if (gpio.NEUTRAL_OUT) {
    gear = 'n';
  // Else if forward explicitly asserted, keep F (optional but explicit)
  } else if (gpio.FWD_OUT) {
    gear = 'f';
  }

  const getGlowColor = (speed: number | undefined): { color: string; intensity: number } => {
  if (speed == null) return { color: '#3b82f6', intensity: 0.4 };

  if (speed <= 30) {
    // green zone
    const intensity = speed / 30; // 0 to 1
    return { color: '#22c55e', intensity }; // green
  }

  if (speed <= 60) {
    // yellow zone
    const intensity = (speed - 30) / 30; // 0 to 1
    return { color: '#facc15', intensity }; // yellow
  }

  // red zone
  const intensity = Math.min((speed - 60) / 40, 1); // assume max 100 speed
  return { color: '#ef4444', intensity }; // red
};
const { color: glowColor, intensity: glowIntensity } = getGlowColor(mcu1.speed);
  return (
    <SafeAreaView style={styles.fullScreen}>
      <VehicleDashboardUI
        speed={mcu1.speed}
        time={time}
        batteryPercentage={diu4.stateOfCharge}
        gear={gear}
        mode={gpio.ECO_OUT ? 'eco' : gpio.SPORTS_OUT ? 'sports' : undefined}
        range={diu4.distanceToEmpty}
        odometer={batteryData.messageMCU2?.odometer}
        glowColor={glowColor}
  glowIntensity={glowIntensity}
        batteryHasFault={batteryHasFault}
  motorHasFault={motorHasFault}
        leftSignal={!!gpio.LEFT_OUT}
rightSignal={!!gpio.RIGHT_OUT}
        brakeStatus={{
          bf: !!gpio.BRAKE_OUT,
          hb: false,
          s: false,
        }}
        headlightStatus={{
          low: gpio.LOWB_OUT,
          high: gpio.HIGHB_OUT,
          hazard: false,
          service: false,
        }}
        isConnected={!!(batteryConnected || bldcConnected)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
  },
});

export default VehicleDashboard;