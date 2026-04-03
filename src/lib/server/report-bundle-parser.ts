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
  visibility: "admin_only" | "preview_only" | "public_case";
  fileName: string;
  pathInBundle?: string;
  contentType: string;
  sizeBytes: number;
  redactionFlags: string[];
  previewText?: string;
}

export interface ParsedBundlePreview {
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
  previewPayload: ParsedBundlePreview;
  redactionSummary: ParsedBundlePreview["redactionSummary"];
  findings: ParsedSubmissionFinding[];
  artifacts: ParsedSubmissionArtifact[];
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

export function parseReportBundle(buffer: Buffer): ParsedReportBundle {
  const zip = new AdmZip(buffer);
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
  const previewReports: ParsedBundlePreview["reports"] = [];

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

  const previewPayload: ParsedBundlePreview = {
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
    previewPayload,
    redactionSummary,
    findings,
    artifacts,
  };
}
