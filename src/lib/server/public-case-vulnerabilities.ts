import { unstable_cache } from "next/cache";

import {
  findPublicRiskCategoryByRiskType,
  matchPublicRiskCategory,
  PUBLIC_RISK_CATEGORIES,
} from "@/lib/public-risk-categories";
import { readJsonList, readJsonRecord } from "@/lib/public-case-routing";
import { parseSkillPresentation } from "@/lib/public-presentation";
import {
  listPublicCaseListingRecords,
  listPublicCases,
  PUBLIC_CASE_LISTING_CACHE_TAG,
} from "@/lib/server/report-submissions";
import type { PublicVulnerabilitySummary } from "@/lib/server/public-skills";

function compactText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeResult(value: unknown) {
  switch (compactText(value).toLowerCase()) {
    case "attack_success":
    case "success":
      return "success";
    case "technical":
      return "technical";
    case "ignored":
    case "ignore":
      return "ignore";
    default:
      return "ignore";
  }
}

export function normalizePublicCaseResultFilter(value: unknown) {
  switch (compactText(value).toLowerCase()) {
    case "attack_success":
    case "success":
      return "success";
    case "technical":
      return "technical";
    case "ignored":
    case "ignore":
      return "ignore";
    default:
      return undefined;
  }
}

function levelRank(level: string) {
  const normalized = level.toLowerCase();

  if (normalized.includes("critical") || normalized.includes("high") || normalized.includes("高")) {
    return 0;
  }

  if (normalized.includes("medium") || normalized.includes("中")) {
    return 1;
  }

  if (normalized.includes("low") || normalized.includes("低")) {
    return 2;
  }

  return 3;
}

function isFilterableLevel(level: string) {
  return levelRank(level) < 3;
}

type PublicCases = Awaited<ReturnType<typeof listPublicCases>>;
type PublicCaseListingRecords = Awaited<ReturnType<typeof listPublicCaseListingRecords>>;
const RESULT_OPTIONS = ["success", "technical", "ignore"] as const;

export type PublicCaseListingItem = PublicVulnerabilitySummary;

export interface PublicCaseListingSummary {
  uniqueSkillCount: number;
  surfaceCount: number;
  roundCount: number;
  modelCount: number;
  successCount: number;
  technicalCount: number;
  ignoreCount: number;
}

export interface PublicCaseListingSnapshot {
  items: PublicCaseListingItem[];
  summary: PublicCaseListingSummary;
}

