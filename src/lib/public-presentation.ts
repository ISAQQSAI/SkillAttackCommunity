import type { Locale } from "@/lib/i18n";

function humanizeIdentifier(value: string) {
  return value
    .split(/[-_]+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

export function parseSkillPresentation(skillId: string) {
  const [ordinalMaybe, ownerMaybe, ...rest] = String(skillId || "").split("_");
  const hasOrdinal = /^\d+$/.test(ordinalMaybe || "");
  const owner = hasOrdinal ? ownerMaybe || "unknown" : ordinalMaybe || "unknown";
  const name = hasOrdinal
    ? rest.join("_") || skillId
    : [ownerMaybe, ...rest].filter(Boolean).join("_") || skillId;

  const ownerLabel = humanizeIdentifier(owner);
  const skillLabel = humanizeIdentifier(name) || skillId;

  return {
    ordinal: hasOrdinal ? ordinalMaybe : null,
    ownerLabel,
    skillLabel,
    targetLabel:
      ownerLabel && ownerLabel !== "Unknown" && ownerLabel !== skillLabel
        ? `${ownerLabel} ${skillLabel}`
        : skillLabel,
  };
}

function humanizeStatus(value: string) {
  return value
    .split(/[_-]+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

export function formatVerdictLabel(locale: Locale, verdict?: string | null) {
  switch (String(verdict || "").trim()) {
    case "attack_success":
      return locale === "zh" ? "已验证攻击成功" : "Verified exploit";
    case "success":
      return locale === "zh" ? "攻击成功" : "Attack success";
    case "technical":
      return locale === "zh" ? "技术问题" : "Technical";
    case "ignored":
      return locale === "zh" ? "未复现成功" : "Not reproduced";
    case "ignore":
      return locale === "zh" ? "已忽略" : "Ignored";
    case "":
      return locale === "zh" ? "待补充" : "Pending";
    default:
      return humanizeStatus(String(verdict || ""));
  }
}

export function formatSubmissionStatusLabel(locale: Locale, status?: string | null) {
  switch (String(status || "").trim()) {
    case "submitted":
      return locale === "zh" ? "已提交审核" : "Submitted for review";
    case "under_review":
      return locale === "zh" ? "审核中" : "In review";
    case "rejected":
      return locale === "zh" ? "未通过审核" : "Not approved";
    case "published":
      return locale === "zh" ? "已公开发布" : "Published";
    default:
      return humanizeStatus(String(status || ""));
  }
}

export function getFriendlyHiddenSectionLabel(locale: Locale, value: string) {
  const labels: Record<string, { zh: string; en: string }> = {
    "agent_trajectory.trajectory": {
      zh: "完整 agent 轨迹",
      en: "full agent trajectory",
    },
    "agent_trajectory.tool_calls": {
      zh: "工具调用原文",
      en: "raw tool calls",
    },
    "judge.evidence_map": {
      zh: "原始证据映射",
      en: "raw evidence map",
    },
    "judge.path_delta": {
      zh: "路径差异原文",
      en: "raw path diff",
    },
    "skill.skill_zip": {
      zh: "skill 压缩包",
      en: "skill archive",
    },
  };

  const matched = labels[value];
  if (matched) {
    return locale === "zh" ? matched.zh : matched.en;
  }

  return value;
}
