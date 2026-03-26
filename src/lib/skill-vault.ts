import bundle from "@/data/skillattack-showcase-bundle.json";
import type { Locale } from "@/lib/i18n";
import { skillAttackLinks } from "@/lib/skillattack-links";

const DATASET_ORDER = ["obvious", "contextual", "hot100"] as const;
type DatasetId = (typeof DATASET_ORDER)[number];
type ShowcaseVerdict = "attack_success" | "ignored" | "technical";

interface LocalizedText {
  en: string;
  zh: string;
}

interface BundleRunSample {
  run: string;
  verdict: ShowcaseVerdict;
  vuln: string;
  confidence?: number;
  failure_reason?: string;
}

interface BundleCase {
  id: string;
  dataset: DatasetId;
  model: string;
  skill: string;
  skill_label: string;
  summary_path: string;
  latest_run: string;
  latest_failure: string;
  primary_verdict: ShowcaseVerdict;
  has_artifacts: boolean;
  artifact_dir: string;
  artifact_paths: Record<string, string>;
  vulns: Array<{ label: string; count: number }>;
  stats: {
    total_runs: number;
    attack_success: number;
    ignored: number;
    technical: number;
    evaluable_runs: number;
    attack_success_rate: number;
    technical_rate: number;
  };
  run_samples: BundleRunSample[];
  score: number;
}

interface BundleData {
  overall: {
    total_runs: number;
    attack_success: number;
    ignored: number;
    technical: number;
    evaluable_runs: number;
    attack_success_rate: number;
    technical_rate: number;
    dataset_count: number;
    model_count: number;
    summary_count: number;
    case_count: number;
  };
  datasets: Array<{
    id: DatasetId;
    label: string;
    stats: BundleCase["stats"];
    model_count: number;
    case_count: number;
  }>;
  models: Array<{ id: string; label: string }>;
  cases: BundleCase[];
}

export interface SkillVaultEntry {
  id: string;
  dataset: DatasetId;
  model: string;
  skillId: string;
  skillLabel: string;
  verdict: ShowcaseVerdict;
  vulnLabels: string[];
  latestRun: string;
  lane: number | null;
  round: number | null;
  confidence: number | null;
  totalRuns: number;
  attackSuccess: number;
  ignored: number;
  technical: number;
  attackSuccessRate: number;
  technicalRate: number;
  reason: string;
  summaryUrl: string;
  artifactUrl?: string;
  artifactCount: number;
  score: number;
}

export interface SkillVaultRecord {
  slug: string;
  skillId: string;
  skillLabel: string;
  datasets: DatasetId[];
  models: string[];
  vulnLabels: string[];
  totalRuns: number;
  attackSuccess: number;
  ignored: number;
  technical: number;
  attackSuccessRate: number;
  technicalRate: number;
  entryCount: number;
  successfulEntries: number;
  successfulModels: number;
  firstSuccessfulEntry: SkillVaultEntry | null;
  representativeReason: string;
  entries: SkillVaultEntry[];
}

export interface SkillVaultSummary {
  uniqueSkillCount: number;
  modelCount: number;
  totalRuns: number;
  caseEntryCount: number;
  datasetCount: number;
}

interface SkillVaultFilters {
  q?: string;
  dataset?: string;
  vuln?: string;
  model?: string;
}

const showcaseBundle = bundle as BundleData;
const REPO_SHOWCASE_ROOT = `${skillAttackLinks.repoUrl}/showcase`;

function pick(locale: Locale, text: LocalizedText) {
  return text[locale];
}

function excerpt(value: string, length = 220) {
  if (!value) {
    return "";
  }
  return value.length > length ? `${value.slice(0, length - 1).trimEnd()}...` : value;
}

function toRepoUrl(relativePath: string) {
  return `${REPO_SHOWCASE_ROOT}/${relativePath}`;
}

function parseLaneRound(runId: string) {
  const match = /lane(\d+)-r(\d+)/i.exec(runId);
  return {
    lane: match ? Number(match[1]) : null,
    round: match ? Number(match[2]) : null,
  };
}

