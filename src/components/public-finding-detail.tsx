import { PublicSurfaceDetail } from "@/components/public-surface-detail";
import { compactDisplayText } from "@/lib/prompt-display";
import { parseSkillPresentation } from "@/lib/public-presentation";
import { readJsonList, readJsonRecord } from "@/lib/public-case-routing";
import { parseDetailedFindingFromBundle } from "@/lib/server/report-bundle-parser";
import type {
  PublicSimulationStep,
  PublicSurfaceDetail as PublicSurfaceDetailRecord,
} from "@/lib/server/public-skills";
import { readSubmissionBundle } from "@/lib/server/submission-storage";
import type { Locale } from "@/lib/i18n";
import type { getPublicCaseBySlug } from "@/lib/server/report-submissions";

type PublicCaseRecord = NonNullable<Awaited<ReturnType<typeof getPublicCaseBySlug>>>;

function normalizeResult(value: unknown) {
  const normalized = compactDisplayText(String(value || "")).toLowerCase();

  switch (normalized) {
    case "attack_success":
    case "success":
      return "success";
    case "technical":
      return "technical";
    case "ignored":
    case "ignore":
      return "ignore";
    default:
      return normalized || "ignore";
  }
}

function buildSimulationSteps(
  finding: Record<string, unknown>,
  fallbackId: string,
  fallbackModel: string
): PublicSimulationStep[] {
  return readJsonList(finding.trajectoryTimeline)
    .map((item, index) => {
      const step = readJsonRecord(item);
      const stepIndex = Number(step.stepIndex || index + 1);

      return {
        id: `${fallbackId}-step-${stepIndex}`,
        stepIndex,
        type: String(step.type || ""),
        tool: String(step.tool || ""),
        content: String(step.summary || ""),
        isError: step.status === "error",
        timestamp: null,
        model: fallbackModel || undefined,
      };
    })
    .filter((step) => step.content);
}

function buildSurfaceFromFinding({
  result,
  finding,
  findingIndex,
}: {
  result: PublicCaseRecord;
  finding: Record<string, unknown>;
  findingIndex: number;
}): PublicSurfaceDetailRecord {
  const findingKey = String(finding.findingKey || `finding-${findingIndex + 1}`);
  const skillId = String(finding.reportSkillId || "").trim();
  const presentation = parseSkillPresentation(skillId);
  const judgeSummary = readJsonRecord(finding.judgeSummary);
  const verdict = normalizeResult(finding.verdict || judgeSummary.verdict);
  const surfaceTitle =
    String(finding.vulnerabilitySurface || "").trim() ||
    String(finding.harmType || "").trim() ||
    result.title;
  const surfaceLevel = String(finding.reasonCode || "").trim() || "-";
  const riskType = String(finding.harmType || "").trim() || "-";
  const attackPrompt = String(finding.harmfulPromptPreview || "").trim();
  const reason =
    String(judgeSummary.reason || "").trim() ||
    String(finding.evidenceSummaryPreview || "").trim() ||
    String(finding.finalResponsePreview || "").trim();
  const actionableSuggestion = String(judgeSummary.actionableSuggestion || "").trim();
  const agentModel = String(finding.model || "").trim();
  const simulationSteps = buildSimulationSteps(finding, findingKey, agentModel);
  const updatedAt = result.publishedAt ? new Date(result.publishedAt) : null;
  const roundCount = Number(judgeSummary.rounds || 1) || 1;

  return {
    id: `${result.slug}:${findingKey}`,
    slug: result.slug,
    skillId,
    skillLabel: presentation.skillLabel,
    ownerLabel: presentation.ownerLabel,
    ordinal: presentation.ordinal,
    skillDisplayName: presentation.targetLabel || skillId || "-",
    surfaceId: findingKey,
    surfaceOrdinal: String(findingIndex + 1),
    surfaceTitle,
    surfaceLevel,
    result: verdict,
    riskType,
    roundCount,
    updatedAt,
    attackPrompt,
    latestAttackPrompt: attackPrompt,
    finalReason: reason,
    finalRoundId: 1,
    agentModel: agentModel || "-",
    models: agentModel ? [agentModel] : [],
    rounds: [
      {
        id: `${findingKey}-round-1`,
        roundId: 1,
        phase: "",
        attackPrompt,
        result: verdict,
        reason,
        riskType,
        successCondition: "",
        strategy: "",
        surfaceTitle,
        surfaceLevel,
        actionableSuggestion,
        attackModel: agentModel || undefined,
        simulationModel: agentModel || undefined,
        judgeModel: agentModel || undefined,
        suggestionModel: agentModel || undefined,
        simulationSteps,
        updatedAt,
      },
    ],
  };
}

