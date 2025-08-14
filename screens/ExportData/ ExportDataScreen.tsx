import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Animated, Easing } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { BatteryBluetoothContext } from "../../services/BatteryBluetoothProvider";
import Papa from "papaparse";
import Share from "react-native-share";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import RNFS from "react-native-fs";
import { zip } from "react-native-zip-archive";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import styles from "./ExportDataScreen.styles";

type RawFrame = {
  timeOffsetMs?: number;
  id?: string | number;
  bytes?: Array<number | string>;
  type?: "Rx" | "Tx" | string;
};

type Snapshot = {
  timestamp: string;
  soc: number | string;
  batteryCurrent: number | string;
  minCellVoltage: number | string;
  maxCellVoltage: number | string;
  maxCellTemp: number | string;
  minCellTemp: number | string;
  availableEnergy: number | string;
  driveCurrentLimit: number | string;
  regenCurrentLimit: number | string;
  controllerTemperature: number | string;
  motorTemperature: number | string;
  rmsCurrent: number | string;
  throttle: number | string;
  brake: number | string;
  speed: number | string;
  motorRPM: number | string;
  capacitorVoltage: number | string;
  odometer: number | string;
  controllerFaults: string;
};

type RecordStatus = "idle" | "arming" | "recording" | "finalizing" | "ready" | "error";

const INACTIVITY_MS = 2000;    // auto-stop after 2s without frames
const CSV_SAMPLE_MS = 1000;    // <-- sample CSV once per second

