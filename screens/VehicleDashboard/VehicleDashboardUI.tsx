import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import GearSelector from '../components/GearSelector';
import BatteryIndicator from '../components/BatteryIndicator';
import BottomNavBar from '../components/BottomNavBar';
import LinearGradient from 'react-native-linear-gradient';
import BlueGlow from '../components/BlueGlow';
import RedOuterBorder from '../components/DesignLines';
import StatusIndicator from '../components/StatusIndicator';
import ModeButton from '../components/ModeButton';
import GlowingImage from '../components/GlowingImage';
import { scale, verticalScale, fontScale } from '../../src/utils/scale';
const {width, height} = Dimensions.get('window');

interface VehicleDashboardUIProps {
  speed?: number;
  time?: string;
  batteryPercentage?: number;
  gear?: 'f' | 'n' | 'r';
  mode?: 'eco' | 'sports';
  range?: number;
  odometer?: number;
  leftSignal?: boolean;
rightSignal?: boolean;
  brakeStatus?: {
    bf?: boolean;
    hb?: boolean;
    s?: boolean;
  };
  isConnected: boolean;
  headlightStatus?: {
    low?: boolean;
    high?: boolean;
    hazard?: boolean;
    service?: boolean;
  };
  batteryHasFault?: boolean;
motorHasFault?: boolean;
glowColor?: string;
  glowIntensity?: number;
}

