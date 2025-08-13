import { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";
import Svg, { Defs, Path, Stop, LinearGradient as SvgLinearGradient } from "react-native-svg";

const AnimatedPath = Animated.createAnimatedComponent(Path);

const MiniArcGauge = ({ label, value, gradient, color }: {
  label: string;
  value: number;
  gradient: string[];
  color: string;
}) => {
  const radius = 45;
  const circumference = Math.PI * radius;
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: Math.min(Math.max(value / 200, 0), 1), // normalized
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minWidth: 150 }}>
      <Svg width={110} height={70} viewBox="0 0 110 70">
        <Defs>
          <SvgLinearGradient id={`grad-${label}`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor={gradient[0]} />
            <Stop offset="100%" stopColor={gradient[1]} />
          </SvgLinearGradient>
        </Defs>

        {/* Silver Border */}
        {/* Silver Outer Border (slightly larger radius) */}
<Path
  d="M 8 58 A 52 52 0 0 1 102 58"
  stroke="#c0c0c0"
  strokeWidth="2"
  fill="none"
/>

        {/* Background Track */}
        <Path
          d="M 10 60 A 50 50 0 0 1 100 60"
          stroke="#1e293b"
          strokeWidth="10"
          fill="none"
        />

        {/* Animated Progress Arc */}
        <AnimatedPath
          d="M 10 60 A 50 50 0 0 1 100 60"
          stroke={`url(#grad-${label})`}
          strokeWidth="10"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>

      <Text style={{ color, fontSize: 16, fontWeight: 'bold', marginTop: 6 }}>
        {value} A
      </Text>
      <Text style={{ color: '#94a3b8', fontSize: 13 }}>{label}</Text>
    </View>
  );
};

export default MiniArcGauge;