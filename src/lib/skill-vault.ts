import { promises as fs } from "fs";
import path from "path";
import { cache } from "react";

import type { Locale } from "@/lib/i18n";

const DATA_ROOT = path.join(process.cwd(), "tmpreport_hot100_real");
const MANIFEST_PATH = path.join(DATA_ROOT, "manifest.json");

type SkillVaultVerdict = "attack_success" | "ignored" | "technical" | string;

interface LocalizedText {
  en: string;
  zh: string;
}

interface SkillVaultManifest {
  kept_skill_count?: number;
  kept_report_count?: number;
  kept_skills?: string[];
}

interface RawSkillSection {
  skill_id?: string;
  skill_hash?: string;
  source_link?: string;
}

interface RawJudgeSection {
  verdict?: string;
  confidence?: number;
  smoking_gun?: string[] | string;
  reason_code?: string;
}

interface RawExecutionObservations {
  model?: string;
  provider?: string;
  evidence_summary?: string;
  observed_path?: string;
  observed_paths?: string[];
}

interface RawPredictedStep {
  tool?: string | null;
}

interface RawFindingOtherInfo {
  predicted_trajectory?: RawPredictedStep[];
}

interface RawAgentTrajectory {
  final_response?: string;
  execution_observations?: RawExecutionObservations;
}

interface RawFinding {
  finding_id?: string;
  harmful_prompt?: string;
  harm_type?: string;
  vulnerability_surface?: string;
  judge?: RawJudgeSection;
  agent_trajectory?: RawAgentTrajectory;
  other_info?: RawFindingOtherInfo;
}

interface RawReportOtherInfo {
  generated_at?: string;
  finding_count?: number;
}

interface RawSkillVaultReport {
  skill?: RawSkillSection;
  findings?: RawFinding[];
  other_info?: RawReportOtherInfo;
}

interface SkillParts {
  ordinal: string | null;
  owner: string;
  ownerLabel: string;
  name: string;
  nameLabel: string;
}

export interface SkillVaultReportEntry {
  id: string;
  fileName: string;
  reportUrl: string;
  model: string;
  provider: string;
  runId: string;
  lane: number | null;
  round: number | null;
  verdict: SkillVaultVerdict;
  confidence: number | null;
  harmType: string;
  vulnerabilitySurface: string;
  reasonCode: string;
  evidenceSummary: string;
  smokingGun: string[];
  smokingGunExcerpt: string;
  harmfulPromptExcerpt: string;
  finalResponseExcerpt: string;
  observedPaths: string[];
  predictedTools: string[];
  generatedAt: string;
}

interface InternalSkillVaultReportEntry extends SkillVaultReportEntry {
  reportPath: string;
}

export interface SkillVaultRecord {
  slug: string;
  skillId: string;
  skillLabel: string;
  ordinal: string | null;
  owner: string;
  ownerLabel: string;
  skillName: string;
  sourceLink: string;
  skillHash: string;
  skillArchiveUrl?: string;
  reportCount: number;
  successCount: number;
  modelCount: number;
  models: string[];
  harmTypes: string[];
  surfaceLabels: string[];
  primaryHarmType: string;
  primarySurfaceLabel: string;
  representativeReport: SkillVaultReportEntry | null;
  representativeSummary: string;
  reports: SkillVaultReportEntry[];
}

interface InternalSkillVaultRecord extends Omit<SkillVaultRecord, "representativeReport" | "reports"> {
  skillArchivePath?: string;
  representativeReport: InternalSkillVaultReportEntry | null;
  reports: InternalSkillVaultReportEntry[];
}

export interface SkillVaultSummary {
  uniqueSkillCount: number;
  modelCount: number;
  totalRuns: number;
  caseEntryCount: number;
  datasetCount: number;
  reportCount: number;
  harmTypeCount: number;
  surfaceCount: number;
}

interface SkillVaultFilters {
  q?: string;
  vuln?: string;
}

function pick(locale: Locale, text: LocalizedText) {
  return text[locale];
}

function compactText(value: string | undefined | null) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function excerpt(value: string | undefined | null, length = 220) {
  const text = compactText(value);
  if (!text) {
    return "";
  }
  return text.length > length ? `${text.slice(0, length - 1).trimEnd()}...` : text;
}

function parseLaneRound(value: string) {
  const match = /lane(\d+)-r(\d+)/i.exec(value);
  return {
    lane: match ? Number(match[1]) : null,
    round: match ? Number(match[2]) : null,
  };
}