const VehicleDashboardUI: React.FC<VehicleDashboardUIProps> = ({
  speed,
  time,
  batteryPercentage,
  gear,
  mode,
  range,
  odometer,
  leftSignal,
  rightSignal,
  brakeStatus,
  isConnected,
  headlightStatus,
  batteryHasFault,
  motorHasFault,
  glowColor,
  glowIntensity
}) => {

  const leftBlinkAnim = useRef(new Animated.Value(1)).current;
const rightBlinkAnim = useRef(new Animated.Value(1)).current;

const leftAnimRef = useRef<Animated.CompositeAnimation | null>(null);
const rightAnimRef = useRef<Animated.CompositeAnimation | null>(null);

useEffect(() => {
  if (leftSignal) {
    leftAnimRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(leftBlinkAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(leftBlinkAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );
    leftAnimRef.current.start();
  } else {
    if (leftAnimRef.current) {
      leftAnimRef.current.stop();
      leftAnimRef.current = null;
    }
    // Reset using an animated timing instead of setValue directly
    Animated.timing(leftBlinkAnim, {
      toValue: 1,
      duration: 100, // short reset animation
      useNativeDriver: true,
    }).start();
  }
}, [leftSignal]);

useEffect(() => {
  if (rightSignal) {
    rightAnimRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(rightBlinkAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(rightBlinkAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );
    rightAnimRef.current.start();
  } else {
    if (rightAnimRef.current) {
      rightAnimRef.current.stop();
      rightAnimRef.current = null;
    }
    Animated.timing(rightBlinkAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }
}, [rightSignal]);
  return (
    <LinearGradient
      colors={['#0a0f1c', '#1f2937', '#111827']}
      style={{flex: 1}}>
      <SafeAreaView style={{flex: 1}}>
       <View style={{ flex: 1, justifyContent: 'space-between' }}>
          {/* <CurvedPartitionLines /> */}
          <RedOuterBorder />
          
          <View style={styles.container}>
            {/* Turn Signals Row */}
            <View style={styles.topRow}>
  <Animated.View style={{opacity: leftBlinkAnim, marginLeft: 2}}>
    <Icon name="arrow-left-bold" size={56} color="#facc15" />
  </Animated.View>

  <View style={styles.timeContainer}>
    <Text style={styles.digitalTimeText}>{time || '--:--'}</Text>
  </View>

  
<Animated.View style={{opacity: rightBlinkAnim, marginRight: 2}}>
    <Icon name="arrow-right-bold" size={56} color="#facc15" />
  </Animated.View>
</View>

              
            <View style={styles.logoWithStatusRow}>
  <View style={styles.logoContainer}>
    <Image
      source={require('../../assets/intuteLogo.png')}
      style={styles.logo}
      resizeMode="contain"
    />
  </View>
</View>

            

            {/* Headlights, Hazard, Low Beam */}
            <View style={{ position: 'absolute', top: 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around' }}>
  <View style={{ marginRight: 100 }}>
    <Icon
      name="car-light-high"
      size={48}
      color={headlightStatus?.high ? '#3b82f6' : '#1e293b'}
    />
  </View>
  <View style={{ marginLeft: 100 }}>
    <Icon
      name="car-light-dimmed"
      size={48}
      color={headlightStatus?.low ? '#3b82f6' : '#1e293b'}
    />
  </View>
</View>
            {/* Gear & Battery Info */}
            <View style={styles.cornerInfoRow}>
              <View style={styles.leftSide}>
                <GearSelector gear={gear ?? 'n'} />
              </View>

              <View style={styles.rightSide}>
                <BatteryIndicator
                  level={batteryPercentage ?? 0}
                  horizontal={false}
                />
                <Text style={styles.value}>{batteryPercentage ?? '--'}%</Text>
              </View>
            </View>

<View style={styles.centerStack}>
  <View style={styles.speedWithGlow}>
     <View style={{ marginTop: verticalScale(100), position: 'absolute' }}>
    <BlueGlow glowColor={glowColor} glowIntensity={glowIntensity} />
  </View>
    <View style={styles.speedContainer}>
      <Text style={styles.speedText}>{speed ?? '--'}</Text>
      <Text style={styles.kmph}>km/h</Text>
    </View>
  </View>

 <View style={{ marginTop: verticalScale(65) }} />

   {/* ECO & SPORTS Row */}
            <View style={styles.modeRow}>
              <ModeButton
  active={mode === 'eco'}
  icon="leaf"
  label="ECO"
  defaultColor="#10b981" // Tailwind green-500
/>

<ModeButton
  active={mode === 'sports'}
  icon="lightning-bolt"
  label="SPORTS"
  defaultColor="#ef4444" // Tailwind red-500
/>
            </View>
</View>

<View style={styles.rangeOdoRow}>
{/* Range & Odometer Row */}
  <View style={styles.metricBoxLeft}>
    <Icon name="map-marker-distance" size={36} color="#60a5fa" />
    <View style={{alignItems: 'center'}}>
      <Text style={styles.metricText}>Range</Text>
      <Text style={styles.metricText}>{range ?? '--'} km</Text>
    </View>
  </View>
  <View style={styles.metricBoxRight}>
    <Icon name="speedometer" size={36} color="#60a5fa" />
    <View style={{alignItems: 'center'}}>
      <Text style={styles.metricText}>Odo</Text>
      <Text style={styles.metricText}>
        {odometer ? odometer.toFixed(1) : '--'} km
      </Text>
    </View>
  </View>
  </View>

<View style={styles.verticalStatusColumn}>
    <View style={styles.statusIconBox}>
      <Icon name="car-brake-parking" size={28} color="#f87171" />
    </View>

    <View style={styles.statusIconBox}>
      <GlowingImage
        source={require('../../assets/brake-pad-warning.png')}
        glowColor="#f87171"
        active={!!brakeStatus?.bf}
        size={130}
      />
    </View>

    <View style={styles.statusIconBox}>
      <StatusIndicator
        iconName="battery-charging-high"
        status={batteryHasFault ? 'fault' : 'ok'}
      />
    </View>

    <View style={styles.statusIconBox}>
      <StatusIndicator
        iconName="engine-outline"
        status={motorHasFault ? 'fault' : 'ok'}
      />
    </View>
  </View>
           
            
          </View>
        </View>

        <BottomNavBar />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
  flex: 1,
  justifyContent: 'space-between',
  paddingHorizontal: 16,
  paddingBottom: verticalScale(40),
},
  topRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: verticalScale(-7),
  marginBottom: verticalScale(8),
  paddingHorizontal: scale(16),
},
 timeContainer: {
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  paddingVertical: 0,
  paddingHorizontal: 10,
  borderRadius: 4,
  borderWidth: 1.5,
  borderColor: '#ffffffaa',
  shadowColor: '#0ea5e9',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.5,
  shadowRadius: 2,
  elevation: 2,
  alignSelf: 'center',     // ensures tight fit
  alignItems: 'center',    // centers the text inside
  justifyContent: 'center' // vertically center it
},

digitalTimeText: {
  fontSize: fontScale(16),
  fontWeight: 'bold',
  color: '#f1f5f9',
  letterSpacing: scale(2),
  fontVariant: ['tabular-nums'],
  textShadowColor: '#38bdf8',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: scale(2),
},
 cornerInfoRow: {
  position: 'absolute',
  top: height * 0.30, // just below logo — tweak as needed
  left: 0,
  right: 0,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: width * 0.11, // adjust spacing from screen edge
  zIndex: 4,
},

  leftSide: {
  alignItems: 'flex-start',
  marginTop: 0,
  marginLeft: 16,
},

  rightSide: {
  alignItems: 'flex-end',
  marginTop: 0,
  marginRight: 16,
},
  value: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 2,
  },
  speedContainer: {
    alignItems: 'center',
    // marginTop: verticalScale(-height * 0.7),
  },
  speedText: {
  fontSize: fontScale(68),
  fontWeight: 'bold',
  color: '#fff',
},
  kmph: {
    fontSize: 18,
    color: '#ccc',
  },
 modeRow: {
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 12,         // Optional: adds spacing between ECO and SPORTS
   marginTop: verticalScale(4),
  marginBottom: verticalScale(4),
},
speedWithGlow: {
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
},
  centerStack: {
  position: 'absolute',
  top: height * 0.25, // ⬅️ You can try 0.25, 0.26 etc. to adjust height
  left: 0,
  right: 0,
  alignItems: 'center',
  zIndex: 3,
},
 statusIconBox: {
  height: 32,
  width: 32,
  justifyContent: 'center',
  alignItems: 'center',
},
  modeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  rangeOdoRow: {
  position: 'absolute',
    bottom: height * 0.16, // just above bottom nav bar
  left: 0,
  right: 0,
  flexDirection: 'row',
  justifyContent: 'space-between',
  paddingHorizontal: scale(28),
  zIndex: 5,
},
  activeEcoText: {
    color: '#10b981',
  },
  activeSportText: {
    color: '#f43f5e',
  },
metricBoxLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
},

metricBoxRight: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
},
  metricText: {
    fontSize: 18,
    color: '#e5e7eb',
  },
verticalStatusColumn: {
  position: 'absolute',
  right: scale(0),
  top: height * 0.2,
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
  zIndex: 10,
},
  logoContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  logo: {
    width: 200,
    height: 60,
  },
  logoWithStatusRow: {
  position: 'absolute',
  top: height * 0.1, // adjust as needed (try 0.13, 0.15)
  left: 0,
  right: 0,
  alignItems: 'center',
  zIndex: 4,
},
});

export default VehicleDashboardUI;