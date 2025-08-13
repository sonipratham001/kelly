import React from 'react';
import Svg, { Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';
import { View, StyleSheet, useWindowDimensions } from 'react-native';

interface BlueGlowProps {
  glowColor?: string;
  glowIntensity?: number;
}

const BlueGlow: React.FC<BlueGlowProps> = ({
  glowColor = '#3b82f6',
  glowIntensity = 1,
}) => {
  const { width, height } = useWindowDimensions();

  const baseWidth = Math.min(width, height) * 0.45;
  const baseHeight = baseWidth * 0.35;

  const centerX = width / 2;
  const centerY = height / 2.25;

  const topOpacity = 0.3 + glowIntensity * 0.4;
  const midOpacity = 0.15 + glowIntensity * 0.2;

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id="glowGrad3D" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={glowColor} stopOpacity={topOpacity} />
            <Stop offset="70%" stopColor={glowColor} stopOpacity={midOpacity} />
            <Stop offset="100%" stopColor={glowColor} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* Outer glow ellipse (3D base) */}
        <Ellipse
          cx={centerX}
          cy={centerY + baseHeight * 0.5}
          rx={baseWidth}
          ry={baseHeight}
          fill="url(#glowGrad3D)"
        />

        {/* Inner concentrated glow */}
        {/* Inner subtle mist glow */}
<Ellipse
  cx={centerX}
  cy={centerY + baseHeight * 0.35}
  rx={baseWidth * 0.4}
  ry={baseHeight * 0.25}
  fill="url(#glowGrad3D)"  // Use gradient, not solid
  opacity={0.2 + glowIntensity * 0.1}
/>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
});

export default BlueGlow;