/**
 * ==========================================================================
 * CubeStudio 3×3 - Speedcubing Telemetry & Training Studio
 * ==========================================================================
 * Architecture: Clean Code, SOLID Principles & Single Source of Truth (SSOT)
 * Modules:
 *  1. TimeUtils    - Pure time parsing, formatting, and date math
 *  2. StatsEngine  - Pure WCA statistical calculations (Ao5, Ao12, StdDev, Milestones)
 *  3. RubikEngine  - WCA scramble generator, 3x3 cube state simulator & 2D canvas net
 *  4. AudioSynth   - Web Audio API synthesizer for inspection alerts & timer clicks
 *  5. AppStore     - Central reactive State Store (Single Source of Truth)
 *  6. UIManager    - DOM lifecycle, component rendering & keyboard shortcuts
 * ==========================================================================
 */

// ==========================================================================
// MODULE 1: TIME UTILITIES (Pure Functions)
// ==========================================================================
const TimeUtils = {
  /**
   * Formats seconds (e.g. 88.62) into "MM:SS.ms" (e.g. "01:28.62")
   */
  formatTimerDigits(seconds) {
    if (seconds === null || seconds === undefined || isNaN(seconds)) return "00:00.00";
    if (seconds === Infinity) return "DNF";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds - Math.floor(seconds)) * 100);

    const mm = String(m).padStart(2, "0");
    const ss = String(s).padStart(2, "0");
    const msStr = String(ms).padStart(2, "0").slice(0, 2);

    return `${mm}:${ss}.${msStr}`;
  },

  /**
   * Smart Parser for diverse speedcuber input formats:
   * - "12862" -> 88.62s ("01:28.62")
   * - "145"   -> 105.00s ("01:45.00")
   * - "88.62" -> 88.62s
   * - "01:28.62" or "00:01:28:62" -> 88.62s
   */
  parseSmartTime(inputStr) {
    if (!inputStr) return null;
    const str = inputStr.trim();

    // 1. Pure contiguous digits (e.g. "12862" -> 1 min 28.62 sec)
    if (/^\d{3,6}$/.test(str)) {
      const ms = parseInt(str.slice(-2), 10) / 100;
      const s = parseInt(str.slice(-4, -2) || "0", 10);
      const m = parseInt(str.slice(0, -4) || "0", 10);
      return m * 60 + s + ms;
    }

    // 2. Pure seconds float (e.g. "88.62")
    if (/^\d+(\.\d+)?$/.test(str)) {
      return parseFloat(str);
    }

    // 3. Colon/dot separated time formats
    const parts = str.split(/[:.]/);
    if (parts.length === 4) {
      const h = parseInt(parts[0], 10) || 0;
      const m = parseInt(parts[1], 10) || 0;
      const s = parseInt(parts[2], 10) || 0;
      const ms = parseFloat("0." + parts[3]) || 0;
      return h * 3600 + m * 60 + s + ms;
    }
    if (parts.length === 3) {
      const m = parseInt(parts[0], 10) || 0;
      const s = parseInt(parts[1], 10) || 0;
      const ms = parseFloat("0." + parts[2]) || 0;
      return m * 60 + s + ms;
    }
    if (parts.length === 2) {
      const s = parseInt(parts[0], 10) || 0;
      const ms = parseFloat("0." + parts[1]) || 0;
      return s + ms;
    }

    return null;
  },

  getCurrentDateStr() {
    return new Date().toISOString().split("T")[0];
  },

  getCurrentClockStr() {
    return new Date().toTimeString().slice(0, 8);
  }
};

// ==========================================================================
// MODULE 2: STATISTICAL & WCA ENGINE (Pure Functions)
// ==========================================================================
const StatsEngine = {
  getEffectiveTime(solve) {
    if (solve.penalty === "dnf") return Infinity;
    if (solve.penalty === "+2") return solve.seconds + 2.0;
    return solve.seconds;
  },

  calculateWcaAverage(timesList) {
    if (!timesList || timesList.length < 3) return null;
    const dnfCount = timesList.filter(t => t === Infinity).length;
    if (dnfCount >= 2) return Infinity;

    const sorted = [...timesList].sort((a, b) => a - b);
    const trimmed = sorted.slice(1, -1);
    const sum = trimmed.reduce((a, b) => a + b, 0);
    return sum / trimmed.length;
  },

  calculateStandardDeviation(times) {
    const valid = times.filter(t => t !== Infinity && !isNaN(t));
    if (valid.length < 2) return 0;
    const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
    const variance = valid.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / valid.length;
    return Math.sqrt(variance);
  },

  calculateTrendline(data) {
    const validIndices = [];
    const validValues = [];
    data.forEach((v, i) => {
      if (v !== null && v !== Infinity && !isNaN(v)) {
        validIndices.push(i);
        validValues.push(v);
      }
    });

    if (validValues.length < 2) return [];
    const n = validValues.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += validIndices[i];
      sumY += validValues[i];
      sumXY += validIndices[i] * validValues[i];
      sumXX += validIndices[i] * validIndices[i];
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return data.map((_, i) => slope * i + intercept);
  },

  calculateMilestone(meanSeconds) {
    const tiers = [
      { target: 120, name: "Sub-2:00 (120s)", short: "Sub-2:00" },
      { target: 105, name: "Sub-1:45 (105s)", short: "Sub-1:45" },
      { target: 90,  name: "Sub-1:30 (90s)",  short: "Sub-1:30" },
      { target: 75,  name: "Sub-1:15 (75s)",  short: "Sub-1:15" },
      { target: 60,  name: "Sub-1:00 (60s)",  short: "Sub-1:00" },
      { target: 45,  name: "Sub-45s (45s)",   short: "Sub-45s" },
      { target: 30,  name: "Sub-30s (30s)",   short: "Sub-30s" }
    ];

    const nextTier = tiers.find(t => meanSeconds > t.target) || { target: 20, name: "Sub-20s (Elite)", short: "Sub-20s" };
    const base = nextTier.target + 30;
    const progress = Math.max(0, Math.min(100, ((base - meanSeconds) / 30) * 100));
    const gap = Math.max(0, meanSeconds - nextTier.target);

    return {
      name: nextTier.name,
      short: nextTier.short,
      percent: Math.round(progress),
      gap: gap.toFixed(1)
    };
  }
};

