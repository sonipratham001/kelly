import { PermissionsAndroid, Platform } from "react-native";

async function requestBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS === "android" && Platform.Version >= 31) {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, // Needed for scanning
      ]);

      if (
        granted["android.permission.BLUETOOTH_SCAN"] === PermissionsAndroid.RESULTS.GRANTED &&
        granted["android.permission.BLUETOOTH_CONNECT"] === PermissionsAndroid.RESULTS.GRANTED &&
        granted["android.permission.BLUETOOTH_ADVERTISE"] === PermissionsAndroid.RESULTS.GRANTED &&
        granted["android.permission.ACCESS_FINE_LOCATION"] === PermissionsAndroid.RESULTS.GRANTED
      ) {
        console.log("✅ All Bluetooth permissions granted");
        return true;
      } else {
        console.warn("⚠️ Some Bluetooth permissions were NOT granted");
        return false;
      }
    } catch (error) {
      console.error("❌ Error requesting Bluetooth permissions:", error);
      return false;
    }
  } else {
    console.log("ℹ️ No additional Bluetooth permissions required on this Android version.");
    return true;
  }
}

export default requestBluetoothPermissions;