import React, { createContext, useState } from "react";
import { BleManager, Device } from "react-native-ble-plx";
import { Buffer } from "buffer";

// Create Bluetooth Context
export const BluetoothContext = createContext<any>(null);

const manager = new BleManager();

// Error Code Mapping (from the protocol document)
const ERROR_CODES: { [key: number]: string } = {
  0: "Identification error: Failed to identify motor angle.",
  1: "Over voltage: Battery voltage too high.",
  2: "Low voltage: Battery voltage too low.",
  3: "Reserved.",
  4: "Stall: No speed feedback from motor.",
  5: "Internal voltage fault: Possible wiring or controller issue.",
  6: "Over temperature: Controller exceeded 100°C.",
  7: "Throttle error: Unexpected throttle signal at power-up.",
  8: "Reserved.",
  9: "Internal reset: Temporary fault or power fluctuation.",
  10: "Hall throttle error: Open or short circuit detected.",
  11: "Angle sensor error: Speed sensor misconfiguration.",
  12: "Reserved.",
  13: "Reserved.",
  14: "Motor over-temperature: Motor temperature exceeded limit.",
  15: "Hall Galvanometer sensor error: Internal controller fault.",
};

export const BluetoothProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [data, setData] = useState<any>({}); // This will now hold combined data from both messages

  const connectToDevice = async (device: Device) => {
    try {
      await device.connect();
      await device.discoverAllServicesAndCharacteristics();
      setConnectedDevice(device);

      const services = await device.services();
      for (const service of services) {
        console.log(`🔹 Service UUID: ${service.uuid}`);

        const characteristics = await service.characteristics();
        for (const characteristic of characteristics) {
          console.log(`   ├── Characteristic UUID: ${characteristic.uuid}`);
          console.log(`   ├── Is Notifiable: ${characteristic.isNotifiable}`);
          console.log(`   ├── Is Readable: ${characteristic.isReadable}`);
          console.log(
            `   ├── Is Writable: ${characteristic.isWritableWithResponse || characteristic.isWritableWithoutResponse}`
          );
        }
      }

      const serviceUUID = "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"; // Replace with actual UUID
      const characteristicUUID = "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"; // Replace with actual UUID

      device.monitorCharacteristicForService(serviceUUID, characteristicUUID, (error, characteristic) => {
        if (error) {
          console.error("❌ Bluetooth Read Error:", error);
          return;
        }

        if (characteristic?.value) {
          console.log(`📩 Raw Data Received: ${characteristic.value}`);
          const decodedData = parseBluetoothData(characteristic.value);
          console.log("✅ Decoded Data:", decodedData);
          setData((prevData: any) => ({ ...prevData, ...decodedData })); // Merge new data with existing data
        } else {
          console.log("⚠ No Data Received!");
        }
      });
    } catch (error) {
      console.error("Connection Error:", error);
    }
  };

  const disconnectDevice = async () => {
    if (connectedDevice) {
      try {
        const isConnected = await connectedDevice.isConnected(); // Check if the device is still connected
        console.log(`Device ${connectedDevice.id} isConnected: ${isConnected}`);
        if (isConnected) {
          await connectedDevice.cancelConnection();
          console.log(`🔌 Disconnected device: ${connectedDevice.id}`);
        } else {
          console.log(`⚠ Device ${connectedDevice.id} already disconnected`);
        }
      } catch (error) {
        console.error("Disconnect Error:", (error as Error).message);
        throw error; // Re-throw to be caught by the calling function (e.g., handleDisconnect in HomeScreen)
      } finally {
        setConnectedDevice(null); // Always reset the state, regardless of success or failure
        setData({});
      }
    }
  };

  // ✅ Function to Decode CAN Bus Messages from ESP32
  const parseBluetoothData = (rawData: string) => {
    const buffer = Buffer.from(rawData, "base64");
    console.log("📦 Converted Buffer (Raw Bytes):", buffer);
    console.log("📏 Received Buffer Length:", buffer.length);

    if (buffer.length < 8) {
      console.warn("⚠ Warning: Buffer too short, ignoring message!");
      return { error: "Insufficient data received", bufferLength: buffer.length };
    }

    const messageID = buffer.readUInt32BE(0).toString(16);
    const payload = buffer.slice(4); // Extract CAN payload

    console.log("🔹 Message ID:", messageID);
    console.log("📊 Payload Data (Hex):", payload.toString("hex"));

    if (messageID === "cf11e05") {
      if (payload.length < 8) return { error: "Invalid Message 1 Data", bufferLength: payload.length };
      return { message1: parseMessage1(payload) }; // Wrap Message 1 data in an object
    } else if (messageID === "cf11f05") {
      if (payload.length < 8) return { error: "Invalid Message 2 Data", bufferLength: payload.length };
      return { message2: parseMessage2(payload) }; // Wrap Message 2 data in an object
    } else {
      return { error: "Unknown Message ID", messageID, bufferLength: payload.length };
    }
  };

  // ✅ Function to parse Message 1 (Speed, Voltage, Current, Errors)
  const parseMessage1 = (buffer: Buffer) => {
    if (buffer.length < 8) {
      console.warn("⚠ Warning: Invalid Message 1 Data, buffer too short!");
      return { error: "Invalid Message 1 Data", bufferLength: buffer.length };
    }

    return {
      messageType: "Speed/Voltage/Current Data",
      speed: buffer.readUInt8(1) * 256 + buffer.readUInt8(0),
      current: (buffer.readUInt8(3) * 256 + buffer.readUInt8(2)) / 10,
      voltage: (buffer.readUInt8(5) * 256 + buffer.readUInt8(4)) / 10,
      errorCode: buffer.length >= 9 ? buffer.readUInt8(7) | (buffer.readUInt8(8) << 8) : 0, // Ensure buffer has enough bytes
      errorMessages: buffer.length >= 9 ? decodeErrors(buffer.readUInt8(7) | (buffer.readUInt8(8) << 8)) : ["No Error Data"],
    };
  };

  // ✅ Function to parse Message 2 (Throttle, Temperature, Controller Status)
