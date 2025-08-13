import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface GearSelectorProps {
  gear: 'r' | 'n' | 'f';
}

const gears: { label: string; key: GearSelectorProps['gear'] }[] = [
  { label: 'F', key: 'f' },
  { label: 'N', key: 'n' },
  { label: 'R', key: 'r' },
];

const GearSelector: React.FC<GearSelectorProps> = ({ gear }) => {
  return (
    <View style={styles.container}>
      {gears.map(({ label, key }) => {
        const isActive = key === gear; // ✅ no normalization
        return (
          <View
            key={key}
            style={[
              styles.gearBox,
              { backgroundColor: isActive ? '#22C55E' : '#1F2937' },
            ]}
          >
            <Text
              style={[
                styles.gearText,
                { color: isActive ? '#000' : '#9CA3AF' },
              ]}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column', // 🔁 now stacked vertically
    alignItems: 'center',
  },
  gearBox: {
    width: 40,
    height: 36,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    marginVertical: 2, // spacing between vertical boxes
  },
  gearText: {
    fontSize: 28,
    fontWeight: '600',
  },
});

export default GearSelector;