async function buildSurfaceWithDetail({
  result,
  finding,
  findingIndex,
}: {
  result: PublicCaseRecord;
  finding: Record<string, unknown>;
  findingIndex: number;
}) {
  const fallbackSurface = buildSurfaceFromFinding({
    result,
    finding,
    findingIndex,
  });
  const storageKey = result.submission?.parsedBundle?.storageKey;

  if (!storageKey) {
    return fallbackSurface;
  }

  try {
    const buffer = await readSubmissionBundle(storageKey);
    const detailedFinding = parseDetailedFindingFromBundle(
      buffer,
      String(finding.findingKey || "")
    );

    if (!detailedFinding || !detailedFinding.rounds.length) {
      return fallbackSurface;
    }

    const latestRound = detailedFinding.rounds[detailedFinding.rounds.length - 1];

    return {
      ...fallbackSurface,
      skillId: detailedFinding.reportSkillId || fallbackSurface.skillId,
      surfaceTitle: detailedFinding.vulnerabilitySurface || fallbackSurface.surfaceTitle,
      surfaceLevel: detailedFinding.reasonCode || latestRound.surfaceLevel || fallbackSurface.surfaceLevel,
      result: normalizeResult(detailedFinding.verdict || latestRound.result || fallbackSurface.result),
      riskType: detailedFinding.harmType || latestRound.riskType || fallbackSurface.riskType,
      roundCount: detailedFinding.rounds.length,
      attackPrompt: detailedFinding.rounds[0]?.attackPrompt || fallbackSurface.attackPrompt,
      latestAttackPrompt: latestRound.attackPrompt || fallbackSurface.latestAttackPrompt,
      finalReason: latestRound.reason || fallbackSurface.finalReason,
      finalRoundId: latestRound.roundId || fallbackSurface.finalRoundId,
      agentModel: detailedFinding.model || fallbackSurface.agentModel,
      models: detailedFinding.model ? [detailedFinding.model] : fallbackSurface.models,
      rounds: detailedFinding.rounds.map((round, index) => ({
        id: `${fallbackSurface.surfaceId}-round-${round.roundId || index + 1}`,
        roundId: round.roundId || index + 1,
        phase: "",
        attackPrompt: round.attackPrompt,
        result: normalizeResult(round.result),
        reason: round.reason,
        riskType: round.riskType || detailedFinding.harmType || fallbackSurface.riskType,
        successCondition: "",
        strategy: "",
        surfaceTitle: round.surfaceTitle || fallbackSurface.surfaceTitle,
        surfaceLevel: round.surfaceLevel || fallbackSurface.surfaceLevel,
        actionableSuggestion: round.actionableSuggestion,
        attackModel: round.attackModel || detailedFinding.model || fallbackSurface.agentModel,
        simulationModel:
          round.simulationModel || detailedFinding.model || fallbackSurface.agentModel,
        judgeModel: round.judgeModel || detailedFinding.model || fallbackSurface.agentModel,
        suggestionModel:
          round.suggestionModel ||
          round.judgeModel ||
          detailedFinding.model ||
          fallbackSurface.agentModel,
        simulationSteps: round.simulationSteps.map((step) => ({
          id: `${fallbackSurface.surfaceId}-round-${round.roundId || index + 1}-step-${step.stepIndex}`,
          ...step,
        })),
        updatedAt: result.publishedAt ? new Date(result.publishedAt) : null,
      })),
    } satisfies PublicSurfaceDetailRecord;
  } catch {
    return fallbackSurface;
  }
}

export async function PublicFindingDetail({
  locale,
  result,
  finding,
  findingIndex,
}: {
  locale: Locale;
  result: PublicCaseRecord;
  finding: Record<string, unknown>;
  findingIndex: number;
}) {
  const surface = await buildSurfaceWithDetail({
    result,
    finding,
    findingIndex,
  });

  return <PublicSurfaceDetail locale={locale} surface={surface} />;
}
