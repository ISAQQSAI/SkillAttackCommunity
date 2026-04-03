import AdmZip from "adm-zip";
import { cache } from "react";
import { promises as fs } from "node:fs";
import path from "node:path";

import { matchPublicRiskCategory } from "@/lib/public-risk-categories";
import { parseSkillPresentation } from "@/lib/public-presentation";

const PUBLIC_DATASET_DIR = path.join(process.cwd(), "multi_model_test");

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function compactText(value: unknown) {
  return normalizeText(value).replace(/\s+/g, " ").trim();
}

function readObject(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function readList(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function uniqueSorted(values: Iterable<string>) {
  return Array.from(new Set(Array.from(values).filter(Boolean))).sort((left, right) =>
    left.localeCompare(right)
  );
}

function excerpt(value: unknown, length = 180) {
  const text = compactText(value);
  if (!text) {
    return "";
  }
  return text.length > length ? `${text.slice(0, Math.max(0, length - 1)).trimEnd()}…` : text;
}

function stripWrappedQuotes(value: string) {
  const trimmed = String(value || "").trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function parseFrontmatterDescription(markdown: string) {
  const match = String(markdown || "").match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) {
    return "";
  }

  const descriptionLine = match[1]
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.toLowerCase().startsWith("description:"));

  if (!descriptionLine) {
    return "";
  }

  return compactText(stripWrappedQuotes(descriptionLine.replace(/^description:\s*/i, "")));
}

function summarizeValue(value: unknown, length = 320) {
  if (value == null) {
    return "";
  }

  if (typeof value === "string") {
    return excerpt(value, length);
  }

  try {
    return excerpt(JSON.stringify(value), length);
  } catch {
    return excerpt(String(value), length);
  }
}

function millis(value: Date | string | null | undefined) {
  if (!value) {
    return 0;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function parseRoundNumber(fileName: string) {
  const match = fileName.match(/^round_(\d+)\.json$/i);
  return match ? Number.parseInt(match[1], 10) : null;
}

function parseSurfaceOrdinal(surfaceId: string) {
  const match = String(surfaceId || "").match(/^surface_(\d+)/i);
  if (!match) {
    return null;
  }
  return String(Number.parseInt(match[1], 10));
}

function normalizeResult(value: unknown) {
  switch (compactText(value).toLowerCase()) {
    case "success":
    case "attack_success":
      return "success";
    case "ignore":
    case "ignored":
      return "ignore";
    case "technical":
      return "technical";
    default:
      return compactText(value).toLowerCase() || "unknown";
  }
}

function extractModelNames(roundRecord: Record<string, unknown>) {
  const payload = JSON.stringify(roundRecord);
  const models = new Set<string>();

  for (const match of payload.matchAll(/\bprovider=([^\s"\\]+)\s+model=([^\s"\\]+)/gi)) {
    const model = compactText(match[2]);
    if (model && model !== "unknown") {
      models.add(model);
    }
  }

  for (const match of payload.matchAll(/\\"model\\"\s*:\s*\\"([^\\"]+)\\"/gi)) {
    const model = compactText(match[1]);
    if (model && model !== "unknown") {
      models.add(model);
    }
  }

  return uniqueSorted(models);
}

function createSurfaceSlug(skillId: string, surfaceId: string, sourceScope?: string | null) {
  const normalizedScope = compactText(sourceScope);
  return normalizedScope ? `${skillId}__${normalizedScope}__${surfaceId}` : `${skillId}__${surfaceId}`;
}

function sortSurfaceOrdinals(left?: string | null, right?: string | null) {
  const leftNumber = toNumber(left) ?? Number.MAX_SAFE_INTEGER;
  const rightNumber = toNumber(right) ?? Number.MAX_SAFE_INTEGER;
  return leftNumber - rightNumber;
}

function deriveUpdatedAt(roundRecord: Record<string, unknown>, fallbackMs: number) {
  let latestTimestamp = 0;

  for (const item of readList(readObject(roundRecord.simulation).steps)) {
    const step = readObject(item);
    const timestamp = toNumber(step.timestamp) ?? 0;
    if (timestamp > latestTimestamp) {
      latestTimestamp = timestamp;
    }
  }

  if (latestTimestamp > 0) {
    return new Date(latestTimestamp);
  }

  return fallbackMs > 0 ? new Date(fallbackMs) : null;
}

async function readJsonFile(filePath: string) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as unknown;
}

async function directoryExists(targetPath: string) {
  try {
    const stat = await fs.stat(targetPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function hasFile(targetPath: string) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readSkillMarkdownDescription(skillPath: string, skillId: string) {
  const extractedCandidates = [
    path.join(skillPath, "SKILL.md"),
    path.join(skillPath, "skill.md"),
    path.join(skillPath, skillId, "SKILL.md"),
    path.join(skillPath, skillId, "skill.md"),
  ];

  for (const candidatePath of extractedCandidates) {
    if (!(await hasFile(candidatePath))) {
      continue;
    }

    try {
      const content = await fs.readFile(candidatePath, "utf8");
      const description = parseFrontmatterDescription(content);
      if (description) {
        return description;
      }
    } catch {
      // Ignore and continue to the next candidate.
    }
  }

  const zipPath = path.join(skillPath, "skill_source.zip");
  if (!(await hasFile(zipPath))) {
    return "";
  }

  try {
    const zip = new AdmZip(zipPath);
    const skillEntry = zip
      .getEntries()
      .find((entry) => /(^|\/)skill\.md$/i.test(entry.entryName));

    if (!skillEntry) {
      return "";
    }

    const content = skillEntry.getData().toString("utf-8");
    return parseFrontmatterDescription(content);
  } catch {
    return "";
  }
}

async function isSkillDatasetDirectory(targetPath: string) {
  if (!(await directoryExists(targetPath))) {
    return false;
  }

  const dirName = path.basename(targetPath);
  const entries = await fs.readdir(targetPath, { withFileTypes: true });
  const hasSurfaceDirs = entries.some(
    (entry) => entry.isDirectory() && entry.name.startsWith("surface_")
  );

  if (hasSurfaceDirs) {
    return true;
  }

  return hasFile(path.join(targetPath, `${dirName}_global_report.json`));
}

async function resolvePublicSkillSources() {
  if (!(await directoryExists(PUBLIC_DATASET_DIR))) {
    return [] as Array<{ skillId: string; skillPath: string; sourceScope: string | null }>;
  }

  if (await isSkillDatasetDirectory(PUBLIC_DATASET_DIR)) {
    const rootName = path.basename(PUBLIC_DATASET_DIR);
    return [{ skillId: rootName, skillPath: PUBLIC_DATASET_DIR, sourceScope: null }];
  }

  const rootEntries = await fs.readdir(PUBLIC_DATASET_DIR, { withFileTypes: true });
  const sources: Array<{ skillId: string; skillPath: string; sourceScope: string | null }> = [];

  for (const entry of rootEntries) {
    if (!entry.isDirectory() || entry.name.startsWith("_")) {
      continue;
    }

    const entryPath = path.join(PUBLIC_DATASET_DIR, entry.name);
    if (await isSkillDatasetDirectory(entryPath)) {
      sources.push({
        skillId: entry.name,
        skillPath: entryPath,
        sourceScope: null,
      });
      continue;
    }

    const nestedEntries = await fs.readdir(entryPath, { withFileTypes: true });
    for (const nestedEntry of nestedEntries) {
      if (!nestedEntry.isDirectory() || nestedEntry.name.startsWith("_")) {
        continue;
      }

      const nestedPath = path.join(entryPath, nestedEntry.name);
      if (await isSkillDatasetDirectory(nestedPath)) {
        sources.push({
          skillId: nestedEntry.name,
          skillPath: nestedPath,
          sourceScope: entry.name,
        });
      }
    }
  }

  return sources.sort((left, right) => {
    return (
      compactText(left.sourceScope).localeCompare(compactText(right.sourceScope)) ||
      left.skillId.localeCompare(right.skillId) ||
      left.skillPath.localeCompare(right.skillPath)
    );
  });
}

export interface PublicSimulationStep {
  id: string;
  stepIndex: number;
  type: string;
  tool: string;
  content: string;
  isError: boolean;
  timestamp: Date | null;
}

export interface PublicSurfaceRound {
  id: string;
  roundId: number;
  phase: string;
  attackPrompt: string;
  result: string;
  reason: string;
  riskType: string;
  successCondition: string;
  strategy: string;
  surfaceTitle: string;
  surfaceLevel: string;
  actionableSuggestion: string;
  simulationSteps: PublicSimulationStep[];
  updatedAt: Date | null;
}

export interface PublicVulnerabilitySummary {
  id: string;
  slug: string;
  skillId: string;
  skillLabel: string;
  ownerLabel: string;
  ordinal: string | null;
  skillDisplayName: string;
  surfaceId: string;
  surfaceOrdinal: string | null;
  surfaceTitle: string;
  surfaceLevel: string;
  result: string;
  riskType: string;
  roundCount: number;
  updatedAt: Date | null;
  attackPrompt: string;
  latestAttackPrompt: string;
  finalReason: string;
  finalRoundId: number | null;
  agentModel: string;
  models: string[];
}

export interface PublicSurfaceDetail extends PublicVulnerabilitySummary {
  rounds: PublicSurfaceRound[];
}

export interface PublicSkillSummary {
  slug: string;
  skillId: string;
  skillLabel: string;
  ownerLabel: string;
  ordinal: string | null;
  skillDisplayName: string;
  surfaceCount: number;
  roundCount: number;
  successCount: number;
  ignoreCount: number;
  technicalCount: number;
  riskTypes: string[];
  surfaceLevels: string[];
  agentModels: string[];
  modelCount: number;
  skillDescription: string;
  representativeSummary: string;
  latestUpdatedAt: Date | null;
}

export interface PublicSkillDetail extends PublicSkillSummary {
  surfaces: PublicVulnerabilitySummary[];
}

export interface PublicSkillLibrarySummary {
  uniqueSkillCount: number;
  surfaceCount: number;
  roundCount: number;
  modelCount: number;
  successCount: number;
  ignoreCount: number;
  technicalCount: number;
  riskTypeCount: number;
  levelCount: number;
}

export interface PublicVulnerabilityLibrarySummary {
  uniqueSkillCount: number;
  surfaceCount: number;
  roundCount: number;
  modelCount: number;
  successCount: number;
  ignoreCount: number;
  technicalCount: number;
  riskTypeCount: number;
  levelCount: number;
}

const loadPublicSurfaceLibrary = cache(async () => {
  const skillEntries = await resolvePublicSkillSources();
  const surfaces: PublicSurfaceDetail[] = [];

  for (const skillEntry of skillEntries) {
    const skillId = skillEntry.skillId;
    const skillPath = skillEntry.skillPath;
    const presentation = parseSkillPresentation(skillId);
    const sourceScope = skillEntry.sourceScope;
    let agentModel = "";

    try {
      const modelConfig = readObject(await readJsonFile(path.join(skillPath, "model.json")));
      agentModel = normalizeText(readObject(modelConfig.simulator).model) || normalizeText(sourceScope);
    } catch {
      agentModel = normalizeText(sourceScope);
    }

    let globalReport: Record<string, unknown> = {};
    try {
      globalReport = readObject(
        await readJsonFile(path.join(skillPath, `${skillId}_global_report.json`))
      );
    } catch {
      globalReport = {};
    }

    const surfaceSummary = readObject(globalReport.surface_summary);
    const surfaceEntries = await fs.readdir(skillPath, { withFileTypes: true });

    for (const surfaceEntry of surfaceEntries) {
      if (!surfaceEntry.isDirectory() || !surfaceEntry.name.startsWith("surface_")) {
        continue;
      }

      const surfaceId = surfaceEntry.name;
      const surfacePath = path.join(skillPath, surfaceId);
      const roundEntries = (await fs.readdir(surfacePath, { withFileTypes: true }))
        .filter((entry) => entry.isFile() && /^round_\d+\.json$/i.test(entry.name))
        .sort((left, right) => (parseRoundNumber(left.name) ?? 0) - (parseRoundNumber(right.name) ?? 0));

      if (!roundEntries.length) {
        continue;
      }

      const rounds: PublicSurfaceRound[] = [];
      const models = new Set<string>();

      for (const roundEntry of roundEntries) {
        const roundPath = path.join(surfacePath, roundEntry.name);
        const stat = await fs.stat(roundPath);
        const roundRecord = readObject(await readJsonFile(roundPath));
        const attack = readObject(roundRecord.attack);
        const judge = readObject(roundRecord.judge);
        const metadata = readObject(attack.metadata);
        const target = readObject(attack.target);
        const roundId =
          toNumber(roundRecord.round_id) ??
          toNumber(metadata.round_id) ??
          parseRoundNumber(roundEntry.name) ??
          rounds.length + 1;
        const simulationSteps = readList(readObject(roundRecord.simulation).steps).map((item, index) => {
          const step = readObject(item);
          const timestamp = toNumber(step.timestamp);
          const type = normalizeText(step.type);

          let content = normalizeText(step.text) || normalizeText(step.result_text);
          if (!content && type === "tool_call") {
            content = summarizeValue(step.arguments);
          }

          return {
            id: `${surfaceId}-round-${roundId}-step-${toNumber(step.step_index) ?? index + 1}`,
            stepIndex: toNumber(step.step_index) ?? index + 1,
            type,
            tool: normalizeText(step.tool),
            content,
            isError: Boolean(step.is_error),
            timestamp: timestamp ? new Date(timestamp) : null,
          };
        });

        for (const model of extractModelNames(roundRecord)) {
          models.add(model);
        }

        rounds.push({
          id: `${surfaceId}-round-${roundId}`,
          roundId,
          phase: normalizeText(metadata.phase),
          attackPrompt: normalizeText(attack.attack_prompt),
          result: normalizeResult(judge.result),
          reason: normalizeText(judge.reason),
          riskType: normalizeText(target.risk_type),
          successCondition: normalizeText(target.success_condition),
          strategy: normalizeText(metadata.strategy),
          surfaceTitle: normalizeText(metadata.surface_title),
          surfaceLevel: normalizeText(metadata.surface_level),
          actionableSuggestion: normalizeText(judge.actionable_suggestion),
          simulationSteps,
          updatedAt: deriveUpdatedAt(roundRecord, stat.mtimeMs),
        });
      }

      const firstRound = rounds[0];
      const lastRound = rounds[rounds.length - 1];
      const finalSurfaceSummary = readObject(surfaceSummary[surfaceId]);
      const slug = createSurfaceSlug(skillId, surfaceId, sourceScope || agentModel);

      surfaces.push({
        id: slug,
        slug,
        skillId,
        skillLabel: presentation.skillLabel,
        ownerLabel: presentation.ownerLabel,
        ordinal: presentation.ordinal,
        skillDisplayName: presentation.targetLabel,
        surfaceId,
        surfaceOrdinal: parseSurfaceOrdinal(surfaceId),
        surfaceTitle:
          firstRound.surfaceTitle ||
          lastRound.surfaceTitle ||
          surfaceId.replace(/^surface_\d+_?/, "").trim() ||
          surfaceId,
        surfaceLevel: firstRound.surfaceLevel || lastRound.surfaceLevel || "-",
        result: normalizeResult(finalSurfaceSummary.status || lastRound.result),
        riskType: normalizeText(finalSurfaceSummary.final_risk_type) || firstRound.riskType || lastRound.riskType || "-",
        roundCount: toNumber(finalSurfaceSummary.rounds) ?? rounds.length,
        updatedAt: lastRound.updatedAt,
        attackPrompt: firstRound.attackPrompt,
        latestAttackPrompt: lastRound.attackPrompt,
        finalReason: lastRound.reason,
        finalRoundId: lastRound.roundId,
        agentModel,
        models: uniqueSorted(models),
        rounds,
      });
    }
  }

  return surfaces.sort((left, right) => {
    return (
      millis(right.updatedAt) - millis(left.updatedAt) ||
      left.skillId.localeCompare(right.skillId) ||
      sortSurfaceOrdinals(left.surfaceOrdinal, right.surfaceOrdinal) ||
      left.surfaceId.localeCompare(right.surfaceId) ||
      left.agentModel.localeCompare(right.agentModel) ||
      left.slug.localeCompare(right.slug)
    );
  });
});

const loadPublicSkillLibrary = cache(async () => {
  const surfaces = await loadPublicSurfaceLibrary();
  const skillSources = await resolvePublicSkillSources();
  const skills = new Map<string, PublicSkillDetail>();

  for (const surface of surfaces) {
    const existing =
      skills.get(surface.skillId) ||
      {
        slug: surface.skillId,
        skillId: surface.skillId,
        skillLabel: surface.skillLabel,
        ownerLabel: surface.ownerLabel,
        ordinal: surface.ordinal,
        skillDisplayName: surface.skillDisplayName,
        surfaceCount: 0,
        roundCount: 0,
        successCount: 0,
        ignoreCount: 0,
        technicalCount: 0,
        riskTypes: [],
        surfaceLevels: [],
        agentModels: [],
        modelCount: 0,
        skillDescription: "",
        representativeSummary: "",
        latestUpdatedAt: null,
        surfaces: [],
      };

    if (!skills.has(surface.skillId)) {
      skills.set(surface.skillId, existing);
    }

    existing.surfaces.push(surface);
    existing.surfaceCount += 1;
    existing.roundCount += surface.roundCount;
    existing.riskTypes.push(surface.riskType);
    existing.surfaceLevels.push(surface.surfaceLevel);
    if (surface.agentModel) {
      existing.agentModels.push(surface.agentModel);
    } else {
      existing.agentModels.push(...surface.models);
    }

    if (surface.result === "success") {
      existing.successCount += 1;
    } else if (surface.result === "technical") {
      existing.technicalCount += 1;
    } else if (surface.result === "ignore") {
      existing.ignoreCount += 1;
    }

    if (!existing.representativeSummary) {
      existing.representativeSummary =
        excerpt(surface.attackPrompt, 200) || excerpt(surface.finalReason, 200);
    }

    if (!existing.latestUpdatedAt || millis(surface.updatedAt) > millis(existing.latestUpdatedAt)) {
      existing.latestUpdatedAt = surface.updatedAt;
    }
  }

  const hydratedSkills = await Promise.all(
    Array.from(skills.values()).map(async (skill) => {
      const matchedSource = skillSources.find((source) => source.skillId === skill.skillId);
      const skillPath = matchedSource?.skillPath || "";
      const skillDescription = skillPath
        ? await readSkillMarkdownDescription(skillPath, skill.skillId)
        : "";
      const agentModels = uniqueSorted(skill.agentModels);

      return {
        ...skill,
        riskTypes: uniqueSorted(skill.riskTypes),
        surfaceLevels: uniqueSorted(skill.surfaceLevels),
        agentModels,
        modelCount: agentModels.length,
        skillDescription: skillDescription || skill.representativeSummary,
        surfaces: [...skill.surfaces].sort((left, right) => {
          return (
            sortSurfaceOrdinals(left.surfaceOrdinal, right.surfaceOrdinal) ||
            millis(right.updatedAt) - millis(left.updatedAt) ||
            left.surfaceId.localeCompare(right.surfaceId)
          );
        }),
      };
    })
  );

  return hydratedSkills.sort((left, right) => {
    return (
      millis(right.latestUpdatedAt) - millis(left.latestUpdatedAt) ||
      right.surfaceCount - left.surfaceCount ||
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
        skill.skillDisplayName,
        skill.skillDescription,
        skill.representativeSummary,
        ...skill.riskTypes,
        ...skill.surfaceLevels,
        ...skill.surfaces.map((item) => item.surfaceTitle),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);

    const matchesVuln =
      !vuln ||
      skill.riskTypes.some((item) => item.toLowerCase().includes(vuln)) ||
      skill.surfaces.some((item) => item.surfaceTitle.toLowerCase().includes(vuln));

    return matchesQuery && matchesVuln;
  });

  return typeof filters.limit === "number" ? filtered.slice(0, filters.limit) : filtered;
}

export async function getPublicSkillById(skillId: string) {
  const skills = await loadPublicSkillLibrary();
  return skills.find((skill) => skill.skillId === skillId) || null;
}

export async function getPublicSkillLibrarySummary(): Promise<PublicSkillLibrarySummary> {
  const surfaces = await loadPublicSurfaceLibrary();
  const skillSet = new Set<string>();
  const riskTypeSet = new Set<string>();
  const levelSet = new Set<string>();
  const modelSet = new Set<string>();

  let roundCount = 0;
  let successCount = 0;
  let ignoreCount = 0;
  let technicalCount = 0;

  for (const surface of surfaces) {
    skillSet.add(surface.skillId);
    if (surface.riskType) {
      riskTypeSet.add(surface.riskType);
    }
    if (surface.surfaceLevel) {
      levelSet.add(surface.surfaceLevel);
    }
    if (surface.agentModel) {
      modelSet.add(surface.agentModel);
    } else {
      for (const model of surface.models) {
        modelSet.add(model);
      }
    }

    roundCount += surface.roundCount;
    if (surface.result === "success") {
      successCount += 1;
    } else if (surface.result === "technical") {
      technicalCount += 1;
    } else if (surface.result === "ignore") {
      ignoreCount += 1;
    }
  }

  return {
    uniqueSkillCount: skillSet.size,
    surfaceCount: surfaces.length,
    roundCount,
    modelCount: modelSet.size,
    successCount,
    ignoreCount,
    technicalCount,
    riskTypeCount: riskTypeSet.size,
    levelCount: levelSet.size,
  };
}

export async function listPublicVulnerabilities(filters: {
  q?: string;
  risk?: string;
  skill?: string;
  level?: string;
  result?: string;
  limit?: number;
} = {}) {
  const q = compactText(filters.q).toLowerCase();
  const riskFilter = compactText(filters.risk).toLowerCase();
  const skillFilter = compactText(filters.skill).toLowerCase();
  const levelFilter = compactText(filters.level).toLowerCase();
  const resultFilter = compactText(filters.result).toLowerCase();
  const surfaces = await loadPublicSurfaceLibrary();

  const filtered = surfaces.filter((item) => {
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
      item.surfaceLevel.toLowerCase().includes(levelFilter) ||
      item.riskType.toLowerCase().includes(levelFilter);

    const matchesRisk =
      !riskFilter ||
      matchPublicRiskCategory(item.riskType, riskFilter) ||
      item.riskType.toLowerCase().includes(riskFilter);

    const matchesResult = !resultFilter || item.result.toLowerCase().includes(resultFilter);

    return matchesQuery && matchesSkill && matchesLevel && matchesRisk && matchesResult;
  });

  return typeof filters.limit === "number" ? filtered.slice(0, filters.limit) : filtered;
}

export async function getPublicSurfaceBySlug(slug: string) {
  const surfaces = await loadPublicSurfaceLibrary();
  return surfaces.find((surface) => surface.slug === slug) || null;
}

export async function getPublicVulnerabilityLibrarySummary(): Promise<PublicVulnerabilityLibrarySummary> {
  const summary = await getPublicSkillLibrarySummary();

  return {
    uniqueSkillCount: summary.uniqueSkillCount,
    surfaceCount: summary.surfaceCount,
    roundCount: summary.roundCount,
    modelCount: summary.modelCount,
    successCount: summary.successCount,
    ignoreCount: summary.ignoreCount,
    technicalCount: summary.technicalCount,
    riskTypeCount: summary.riskTypeCount,
    levelCount: summary.levelCount,
  };
}
