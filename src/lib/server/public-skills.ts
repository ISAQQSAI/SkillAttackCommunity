import { cache } from "react";

import { prisma } from "@/lib/server/prisma";

function compactText(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function readObject(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function readList(value: unknown) {
  return Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];
}

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function humanizeIdentifier(value: string) {
  return value
    .split(/[-_]+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function parseSkillParts(skillId: string) {
  const [ordinalMaybe, ownerMaybe, ...rest] = skillId.split("_");
  const hasOrdinal = /^\d+$/.test(ordinalMaybe || "");
  const owner = hasOrdinal ? ownerMaybe || "unknown" : ordinalMaybe || "unknown";
  const name = hasOrdinal
    ? rest.join("_") || skillId
    : [ownerMaybe, ...rest].filter(Boolean).join("_") || skillId;

  return {
    ordinal: hasOrdinal ? ordinalMaybe : null,
    ownerLabel: humanizeIdentifier(owner),
    nameLabel: humanizeIdentifier(name),
  };
}

function uniqueSorted(values: Iterable<string>) {
  return Array.from(new Set(Array.from(values).filter(Boolean))).sort((left, right) =>
    left.localeCompare(right)
  );
}

function frequencyFirst(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values.filter(Boolean)) {
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([value]) => value);
}

function excerpt(value: unknown, length = 220) {
  const text = compactText(value);
  if (!text) {
    return "";
  }
  return text.length > length ? `${text.slice(0, length - 1).trimEnd()}...` : text;
}

function millis(value: Date | string | null | undefined) {
  if (!value) {
    return 0;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

export interface PublicSkillCaseFinding {
  findingKey: string;
  harmType: string;
  vulnerabilitySurface: string;
  verdict: string;
  confidence: number | null;
  provider: string;
  model: string;
  evidenceSummaryPreview: string;
  harmfulPromptPreview: string;
  smokingGunPreview: string;
  finalResponsePreview: string;
}

export interface PublicSkillCaseSummary {
  slug: string;
  title: string;
  summary: string;
  publishedAt: Date | null;
  verificationSummary: string;
  sourceLink: string;
  findingCount: number;
  successCount: number;
  models: string[];
  harmTypes: string[];
  findings: PublicSkillCaseFinding[];
}

export interface PublicSkillSummary {
  slug: string;
  skillId: string;
  skillLabel: string;
  ownerLabel: string;
  ordinal: string | null;
  sourceLink: string;
  caseCount: number;
  findingCount: number;
  successCount: number;
  modelCount: number;
  models: string[];
  harmTypes: string[];
  surfaceLabels: string[];
  primaryHarmType: string;
  primarySurfaceLabel: string;
  representativeSummary: string;
  latestPublishedAt: Date | null;
  representativeCase: Pick<PublicSkillCaseSummary, "slug" | "title" | "summary" | "publishedAt"> | null;
}

export interface PublicSkillDetail extends PublicSkillSummary {
  cases: PublicSkillCaseSummary[];
}

export interface PublicSkillLibrarySummary {
  uniqueSkillCount: number;
  caseCount: number;
  findingCount: number;
  modelCount: number;
  harmTypeCount: number;
  surfaceCount: number;
}

interface MutablePublicSkill {
  skillId: string;
  skillLabel: string;
  ownerLabel: string;
  ordinal: string | null;
  sourceLink: string;
  cases: PublicSkillCaseSummary[];
  harmTypeHistory: string[];
  surfaceHistory: string[];
  modelHistory: string[];
  findingCount: number;
  successCount: number;
  representativeSummary: string;
  latestPublishedAt: Date | null;
  representativeCase: Pick<PublicSkillCaseSummary, "slug" | "title" | "summary" | "publishedAt"> | null;
}

const loadPublicSkillLibrary = cache(async () => {
  const cases = await prisma.publicCase.findMany({
    orderBy: { publishedAt: "desc" },
    select: {
      slug: true,
      title: true,
      summary: true,
      publishedAt: true,
      payload: true,
    },
  });

  const skills = new Map<string, MutablePublicSkill>();

  for (const item of cases) {
    const payload = readObject(item.payload);
    const findings = readList(payload.findings);
    const reports = readList(payload.reports);
    const verificationSummary = compactText(payload.verificationSummary);

    const sourceLinkBySkill = new Map<string, string>();
    for (const report of reports) {
      const skillId = compactText(report.skillId);
      const sourceLink = compactText(report.sourceLink);
      if (skillId && sourceLink && !sourceLinkBySkill.has(skillId)) {
        sourceLinkBySkill.set(skillId, sourceLink);
      }
    }

    const findingsBySkill = new Map<string, PublicSkillCaseFinding[]>();

    for (const finding of findings) {
      const skillId = compactText(finding.reportSkillId || finding.skillId);
      if (!skillId) {
        continue;
      }

      const existing = findingsBySkill.get(skillId) || [];

      const findingSummary: PublicSkillCaseFinding = {
        findingKey: compactText(finding.findingKey) || `${item.slug}-${skillId}-${existing.length + 1}`,
        harmType: compactText(finding.harmType) || "-",
        vulnerabilitySurface: compactText(finding.vulnerabilitySurface) || "-",
        verdict: compactText(finding.verdict) || "-",
        confidence: toNumber(finding.confidence),
        provider: compactText(finding.provider),
        model: compactText(finding.model),
        evidenceSummaryPreview: compactText(finding.evidenceSummaryPreview),
        harmfulPromptPreview: compactText(finding.harmfulPromptPreview),
        smokingGunPreview: compactText(finding.smokingGunPreview),
        finalResponsePreview: compactText(finding.finalResponsePreview),
      };

      existing.push(findingSummary);
      findingsBySkill.set(skillId, existing);
    }

    for (const [skillId, skillFindings] of findingsBySkill) {
      const parts = parseSkillParts(skillId);
      const existing =
        skills.get(skillId) ||
        ({
          skillId,
          skillLabel: parts.nameLabel || skillId,
          ownerLabel: parts.ownerLabel,
          ordinal: parts.ordinal,
          sourceLink: "",
          cases: [],
          harmTypeHistory: [],
          surfaceHistory: [],
          modelHistory: [],
          findingCount: 0,
          successCount: 0,
          representativeSummary: "",
          latestPublishedAt: null,
          representativeCase: null,
        } satisfies MutablePublicSkill);

      if (!skills.has(skillId)) {
        skills.set(skillId, existing);
      }

      if (!existing.sourceLink) {
        existing.sourceLink = sourceLinkBySkill.get(skillId) || "";
      }

      const models = uniqueSorted(skillFindings.map((finding) => finding.model).filter(Boolean));
      const harmTypes = uniqueSorted(skillFindings.map((finding) => finding.harmType).filter(Boolean));
      const successCount = skillFindings.filter((finding) => finding.verdict === "attack_success").length;

      const caseSummary: PublicSkillCaseSummary = {
        slug: item.slug,
        title: item.title,
        summary: item.summary,
        publishedAt: item.publishedAt,
        verificationSummary,
        sourceLink: sourceLinkBySkill.get(skillId) || existing.sourceLink,
        findingCount: skillFindings.length,
        successCount,
        models,
        harmTypes,
        findings: skillFindings,
      };

      existing.cases.push(caseSummary);
      existing.findingCount += skillFindings.length;
      existing.successCount += successCount;
      existing.harmTypeHistory.push(...harmTypes);
      existing.surfaceHistory.push(
        ...skillFindings.map((finding) => finding.vulnerabilitySurface).filter(Boolean)
      );
      existing.modelHistory.push(...models);

      if (!existing.representativeSummary) {
        existing.representativeSummary =
          excerpt(item.summary, 180) ||
          excerpt(skillFindings[0]?.evidenceSummaryPreview, 180) ||
          excerpt(skillFindings[0]?.smokingGunPreview, 180);
      }

      if (!existing.representativeCase) {
        existing.representativeCase = {
          slug: item.slug,
          title: item.title,
          summary: item.summary,
          publishedAt: item.publishedAt,
        };
      }

      if (!existing.latestPublishedAt || millis(item.publishedAt) > millis(existing.latestPublishedAt)) {
        existing.latestPublishedAt = item.publishedAt;
      }
    }
  }

  return Array.from(skills.values())
    .map((skill) => {
      const harmTypes = uniqueSorted(skill.harmTypeHistory);
      const surfaceLabels = uniqueSorted(skill.surfaceHistory);
      const models = uniqueSorted(skill.modelHistory);
      const cases = [...skill.cases].sort(
        (left, right) => millis(right.publishedAt) - millis(left.publishedAt)
      );

      return {
        slug: skill.skillId,
        skillId: skill.skillId,
        skillLabel: skill.skillLabel,
        ownerLabel: skill.ownerLabel,
        ordinal: skill.ordinal,
        sourceLink: skill.sourceLink,
        caseCount: cases.length,
        findingCount: skill.findingCount,
        successCount: skill.successCount,
        modelCount: models.length,
        models,
        harmTypes,
        surfaceLabels,
        primaryHarmType: frequencyFirst(skill.harmTypeHistory)[0] || "-",
        primarySurfaceLabel: frequencyFirst(skill.surfaceHistory)[0] || "-",
        representativeSummary: skill.representativeSummary,
        latestPublishedAt: skill.latestPublishedAt,
        representativeCase: skill.representativeCase,
        cases,
      } satisfies PublicSkillDetail;
    })
    .sort((left, right) => {
      return (
        millis(right.latestPublishedAt) - millis(left.latestPublishedAt) ||
        right.caseCount - left.caseCount ||
        left.skillId.localeCompare(right.skillId)
      );
    });
});

export async function listPublicSkills(filters: {
  q?: string;
  vuln?: string;
  limit?: number;
} = {}) {
  const q = compactText(filters.q).toLowerCase();
  const vuln = compactText(filters.vuln).toLowerCase();
  const skills = await loadPublicSkillLibrary();

  const filtered = skills.filter((skill) => {
    const matchesQuery =
      !q ||
      [
        skill.skillId,
        skill.skillLabel,
        skill.ownerLabel,
        skill.sourceLink,
        skill.representativeSummary,
        ...skill.harmTypes,
        ...skill.models,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);

    const matchesVuln =
      !vuln ||
      skill.harmTypes.some((item) => item.toLowerCase().includes(vuln)) ||
      skill.primaryHarmType.toLowerCase().includes(vuln);

    return matchesQuery && matchesVuln;
  });

  return typeof filters.limit === "number" ? filtered.slice(0, filters.limit) : filtered;
}

export async function getPublicSkillById(skillId: string) {
  const skills = await loadPublicSkillLibrary();
  return skills.find((skill) => skill.skillId === skillId) || null;
}

export async function getPublicSkillLibrarySummary(): Promise<PublicSkillLibrarySummary> {
  const skills = await loadPublicSkillLibrary();
  const modelSet = new Set<string>();
  const harmTypeSet = new Set<string>();
  const surfaceSet = new Set<string>();

  let caseCount = 0;
  let findingCount = 0;

  for (const skill of skills) {
    caseCount += skill.caseCount;
    findingCount += skill.findingCount;
    for (const model of skill.models) {
      modelSet.add(model);
    }
    for (const harmType of skill.harmTypes) {
      harmTypeSet.add(harmType);
    }
    for (const surface of skill.surfaceLabels) {
      surfaceSet.add(surface);
    }
  }

  return {
    uniqueSkillCount: skills.length,
    caseCount,
    findingCount,
    modelCount: modelSet.size,
    harmTypeCount: harmTypeSet.size,
    surfaceCount: surfaceSet.size,
  };
}
