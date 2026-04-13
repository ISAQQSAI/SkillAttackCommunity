import Link from "next/link";
import type { ReactNode } from "react";

import { AuditEntryCard } from "@/components/audit-entry-card";
import { PublicVulnerabilityCard } from "@/components/public-vulnerability-card";
import {
  actionButtonClass,
  SectionHeading,
  SurfaceCard,
} from "@/components/page-chrome";
import type { Locale } from "@/lib/i18n";
import { shortPublicModelName } from "@/lib/public-model-name";
import { formatSurfaceLevelLabel } from "@/lib/public-surface-level";
import { cleanPromptForDisplay, compactDisplayText } from "@/lib/prompt-display";
import type {
  PublicSimulationStep,
  PublicSurfaceDetail as PublicSurfaceRecord,
} from "@/lib/server/public-skills";

type AuditTone =
  | "prompt"
  | "tool-call"
  | "tool-result"
  | "assistant"
  | "system"
  | "judge-danger"
  | "judge-warning"
  | "judge-neutral"
  | "suggestion"
  | "neutral";

function surfaceLevelBadgeClass(level: string) {
  const normalized = compactDisplayText(level).toLowerCase();

  if (normalized.includes("critical") || normalized.includes("严重")) {
    return "border border-red-200 bg-red-50 text-red-700";
  }

  if (normalized.includes("high") || normalized.includes("高")) {
    return "border border-orange-200 bg-orange-50 text-orange-800";
  }

  if (normalized.includes("medium") || normalized.includes("中")) {
    return "border border-amber-200 bg-amber-50 text-amber-800";
  }

  if (normalized.includes("low") || normalized.includes("低")) {
    return "border border-slate-300 bg-slate-100 text-slate-700";
  }

  return "border border-slate-300 bg-slate-100 text-slate-700";
}

function formatResultLabel(locale: Locale, result: string) {
  switch (compactDisplayText(result).toLowerCase()) {
    case "success":
      return locale === "zh" ? "成功" : "success";
    case "technical":
      return locale === "zh" ? "技术问题" : "technical";
    case "ignore":
    case "ignored":
      return locale === "zh" ? "失败" : "failed";
    default:
      return result || "-";
  }
}

function resultBadgeClass(result: string) {
  switch (compactDisplayText(result).toLowerCase()) {
    case "success":
      return "border border-red-700 bg-red-700 text-white";
    case "technical":
      return "border border-amber-200 bg-amber-100 text-amber-900";
    default:
      return "border border-slate-300 bg-slate-100 text-slate-700";
  }
}

function isSuccessfulResult(result: string) {
  return compactDisplayText(result).toLowerCase() === "success";
}

function judgeTone(result: string): AuditTone {
  switch (compactDisplayText(result).toLowerCase()) {
    case "success":
      return "judge-danger";
    case "technical":
      return "judge-warning";
    default:
      return "judge-neutral";
  }
}

function auditChipClass(tone: AuditTone) {
  switch (tone) {
    case "prompt":
      return "inline-flex items-center border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-800";
    case "tool-call":
      return "inline-flex items-center border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700";
    case "tool-result":
      return "inline-flex items-center border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-700";
    case "assistant":
      return "inline-flex items-center border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-700";
    case "system":
      return "inline-flex items-center border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700";
    case "judge-danger":
      return "inline-flex items-center border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-700";
    case "judge-warning":
      return "inline-flex items-center border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-800";
    case "suggestion":
      return "inline-flex items-center border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-700";
    default:
      return "inline-flex items-center border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700";
  }
}

function auditCardClass(tone: AuditTone) {
  switch (tone) {
    case "prompt":
      return "border border-amber-200 bg-[linear-gradient(180deg,#ffffff,#fff8ef)] px-4 py-3";
    case "tool-call":
      return "border border-blue-100 bg-[linear-gradient(180deg,#ffffff,#f5f9ff)] px-4 py-3";
    case "tool-result":
      return "border border-cyan-100 bg-[linear-gradient(180deg,#ffffff,#f4fbff)] px-4 py-3";
    case "assistant":
      return "border border-sky-100 bg-[linear-gradient(180deg,#ffffff,#f4faff)] px-4 py-3";
    case "judge-danger":
      return "border border-red-200 bg-[linear-gradient(180deg,#ffffff,#fff4f4)] px-4 py-3";
    case "judge-warning":
      return "border border-amber-200 bg-[linear-gradient(180deg,#ffffff,#fffaef)] px-4 py-3";
    case "suggestion":
      return "border border-indigo-100 bg-[linear-gradient(180deg,#ffffff,#f5f8ff)] px-4 py-3";
    default:
      return "border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] px-4 py-3";
  }
}

