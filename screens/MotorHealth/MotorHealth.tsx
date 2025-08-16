import React, { useContext, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Line, Circle, Defs, Stop, LinearGradient as SvgLinearGradient, Text as SvgText } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BarChart } from 'react-native-gifted-charts';
import { BatteryBluetoothContext } from '../../services/BatteryBluetoothProvider';
import BottomNavBar from '../components/BottomNavBar';
import styles from './MotorHealthStyles';
import { MOTOR_FAULT_MAPPINGS } from '../../src/utils/faultMappings'; // adjust path if needed
import TachometerDial from '../components/TachometerDial';


const screenWidth = Dimensions.get('window').width;
const contentWidth = 320 + 140; // 320 for bar chart card, ~140 for metrics block
const horizontalMargin = (screenWidth - contentWidth) / 2;const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedText = Animated.createAnimatedComponent(Text);


const MAX_RPM = 6000;
const ARC_LENGTH = 251.2;

const MotorHealth = () => {
  const { data = {} } = useContext(BatteryBluetoothContext);
  const mcu1 = data.messageMCU1 || {};
  const mcu2 = data.messageMCU2 || {};
  const mcu3 = data.messageMCU3 || {};

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const animatedRpm = useRef(new Animated.Value(0)).current;
  const [rpm, setRpm] = useState(0);
  const animatedOdometer = useRef(new Animated.Value(Number(mcu2.odometer) || 0)).current;
const [brakePulse, setBrakePulse] = useState(new Animated.Value(1));
const [driveModeColor, setDriveModeColor] = useState('#f472b6'); // default pink
const [odometerDisplay, setOdometerDisplay] = useState((Number(mcu2.odometer) || 0).toFixed(1));
const animatedBrake = useRef(new Animated.Value(Number(mcu1.brake) || 0)).current;

  useEffect(() => {
    const newRpm = mcu2.motorRPM || 0;
    setRpm(newRpm);
    Animated.timing(animatedRpm, {
      toValue: newRpm,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
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
    ]).start();
  }, []);

   useEffect(() => {
  const odometer = Number(mcu2.odometer) || 0;
  Animated.timing(animatedOdometer, {
    toValue: odometer,
    duration: 800,
    useNativeDriver: false,
    easing: Easing.out(Easing.cubic),
  }).start();

  const listener = animatedOdometer.addListener(({ value }) => {
    setOdometerDisplay(value.toFixed(1));
  });

  return () => {
    animatedOdometer.removeListener(listener);
  };
}, [mcu2.odometer]);

 const loopRef = useRef<Animated.CompositeAnimation | null>(null);

useEffect(() => {
  const brakeValue = Number(mcu1.brake) || 0;
  if (brakeValue > 70) {
    if (!loopRef.current) {
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(brakePulse, { toValue: 1.2, duration: 300, useNativeDriver: true }),
          Animated.timing(brakePulse, { toValue: 1.0, duration: 300, useNativeDriver: true }),
        ])
      );
      loopRef.current.start();
    }
  } else {
    loopRef.current?.stop();
    loopRef.current = null;
    brakePulse.setValue(1);
  }
}, [mcu1.brake]);

useEffect(() => {
  Animated.timing(animatedBrake, {
    toValue: Number(mcu1.brake) || 0,
    duration: 800,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: false,
  }).start();
}, [mcu1.brake]);

