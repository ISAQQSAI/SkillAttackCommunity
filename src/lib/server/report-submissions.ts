import { createHash, randomUUID } from "crypto";

import { Prisma, SubmissionStatus } from "@prisma/client";
import { z } from "zod";

import type { Viewer } from "@/lib/community";
import { getPublicCasePath } from "@/lib/public-case-routing";
import { prisma } from "@/lib/server/prisma";
import {
  parseReportBundle,
  type ParsedBundleDisplay,
  type ParsedReportBundle,
  type ParsedSubmissionArtifact,
  type ParsedSubmissionFinding,
} from "@/lib/server/report-bundle-parser";
import {
  readSubmissionBundle,
  saveSubmissionBundle,
  sha256 as sha256Buffer,
} from "@/lib/server/submission-storage";

const MAX_REPORT_BUNDLE_BYTES = Number(
  process.env.MAX_REPORT_BUNDLE_BYTES || 25 * 1024 * 1024
);
const PARSER_VERSION = "skillatlas-submission-v2";

const guestSubmitSchema = z.object({
  submitterLabel: z.string().trim().max(120).optional().or(z.literal("")),
  contactEmail: z.string().trim().email().optional().or(z.literal("")),
  submissionNotes: z.string().trim().max(5000).optional().or(z.literal("")),
});

const adminReviewSchema = z.object({
  action: z.enum(["rejected", "published"]),
});

function asJson(value: unknown) {
  return value as Prisma.InputJsonValue;
}

