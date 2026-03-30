-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('uploaded', 'parsing', 'preview_ready', 'parse_failed', 'submitted', 'under_review', 'rejected', 'approved', 'published');

-- CreateEnum
CREATE TYPE "SubmissionSource" AS ENUM ('web', 'api');

-- CreateEnum
CREATE TYPE "ArtifactKind" AS ENUM ('original_bundle', 'report_json', 'skill_archive', 'metadata');

-- CreateEnum
CREATE TYPE "ArtifactVisibility" AS ENUM ('admin_only', 'preview_only', 'public_case');

-- CreateEnum
CREATE TYPE "ReviewAction" AS ENUM ('submitted', 'under_review', 'rejected', 'approved', 'published', 'unpublished', 'note');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "githubId" TEXT,
    "githubLogin" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'uploaded',
    "source" "SubmissionSource" NOT NULL DEFAULT 'web',
    "originalFilename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "previewTokenHash" TEXT NOT NULL,
    "trackingTokenHash" TEXT,
    "parserVersion" TEXT NOT NULL DEFAULT 'skillattack-report-bundle-v1',
    "parseError" TEXT,
    "bundleMeta" JSONB,
    "parsedIndex" JSONB,
    "previewPayload" JSONB,
    "summaryStats" JSONB,
    "redactionSummary" JSONB,
    "submitterLabel" TEXT,
    "contactEmail" TEXT,
    "submissionNotes" TEXT,
    "adminNotes" TEXT,
    "verificationSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "previewReadyAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionFinding" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "reportPath" TEXT,
    "reportSkillId" TEXT NOT NULL,
    "sourceLink" TEXT,
    "skillHash" TEXT,
    "findingKey" TEXT NOT NULL,
    "harmType" TEXT NOT NULL,
    "vulnerabilitySurface" TEXT NOT NULL,
    "provider" TEXT,
    "model" TEXT,
    "verdict" TEXT,
    "reasonCode" TEXT,
    "confidence" DOUBLE PRECISION,
    "harmfulPromptPreview" TEXT NOT NULL,
    "smokingGunPreview" TEXT,
    "evidenceSummaryPreview" TEXT,
    "finalResponsePreview" TEXT,
    "redactionFlags" JSONB,
    "judgeSummary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubmissionFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionArtifact" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "kind" "ArtifactKind" NOT NULL,
    "visibility" "ArtifactVisibility" NOT NULL DEFAULT 'admin_only',
    "fileName" TEXT NOT NULL,
    "pathInBundle" TEXT,
    "storageKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT,
    "redactionFlags" JSONB,
    "previewText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubmissionArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewRecord" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "action" "ReviewAction" NOT NULL,
    "statusBefore" "SubmissionStatus",
    "statusAfter" "SubmissionStatus" NOT NULL,
    "notes" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicCase" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "publishedById" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicCase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_githubId_key" ON "User"("githubId");

-- CreateIndex
CREATE UNIQUE INDEX "User_githubLogin_key" ON "User"("githubLogin");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_publicId_key" ON "Submission"("publicId");

-- CreateIndex
CREATE INDEX "Submission_status_updatedAt_idx" ON "Submission"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "Submission_submittedAt_idx" ON "Submission"("submittedAt");

-- CreateIndex
CREATE INDEX "SubmissionFinding_submissionId_sortOrder_idx" ON "SubmissionFinding"("submissionId", "sortOrder");

-- CreateIndex
CREATE INDEX "SubmissionFinding_reportSkillId_idx" ON "SubmissionFinding"("reportSkillId");

-- CreateIndex
CREATE INDEX "SubmissionArtifact_submissionId_kind_idx" ON "SubmissionArtifact"("submissionId", "kind");

-- CreateIndex
CREATE INDEX "ReviewRecord_submissionId_createdAt_idx" ON "ReviewRecord"("submissionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PublicCase_submissionId_key" ON "PublicCase"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "PublicCase_slug_key" ON "PublicCase"("slug");

-- AddForeignKey
ALTER TABLE "SubmissionFinding" ADD CONSTRAINT "SubmissionFinding_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionArtifact" ADD CONSTRAINT "SubmissionArtifact_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewRecord" ADD CONSTRAINT "ReviewRecord_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewRecord" ADD CONSTRAINT "ReviewRecord_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicCase" ADD CONSTRAINT "PublicCase_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicCase" ADD CONSTRAINT "PublicCase_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