function timelineDotClass(tone: AuditTone) {
  switch (tone) {
    case "prompt":
      return "bg-amber-400";
    case "tool-call":
      return "bg-blue-400";
    case "tool-result":
      return "bg-cyan-400";
    case "assistant":
      return "bg-sky-400";
    case "system":
      return "bg-slate-400";
    case "judge-danger":
      return "bg-red-400";
    case "judge-warning":
      return "bg-amber-500";
    case "suggestion":
      return "bg-indigo-400";
    default:
      return "bg-slate-300";
  }
}

function simulationStepLabel(
  locale: Locale,
  type: string,
  tool: string
) {
  const normalizedType = compactDisplayText(type).toLowerCase();
  const normalizedTool = compactDisplayText(tool);

  if (normalizedType === "tool_call") {
    return normalizedTool
      ? locale === "zh"
        ? `工具调用 · ${normalizedTool}`
        : `Tool call · ${normalizedTool}`
      : locale === "zh"
        ? "工具调用"
        : "Tool call";
  }

  if (normalizedType === "tool_result") {
    return normalizedTool
      ? locale === "zh"
        ? `工具结果 · ${normalizedTool}`
        : `Tool result · ${normalizedTool}`
      : locale === "zh"
        ? "工具结果"
        : "Tool result";
  }

  if (normalizedType === "assistant_message") {
    return locale === "zh" ? "Assistant 响应" : "Assistant response";
  }

  if (normalizedType === "system_message") {
    return locale === "zh" ? "系统消息" : "System message";
  }

  return normalizedType || (locale === "zh" ? "步骤" : "Step");
}

function simulationStepPrimaryTag(locale: Locale, type: string) {
  const normalizedType = compactDisplayText(type).toLowerCase();

  if (normalizedType === "tool_call") {
    return locale === "zh" ? "调用" : "Call";
  }

  if (normalizedType === "tool_result") {
    return locale === "zh" ? "结果" : "Result";
  }

  if (normalizedType === "assistant_message") {
    return "Assistant";
  }

  if (normalizedType === "system_message") {
    return locale === "zh" ? "系统" : "System";
  }

  return locale === "zh" ? "步骤" : "Step";
}

function simulationStepTone(type: string, isError: boolean): AuditTone {
  if (isError) {
    return "judge-danger";
  }

  const normalizedType = compactDisplayText(type).toLowerCase();

  if (normalizedType === "assistant_message") {
    return "assistant";
  }

  if (normalizedType === "tool_call") {
    return "tool-call";
  }

  if (normalizedType === "tool_result") {
    return "tool-result";
  }

  if (normalizedType === "system_message") {
    return "system";
  }

  return "neutral";
}

function isMonospaceStep(step: PublicSimulationStep) {
  const normalizedType = compactDisplayText(step.type).toLowerCase();
  return normalizedType === "tool_call" || normalizedType === "tool_result";
}