// ==========================================================================
// MODULE 3: RUBIK'S 3X3 SIMULATOR & 2D CANVAS NET
// ==========================================================================
const RubikEngine = {
  FACE_COLORS: {
    U: "#f8fafc", // White
    D: "#eab308", // Yellow
    F: "#22c55e", // Green
    B: "#3b82f6", // Blue
    L: "#f97316", // Orange
    R: "#ef4444"  // Red
  },

  generateScramble(length = 20) {
    const faces = ["R", "L", "U", "D", "F", "B"];
    const modifiers = ["", "'", "2"];
    const opposites = { "R": "L", "L": "R", "U": "D", "D": "U", "F": "B", "B": "F" };

    const moves = [];
    let lastFace = "";
    let secondLastFace = "";

    for (let i = 0; i < length; i++) {
      const validFaces = faces.filter(f => {
        if (f === lastFace) return false;
        if (f === secondLastFace && opposites[f] === lastFace) return false;
        return true;
      });

      const face = validFaces[Math.floor(Math.random() * validFaces.length)];
      const mod = modifiers[Math.floor(Math.random() * modifiers.length)];
      moves.push(face + mod);

      secondLastFace = lastFace;
      lastFace = face;
    }

    return moves.join(" ");
  },

  createCubeState() {
    return {
      U: Array(9).fill("U"),
      D: Array(9).fill("D"),
      F: Array(9).fill("F"),
      B: Array(9).fill("B"),
      L: Array(9).fill("L"),
      R: Array(9).fill("R")
    };
  },

  applySingleMove(faces, face) {
    const f = faces[face];
    faces[face] = [f[6], f[3], f[0], f[7], f[4], f[1], f[8], f[5], f[2]];

    const { U, D, F, B, L, R } = faces;
    if (face === "U") {
      const t = [F[0], F[1], F[2]];
      F[0] = R[0]; F[1] = R[1]; F[2] = R[2];
      R[0] = B[0]; R[1] = B[1]; R[2] = B[2];
      B[0] = L[0]; B[1] = L[1]; B[2] = L[2];
      L[0] = t[0]; L[1] = t[1]; L[2] = t[2];
    } else if (face === "D") {
      const t = [F[6], F[7], F[8]];
      F[6] = L[6]; F[7] = L[7]; F[8] = L[8];
      L[6] = B[6]; L[7] = B[7]; L[8] = B[8];
      B[6] = R[6]; B[7] = R[7]; B[8] = R[8];
      R[6] = t[0]; R[7] = t[1]; R[8] = t[2];
    } else if (face === "R") {
      const t = [U[2], U[5], U[8]];
      U[2] = F[2]; U[5] = F[5]; U[8] = F[8];
      F[2] = D[2]; F[5] = D[5]; F[8] = D[8];
      D[2] = B[6]; D[5] = B[3]; D[8] = B[0];
      B[6] = t[0]; B[3] = t[1]; B[0] = t[2];
    } else if (face === "L") {
      const t = [U[0], U[3], U[6]];
      U[0] = B[8]; U[3] = B[5]; U[6] = B[2];
      B[8] = D[0]; B[5] = D[3]; B[2] = D[6];
      D[0] = F[0]; D[3] = F[3]; D[6] = F[6];
      F[0] = t[0]; F[3] = t[1]; F[6] = t[2];
    } else if (face === "F") {
      const t = [U[6], U[7], U[8]];
      U[6] = L[8]; U[7] = L[5]; U[8] = L[2];
      L[8] = D[2]; L[5] = D[1]; L[2] = D[0];
      D[2] = R[0]; D[1] = R[3]; D[0] = R[6];
      R[0] = t[0]; R[3] = t[1]; R[6] = t[2];
    } else if (face === "B") {
      const t = [U[2], U[1], U[0]];
      U[2] = R[8]; U[1] = R[5]; U[0] = R[2];
      R[8] = D[6]; R[5] = D[7]; R[2] = D[8];
      D[6] = L[0]; D[7] = L[3]; D[8] = L[6];
      L[0] = t[0]; L[3] = t[1]; L[6] = t[2];
    }
  },

  simulateScramble(scrambleStr) {
    const faces = this.createCubeState();
    if (!scrambleStr) return faces;

    const moves = scrambleStr.trim().split(/\s+/);
    moves.forEach(m => {
      const face = m[0];
      const mod = m.slice(1);
      const turns = mod === "2" ? 2 : mod === "'" ? 3 : 1;
      for (let i = 0; i < turns; i++) {
        this.applySingleMove(faces, face);
      }
    });
    return faces;
  },

  render2DNet(canvas, scrambleStr) {
    if (!canvas) return;
    const faces = this.simulateScramble(scrambleStr);
    const ctx = canvas.getContext("2d");
    const size = 13;
    const gap = 1.5;
    const blockSize = size * 3 + gap * 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const layout = {
      U: { col: 1, row: 0 },
      L: { col: 0, row: 1 },
      F: { col: 1, row: 1 },
      R: { col: 2, row: 1 },
      B: { col: 3, row: 1 },
      D: { col: 1, row: 2 }
    };

    const startX = 6;
    const startY = 4;

    Object.entries(layout).forEach(([faceKey, pos]) => {
      const fX = startX + pos.col * (blockSize + 3);
      const fY = startY + pos.row * (blockSize + 3);
      const stickers = faces[faceKey];

      ctx.fillStyle = "#0a0e17";
      ctx.fillRect(fX - 1, fY - 1, blockSize + 2, blockSize + 2);

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const idx = r * 3 + c;
          const colorKey = stickers[idx];
          const sX = fX + c * (size + gap);
          const sY = fY + r * (size + gap);

          ctx.fillStyle = this.FACE_COLORS[colorKey] || "#fff";
          ctx.beginPath();
          ctx.roundRect(sX, sY, size, size, 1.5);
          ctx.fill();
        }
      }
    });
  }
};

// ==========================================================================
// MODULE 4: AUDIO SYNTHESIZER (Web Audio API)
// ==========================================================================
const AudioSynth = {
  ctx: null,

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },

  playTone(freq, type, duration, gain = 0.1) {
    if (!AppStore.state.settings.soundEnabled) return;
    try {
      this.init();
      if (this.ctx.state === "suspended") this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gainNode.gain.setValueAtTime(gain, this.ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio not supported or blocked
    }
  },

  playReady() {
    this.playTone(880, "sine", 0.08, 0.15); // A5 ready beep
  },

  playInspectionAlert() {
    this.playTone(523.25, "square", 0.12, 0.08); // C5 inspection alert
  },

  playStop() {
    this.playTone(440, "triangle", 0.05, 0.1);
  }
};

// ==========================================================================
// MODULE 5: CENTRAL STATE STORE (Single Source of Truth)
// ==========================================================================
const INITIAL_DEFAULT_SOLVES = [
  { id: 1, raw: "00:02:14:00", seconds: 134.00, date: "2026-10-01", time: "14:10:22", notes: "Session 1", scramble: "D2 R2 F2 U L2 U' B2 D' R2 F2 U' L2 U2 B' R D F2 R2 B' L'", penalty: "none" },
  { id: 2, raw: "00:01:51:24", seconds: 111.24, date: "2026-10-01", time: "14:15:45", notes: "Session 1", scramble: "U2 F2 D' B2 L2 B2 D F2 U' R2 U' L' D2 B' R' F D' L B' U", penalty: "none" },
  { id: 3, raw: "00:02:02:91", seconds: 122.91, date: "2026-10-01", time: "14:21:03", notes: "Session 1", scramble: "B2 L2 D2 R2 U2 B2 F2 D' F2 U' R' B' D F2 L D' R2 U' F", penalty: "none" },
  { id: 4, raw: "00:02:00:02", seconds: 120.02, date: "2026-10-01", time: "14:26:18", notes: "Session 1", scramble: "L2 B2 D2 R2 U' L2 D B2 D' F2 L' B R' U' L2 F' D2 L' U' B", penalty: "none" },
  { id: 5, raw: "00:01:52:31", seconds: 112.31, date: "2026-10-01", time: "14:30:50", notes: "Session 1", scramble: "R2 F2 U' B2 D' L2 D' B2 U' F2 R' B' L' D F' R2 U2 B' L' F", penalty: "none" },
  { id: 6, raw: "00:01:52:12", seconds: 112.12, date: "2026-10-01", time: "14:35:12", notes: "Session 1", scramble: "F2 D2 L2 U2 B2 R2 D' F2 U' B2 R D' L2 F' D2 R' F2 L' U' R", penalty: "none" },
  { id: 7, raw: "00:01:47:94", seconds: 107.94, date: "2026-10-02", time: "19:05:30", notes: "Session 2", scramble: "U2 L2 B2 D2 R2 U B2 D' F2 L2 U' R' D2 F' R2 B' L D2 F'", penalty: "none" },
  { id: 8, raw: "00:02:00:75", seconds: 120.75, date: "2026-10-02", time: "19:11:14", notes: "Session 2", scramble: "D2 B2 L2 U' R2 U' B2 U2 F2 D' L' U2 F' R' D' F2 L2 B2 U", penalty: "none" },
  { id: 9, raw: "00:01:43:62", seconds: 103.62, date: "2026-10-02", time: "19:16:40", notes: "Session 2", scramble: "R2 U2 F2 D' L2 U' B2 D' F2 L2 R' B D2 R2 F' U' L' B' D2", penalty: "none" },
  { id: 10, raw: "00:01:28:62", seconds: 88.62, date: "2026-10-02", time: "19:22:05", notes: "Smooth F2L", scramble: "B2 D2 R2 F2 U' L2 U' B2 D' F2 U L' D2 B' R F D' L B' U", penalty: "none" },
  { id: 11, raw: "00:01:33:34", seconds: 93.34, date: "2026-10-02", time: "19:28:50", notes: "Session 2", scramble: "L2 U2 F2 D2 R2 U' B2 D' L2 U' R' B' D F2 L D' R2 U' F", penalty: "none" },
  { id: 12, raw: "00:01:50:42", seconds: 110.42, date: "2026-10-02", time: "19:35:10", notes: "Session 2", scramble: "F2 R2 U' B2 D' L2 D' B2 U' F2 R' B' L' D F' R2 U2 B' L'", penalty: "none" },
  { id: 13, raw: "00:01:50:66", seconds: 110.66, date: "2026-10-03", time: "20:10:05", notes: "Session 3", scramble: "U2 F2 D' B2 L2 B2 D F2 U' R2 U' L' D2 B' R' F D' L B' U", penalty: "none" },
  { id: 14, raw: "00:01:44:40", seconds: 104.40, date: "2026-10-03", time: "20:16:22", notes: "Session 3", scramble: "D2 B2 L2 U' R2 U' B2 U2 F2 D' L' U2 F' R' D' F2 L2 B2 U", penalty: "none" },
  { id: 15, raw: "00:01:52:57", seconds: 112.57, date: "2026-10-03", time: "20:22:40", notes: "Session 3", scramble: "R2 F2 U' B2 D' L2 D' B2 U' F2 R' B' L' D F' R2 U2 B' L'", penalty: "none" },
  { id: 16, raw: "00:02:29:44", seconds: 149.44, date: "2026-10-03", time: "20:28:15", notes: "Lockup", scramble: "B2 L2 D2 R2 U2 B2 F2 D' F2 U' R' B' D F2 L D' R2 U' F", penalty: "none" }
];

