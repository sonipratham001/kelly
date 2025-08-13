import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, RadialGradient, Rect } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const AnimatedPath = Animated.createAnimatedComponent(Path);

const CurvedPartitionLines = () => {
  const arcHeight = 200;
  const animatedStroke = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.timing(animatedStroke, {
      toValue: 0.9,
      duration: 6000,
      useNativeDriver: false,
    }).start();
  }, []);

  const defs = (
    <Defs>
      <LinearGradient id="glowPrimary" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.1" />
        <Stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.9" />
        <Stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.1" />
      </LinearGradient>
      <LinearGradient id="glowSecondary" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.1" />
        <Stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.8" />
        <Stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.1" />
      </LinearGradient>
      <RadialGradient id="ambient" cx="50%" cy="50%" rx="50%" ry="50%">
        <Stop offset="0%" stopColor="#38bdf8" stopOpacity="0.15" />
        <Stop offset="100%" stopColor="#000" stopOpacity="0" />
      </RadialGradient>
    </Defs>
  );

  const baseArcs = [
  {
    d: `M0,${arcHeight} Q${width / 2},-180 ${width},${arcHeight}`,
    stroke: 'url(#glowPrimary)',
    width: 5,
    opacity: 0.2,
  },
  {
    d: `M10,${arcHeight - 14} Q${width / 2},-150 ${width - 10},${arcHeight - 14}`,
    stroke: 'url(#glowSecondary)',
    width: 4,
    opacity: 0.25,
  },
  {
    d: `M20,${arcHeight - 28} Q${width / 2},-120 ${width - 20},${arcHeight - 28}`,
    stroke: 'url(#glowPrimary)',
    width: 3,
    opacity: 0.3,
  },
  {
    d: `M30,${arcHeight - 42} Q${width / 2},-90 ${width - 30},${arcHeight - 42}`,
    stroke: 'url(#glowSecondary)',
    width: 2,
    opacity: 0.35,
  },
];

const animatedArc = {
  d: `M40,${arcHeight - 56} Q${width / 2},-60 ${width - 40},${arcHeight - 56}`,
  width: 2,
  stroke: 'url(#glowPrimary)',
};

  const renderLayer = (style: any, prefix: string, rotate?: string, offset = 0) => (
    <Svg
      height={arcHeight}
      width={width}
      style={{
        position: 'absolute',
        zIndex: 0,
        ...style,
        transform: rotate ? [{ rotate }] : [],
        ...(offset !== 0 ? { left: offset } : {}),
      }}
    >
      {defs}
      <Rect x="0" y="0" width={width} height={arcHeight} fill="url(#ambient)" />
      {baseArcs.map((arc, i) => (
        <Path
          key={`${prefix}-arc-${i}`}
          d={arc.d}
          fill="none"
          stroke={arc.stroke}
          strokeWidth={arc.width}
          strokeOpacity={arc.opacity}
          strokeLinecap="round"
        />
      ))}
      <AnimatedPath
        d={animatedArc.d}
        fill="none"
        stroke={animatedArc.stroke}
        strokeWidth={animatedArc.width}
        strokeOpacity={animatedStroke}
        strokeLinecap="round"
      />
    </Svg>
  );

  const renderConcentratingArcs = () => (
    <Svg
      height={height}
      width={width}
      style={{ position: 'absolute', top: 0, left: 0, zIndex: -1 }}
    >
      {defs}
      {[...Array(8)].map((_, i) => {
        const radius = 220 - i * 20;
        const opacity = 0.25 - i * 0.025;
        return (
          <Path
            key={`converge-${i}`}
            d={`M${width / 2 - radius},${height / 2} A${radius},${radius} 0 0,1 ${width / 2 + radius},${height / 2}`}
            fill="none"
            stroke="url(#glowPrimary)"
            strokeWidth={2}
            strokeOpacity={opacity}
            strokeLinecap="round"
          />
        );
      })}
    </Svg>
  );

  return (
    <>
      {/* Left */}
      {renderLayer({ top: height / 2, left: -arcHeight / 2 }, 'left', '-90deg')}
      {renderLayer({ top: height / 2, left: -arcHeight * 0.7 }, 'left2', '-90deg')}

      {/* Right */}
      {renderLayer({ top: height / 2, right: -arcHeight / 2 }, 'right', '90deg')}
      {renderLayer({ top: height / 2, right: -arcHeight * 0.7 }, 'right2', '90deg')}

      {/* Center Concentration */}
      {renderConcentratingArcs()}
    </>
  );
};

export default CurvedPartitionLines;