import { createHash, randomBytes, randomUUID, timingSafeEqual } from "crypto";

import { Prisma, SubmissionStatus } from "@prisma/client";
import { z } from "zod";

import type { Viewer } from "@/lib/community";
import { getPublicCasePath } from "@/lib/public-case-routing";
import { prisma } from "@/lib/server/prisma";
import {
  parseReportBundle,
  type ParsedBundlePreview,
} from "@/lib/server/report-bundle-parser";
import {
  readSubmissionBundle,
  saveSubmissionBundle,
} from "@/lib/server/submission-storage";

const MAX_REPORT_BUNDLE_BYTES = Number(
  process.env.MAX_REPORT_BUNDLE_BYTES || 25 * 1024 * 1024
);

const guestSubmitSchema = z.object({
  submitterLabel: z.string().trim().max(120).optional().or(z.literal("")),
  contactEmail: z.string().trim().email().optional().or(z.literal("")),
  submissionNotes: z.string().trim().max(5000).optional().or(z.literal("")),
});

const adminReviewSchema = z.object({
  action: z.enum(["under_review", "rejected", "approved"]),
  notes: z.string().trim().max(5000).optional().default(""),
  verificationSummary: z.string().trim().max(5000).optional().or(z.literal("")),
});

const publishSchema = z.object({
  title: z.string().trim().max(200).optional().or(z.literal("")),
  summary: z.string().trim().max(5000).optional().or(z.literal("")),
  slug: z.string().trim().max(160).optional().or(z.literal("")),
});

function createToken() {
  return randomBytes(24).toString("hex");
}

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function tokensMatch(expectedHash: string, receivedToken: string) {
  const expected = Buffer.from(expectedHash, "hex");
  const actual = Buffer.from(hashToken(receivedToken), "hex");
  if (expected.length !== actual.length) {
    return false;
  }
  return timingSafeEqual(expected, actual);
}

function asJson(value: unknown) {
  return value as Prisma.InputJsonValue;
}

function compactText(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.slice(0, 120) || "case";
}

