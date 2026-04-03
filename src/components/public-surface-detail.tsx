import Link from "next/link";

import { PublicVulnerabilityCard } from "@/components/public-vulnerability-card";
import {
  actionButtonClass,
  SectionHeading,
  SurfaceCard,
} from "@/components/page-chrome";
import type { Locale } from "@/lib/i18n";
import { cleanPromptForDisplay, compactDisplayText } from "@/lib/prompt-display";
import type { PublicSurfaceDetail as PublicSurfaceRecord } from "@/lib/server/public-skills";

type StageTone = "attack" | "simulation" | "judge-danger" | "judge-warning" | "judge-neutral" | "strategy";

function resultBadgeClass(result: string) {
  switch (compactDisplayText(result).toLowerCase()) {
    case "success":
      return "border border-red-200 bg-red-50 text-red-700";
    case "technical":
      return "border border-amber-200 bg-amber-100 text-amber-900";
    default:
      return "border border-slate-300 bg-slate-100 text-slate-700";
  }
}

function judgeStageTone(result: string): StageTone {
  switch (compactDisplayText(result).toLowerCase()) {
    case "success":
      return "judge-danger";
    case "technical":
      return "judge-warning";
    default:
      return "judge-neutral";
  }
}

function stagePanelClass(tone: StageTone) {
  switch (tone) {
    case "attack":
      return "grid gap-3 border border-amber-200 border-l-4 border-l-amber-500 bg-[linear-gradient(180deg,#ffffff,#fff8ef)] p-4";
    case "simulation":
      return "grid gap-3 border border-sky-200 border-l-4 border-l-sky-500 bg-[linear-gradient(180deg,#ffffff,#f3f8ff)] p-4";
    case "judge-danger":
      return "grid gap-3 border border-red-200 border-l-4 border-l-red-500 bg-[linear-gradient(180deg,#ffffff,#fff4f4)] p-4";
    case "judge-warning":
      return "grid gap-3 border border-amber-200 border-l-4 border-l-amber-500 bg-[linear-gradient(180deg,#ffffff,#fffaef)] p-4";
    case "strategy":
      return "grid gap-3 border border-[#c8d5ea] border-l-4 border-l-[#244980] bg-[linear-gradient(180deg,#ffffff,#f5f8fd)] p-4";
    default:
      return "grid gap-3 border border-slate-200 border-l-4 border-l-slate-400 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-4";
  }
}

