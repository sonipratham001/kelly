declare module 'react-native-immersive-mode' {
  interface ImmersiveModeStatic {
    fullLayout: (enable: boolean) => void;
    setBarMode: (mode: 'BottomSticky' | 'FullSticky') => void;
    enterImmersive?: () => void; // ✅ declared properly
  }

  const ImmersiveMode: ImmersiveModeStatic;
  export default ImmersiveMode;
}