async function ensureUniqueSlug(base: string, publicId: string, existingSlug?: string | null) {
  const normalizedBase = slugify(base);
  if (existingSlug === normalizedBase) {
    return normalizedBase;
  }
  const existing = await prisma.publicCase.findUnique({
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

export async function createUploadPreview(file: File, source: "web" | "api" = "web") {
  if (!file || file.size <= 0) {
    throw new Error("A non-empty zip file is required.");
  }
  if (!file.name.toLowerCase().endsWith(".zip")) {
    throw new Error("Only .zip uploads are supported for report bundles.");
  }
  if (file.size > MAX_REPORT_BUNDLE_BYTES) {
    throw new Error(`Bundle exceeds max size of ${MAX_REPORT_BUNDLE_BYTES} bytes.`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = parseReportBundle(buffer);
  const previewToken = createToken();
  const folderId = randomUUID().replace(/-/g, "");
  const stored = await saveSubmissionBundle(folderId, file.name, buffer);

  const submission = await prisma.submission.create({
    data: {
      status: "preview_ready",
      source,
      originalFilename: file.name,
      contentType: file.type || "application/zip",
      sizeBytes: buffer.byteLength,
      storageKey: stored.storageKey,
      sha256: stored.sha256,
      previewTokenHash: hashToken(previewToken),
      previewReadyAt: new Date(),
      bundleMeta: asJson(parsed.bundleMeta),
      parsedIndex: asJson(parsed.parsedIndex),
      previewPayload: asJson(parsed.previewPayload),
      summaryStats: asJson(parsed.summaryStats),
      redactionSummary: asJson(parsed.redactionSummary),
      findings: {
        create: parsed.findings.map((finding) => ({
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
        })),
      },
      artifacts: {
        create: [
          {
            kind: "original_bundle",
            visibility: "admin_only",
            fileName: file.name,
            storageKey: stored.storageKey,
            contentType: file.type || "application/zip",
            sizeBytes: buffer.byteLength,
            sha256: stored.sha256,
            redactionFlags: asJson(parsed.redactionSummary.flags),
          },
          ...parsed.artifacts.map((artifact) => ({
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
        ],
      },
    },
    select: {
      publicId: true,
      status: true,
      previewPayload: true,
      redactionSummary: true,
      previewReadyAt: true,
    },
  });

  return {
    submissionId: submission.publicId,
    status: submission.status,
    previewReadyAt: submission.previewReadyAt,
    previewToken,
    preview: submission.previewPayload as unknown as ParsedBundlePreview,
    redactionSummary: submission.redactionSummary,
  };
}

async function getSubmissionForPreviewAccess(publicId: string, previewToken: string) {
  const submission = await prisma.submission.findUnique({
    where: { publicId },
    select: {
      id: true,
      publicId: true,
      status: true,
      previewTokenHash: true,
      previewPayload: true,
      redactionSummary: true,
      previewReadyAt: true,
      submittedAt: true,
    },
  });

  if (!submission || !tokensMatch(submission.previewTokenHash, previewToken)) {
    throw new Error("Preview not found or token is invalid.");
  }

  return submission;
}

export async function getUploadPreview(publicId: string, previewToken: string) {
  const submission = await getSubmissionForPreviewAccess(publicId, previewToken);
  return {
    submissionId: submission.publicId,
    status: submission.status,
    previewReadyAt: submission.previewReadyAt,
    submittedAt: submission.submittedAt,
    preview: submission.previewPayload as unknown as ParsedBundlePreview,
    redactionSummary: submission.redactionSummary,
  };
}

export async function submitUploadPreview(
  publicId: string,
  previewToken: string,
  input: unknown
) {
  const parsed = guestSubmitSchema.parse(input);
  const existing = await getSubmissionForPreviewAccess(publicId, previewToken);

  if (existing.status !== "preview_ready") {
    throw new Error("Only preview-ready uploads can be formally submitted.");
  }

  const trackingToken = createToken();
  const submission = await prisma.submission.update({
    where: { publicId },
    data: {
      status: "submitted",
      submittedAt: new Date(),
      trackingTokenHash: hashToken(trackingToken),
      submitterLabel: parsed.submitterLabel || undefined,
      contactEmail: parsed.contactEmail || undefined,
      submissionNotes: parsed.submissionNotes || undefined,
    },
    select: {
      publicId: true,
      status: true,
      submittedAt: true,
    },
  });

  return {
    submissionId: submission.publicId,
    status: submission.status,
    submittedAt: submission.submittedAt,
    trackingToken,
  };
}

export async function getSubmissionStatus(publicId: string, trackingToken: string) {
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

  if (!submission || !submission.trackingTokenHash || !tokensMatch(submission.trackingTokenHash, trackingToken)) {
    throw new Error("Submission not found or token is invalid.");
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
  return prisma.submission.findMany({
    orderBy: [{ updatedAt: "desc" }],
    select: {
      publicId: true,
      status: true,
      originalFilename: true,
      submitterLabel: true,
      contactEmail: true,
      createdAt: true,
      previewReadyAt: true,
      submittedAt: true,
      reviewedAt: true,
      publishedAt: true,
      redactionSummary: true,
      summaryStats: true,
      _count: {
        select: { findings: true, reviews: true },
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
  });
}

export async function getAdminSubmission(publicId: string) {
  const submission = await prisma.submission.findUnique({
    where: { publicId },
    include: {
      findings: {
        orderBy: { sortOrder: "asc" },
      },
      artifacts: {
        orderBy: { createdAt: "asc" },
      },
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
    },
  });

  if (!submission) {
    throw new Error("Submission not found.");
  }

  return submission;
}

export async function getAdminBundleDownload(publicId: string) {
  const submission = await prisma.submission.findUnique({
    where: { publicId },
    select: {
      originalFilename: true,
      contentType: true,
      storageKey: true,
    },
  });

  if (!submission) {
    throw new Error("Submission not found.");
  }

  const buffer = await readSubmissionBundle(submission.storageKey);
  return {
    fileName: submission.originalFilename,
    contentType: submission.contentType || "application/zip",
    buffer,
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
    },
  });

  if (!submission) {
    throw new Error("Submission not found.");
  }

  const nextStatus: SubmissionStatus =
    parsed.action === "under_review"
      ? "under_review"
      : parsed.action === "rejected"
        ? "rejected"
        : "approved";

  if (nextStatus === "approved" && !compactText(parsed.verificationSummary)) {
    throw new Error("verificationSummary is required when approving a submission.");
  }

  const updated = await prisma.submission.update({
    where: { publicId },
    data: {
      status: nextStatus,
      adminNotes: parsed.notes || undefined,
      verificationSummary: parsed.verificationSummary || undefined,
      reviewedAt: new Date(),
      reviews: {
        create: {
          reviewerId: reviewer.id,
          action: parsed.action,
          statusBefore: submission.status,
          statusAfter: nextStatus,
          notes: parsed.notes || undefined,
          payload: asJson({
            verificationSummary: parsed.verificationSummary || undefined,
          }),
        },
      },
    },
    select: {
      publicId: true,
      status: true,
      adminNotes: true,
      verificationSummary: true,
      reviewedAt: true,
    },
  });

  return updated;
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
  const successfulFindings = submission.findings.filter((item) => item.verdict === "attack_success").length;
  return `Admin-verified bundle covering ${submission.findings.length} finding(s) across ${affectedSkills} skill(s), with ${successfulFindings} attack_success verdict(s).`;
}

export async function publishSubmission(
  publicId: string,
  viewer: Viewer,
  input: unknown
) {
  const parsed = publishSchema.parse(input);
  const reviewer = await upsertAdminUser(viewer);
  const submission = await prisma.submission.findUnique({
    where: { publicId },
    include: {
      findings: {
        orderBy: { sortOrder: "asc" },
      },
      publicCase: true,
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!submission) {
    throw new Error("Submission not found.");
  }
  if (!["approved", "published"].includes(submission.status)) {
    throw new Error("Only approved submissions can be published.");
  }

  const title = parsed.title || buildDefaultPublicTitle(submission);
  const summary = parsed.summary || buildDefaultPublicSummary(submission);
  const slug = await ensureUniqueSlug(
    parsed.slug || title,
    submission.publicId,
    submission.publicCase?.slug
  );

  const preview = (submission.previewPayload || {}) as Record<string, unknown>;
  const payload = {
    ...preview,
    verificationSummary: submission.verificationSummary,
    publishedAt: new Date().toISOString(),
  };

  const published = await prisma.$transaction(async (tx) => {
    const publicCase = await tx.publicCase.upsert({
      where: { submissionId: submission.id },
      update: {
        slug,
        title,
        summary,
        payload: asJson(payload),
        publishedById: reviewer.id,
        publishedAt: new Date(),
      },
      create: {
        submissionId: submission.id,
        slug,
        title,
        summary,
        payload: asJson(payload),
        publishedById: reviewer.id,
      },
    });

    await tx.submission.update({
      where: { id: submission.id },
      data: {
        status: "published",
        publishedAt: new Date(),
        reviews: {
          create: {
            reviewerId: reviewer.id,
            action: "published",
            statusBefore: submission.status,
            statusAfter: "published",
            notes: summary,
          },
        },
      },
    });

    return publicCase;
  });

  return published;
}

export async function unpublishSubmission(publicId: string, viewer: Viewer) {
  const reviewer = await upsertAdminUser(viewer);
  const submission = await prisma.submission.findUnique({
    where: { publicId },
    include: {
      publicCase: true,
    },
  });

  if (!submission || !submission.publicCase) {
    throw new Error("Published submission not found.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.publicCase.delete({
      where: { submissionId: submission.id },
    });

    await tx.submission.update({
      where: { id: submission.id },
      data: {
        status: "approved",
        publishedAt: null,
        reviews: {
          create: {
            reviewerId: reviewer.id,
            action: "unpublished",
            statusBefore: submission.status,
            statusAfter: "approved",
            notes: "Removed from public community listing.",
          },
        },
      },
    });
  });

  return {
    submissionId: submission.publicId,
    status: "approved",
  };
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
    },
  });
}

export async function getCommunitySnapshot() {
  const [publishedCount, pendingReviewCount, previewReadyCount, latestCases] = await Promise.all([
    prisma.publicCase.count(),
    prisma.submission.count({
      where: {
        status: {
          in: ["submitted", "under_review", "approved"],
        },
      },
    }),
    prisma.submission.count({
      where: {
        status: "preview_ready",
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
    previewReadyCount,
    latestCases,
  };
}