function sortDatasets(values: Iterable<DatasetId>) {
  return Array.from(new Set(values)).sort(
    (left, right) => DATASET_ORDER.indexOf(left) - DATASET_ORDER.indexOf(right)
  );
}

function sortModels(values: Iterable<string>) {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

function sortVulns(values: Iterable<string>) {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

function entrySort(left: SkillVaultEntry, right: SkillVaultEntry) {
  return (
    DATASET_ORDER.indexOf(left.dataset) - DATASET_ORDER.indexOf(right.dataset) ||
    left.model.localeCompare(right.model)
  );
}

function chooseRepresentativeSample(item: BundleCase) {
  return (
    item.run_samples.find((sample) => sample.verdict === "attack_success") ||
    item.run_samples[0] || {
      run: item.latest_run,
      verdict: item.primary_verdict,
      vuln: item.vulns[0]?.label || "",
      confidence: undefined,
      failure_reason: item.latest_failure,
    }
  );
}

const skillVaultEntries: SkillVaultEntry[] = showcaseBundle.cases
  .map((item) => {
    const sample = chooseRepresentativeSample(item);
    const laneRound = parseLaneRound(sample.run || item.latest_run);

    return {
      id: item.id,
      dataset: item.dataset,
      model: item.model,
      skillId: item.skill,
      skillLabel: item.skill_label,
      verdict: item.primary_verdict,
      vulnLabels: item.vulns.map((vuln) => vuln.label),
      latestRun: sample.run || item.latest_run,
      lane: laneRound.lane,
      round: laneRound.round,
      confidence: typeof sample.confidence === "number" ? sample.confidence : null,
      totalRuns: item.stats.total_runs,
      attackSuccess: item.stats.attack_success,
      ignored: item.stats.ignored,
      technical: item.stats.technical,
      attackSuccessRate: item.stats.attack_success_rate,
      technicalRate: item.stats.technical_rate,
      reason: excerpt(sample.failure_reason || item.latest_failure, 240),
      summaryUrl: toRepoUrl(item.summary_path),
      artifactUrl: item.has_artifacts && item.artifact_dir ? toRepoUrl(item.artifact_dir) : undefined,
      artifactCount: Object.keys(item.artifact_paths || {}).length,
      score: item.score,
    };
  })
  .sort(entrySort);

const skillVaultRecords = Array.from(
  skillVaultEntries.reduce((map, entry) => {
    const current = map.get(entry.skillId) || [];
    current.push(entry);
    map.set(entry.skillId, current);
    return map;
  }, new Map<string, SkillVaultEntry[]>()).entries()
)
  .map(([skillId, entries]) => {
    const sortedEntries = [...entries].sort(entrySort);
    const totalRuns = sortedEntries.reduce((sum, entry) => sum + entry.totalRuns, 0);
    const attackSuccess = sortedEntries.reduce((sum, entry) => sum + entry.attackSuccess, 0);
    const ignored = sortedEntries.reduce((sum, entry) => sum + entry.ignored, 0);
    const technical = sortedEntries.reduce((sum, entry) => sum + entry.technical, 0);
    const firstSuccessfulEntry =
      sortedEntries.find((entry) => entry.verdict === "attack_success") || null;

    return {
      slug: skillId,
      skillId,
      skillLabel: sortedEntries[0]?.skillLabel || skillId,
      datasets: sortDatasets(sortedEntries.map((entry) => entry.dataset)),
      models: sortModels(sortedEntries.map((entry) => entry.model)),
      vulnLabels: sortVulns(sortedEntries.flatMap((entry) => entry.vulnLabels)),
      totalRuns,
      attackSuccess,
      ignored,
      technical,
      attackSuccessRate: totalRuns ? Number(((attackSuccess / totalRuns) * 100).toFixed(2)) : 0,
      technicalRate: totalRuns ? Number(((technical / totalRuns) * 100).toFixed(2)) : 0,
      entryCount: sortedEntries.length,
      successfulEntries: sortedEntries.filter((entry) => entry.verdict === "attack_success").length,
      successfulModels: new Set(
        sortedEntries
          .filter((entry) => entry.verdict === "attack_success")
          .map((entry) => entry.model)
      ).size,
      firstSuccessfulEntry,
      representativeReason: firstSuccessfulEntry?.reason || sortedEntries[0]?.reason || "",
      entries: sortedEntries,
    } satisfies SkillVaultRecord;
  })
  .sort((left, right) => left.skillLabel.localeCompare(right.skillLabel));

export function getSkillVaultSummary(): SkillVaultSummary {
  return {
    uniqueSkillCount: skillVaultRecords.length,
    modelCount: showcaseBundle.models.length,
    totalRuns: showcaseBundle.overall.total_runs,
    caseEntryCount: showcaseBundle.overall.case_count,
    datasetCount: showcaseBundle.overall.dataset_count,
  };
}

export function listSkillVaultRecords(filters: SkillVaultFilters = {}) {
  const query = filters.q?.trim().toLowerCase();
  const dataset = filters.dataset?.trim().toLowerCase() as DatasetId | undefined;
  const vuln = filters.vuln?.trim().toLowerCase();
  const model = filters.model?.trim().toLowerCase();

  return skillVaultRecords.filter((record) => {
    if (query) {
      const haystack = [
        record.skillId,
        record.skillLabel,
        ...record.vulnLabels,
        ...record.models,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }

    if (dataset && !record.datasets.includes(dataset)) {
      return false;
    }

    if (vuln && !record.vulnLabels.some((item) => item.toLowerCase().includes(vuln))) {
      return false;
    }

    if (model && !record.models.some((item) => item.toLowerCase().includes(model))) {
      return false;
    }

    return true;
  });
}

export function getSkillVaultRecord(skillId: string) {
  return skillVaultRecords.find((record) => record.slug === skillId) || null;
}

export function getSkillVaultDatasetSections(records: SkillVaultRecord[]) {
  return DATASET_ORDER.map((datasetId) => ({
    id: datasetId,
    records: records.filter((record) => record.datasets.includes(datasetId)),
  })).filter((section) => section.records.length);
}

export function getDatasetLabel(datasetId: DatasetId, locale: Locale) {
  const labels: Record<DatasetId, LocalizedText> = {
    obvious: {
      en: "Obvious",
      zh: "Obvious",
    },
    contextual: {
      en: "Contextual",
      zh: "Contextual",
    },
    hot100: {
      en: "Hot100",
      zh: "Hot100",
    },
  };

  return pick(locale, labels[datasetId]);
}

export function getVerdictLabel(verdict: ShowcaseVerdict, locale: Locale) {
  const labels: Record<ShowcaseVerdict, LocalizedText> = {
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
  };

  return pick(locale, labels[verdict]);
}

export function getSkillVaultCopy(locale: Locale) {
  return {
    navLabel: pick(locale, {
      en: "Skill Vault",
      zh: "Skill 库",
    }),
    pageName: "Skill Vault",
    heroBadge: pick(locale, {
      en: "SkillAttack classification view",
      zh: "SkillAttack 分类视图",
    }),
    title: pick(locale, {
      en: "Skill Vault",
      zh: "Skill Vault",
    }),
    body: pick(locale, {
      en: "Browse vulnerability-bearing skills by SkillAttack bucket. Each record shows observed vuln types, successful attack coverage, and the lane/round that first landed a successful run.",
      zh: "按 SkillAttack 的分类体系浏览带漏洞的 skills。每条记录都会展示漏洞类型、成功攻击覆盖情况，以及首次打成成功的 lane / round。",
    }),
    stats: {
      trackedSkills: pick(locale, {
        en: "Tracked skills",
        zh: "已追踪 skills",
      }),
      caseEntries: pick(locale, {
        en: "Case entries",
        zh: "案例条目",
      }),
      totalRuns: pick(locale, {
        en: "Total runs",
        zh: "总运行数",
      }),
      models: pick(locale, {
        en: "Models covered",
        zh: "覆盖模型数",
      }),
    },
    filters: {
      query: pick(locale, {
        en: "search skill or vuln",
        zh: "搜索 skill 或漏洞",
      }),
      dataset: pick(locale, {
        en: "dataset bucket",
        zh: "分类桶",
      }),
      vuln: pick(locale, {
        en: "vulnerability type",
        zh: "漏洞类型",
      }),
      model: pick(locale, {
        en: "model",
        zh: "模型",
      }),
      allDatasets: pick(locale, {
        en: "all buckets",
        zh: "全部分类",
      }),
      apply: pick(locale, {
        en: "Apply filters",
        zh: "应用筛选",
      }),
    },
    labels: {
      successCoverage: pick(locale, {
        en: "success coverage",
        zh: "成功覆盖",
      }),
      representativeWin: pick(locale, {
        en: "representative win",
        zh: "代表性成功",
      }),
      lane: pick(locale, {
        en: "lane",
        zh: "lane",
      }),
      round: pick(locale, {
        en: "round",
        zh: "轮次",
      }),
      datasets: pick(locale, {
        en: "datasets",
        zh: "数据集",
      }),
      models: pick(locale, {
        en: "models",
        zh: "模型",
      }),
      vulnTypes: pick(locale, {
        en: "vulnerability types",
        zh: "漏洞类型",
      }),
      totalRuns: pick(locale, {
        en: "total runs",
        zh: "总运行数",
      }),
      attackSuccess: pick(locale, {
        en: "attack success",
        zh: "攻击成功",
      }),
      technical: pick(locale, {
        en: "technical",
        zh: "技术失败",
      }),
      ignored: pick(locale, {
        en: "ignored",
        zh: "已忽略",
      }),
      detail: pick(locale, {
        en: "Open detail",
        zh: "查看详情",
      }),
      empty: pick(locale, {
        en: "No skills match the current filters.",
        zh: "当前筛选条件下没有匹配的 skill。",
      }),
      noRepresentative: pick(locale, {
        en: "No representative success run extracted yet.",
        zh: "暂时还没有提取到代表性成功运行。",
      }),
      summaryJson: pick(locale, {
        en: "Summary JSON",
        zh: "Summary JSON",
      }),
      artifactDirectory: pick(locale, {
        en: "Artifact directory",
        zh: "Artifact 目录",
      }),
      artifactUnavailable: pick(locale, {
        en: "Artifacts unavailable for this entry.",
        zh: "这条记录没有附带 artifact 目录。",
      }),
      executionTraces: pick(locale, {
        en: "Execution traces",
        zh: "执行轨迹",
      }),
      executionBody: pick(locale, {
        en: "Per-model and per-dataset entries from the current SkillAttack showcase snapshot.",
        zh: "当前 SkillAttack showcase 快照里，按模型和数据集拆开的执行记录。",
      }),
      confidence: pick(locale, {
        en: "confidence",
        zh: "置信度",
      }),
      score: pick(locale, {
        en: "score",
        zh: "分数",
      }),
      successReason: pick(locale, {
        en: "observed evidence",
        zh: "观测到的证据",
      }),
      skillId: pick(locale, {
        en: "skill id",
        zh: "skill id",
      }),
      openShowcase: pick(locale, {
        en: "Open SkillAttack showcase",
        zh: "打开 SkillAttack 展示页",
      }),
      openRepo: pick(locale, {
        en: "Open SkillAttack repo",
        zh: "打开 SkillAttack 仓库",
      }),
      openArxiv: pick(locale, {
        en: "Open arXiv placeholder",
        zh: "打开 arXiv 占位链接",
      }),
      vaultIndex: pick(locale, {
        en: "Back to Skill Vault",
        zh: "返回 Skill Vault",
      }),
    },
  };
}
