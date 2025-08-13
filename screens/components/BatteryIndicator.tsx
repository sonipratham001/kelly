import React from 'react';
import { View, StyleSheet } from 'react-native';

interface BatteryIndicatorProps {
  level: number; // battery percentage 0–100
  horizontal?: boolean; // layout direction
}

const BatteryIndicator: React.FC<BatteryIndicatorProps> = ({ level, horizontal = false }) => {
  const getColor = (value: number) => {
    if (value > 60) return '#22C55E'; // green
    if (value > 30) return '#FACC15'; // yellow
    return '#EF4444';                // red
  };

  const totalBars = 5;
  const activeBars = Math.ceil((level / 100) * totalBars);

  return (
    <View style={[styles.container, horizontal ? styles.horizontal : styles.vertical]}>
      {Array.from({ length: totalBars }, (_, i) => totalBars - 1 - i).map((index) => (
  <View
    key={index}
    style={[
      styles.bar,
      horizontal ? styles.barHorizontal : styles.barVertical,
      {
        backgroundColor: index < activeBars ? getColor(level) : '#1F2937',
      },
    ]}
  />
))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 2,
    backgroundColor: '#111827',
    borderRadius: 4,
  },
  vertical: {
    width: 40,
    height: 80,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'column',
  },
  horizontal: {
    height: 20,
    width: 60,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  bar: {
    borderRadius: 2,
  },
  barVertical: {
    width: '100%',
    height: 14,
  },
  barHorizontal: {
    height: '100%',
    width: 12,
  },
});

export default BatteryIndicator;