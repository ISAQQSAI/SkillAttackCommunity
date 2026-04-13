import type { Locale } from "@/lib/i18n";
import { compactDisplayText } from "@/lib/prompt-display";

const UNKNOWN_SURFACE_LEVELS = new Set([
  "-",
  "n/a",
  "na",
  "none",
  "null",
  "unknown",
  "unrated",
  "未知",
  "未分级",
  "不适用",
]);

export function formatSurfaceLevelLabel(locale: Locale, value?: string | null) {
  const normalized = compactDisplayText(value || "").toLowerCase();

  if (!normalized || UNKNOWN_SURFACE_LEVELS.has(normalized)) {
    return "-";
  }

  if (normalized.includes("critical") || normalized.includes("严重")) {
    return locale === "zh" ? "严重" : "Critical";
  }

  if (normalized.includes("high") || normalized.includes("高")) {
    return locale === "zh" ? "高" : "High";
  }

  if (normalized.includes("medium") || normalized.includes("中")) {
    return locale === "zh" ? "中" : "Medium";
  }

  if (normalized.includes("low") || normalized.includes("低")) {
    return locale === "zh" ? "低" : "Low";
  }

  return compactDisplayText(value || "") || "-";
}
