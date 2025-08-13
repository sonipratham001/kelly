import { Dimensions, PixelRatio } from 'react-native';

const { width, height } = Dimensions.get('window');

// These should match your design reference dimensions (e.g., iPhone X)
const guidelineBaseWidth = 475;
const guidelineBaseHeight = 812;

/**
 * Horizontal scale based on device width
 */
export const scale = (size: number): number => (width / guidelineBaseWidth) * size;

/**
 * Vertical scale based on device height
 */
export const verticalScale = (size: number): number => (height / guidelineBaseHeight) * size;

/**
 * Moderate scale (adjusts size by a factor, useful for font sizes or padding)
 */
export const moderateScale = (size: number, factor: number = 0.5): number =>
  size + (scale(size) - size) * factor;

/**
 * Font scaling based on user's font size settings
 */
export const fontScale = (size: number): number => size * PixelRatio.getFontScale();