import AdmZip from "adm-zip";

export interface ParsedSubmissionFinding {
  sortOrder: number;
  reportPath?: string;
  reportSkillId: string;
  sourceLink?: string;
  skillHash?: string;
  findingKey: string;
  harmType: string;
  vulnerabilitySurface: string;
  provider?: string;
  model?: string;
  verdict?: string;
  reasonCode?: string;
  confidence?: number;
  harmfulPromptPreview: string;
  smokingGunPreview?: string;
  evidenceSummaryPreview?: string;
  finalResponsePreview?: string;
  trajectoryTimeline: Array<{
    stepIndex: number;
    relativeMs?: number;
    type: string;
    tool?: string;
    status?: "ok" | "error";
    summary: string;
  }>;
  redactionFlags: string[];
  judgeSummary: Record<string, unknown>;
}

export interface ParsedSubmissionArtifact {
  kind: "report_json" | "skill_archive" | "metadata";
  visibility: "admin_only" | "public_case";
  fileName: string;
  pathInBundle?: string;
  contentType: string;
  sizeBytes: number;
  redactionFlags: string[];
  previewText?: string;
}

export interface ParsedBundleDisplay {
  bundle: {
    source: string;
    generatedAt: string;
    reportMode: string;
    skillCount: number;
    reportCount: number;
    summaryExcerpt: Record<string, unknown>;
  };
  reports: Array<{
    skillId: string;
    sourceLink?: string;
    findingCount: number;
    successfulSurfaceCount: number;
    totalSurfaceCount: number;
    uncoveredSurfaces: string[];
  }>;
  findings: Array<{
    reportSkillId: string;
    findingKey: string;
    harmType: string;
    vulnerabilitySurface: string;
    provider?: string;
    model?: string;
    verdict?: string;
    reasonCode?: string;
    confidence?: number;
    harmfulPromptPreview: string;
    smokingGunPreview?: string;
    evidenceSummaryPreview?: string;
    finalResponsePreview?: string;
    trajectoryTimeline: Array<{
      stepIndex: number;
      relativeMs?: number;
      type: string;
      tool?: string;
      status?: "ok" | "error";
      summary: string;
    }>;
    redactionFlags: string[];
  }>;
  redactionSummary: {
    flags: string[];
    replacements: Record<string, number>;
    hiddenSections: string[];
  };
}

export interface ParsedReportBundle {
  bundleMeta: Record<string, unknown>;
  parsedIndex: Record<string, unknown>;
  summaryStats: Record<string, unknown>;
  displayPayload: ParsedBundleDisplay;
  redactionSummary: ParsedBundleDisplay["redactionSummary"];
  findings: ParsedSubmissionFinding[];
  artifacts: ParsedSubmissionArtifact[];
}

export interface ParsedDetailedSimulationStep {
  stepIndex: number;
  type: string;
  tool: string;
  content: string;
  isError: boolean;
  timestamp: Date | null;
  model?: string;
}

export interface ParsedDetailedFindingRound {
  roundId: number;
  attackPrompt: string;
  result: string;
  reason: string;
  riskType: string;
  surfaceLevel: string;
  surfaceTitle: string;
  actionableSuggestion: string;
  attackModel?: string;
  simulationModel?: string;
  judgeModel?: string;
  suggestionModel?: string;
  simulationSteps: ParsedDetailedSimulationStep[];
}

export interface ParsedDetailedFinding {
  reportSkillId: string;
  sourceLink?: string;
  harmType: string;
  vulnerabilitySurface: string;
  provider?: string;
  model?: string;
  verdict?: string;
  reasonCode?: string;
  confidence?: number;
  rounds: ParsedDetailedFindingRound[];
}

interface SanitizedTextResult {
  text: string;
  flags: string[];
  replacements: Record<string, number>;
}

const HIDDEN_SECTIONS = [
  "agent_trajectory.trajectory",
  "agent_trajectory.tool_calls",
  "judge.evidence_map",
  "judge.path_delta",
  "skill.skill_zip",
];

const DETAIL_TEXT_MAX_LENGTH = 20_000;