useEffect(() => {
  const mode = mcu1.driveMode;
  if (mode === 1) setDriveModeColor('#22c55e'); // Eco
  else if (mode === 2) setDriveModeColor('#3b82f6'); // Normal
  else if (mode === 3) setDriveModeColor('#ef4444'); // Sport
  else setDriveModeColor('#f472b6'); // Default fallback
}, [mcu1.driveMode]);

  const strokeColor = rpm < 2000 ? '#10b981' : rpm < 4000 ? '#facc15' : '#ef4444';

  const getNeedleCoords = (rpmVal: number) => {
    const angle = Math.PI - (Math.min(rpmVal, MAX_RPM) / MAX_RPM) * Math.PI;
    const radius = 72;
    const cx = 100;
    const cy = 100;
    return {
      x2: cx + radius * Math.cos(angle),
      y2: cy - radius * Math.sin(angle),
    };
  };

  const coords = getNeedleCoords(rpm);

  const performanceData = [
  {
    value: mcu1.speed || 0,
    label: 'Speed',
    frontColor: 'transparent',
    gradientColor: '#60a5fa',
  },
  {
    value: mcu1.throttle || 0,
    label: 'Throttle',
    frontColor: 'transparent',
    gradientColor: '#34d399',
  },
  { value: mcu2.rmsCurrent || 0, label: 'RMS Curr', frontColor: 'transparent', gradientColor: '#f472b6' },
];

  const animatedVoltage = useRef(new Animated.Value(0)).current;
  const animatedBrakeOffset = animatedBrake.interpolate({
  inputRange: [0, 100],
  outputRange: [125.6, 0],
});
useEffect(() => {
  const voltage = Math.min(mcu2.capacitorVoltage || 0, 90);
  Animated.timing(animatedVoltage, {
    toValue: voltage,
    duration: 800,
    useNativeDriver: false,
  }).start();
}, [mcu2.capacitorVoltage]);

const ARC_LENGTH = 251.2;
const ARC_MARGIN = 10;
const brakeColor = animatedBrake.interpolate({
  inputRange: [0, 70, 100],
  outputRange: ['#22c55e', '#facc15', '#ef4444'],
});
const glowOpacity = animatedBrake.interpolate({
  inputRange: [0, 100],
  outputRange: [0, 0.8],
});
const animatedStroke = animatedVoltage.interpolate({
  inputRange: [0, 90],
  outputRange: [ARC_LENGTH - ARC_MARGIN, ARC_MARGIN], // [241.2, 10]
});

  return (
    <LinearGradient colors={['#0a0f1c', '#1f2937', '#111827']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* RPM Gauge */}
        <Animated.View
          style={{ alignItems: 'center', marginVertical: 30, width: '100%', opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Svg width={260} height={140} viewBox="0 0 200 100">
  <Defs>
    <SvgLinearGradient id="rpmGradient" x1="0" y1="0" x2="1" y2="0">
      <Stop offset="0%" stopColor="#facc15" />
      <Stop offset="100%" stopColor="#ef4444" />
    </SvgLinearGradient>
  </Defs>

  {/* 1. Inner Fill FIRST (so it goes in the back) */}
  <Path
    d="M 28 100 A 72 72 0 0 1 172 100"
    stroke="#0f172a"
    strokeWidth="36"
    fill="none"
  />

  {/* 2. Middle Background Arc */}
  <Path
    d="M 20 100 A 80 80 0 0 1 180 100"
    stroke="#334155"
    strokeWidth="14"
    fill="none"
    opacity={1} // full opacity to make sure it's visible
  />

  {/* 3. Animated Foreground Arc */}
  <AnimatedPath
    d="M 20 100 A 80 80 0 0 1 180 100"
    stroke={strokeColor}
    strokeWidth="14"
    fill="none"
    strokeDasharray={`${ARC_LENGTH}`}
    strokeDashoffset={animatedRpm.interpolate({
      inputRange: [0, MAX_RPM],
      outputRange: [ARC_LENGTH - 10, 10],
    })}
    strokeLinecap="round"
  />

  {/* 4. Silver Outline Arc (always on top) */}
  <Path
  d="M 20 100 A 80 80 0 0 1 180 100" // match all other arc paths
  stroke="silver"
  strokeWidth="2.5" // slightly wider than 2 for visibility
  fill="none"
/>

  {/* 5. Needle */}
  <Line
    x1="100"
    y1="100"
    x2={coords.x2}
    y2={coords.y2}
    stroke={strokeColor}
    strokeWidth="3"
    strokeLinecap="round"
    strokeDasharray="2,1"
  />
  <Circle cx="100" cy="100" r="4" fill={strokeColor} stroke="white" strokeWidth={1} />

  {/* 6. Labels */}
  <SvgText x="38" y="98" fill="#94a3b8" fontSize="12" textAnchor="middle">0</SvgText>
  <SvgText x="100" y="60" fill="#94a3b8" fontSize="12" textAnchor="middle">4000</SvgText>
  <SvgText x="162" y="98" fill="#94a3b8" fontSize="12" textAnchor="middle">8000</SvgText>
</Svg>
          <AnimatedText style={{
  color: '#fff',
  fontSize: 22,
  fontWeight: 'bold',
  marginTop: 0,         // ✅ Was -26, now pulled below needle
  marginBottom: 2,
  textShadowColor: 'rgba(255,255,255,0.8)',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 6,
}}>
  {Math.round(rpm)} RPM
</AnimatedText>
<Text style={{ color: '#94a3b8', fontSize: 14 }}>Motor RPM</Text>
        </Animated.View>

       <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginVertical: 30 }}>
  <TachometerDial
    label="Speed"
    value={mcu1.speed || 0}
    max={120} // set according to your vehicle max speed
    unit="km/h"
  />
  <TachometerDial
    label="Throttle"
    value={mcu1.throttle || 0}
    max={100} // throttle percentage
    unit="%"
  />
  <TachometerDial
    label="RMS Curr"
    value={mcu2.rmsCurrent || 0}
    max={200}
    unit="A"
  />
</View>


        {/* Temps */}
        <View style={{ marginVertical: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 30 }}>
  {[
    ['Controller Temp', mcu1.controllerTemperature, '#f87171'],
    ['Motor Temp', mcu1.motorTemperature, '#fb923c'],
  ].map(([label, value, color], idx) => {
    const temp = Number(value) || 0;
    return (
      <View
        key={idx}
        style={{
          alignItems: 'center',
          marginRight: idx === 0 ? 250 : 0, // Adds gap only after the first item
        }}>
        <View style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          borderWidth: 3,
          borderColor: 'silver',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#0f172a',
          shadowColor: '#ffffff',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
        }}>
          <Text style={{ color, fontSize: 20, fontWeight: 'bold' }}>{temp}°C</Text>
        </View>
        <Text style={{ color: '#cbd5e1', fontSize: 14, marginTop: 8 }}>{label}</Text>
      </View>
    );
  })}