function compactText(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeGuestSubmissionInput(input: unknown) {
  const parsed = guestSubmitSchema.parse(input || {});
  return {
    submitterLabel: parsed.submitterLabel || undefined,
    contactEmail: parsed.contactEmail || undefined,
    submissionNotes: parsed.submissionNotes || undefined,
  };
}

function validateBundleFile(file: File) {
  if (!file || file.size <= 0) {
    throw new Error("A non-empty zip file is required.");
  }
  if (!file.name.toLowerCase().endsWith(".zip")) {
    throw new Error("Only .zip uploads are supported for report bundles.");
  }
  if (file.size > MAX_REPORT_BUNDLE_BYTES) {
    throw new Error(`Bundle exceeds max size of ${MAX_REPORT_BUNDLE_BYTES} bytes.`);
  }
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.slice(0, 120) || "case";
}

async function ensureUniqueSlug(
  base: string,
  publicId: string,
  existingSlug?: string | null,
  db: Prisma.TransactionClient | typeof prisma = prisma
) {
  const normalizedBase = slugify(base);
  if (existingSlug === normalizedBase) {
    return normalizedBase;
  }
  const existing = await db.publicCase.findUnique({
    where: { slug: normalizedBase },
    select: { id: true },
  });
  if (!existing) {
    return normalizedBase;
  }
  return `${normalizedBase}-${publicId.slice(-6).toLowerCase()}`;
}

async function upsertAdminUser(viewer: Viewer) {
  const githubLogin = viewer.login || `admin-${viewer.id}`;

  return prisma.user.upsert({
    where: { githubLogin },
    update: {
      githubId: viewer.id,
      name: viewer.name,
      email: viewer.email || undefined,
      image: viewer.image || undefined,
      role: "admin",
    },
    create: {
      githubId: viewer.id,
      githubLogin,
      name: viewer.name,
      email: viewer.email || undefined,
      image: viewer.image || undefined,
      role: "admin",
    },
  });
}

function buildFindingFingerprint(finding: {
  reportSkillId: string;
  findingKey: string;
  harmType: string;
  vulnerabilitySurface: string;
  provider?: string | null;
  model?: string | null;
  verdict?: string | null;
  harmfulPromptPreview: string;
  smokingGunPreview?: string | null;
  finalResponsePreview?: string | null;
}) {
  return createHash("sha256")
    .update(
      JSON.stringify([
        compactText(finding.reportSkillId),
        compactText(finding.findingKey),
        compactText(finding.harmType),
        compactText(finding.vulnerabilitySurface),
        compactText(finding.provider),
        compactText(finding.model),
        compactText(finding.verdict),
        compactText(finding.harmfulPromptPreview),
        compactText(finding.smokingGunPreview),
        compactText(finding.finalResponsePreview),
      ])
    )
    .digest("hex");
}

function toDisplayFinding(finding: ParsedSubmissionFinding) {
  return {
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
  };
}

function normalizeParsedBundle(parsed: ParsedReportBundle): ParsedReportBundle {
  const uniqueFindings = new Map<string, ParsedSubmissionFinding>();

  for (const finding of parsed.findings) {
    const fingerprint = buildFindingFingerprint(finding);
    if (uniqueFindings.has(fingerprint)) {
      continue;
    }
    uniqueFindings.set(fingerprint, finding);
  }

  const findings = [...uniqueFindings.values()].map((finding, index) => ({
    ...finding,
    sortOrder: index,
  }));

  return {
    ...parsed,
    findings,
    displayPayload: {
      ...parsed.displayPayload,
      findings: findings.map(toDisplayFinding),
    },
  };
}

function buildFindingCreateData(findings: ParsedSubmissionFinding[]) {
  return findings.map((finding) => ({
    sortOrder: finding.sortOrder,
    reportPath: finding.reportPath,
    reportSkillId: finding.reportSkillId,
    sourceLink: finding.sourceLink,
    skillHash: finding.skillHash,
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
    redactionFlags: asJson(finding.redactionFlags),
    judgeSummary: asJson(finding.judgeSummary),
  }));
}

function buildArtifactCreateData(
  file: File,
  buffer: Buffer,
  stored: { storageKey: string; sha256: string },
  artifacts: ParsedSubmissionArtifact[],
  redactionFlags: string[]
) {
  return [
    {
      kind: "original_bundle" as const,
      visibility: "admin_only" as const,
      fileName: file.name,
      storageKey: stored.storageKey,
      contentType: file.type || "application/zip",
      sizeBytes: buffer.byteLength,
      sha256: stored.sha256,
      redactionFlags: asJson(redactionFlags),
    },
    ...artifacts.map((artifact) => ({
      kind: artifact.kind,
      visibility: artifact.visibility,
      fileName: artifact.fileName,
      pathInBundle: artifact.pathInBundle,
      storageKey: stored.storageKey,
      contentType: artifact.contentType,
      sizeBytes: artifact.sizeBytes,
      redactionFlags: asJson(artifact.redactionFlags),
      previewText: artifact.previewText,
    })),
  ];
}

async function findParsedBundle(bundleSha256: string) {
  return prisma.parsedBundle.findUnique({
    where: {
      sha256_parserVersion: {
        sha256: bundleSha256,
        parserVersion: PARSER_VERSION,
      },
    },
    select: {
      id: true,
      sha256: true,
      storageKey: true,
      displayPayload: true,
      redactionSummary: true,
    },
  });
}

async function findFirstSubmissionForParsedBundle(parsedBundleId: string) {
  return prisma.submission.findFirst({
    where: { parsedBundleId },
    orderBy: { createdAt: "asc" },
    select: { publicId: true },
  });
}

async function ensureParsedBundle(file: File, buffer: Buffer) {
  const bundleSha256 = sha256Buffer(buffer);
  const existing = await findParsedBundle(bundleSha256);

  if (existing) {
    const sourceSubmission = await findFirstSubmissionForParsedBundle(existing.id);
    return {
      parsedBundleId: existing.id,
      displayPayload: existing.displayPayload as unknown as ParsedBundleDisplay,
      redactionSummary: existing.redactionSummary,
      dedupedFromSubmissionId: sourceSubmission?.publicId || null,
    };
  }

  const parsed = normalizeParsedBundle(parseReportBundle(buffer));
  const folderId = randomUUID().replace(/-/g, "");
  const stored = await saveSubmissionBundle(folderId, file.name, buffer);

  try {
    const created = await prisma.parsedBundle.create({
      data: {
        sha256: stored.sha256,
        parserVersion: PARSER_VERSION,
        storageKey: stored.storageKey,
        bundleMeta: asJson(parsed.bundleMeta),
        parsedIndex: asJson(parsed.parsedIndex),
        displayPayload: asJson(parsed.displayPayload),
        summaryStats: asJson(parsed.summaryStats),
        redactionSummary: asJson(parsed.redactionSummary),
        findings: {
          create: buildFindingCreateData(parsed.findings),
        },
        artifacts: {
          create: buildArtifactCreateData(
            file,
            buffer,
            stored,
            parsed.artifacts,
            parsed.redactionSummary.flags
          ),
        },
      },
      select: {
        id: true,
        displayPayload: true,
        redactionSummary: true,
      },
    });

    return {
      parsedBundleId: created.id,
      displayPayload: created.displayPayload as unknown as ParsedBundleDisplay,
      redactionSummary: created.redactionSummary,
      dedupedFromSubmissionId: null,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const reused = await findParsedBundle(bundleSha256);
      if (reused) {
        const sourceSubmission = await findFirstSubmissionForParsedBundle(reused.id);
        return {
          parsedBundleId: reused.id,
          displayPayload: reused.displayPayload as unknown as ParsedBundleDisplay,
          redactionSummary: reused.redactionSummary,
          dedupedFromSubmissionId: sourceSubmission?.publicId || null,
        };
      }
    }
    throw error;
  }
}

export async function createSubmittedUpload(
  file: File,
  source: "web" | "api" = "web",
  input: unknown = {}
) {
  validateBundleFile(file);

  const buffer = Buffer.from(await file.arrayBuffer());
  const guestInput = normalizeGuestSubmissionInput(input);
  const bundle = await ensureParsedBundle(file, buffer);

  const submission = await prisma.submission.create({
    data: {
      status: "submitted",
      source,
      parsedBundleId: bundle.parsedBundleId,
      originalFilename: file.name,
      contentType: file.type || "application/zip",
      sizeBytes: buffer.byteLength,
      submittedAt: new Date(),
      submitterLabel: guestInput.submitterLabel,
      contactEmail: guestInput.contactEmail,
      submissionNotes: guestInput.submissionNotes,
    },
    select: {
      publicId: true,
      status: true,
      submittedAt: true,
      parsedBundle: {
        select: {
          displayPayload: true,
          redactionSummary: true,
        },
      },
    },
  });

  return {
    submissionId: submission.publicId,
    status: submission.status,
    submittedAt: submission.submittedAt,
    display: submission.parsedBundle.displayPayload as unknown as ParsedBundleDisplay,
    redactionSummary: submission.parsedBundle.redactionSummary,
    dedupedFromSubmissionId: bundle.dedupedFromSubmissionId,
  };
}

export async function getSubmittedUpload(publicId: string) {
  const submission = await prisma.submission.findUnique({
    where: { publicId },
    select: {
      publicId: true,
      status: true,
      submittedAt: true,
      parsedBundle: {
        select: {
          displayPayload: true,
          redactionSummary: true,
        },
      },
    },
  });

  if (!submission) {
    throw new Error("Submission not found.");
  }

  return {
    submissionId: submission.publicId,
    status: submission.status,
    submittedAt: submission.submittedAt,
    display: submission.parsedBundle.displayPayload as unknown as ParsedBundleDisplay,
    redactionSummary: submission.parsedBundle.redactionSummary,
  };
}

export async function getSubmissionStatus(publicId: string) {
  const submission = await prisma.submission.findUnique({
    where: { publicId },
    include: {
      publicCase: {
        select: {
          slug: true,
          title: true,
          publishedAt: true,
          payload: true,
        },
      },
    },
  });

  if (!submission) {
    throw new Error("Submission not found.");
  }

  return {
    submissionId: submission.publicId,
    status: submission.status,
    submittedAt: submission.submittedAt,
    reviewedAt: submission.reviewedAt,
    publishedAt: submission.publishedAt,
    verificationSummary: submission.verificationSummary,
    adminNotes: submission.adminNotes,
    publicCase: submission.publicCase
      ? {
          slug: submission.publicCase.slug,
          title: submission.publicCase.title,
          publishedAt: submission.publicCase.publishedAt,
          path: getPublicCasePath({
            slug: submission.publicCase.slug,
            payload: submission.publicCase.payload,
          }),
        }
      : null,
  };
}

export async function listAdminSubmissions() {
  const submissions = await prisma.submission.findMany({
    orderBy: [{ updatedAt: "desc" }],
    select: {
      publicId: true,
      status: true,
      originalFilename: true,
      submitterLabel: true,
      contactEmail: true,
      createdAt: true,
      submittedAt: true,
      reviewedAt: true,
      publishedAt: true,
      _count: {
        select: { reviews: true },
      },
      parsedBundle: {
        select: {
          redactionSummary: true,
          _count: {
            select: { findings: true },
          },
          findings: {
            take: 1,
            orderBy: { sortOrder: "asc" },
            select: {
              reportSkillId: true,
              harmType: true,
              verdict: true,
              model: true,
            },
          },
        },
      },
    },
  });

  return submissions.map((submission) => ({
    ...submission,
    redactionSummary: submission.parsedBundle.redactionSummary,
    findings: submission.parsedBundle.findings,
    _count: {
      findings: submission.parsedBundle._count.findings,
      reviews: submission._count.reviews,
    },
  }));
}

export async function getAdminSubmission(publicId: string) {
  const submission = await prisma.submission.findUnique({
    where: { publicId },
    include: {
      reviews: {
        orderBy: { createdAt: "desc" },
        include: {
          reviewer: {
            select: {
              name: true,
              githubLogin: true,
            },
          },
        },
      },
      publicCase: true,
      parsedBundle: {
        include: {
          findings: {
            orderBy: { sortOrder: "asc" },
          },
          artifacts: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!submission) {
    throw new Error("Submission not found.");
  }

  return {
    ...submission,
    displayPayload: submission.parsedBundle.displayPayload,
    redactionSummary: submission.parsedBundle.redactionSummary,
    findings: submission.parsedBundle.findings,
    artifacts: submission.parsedBundle.artifacts,
  };
}

export async function getAdminBundleDownload(publicId: string) {
  const submission = await prisma.submission.findUnique({
    where: { publicId },
    select: {
      originalFilename: true,
      contentType: true,
      parsedBundle: {
        select: {
          storageKey: true,
        },
      },
    },
  });

  if (!submission) {
    throw new Error("Submission not found.");
  }

  const buffer = await readSubmissionBundle(submission.parsedBundle.storageKey);
  return {
    fileName: submission.originalFilename,
    contentType: submission.contentType || "application/zip",
    buffer,
  };
}

function buildDefaultPublicTitle(submission: {
  findings: Array<{ harmType: string; reportSkillId: string }>;
}) {
  const first = submission.findings[0];
  if (!first) {
    return "Sanitized report bundle";
  }
  return `${first.harmType} in ${first.reportSkillId}`;
}

function buildDefaultPublicSummary(submission: {
  findings: Array<{ reportSkillId: string; verdict: string | null }>;
}) {
  const affectedSkills = new Set(submission.findings.map((item) => item.reportSkillId)).size;
  const successfulFindings = submission.findings.filter((item) =>
    ["attack_success", "success"].includes(String(item.verdict || ""))
  ).length;
  return `Admin-verified bundle covering ${submission.findings.length} finding(s) across ${affectedSkills} skill(s), with ${successfulFindings} successful finding(s).`;
}

function buildPublicCasePayload(
  displayPayload: Prisma.JsonValue | null,
  verificationSummary: string | undefined,
  publishedAt: Date
) {
  return {
    ...((displayPayload || {}) as Record<string, unknown>),
    verificationSummary,
    publishedAt: publishedAt.toISOString(),
  };
}

export async function reviewSubmission(
  publicId: string,
  viewer: Viewer,
  input: unknown
) {
  const parsed = adminReviewSchema.parse(input);
  const reviewer = await upsertAdminUser(viewer);
  const submission = await prisma.submission.findUnique({
    where: { publicId },
    select: {
      id: true,
      publicId: true,
      status: true,
      publicCase: true,
      parsedBundle: {
        select: {
          displayPayload: true,
          findings: {
            orderBy: { sortOrder: "asc" },
            select: {
              reportSkillId: true,
              harmType: true,
              verdict: true,
            },
          },
        },
      },
    },
  });

  if (!submission) {
    throw new Error("Submission not found.");
  }

  const nextStatus: SubmissionStatus = parsed.action === "published" ? "published" : "rejected";

  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    let title = submission.publicCase?.title;
    let summary = submission.publicCase?.summary;
    let slug = submission.publicCase?.slug;

    if (nextStatus === "published") {
      title = buildDefaultPublicTitle(submission.parsedBundle);
      summary = buildDefaultPublicSummary(submission.parsedBundle);
      slug = await ensureUniqueSlug(
        title,
        submission.publicId,
        submission.publicCase?.slug,
        tx
      );

      await tx.publicCase.upsert({
        where: { submissionId: submission.id },
        update: {
          slug,
          title,
          summary,
          payload: asJson(
            buildPublicCasePayload(
              submission.parsedBundle.displayPayload,
              undefined,
              now
            )
          ),
          publishedById: reviewer.id,
          publishedAt: now,
        },
        create: {
          submissionId: submission.id,
          slug,
          title,
          summary,
          payload: asJson(
            buildPublicCasePayload(
              submission.parsedBundle.displayPayload,
              undefined,
              now
            )
          ),
          publishedById: reviewer.id,
        },
      });
    } else if (submission.publicCase) {
      await tx.publicCase.delete({
        where: { submissionId: submission.id },
      });
    }

    return tx.submission.update({
      where: { id: submission.id },
      data: {
        status: nextStatus,
        adminNotes: null,
        verificationSummary: null,
        reviewedAt: now,
        publishedAt: nextStatus === "published" ? now : null,
        reviews: {
          create: {
            reviewerId: reviewer.id,
            action: parsed.action,
            statusBefore: submission.status,
            statusAfter: nextStatus,
            notes: undefined,
            payload: asJson(
              nextStatus === "published"
                ? {
                    title,
                    summary,
                    slug,
                  }
                : {}
            ),
          },
        },
      },
      select: {
        publicId: true,
        status: true,
        adminNotes: true,
        verificationSummary: true,
        reviewedAt: true,
        publishedAt: true,
      },
    });
  });

  return updated;
}

export async function listPublicCases() {
  return prisma.publicCase.findMany({
    orderBy: { publishedAt: "desc" },
    select: {
      slug: true,
      title: true,
      summary: true,
      publishedAt: true,
      payload: true,
    },
  });
}

export async function getPublicCaseBySlug(slug: string) {
  return prisma.publicCase.findUnique({
    where: { slug },
    select: {
      slug: true,
      title: true,
      summary: true,
      publishedAt: true,
      payload: true,
      submission: {
        select: {
          parsedBundle: {
            select: {
              storageKey: true,
            },
          },
        },
      },
    },
  });
}

export async function getCommunitySnapshot() {
  const [publishedCount, pendingReviewCount, latestCases] = await Promise.all([
    prisma.publicCase.count(),
    prisma.submission.count({
      where: {
        status: {
          in: ["submitted", "under_review"],
        },
      },
    }),
    prisma.publicCase.findMany({
      orderBy: { publishedAt: "desc" },
      take: 6,
      select: {
        slug: true,
        title: true,
        summary: true,
        publishedAt: true,
        payload: true,
      },
    }),
  ]);

  return {
    publishedCount,
    pendingReviewCount,
    latestCases,
  };
}
