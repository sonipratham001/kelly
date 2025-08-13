export const MOTOR_FAULT_MAPPINGS: {
  [key: string]: { label: string; icon: string; severity: 'critical' | 'warning' | 'info' }
} = {
  "ERR0: Identification error": {
    label: "Identification error",
    icon: "alert-circle-outline",
    severity: "warning",
  },
  "ERR1: Over voltage": {
    label: "Over voltage",
    icon: "battery-high",
    severity: "critical",
  },
  "ERR2: Low voltage": {
    label: "Low voltage",
    icon: "battery-alert",
    severity: "critical",
  },
  "ERR3: Reserved": {
    label: "Reserved",
    icon: "dots-horizontal",
    severity: "info",
  },
  "ERR4: Stall": {
    label: "Stall",
    icon: "engine-off",
    severity: "critical",
  },
  "ERR5: Internal volts fault": {
    label: "Internal volts fault",
    icon: "flash-alert",
    severity: "critical",
  },
  "ERR6: Over temperature (controller)": {
    label: "Over temperature (controller)",
    icon: "thermometer-alert",
    severity: "critical",
  },
  "ERR7: Throttle error at power-up": {
    label: "Throttle error at power-up",
    icon: "gesture-tap-button",
    severity: "warning",
  },
  "ERR8: Reserved": {
    label: "Reserved",
    icon: "dots-horizontal",
    severity: "info",
  },
  "ERR9: Internal reset": {
    label: "Internal reset",
    icon: "restart",
    severity: "info",
  },
  "ERR10: Hall throttle open/short": {
    label: "Hall throttle open/short",
    icon: "alert-octagon-outline",
    severity: "critical",
  },
  "ERR11: Angle sensor error": {
    label: "Angle sensor error",
    icon: "compass",
    severity: "warning",
  },
  "ERR12: Reserved": {
    label: "Reserved",
    icon: "dots-horizontal",
    severity: "info",
  },
  "ERR13: Reserved": {
    label: "Reserved",
    icon: "dots-horizontal",
    severity: "info",
  },
  "ERR14: Motor over-temperature": {
    label: "Motor over-temperature",
    icon: "fire",
    severity: "critical",
  },
  "ERR15: Hall galvanometer sensor error": {
    label: "Hall galvanometer sensor error",
    icon: "current-dc",
    severity: "warning",
  },
  NoFaultsDetected: {
    label: "No Faults Detected",
    icon: "check-circle",
    severity: "info",
  },
};