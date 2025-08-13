import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet } from 'react-native';

interface GlowingImageProps {
  source: any;
  glowColor: string;
  active: boolean;
  size?: number;
}

const GlowingImage: React.FC<GlowingImageProps> = ({
  source,
  glowColor,
  active,
  size = 28,
}) => {
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      glowAnim.stopAnimation();
      glowAnim.setValue(0);
    }
  }, [active]);

  const animatedStyle = {
    shadowColor: glowColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: glowAnim,
    shadowRadius: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [2, 10],
    }),
    elevation: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [2, 8],
    }),
  };

  return (
    <Animated.View style={animatedStyle}>
      <Image
        source={source}
        style={{
          width: size,
          height: size,
          resizeMode: 'contain',
          tintColor: active ? '#f87171' : '#6b7280',
        }}
      />
    </Animated.View>
  );
};

export default GlowingImage;