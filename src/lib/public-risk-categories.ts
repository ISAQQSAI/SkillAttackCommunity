import type { Locale } from "@/lib/i18n";

function normalizeRiskText(value: string) {
  return value.trim().toLowerCase();
}

export interface PublicRiskCategory {
  slug: string;
  label: {
    zh: string;
    en: string;
  };
  matchers: string[];
}

export const PUBLIC_RISK_CATEGORIES: PublicRiskCategory[] = [
  {
    slug: "data-exfiltration",
    label: {
      zh: "数据窃取",
      en: "Data Exfiltration",
    },
    matchers: [
      "data exfiltration",
      "exfiltration",
      "data leakage",
      "credential theft",
      "unauthorized data transfer",
    ],
  },
  {
    slug: "data-destruction",
    label: {
      zh: "数据破坏",
      en: "Data Destruction",
    },
    matchers: ["data destruction", "destructive action", "wiper", "data deletion", "data corruption"],
  },
  {
    slug: "dos",
    label: {
      zh: "拒绝服务",
      en: "DoS",
    },
    matchers: ["dos (denial of service)", "denial of service", "dos", "resource exhaustion"],
  },
  {
    slug: "malware-ransomware",
    label: {
      zh: "恶意软件 / 勒索软件",
      en: "Malware / Ransomware",
    },
    matchers: ["malware / ransomware", "ransomware", "malware"],
  },
  {
    slug: "phishing",
    label: {
      zh: "钓鱼",
      en: "Phishing",
    },
    matchers: ["phishing"],
  },
  {
    slug: "backdoors",
    label: {
      zh: "后门",
      en: "Backdoors",
    },
    matchers: [
      "backdoor",
      "backdoors",
      "persistent unauthorized access",
      "hidden persistent access",
      "covert persistence",
    ],
  },
  {
    slug: "bias-manipulation",
    label: {
      zh: "偏见 / 操控",
      en: "Bias / Manipulation",
    },
    matchers: [
      "bias",
      "manipulation",
      "model manipulation",
      "agent manipulation",
      "misleading output",
      "output steering",
    ],
  },
  {
    slug: "poisoning",
    label: {
      zh: "投毒",
      en: "Poisoning",
    },
    matchers: [
      "poisoning",
      "data poisoning",
      "knowledge poisoning",
      "knowledge base corruption",
      "corrupted knowledge base",
    ],
  },
];

export function getPublicRiskCategory(slug: string | null | undefined) {
  const normalized = normalizeRiskText(String(slug ?? ""));
  return PUBLIC_RISK_CATEGORIES.find((item) => item.slug === normalized) || null;
}

export function getPublicRiskCategoryLabel(category: PublicRiskCategory, locale: Locale) {
  return locale === "zh" ? category.label.zh : category.label.en;
}

export function matchPublicRiskCategory(riskType: string, categorySlug: string | null | undefined) {
  const category = getPublicRiskCategory(categorySlug);
  if (!category) {
    return false;
  }

  const normalizedRiskType = normalizeRiskText(riskType);
  return category.matchers.some((matcher) => normalizedRiskType.includes(normalizeRiskText(matcher)));
}

export function findPublicRiskCategoryByRiskType(riskType: string) {
  const normalizedRiskType = normalizeRiskText(riskType);
  return (
    PUBLIC_RISK_CATEGORIES.find((category) =>
      category.matchers.some((matcher) => normalizedRiskType.includes(normalizeRiskText(matcher)))
    ) || null
  );
}