function toPositiveInteger(value: unknown) {
  const parsed =
    typeof value === "number"
      ? value
      : Number.parseInt(compactText(value), 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function resolveFindingRoundCount(
  finding: Record<string, unknown>,
  dbFinding?: { judgeSummary?: unknown } | null
) {
  const payloadJudgeSummary = readJsonRecord(finding.judgeSummary);
  const dbJudgeSummary = readJsonRecord(dbFinding?.judgeSummary);

  return (
    toPositiveInteger(dbJudgeSummary.rounds) ||
    toPositiveInteger(payloadJudgeSummary.rounds) ||
    toPositiveInteger(finding.roundCount) ||
    (Array.isArray(finding.trajectoryTimeline) && finding.trajectoryTimeline.length ? 1 : 0)
  );
}

function resolveListingFindingRoundCount(judgeSummary: unknown) {
  return toPositiveInteger(readJsonRecord(judgeSummary).rounds) || 0;
}

function resultRank(result: string) {
  switch (compactText(result).toLowerCase()) {
    case "success":
    case "attack_success":
      return 0;
    case "technical":
      return 1;
    case "ignore":
    case "ignored":
      return 2;
    default:
      return 3;
  }
}

export function normalizePublicCaseLevelFilter(
  value: unknown,
  levels: Iterable<string>
) {
  const normalized = compactText(value).toLowerCase();

  if (!normalized) {
    return undefined;
  }

  for (const level of levels) {
    const candidate = compactText(level);

    if (isFilterableLevel(candidate) && candidate.toLowerCase() === normalized) {
      return candidate;
    }
  }

  return undefined;
}

export function createPublicCaseVulnerabilityItems(cases: PublicCases): PublicVulnerabilitySummary[] {
  return cases.flatMap((item) => {
    const payload = readJsonRecord(item.payload);
    const findings = readJsonList(payload.findings).map((entry) => readJsonRecord(entry));
    const dbFindings = item.submission?.parsedBundle?.findings || [];

    return findings.map((finding, index) => {
      const skillId = compactText(finding.reportSkillId);
      const presentation = parseSkillPresentation(skillId);
      const agentModel = compactText(finding.model);
      const surfaceId = compactText(finding.findingKey) || String(index + 1);
      const dbFinding =
        dbFindings.find((entry) => {
          return (
            compactText(entry.findingKey) === surfaceId &&
            compactText(entry.reportSkillId) === skillId &&
            compactText(entry.model) === agentModel
          );
        }) ||
        dbFindings.find((entry) => {
          return (
            compactText(entry.findingKey) === surfaceId &&
            compactText(entry.reportSkillId) === skillId
          );
        }) ||
        dbFindings.find((entry) => compactText(entry.findingKey) === surfaceId);
      const surfaceTitle =
        compactText(finding.vulnerabilitySurface) || compactText(finding.harmType) || item.title;
      const stableItemId = [
        item.slug,
        surfaceId,
        agentModel || "unknown-model",
        String(index + 1),
      ].join(":");

      return {
        id: stableItemId,
        slug: item.slug,
        skillId,
        skillLabel: presentation.skillLabel,
        ownerLabel: presentation.ownerLabel,
        ordinal: presentation.ordinal,
        skillDisplayName: presentation.targetLabel,
        surfaceId,
        surfaceOrdinal: presentation.ordinal || String(index + 1),
        surfaceTitle,
        surfaceLevel: compactText(finding.reasonCode) || "-",
        result: normalizeResult(finding.verdict),
        riskType: compactText(finding.harmType) || "-",
        roundCount: resolveFindingRoundCount(finding, dbFinding),
        updatedAt: item.publishedAt,
        attackPrompt: compactText(finding.harmfulPromptPreview),
        latestAttackPrompt: compactText(finding.harmfulPromptPreview),
        finalReason:
          compactText(finding.evidenceSummaryPreview) ||
          compactText(finding.finalResponsePreview) ||
          compactText(item.summary),
        finalRoundId: null,
        agentModel: agentModel || "-",
        models: agentModel ? [agentModel] : [],
      };
    });
  });
}

function createPublicCaseListingItems(
  records: PublicCaseListingRecords
): PublicCaseListingItem[] {
  return records.flatMap((item) => {
    const findings = item.submission?.parsedBundle?.findings || [];

    return findings.map((finding, index) => {
      const skillId = compactText(finding.reportSkillId);
      const presentation = parseSkillPresentation(skillId);
      const agentModel = compactText(finding.model);
      const surfaceId = compactText(finding.findingKey) || String(index + 1);
      const surfaceTitle =
        compactText(finding.vulnerabilitySurface) || compactText(finding.harmType) || item.title;
      const stableItemId = [
        item.slug,
        surfaceId,
        agentModel || "unknown-model",
        String(index + 1),
      ].join(":");

      return {
        id: stableItemId,
        slug: item.slug,
        skillId,
        skillLabel: presentation.skillLabel,
        ownerLabel: presentation.ownerLabel,
        ordinal: presentation.ordinal,
        skillDisplayName: presentation.targetLabel,
        surfaceId,
        surfaceOrdinal: presentation.ordinal || String(index + 1),
        surfaceTitle,
        surfaceLevel: compactText(finding.reasonCode) || "-",
        result: normalizeResult(finding.verdict),
        riskType: compactText(finding.harmType) || "-",
        roundCount: resolveListingFindingRoundCount(finding.judgeSummary),
        updatedAt: item.publishedAt,
        attackPrompt: compactText(finding.harmfulPromptPreview),
        latestAttackPrompt: compactText(finding.harmfulPromptPreview),
        finalReason:
          compactText(finding.evidenceSummaryPreview) ||
          compactText(finding.finalResponsePreview) ||
          compactText(item.summary),
        finalRoundId: null,
        agentModel: agentModel || "-",
        models: agentModel ? [agentModel] : [],
      };
    });
  });
}

export function filterPublicCaseVulnerabilityItems(
  items: PublicVulnerabilitySummary[],
  filters: {
    q?: string;
    risk?: string;
    skill?: string;
    level?: string;
    result?: string;
  } = {}
) {
  const q = compactText(filters.q).toLowerCase();
  const riskFilter = compactText(filters.risk).toLowerCase();
  const skillFilter = compactText(filters.skill).toLowerCase();
  const levelFilter = compactText(filters.level).toLowerCase();
  const resultFilter = normalizePublicCaseResultFilter(filters.result);

  return items.filter((item) => {
    const matchesQuery =
      !q ||
      [
        item.skillId,
        item.skillLabel,
        item.ownerLabel,
        item.skillDisplayName,
        item.surfaceId,
        item.surfaceTitle,
        item.attackPrompt,
        item.latestAttackPrompt,
        item.finalReason,
        item.riskType,
        item.agentModel,
        ...item.models,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);

    const matchesSkill =
      !skillFilter ||
      [item.skillId, item.skillLabel, item.ownerLabel, item.skillDisplayName]
        .join(" ")
        .toLowerCase()
        .includes(skillFilter);

    const matchesLevel =
      !levelFilter ||
      item.surfaceLevel.toLowerCase() === levelFilter;

    const matchesRisk =
      !riskFilter ||
      matchPublicRiskCategory(item.riskType, riskFilter) ||
      item.riskType.toLowerCase().includes(riskFilter);

    const matchesResult = !resultFilter || item.result === resultFilter;

    return matchesQuery && matchesSkill && matchesLevel && matchesRisk && matchesResult;
  });
}

export function buildPublicCaseVulnerabilitySummary(
  items: PublicVulnerabilitySummary[]
): PublicCaseListingSummary {
  const uniqueSkillCount = new Set(items.map((item) => item.skillId).filter(Boolean)).size;
  const modelCount = new Set(
    items.flatMap((item) => item.models).map((item) => compactText(item)).filter(Boolean)
  ).size;
  const roundCount = items.reduce((total, item) => total + item.roundCount, 0);

  let successCount = 0;
  let technicalCount = 0;
  let ignoreCount = 0;

  for (const item of items) {
    if (item.result === "success") {
      successCount += 1;
    } else if (item.result === "technical") {
      technicalCount += 1;
    } else if (item.result === "ignore") {
      ignoreCount += 1;
    }
  }

  return {
    uniqueSkillCount,
    surfaceCount: items.length,
    roundCount,
    modelCount,
    successCount,
    technicalCount,
    ignoreCount,
  };
}

export const getPublicCaseListingSnapshot = unstable_cache(
  async (): Promise<PublicCaseListingSnapshot> => {
    const items = createPublicCaseListingItems(await listPublicCaseListingRecords());

    return {
      items,
      summary: buildPublicCaseVulnerabilitySummary(items),
    };
  },
  [PUBLIC_CASE_LISTING_CACHE_TAG],
  {
    tags: [PUBLIC_CASE_LISTING_CACHE_TAG],
  }
);

export function buildPublicCaseFilterState(
  items: PublicVulnerabilitySummary[],
  filters: {
    q?: string;
    risk?: string;
    skill?: string;
    level?: string;
    result?: string;
  } = {}
) {
  const filteredItems = filterPublicCaseVulnerabilityItems(items, filters);
  const riskScopedItems = filterPublicCaseVulnerabilityItems(items, {
    ...filters,
    risk: undefined,
  });
  const resultScopedItems = filterPublicCaseVulnerabilityItems(items, {
    ...filters,
    result: undefined,
  });
  const levelScopedItems = filterPublicCaseVulnerabilityItems(items, {
    ...filters,
    level: undefined,
  });
  const filterableLevelItems = levelScopedItems.filter((item) => isFilterableLevel(item.surfaceLevel));

  const riskCounts = new Map(PUBLIC_RISK_CATEGORIES.map((category) => [category.slug, 0]));
  const resultCounts = new Map(RESULT_OPTIONS.map((value) => [value, 0]));
  const levelCounts = new Map<string, number>();

  for (const item of riskScopedItems) {
    const category = findPublicRiskCategoryByRiskType(item.riskType);
    if (!category) {
      continue;
    }

    riskCounts.set(category.slug, (riskCounts.get(category.slug) ?? 0) + 1);
  }

  for (const item of resultScopedItems) {
    if (resultCounts.has(item.result as (typeof RESULT_OPTIONS)[number])) {
      resultCounts.set(
        item.result as (typeof RESULT_OPTIONS)[number],
        (resultCounts.get(item.result as (typeof RESULT_OPTIONS)[number]) ?? 0) + 1
      );
    }
  }

  for (const item of filterableLevelItems) {
    levelCounts.set(item.surfaceLevel, (levelCounts.get(item.surfaceLevel) ?? 0) + 1);
  }

  return {
    filteredItems,
    totalCount: filteredItems.length,
    allRiskCount: riskScopedItems.length,
    allResultCount: resultScopedItems.length,
    allLevelCount: filterableLevelItems.length,
    riskCounts,
    resultCounts,
    levelCounts,
    levelOptions: sortPublicCaseLevelOptions(Array.from(levelCounts.keys())),
  };
}

export function sortPublicCaseLevelOptions(levels: string[]) {
  return [...new Set(levels.filter(Boolean))].sort((left, right) => {
    return levelRank(left) - levelRank(right) || left.localeCompare(right);
  });
}

export function sortPublicCaseVulnerabilitiesBySurfaceOrdinal<
  T extends { surfaceOrdinal: string | null; surfaceId: string; agentModel?: string }
>(items: T[]) {
  return [...items].sort((left, right) => {
    const leftNumber = Number.parseInt(left.surfaceOrdinal || "", 10);
    const rightNumber = Number.parseInt(right.surfaceOrdinal || "", 10);
    const normalizedLeft = Number.isFinite(leftNumber) ? leftNumber : Number.MAX_SAFE_INTEGER;
    const normalizedRight = Number.isFinite(rightNumber) ? rightNumber : Number.MAX_SAFE_INTEGER;

    return (
      normalizedLeft - normalizedRight ||
      left.surfaceId.localeCompare(right.surfaceId) ||
      (left.agentModel || "").localeCompare(right.agentModel || "")
    );
  });
}

export function sortPublicCaseVulnerabilitiesForListing<
  T extends {
    result: string;
    surfaceOrdinal: string | null;
    surfaceId: string;
    agentModel?: string;
  }
>(items: T[]) {
  return [...items].sort((left, right) => {
    const leftNumber = Number.parseInt(left.surfaceOrdinal || "", 10);
    const rightNumber = Number.parseInt(right.surfaceOrdinal || "", 10);
    const normalizedLeft = Number.isFinite(leftNumber) ? leftNumber : Number.MAX_SAFE_INTEGER;
    const normalizedRight = Number.isFinite(rightNumber) ? rightNumber : Number.MAX_SAFE_INTEGER;

    return (
      resultRank(left.result) - resultRank(right.result) ||
      normalizedLeft - normalizedRight ||
      left.surfaceId.localeCompare(right.surfaceId) ||
      (left.agentModel || "").localeCompare(right.agentModel || "")
    );
  });
}
