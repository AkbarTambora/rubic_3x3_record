/**
 * Pure Speedcubing Time Parsing & Formatting Utilities
 */

export const TimeUtils = {
  /**
   * Formats seconds (e.g. 88.62) into "MM:SS.ms" (e.g. "01:28.62")
   */
  formatTimerDigits(seconds: number | null | undefined): string {
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
  parseSmartTime(inputStr: string): number | null {
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

  getCurrentDateStr(): string {
    return new Date().toISOString().split("T")[0];
  },

  getCurrentClockStr(): string {
    return new Date().toTimeString().slice(0, 8);
  }
};