function humanizeIdentifier(value: string) {
  return value
    .split(/[-_]+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function parseSkillParts(skillId: string): SkillParts {
  const [ordinalMaybe, ownerMaybe, ...rest] = skillId.split("_");
  const hasOrdinal = /^\d+$/.test(ordinalMaybe || "");
  const owner = hasOrdinal ? ownerMaybe || "unknown" : ordinalMaybe || "unknown";
  const name = hasOrdinal ? rest.join("_") || skillId : [ownerMaybe, ...rest].filter(Boolean).join("_") || skillId;

  return {
    ordinal: hasOrdinal ? ordinalMaybe : null,
    owner,
    ownerLabel: humanizeIdentifier(owner),
    name,
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

function buildSkillArchiveUrl(skillId: string) {
  return `/api/skill-vault/skills/${encodeURIComponent(skillId)}/skill`;
}

function buildReportUrl(skillId: string, fileName: string) {
  return `/api/skill-vault/skills/${encodeURIComponent(skillId)}/reports/${encodeURIComponent(fileName)}`;
}

function stripReport(entry: InternalSkillVaultReportEntry): SkillVaultReportEntry {
  const { reportPath: _reportPath, ...publicEntry } = entry;
  return publicEntry;
}

function stripRecord(record: InternalSkillVaultRecord): SkillVaultRecord {
  const { skillArchivePath: _skillArchivePath, representativeReport, reports, ...rest } = record;
  return {
    ...rest,
    representativeReport: representativeReport ? stripReport(representativeReport) : null,
    reports: reports.map(stripReport),
  };
}

function reportRank(entry: InternalSkillVaultReportEntry) {
  let score = 0;
  if (entry.verdict === "attack_success") {
    score += 100;
  }
  if (entry.harmType && entry.harmType.toLowerCase() !== "safe") {
    score += 20;
  }
  score += (entry.confidence || 0) * 10;
  score += entry.smokingGunExcerpt ? 4 : 0;
  score += entry.vulnerabilitySurface ? 2 : 0;
  score += entry.evidenceSummary ? 1 : 0;
  return score;
}

function reportSort(left: InternalSkillVaultReportEntry, right: InternalSkillVaultReportEntry) {
  return (
    reportRank(right) - reportRank(left) ||
    (right.confidence || 0) - (left.confidence || 0) ||
    left.model.localeCompare(right.model) ||
    left.fileName.localeCompare(right.fileName)
  );
}

function getVerdictLabelFallback(value: string) {
  return value.replaceAll("_", " ");
}

async function readManifest(): Promise<SkillVaultManifest> {
  try {
    const content = await fs.readFile(MANIFEST_PATH, "utf-8");
    return JSON.parse(content) as SkillVaultManifest;
  } catch {
    return {};
  }
}

async function fileExists(target: string) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function loadSkillRecord(skillId: string): Promise<InternalSkillVaultRecord | null> {
  const skillDir = path.join(DATA_ROOT, skillId);
  const reportsDir = path.join(skillDir, "reports");
  const skillArchivePath = path.join(skillDir, "skill.zip");
  const skillArchiveExists = await fileExists(skillArchivePath);

  let reportFiles: string[] = [];
  try {
    reportFiles = (await fs.readdir(reportsDir))
      .filter((fileName) => fileName.endsWith(".json"))
      .sort((left, right) => left.localeCompare(right));
  } catch {
    reportFiles = [];
  }

  const parsedReports = await Promise.all(
    reportFiles.map(async (fileName) => {
      const reportPath = path.join(reportsDir, fileName);
      const raw = JSON.parse(await fs.readFile(reportPath, "utf-8")) as RawSkillVaultReport;
      const finding = raw.findings?.[0];
      if (!finding) {
        return null;
      }

      const reportBase = fileName.replace(/\.json$/i, "");
      const [modelFromName, runIdFromName = reportBase] = reportBase.split("__");
      const observations = finding.agent_trajectory?.execution_observations;
      const smokingGun = Array.isArray(finding.judge?.smoking_gun)
        ? finding.judge?.smoking_gun.map((item) => excerpt(item, 260)).filter(Boolean)
        : finding.judge?.smoking_gun
          ? [excerpt(finding.judge.smoking_gun, 260)]
          : [];
      const predictedTools = uniqueSorted(
        (finding.other_info?.predicted_trajectory || [])
          .map((step) => compactText(step.tool))
          .filter(Boolean)
      );
      const observedPaths = uniqueSorted([
        observations?.observed_path || "",
        ...(observations?.observed_paths || []),
      ]);
      const laneRound = parseLaneRound(runIdFromName);

      return {
        id: reportBase,
        fileName,
        reportPath,
        reportUrl: buildReportUrl(skillId, fileName),
        model: compactText(observations?.model) || modelFromName || "unknown",
        provider: compactText(observations?.provider),
        runId: runIdFromName,
        lane: laneRound.lane,
        round: laneRound.round,
        verdict: compactText(finding.judge?.verdict) || "unknown",
        confidence: typeof finding.judge?.confidence === "number" ? finding.judge.confidence : null,
        harmType: compactText(finding.harm_type) || "unknown",
        vulnerabilitySurface: compactText(finding.vulnerability_surface),
        reasonCode: compactText(finding.judge?.reason_code),
        evidenceSummary: excerpt(observations?.evidence_summary, 240),
        smokingGun,
        smokingGunExcerpt: smokingGun[0] || "",
        harmfulPromptExcerpt: excerpt(finding.harmful_prompt, 280),
        finalResponseExcerpt: excerpt(finding.agent_trajectory?.final_response, 280),
        observedPaths,
        predictedTools,
        generatedAt: compactText(raw.other_info?.generated_at),
      } satisfies InternalSkillVaultReportEntry;
    })
  );

  const reports = parsedReports.filter((item): item is InternalSkillVaultReportEntry => Boolean(item)).sort(reportSort);
  const fallbackSkillId = reports[0]?.id ? skillId : skillId;
  const skillMeta = reports.length
    ? JSON.parse(await fs.readFile(reports[0].reportPath, "utf-8")) as RawSkillVaultReport
    : null;
  const rawSkillId = compactText(skillMeta?.skill?.skill_id) || fallbackSkillId;
  const parts = parseSkillParts(rawSkillId);
  const models = uniqueSorted(reports.map((entry) => entry.model));
  const harmTypes = frequencyFirst(reports.map((entry) => entry.harmType));
  const surfaceLabels = frequencyFirst(reports.map((entry) => entry.vulnerabilitySurface));
  const representativeReport = reports[0] || null;
  const representativeSummary =
    representativeReport?.smokingGunExcerpt ||
    representativeReport?.vulnerabilitySurface ||
    representativeReport?.evidenceSummary ||
    representativeReport?.finalResponseExcerpt ||
    "";

  return {
    slug: skillId,
    skillId: rawSkillId,
    skillLabel: parts.nameLabel || rawSkillId,
    ordinal: parts.ordinal,
    owner: parts.owner,
    ownerLabel: parts.ownerLabel,
    skillName: parts.name,
    sourceLink: compactText(skillMeta?.skill?.source_link),
    skillHash: compactText(skillMeta?.skill?.skill_hash),
    skillArchiveUrl: skillArchiveExists ? buildSkillArchiveUrl(skillId) : undefined,
    skillArchivePath: skillArchiveExists ? skillArchivePath : undefined,
    reportCount: reports.length,
    successCount: reports.filter((entry) => entry.verdict === "attack_success").length,
    modelCount: models.length,
    models,
    harmTypes,
    surfaceLabels,
    primaryHarmType: harmTypes[0] || "unknown",
    primarySurfaceLabel: surfaceLabels[0] || "",
    representativeReport,
    representativeSummary,
    reports,
  };
}

const loadSkillVaultData = cache(async () => {
  const manifest = await readManifest();
  const listedSkills = manifest.kept_skills?.length
    ? manifest.kept_skills
    : (await fs.readdir(DATA_ROOT, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort((left, right) => left.localeCompare(right));

  const records = (
    await Promise.all(listedSkills.map((skillId) => loadSkillRecord(skillId)))
  ).filter((item): item is InternalSkillVaultRecord => Boolean(item));

  const uniqueModels = uniqueSorted(records.flatMap((record) => record.models));
  const uniqueHarmTypes = uniqueSorted(records.flatMap((record) => record.harmTypes));
  const uniqueSurfaces = uniqueSorted(records.flatMap((record) => record.surfaceLabels));
  const reportCount = records.reduce((sum, record) => sum + record.reportCount, 0);

  const summary: SkillVaultSummary = {
    uniqueSkillCount: records.length,
    modelCount: uniqueModels.length,
    totalRuns: reportCount,
    caseEntryCount: reportCount,
    datasetCount: records.length ? 1 : 0,
    reportCount,
    harmTypeCount: uniqueHarmTypes.length,
    surfaceCount: uniqueSurfaces.length,
  };

  return {
    manifest,
    records,
    recordMap: new Map(records.map((record) => [record.slug, record])),
    summary,
  };
});

export async function getSkillVaultSummary(): Promise<SkillVaultSummary> {
  return (await loadSkillVaultData()).summary;
}

export async function listSkillVaultRecords(filters: SkillVaultFilters = {}) {
  const { records } = await loadSkillVaultData();
  const query = compactText(filters.q).toLowerCase();
  const vuln = compactText(filters.vuln).toLowerCase();

  return records
    .filter((record) => {
      if (query) {
        const haystack = [
          record.skillId,
          record.skillLabel,
          record.owner,
          record.ownerLabel,
          record.sourceLink,
          ...record.models,
          ...record.harmTypes,
          ...record.surfaceLabels,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }

      if (vuln) {
        const matched = [...record.harmTypes, ...record.surfaceLabels].some((value) =>
          value.toLowerCase().includes(vuln)
        );
        if (!matched) {
          return false;
        }
      }

      return true;
    })
    .map(stripRecord);
}

export async function getSkillVaultRecord(skillId: string) {
  const { recordMap } = await loadSkillVaultData();
  const record = recordMap.get(skillId);
  return record ? stripRecord(record) : null;
}

export async function getSkillVaultSkillArchive(skillId: string) {
  const { recordMap } = await loadSkillVaultData();
  const record = recordMap.get(skillId);
  if (!record?.skillArchivePath || !record.skillArchiveUrl) {
    return null;
  }
  return {
    path: record.skillArchivePath,
    fileName: `${record.skillId}.zip`,
  };
}

export async function getSkillVaultReportAsset(skillId: string, fileName: string) {
  const { recordMap } = await loadSkillVaultData();
  const record = recordMap.get(skillId);
  const report = record?.reports.find((entry) => entry.fileName === fileName);
  if (!report) {
    return null;
  }
  return {
    path: report.reportPath,
    fileName: report.fileName,
  };
}

export function getVerdictLabel(verdict: string, locale: Locale) {
  const normalized = compactText(verdict).toLowerCase();
  const labels: Record<string, LocalizedText> = {
    attack_success: {
      en: "attack success",
      zh: "攻击成功",
    },
    ignored: {
      en: "ignored",
      zh: "已忽略",
    },
    technical: {
      en: "technical",
      zh: "技术失败",
    },
    unknown: {
      en: "unknown",
      zh: "未知",
    },
  };

  return pick(
    locale,
    labels[normalized] || {
      en: getVerdictLabelFallback(normalized || "unknown"),
      zh: getVerdictLabelFallback(normalized || "unknown"),
    }
  );
}

export function getSkillVaultCopy(locale: Locale) {
  return {
    navLabel: pick(locale, {
      en: "Skill Vault",
      zh: "Skill 库",
    }),
    pageName: "Skill Vault",
    heroBadge: pick(locale, {
      en: "Hot100 real-harm slice",
      zh: "Hot100 真实危害切片",
    }),
    title: pick(locale, {
      en: "Skill Vault",
      zh: "Skill Vault",
    }),
    body: pick(locale, {
      en: "Browse SkillAtlas by skill. Each card corresponds to one skill directory and aggregates the run-level reports, main risk types, and representative evidence observed in tmpreport_hot100_real.",
      zh: "按 skill 浏览 SkillAtlas。每张卡片对应一个 skill 目录，聚合展示 tmpreport_hot100_real 中的 run-level 报告、主要风险类型和代表性证据。",
    }),
    stats: {
      trackedSkills: pick(locale, {
        en: "Tracked skills",
        zh: "已收录技能",
      }),
      reports: pick(locale, {
        en: "Run reports",
        zh: "运行报告",
      }),
      models: pick(locale, {
        en: "Models covered",
        zh: "覆盖模型",
      }),
      riskTypes: pick(locale, {
        en: "Risk types",
        zh: "风险类型",
      }),
    },
    filters: {
      query: pick(locale, {
        en: "search skill, owner, or source link",
        zh: "搜索 skill、作者或来源链接",
      }),
      vuln: pick(locale, {
        en: "risk type or surface",
        zh: "风险类型或攻击面",
      }),
      apply: pick(locale, {
        en: "Apply filters",
        zh: "应用筛选",
      }),
    },
    labels: {
      reports: pick(locale, {
        en: "reports",
        zh: "报告",
      }),
      models: pick(locale, {
        en: "models",
        zh: "模型",
      }),
      riskTypes: pick(locale, {
        en: "risk types",
        zh: "风险类型",
      }),
      sourceLink: pick(locale, {
        en: "source link",
        zh: "来源链接",
      }),
      representativeCase: pick(locale, {
        en: "representative case",
        zh: "代表性案例",
      }),
      representativeEvidence: pick(locale, {
        en: "representative evidence",
        zh: "代表性证据",
      }),
      successCoverage: pick(locale, {
        en: "successful reports",
        zh: "成功报告",
      }),
      lane: pick(locale, {
        en: "lane",
        zh: "lane",
      }),
      round: pick(locale, {
        en: "round",
        zh: "轮次",
      }),
      confidence: pick(locale, {
        en: "confidence",
        zh: "置信度",
      }),
      owner: pick(locale, {
        en: "owner",
        zh: "作者",
      }),
      skillId: pick(locale, {
        en: "skill id",
        zh: "skill id",
      }),
      primaryRisk: pick(locale, {
        en: "primary risk",
        zh: "主要风险",
      }),
      primarySurface: pick(locale, {
        en: "primary surface",
        zh: "主要攻击面",
      }),
      reportTrail: pick(locale, {
        en: "report trail",
        zh: "报告轨迹",
      }),
      reportTrailBody: pick(locale, {
        en: "Run-level reports captured for this skill. Each entry links to the raw JSON and highlights the prompt, evidence, and model behavior that mattered most.",
        zh: "这个 skill 下捕获的 run-level 报告。每条记录都提供原始 JSON，并突出展示关键提示词、证据和模型行为。",
      }),
      harmfulPrompt: pick(locale, {
        en: "harmful prompt",
        zh: "攻击提示词",
      }),
      finalResponse: pick(locale, {
        en: "final response excerpt",
        zh: "最终响应摘录",
      }),
      smokingGun: pick(locale, {
        en: "smoking gun",
        zh: "关键证据",
      }),
      observedPaths: pick(locale, {
        en: "observed paths",
        zh: "观测路径",
      }),
      predictedTools: pick(locale, {
        en: "predicted tools",
        zh: "预测工具",
      }),
      evidenceSummary: pick(locale, {
        en: "evidence summary",
        zh: "证据摘要",
      }),
      rawReport: pick(locale, {
        en: "Raw report JSON",
        zh: "原始报告 JSON",
      }),
      viewRawReport: pick(locale, {
        en: "View raw JSON",
        zh: "查看原始 JSON",
      }),
      rawReportPanel: pick(locale, {
        en: "Raw JSON panel",
        zh: "原始 JSON 面板",
      }),
      rawJsonLoading: pick(locale, {
        en: "Loading raw JSON...",
        zh: "正在加载原始 JSON...",
      }),
      rawJsonError: pick(locale, {
        en: "Could not load this report right now.",
        zh: "暂时无法加载这份报告。",
      }),
      closePanel: pick(locale, {
        en: "Close",
        zh: "关闭",
      }),
      openInNewTab: pick(locale, {
        en: "Open in new tab",
        zh: "新标签打开",
      }),
      downloadSkill: pick(locale, {
        en: "Download skill.zip",
        zh: "下载 skill.zip",
      }),
      noArchive: pick(locale, {
        en: "skill.zip unavailable",
        zh: "skill.zip 不可用",
      }),
      noRepresentative: pick(locale, {
        en: "No representative report extracted yet.",
        zh: "暂时还没有提取到代表性报告。",
      }),
      empty: pick(locale, {
        en: "No skills match the current filters.",
        zh: "当前筛选条件下没有匹配的 skill。",
      }),
      backToVault: pick(locale, {
        en: "Back to Skill Vault",
        zh: "返回 Skill Vault",
      }),
      generatedAt: pick(locale, {
        en: "generated at",
        zh: "生成时间",
      }),
      provider: pick(locale, {
        en: "provider",
        zh: "提供方",
      }),
      openSource: pick(locale, {
        en: "Open source link",
        zh: "打开来源链接",
      }),
    },
  };
}
