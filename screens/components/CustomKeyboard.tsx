// components/CustomKeyboard.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onSpace: () => void;
  onDone: () => void;
}

const CustomKeyboard: React.FC<Props> = ({
  onKeyPress,
  onBackspace,
  onSpace,
  onDone,
}) => {
  const rows = [
    '1234567890',
    'QWERTYUIOP',
    'ASDFGHJKL',
    'ZXCVBNM',
  ];

  return (
    <View style={styles.container}>
      {rows.map((row, index) => (
        <View key={index} style={styles.row}>
          {row.split('').map((char) => (
            <TouchableOpacity
              key={char}
              onPress={() => onKeyPress(char)}
              style={styles.key}
            >
              <Text style={styles.keyText}>{char}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {/* Bottom action row: Space, Backspace, Done */}
      <View style={styles.row}>
        <TouchableOpacity onPress={onSpace} style={[styles.key, styles.largeKey]}>
          <Text style={styles.keyText}>Space</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onBackspace} style={[styles.key, { backgroundColor: '#444' }]}>
          <Text style={styles.keyText}>⌫</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onDone} style={[styles.key, { backgroundColor: '#2e7d32' }]}>
          <Text style={styles.keyText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    flexWrap: 'nowrap',
  },
  key: {
    backgroundColor: '#222',
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginHorizontal: 3,
    borderRadius: 6,
    minWidth: 30,
    alignItems: 'center',
  },
  largeKey: {
    flex: 1.5,
    paddingHorizontal: 20,
  },
  keyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default CustomKeyboard;