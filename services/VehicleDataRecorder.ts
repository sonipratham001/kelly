// src/services/VehicleDataRecorder.ts
import RNFS from "react-native-fs";
import { zip } from "react-native-zip-archive";
import Papa from "papaparse";

export type RawFrame = {
  timeOffsetMs?: number;               // <-- milliseconds since start
  id?: string | number;
  bytes?: Array<number | string>;
  type?: "Rx" | "Tx" | string;
};

export type Snapshot = {
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

export type RecorderStatus = "idle" | "arming" | "recording" | "finalizing" | "ready" | "error";

const INACTIVITY_MS = 2000;    // auto-stop after 2s without frames
const CSV_SAMPLE_MS = 1000;    // sample CSV once per second
const MAX_RAW_FRAMES = 500_000;
const MAX_SNAPSHOTS = 100_000;

class VehicleDataRecorder {
  private status: RecorderStatus = "idle";
  private rawFrames: RawFrame[] = [];
  private snapshots: Snapshot[] = [];
  private framesSeen = 0;
  private inactivityTimer: NodeJS.Timeout | null = null;
  private samplerTimer: NodeJS.Timeout | null = null;

  public lastFolderPath: string | null = null;
  public lastCsvPath: string | null = null;
  public lastTrcPath: string | null = null;
  public lastZipPath: string | null = null;

  private latestDecoded: any = {};

  private listeners = new Set<() => void>();
  subscribe(fn: () => void) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  private notify() { this.listeners.forEach(fn => fn()); }

  getStatus() { return this.status; }
  getStats() { return { frames: this.rawFrames.length, rows: this.snapshots.length }; }

  updateDecoded(decoded: any) {
    this.latestDecoded = decoded || {};
  }

  onRawFrame(frame: RawFrame | any) {
    const nf = this.normalizeRawFrame(frame);
    if (!nf) return;

    if (this.rawFrames.length < MAX_RAW_FRAMES) this.rawFrames.push(nf);
    this.framesSeen++;

    if (this.status === "idle") {
      this.startSampler();
      this.armInactivityTimeout();
      this.status = "arming";
      this.notify();
      return;
    }
    if (this.status === "arming" && this.framesSeen >= 2) {
      this.startSampler();
      this.armInactivityTimeout();
      this.status = "recording";
      this.notify();
      return;
    }
    if (this.status === "recording") {
      this.armInactivityTimeout();
    }
  }

  private startSampler() {
    if (this.samplerTimer) return;
    this.samplerTimer = setInterval(() => {
      const snap = this.makeSnapshot();
      if (this.snapshots.length < MAX_SNAPSHOTS) {
        this.snapshots.push(snap);
        this.notify();
      }
    }, CSV_SAMPLE_MS);
  }
  private stopSampler() {
    if (this.samplerTimer) { clearInterval(this.samplerTimer); this.samplerTimer = null; }
  }

  private armInactivityTimeout() {
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    this.inactivityTimer = setTimeout(() => {
      if (this.status === "recording") this.finalize().catch(() => {});
      else if (this.status === "arming") this.reset();
    }, INACTIVITY_MS);
  }

  private makeSnapshot(): Snapshot {
    const {
      messageDIU1 = {},
      messageDIU2 = {},
      messageDIU3 = {},
      messageDIU4 = {},
      messageDriveParameters = {},
      messageMCU1 = {},
      messageMCU2 = {},
      messageMCU3 = {},
    } = this.latestDecoded || {};

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
  }

  private normalizeRawFrame(frame: any): RawFrame | null {
    if (!frame) return null;
    const out: RawFrame = {
      timeOffsetMs: typeof frame.timeOffsetMs === "number" ? frame.timeOffsetMs : 0, // expect ms
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
  }

  private generateTRC(frames: RawFrame[]) {
    const header = [
      "; Generated by React Native CAN Logger",
      "; Message Number | Time Offset (s) | Type | CAN ID (hex) | DLC | Data Bytes (hex)",
      "",
    ].join("\n");

    const body = frames.map((f, i) => {
      const msgNum = `${i + 1})`.padEnd(5);
      const t = Number(f.timeOffsetMs || 0) / 1000; // convert ms → s
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
  }

  async finalize() {
    try {
      if (this.status === "finalizing") return;
      this.status = "finalizing";
      this.notify();

      this.stopSampler();
      if (!this.snapshots.length || !this.rawFrames.length) {
        this.status = "idle";
        this.notify();
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

      const csvStr = Papa.unparse(this.snapshots);
      const trcStr = this.generateTRC(this.rawFrames);

      await RNFS.writeFile(csv, csvStr, "utf8");
      await RNFS.writeFile(trc, trcStr, "utf8");

      const zipped = await zip(folder, zipOut);

      this.lastFolderPath = folder;
      this.lastCsvPath = csv;
      this.lastTrcPath = trc;
      this.lastZipPath = zipped;

      this.status = "ready";
      this.notify();
    } catch (e) {
      this.status = "error";
      this.notify();
      throw e;
    }
  }

  reset() {
    this.stopSampler();
    if (this.inactivityTimer) { clearTimeout(this.inactivityTimer); this.inactivityTimer = null; }
    this.status = "idle";
    this.rawFrames = [];
    this.snapshots = [];
    this.framesSeen = 0;
    this.lastFolderPath = this.lastCsvPath = this.lastTrcPath = this.lastZipPath = null;
    this.notify();
  }
}

const recorder = new VehicleDataRecorder();
export default recorder;