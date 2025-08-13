import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface StatusIndicatorProps {
  iconName: string;
  status: 'ok' | 'fault';
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ iconName, status }) => {
  const isOk = status === 'ok';
  const color = isOk ? '#22c55e' : '#f87171'; // green or red

  return (
    <View style={styles.iconWrapper}>
      <Icon name={iconName} size={24} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  iconWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    // ❌ Removed background, padding, shadows
  },
});

export default StatusIndicator;