import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const CurvedPartitionLines = () => {
  // Responsive Y positions
  const speedometerY = height * 0.53;
  const topBaseY = height * 0.33;
  const curveHeight = height * 0.12;

  // Responsive X positions
  const horizontalStart = width * 0.1;
  const horizontalCurve1 = width * 0.13;
  const horizontalCurve2 = width * 0.19;
  const horizontalEnd = width * 0.19;

  const controlOffsetY1 = height * 0.09;
  const controlOffsetY2 = height * 0.015;

  const shiftX = width * 0.05;
  const shiftY = width * 0.05;

  const centerOffsetLeft = width / 2 - width * 0.09;
  const centerOffsetRight = width / 2 + width * 0.14;

  // Bottom-Left Curve
  const bottomLeft = `
    M${horizontalStart},${speedometerY + curveHeight}
    C${horizontalCurve1},${speedometerY + controlOffsetY1} ${horizontalCurve2},${speedometerY - controlOffsetY2} ${horizontalEnd},${speedometerY}
    L${centerOffsetLeft},${speedometerY}
  `;

  // Bottom-Right Curve
  const bottomRight = `
    M${width - horizontalStart + shiftY},${speedometerY + curveHeight}
    C${width - horizontalCurve1 + shiftY},${speedometerY + controlOffsetY1} ${width - horizontalCurve2 + shiftY},${speedometerY - controlOffsetY2} ${width - horizontalEnd + shiftY},${speedometerY}
    L${centerOffsetRight},${speedometerY}
  `;

  // Top-Left Curve
  const topLeft = `
    M${horizontalStart},${topBaseY - curveHeight}
    C${horizontalCurve1},${topBaseY - controlOffsetY1} ${horizontalCurve2},${topBaseY + controlOffsetY2} ${horizontalEnd},${topBaseY}
    L${centerOffsetLeft},${topBaseY}
  `;

  // Top-Right Curve
  const topRight = `
    M${width - horizontalStart + shiftX},${topBaseY - curveHeight}
    C${width - horizontalCurve1 + shiftX},${topBaseY - controlOffsetY1} ${width - horizontalCurve2 + shiftX},${topBaseY + controlOffsetY2} ${width - horizontalEnd + shiftX},${topBaseY}
    L${centerOffsetRight},${topBaseY}
  `;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg height="100%" width="100%">
        <Defs>
          <LinearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#A9A9A9" />
            <Stop offset="50%" stopColor="#C0C0C0" />
            <Stop offset="100%" stopColor="#E0E0E0" />
          </LinearGradient>
        </Defs>
        <Path d={topLeft} stroke="url(#lineGradient)" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        <Path d={topRight} stroke="url(#lineGradient)" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        <Path d={bottomLeft} stroke="url(#lineGradient)" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        <Path d={bottomRight} stroke="url(#lineGradient)" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      </Svg>
    </View>
  );
};

export default CurvedPartitionLines;