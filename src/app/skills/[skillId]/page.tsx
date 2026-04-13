import AdmZip from "adm-zip";
import Link from "next/link";
import { notFound } from "next/navigation";
import { promises as fs } from "node:fs";

import { PublicVulnerabilityCard } from "@/components/public-vulnerability-card";
import {
  actionButtonClass,
  SectionHeading,
  SurfaceCard,
} from "@/components/page-chrome";
import { shortPublicModelName } from "@/lib/public-model-name";
import { formatSurfaceLevelLabel } from "@/lib/public-surface-level";
import { getSkillVaultSkillArchive } from "@/lib/skill-vault";
import { getLocale } from "@/lib/server/locale";
import { getPublicSkillArchiveDownload } from "@/lib/server/report-submissions";
import { getPublicSkillById } from "@/lib/server/public-skills";

function formatNumber(locale: string, value: number, suffix?: string) {
  const formatted = new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);

  return `${formatted}${suffix || ""}`;
}

function compactText(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
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

function parseSkillMarkdownIntro(markdown: string) {
  const source = String(markdown || "").replace(/\r\n/g, "\n");
  const frontmatter = source.match(/^---\s*\n([\s\S]*?)\n---/);

  if (frontmatter) {
    const lines = frontmatter[1].split("\n");
    for (let index = 0; index < lines.length; index += 1) {
      const match = lines[index]?.match(/^description:\s*(.*)$/i);
      if (!match) {
        continue;
      }

      const inlineValue = String(match[1] || "").trim();
      if (/^[>|]-?$/.test(inlineValue)) {
        const collected: string[] = [];
        for (let nestedIndex = index + 1; nestedIndex < lines.length; nestedIndex += 1) {
          const nextLine = lines[nestedIndex] || "";
          if (!nextLine.trim()) {
            continue;
          }
          if (!/^\s+/.test(nextLine)) {
            break;
          }
          collected.push(nextLine.replace(/^\s+/, ""));
        }
        const description = compactText(collected.join(" "));
        if (description) {
          return description;
        }
      } else {
        const description = compactText(stripWrappedQuotes(inlineValue));
        if (description) {
          return description;
        }
      }
    }
  }

  const body = source
    .replace(/^---\s*\n[\s\S]*?\n---\s*/i, "")
    .replace(/```[\s\S]*?```/g, " ")
    .split(/\n\s*\n/);

  for (const paragraph of body) {
    const normalized = compactText(paragraph.replace(/^#+\s*/gm, ""));
    if (normalized) {
      return normalized;
    }
  }

  return "";
}

async function readSkillIntroFromArchivePath(archivePath?: string | null) {
  if (!archivePath) {
    return "";
  }

  try {
    const buffer = await fs.readFile(archivePath);
    const zip = new AdmZip(buffer);
    const skillEntry = zip
      .getEntries()
      .find((entry) => /(^|\/)skill\.md$/i.test(entry.entryName));

    if (!skillEntry) {
      return "";
    }

    return parseSkillMarkdownIntro(skillEntry.getData().toString("utf-8"));
  } catch {
    return "";
  }
}

async function readSkillIntroFromArchiveBuffer(buffer?: Buffer | null) {
  if (!buffer) {
    return "";
  }

  try {
    const zip = new AdmZip(buffer);
    const skillEntry = zip
      .getEntries()
      .find((entry) => /(^|\/)skill\.md$/i.test(entry.entryName));

    if (!skillEntry) {
      return "";
    }

    return parseSkillMarkdownIntro(skillEntry.getData().toString("utf-8"));
  } catch {
    return "";
  }
}

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ skillId: string }>;
}) {
  const locale = await getLocale();
  const { skillId: rawSkillId } = await params;
  const skillId = decodeURIComponent(rawSkillId);
  const [record, skillArchive] = await Promise.all([
    getPublicSkillById(skillId),
    getSkillVaultSkillArchive(skillId),
  ]);

  if (!record) {
    notFound();
  }

  const hasPublishedCaseSurface = record.surfaces.some((surface) => !surface.slug.includes("__"));
  const skillArchiveUrl = skillArchive
    ? `/api/skill-vault/skills/${encodeURIComponent(skillId)}/skill`
    : hasPublishedCaseSurface
      ? `/api/public/skills/${encodeURIComponent(skillId)}/skill`
      : null;
  const publicSkillArchive = !skillArchiveUrl || skillArchive ? null : await getPublicSkillArchiveDownload(skillId);
  const fallbackSkillIntro =
    record.skillDescription && record.skillDescription !== record.representativeSummary
      ? record.skillDescription
      : "";
  const skillIntro =
    (await readSkillIntroFromArchivePath(skillArchive?.path)) ||
    (await readSkillIntroFromArchiveBuffer(publicSkillArchive?.buffer)) ||
    fallbackSkillIntro;
  const displayAgentModels = Array.from(
    new Set(record.agentModels.map((model) => shortPublicModelName(model)).filter(Boolean))
  );

  const copy =
    locale === "zh"
      ? {
          badge: "Skill 详情",
          overview: "Skill 概览",
          owner: "归属方",
          skillId: "Skill ID",
          intro: "Description",
          introEmpty: "skill.zip 中未提供 description。",
          coverage: "覆盖情况",
          riskTypes: "风险类型",
          surfaceLevels: "潜在漏洞等级",
          agentModels: "Agent 模型",
          downloadSkill: "下载 skill.zip",
          downloadLabel: "Skill 文件",
          downloadHint: "获取该 skill 的原始压缩包，用于本地查看与复现。",
          downloadNow: "立即下载",
          downloadUnavailable: "skill.zip 暂不可下载",
          coverageSummary: "基于当前公开轨迹统计。",
        }
      : {
          badge: "Skill detail",
          overview: "Skill overview",
          owner: "Owner",
          skillId: "Skill ID",
          intro: "Description",
          introEmpty: "No description found in skill.zip.",
          coverage: "Coverage",
          riskTypes: "Risk types",
          surfaceLevels: "Potential severity",
          agentModels: "Agent models",
          downloadSkill: "Download skill.zip",
          downloadLabel: "Skill file",
          downloadHint: "Get the original skill archive for local inspection and reproduction.",
          downloadNow: "Download now",
          downloadUnavailable: "skill.zip is not available",
          coverageSummary: "Based on current public traces.",
        };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-3">
        <Link href="/vulnerabilities" className={actionButtonClass("secondary")}>
          {locale === "zh" ? "返回轨迹列表" : "Back to traces"}
        </Link>
        <Link href="/home" className={actionButtonClass("ghost")}>
          {locale === "zh" ? "返回首页" : "Back to home"}
        </Link>
      </div>

      <section className="border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(243,248,255,0.98))] px-6 py-6 text-slate-900 shadow-[0_20px_44px_rgba(15,23,42,0.05)] sm:px-8 sm:py-7">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,0.52fr)_minmax(0,0.52fr)_minmax(0,0.52fr)] xl:items-stretch">
          <div className="grid content-center gap-4 border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] px-6 py-6 sm:px-8">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {copy.badge}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              {record.ordinal ? (
                <span className="border border-slate-300 bg-slate-100 px-3 py-1 font-medium text-slate-900">
                  {`#${record.ordinal}`}
                </span>
              ) : null}
              <span className="border border-slate-300 bg-white px-3 py-1 font-medium text-slate-700">
                {record.ownerLabel}
              </span>
            </div>
            <h1 className="max-w-5xl text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-[2.6rem]">
              {record.skillDisplayName}
            </h1>
          </div>

          {[
            {
              label: locale === "zh" ? "轨迹" : "Traces",
              value: formatNumber(locale, record.surfaceCount),
              hint: locale === "zh" ? "当前公开轨迹条目" : "public trace entries",
            },
            {
              label: locale === "zh" ? "风险类型" : "Risk Types",
              value: formatNumber(locale, record.riskTypes.length),
              hint: locale === "zh" ? "当前覆盖的风险类型数" : "covered risk type count",
            },
            {
              label: locale === "zh" ? "模型数" : "Models",
              value: formatNumber(locale, record.modelCount),
              hint: locale === "zh" ? "覆盖的 agent model" : "covered agent models",
            },
          ].map((stat) => (
            <div
              key={String(stat.label)}
              className="grid h-full grid-rows-[auto_1fr_auto] items-center border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f6faff)] px-5 py-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
            >
              <div className="justify-self-center border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                {stat.label}
              </div>
              <div className="grid place-items-center py-3">
                <div className="text-5xl font-semibold tracking-[-0.07em] text-slate-950 sm:text-6xl">
                  {stat.value}
                </div>
              </div>
              <div className="text-center text-[13px] leading-5 text-slate-500">{stat.hint}</div>
            </div>
          ))}
        </div>
      </section>

      <SurfaceCard className="grid gap-5">
        <SectionHeading title={copy.overview} />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] xl:items-start">
            <div className="grid gap-3">
              <div className="grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2">
                <div className="grid gap-1 bg-white px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {copy.owner}
                </div>
                <div className="text-sm font-medium text-slate-900">{record.ownerLabel}</div>
              </div>
              <div className="grid gap-1 bg-white px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {copy.skillId}
                </div>
                <div className="break-all text-sm font-medium text-slate-900">{record.skillId}</div>
                </div>
              </div>

              <div className="grid gap-2 border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] px-4 py-3.5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {copy.intro}
                </div>
                <div className="text-sm leading-7 text-slate-700">
                  {skillIntro || copy.introEmpty}
                </div>
              </div>

            {skillArchiveUrl ? (
              <a
                href={skillArchiveUrl}
                download
                className="group relative overflow-hidden border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f5f9ff_48%,#edf4ff_100%)] px-6 py-6 text-slate-950 transition hover:border-slate-300 hover:shadow-[0_16px_32px_rgba(15,23,42,0.08)]"
              >
                <div className="pointer-events-none absolute inset-y-0 right-0 w-40 bg-[radial-gradient(circle_at_top_right,rgba(17,40,78,0.10),transparent_72%)]" />
                <div className="relative grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="grid gap-2">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {copy.downloadLabel}
                    </div>
                    <div className="text-[1.85rem] font-semibold tracking-[-0.05em] text-slate-950">
                      {copy.downloadSkill}
                    </div>
                    <div className="max-w-xl text-sm leading-6 text-slate-600">
                      {copy.downloadHint}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:justify-end">
                    <span className="border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                      ZIP
                    </span>
                    <span className="inline-flex items-center justify-center border border-[#11284e] bg-[#11284e] px-4 py-2.5 text-sm font-medium text-white transition group-hover:bg-[#0d1f3b]">
                      {copy.downloadNow}
                    </span>
                  </div>
                </div>
              </a>
            ) : (
              <div className="grid min-h-[144px] place-items-center border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_100%)] px-6 py-6 text-center">
                <div className="grid gap-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {copy.downloadLabel}
                  </div>
                  <div className="text-xl font-semibold text-slate-500">{copy.downloadUnavailable}</div>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-3 xl:border-l xl:border-slate-200 xl:pl-5">
            <div className="grid gap-1">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {copy.coverage}
              </div>
              <div className="text-sm leading-6 text-slate-600">{copy.coverageSummary}</div>
            </div>

            <div className="grid gap-3">
              <div className="grid gap-2 border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] px-4 py-3.5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {copy.riskTypes}
                </div>
                <div className="flex flex-wrap gap-2">
                  {record.riskTypes.map((label) => (
                    <span key={label} className="border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-2 border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] px-4 py-3.5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {copy.surfaceLevels}
                </div>
                <div className="flex flex-wrap gap-2">
                  {record.surfaceLevels.map((level) => (
                    <span key={level} className="border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
                      {formatSurfaceLevelLabel(locale, level)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-2 border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] px-4 py-3.5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {copy.agentModels}
                </div>
                <div className="flex flex-wrap gap-2">
                  {displayAgentModels.map((model) => (
                    <span key={model} className="border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
                      {model}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard className="grid gap-4">
        <SectionHeading
          title={locale === "zh" ? "该 skill 下的轨迹" : "Traces under this skill"}
          description={
            locale === "zh"
              ? "每个 surface 都直接来自当前公开数据集，并沿用首页与攻击面列表页的同一套卡片结构。"
              : "Each surface is parsed directly from the current public dataset and uses the same card structure as home and the surface listing page."
          }
          action={
            <Link href="/vulnerabilities" className={actionButtonClass("secondary")}>
              {locale === "zh" ? "返回轨迹总览" : "Back to traces"}
            </Link>
          }
        />

        <div className="grid gap-4 xl:grid-cols-2">
          {record.surfaces.map((item) => (
            <PublicVulnerabilityCard
              key={item.id}
              locale={locale}
              item={item}
              variant="list"
              density="compact"
              combineRiskAndModel
              metaLayout="band"
              accentBackground
              showFinalReason
              finalReasonLength={200}
              resultBadgeTone="list"
            />
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}