const STORAGE_KEY = "cubestudio_app_state_v5";

const AppStore = {
  state: {
    sessions: {},
    activeSessionId: "session_1",
    currentScramble: "",
    filters: {
      dateFrom: "",
      dateTo: "",
      solveFrom: null,
      solveTo: null,
      status: "all",
      sortOrder: "desc",
      searchQuery: ""
    },
    settings: {
      inspectionEnabled: false,
      soundEnabled: true,
      show2D: true
    }
  },

  listeners: [],

  init() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.state.sessions = parsed.sessions || this.createDefaultSessions();
        this.state.activeSessionId = parsed.activeSessionId || "session_1";
        if (parsed.settings) this.state.settings = { ...this.state.settings, ...parsed.settings };
      } catch (e) {
        this.state.sessions = this.createDefaultSessions();
      }
    } else {
      this.state.sessions = this.createDefaultSessions();
    }

    if (!this.state.sessions[this.state.activeSessionId]) {
      this.state.activeSessionId = Object.keys(this.state.sessions)[0] || "session_1";
    }

    this.state.currentScramble = RubikEngine.generateScramble(20);
    this.persist();
  },

  createDefaultSessions() {
    return {
      "session_1": {
        id: "session_1",
        name: "Session 1: Main 3×3",
        solves: [...INITIAL_DEFAULT_SOLVES]
      }
    };
  },

  persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      sessions: this.state.sessions,
      activeSessionId: this.state.activeSessionId,
      settings: this.state.settings
    }));
  },

  subscribe(listener) {
    this.listeners.push(listener);
  },

  notify() {
    this.persist();
    this.listeners.forEach(fn => fn(this.state));
  },

  getActiveSolves() {
    const s = this.state.sessions[this.state.activeSessionId];
    return s ? s.solves : [];
  },

  addSolve(seconds, scramble, notes = "", customDate = "", customTime = "", penalty = "none") {
    const solves = this.getActiveSolves();
    const dateStr = customDate || TimeUtils.getCurrentDateStr();
    const timeStr = customTime || TimeUtils.getCurrentClockStr();
    const roundedSec = parseFloat(seconds.toFixed(2));

    const newSolve = {
      id: solves.length + 1,
      raw: TimeUtils.formatTimerDigits(roundedSec),
      seconds: roundedSec,
      date: dateStr,
      time: timeStr,
      notes: notes,
      scramble: scramble || this.state.currentScramble,
      penalty: penalty
    };

    solves.push(newSolve);
    this.state.currentScramble = RubikEngine.generateScramble(20);
    this.notify();
  },

  togglePenalty(index, penaltyType) {
    const solves = this.getActiveSolves();
    if (!solves[index]) return;
    solves[index].penalty = solves[index].penalty === penaltyType ? "none" : penaltyType;
    this.notify();
  },

  tagLastSolve(tagText) {
    const solves = this.getActiveSolves();
    if (solves.length === 0) return;
    const last = solves[solves.length - 1];
    last.notes = last.notes ? `${last.notes}, ${tagText}` : tagText;
    this.notify();
  },

  deleteSolve(index) {
    const solves = this.getActiveSolves();
    if (!solves[index]) return;
    solves.splice(index, 1);
    this.notify();
  },

  resetActiveSession() {
    const s = this.state.sessions[this.state.activeSessionId];
    if (!s) return;
    s.solves = [...INITIAL_DEFAULT_SOLVES];
    this.notify();
  },

  createSession(name) {
    const id = "session_" + Date.now();
    this.state.sessions[id] = { id, name, solves: [] };
    this.state.activeSessionId = id;
    this.state.currentScramble = RubikEngine.generateScramble(20);
    this.notify();
  },

  switchSession(id) {
    if (this.state.sessions[id]) {
      this.state.activeSessionId = id;
      this.state.currentScramble = RubikEngine.generateScramble(20);
      this.notify();
    }
  },

  renameSession(id, newName) {
    if (this.state.sessions[id]) {
      this.state.sessions[id].name = newName;
      this.notify();
    }
  },

  nextScramble() {
    this.state.currentScramble = RubikEngine.generateScramble(20);
    this.notify();
  },

  setFilter(updates) {
    this.state.filters = { ...this.state.filters, ...updates };
    this.notify();
  },

  resetFilters() {
    this.state.filters = {
      dateFrom: "",
      dateTo: "",
      solveFrom: null,
      solveTo: null,
      status: "all",
      sortOrder: "desc",
      searchQuery: ""
    };
    this.notify();
  },

  toggleSound() {
    this.state.settings.soundEnabled = !this.state.settings.soundEnabled;
    this.notify();
  },

  toggleInspectionSetting(val) {
    this.state.settings.inspectionEnabled = val;
    this.notify();
  },

  toggle2DView() {
    this.state.settings.show2D = !this.state.settings.show2D;
    this.notify();
  }
};

