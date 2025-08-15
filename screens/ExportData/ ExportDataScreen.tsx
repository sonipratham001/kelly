// screens/ExportDataScreen.tsx
import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Animated, Easing } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Share from "react-native-share";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import styles from "./ExportDataScreen.styles";
import recorder from "../../services/VehicleDataRecorder";

const ExportDataScreen: React.FC = () => {
  const navigation = useNavigation();
  const [status, setStatus] = useState(recorder.getStatus());
  const [stats, setStats] = useState(recorder.getStats());

  // simple spinner
  const spinVal = useRef(new Animated.Value(0)).current;
  const startSpin = () => {
    spinVal.setValue(0);
    Animated.loop(
      Animated.timing(spinVal, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true })
    ).start();
  };
  const stopSpin = () => spinVal.stopAnimation();
  const spin = spinVal.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  useEffect(() => {
    const unsub = recorder.subscribe(() => {
      setStatus(recorder.getStatus());
      setStats(recorder.getStats());
    });
    startSpin();
    return () => { unsub(); stopSpin(); };
  }, []);

  useEffect(() => {
    if (status === "ready") {
      Toast.show({ type: "success", text1: "Recording saved", text2: "Ready to share ZIP" });
    }
  }, [status]);

  const finalizeAndZip = async () => {
    try {
      await recorder.finalize();
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Save failed", text2: String(e?.message ?? e) });
    }
  };

  const shareZip = async () => {
    if (!recorder.lastZipPath) return;
    try {
      await Share.open({
        title: "Share Exported Logs",
        url: `file://${recorder.lastZipPath}`,
        type: "application/zip",
      });
    } catch {}
  };

  const resetAll = () => recorder.reset();

  return (
    <LinearGradient colors={["#0a0f1c", "#1f2937", "#111827"]} style={styles.screen}>
      <View style={styles.topSection}>
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
            : status === "error"
            ? "Error — see toast"
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

      <View style={styles.bottomSection}>
        {status === "ready" && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Export ready</Text>
            <Text style={styles.filePath} numberOfLines={1}>{recorder.lastCsvPath}</Text>
            <Text style={styles.filePath} numberOfLines={1}>{recorder.lastTrcPath}</Text>

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