</View>

          {/* Capacitor Voltage */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
  <Svg width={200} height={110} viewBox="0 0 200 100">
    <Defs>
      <SvgLinearGradient id="capGradient" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0%" stopColor="#06b6d4" />
        <Stop offset="100%" stopColor="#3b82f6" />
      </SvgLinearGradient>
    </Defs>

    {/* Silver Boundary Ring */}
    <Path
      d="M 20 100 A 80 80 0 0 1 180 100"
      stroke="silver"
      strokeWidth="16"
      fill="none"
    />

    {/* Background Arc */}
    <Path
      d="M 20 100 A 80 80 0 0 1 180 100"
      stroke="#1e293b"
      strokeWidth="12"
      fill="none"
    />

    {/* Animated Voltage Arc */}
    <AnimatedPath
      d="M 20 100 A 80 80 0 0 1 180 100"
      stroke="url(#capGradient)"
      strokeWidth="12"
      fill="none"
      strokeDasharray={`${ARC_LENGTH}`}
      strokeDashoffset={animatedStroke}
      strokeLinecap="butt"
    />

    {/* Tick Labels */}
    <SvgText x="30" y="98" fill="#94a3b8" fontSize="12" textAnchor="start">0</SvgText>
    <SvgText x="100" y="75" fill="#94a3b8" fontSize="12" textAnchor="middle">45</SvgText>
    <SvgText x="170" y="98" fill="#94a3b8" fontSize="12" textAnchor="end">90</SvgText>
  </Svg>

  {/* Voltage Value */}
  <Text style={{
    color: '#e0f2fe',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: -10,
    textShadowColor: 'rgba(255,255,255,0.15)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  }}>
    {mcu2.capacitorVoltage?.toFixed(1)} V
  </Text>

  {/* Label */}
  <Text style={{ color: '#60a5fa', fontSize: 16, marginTop: 4 }}>Capacitor Voltage</Text>
</View>

          {/* Grid Metrics */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 20, marginBottom: 40 }}>
  {/* Odometer Card */}
  <View style={{
    width: 100,
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#34d399',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#34d399',
  }}>
    <Icon name="map-marker-distance" size={60} color="#34d399" />
    <Text style={styles.metricText}>Odo</Text>
    <AnimatedText style={{ color: '#34d399', fontSize: 20, fontFamily: 'monospace' }}>
      {odometerDisplay}
    </AnimatedText>
    <Text style={{ color: '#64748b', fontSize: 12 }}>km</Text>
  </View>

  {/* Brake Card */}
<Animated.View style={{
  width: 100,
  backgroundColor: '#0f172a',
  padding: 10,
  borderRadius: 14,
  alignItems: 'center',
  transform: [{ scale: brakePulse }],
  shadowColor: '#facc15',
  shadowOpacity: 0.3,
  shadowRadius: 6,
  borderWidth: 1,
  borderColor: '#facc15',
}}>
  <Svg width={80} height={50} viewBox="0 0 100 50">
    {/* Background Arc */}
    <Path
      d="M 10 50 A 40 40 0 0 1 90 50"
      stroke="#1e293b"
      strokeWidth="10"
      fill="none"
    />
    {/* Animated Foreground Arc */}
    <AnimatedPath
      d="M 10 50 A 40 40 0 0 1 90 50"
      stroke={brakeColor}
      strokeWidth="10"
      fill="none"
      strokeDasharray="125.6"
      strokeDashoffset={animatedBrakeOffset}
      strokeLinecap="round"
    />
  </Svg>
<Animated.Text style={[styles.metricText, { color: brakeColor }]}>Brake</Animated.Text>
<Animated.Text style={{ fontWeight: 'bold', fontSize: 20, color: brakeColor }}>
  {Number(mcu1.brake) || 0}%
</Animated.Text>
</Animated.View>

  {/* Drive Mode Card */}
  <View style={{
    width: 100,
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: driveModeColor,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: driveModeColor,
  }}>
    <Icon name="steering" size={60} color={driveModeColor} />
    <Text style={styles.metricText}>Mode</Text>
    <Text style={{ color: driveModeColor, fontWeight: 'bold', fontSize: 20 }}>
      {mcu1.driveMode || '--'}
    </Text>
  </View>
</View>
        </View>

        <View style={{ marginHorizontal: 20, marginBottom: 40 }}>
  <Text style={{ color: '#e2e8f0', fontSize: 18, fontWeight: 'bold', marginBottom: 12,  textAlign: 'center', }}>
    Motor Faults
  </Text>

  {(mcu3.faultMessages || ['NoFaultsDetected']).map((faultKey: string, idx: number) => {
    const fault = MOTOR_FAULT_MAPPINGS[faultKey] || {
      label: faultKey,
      icon: 'alert-circle-outline',
      severity: 'warning',
    };

    const color =
      fault.severity === 'critical'
        ? '#ef4444'
        : fault.severity === 'warning'
        ? '#facc15'
        : '#10b981';

    return (
      <View
        key={idx}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#1e293b',
          borderRadius: 12,
          padding: 12,
          marginBottom: 10,
          borderLeftWidth: 4,
          borderLeftColor: color,
          shadowColor: color,
          shadowOpacity: 0.2,
          shadowRadius: 4,
        }}
      >
        <Icon name={fault.icon} size={28} color={color} style={{ marginRight: 12 }} />
        <Text style={{ color: '#f1f5f9', fontSize: 15 }}>{fault.label}</Text>
      </View>
    );
  })}
</View>
      </ScrollView>
      <BottomNavBar />
    </LinearGradient>
  );
};

export default MotorHealth;