// ==========================================================================
// MODULE 6: UI MANAGER & COMPONENT RENDERERS
// ==========================================================================
const UIManager = {
  elements: {},
  chartInstance: null,
  
  // Timer State Machine: "IDLE", "INSPECTION", "HOLDING", "READY", "RUNNING", "STOPPED"
  timerState: "IDLE",
  timerStartTime: 0,
  timerInterval: null,
  spaceHoldTimeout: null,
  inspectionTime: 15,
  inspectionInterval: null,
  isSpacePressed: false,
  pendingPenalty: "none",

  init() {
    this.cacheElements();
    this.bindEvents();
    AppStore.subscribe(() => this.render());
    this.render();
  },

  cacheElements() {
    const el = (id) => document.getElementById(id);
    this.elements = {
      appLayout: el("appLayout"),
      sessionSelect: el("sessionSelect"),
      btnNewSession: el("btnNewSession"),
      btnRenameSession: el("btnRenameSession"),
      btnResetSession: el("btnResetSession"),
      btnSoundToggle: el("btnSoundToggle"),
      tabTimerMode: el("tabTimerMode"),
      tabInputMode: el("tabInputMode"),
      timerSection: el("timerSection"),
      inputSection: el("inputSection"),
      btnExportJson: el("btnExportJson"),
      btnExportCsv: el("btnExportCsv"),
      fileImport: el("fileImport"),

      scrambleDisplay: el("scrambleDisplay"),
      scrambleNumber: el("scrambleNumber"),
      btnNextScramble: el("btnNextScramble"),
      btnCopyScramble: el("btnCopyScramble"),
      copyBtnText: el("copyBtnText"),
      btnToggle2D: el("btnToggle2D"),
      cube2dWrapper: el("cube2dWrapper"),
      cube2dCanvas: el("cube2dCanvas"),

      heroTimer: el("heroTimer"),
      timerDigits: el("timerDigits"),
      timerStatus: el("timerStatus"),
      toggleInspection: el("toggleInspection"),
      mobileTouchBar: el("mobileTouchBar"),

      timerQuickActions: el("timerQuickActions"),
      lastSolveLabel: el("lastSolveLabel"),
      btnLastPlus2: el("btnLastPlus2"),
      btnLastDnf: el("btnLastDnf"),
      btnLastTag: el("btnLastTag"),
      btnLastDelete: el("btnLastDelete"),

      quickTagPopover: el("quickTagPopover"),
      btnCloseTagPopover: el("btnCloseTagPopover"),
      quickTagInput: el("quickTagInput"),
      btnSaveQuickTag: el("btnSaveQuickTag"),

      formFastInput: el("formFastInput"),
      fastInputTime: el("fastInputTime"),
      inputFormatPreview: el("inputFormatPreview"),
      fastInputDate: el("fastInputDate"),
      fastInputClock: el("fastInputClock"),
      fastInputNotes: el("fastInputNotes"),

      hudPB: el("hudPB"),
      hudPBSub: el("hudPBSub"),
      hudCurrentAo5: el("hudCurrentAo5"),
      hudBestAo5: el("hudBestAo5"),
      hudCurrentAo12: el("hudCurrentAo12"),
      hudBestAo12: el("hudBestAo12"),
      hudMean: el("hudMean"),
      hudTotalSolves: el("hudTotalSolves"),
      hudMilestoneTitle: el("hudMilestoneTitle"),
      hudMilestoneBar: el("hudMilestoneBar"),
      hudMilestoneDesc: el("hudMilestoneDesc"),
      hudMilestonePercent: el("hudMilestonePercent"),

      filterCountBadge: el("filterCountBadge"),
      filterDateFrom: el("filterDateFrom"),
      filterDateTo: el("filterDateTo"),
      filterSolveFrom: el("filterSolveFrom"),
      filterSolveTo: el("filterSolveTo"),
      filterStatusSelect: el("filterStatusSelect"),
      filterSortOrder: el("filterSortOrder"),
      btnResetFilter: el("btnResetFilter"),

      toggleSingle: el("toggleSingle"),
      toggleAo5: el("toggleAo5"),
      toggleAo12: el("toggleAo12"),
      toggleTrend: el("toggleTrend"),
      progressionChart: el("progressionChart"),

      ledgerTableBody: el("ledgerTableBody"),
      tableFilter: el("tableFilter"),
      tableCountSubtitle: el("tableCountSubtitle"),

      detailModal: el("detailModal"),
      modalTitle: el("modalTitle"),
      modalTime: el("modalTime"),
      modalTimestamp: el("modalTimestamp"),
      modalScramble: el("modalScramble"),
      modalAo5: el("modalAo5"),
      modalNote: el("modalNote"),
      btnModalClose: el("btnModalClose")
    };
  },

  render() {
    this.renderHeader();
    this.renderScrambleStage();
    this.renderTelemetry();
    this.renderFilterControls();
    this.renderChart();
    this.renderLedgerTable();
    this.renderTimerStatusHint();
  },

  renderHeader() {
    const { sessions, activeSessionId, settings } = AppStore.state;
    this.elements.sessionSelect.innerHTML = Object.values(sessions).map(s =>
      `<option value="${s.id}" ${s.id === activeSessionId ? 'selected' : ''}>${escapeHtml(s.name)} (${s.solves.length})</option>`
    ).join("");

    this.elements.btnSoundToggle.textContent = settings.soundEnabled ? "🔊 Sound ON" : "🔇 Sound OFF";
    this.elements.toggleInspection.checked = settings.inspectionEnabled;
    this.elements.btnToggle2D.classList.toggle("active", settings.show2D);
    this.elements.cube2dWrapper.style.display = settings.show2D ? "flex" : "none";
  },

  renderTimerStatusHint() {
    if (this.timerState === "IDLE") {
      this.elements.timerDigits.textContent = "00:00.00";
      if (AppStore.state.settings.inspectionEnabled) {
        this.elements.timerStatus.textContent = "PRESS SPACEBAR TO START 15s INSPECTION";
      } else {
        this.elements.timerStatus.textContent = "PRESS & HOLD SPACEBAR TO START";
      }
    }
  },

  renderScrambleStage() {
    const { currentScramble } = AppStore.state;
    const solves = AppStore.getActiveSolves();
    this.elements.scrambleDisplay.textContent = currentScramble;
    this.elements.scrambleNumber.textContent = `Solve #${solves.length + 1}`;
    if (AppStore.state.settings.show2D) {
      RubikEngine.render2DNet(this.elements.cube2dCanvas, currentScramble);
    }
  },

  /**
   * Filtered Solves Provider (Single Source for Table, Chart, and Telemetry)
   */
  getFilteredSolves() {
    const allSolves = AppStore.getActiveSolves();
    const f = AppStore.state.filters;
    const allTimes = allSolves.map(StatsEngine.getEffectiveTime);
    const minTime = allTimes.length > 0 ? Math.min(...allTimes) : Infinity;

    return allSolves
      .map((solve, originalIndex) => ({ solve, originalIndex }))
      .filter(({ solve, originalIndex }) => {
        const idx = originalIndex + 1;
        if (f.solveFrom !== null && !isNaN(f.solveFrom) && idx < f.solveFrom) return false;
        if (f.solveTo !== null && !isNaN(f.solveTo) && idx > f.solveTo) return false;
        if (f.dateFrom && solve.date && solve.date < f.dateFrom) return false;
        if (f.dateTo && solve.date && solve.date > f.dateTo) return false;

        if (f.status === "pb" && StatsEngine.getEffectiveTime(solve) !== minTime) return false;
        if (f.status === "tagged" && (!solve.notes || !solve.notes.trim())) return false;
        if (f.status === "plus2" && solve.penalty !== "+2") return false;
        if (f.status === "dnf" && solve.penalty !== "dnf") return false;

        if (f.searchQuery) {
          const q = f.searchQuery.toLowerCase();
          const formatted = TimeUtils.formatTimerDigits(StatsEngine.getEffectiveTime(solve)).toLowerCase();
          const match = String(idx).includes(q) ||
            formatted.includes(q) ||
            (solve.notes && solve.notes.toLowerCase().includes(q)) ||
            (solve.date && solve.date.toLowerCase().includes(q)) ||
            (solve.time && solve.time.toLowerCase().includes(q));
          if (!match) return false;
        }

        return true;
      });
  },

  // ==========================================================================
  // TELEMETRY HUD (SYNCED WITH FILTERED DATASET)
  // ==========================================================================
  renderTelemetry() {
    const filteredList = this.getFilteredSolves();
    const n = filteredList.length;

    if (n === 0) {
      this.elements.hudPB.textContent = "--:--.--";
      this.elements.hudPBSub.textContent = "No matching solves";
      this.elements.hudCurrentAo5.textContent = "--:--.--";
      this.elements.hudBestAo5.textContent = "Best: --:--.--";
      this.elements.hudCurrentAo12.textContent = "--:--.--";
      this.elements.hudBestAo12.textContent = "Best: --:--.--";
      this.elements.hudMean.textContent = "--:--.--";
      this.elements.hudTotalSolves.textContent = "0 Solves visible";
      this.elements.hudMilestoneBar.style.width = "0%";
      this.elements.hudMilestonePercent.textContent = "0%";
      return;
    }

    // Sort chronologically for calculation
    const chronological = [...filteredList].sort((a, b) => a.originalIndex - b.originalIndex);
    const times = chronological.map(item => StatsEngine.getEffectiveTime(item.solve));
    const validTimes = times.filter(t => t !== Infinity);

    // PB in filtered range
    let minTime = Infinity, bestOriginalIdx = -1;
    chronological.forEach(item => {
      const t = StatsEngine.getEffectiveTime(item.solve);
      if (t < minTime) {
        minTime = t;
        bestOriginalIdx = item.originalIndex;
      }
    });

    this.elements.hudPB.textContent = minTime !== Infinity ? TimeUtils.formatTimerDigits(minTime) : "DNF";
    this.elements.hudPBSub.textContent = minTime !== Infinity ? `Solve #${bestOriginalIdx + 1} (${minTime.toFixed(2)}s)` : "-";

    // Mean & StdDev in filtered range
    if (validTimes.length > 0) {
      const mean = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
      const stdDev = StatsEngine.calculateStandardDeviation(validTimes);
      this.elements.hudMean.textContent = TimeUtils.formatTimerDigits(mean);
      
      const totalAll = AppStore.getActiveSolves().length;
      const filterLabel = n === totalAll ? `${n} Solves` : `${n} of ${totalAll} Solves`;
      this.elements.hudTotalSolves.textContent = `${filterLabel} (σ = ${stdDev.toFixed(1)}s)`;

      const ms = StatsEngine.calculateMilestone(mean);
      this.elements.hudMilestoneTitle.textContent = `Road to ${ms.name}`;
      this.elements.hudMilestoneBar.style.width = `${ms.percent}%`;
      this.elements.hudMilestonePercent.textContent = `${ms.percent}%`;
      this.elements.hudMilestoneDesc.textContent = `Gap: ${ms.gap}s to achieve ${ms.short}`;
    }

    // Ao5 in filtered range
    let bestAo5 = Infinity, currentAo5 = null;
    for (let i = 4; i < n; i++) {
      const avg = StatsEngine.calculateWcaAverage(times.slice(i - 4, i + 1));
      if (avg < bestAo5) bestAo5 = avg;
      if (i === n - 1) currentAo5 = avg;
    }
    this.elements.hudCurrentAo5.textContent = currentAo5 !== null ? (currentAo5 === Infinity ? "DNF" : TimeUtils.formatTimerDigits(currentAo5)) : "--:--.--";
    this.elements.hudBestAo5.textContent = bestAo5 !== Infinity ? `Best: ${TimeUtils.formatTimerDigits(bestAo5)}` : "Best: --:--.--";

    // Ao12 in filtered range
    let bestAo12 = Infinity, currentAo12 = null;
    for (let i = 11; i < n; i++) {
      const avg = StatsEngine.calculateWcaAverage(times.slice(i - 11, i + 1));
      if (avg < bestAo12) bestAo12 = avg;
      if (i === n - 1) currentAo12 = avg;
    }
    this.elements.hudCurrentAo12.textContent = currentAo12 !== null ? (currentAo12 === Infinity ? "DNF" : TimeUtils.formatTimerDigits(currentAo12)) : "--:--.--";
    this.elements.hudBestAo12.textContent = bestAo12 !== Infinity ? `Best: ${TimeUtils.formatTimerDigits(bestAo12)}` : "Best: --:--.--";
  },

  renderFilterControls() {
    const f = AppStore.state.filters;
    this.elements.filterDateFrom.value = f.dateFrom || "";
    this.elements.filterDateTo.value = f.dateTo || "";
    this.elements.filterSolveFrom.value = f.solveFrom !== null ? f.solveFrom : "";
    this.elements.filterSolveTo.value = f.solveTo !== null ? f.solveTo : "";
    this.elements.filterStatusSelect.value = f.status || "all";
    this.elements.filterSortOrder.value = f.sortOrder || "desc";
    this.elements.tableFilter.value = f.searchQuery || "";
  },

  // ==========================================================================
  // LEDGER TABLE RENDERER (RESPECTS SORT ORDER)
  // ==========================================================================
  renderLedgerTable() {
    const allSolves = AppStore.getActiveSolves();
    const filteredList = this.getFilteredSolves();
    const allTimes = allSolves.map(StatsEngine.getEffectiveTime);
    const minTime = allTimes.length > 0 ? Math.min(...allTimes) : Infinity;

    const totalCount = allSolves.length;
    const filteredCount = filteredList.length;
    this.elements.filterCountBadge.textContent = filteredCount === totalCount
      ? `Showing all ${totalCount} solves`
      : `Showing ${filteredCount} of ${totalCount} Solves (Filtered)`;
    this.elements.tableCountSubtitle.textContent = `${filteredCount} of ${totalCount} solves visible`;

    // Sort table rows according to sort order setting
    const isDesc = AppStore.state.filters.sortOrder === "desc";
    const displayList = [...filteredList].sort((a, b) => isDesc ? b.originalIndex - a.originalIndex : a.originalIndex - b.originalIndex);

    let html = "";
    displayList.forEach(({ solve, originalIndex }) => {
      const idx = originalIndex;
      const formatted = solve.penalty === "dnf" ? "DNF" : TimeUtils.formatTimerDigits(StatsEngine.getEffectiveTime(solve));

      let ao5Str = "-";
      if (idx >= 4) {
        const avg = StatsEngine.calculateWcaAverage(allTimes.slice(idx - 4, idx + 1));
        ao5Str = avg === Infinity ? "DNF" : TimeUtils.formatTimerDigits(avg);
      }

      let ao12Str = "-";
      if (idx >= 11) {
        const avg = StatsEngine.calculateWcaAverage(allTimes.slice(idx - 11, idx + 1));
        ao12Str = avg === Infinity ? "DNF" : TimeUtils.formatTimerDigits(avg);
      }

      const isPB = StatsEngine.getEffectiveTime(solve) === minTime && minTime !== Infinity;
      const rowClass = isPB ? "row-pb-tag" : "";
      const pbBadge = isPB ? `<span class="badge-pb-mini">PB</span>` : "";

      let penaltyBadge = "";
      if (solve.penalty === "+2") penaltyBadge = `<span class="penalty-badge badge-plus2">+2</span>`;
      if (solve.penalty === "dnf") penaltyBadge = `<span class="penalty-badge badge-dnf">DNF</span>`;

      let tagBadge = `<span style="color:var(--text-muted);">-</span>`;
      if (solve.notes && solve.notes.trim()) {
        const nLow = solve.notes.toLowerCase();
        let colorClass = "";
        if (nLow.includes("f2l")) colorClass = "badge-tag-f2l";
        else if (nLow.includes("skip")) colorClass = "badge-tag-skip";
        else if (nLow.includes("lockup") || nLow.includes("bad")) colorClass = "badge-tag-lockup";

        tagBadge = `<span class="badge-tag ${colorClass}">${escapeHtml(solve.notes)}</span>`;
      }

      const timeDisplay = solve.time ? solve.time.slice(0, 5) : "";
      const dateDisplay = solve.date || "-";

      html += `
        <tr id="row-${idx}" class="${rowClass}">
          <td><strong>#${idx + 1}</strong></td>
          <td>
            <strong style="cursor:pointer;" onclick="UIManager.openSolveModal(${idx})">${formatted}</strong>${penaltyBadge}${pbBadge}
          </td>
          <td>${ao5Str}</td>
          <td>${ao12Str}</td>
          <td class="timestamp-cell">
            <div>${dateDisplay}</div>
            <div class="timestamp-time">${timeDisplay}</div>
          </td>
          <td>${tagBadge}</td>
          <td>
            <div class="action-btns">
              <button class="btn-mini ${solve.penalty === '+2' ? 'chip-orange active' : ''}" onclick="UIManager.togglePenalty(${idx}, '+2')" title="+2 Penalty">+2</button>
              <button class="btn-mini ${solve.penalty === 'dnf' ? 'chip-red active' : ''}" onclick="UIManager.togglePenalty(${idx}, 'dnf')" title="DNF">DNF</button>
              <button class="btn-mini btn-mini-danger" onclick="UIManager.deleteSolve(${idx})" title="Delete solve">🗑</button>
            </div>
          </td>
        </tr>
      `;
    });

    if (!html) {
      html = `<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--text-muted);">No solves match current filters.</td></tr>`;
    }

    this.elements.ledgerTableBody.innerHTML = html;
  },

  // ==========================================================================
  // CHART RENDERER (SYNCED WITH FILTERED DATASET IN CHRONOLOGICAL ORDER)
  // ==========================================================================
  renderChart() {
    const filteredList = this.getFilteredSolves();
    const ctx = this.elements.progressionChart.getContext("2d");

    // Chart ALWAYS plots chronologically (left to right: oldest to newest in filter)
    const chronological = [...filteredList].sort((a, b) => a.originalIndex - b.originalIndex);

    const labels = chronological.map(item => `#${item.originalIndex + 1}`);
    const rawData = chronological.map(item => {
      const t = StatsEngine.getEffectiveTime(item.solve);
      return t === Infinity ? null : t;
    });

    // Rolling Ao5 over the filtered series
    const ao5Data = chronological.map((_, idx) => {
      if (idx < 4) return null;
      const times = chronological.slice(idx - 4, idx + 1).map(i => StatsEngine.getEffectiveTime(i.solve));
      const avg = StatsEngine.calculateWcaAverage(times);
      return avg === Infinity ? null : avg;
    });

    // Rolling Ao12 over the filtered series
    const ao12Data = chronological.map((_, idx) => {
      if (idx < 11) return null;
      const times = chronological.slice(idx - 11, idx + 1).map(i => StatsEngine.getEffectiveTime(i.solve));
      const avg = StatsEngine.calculateWcaAverage(times);
      return avg === Infinity ? null : avg;
    });

    const trendData = StatsEngine.calculateTrendline(rawData);

    // Highlight best in current filtered view
    const validNumerics = rawData.filter(v => v !== null);
    const minVal = validNumerics.length > 0 ? Math.min(...validNumerics) : null;
    const pointBgColors = rawData.map(t => t === minVal ? "#10b981" : "#3b82f6");
    const pointRadii = rawData.map(t => t === minVal ? 7 : 4);

    const datasets = [];
    if (this.elements.toggleSingle.checked && rawData.length > 0) {
      datasets.push({
        label: "Solve Time (Single)",
        data: rawData,
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.08)",
        borderWidth: 2,
        tension: 0.2,
        pointBackgroundColor: pointBgColors,
        pointBorderColor: "#fff",
        pointBorderWidth: 1.5,
        pointRadius: pointRadii,
        fill: true
      });
    }

    if (this.elements.toggleAo5.checked && ao5Data.some(v => v !== null)) {
      datasets.push({
        label: "Rolling Ao5",
        data: ao5Data,
        borderColor: "#f59e0b",
        backgroundColor: "transparent",
        borderWidth: 2.5,
        tension: 0.25,
        pointRadius: 2.5,
        pointBackgroundColor: "#f59e0b"
      });
    }

    if (this.elements.toggleAo12.checked && ao12Data.some(v => v !== null)) {
      datasets.push({
        label: "Rolling Ao12",
        data: ao12Data,
        borderColor: "#06b6d4",
        backgroundColor: "transparent",
        borderWidth: 2.5,
        tension: 0.25,
        pointRadius: 2.5,
        pointBackgroundColor: "#06b6d4"
      });
    }

    if (this.elements.toggleTrend.checked && trendData.length > 1) {
      datasets.push({
        label: "Progress Trend",
        data: trendData,
        borderColor: "#8b5cf6",
        borderDash: [5, 5],
        backgroundColor: "transparent",
        borderWidth: 2,
        pointRadius: 0
      });
    }

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    this.chartInstance = new Chart(ctx, {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        onClick: (e, elements) => {
          if (elements.length > 0) {
            const clickedItem = chronological[elements[0].index];
            if (clickedItem) this.openSolveModal(clickedItem.originalIndex);
          }
        },
        onHover: (e, elements) => {
          document.querySelectorAll(".ledger-table tbody tr").forEach(r => r.classList.remove("row-highlight-chart"));
          if (elements.length > 0) {
            const hoveredItem = chronological[elements[0].index];
            if (hoveredItem) {
              const targetRow = document.getElementById(`row-${hoveredItem.originalIndex}`);
              if (targetRow) {
                targetRow.classList.add("row-highlight-chart");
                targetRow.scrollIntoView({ block: "nearest", behavior: "smooth" });
              }
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#111622",
            titleColor: "#f8fafc",
            bodyColor: "#94a3b8",
            borderColor: "#2a3b56",
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            usePointStyle: true,
            callbacks: {
              label: (context) => {
                const val = context.parsed.y;
                return val !== null ? ` ${context.dataset.label}: ${TimeUtils.formatTimerDigits(val)} (${val.toFixed(2)}s)` : null;
              },
              afterBody: (contexts) => {
                const item = chronological[contexts[0].dataIndex];
                if (!item) return [];
                const s = item.solve;
                const lines = [];
                if (s && s.date) lines.push(`Timestamp: ${s.date} ${s.time || ''}`);
                if (s && s.notes) lines.push(`Tag: ${s.notes}`);
                return lines;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: "rgba(28, 38, 56, 0.4)" },
            ticks: { color: "#52627a", font: { family: "JetBrains Mono", size: 10 } }
          },
          y: {
            grid: { color: "rgba(28, 38, 56, 0.4)" },
            ticks: {
              color: "#52627a",
              font: { family: "JetBrains Mono", size: 10 },
              callback: (v) => TimeUtils.formatTimerDigits(v)
            }
          }
        }
      }
    });
  },

  // ==========================================================================
  // WCA 15S INSPECTION & PRECISION TIMER STATE MACHINE
  // ==========================================================================
  bindEvents() {
    this.bindTimerEvents();
    this.bindHeaderEvents();
    this.bindFilterEvents();
    this.bindInputEvents();
    this.bindModalEvents();
    this.bindKeyboardShortcuts();
  },

  bindTimerEvents() {
    window.addEventListener("keydown", (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") return;

      // When running solve timer, ANY key stops it immediately
      if (this.timerState === "RUNNING") {
        this.stopSolveTimer();
        return;
      }

      if (e.code === "Space" && !this.isSpacePressed) {
        e.preventDefault();
        this.isSpacePressed = true;
        this.handleTimerKeyDown();
      }
    });

    window.addEventListener("keyup", (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") return;

      if (e.code === "Space") {
        e.preventDefault();
        this.isSpacePressed = false;
        this.handleTimerKeyUp();
      }
    });

    // Touch / Mobile bar handlers
    const startTouch = (e) => { e.preventDefault(); this.handleTimerKeyDown(); };
    const endTouch = (e) => { e.preventDefault(); this.handleTimerKeyUp(); };
    this.elements.mobileTouchBar.addEventListener("touchstart", startTouch, { passive: false });
    this.elements.mobileTouchBar.addEventListener("touchend", endTouch, { passive: false });
    this.elements.mobileTouchBar.addEventListener("mousedown", () => this.handleTimerKeyDown());
    this.elements.mobileTouchBar.addEventListener("mouseup", () => this.handleTimerKeyUp());
  },

  /**
   * KeyDown Handler:
   * - If Inspection is ON and in IDLE: Starts 15s inspection.
   * - If Inspection is Running or in Normal IDLE: Starts holding (Red -> Green Ready after 300ms).
   */
  handleTimerKeyDown() {
    if (this.timerState === "RUNNING") {
      this.stopSolveTimer();
      return;
    }

    const inspectionEnabled = AppStore.state.settings.inspectionEnabled;

    // FASE 1: Mulai 15s Inspection jika aktif dan timer sedang IDLE
    if (inspectionEnabled && (this.timerState === "IDLE" || this.timerState === "STOPPED")) {
      this.startInspection();
      return;
    }

    // FASE 2: Tahan tangan di timer (baik saat inspection sedang jalan, atau saat normal mode)
    if (this.timerState === "INSPECTION" || this.timerState === "IDLE" || this.timerState === "STOPPED") {
      this.timerState = "HOLDING";
      this.setTimerStateClass("holding");
      this.elements.timerStatus.textContent = "HOLD STILL...";
      this.elements.appLayout.classList.add("focus-active");

      this.spaceHoldTimeout = setTimeout(() => {
        if (this.timerState === "HOLDING") {
          this.timerState = "READY";
          this.setTimerStateClass("ready");
          this.elements.timerDigits.textContent = "00:00.00";
          this.elements.timerStatus.textContent = "RELEASE SPACEBAR TO SOLVE!";
          AudioSynth.playReady();
        }
      }, 300);
    }
  },

  /**
   * KeyUp Handler:
   * - If READY (held for >= 300ms): Starts the solve timer.
   * - If released before READY: Cancels hold.
   */
  handleTimerKeyUp() {
    clearTimeout(this.spaceHoldTimeout);

    if (this.timerState === "READY") {
      this.startSolveTimer();
    } else if (this.timerState === "HOLDING") {
      // Released too early before 300ms
      if (this.inspectionInterval) {
        // Return to active inspection countdown
        this.timerState = "INSPECTION";
        this.setTimerStateClass("inspection");
        this.elements.timerDigits.textContent = `${this.inspectionTime}`;
        this.elements.timerStatus.textContent = "INSPECTING... HOLD SPACEBAR WHEN READY";
      } else {
        this.timerState = "IDLE";
        this.setTimerStateClass("idle");
        this.renderTimerStatusHint();
        this.elements.appLayout.classList.remove("focus-active");
      }
    }
  },

  startInspection() {
    this.timerState = "INSPECTION";
    this.setTimerStateClass("inspection");
    this.inspectionTime = 15;
    this.pendingPenalty = "none";
    this.elements.timerDigits.textContent = "15";
    this.elements.timerStatus.textContent = "WCA INSPECTION (15s) - OBSERVE CUBE";
    this.elements.appLayout.classList.add("focus-active");

    clearInterval(this.inspectionInterval);
    this.inspectionInterval = setInterval(() => {
      this.inspectionTime--;

      if (this.inspectionTime > 0) {
        if (this.timerState === "INSPECTION") {
          this.elements.timerDigits.textContent = `${this.inspectionTime}`;
        }
        if (this.inspectionTime === 7 || this.inspectionTime === 3) {
          AudioSynth.playInspectionAlert();
        }
        if (this.inspectionTime <= 7 && this.timerState === "INSPECTION") {
          this.setTimerStateClass("inspection-warning");
        }
      } else if (this.inspectionTime === 0) {
        // Detik 15: Penalti +2 WCA
        this.pendingPenalty = "+2";
        if (this.timerState === "INSPECTION") {
          this.elements.timerDigits.textContent = "+2";
          this.elements.timerStatus.textContent = "15s OVER (+2 PENALTY APPLIED)";
        }
        AudioSynth.playInspectionAlert();
      } else if (this.inspectionTime <= -2) {
        // Melewati 17 detik: DNF WCA
        clearInterval(this.inspectionInterval);
        this.inspectionInterval = null;
        this.elements.timerDigits.textContent = "DNF";
        this.elements.timerStatus.textContent = "INSPECTION EXCEEDED (>17s DNF)";
        this.timerState = "IDLE";
        this.elements.appLayout.classList.remove("focus-active");
      }
    }, 1000);
  },

  startSolveTimer() {
    clearInterval(this.inspectionInterval);
    this.inspectionInterval = null;

    this.timerState = "RUNNING";
    this.setTimerStateClass("running");
    this.elements.timerStatus.textContent = "SOLVING... PRESS ANY KEY TO STOP";

    this.timerStartTime = performance.now();
    this.timerInterval = setInterval(() => {
      const elapsed = (performance.now() - this.timerStartTime) / 1000;
      this.elements.timerDigits.textContent = TimeUtils.formatTimerDigits(elapsed);
    }, 10);
  },

  stopSolveTimer() {
    clearInterval(this.timerInterval);
    const elapsed = (performance.now() - this.timerStartTime) / 1000;
    this.timerState = "STOPPED";
    this.setTimerStateClass("stopped");
    this.elements.appLayout.classList.remove("focus-active");

    AudioSynth.playStop();

    const formatted = TimeUtils.formatTimerDigits(elapsed);
    this.elements.timerDigits.textContent = formatted;
    this.elements.timerStatus.textContent = `SOLVE COMPLETED: ${formatted}`;

    AppStore.addSolve(elapsed, AppStore.state.currentScramble, "", "", "", this.pendingPenalty);
    this.pendingPenalty = "none";

    const solves = AppStore.getActiveSolves();
    this.elements.lastSolveLabel.textContent = `Last solve (#${solves.length}):`;
    this.elements.timerQuickActions.style.display = "flex";
    this.elements.quickTagPopover.style.display = "none";
  },

  setTimerStateClass(state) {
    this.elements.heroTimer.className = `hero-timer state-${state}`;
  },

  // --- Header & Mode Events ---
  bindHeaderEvents() {
    this.elements.sessionSelect.addEventListener("change", (e) => AppStore.switchSession(e.target.value));

    this.elements.btnNewSession.addEventListener("click", () => {
      const name = prompt("Enter new session name (e.g. 'Session 2: OH' or 'F2L Drill'):");
      if (name && name.trim()) AppStore.createSession(name.trim());
    });

    this.elements.btnRenameSession.addEventListener("click", () => {
      const s = AppStore.state.sessions[AppStore.state.activeSessionId];
      if (!s) return;
      const newName = prompt("Rename session:", s.name);
      if (newName && newName.trim()) AppStore.renameSession(s.id, newName.trim());
    });

    this.elements.btnResetSession.addEventListener("click", () => {
      const s = AppStore.state.sessions[AppStore.state.activeSessionId];
      if (confirm(`Reset all solves in "${s.name}"?`)) AppStore.resetActiveSession();
    });

    this.elements.btnSoundToggle.addEventListener("click", () => AppStore.toggleSound());

    this.elements.tabTimerMode.addEventListener("click", () => {
      this.elements.tabTimerMode.classList.add("active");
      this.elements.tabInputMode.classList.remove("active");
      this.elements.timerSection.style.display = "flex";
      this.elements.inputSection.style.display = "none";
    });

    this.elements.tabInputMode.addEventListener("click", () => {
      this.elements.tabInputMode.classList.add("active");
      this.elements.tabTimerMode.classList.remove("active");
      this.elements.timerSection.style.display = "none";
      this.elements.inputSection.style.display = "block";
      this.elements.fastInputTime.focus();
    });

    // Scramble buttons
    this.elements.btnNextScramble.addEventListener("click", () => AppStore.nextScramble());
    this.elements.btnToggle2D.addEventListener("click", () => AppStore.toggle2DView());
    this.elements.btnCopyScramble.addEventListener("click", () => {
      navigator.clipboard.writeText(AppStore.state.currentScramble).then(() => {
        this.elements.copyBtnText.textContent = "Copied!";
        setTimeout(() => { this.elements.copyBtnText.textContent = "Copy"; }, 1500);
      });
    });

    // Inspection Toggle Checkbox
    this.elements.toggleInspection.addEventListener("change", (e) => {
      // Abort any ongoing inspection timer if unchecking
      clearInterval(this.inspectionInterval);
      this.inspectionInterval = null;
      this.timerState = "IDLE";
      this.setTimerStateClass("idle");
      this.elements.appLayout.classList.remove("focus-active");

      AppStore.toggleInspectionSetting(e.target.checked);
    });

    // Export / Import
    this.elements.btnExportJson.addEventListener("click", () => this.exportJson());
    this.elements.btnExportCsv.addEventListener("click", () => this.exportCsv());
    this.elements.fileImport.addEventListener("change", (e) => this.handleImportFile(e));
  },

  // --- Filter Events ---
  bindFilterEvents() {
    const updateFilters = () => {
      AppStore.setFilter({
        dateFrom: this.elements.filterDateFrom.value,
        dateTo: this.elements.filterDateTo.value,
        solveFrom: this.elements.filterSolveFrom.value ? parseInt(this.elements.filterSolveFrom.value, 10) : null,
        solveTo: this.elements.filterSolveTo.value ? parseInt(this.elements.filterSolveTo.value, 10) : null,
        status: this.elements.filterStatusSelect.value,
        sortOrder: this.elements.filterSortOrder.value,
        searchQuery: this.elements.tableFilter.value.trim()
      });
    };

    [
      this.elements.filterDateFrom,
      this.elements.filterDateTo,
      this.elements.filterSolveFrom,
      this.elements.filterSolveTo,
      this.elements.filterStatusSelect,
      this.elements.filterSortOrder
    ].forEach(el => {
      el.addEventListener("change", updateFilters);
      el.addEventListener("input", updateFilters);
    });
    this.elements.tableFilter.addEventListener("input", updateFilters);

    // Presets
    document.querySelectorAll(".preset-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const preset = btn.dataset.preset;
        const todayStr = TimeUtils.getCurrentDateStr();

        if (preset === "all") {
          AppStore.setFilter({ dateFrom: "", dateTo: "" });
        } else if (preset === "today") {
          AppStore.setFilter({ dateFrom: todayStr, dateTo: todayStr });
        } else if (preset === "last7") {
          const d = new Date();
          d.setDate(d.getDate() - 7);
          AppStore.setFilter({ dateFrom: d.toISOString().split("T")[0], dateTo: todayStr });
        }
      });
    });

    this.elements.btnResetFilter.addEventListener("click", () => {
      document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
      document.querySelector('.preset-btn[data-preset="all"]').classList.add("active");
      AppStore.resetFilters();
    });

    // Chart toggle checkboxes
    [
      this.elements.toggleSingle,
      this.elements.toggleAo5,
      this.elements.toggleAo12,
      this.elements.toggleTrend
    ].forEach(t => t.addEventListener("change", () => this.renderChart()));
  },

  // --- Input Events ---
  bindInputEvents() {
    this.elements.fastInputDate.value = TimeUtils.getCurrentDateStr();
    this.elements.fastInputClock.value = TimeUtils.getCurrentClockStr().slice(0, 5);

    this.elements.fastInputTime.addEventListener("input", () => {
      const sec = TimeUtils.parseSmartTime(this.elements.fastInputTime.value);
      this.elements.inputFormatPreview.textContent = sec ? TimeUtils.formatTimerDigits(sec) : "--:--.--";
    });

    let selectedInputTag = "";
    document.querySelectorAll(".tag-chips .tag-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        document.querySelectorAll(".tag-chips .tag-chip").forEach(c => c.classList.remove("selected"));
        selectedInputTag = chip.dataset.tag;
        chip.classList.add("selected");
      });
    });

    this.elements.formFastInput.addEventListener("submit", (e) => {
      e.preventDefault();
      const raw = this.elements.fastInputTime.value.trim();
      const sec = TimeUtils.parseSmartTime(raw);

      if (sec === null || isNaN(sec) || sec <= 0) {
        alert("Please enter a valid solve time! (e.g. 12862 for 01:28.62, or 88.62)");
        this.elements.fastInputTime.focus();
        return;
      }

      let notes = this.elements.fastInputNotes.value.trim();
      if (selectedInputTag) notes = selectedInputTag + (notes ? ` - ${notes}` : "");

      const clock = this.elements.fastInputClock.value ? `${this.elements.fastInputClock.value}:00` : "";
      AppStore.addSolve(sec, AppStore.state.currentScramble, notes, this.elements.fastInputDate.value, clock);

      // Reset
      this.elements.fastInputTime.value = "";
      this.elements.fastInputNotes.value = "";
      this.elements.inputFormatPreview.textContent = "--:--.--";
      selectedInputTag = "";
      document.querySelectorAll(".tag-chips .tag-chip").forEach(c => c.classList.remove("selected"));
      this.elements.fastInputTime.focus();
    });

    // Quick Tag Popover for Timer
    this.elements.btnLastTag.addEventListener("click", () => {
      const isVis = this.elements.quickTagPopover.style.display === "flex";
      this.elements.quickTagPopover.style.display = isVis ? "none" : "flex";
      if (!isVis) {
        this.elements.quickTagInput.value = "";
        this.elements.quickTagInput.focus();
      }
    });

    this.elements.btnCloseTagPopover.addEventListener("click", () => {
      this.elements.quickTagPopover.style.display = "none";
    });

    document.querySelectorAll(".tag-quick-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        AppStore.tagLastSolve(btn.dataset.tag);
        this.elements.quickTagPopover.style.display = "none";
      });
    });

    const saveCustomTag = () => {
      const val = this.elements.quickTagInput.value.trim();
      if (val) {
        AppStore.tagLastSolve(val);
        this.elements.quickTagPopover.style.display = "none";
      }
    };

    this.elements.btnSaveQuickTag.addEventListener("click", saveCustomTag);
    this.elements.quickTagInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); saveCustomTag(); }
    });

    // Last solve quick actions
    this.elements.btnLastPlus2.addEventListener("click", () => {
      const solves = AppStore.getActiveSolves();
      if (solves.length > 0) AppStore.togglePenalty(solves.length - 1, "+2");
    });

    this.elements.btnLastDnf.addEventListener("click", () => {
      const solves = AppStore.getActiveSolves();
      if (solves.length > 0) AppStore.togglePenalty(solves.length - 1, "dnf");
    });

    this.elements.btnLastDelete.addEventListener("click", () => {
      const solves = AppStore.getActiveSolves();
      if (solves.length > 0) {
        AppStore.deleteSolve(solves.length - 1);
        this.elements.timerQuickActions.style.display = "none";
        this.elements.quickTagPopover.style.display = "none";
      }
    });
  },

  bindModalEvents() {
    this.elements.btnModalClose.addEventListener("click", () => {
      this.elements.detailModal.style.display = "none";
    });
    window.addEventListener("click", (e) => {
      if (e.target === this.elements.detailModal) this.elements.detailModal.style.display = "none";
    });
  },

  bindKeyboardShortcuts() {
    window.addEventListener("keydown", (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") return;

      if (e.altKey && e.code === "KeyN") {
        e.preventDefault();
        AppStore.nextScramble();
      }
      if (e.altKey && e.code === "Digit2") {
        e.preventDefault();
        const s = AppStore.getActiveSolves();
        if (s.length > 0) AppStore.togglePenalty(s.length - 1, "+2");
      }
      if (e.altKey && e.code === "KeyD") {
        e.preventDefault();
        const s = AppStore.getActiveSolves();
        if (s.length > 0) AppStore.togglePenalty(s.length - 1, "dnf");
      }
      if (e.altKey && e.code === "KeyT") {
        e.preventDefault();
        this.elements.btnLastTag.click();
      }
      if (e.key === "Escape") {
        this.elements.detailModal.style.display = "none";
        this.elements.quickTagPopover.style.display = "none";
      }
    });
  },

  openSolveModal(index) {
    const solves = AppStore.getActiveSolves();
    const solve = solves[index];
    if (!solve) return;

    this.elements.modalTitle.textContent = `Solve #${index + 1} Breakdown`;
    this.elements.modalTime.textContent = `${TimeUtils.formatTimerDigits(StatsEngine.getEffectiveTime(solve))} (${solve.seconds.toFixed(2)}s)`;
    this.elements.modalTimestamp.textContent = `${solve.date || "Today"} at ${solve.time || "No time recorded"}`;
    this.elements.modalScramble.textContent = solve.scramble || "No scramble recorded";
    this.elements.modalNote.textContent = solve.notes || "No notes / tags";

    const times = solves.map(StatsEngine.getEffectiveTime);
    if (index >= 4) {
      const avg = StatsEngine.calculateWcaAverage(times.slice(index - 4, index + 1));
      this.elements.modalAo5.textContent = avg === Infinity ? "DNF" : TimeUtils.formatTimerDigits(avg);
    } else {
      this.elements.modalAo5.textContent = "Requires at least 5 solves";
    }

    this.elements.detailModal.style.display = "flex";
  },

  togglePenalty(idx, type) {
    AppStore.togglePenalty(idx, type);
  },

  deleteSolve(idx) {
    const solves = AppStore.getActiveSolves();
    if (confirm(`Delete solve #${idx + 1} (${TimeUtils.formatTimerDigits(solves[idx].seconds)})?`)) {
      AppStore.deleteSolve(idx);
    }
  },

  exportJson() {
    const s = AppStore.state.sessions[AppStore.state.activeSessionId];
    const blob = new Blob([JSON.stringify(s, null, 2)], { type: "application/json" });
    this.downloadBlob(blob, `cubestudio_${AppStore.state.activeSessionId}_${TimeUtils.getCurrentDateStr()}.json`);
  },

  exportCsv() {
    const solves = AppStore.getActiveSolves();
    let csv = "Solve,Time,RawSeconds,Penalty,EffectiveSeconds,Date,ClockTime,Notes,Scramble\n";
    solves.forEach((s, i) => {
      const eff = StatsEngine.getEffectiveTime(s);
      const effStr = eff === Infinity ? "DNF" : eff.toFixed(2);
      const notes = (s.notes || "").replace(/"/g, '""');
      const scramble = (s.scramble || "").replace(/"/g, '""');
      csv += `${i + 1},"${s.raw}",${s.seconds},"${s.penalty}","${effStr}","${s.date || ""}","${s.time || ""}","${notes}","${scramble}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    this.downloadBlob(blob, `cubestudio_${AppStore.state.activeSessionId}_${TimeUtils.getCurrentDateStr()}.csv`);
  },

  handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target.result;
      try {
        if (file.name.endsWith(".json")) {
          const parsed = JSON.parse(content);
          const solves = parsed.solves || (Array.isArray(parsed) ? parsed : null);
          if (solves) {
            AppStore.state.sessions[AppStore.state.activeSessionId].solves = solves;
            AppStore.notify();
            alert(`Successfully imported ${solves.length} solves!`);
          }
        } else if (file.name.endsWith(".csv")) {
          const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
          const imported = [];
          const start = lines[0].toLowerCase().includes("seconds") || lines[0].toLowerCase().includes("time") ? 1 : 0;
          for (let i = start; i < lines.length; i++) {
            const cols = lines[i].split(",");
            if (cols.length >= 3) {
              const raw = cols[1].replace(/"/g, "").trim();
              const sec = parseFloat(cols[2]) || TimeUtils.parseSmartTime(raw);
              if (sec && !isNaN(sec)) {
                imported.push({
                  id: imported.length + 1,
                  raw: raw,
                  seconds: sec,
                  penalty: cols[3] ? cols[3].replace(/"/g, "").trim() : "none",
                  date: cols[5] ? cols[5].replace(/"/g, "").trim() : "",
                  time: cols[6] ? cols[6].replace(/"/g, "").trim() : "",
                  notes: cols[7] ? cols[7].replace(/"/g, "").trim() : "",
                  scramble: cols[8] ? cols.slice(8).join(",").replace(/"/g, "").trim() : ""
                });
              }
            }
          }
          if (imported.length > 0) {
            AppStore.state.sessions[AppStore.state.activeSessionId].solves = imported;
            AppStore.notify();
            alert(`Successfully imported ${imported.length} solves from CSV!`);
          }
        }
      } catch (err) {
        alert("Error importing file: " + err.message);
      }
      this.elements.fileImport.value = "";
    };
    reader.readAsText(file);
  },

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
};

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Global accessor
window.UIManager = UIManager;

// Boot
document.addEventListener("DOMContentLoaded", () => {
  AppStore.init();
  UIManager.init();
});