const parseMessage2 = (buffer: Buffer) => {
  if (buffer.length < 8) {
    console.warn("⚠ Warning: Invalid Message 2 Data, buffer too short!");
    return { error: "Invalid Message 2 Data", bufferLength: buffer.length };
  }

  const switchSignals = buffer.readUInt8(5);

  return {
    messageType: "Throttle/Temperature/Controller Status",
    throttle: buffer.readUInt8(0),
    controllerTemp: buffer.readUInt8(1) - 40,
    motorTemp: buffer.readUInt8(2) - 30,
    controllerStatus: buffer.readUInt8(4) & 0b11, // Extract lower 2 bits (Neutral, Forward, Backward)
    switchSignals: {
      boost: (switchSignals & 0b10000000) !== 0,       // BIT7
      footswitch: (switchSignals & 0b01000000) !== 0,  // BIT6
      forward: (switchSignals & 0b00100000) !== 0,     // BIT5
      backward: (switchSignals & 0b00010000) !== 0,    // BIT4
      brake: (switchSignals & 0b00001000) !== 0,       // BIT3
      hallC: (switchSignals & 0b00000100) !== 0,       // BIT2
      hallB: (switchSignals & 0b00000010) !== 0,       // BIT1
      hallA: (switchSignals & 0b00000001) !== 0,       // BIT0
    },
  };
};

  // ✅ Decode Error Bits to Human-Readable Messages
  const decodeErrors = (errorCode: number): string[] => {
    let errors: string[] = [];
    for (let i = 0; i < 16; i++) {
      if ((errorCode >> i) & 1) {
        errors.push(ERROR_CODES[i]);
      }
    }
    return errors.length > 0 ? errors : ["No Errors Detected"];
  };

  return (
    <BluetoothContext.Provider value={{ connectedDevice, connectToDevice, disconnectDevice, data }}>
      {children}
    </BluetoothContext.Provider>
  );
};