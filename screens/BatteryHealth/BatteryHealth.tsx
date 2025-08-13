import React, { useRef, useEffect, useContext, useState } from 'react';
import {
  View,
  Text,
  StatusBar,
  Dimensions,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle, Defs, Path, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BatteryBluetoothContext } from '../../services/BatteryBluetoothProvider';
import styles from './BatteryHealth.styles';
import BottomNavBar from '../components/BottomNavBar';
import MiniArcGauge from "../components/MiniArcGauge"
import TachometerDial from '../components/TachometerDial'; // adjust path if needed

const screenWidth = Dimensions.get('window').width;
const RADIUS = 75;
const CIRCLE_LENGTH = 2 * Math.PI * RADIUS;

const BatteryHealth = () => {
  const { data = {} } = useContext(BatteryBluetoothContext);
  const gpioStates = data.gpioStates?.states || {};
  const messageDIU2 = data.messageDIU2 || {};
  const messageDIU3 = data.messageDIU3 || {};
  const messageDIU4 = data.messageDIU4 || {};
  const messageDriveParameters = data.messageDriveParameters || {};

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const strokeAnim = useRef(new Animated.Value(0)).current;
  const minVoltageAnim = useRef(new Animated.Value(0)).current;
const maxVoltageAnim = useRef(new Animated.Value(0)).current;
const AnimatedPath = Animated.createAnimatedComponent(Path);

  const [batteryMetrics, setBatteryMetrics] = useState({
    soc: 0,
    batteryCurrent: 0,
    minCellVoltage: 0,
    maxCellVoltage: 0,
    maxCellTemp: 0,
    minCellTemp: 0,
    availableEnergy: 0,
    driveCurrentLimit: 0,
    regenCurrentLimit: 0,
    vehicleModeRequest: 0,
    keyOnIndicator: 0,
  });

  useEffect(() => {
    setBatteryMetrics({
      soc: messageDIU4.stateOfCharge || 0,
      batteryCurrent: messageDIU2.batteryCurrent || 0,
      minCellVoltage: messageDIU3.minCellVoltage || 0,
      maxCellVoltage: messageDIU3.maxCellVoltage || 0,
      maxCellTemp: messageDriveParameters.maxCellTemp || 0,
      minCellTemp: messageDriveParameters.minCellTemp || 0,
      availableEnergy: messageDriveParameters.availableEnergy || 0,
      driveCurrentLimit: messageDIU2.driveCurrentLimit || 0,
      regenCurrentLimit: messageDIU2.regenCurrentLimit || 0,
      vehicleModeRequest: messageDIU2.vehicleModeRequest || 0,
      keyOnIndicator: gpioStates.KEY_OUT ? 1 : 0,
    });
  }, [data]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(strokeAnim, {
        toValue: batteryMetrics.soc,
        duration: 1000,
        useNativeDriver: false,
      }),
    ]).start();
  }, [batteryMetrics.soc]);
  
  useEffect(() => {
  Animated.timing(minVoltageAnim, {
    toValue: Math.min(Math.max((batteryMetrics.minCellVoltage - 2.5) / 2 * 100, 0), 100),
    duration: 800,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: false,
  }).start();

  Animated.timing(maxVoltageAnim, {
    toValue: Math.min(Math.max((batteryMetrics.maxCellVoltage - 2.5) / 2 * 100, 0), 100),
    duration: 800,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: false,
  }).start();
}, [batteryMetrics.minCellVoltage, batteryMetrics.maxCellVoltage]);

  const strokeDashoffset = strokeAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [CIRCLE_LENGTH, 0],
  });

  const barData = [
    {
      value: batteryMetrics.batteryCurrent,
      label: 'Battery Current',
      frontColor: '#00eaff',
      gradientColor: '#00aaff',
    },
    {
      value: batteryMetrics.availableEnergy,
      label: 'Available Energy',
      frontColor: '#00eaff',
      gradientColor: '#00aaff',
    },
  ];

  return (
    <LinearGradient
      colors={['#0a0f1c', '#1f2937', '#111827']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Circular SOC */}
        <Animated.View
  style={{
    alignItems: 'center',
    marginVertical: 30,
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  }}
>
  <Svg width={180} height={180} viewBox="0 0 180 180">
    <Defs>
      <SvgLinearGradient id="socGradient" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0%" stopColor="#22c55e" />
        <Stop offset="50%" stopColor="#facc15" />
        <Stop offset="100%" stopColor="#ef4444" />
      </SvgLinearGradient>
    </Defs>

    {/* Background Arc */}
    <Circle
      cx="90"
      cy="90"
      r={RADIUS}
      stroke="#1e293b"
      strokeWidth="12"
      fill="none"
    />

    {/* Foreground Arc */}
    <AnimatedCircle
      cx="90"
      cy="90"
      r={RADIUS}
      stroke="url(#socGradient)"
      strokeWidth="12"
      fill="none"
      strokeDasharray={`${CIRCLE_LENGTH}, ${CIRCLE_LENGTH}`}
      strokeDashoffset={strokeDashoffset}
      strokeLinecap="round"
      rotation="-90"
      origin="90, 90"
    />
  </Svg>

  {/* SOC Value in Center */}
  <View
  style={{
    position: 'absolute',
    width: 180, // Match SVG width
    height: 180, // Match SVG height
    alignItems: 'center',
    justifyContent: 'center',
  }}
>
  <Text
    style={{
      color: '#ffffff',
      fontSize: 28,
      fontWeight: 'bold',
      textShadowColor: 'rgba(255, 255, 255, 0.4)',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 6,
      fontVariant: ['tabular-nums'],
    }}
  >
    {batteryMetrics.soc}%
  </Text>
</View>
  <Text
    style={{
      color: '#94a3b8',
      fontSize: 14,
      marginTop: 10,
    }}
  >
    State of Charge
  </Text>
</Animated.View>

{/* Min/Max Voltage Visuals */}
<View style={{ width: '100%', alignItems: 'center', marginTop: 10 }}>
  {[
    {
      label: 'Min Voltage',
      value: batteryMetrics.minCellVoltage,
      icon: 'flash',
      baseColor: '#22c55e',
      gradient: ['#4ade80', '#15803d'],
      animRef: minVoltageAnim,
    },
    {
      label: 'Max Voltage',
      value: batteryMetrics.maxCellVoltage,
      icon: 'flash-outline',
      baseColor: '#facc15',
      gradient: ['#fde68a', '#ca8a04'],
      animRef: maxVoltageAnim,
    },
  ].map(({ label, value, icon, baseColor, gradient, animRef }, index) => (
    <View
      key={index}
      style={{
        width: '88%',
        marginBottom: 20,
        padding: 12,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 14,
        shadowColor: baseColor,
        shadowOpacity: 0.2,
        shadowRadius: 6,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <Icon name={icon} size={20} color={baseColor} style={{ marginRight: 8 }} />
        <Text style={{ color: '#f1f5f9', fontSize: 14, fontWeight: '600' }}>{label}</Text>
      </View>

      {/* Bar Background */}
      <View
        style={{
          height: 12,
          width: '100%',
          backgroundColor: '#1e293b',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {/* Animated Foreground */}
        <Animated.View
          style={{
            height: '100%',
            width: animRef.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
            backgroundColor: gradient[0],
            shadowColor: gradient[1],
            shadowOpacity: 0.6,
            shadowRadius: 6,
            borderRadius: 8,
          }}
        />
      </View>

      {/* Value Text */}
      <Text style={{
        marginTop: 6,
        textAlign: 'right',
        color: baseColor,
        fontSize: 16,
        fontWeight: 'bold',
      }}>
        {value?.toFixed(2)} V
      </Text>
    </View>
  ))}
</View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 20, marginBottom: 30 }}>
  <TachometerDial
    label="Current"
    value={Math.abs(batteryMetrics.batteryCurrent)}
    max={200} // Adjust to your max expected current
    unit="A"
    
  />
  <TachometerDial
    label="Energy"
    value={batteryMetrics.availableEnergy}
    max={20} // Adjust to your energy range
    unit="Wh"
   
  />
</View>

        {/* Grid Metrics */}
        <View style={styles.gridContainer}>
  {/* The remaining grid items (unchanged) */}
  {[
  {
    label: 'Min Temp',
    value: batteryMetrics.minCellTemp,
    fill: '#0ea5e9',
  },
  {
    label: 'Max Temp',
    value: batteryMetrics.maxCellTemp,
    fill: '#ef4444',
  },
].map(({ label, value, fill }, idx) => {
  const percentage = Math.min(Math.max((value + 10) / 90 * 100, 0), 100);
  return (
    <View
      key={idx}
      style={{
        width: '48%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
      }}
    >
      {/* Label */}
      <Text style={{
        color: '#e2e8f0',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        letterSpacing: 0.5,
      }}>
        {label}
      </Text>

      {/* Thermometer Tube */}
      <View style={{
        height: 100,
        width: 22,
        borderRadius: 11,
        backgroundColor: '#1e293b',
        overflow: 'hidden',
        justifyContent: 'flex-end',
        borderWidth: 2,
        borderColor: '#c0c0c0', // Silver border
        shadowColor: '#cbd5e1',
        shadowOpacity: 0.3,
        shadowRadius: 4,
        marginBottom: 10,
      }}>
        <View style={{
          height: `${percentage}%`,
          width: '100%',
          backgroundColor: fill,
          borderRadius: 10,
          shadowColor: fill,
          shadowOpacity: 0.5,
          shadowRadius: 8,
        }} />
      </View>

      {/* Temperature Value */}
      <Text style={{
        color: fill, // ✅ Now matches the bar color
        fontSize: 16,
        fontWeight: 'bold',
      }}>
        {value?.toFixed(1)} °C
      </Text>
    </View>
  );
})}

<View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
  <MiniArcGauge
    label="Drive Limit"
    value={batteryMetrics.driveCurrentLimit}
    color="#c084fc"
    gradient={['#e9d5ff', '#7c3aed']}
  />
  <MiniArcGauge
    label="Regen Limit"
    value={batteryMetrics.regenCurrentLimit}
    color="#22c55e"
    gradient={['#bbf7d0', '#15803d']}
  />
</View>
  <View
  style={{
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 16,
  }}
>
  <View
  style={{
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 16,
    marginBottom: 60, // to prevent overlap with bottom nav
  }}
>
  {[
    { label: 'Vehicle Mode', value: batteryMetrics.vehicleModeRequest, activeColor: '#38bdf8' },
    { label: 'Key On', value: batteryMetrics.keyOnIndicator, activeColor: '#fcd34d' },
  ].map(({ label, value, activeColor }, idx) => {
    const isActive = value === 1;

    return (
      <View
        key={idx}
        style={{
          width: '48%',
          paddingVertical: 10,
          paddingHorizontal: 8,
          backgroundColor: '#0f172a',
          marginLeft: idx === 0 ? 8 : 0,
  marginRight: idx === 1 ? -6 : 0,
          borderRadius: 12,
          alignItems: 'center',
          shadowColor: isActive ? activeColor : '#1e293b',
          shadowOpacity: isActive ? 0.3 : 0.1,
          shadowRadius: 4,
          borderWidth: 1.5,
          borderColor: isActive ? activeColor : '#334155',
        }}
      >
        <Text
          style={{
            fontSize: 13,
            color: '#e2e8f0',
            fontWeight: '600',
            marginBottom: 4,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontSize: 15,
            fontWeight: 'bold',
            color: isActive ? activeColor : '#64748b',
            letterSpacing: 0.5,
          }}
        >
          {isActive ? 'ON' : 'OFF'}
        </Text>
      </View>
    );
  })}
</View>
</View>
</View>
      </ScrollView>
      <BottomNavBar />
    </LinearGradient>
  );
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
export default BatteryHealth;