const REDACTION_RULES = [
  {
    key: "secret",
    flag: "possible secret or credential leakage",
    placeholder: "[SECRET]",
    pattern: /(sk-[A-Za-z0-9]{16,}|ghp_[A-Za-z0-9]{10,}|AKIA[0-9A-Z]{16})/g,
  },
  {
    key: "private_key",
    flag: "private key material removed",
    placeholder: "[PRIVATE_KEY]",
    pattern: /-----BEGIN [A-Z ]+ PRIVATE KEY-----[\s\S]*?-----END [A-Z ]+ PRIVATE KEY-----/g,
  },
  {
    key: "email",
    flag: "email address removed",
    placeholder: "[EMAIL]",
    pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
  },
  {
    key: "ip_address",
    flag: "ip address removed",
    placeholder: "[IP]",
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  },
  {
    key: "file_uri",
    flag: "file URI removed",
    placeholder: "[FILE_URI]",
    pattern: /file:\/\/[^\s"'`]+/g,
  },
  {
    key: "local_path",
    flag: "local workspace path removed",
    placeholder: "[LOCAL_PATH]",
    pattern: /(?:~\/[^\s"'`]+|\/root\/[^\s"'`]+|\/home\/[^/\s"'`]+\/[^\s"'`]+|\/Users\/[^/\s"'`]+\/[^\s"'`]+)/g,
  },
  {
    key: "runtime_path",
    flag: "runtime path removed",
    placeholder: "[RUNTIME_PATH]",
    pattern: /\/app\/[^\s"'`]+/g,
  },
];

function ensureString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function ensureArray<T>(value: unknown) {
  return Array.isArray(value) ? (value as T[]) : [];
}

function ensureRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function compactText(value: unknown) {
  return ensureString(value).replace(/\s+/g, " ").trim();
}

function readModelName(value: unknown) {
  if (typeof value === "string") {
    return compactText(value);
  }

  const record = ensureRecord(value);
  return (
    compactText(record.model) ||
    compactText(record.primary) ||
    compactText(record.name)
  );
}

function extractConfiguredStageModels(
  modelConfig: Record<string, unknown>,
  fallbackModel?: string
) {
  const normalizedFallback = compactText(fallbackModel);
  const attackModel = readModelName(ensureRecord(modelConfig.attacker));
  const simulationModel = readModelName(ensureRecord(modelConfig.simulator));
  const judgeModel = readModelName(ensureRecord(modelConfig.judge));
  const feedbackModel = readModelName(ensureRecord(modelConfig.feedback));

  return {
    attackModel: attackModel || normalizedFallback || undefined,
    simulationModel: simulationModel || normalizedFallback || undefined,
    judgeModel: judgeModel || normalizedFallback || undefined,
    suggestionModel:
      feedbackModel || judgeModel || normalizedFallback || undefined,
  };
}

function summarizeText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3).trimEnd()}...` : normalized;
}

function mergeReplacements(
  target: Record<string, number>,
  source: Record<string, number>
) {
  for (const [key, value] of Object.entries(source)) {
    target[key] = (target[key] || 0) + value;
  }
}

function sanitizeText(value: unknown, maxLength: number): SanitizedTextResult {
  let text = ensureString(value);
  const flags = new Set<string>();
  const replacements: Record<string, number> = {};

  for (const rule of REDACTION_RULES) {
    text = text.replace(rule.pattern, () => {
      flags.add(rule.flag);
      replacements[rule.key] = (replacements[rule.key] || 0) + 1;
      return rule.placeholder;
    });
  }

  return {
    text: summarizeText(text, maxLength),
    flags: [...flags],
    replacements,
  };
}

function sanitizeTextDetailed(
  value: unknown,
  maxLength = DETAIL_TEXT_MAX_LENGTH
): SanitizedTextResult {
  let text = ensureString(value);
  const flags = new Set<string>();
  const replacements: Record<string, number> = {};

  for (const rule of REDACTION_RULES) {
    text = text.replace(rule.pattern, () => {
      flags.add(rule.flag);
      replacements[rule.key] = (replacements[rule.key] || 0) + 1;
      return rule.placeholder;
    });
  }

  const normalized = text.trim();

  return {
    text:
      normalized.length > maxLength
        ? `${normalized.slice(0, maxLength - 3).trimEnd()}...`
        : normalized,
    flags: [...flags],
    replacements,
  };
}

function sanitizeSourceLink(value: unknown) {
  const raw = compactText(value);
  if (!raw) {
    return undefined;
  }

  try {
    const url = new URL(raw);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function readJsonEntry(zip: AdmZip, entryName: string) {
  const entry = zip.getEntry(entryName);
  if (!entry) {
    throw new Error(`Missing required bundle entry: ${entryName}`);
  }

  try {
    return JSON.parse(entry.getData().toString("utf-8")) as Record<string, unknown>;
  } catch {
    throw new Error(`Invalid JSON in bundle entry: ${entryName}`);
  }
}

function entrySize(zip: AdmZip, entryName: string) {
  const entry = zip.getEntry(entryName);
  return entry ? entry.header.size : 0;
}

function entryPreview(zip: AdmZip, entryName: string, maxLength = 800) {
  const entry = zip.getEntry(entryName);
  if (!entry) {
    return undefined;
  }
  return summarizeText(entry.getData().toString("utf-8"), maxLength);
}

function combineSmokingGun(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => compactText(item)).filter(Boolean).join(" | ");
  }
  return compactText(value);
}

function pickEvidenceSummary(
  observations: Record<string, unknown>,
  judge: Record<string, unknown>
) {
  const direct = compactText(observations.evidence_summary);
  if (direct) {
    return direct;
  }

  const evidenceMap = ensureRecord(judge.evidence_map);
  const artifacts = ensureRecord(evidenceMap.artifacts);
  return compactText(artifacts.evidence_summary || artifacts.stderr_excerpt);
}

function toNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function sanitizeStructuredValue(value: unknown, maxLength: number) {
  const raw =
    typeof value === "string"
      ? value
      : value && typeof value === "object"
        ? JSON.stringify(value)
        : String(value || "");
  return sanitizeText(raw, maxLength);
}

function sanitizeStructuredValueDetailed(
  value: unknown,
  maxLength = DETAIL_TEXT_MAX_LENGTH
) {
  const raw =
    typeof value === "string"
      ? value
      : value && typeof value === "object"
        ? JSON.stringify(value, null, 2)
        : String(value || "");
  return sanitizeTextDetailed(raw, maxLength);
}

function toDate(value: unknown) {
  return typeof value === "number" ? new Date(value) : null;
}

function buildDetailedSimulationSteps(
  steps: Array<Record<string, unknown>>,
  fallbackModel?: string
): ParsedDetailedSimulationStep[] {
  return steps
    .map((step, index) => {
      const stepType = compactText(step.type) || "unknown";
      const stepIndex = toNumber(step.step_index) || index + 1;
      const tool = compactText(step.tool);
      let sanitized;

      if (stepType === "assistant_message") {
        sanitized = sanitizeTextDetailed(step.text);
      } else if (stepType === "tool_call") {
        const argumentsText =
          tool === "write"
            ? {
                path: ensureRecord(step.arguments).path,
              }
            : ensureRecord(step.arguments);
        sanitized = sanitizeStructuredValueDetailed(
          tool ? { tool, arguments: argumentsText } : argumentsText
        );
      } else if (stepType === "tool_result") {
        sanitized = sanitizeStructuredValueDetailed(
          step.result_text ?? step.result ?? step.output
        );
      } else {
        sanitized = sanitizeTextDetailed(
          step.text ?? step.result_text ?? step.result ?? step.output
        );
      }

      return {
        stepIndex,
        type: stepType,
        tool,
        content: sanitized.text,
        isError: Boolean(step.is_error) || compactText(step.status).toLowerCase() === "error",
        timestamp: toDate(step.timestamp),
        model:
          readModelName(step.model) ||
          readModelName(ensureRecord(step.metadata).model) ||
          compactText(fallbackModel) ||
          undefined,
      };
    })
    .filter((step) => step.content);
}

function extractTrajectoryTimeline(agentTrajectory: Record<string, unknown>) {
  const steps = ensureArray<Record<string, unknown>>(agentTrajectory.trajectory);
  const flags = new Set<string>();
  const replacements: Record<string, number> = {};
  const firstTimestamp = steps.find((item) => typeof item.timestamp === "number")?.timestamp;
  const timeline: ParsedSubmissionFinding["trajectoryTimeline"] = [];

  for (const step of steps) {
    const stepType = compactText(step.type) || "unknown";
    const stepIndex = toNumber(step.step_index) || timeline.length + 1;
    const timestamp = toNumber(step.timestamp);
    let sanitized;
    let tool: string | undefined;
    let status: "ok" | "error" | undefined;

    if (stepType === "assistant_message") {
      sanitized = sanitizeText(step.text, 220);
    } else if (stepType === "tool_call") {
      tool = compactText(step.tool) || undefined;
      const argumentsText =
        tool === "write"
          ? {
              path: ensureRecord(step.arguments).path,
            }
          : ensureRecord(step.arguments);
      sanitized = sanitizeStructuredValue(
        tool ? { tool, arguments: argumentsText } : argumentsText,
        220
      );
    } else if (stepType === "tool_result") {
      tool = compactText(step.tool) || undefined;
      status = step.is_error ? "error" : "ok";
      sanitized = sanitizeStructuredValue(step.result_text, 240);
    } else {
      sanitized = sanitizeText(step.text || step.result_text, 220);
    }

    mergeReplacements(replacements, sanitized.replacements);
    for (const flag of sanitized.flags) {
      flags.add(flag);
    }

    if (!sanitized.text) {
      continue;
    }

    timeline.push({
      stepIndex,
      relativeMs:
        typeof firstTimestamp === "number" && typeof timestamp === "number"
          ? Math.max(0, timestamp - firstTimestamp)
          : undefined,
      type: stepType,
      tool,
      status,
      summary: sanitized.text,
    });
  }

  return {
    timeline,
    flags: [...flags],
    replacements,
  };
}

function parseSurfaceOrdinal(value: string) {
  const matched = value.match(/^surface_(\d+)/i);
  return matched ? Number.parseInt(matched[1], 10) : Number.MAX_SAFE_INTEGER;
}

function parseRoundNumber(value: string) {
  const matched = value.match(/round_(\d+)\.json$/i);
  return matched ? Number.parseInt(matched[1], 10) : undefined;
}

function lastAssistantMessage(steps: Array<Record<string, unknown>>) {
  for (let index = steps.length - 1; index >= 0; index -= 1) {
    const step = steps[index];
    if (compactText(step.type).toLowerCase() === "assistant_message") {
      const text = compactText(step.text);
      if (text) {
        return text;
      }
    }
  }
  return "";
}

function pickRunsOrganizeSmokingGun(
  steps: Array<Record<string, unknown>>,
  simulation: Record<string, unknown>,
  judge: Record<string, unknown>
) {
  const lastToolResult = [...steps]
    .reverse()
    .find((step) => compactText(step.type).toLowerCase() === "tool_result" && compactText(step.result_text));

  if (lastToolResult) {
    return compactText(lastToolResult.result_text);
  }

  const firstError = ensureArray<string>(simulation.errors)
    .map((value) => compactText(value))
    .find(Boolean);
  if (firstError) {
    return firstError;
  }

  return compactText(judge.reason);
}

function parseRunsOrganizeBundle(zip: AdmZip): ParsedReportBundle {
  const analyzeEntries = zip
    .getEntries()
    .filter((entry) => /(^|\/)[^/]+\/[^/]+\/[^/]+_analyze\.json$/.test(entry.entryName));

  if (!analyzeEntries.length) {
    throw new Error(
      "Unsupported report bundle format. Expected standardized bundle metadata or a runs_organize export."
    );
  }

  const findings: ParsedSubmissionFinding[] = [];
  const artifacts: ParsedSubmissionArtifact[] = [];
  const previewReports: ParsedBundleDisplay["reports"] = [];
  const globalFlags = new Set<string>();
  const globalReplacements: Record<string, number> = {};
  const modelGroups = new Set<string>();
  let sortOrder = 0;

  for (const analyzeEntry of analyzeEntries) {
    const segments = analyzeEntry.entryName.split("/");
    if (segments.length < 4) {
      continue;
    }

    const [, modelGroup, skillId] = segments;
    const basePath = `${segments[0]}/${modelGroup}/${skillId}`;
    const analyzePath = analyzeEntry.entryName;
    const globalReportPath = `${basePath}/${skillId}_global_report.json`;
    const modelPath = `${basePath}/model.json`;
    const skillSourcePath = `${basePath}/skill_source.zip`;
    const analyze = readJsonEntry(zip, analyzePath);
    const globalReport = zip.getEntry(globalReportPath) ? readJsonEntry(zip, globalReportPath) : {};
    const modelConfig = zip.getEntry(modelPath) ? readJsonEntry(zip, modelPath) : {};
    const results = ensureArray<Record<string, unknown>>(analyze.results).sort((left, right) => {
      return (
        parseSurfaceOrdinal(compactText(left.id)) - parseSurfaceOrdinal(compactText(right.id)) ||
        compactText(left.id).localeCompare(compactText(right.id))
      );
    });
    const surfaceSummary = ensureRecord(globalReport.surface_summary);
    const simulatorModel =
      compactText(ensureRecord(modelConfig.simulator).model) ||
      compactText(ensureRecord(modelConfig.attacker).model) ||
      compactText(modelGroup) ||
      undefined;

    modelGroups.add(modelGroup);

    previewReports.push({
      skillId: compactText(analyze.skillname) || skillId,
      findingCount: results.length,
      successfulSurfaceCount: results.filter((item) => {
        const summary = ensureRecord(surfaceSummary[compactText(item.id)]);
        return compactText(summary.status) === "success";
      }).length,
      totalSurfaceCount: results.length,
      uncoveredSurfaces: [],
    });

    artifacts.push(
      {
        kind: "report_json",
        visibility: "admin_only",
        fileName: `${skillId}/analyze.json`,
        pathInBundle: analyzePath,
        contentType: "application/json",
        sizeBytes: entrySize(zip, analyzePath),
        redactionFlags: [],
        previewText: entryPreview(zip, analyzePath),
      },
      {
        kind: "report_json",
        visibility: "admin_only",
        fileName: `${skillId}/global_report.json`,
        pathInBundle: globalReportPath,
        contentType: "application/json",
        sizeBytes: entrySize(zip, globalReportPath),
        redactionFlags: [],
        previewText: entryPreview(zip, globalReportPath),
      },
      {
        kind: "metadata",
        visibility: "admin_only",
        fileName: `${skillId}/model.json`,
        pathInBundle: modelPath,
        contentType: "application/json",
        sizeBytes: entrySize(zip, modelPath),
        redactionFlags: [],
        previewText: entryPreview(zip, modelPath),
      }
    );

    if (zip.getEntry(skillSourcePath)) {
      artifacts.push({
        kind: "skill_archive",
        visibility: "admin_only",
        fileName: `${skillId}/skill.zip`,
        pathInBundle: skillSourcePath,
        contentType: "application/zip",
        sizeBytes: entrySize(zip, skillSourcePath),
        redactionFlags: [],
      });
    }

    for (const result of results) {
      const surfaceId = compactText(result.id);
      const surfaceTitle = compactText(result.title) || surfaceId || "unknown surface";
      const surfacePath = `${basePath}/${surfaceId}`;
      const roundPaths = zip
        .getEntries()
        .filter((entry) => entry.entryName.startsWith(`${surfacePath}/`) && /round_\d+\.json$/.test(entry.entryName))
        .map((entry) => entry.entryName)
        .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
      const rounds = roundPaths.map((entryName) => readJsonEntry(zip, entryName));
      const finalRound = rounds[rounds.length - 1] || {};
      const finalJudge = ensureRecord(finalRound.judge);
      const finalSimulation = ensureRecord(finalRound.simulation);
      const steps = ensureArray<Record<string, unknown>>(finalSimulation.steps);
      const harmfulPrompt = sanitizeText(ensureRecord(finalRound.attack).attack_prompt, 640);
      const smokingGun = sanitizeText(
        pickRunsOrganizeSmokingGun(steps, finalSimulation, finalJudge),
        420
      );
      const evidenceSummary = sanitizeText(
        compactText(finalJudge.reason) || compactText(result.description),
        360
      );
      const finalResponse = sanitizeText(lastAssistantMessage(steps), 420);
      const trajectoryTimeline = extractTrajectoryTimeline({ trajectory: steps });

      mergeReplacements(globalReplacements, harmfulPrompt.replacements);
      mergeReplacements(globalReplacements, smokingGun.replacements);
      mergeReplacements(globalReplacements, evidenceSummary.replacements);
      mergeReplacements(globalReplacements, finalResponse.replacements);
      mergeReplacements(globalReplacements, trajectoryTimeline.replacements);

      for (const flag of [
        ...harmfulPrompt.flags,
        ...smokingGun.flags,
        ...evidenceSummary.flags,
        ...finalResponse.flags,
        ...trajectoryTimeline.flags,
      ]) {
        globalFlags.add(flag);
      }

      const perFindingFlags = [
        ...new Set([
          ...harmfulPrompt.flags,
          ...smokingGun.flags,
          ...evidenceSummary.flags,
          ...finalResponse.flags,
          ...trajectoryTimeline.flags,
        ]),
      ];
      const summary = ensureRecord(surfaceSummary[surfaceId]);

      findings.push({
        sortOrder,
        reportPath: analyzePath,
        reportSkillId: compactText(analyze.skillname) || skillId,
        skillHash: compactText(analyze.skillhash) || undefined,
        findingKey: surfaceId || `${skillId}-finding-${sortOrder + 1}`,
        harmType:
          compactText(summary.final_risk_type) ||
          compactText(result.risk_type) ||
          "unknown",
        vulnerabilitySurface: surfaceTitle,
        model: simulatorModel,
        verdict: compactText(summary.status) || compactText(finalJudge.result) || undefined,
        reasonCode: compactText(result.level) || undefined,
        harmfulPromptPreview: harmfulPrompt.text,
        smokingGunPreview: smokingGun.text || undefined,
        evidenceSummaryPreview: evidenceSummary.text || undefined,
        finalResponsePreview: finalResponse.text || undefined,
        trajectoryTimeline: trajectoryTimeline.timeline,
        redactionFlags: perFindingFlags,
        judgeSummary: {
          verdict: compactText(summary.status) || compactText(finalJudge.result) || undefined,
          reason: compactText(finalJudge.reason) || undefined,
          actionableSuggestion: compactText(finalJudge.actionable_suggestion) || undefined,
          rounds: roundPaths.length,
        },
      });

      sortOrder += 1;
    }
  }

  const redactionSummary = {
    flags: [...globalFlags],
    replacements: globalReplacements,
    hiddenSections: HIDDEN_SECTIONS,
  };

  return {
    bundleMeta: {
      source: "runs_organize",
      generated_at: "",
      report_mode: "runs_organize",
      skill_count: previewReports.length,
      report_count: previewReports.length,
      summary_excerpt: {
        modelGroups: [...modelGroups].sort(),
      },
    },
    parsedIndex: {
      reports: previewReports.map((report) => ({
        skill_id: report.skillId,
        finding_count: report.findingCount,
        successful_surface_count: report.successfulSurfaceCount,
        total_surface_count: report.totalSurfaceCount,
      })),
    },
    summaryStats: {
      modelGroups: [...modelGroups].sort(),
      skillCount: previewReports.length,
      findingCount: findings.length,
    },
    displayPayload: {
      bundle: {
        source: "runs_organize",
        generatedAt: "",
        reportMode: "runs_organize",
        skillCount: previewReports.length,
        reportCount: previewReports.length,
        summaryExcerpt: {
          modelGroups: [...modelGroups].sort(),
        },
      },
      reports: previewReports,
      findings: findings.map((finding) => ({
        reportSkillId: finding.reportSkillId,
        findingKey: finding.findingKey,
        harmType: finding.harmType,
        vulnerabilitySurface: finding.vulnerabilitySurface,
        provider: finding.provider,
        model: finding.model,
        verdict: finding.verdict,
        reasonCode: finding.reasonCode,
        confidence: finding.confidence,
        harmfulPromptPreview: finding.harmfulPromptPreview,
        smokingGunPreview: finding.smokingGunPreview,
        evidenceSummaryPreview: finding.evidenceSummaryPreview,
        finalResponsePreview: finding.finalResponsePreview,
        trajectoryTimeline: finding.trajectoryTimeline,
        redactionFlags: finding.redactionFlags,
      })),
      redactionSummary,
    },
    redactionSummary,
    findings,
    artifacts,
  };
}

export function parseReportBundle(buffer: Buffer): ParsedReportBundle {
  const zip = new AdmZip(buffer);
  if (!zip.getEntry("bundle_meta.json") || !zip.getEntry("standardized_reports/index.json")) {
    return parseRunsOrganizeBundle(zip);
  }

  const bundleMeta = readJsonEntry(zip, "bundle_meta.json");
  const parsedIndex = readJsonEntry(zip, "standardized_reports/index.json");
  const summaryByGroup = zip.getEntry("summary_by_group.json")
    ? readJsonEntry(zip, "summary_by_group.json")
    : {};

  const reportEntries = ensureArray<Record<string, unknown>>(parsedIndex.reports);
  const findings: ParsedSubmissionFinding[] = [];
  const artifacts: ParsedSubmissionArtifact[] = [
    {
      kind: "metadata",
      visibility: "admin_only",
      fileName: "bundle_meta.json",
      pathInBundle: "bundle_meta.json",
      contentType: "application/json",
      sizeBytes: entrySize(zip, "bundle_meta.json"),
      redactionFlags: [],
      previewText: entryPreview(zip, "bundle_meta.json"),
    },
    {
      kind: "metadata",
      visibility: "admin_only",
      fileName: "standardized_reports/index.json",
      pathInBundle: "standardized_reports/index.json",
      contentType: "application/json",
      sizeBytes: entrySize(zip, "standardized_reports/index.json"),
      redactionFlags: [],
      previewText: entryPreview(zip, "standardized_reports/index.json"),
    },
  ];

  const globalFlags = new Set<string>();
  const globalReplacements: Record<string, number> = {};
  const previewReports: ParsedBundleDisplay["reports"] = [];

  let sortOrder = 0;

  for (const reportEntry of reportEntries) {
    const reportPath = ensureString(reportEntry.report_path);
    const skillZipPath = ensureString(reportEntry.skill_zip_path);
    const reportSkillId = compactText(reportEntry.skill_id);
    const reportJson = readJsonEntry(zip, reportPath);
    const skill = ensureRecord(reportJson.skill);
    const sourceLink = sanitizeSourceLink(skill.source_link);

    previewReports.push({
      skillId: reportSkillId,
      sourceLink,
      findingCount: Number(reportEntry.finding_count || 0),
      successfulSurfaceCount: Number(reportEntry.successful_surface_count || 0),
      totalSurfaceCount: Number(reportEntry.total_surface_count || 0),
      uncoveredSurfaces: ensureArray<string>(reportEntry.uncovered_surfaces).map((item) => compactText(item)),
    });

    artifacts.push(
      {
        kind: "report_json",
        visibility: "admin_only",
        fileName: `${reportSkillId}/report.json`,
        pathInBundle: reportPath,
        contentType: "application/json",
        sizeBytes: entrySize(zip, reportPath),
        redactionFlags: [],
        previewText: entryPreview(zip, reportPath),
      },
      {
        kind: "skill_archive",
        visibility: "admin_only",
        fileName: `${reportSkillId}/skill.zip`,
        pathInBundle: skillZipPath,
        contentType: "application/zip",
        sizeBytes: entrySize(zip, skillZipPath),
        redactionFlags: [],
      }
    );

    const reportFindings = ensureArray<Record<string, unknown>>(reportJson.findings);

    for (const finding of reportFindings) {
      const trajectory = ensureRecord(finding.agent_trajectory);
      const observations = ensureRecord(trajectory.execution_observations);
      const judge = ensureRecord(finding.judge);

      const harmfulPrompt = sanitizeText(finding.harmful_prompt, 640);
      const smokingGun = sanitizeText(combineSmokingGun(judge.smoking_gun), 420);
      const evidenceSummary = sanitizeText(pickEvidenceSummary(observations, judge), 360);
      const finalResponse = sanitizeText(trajectory.final_response, 420);
      const trajectoryTimeline = extractTrajectoryTimeline(trajectory);

      mergeReplacements(globalReplacements, harmfulPrompt.replacements);
      mergeReplacements(globalReplacements, smokingGun.replacements);
      mergeReplacements(globalReplacements, evidenceSummary.replacements);
      mergeReplacements(globalReplacements, finalResponse.replacements);
      mergeReplacements(globalReplacements, trajectoryTimeline.replacements);

      for (const flag of [
        ...harmfulPrompt.flags,
        ...smokingGun.flags,
        ...evidenceSummary.flags,
        ...finalResponse.flags,
        ...trajectoryTimeline.flags,
      ]) {
        globalFlags.add(flag);
      }

      const perFindingFlags = [
        ...new Set([
          ...harmfulPrompt.flags,
          ...smokingGun.flags,
          ...evidenceSummary.flags,
          ...finalResponse.flags,
          ...trajectoryTimeline.flags,
        ]),
      ];

      findings.push({
        sortOrder,
        reportPath,
        reportSkillId,
        sourceLink,
        skillHash: compactText(skill.skill_hash) || undefined,
        findingKey:
          compactText(finding.finding_id) || `${reportSkillId}-finding-${sortOrder + 1}`,
        harmType: compactText(finding.harm_type) || "unknown",
        vulnerabilitySurface: compactText(finding.vulnerability_surface) || "unknown",
        provider: compactText(observations.provider) || undefined,
        model: compactText(observations.model) || undefined,
        verdict: compactText(judge.verdict) || undefined,
        reasonCode: compactText(judge.reason_code) || undefined,
        confidence: toNumber(judge.confidence),
        harmfulPromptPreview: harmfulPrompt.text,
        smokingGunPreview: smokingGun.text || undefined,
        evidenceSummaryPreview: evidenceSummary.text || undefined,
        finalResponsePreview: finalResponse.text || undefined,
        trajectoryTimeline: trajectoryTimeline.timeline,
        redactionFlags: perFindingFlags,
        judgeSummary: {
          verdict: compactText(judge.verdict) || undefined,
          reasonCode: compactText(judge.reason_code) || undefined,
          confidence: toNumber(judge.confidence),
          smokingGunCount: Array.isArray(judge.smoking_gun)
            ? judge.smoking_gun.length
            : judge.smoking_gun
              ? 1
              : 0,
        },
      });

      sortOrder += 1;
    }
  }

  const redactionSummary = {
    flags: [...globalFlags],
    replacements: globalReplacements,
    hiddenSections: HIDDEN_SECTIONS,
  };

  const displayPayload: ParsedBundleDisplay = {
    bundle: {
      source: compactText(bundleMeta.source) || "unknown",
      generatedAt: compactText(bundleMeta.generated_at),
      reportMode: compactText(bundleMeta.report_mode) || "unknown",
      skillCount: Number(bundleMeta.skill_count || previewReports.length || 0),
      reportCount: Number(bundleMeta.report_count || previewReports.length || 0),
      summaryExcerpt: ensureRecord(bundleMeta.summary_excerpt),
    },
    reports: previewReports,
    findings: findings.map((finding) => ({
      reportSkillId: finding.reportSkillId,
      findingKey: finding.findingKey,
      harmType: finding.harmType,
      vulnerabilitySurface: finding.vulnerabilitySurface,
      provider: finding.provider,
      model: finding.model,
      verdict: finding.verdict,
      reasonCode: finding.reasonCode,
      confidence: finding.confidence,
      harmfulPromptPreview: finding.harmfulPromptPreview,
      smokingGunPreview: finding.smokingGunPreview,
      evidenceSummaryPreview: finding.evidenceSummaryPreview,
      finalResponsePreview: finding.finalResponsePreview,
      trajectoryTimeline: finding.trajectoryTimeline,
      redactionFlags: finding.redactionFlags,
    })),
    redactionSummary,
  };

  return {
    bundleMeta,
    parsedIndex,
    summaryStats: summaryByGroup,
    displayPayload,
    redactionSummary,
    findings,
    artifacts,
  };
}

function parseDetailedFindingFromRunsOrganize(
  zip: AdmZip,
  normalizedFindingKey: string
): ParsedDetailedFinding | null {
  const analyzeEntries = zip
    .getEntries()
    .filter((entry) => /(^|\/)[^/]+\/[^/]+\/[^/]+_analyze\.json$/.test(entry.entryName));

  for (const analyzeEntry of analyzeEntries) {
    const segments = analyzeEntry.entryName.split("/");
    if (segments.length < 4) {
      continue;
    }

    const [, modelGroup, skillId] = segments;
    const basePath = `${segments[0]}/${modelGroup}/${skillId}`;
    const analyze = readJsonEntry(zip, analyzeEntry.entryName);
    const globalReportPath = `${basePath}/${skillId}_global_report.json`;
    const modelPath = `${basePath}/model.json`;
    const globalReport = zip.getEntry(globalReportPath) ? readJsonEntry(zip, globalReportPath) : {};
    const modelConfig = zip.getEntry(modelPath) ? readJsonEntry(zip, modelPath) : {};
    const surfaceSummary = ensureRecord(globalReport.surface_summary);
    const simulatorModel =
      compactText(ensureRecord(modelConfig.simulator).model) ||
      compactText(ensureRecord(modelConfig.attacker).model) ||
      compactText(modelGroup) ||
      undefined;
    const stageModels = extractConfiguredStageModels(modelConfig, simulatorModel);

    for (const result of ensureArray<Record<string, unknown>>(analyze.results)) {
      const surfaceId = compactText(result.id);

      if (surfaceId !== normalizedFindingKey) {
        continue;
      }

      const surfaceTitle = compactText(result.title) || surfaceId || "unknown surface";
      const surfacePath = `${basePath}/${surfaceId}`;
      const roundPaths = zip
        .getEntries()
        .filter((entry) => entry.entryName.startsWith(`${surfacePath}/`) && /round_\d+\.json$/.test(entry.entryName))
        .map((entry) => entry.entryName)
        .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
      const summary = ensureRecord(surfaceSummary[surfaceId]);
      const lastRoundPath = roundPaths[roundPaths.length - 1];
      const lastRoundJudge = lastRoundPath
        ? ensureRecord(readJsonEntry(zip, lastRoundPath).judge)
        : {};
      const rounds = roundPaths.map((entryName, index) => {
        const roundRecord = readJsonEntry(zip, entryName);
        const attack = ensureRecord(roundRecord.attack);
        const judge = ensureRecord(roundRecord.judge);
        const simulation = ensureRecord(roundRecord.simulation);
        const metadata = ensureRecord(attack.metadata);
        const target = ensureRecord(attack.target);
        const roundId =
          toNumber(roundRecord.round_id) ??
          toNumber(metadata.round_id) ??
          parseRoundNumber(entryName) ??
          index + 1;

        return {
          roundId,
          attackPrompt: sanitizeTextDetailed(attack.attack_prompt).text,
          result: compactText(judge.result) || compactText(summary.status) || "ignore",
          reason:
            sanitizeTextDetailed(judge.reason).text ||
            sanitizeTextDetailed(simulation.errors).text,
          riskType:
            compactText(target.risk_type) ||
            compactText(result.risk_type) ||
            compactText(summary.final_risk_type) ||
            "unknown",
          surfaceLevel:
            compactText(metadata.surface_level) || compactText(result.level) || "-",
          surfaceTitle:
            compactText(metadata.surface_title) || surfaceTitle,
          actionableSuggestion: sanitizeTextDetailed(judge.actionable_suggestion).text,
          attackModel: stageModels.attackModel,
          simulationModel: stageModels.simulationModel,
          judgeModel: stageModels.judgeModel,
          suggestionModel: stageModels.suggestionModel,
          simulationSteps: buildDetailedSimulationSteps(
            ensureArray<Record<string, unknown>>(simulation.steps),
            stageModels.simulationModel
          ),
        };
      });

      return {
        reportSkillId: compactText(analyze.skillname) || skillId,
        harmType:
          compactText(summary.final_risk_type) ||
          compactText(result.risk_type) ||
          "unknown",
        vulnerabilitySurface: surfaceTitle,
        model: simulatorModel,
        verdict:
          compactText(summary.status) ||
          compactText(lastRoundJudge.result) ||
          undefined,
        reasonCode: compactText(result.level) || undefined,
        rounds,
      };
    }
  }

  return null;
}

function parseDetailedFindingFromStandardizedBundle(
  zip: AdmZip,
  normalizedFindingKey: string
): ParsedDetailedFinding | null {
  const parsedIndex = readJsonEntry(zip, "standardized_reports/index.json");
  const reportEntries = ensureArray<Record<string, unknown>>(parsedIndex.reports);

  for (const reportEntry of reportEntries) {
    const reportPath = ensureString(reportEntry.report_path);
    const reportSkillId = compactText(reportEntry.skill_id);
    const reportJson = readJsonEntry(zip, reportPath);
    const skill = ensureRecord(reportJson.skill);

    for (const finding of ensureArray<Record<string, unknown>>(reportJson.findings)) {
      const findingId = compactText(finding.finding_id);

      if (findingId !== normalizedFindingKey) {
        continue;
      }

      const trajectory = ensureRecord(finding.agent_trajectory);
      const observations = ensureRecord(trajectory.execution_observations);
      const judge = ensureRecord(finding.judge);
      const stageModels = extractConfiguredStageModels(
        {},
        compactText(observations.model) || undefined
      );

      return {
        reportSkillId,
        sourceLink: sanitizeSourceLink(skill.source_link),
        harmType: compactText(finding.harm_type) || "unknown",
        vulnerabilitySurface: compactText(finding.vulnerability_surface) || "unknown",
        provider: compactText(observations.provider) || undefined,
        model: compactText(observations.model) || undefined,
        verdict: compactText(judge.verdict) || undefined,
        reasonCode: compactText(judge.reason_code) || undefined,
        confidence: toNumber(judge.confidence),
        rounds: [
          {
            roundId: 1,
            attackPrompt: sanitizeTextDetailed(finding.harmful_prompt).text,
            result: compactText(judge.verdict) || "ignore",
            reason:
              sanitizeTextDetailed(judge.reason).text ||
              sanitizeTextDetailed(pickEvidenceSummary(observations, judge)).text,
            riskType: compactText(finding.harm_type) || "unknown",
            surfaceLevel: compactText(judge.reason_code) || "-",
            surfaceTitle: compactText(finding.vulnerability_surface) || "unknown",
            actionableSuggestion: sanitizeTextDetailed(judge.actionable_suggestion).text,
            attackModel: stageModels.attackModel,
            simulationModel: stageModels.simulationModel,
            judgeModel: stageModels.judgeModel,
            suggestionModel: stageModels.suggestionModel,
            simulationSteps: buildDetailedSimulationSteps(
              ensureArray<Record<string, unknown>>(trajectory.trajectory),
              stageModels.simulationModel
            ),
          },
        ],
      };
    }
  }

  return null;
}

export function parseDetailedFindingFromBundle(
  buffer: Buffer,
  findingKey: string
): ParsedDetailedFinding | null {
  const normalizedFindingKey = compactText(findingKey);

  if (!normalizedFindingKey) {
    return null;
  }

  const zip = new AdmZip(buffer);

  if (!zip.getEntry("bundle_meta.json") || !zip.getEntry("standardized_reports/index.json")) {
    return parseDetailedFindingFromRunsOrganize(zip, normalizedFindingKey);
  }

  return parseDetailedFindingFromStandardizedBundle(zip, normalizedFindingKey);
}
