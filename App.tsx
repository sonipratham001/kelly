if (!__DEV__) {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
}

import React, { useEffect, useState } from "react";
import {
  View,
  ActivityIndicator,
  StatusBar,
  Platform,
} from "react-native";
import {
  NavigationContainer,
  useNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ImmersiveMode from "react-native-immersive-mode"; // ✅ Correct import
import 'react-native-get-random-values';
// Screens
import HomeScreen from "./screens/HomeScreen";
import MenuScreen from "./screens/MenuScreen/MenuScreen";
import BatteryHealth from './screens/BatteryHealth/BatteryHealth';
import MotorHealth from "./screens/MotorHealth/MotorHealth";
import Map from "./screens/MapsScreen/Map";
import ExportDataScreen from "./screens/ExportData/ ExportDataScreen";

// Providers
import { BluetoothProvider } from "./services/BluetoothServices";
import { BatteryBluetoothProvider } from "./services/BatteryBluetoothProvider";
import { BluetoothPopupProvider } from "./screens/Context/BluetoothPopupContext";
import { LocationProvider } from './screens/Context/LocationContext';
// Components
import BluetoothPopup from "./screens/components/BluetoothPopup";
import Toast from "react-native-toast-message";

import { enableScreens } from 'react-native-screens';
import KeepAwake from 'react-native-keep-awake';
import AsyncStorage from "@react-native-async-storage/async-storage";
import manager from "./services/BleManagerInstance";
enableScreens();
// Stack type
export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  Home: undefined;
  Dashboard: undefined;
  Subscription: undefined;
  PaymentScreen: undefined;
  History: undefined;
  UserProfile: undefined;
  BatteryHealth: undefined;
  VerifyEmail: undefined;
  MenuScreen: undefined;
  MotorHealth: undefined;
  Youtube: undefined;
  Map: undefined;
  ExportDataScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  KeepAwake.activate(); // ⬅ this prevents screen sleep
  return () => KeepAwake.deactivate(); // optional cleanup
}, []);



  // ✅ Immersive full screen mode for Android
  useEffect(() => {
  if (Platform.OS === "android") {
    ImmersiveMode.fullLayout(true);
    ImmersiveMode.setBarMode("FullSticky");
    // @ts-ignore – enterImmersive is a runtime method not declared in types
    ImmersiveMode.enterImmersive?.();
  }
}, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <>
      <StatusBar
        hidden={true}
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <SafeAreaProvider>
        <LocationProvider>
        <BluetoothProvider>
          <BatteryBluetoothProvider>
            <BluetoothPopupProvider>
              <NavigationContainer ref={navigationRef}>
                <Stack.Navigator
                  screenOptions={{
                    headerShown: false,
                    gestureEnabled: true,
                    animation: 'slide_from_right',
                    animationDuration: 300,
                    contentStyle: { backgroundColor: '#000' }, // ✅ ADD THIS
                  }}
                >
                  <Stack.Screen name="Home" component={HomeScreen} />
                  <Stack.Screen name="BatteryHealth" component={BatteryHealth} />
                  <Stack.Screen name="MenuScreen" component={MenuScreen} />
                  <Stack.Screen name="MotorHealth" component={MotorHealth} />
                  <Stack.Screen name="Map" component={Map} />
                  <Stack.Screen name="ExportDataScreen" component={ExportDataScreen} />
                </Stack.Navigator>
              </NavigationContainer>

              <BluetoothPopup />
              <Toast />
            </BluetoothPopupProvider>
          </BatteryBluetoothProvider>
        </BluetoothProvider>
        </LocationProvider>
      </SafeAreaProvider>
    </>
  );
};

export default App;