function stageLabelClass(tone: StageTone) {
  switch (tone) {
    case "attack":
      return "inline-flex self-start border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-800";
    case "simulation":
      return "inline-flex self-start border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700";
    case "judge-danger":
      return "inline-flex self-start border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-700";
    case "judge-warning":
      return "inline-flex self-start border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-800";
    case "strategy":
      return "inline-flex self-start border border-[#c8d5ea] bg-[#f1f6fd] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#244980]";
    default:
      return "inline-flex self-start border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600";
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

function simulationStepTone(type: string, isError: boolean) {
  if (isError) {
    return {
      card: "border-rose-100 border-l-4 border-l-rose-300 bg-rose-50/70",
      dot: "before:bg-rose-300",
    };
  }

  const normalizedType = compactDisplayText(type).toLowerCase();

  if (normalizedType === "assistant_message") {
    return {
      card: "border-sky-100 border-l-4 border-l-sky-300 bg-sky-50/55",
      dot: "before:bg-sky-300",
    };
  }

  if (normalizedType === "tool_call") {
    return {
      card: "border-blue-100 border-l-4 border-l-blue-300 bg-blue-50/55",
      dot: "before:bg-blue-300",
    };
  }

  if (normalizedType === "tool_result") {
    return {
      card: "border-cyan-100 border-l-4 border-l-cyan-300 bg-cyan-50/55",
      dot: "before:bg-cyan-300",
    };
  }

  return {
    card: "border-slate-200 border-l-4 border-l-slate-300 bg-white",
    dot: "before:bg-slate-300",
  };
}

function scrollTextClass() {
  return "max-h-[7rem] overflow-y-auto pr-2 text-sm leading-7 text-slate-700";
}

export function PublicSurfaceDetail({
  locale,
  surface,
}: {
  locale: Locale;
  surface: PublicSurfaceRecord;
}) {
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-3">
        <Link href="/vulnerabilities" className={actionButtonClass("secondary")}>
          {locale === "zh" ? "返回攻击面列表" : "Back to surfaces"}
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
        showPrompt={false}
        titleSize="detail"
        showMeta={false}
      />

      <SurfaceCard>
        <SectionHeading
          title={locale === "zh" ? "Round 轨迹" : "Round history"}
          description={
            locale === "zh"
              ? "逐轮展开 Attack Prompt、simulation steps 与 judge 结果。失败轮次会附带 reason 和 actionable suggestion。"
              : "Each round expands the attack prompt, simulation steps, and judge result. Failed rounds also keep the reason and actionable suggestion."
          }
        />
        <div className="mt-4 grid gap-4">
          {surface.rounds.map((round) => (
            <details
              key={round.id}
              open={round.roundId === surface.rounds[0]?.roundId}
              className="group border border-slate-200 bg-slate-50 open:bg-slate-50"
            >
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="border border-slate-300 bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                    {`Round ${round.roundId}`}
                  </span>
                  <span className={`px-3 py-1 font-semibold ${resultBadgeClass(round.result)}`}>
                    {round.result}
                  </span>
                </div>
                <span className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                  <span>{locale === "zh" ? "展开详情" : "Toggle detail"}</span>
                  <span className="text-base leading-none transition group-open:rotate-45">+</span>
                </span>
              </summary>

              <div className="grid gap-4 border-t border-slate-200 px-5 py-5">
                <div className={stagePanelClass("attack")}>
                  <div className={stageLabelClass("attack")}>
                    {locale === "zh" ? "Attack Prompt" : "Attack prompt"}
                  </div>
                  <div className={scrollTextClass()}>
                    {cleanPromptForDisplay(round.attackPrompt) || "-"}
                  </div>
                </div>

                <div className={stagePanelClass("simulation")}>
                  <div className={stageLabelClass("simulation")}>
                    {locale === "zh" ? "Simulation Steps" : "Simulation steps"}
                  </div>
                  {round.simulationSteps.length ? (
                    <div className="border-l border-slate-200 pl-5">
                      <div className="grid gap-3">
                        {round.simulationSteps.map((step) => {
                          const tone = simulationStepTone(step.type, step.isError);

                          return (
                            <div
                              key={step.id}
                              className={`relative border p-4 before:absolute before:-left-[1.625rem] before:top-5 before:h-2.5 before:w-2.5 before:rounded-full before:border before:border-white before:content-[''] ${tone.card} ${tone.dot}`}
                            >
                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                <span className="border border-slate-300 bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                                  {`Step ${step.stepIndex}`}
                                </span>
                                <span className="border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-700">
                                  {simulationStepLabel(locale, step.type, step.tool)}
                                </span>
                              </div>
                              <div className={`mt-3 ${scrollTextClass()}`}>
                                {step.content || "-"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-500">
                      {locale === "zh"
                        ? "这一轮没有可展示的 simulation steps。"
                        : "No simulation steps were recorded for this round."}
                    </div>
                  )}
                </div>

                <div className={stagePanelClass(judgeStageTone(round.result))}>
                  <div className={stageLabelClass(judgeStageTone(round.result))}>
                    {locale === "zh" ? "Judge" : "Judge"}
                  </div>
                  <div className="grid gap-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className={`px-3 py-1 font-semibold ${resultBadgeClass(round.result)}`}>
                        {round.result}
                      </span>
                    </div>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                          {locale === "zh" ? "Reason" : "Reason"}
                        </div>
                        <div className={scrollTextClass()}>
                          {round.reason || "-"}
                        </div>
                      </div>
                      {round.actionableSuggestion ? (
                        <div className="grid gap-2 border-t border-slate-200 pt-4">
                          <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                            {locale === "zh" ? "Actionable Suggestion" : "Actionable suggestion"}
                          </div>
                          <div className={scrollTextClass()}>
                            {round.actionableSuggestion || "-"}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </details>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}
