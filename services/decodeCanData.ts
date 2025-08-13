const ERROR_CODES: { [key: number]: string } = {
  0: "Identification error",
  1: "Over voltage",
  2: "Low voltage",
  4: "Motor stall",
  5: "Internal volts fault",
  6: "Over temperature",
  7: "Throttle error at power-up",
  9: "Internal reset",
  10: "Hall throttle open or short-circuit",
  11: "Angle sensor error",
  14: "Motor over-temperature",
  15: "Hall Galvanometer sensor error",
};

// ✅ Function to decode both CAN IDs together
export const decodeCanData = (receivedData: { [key: string]: number[] }): any => {
  let parsedData: any = {};

  Object.entries(receivedData).forEach(([canId, data]) => {
    switch (canId) {
      case "0xCF11E05": // Controller Instrument Data
        const rpm = (data[1] << 8) | data[0]; // RPM
        const current = ((data[3] << 8) | data[2]) / 10; // Amperes
        const voltage = ((data[5] << 8) | data[4]) / 10; // Volts

        // ✅ Improved Error Extraction
        const errorCode = (data[7] << 8) | data[6];
        const errorMessages: string[] = Object.entries(ERROR_CODES)
          .filter(([bit]) => errorCode & (1 << Number(bit)))
          .map(([_, description]) => description);

        parsedData[canId] = {
          rpm,
          current,
          voltage,
          errors: errorMessages.length > 0 ? errorMessages : [],
        };
        break;

      case "0xCF11F05": // Additional Controller Data
        parsedData[canId] = {
          throttle: parseFloat(((data[0] * 5) / 255).toFixed(2)), // ✅ Better rounding
          controllerTemp: data[1] - 40, // °C
          motorTemp: data[2] - 30, // °C
          status: data[5], // Controller status
        };
        break;

      default:
        parsedData[canId] = { message: "Unknown CAN ID" };
    }
  });

  return parsedData;
};
