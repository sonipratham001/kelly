import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import Svg, { Circle, Line, G, Path, Text as SvgText } from 'react-native-svg';

interface TachometerDialProps {
  label: string;
  value: number;
  max: number;
  unit: string;
}

const TachometerDial: React.FC<TachometerDialProps> = ({
  label,
  value,
  max,
  unit,
}) => {
  const dialSize = 220;
  const center = dialSize / 2;
  const radius = center - 6;

  const clamped = Math.min(Math.max(0, Math.abs(value)), max);
  const arcStartAngle = 90;
  const arcEndAngle = 450;
  const sweepAngle = arcEndAngle - arcStartAngle;
  const valueAngle = arcStartAngle + (clamped / max) * sweepAngle;

  const renderArc = (startDeg: number, endDeg: number, color: string) => {
    const r = radius;
    const startRad = (Math.PI * startDeg) / 180;
    const endRad = (Math.PI * endDeg) / 180;
    const x1 = center + r * Math.cos(startRad);
    const y1 = center + r * Math.sin(startRad);
    const x2 = center + r * Math.cos(endRad);
    const y2 = center + r * Math.sin(endRad);
    const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
    return (
      <Path
        d={`M${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2}`}
        stroke={color}
        strokeWidth={6}
        fill="none"
      />
    );
  };

  const needleAngleRad = (Math.PI * valueAngle) / 180;
  const needleLength = radius - 12;
  const needleX = center + needleLength * Math.cos(needleAngleRad);
  const needleY = center + needleLength * Math.sin(needleAngleRad);

  return (
    <View style={styles.container}>
      <Svg width={dialSize} height={dialSize}>
        {/* Background ring */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#c0c0c0"
          strokeWidth={3}
          fill="#0f172a"
        />

        {/* Arc Zones */}
        {renderArc(90, 210, '#22c55e')}    
        {renderArc(210, 300, '#facc15')}   
        {renderArc(300, 440, '#ef4444')}   

        {/* Tick Marks + Labels */}
        <G>
          {[...Array(12)].map((_, i) => {
            const angle = arcStartAngle + (i * sweepAngle) / 12;
            const rad = (Math.PI * angle) / 180;
            const x1 = center + (radius - 8) * Math.cos(rad);
            const y1 = center + (radius - 8) * Math.sin(rad);
            const x2 = center + radius * Math.cos(rad);
            const y2 = center + radius * Math.sin(rad);
            const labelVal = Math.round((i / 12) * max);
            const lx = center + (radius - 20) * Math.cos(rad);
            const ly = center + (radius - 20) * Math.sin(rad);
            return (
              <React.Fragment key={i}>
                <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth={2} />
                <SvgText
                  x={lx}
                  y={ly + 4}
                  fontSize="10"
                  fill="#e2e8f0"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {labelVal}
                </SvgText>
              </React.Fragment>
            );
          })}
        </G>

        {/* Needle */}
        <Line
          x1={center}
          y1={center}
          x2={needleX}
          y2={needleY}
          stroke="#c0c0c0"
          strokeWidth={3}
        />

        {/* Needle center dot */}
        <Circle
          cx={center}
          cy={center}
          r={5}
          fill="#c0c0c0"
          stroke="#ffffff"
          strokeWidth={1.5}
        />
      </Svg>

     {/* Label inside center of dial */}
<View style={styles.labelInsideDial}>
  <Text style={styles.label}>{label}</Text>
</View>

{/* Value below the circle */}
<View style={styles.valueBelowDial}>
  <Text style={styles.valueText}>
    {Math.abs(value).toFixed(1)} {unit}
  </Text>
</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelInsideDial: {
  position: 'absolute',
  alignItems: 'center',
  justifyContent: 'center',
  top: '45%',
  width: '100%',
},

valueBelowDial: {
  marginTop: 12,
  alignItems: 'center',
  justifyContent: 'center',
},
  valueText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  label: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
});

export default TachometerDial;