function formatTimestamp(locale: Locale, value: Date | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function formatStageModelLabel(locale: Locale, value?: string) {
  const model = shortPublicModelName(value);
  if (!model) {
    return undefined;
  }

  return locale === "zh" ? `模型 · ${model}` : `Model · ${model}`;
}

function TimelineEntry({
  indexLabel,
  tone,
  isLast,
  children,
}: {
  indexLabel: string;
  tone: AuditTone;
  isLast: boolean;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3 sm:grid-cols-[2rem_minmax(0,1fr)] sm:gap-4">
      <div className="flex min-h-full flex-col items-center">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {indexLabel}
        </div>
        <span className={`mt-2 h-2.5 w-2.5 rounded-full border border-white shadow-sm ${timelineDotClass(tone)}`} />
        {!isLast ? (
          <span className="mt-2 w-px flex-1 min-h-6 bg-[linear-gradient(180deg,rgba(148,163,184,0.75),rgba(226,232,240,0.3))]" />
        ) : null}
      </div>
      <div className="pb-4">{children}</div>
    </div>
  );
}

export function PublicSurfaceDetail({
  locale,
  surface,
}: {
  locale: Locale;
  surface: PublicSurfaceRecord;
}) {
  const headerMetaEntries = [
    {
      label: "SKILL",
      value: surface.skillDisplayName || "-",
    },
    {
      label: locale === "zh" ? "风险类型" : "Risk Type",
      value: surface.riskType || "-",
    },
    {
      label: locale === "zh" ? "AGENT模型" : "Agent Model",
      value: shortPublicModelName(surface.agentModel) || compactDisplayText(surface.agentModel) || "-",
    },
  ];
  const orderedRounds = [...surface.rounds].sort((left, right) => {
    const leftRoundId = Number(left.roundId) || 0;
    const rightRoundId = Number(right.roundId) || 0;
    return rightRoundId - leftRoundId || right.id.localeCompare(left.id);
  });
  const latestSuccessfulRoundId =
    [...surface.rounds]
      .filter((round) => isSuccessfulResult(round.result))
      .sort((left, right) => (Number(right.roundId) || 0) - (Number(left.roundId) || 0))[0]?.id ||
    null;
  const copy =
    locale === "zh"
      ? {
          roundLabel: "第",
          roundSuffix: "轮",
          expandRound: "展开本轮",
          collapseRound: "收起本轮",
          traceTitle: "攻击轨迹日志",
          traceBody:
            "按轮次把攻击输入、工具动作、Assistant 响应和裁决信息整理成可追溯的事件记录。",
          promptTag: "输入",
          promptTitle: "发送给技能的攻击提示词",
          emptyStepTag: "空",
          emptyStepTitle: "这一轮没有记录到可展示的模拟步骤",
          judgeTag: "裁决",
          judgeTitle: "裁决理由",
          suggestionTag: "建议",
          suggestionTitle: "可执行建议",
          eventsSummary: (total: number, simulationSteps: number) =>
            `共 ${total} 条记录，其中 ${simulationSteps} 条来自模拟步骤。`,
          resultPrefix: "攻击结果",
          levelPrefix: "潜在漏洞等级",
        }
      : {
          roundLabel: "Round",
          roundSuffix: "",
          expandRound: "Expand round",
          collapseRound: "Collapse round",
          traceTitle: "Attack trace log",
          traceBody:
            "Each round is rendered as an auditable timeline of prompt, tool actions, assistant responses, and judge outcome.",
          promptTag: "Prompt",
          promptTitle: "Prompt issued to the skill",
          emptyStepTag: "Empty",
          emptyStepTitle: "No simulation steps were recorded in this round",
          judgeTag: "Judge",
          judgeTitle: "Judge reason",
          suggestionTag: "Action",
          suggestionTitle: "Actionable follow-up",
          eventsSummary: (total: number, simulationSteps: number) =>
            `${total} logged events, including ${simulationSteps} simulation steps.`,
          resultPrefix: "Attack result",
          levelPrefix: "Potential severity",
        };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-3">
        <Link href="/vulnerabilities" className={actionButtonClass("secondary")}>
          {locale === "zh" ? "返回轨迹列表" : "Back to traces"}
        </Link>
        <Link
          href={`/skills/${encodeURIComponent(surface.skillId)}`}
          className={actionButtonClass("ghost")}
        >
          {locale === "zh" ? "查看该 skill" : "Open skill"}
        </Link>
      </div>

      <PublicVulnerabilityCard
        locale={locale}
        item={surface}
        variant="list"
        showDetailButton={false}
        showOrdinalBadge
        showPrompt={false}
        titleSize="detail"
        showMeta={false}
        headerMetaEntries={headerMetaEntries}
      />

      <SurfaceCard>
        <SectionHeading
          title={copy.traceTitle}
          description={copy.traceBody}
        />

        <div className="mt-5 grid gap-5">
          {orderedRounds.map((round) => {
            const normalizedResult = formatResultLabel(locale, round.result);
            const localizedSurfaceLevel = formatSurfaceLevelLabel(locale, round.surfaceLevel);
            const auditRows = [
              {
                id: `${round.id}-prompt`,
                indexLabel: "P",
                tone: "prompt" as AuditTone,
                primaryTag: copy.promptTag,
                secondaryTag: undefined,
                title: copy.promptTitle,
                content: cleanPromptForDisplay(round.attackPrompt) || "-",
                meta: undefined,
                monospace: false,
                model: round.attackModel || surface.agentModel,
              },
              ...(round.simulationSteps.length
                ? round.simulationSteps.map((step) => ({
                    id: step.id,
                    indexLabel: String(step.stepIndex),
                    tone: simulationStepTone(step.type, step.isError),
                    primaryTag: simulationStepPrimaryTag(locale, step.type),
                    secondaryTag: compactDisplayText(step.tool) || undefined,
                    title: simulationStepLabel(locale, step.type, step.tool),
                    content: step.content || "-",
                    meta: formatTimestamp(locale, step.timestamp),
                    monospace: isMonospaceStep(step),
                    model:
                      step.model ||
                      round.simulationModel ||
                      round.attackModel ||
                      surface.agentModel,
                  }))
                : [
                    {
                      id: `${round.id}-no-steps`,
                      indexLabel: "0",
                      tone: "neutral" as AuditTone,
                      primaryTag: copy.emptyStepTag,
                      secondaryTag: undefined,
                      title: copy.emptyStepTitle,
                      content:
                        locale === "zh"
                          ? "这轮没有留下可公开展示的 simulation steps。"
                          : "No public-safe simulation steps were retained for this round.",
                      meta: undefined,
                      monospace: false,
                      model: round.simulationModel || surface.agentModel,
                    },
                  ]),
              {
                id: `${round.id}-judge`,
                indexLabel: "J",
                tone: judgeTone(round.result),
                primaryTag: copy.judgeTag,
                secondaryTag: normalizedResult,
                title: copy.judgeTitle,
                content: round.reason || "-",
                meta: undefined,
                monospace: false,
                model: round.judgeModel || surface.agentModel,
              },
              ...(round.actionableSuggestion
                ? [
                    {
                      id: `${round.id}-suggestion`,
                      indexLabel: "A",
                      tone: "suggestion" as AuditTone,
                      primaryTag: copy.suggestionTag,
                      secondaryTag: undefined,
                      title: copy.suggestionTitle,
                      content: round.actionableSuggestion || "-",
                      meta: undefined,
                      monospace: false,
                      model:
                        round.suggestionModel ||
                        round.judgeModel ||
                        surface.agentModel,
                    },
                  ]
                : []),
            ];

            return (
              <details
                key={round.id}
                open={round.id === latestSuccessfulRoundId}
                className="group overflow-hidden border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,250,255,0.96))]"
              >
                <summary className="grid cursor-pointer gap-3 bg-[linear-gradient(180deg,#fbfdff,#f4f8fd)] px-5 py-4 [&::-webkit-details-marker]:hidden md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                  <div className="grid gap-2.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span className="border border-slate-300 bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                        {locale === "zh"
                          ? `${copy.roundLabel}${round.roundId}${copy.roundSuffix}`
                          : `${copy.roundLabel} ${round.roundId}`}
                      </span>
                      <span className={`px-3 py-1 font-semibold ${resultBadgeClass(round.result)}`}>
                        {`${copy.resultPrefix}: ${normalizedResult}`}
                      </span>
                      <span className={`px-3 py-1 font-semibold ${surfaceLevelBadgeClass(round.surfaceLevel)}`}>
                        {`${copy.levelPrefix}: ${localizedSurfaceLevel}`}
                      </span>
                      {round.riskType ? (
                        <span className="border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600">
                          {round.riskType}
                        </span>
                      ) : null}
                    </div>

                    <div className="text-lg font-semibold tracking-[-0.035em] text-slate-950">
                      {round.surfaceTitle || surface.surfaceTitle}
                    </div>

                    <div className="text-sm leading-6 text-slate-500">
                      {copy.eventsSummary(auditRows.length, round.simulationSteps.length)}
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-2 self-start text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400 transition hover:text-slate-600">
                    <span className="group-open:hidden">{copy.expandRound}</span>
                    <span className="hidden group-open:inline">{copy.collapseRound}</span>
                    <span className="text-base leading-none transition group-open:rotate-45">+</span>
                  </span>
                </summary>

                <div className="border-t border-slate-200 bg-white/80 px-4 py-4 sm:px-5">
                  <div className="grid gap-1">
                    {auditRows.map((row, index) => (
                      <TimelineEntry
                        key={row.id}
                        indexLabel={row.indexLabel}
                        tone={row.tone}
                        isLast={index === auditRows.length - 1}
                      >
                        <AuditEntryCard
                          locale={locale}
                          className={auditCardClass(row.tone)}
                          badges={[
                            { label: row.primaryTag, className: auditChipClass(row.tone) },
                            ...(row.secondaryTag
                              ? [
                                  {
                                    label: row.secondaryTag,
                                    className:
                                      "inline-flex max-w-full items-center border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500",
                                  },
                                ]
                              : []),
                            ...(formatStageModelLabel(locale, row.model)
                              ? [
                                  {
                                    label: formatStageModelLabel(locale, row.model) as string,
                                    className:
                                      "inline-flex max-w-full items-center border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800",
                                  },
                                ]
                              : []),
                          ]}
                          title={row.title}
                          meta={row.meta}
                          content={row.content}
                          monospace={row.monospace}
                        />
                      </TimelineEntry>
                    ))}
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </SurfaceCard>
    </div>
  );
}
