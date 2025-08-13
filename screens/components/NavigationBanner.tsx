import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Tts from 'react-native-tts';

const { width } = Dimensions.get('window');

interface Props {
  instruction: string;
  directionType: 'left' | 'right' | 'straight' | 'uturn';
  nextInstruction?: string;
  nextDirectionType?: 'left' | 'right' | 'straight' | 'uturn';
}

const getIcon = (type?: string) => {
  switch (type) {
    case 'left': return 'turn-left';
    case 'right': return 'turn-right';
    case 'uturn': return 'u-turn-left';
    default: return 'straight';
  }
};

const NavigationBanner: React.FC<Props> = ({
  instruction,
  directionType,
  nextInstruction,
  nextDirectionType,
}) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const lastSpeakTimeRef = useRef<number>(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: -45, // Slide to visible
      duration: 400,
      useNativeDriver: false,
    }).start();

    const now = Date.now();
    if (!muted && instruction && now - lastSpeakTimeRef.current > 5000) {
      Tts.stop();
      Tts.speak(instruction);
      lastSpeakTimeRef.current = now;
    }
  }, [instruction, muted]);

  const toggleMute = () => {
    if (muted) {
      // Unmuting
      setMuted(false);
    } else {
      // Muting and stopping any current instruction
      setMuted(true);
      Tts.stop();
    }
  };

  return (
    <Animated.View style={[styles.banner, { top: slideAnim }]}>
      <View style={styles.mainInstruction}>
        <Icon name={getIcon(directionType)} size={32} color="#fff" style={{ marginRight: 12 }} />
        <Text style={styles.instruction} numberOfLines={1}>{instruction}</Text>
        <TouchableOpacity onPress={toggleMute}>
          <Icon name={muted ? 'volume-off' : 'volume-up'} size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {nextInstruction && (
        <View style={styles.nextInstruction}>
          <Text style={styles.then}>Then</Text>
          <Icon name={getIcon(nextDirectionType)} size={22} color="#ccc" style={{ marginHorizontal: 6 }} />
          <Text style={styles.thenText} numberOfLines={1}>{nextInstruction}</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#2ecc71',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
    zIndex: 10000,
    elevation: 6,
    width: width * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  mainInstruction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  instruction: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  nextInstruction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  then: {
    color: '#f0f0f0',
    fontSize: 14,
    marginRight: 4,
  },
  thenText: {
    color: '#fff',
    fontSize: 14,
    flexShrink: 1,
  },
});

export default NavigationBanner;