const ExportDataScreen: React.FC = () => {
  const navigation = useNavigation();
  const { data = {} } = useContext(BatteryBluetoothContext) as any;

  const {
    messageDIU1 = {},
    messageDIU2 = {},
    messageDIU3 = {},
    messageDIU4 = {},
    messageDriveParameters = {},
    messageMCU1 = {},
    messageMCU2 = {},
    messageMCU3 = {},
    rawFrame,
  } = data;

  const [status, setStatus] = useState<RecordStatus>("idle");
  const [recordedData, setRecordedData] = useState<Snapshot[]>([]);
  const [rawFrames, setRawFrames] = useState<RawFrame[]>([]);
  const [framesSeen, setFramesSeen] = useState(0);

  const [folderPath, setFolderPath] = useState<string | null>(null);
  const [csvPath, setCsvPath] = useState<string | null>(null);
  const [trcPath, setTrcPath] = useState<string | null>(null);
  const [zipPath, setZipPath] = useState<string | null>(null);

  // timers
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const samplerTimer = useRef<NodeJS.Timeout | null>(null);

  // spinner
  const spinVal = useRef(new Animated.Value(0)).current;
  const startSpin = () => {
    spinVal.setValue(0);
    Animated.loop(
      Animated.timing(spinVal, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };
  const stopSpin = () => spinVal.stopAnimation();
  const spin = spinVal.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  const makeSnapshot = (): Snapshot => {
    const ts = new Date()
      .toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
      .replace(",", "");

    const safe = (v: any, dflt = 0) => (v === null || v === undefined ? dflt : v);

    return {
      timestamp: ts,
      soc: safe(messageDIU4.stateOfCharge?.toFixed?.(1), 0),
      batteryCurrent: safe(messageDIU2.batteryCurrent?.toFixed?.(1), 0),
      minCellVoltage: safe(messageDIU3.minCellVoltage?.toFixed?.(3), 0),
      maxCellVoltage: safe(messageDIU3.maxCellVoltage?.toFixed?.(3), 0),
      maxCellTemp: safe(messageDriveParameters.maxCellTemp, 0),
      minCellTemp: safe(messageDriveParameters.minCellTemp, 0),
      availableEnergy: safe(messageDriveParameters.availableEnergy?.toFixed?.(2), 0),
      driveCurrentLimit: safe(messageDIU2.driveCurrentLimit, 0),
      regenCurrentLimit: safe(messageDIU2.regenCurrentLimit, 0),
      controllerTemperature: safe(messageMCU1.controllerTemperature, 0),
      motorTemperature: safe(messageMCU1.motorTemperature, 0),
      rmsCurrent: safe(messageMCU1.rmsCurrent?.toFixed?.(1), 0),
      throttle: safe(messageMCU1.throttle, 0),
      brake: safe(messageMCU1.brake, 0),
      speed: safe(messageMCU1.speed, 0),
      motorRPM: safe(messageMCU2.motorRPM, 0),
      capacitorVoltage: safe(messageMCU2.capacitorVoltage?.toFixed?.(1), 0),
      odometer: safe(messageMCU2.odometer?.toFixed?.(1), 0),
      controllerFaults:
        Array.isArray(messageMCU3.faultMessages) && messageMCU3.faultMessages.length
          ? messageMCU3.faultMessages.join(", ")
          : "None",
    };
  };

  const normalizeRawFrame = (frame: any): RawFrame | null => {
    if (!frame) return null;
    const out: RawFrame = {
      timeOffsetMs: typeof frame.timeOffsetMs === "number" ? frame.timeOffsetMs : 0,
      type: typeof frame.type === "string" ? frame.type : "Rx",
    };
    if (typeof frame.id === "number") {
      out.id = frame.id.toString(16).toUpperCase();
    } else if (typeof frame.id === "string") {
      out.id = frame.id;
    } else {
      out.id = "00000000";
    }
    if (Array.isArray(frame.bytes)) {
      out.bytes = frame.bytes.map((b: any) => {
        if (typeof b === "number") return b.toString(16).toUpperCase().padStart(2, "0");
        if (typeof b === "string") return b.toUpperCase().padStart(2, "0");
        return "00";
      });
    } else {
      out.bytes = [];
    }
    return out;
  };

  const generateTRC = (frames: RawFrame[]) => {
    const header = [
      "; Generated by React Native CAN Logger",
      "; Message Number | Time Offset (s) | Type | CAN ID (hex) | DLC | Data Bytes (hex)",
      "",
    ].join("\n");

    const body = frames.map((f, i) => {
      const msgNum = `${i + 1})`.padEnd(5);
      const t = Number(f.timeOffsetMs || 0) / 1000;
      const timestamp = t.toFixed(3).padStart(8);
      const frameType = (f.type || "Rx").toString().padStart(3);
      const canId = (typeof f.id === "string" ? f.id : String(f.id || ""))
        .toUpperCase()
        .padStart(8, "0");
      const dlc = String(f.bytes?.length ?? 0).padStart(2);
      const data = (f.bytes || []).join(" ").padEnd(23);
      return `${msgNum}${timestamp} ${frameType}  ${canId} ${dlc} ${data}`;
    });

    return `${header}\n${body.join("\n")}`;
  };

  // ---- sampling control (1 Hz for CSV) ----
  const startSampler = () => {
    if (samplerTimer.current) return;
    samplerTimer.current = setInterval(() => {
      // take a snapshot once per second using *latest* decoded values
      setRecordedData(prev => [...prev, makeSnapshot()]);
    }, CSV_SAMPLE_MS);
  };
  const stopSampler = () => {
    if (samplerTimer.current) {
      clearInterval(samplerTimer.current);
      samplerTimer.current = null;
    }
  };

  const resetAll = async () => {
    stopSampler();
    setStatus("idle");
    setRecordedData([]);
    setRawFrames([]);
    setFramesSeen(0);
    setFolderPath(null);
    setCsvPath(null);
    setTrcPath(null);
    setZipPath(null);
  };

  const finalizeAndZip = async () => {
    try {
      setStatus("finalizing");
      stopSpin();
      stopSampler();

      if (!recordedData.length || !rawFrames.length) {
        Toast.show({ type: "info", text1: "No data to save" });
        setStatus("idle");
        return;
      }

      const stamp = new Date()
        .toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour12: false,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
        .replace(/[/:, ]/g, "-");

      const folder = `${RNFS.CachesDirectoryPath}/export_${stamp}`;
      const csv = `${folder}/data.csv`;
      const trc = `${folder}/data.trc`;
      const zipOut = `${RNFS.CachesDirectoryPath}/export_${stamp}.zip`;

      await RNFS.mkdir(folder);

      const csvStr = Papa.unparse(recordedData);
      const trcStr = generateTRC(rawFrames);

      await RNFS.writeFile(csv, csvStr, "utf8");
      await RNFS.writeFile(trc, trcStr, "utf8");

      const zipped = await zip(folder, zipOut);

      setFolderPath(folder);
      setCsvPath(csv);
      setTrcPath(trc);
      setZipPath(zipped);

      setStatus("ready");
      Toast.show({ type: "success", text1: "Recording saved", text2: "Ready to share ZIP" });
    } catch (e: any) {
      setStatus("error");
      Toast.show({ type: "error", text1: "Save failed", text2: String(e?.message ?? e) });
    }
  };

  const shareZip = async () => {
    if (!zipPath) return;
    try {
      await Share.open({
        title: "Share Exported Logs",
        url: `file://${zipPath}`,
        type: "application/zip",
      });
    } catch {}
  };

  const armInactivityTimeout = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      if (status === "recording") {
        finalizeAndZip();
      } else if (status === "arming") {
        resetAll();
      }
    }, INACTIVITY_MS);
  };

  // On every new raw frame: store frame & manage state.
  // (CSV is *not* appended here anymore — it's sampled by the 1 Hz timer.)
  useEffect(() => {
    if (!rawFrame) return;

    const nf = normalizeRawFrame(rawFrame);
    if (!nf) return;

    setFramesSeen(n => n + 1);
    setRawFrames(prev => [...prev, nf]);

    setStatus(s => {
      if (s === "idle") {
        startSpin();
        startSampler();          // <-- start 1 Hz CSV sampler when stream starts
        armInactivityTimeout();
        return "arming";
      }
      if (s === "arming" && framesSeen + 1 >= 2) {
        startSpin();
        startSampler();          // (idempotent)
        armInactivityTimeout();
        return "recording";
      }
      if (s === "recording") {
        armInactivityTimeout();  // keep alive while frames arrive
      }
      return s;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawFrame]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      stopSampler();
      stopSpin();
    };
  }, []);

  const stats = useMemo(() => {
    return { rows: recordedData.length, frames: rawFrames.length };
  }, [recordedData.length, rawFrames.length]);

  return (
    <LinearGradient colors={["#0a0f1c", "#1f2937", "#111827"]} style={styles.screen}>
      {/* Top section */}
      <View style={styles.topSection}>
        {/* Back Arrow */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={[styles.title, { marginLeft: 48 }]}>Export Vehicle Data</Text>
        <Text style={styles.subtitle}>
          {status === "recording"
            ? "Recording at 1 Hz… auto-stops when data stops"
            : status === "arming"
            ? "Waiting for data…"
            : status === "finalizing"
            ? "Saving files…"
            : status === "ready"
            ? "Ready to share"
            : "Idle — waiting for stream"}
        </Text>

        <Animated.View style={[styles.iconCircle, { transform: [{ rotate: spin }] }]}>
          <Icon
            name={status === "recording" || status === "arming" ? "record-circle" : "export-variant"}
            size={66}
            color={status === "recording" || status === "arming" ? "#ef4444" : "#facc15"}
          />
        </Animated.View>

        <View style={styles.statRow}>
          <View style={styles.statPill}>
            <Text style={styles.statVal}>{stats.frames}</Text>
            <Text style={styles.statLabel}>frames (TRC)</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statVal}>{stats.rows}</Text>
            <Text style={styles.statLabel}>rows (CSV @1s)</Text>
          </View>
        </View>

        {(status === "recording" || status === "arming") && (
          <TouchableOpacity style={styles.stopBtn} onPress={finalizeAndZip}>
            <Text style={styles.stopText}>Stop & Save Now</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        {status === "ready" && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Export ready</Text>
            <Text style={styles.filePath} numberOfLines={1}>{csvPath}</Text>
            <Text style={styles.filePath} numberOfLines={1}>{trcPath}</Text>

            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.primaryBtn} onPress={shareZip}>
                <Text style={styles.primaryText}>Share ZIP</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={resetAll}>
                <Text style={styles.secondaryText}>Record again</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
      <Toast />
    </LinearGradient>
  );
};

export default ExportDataScreen;
