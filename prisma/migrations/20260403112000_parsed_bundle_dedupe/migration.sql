BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE "ParsedBundle" (
    "id" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "parserVersion" TEXT NOT NULL DEFAULT 'skillatlas-submission-v2',
    "storageKey" TEXT NOT NULL,
    "parseError" TEXT,
    "bundleMeta" JSONB,
    "parsedIndex" JSONB,
    "displayPayload" JSONB,
    "summaryStats" JSONB,
    "redactionSummary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParsedBundle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ParsedBundleFinding" (
    "id" TEXT NOT NULL,
    "parsedBundleId" TEXT NOT NULL,
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

    CONSTRAINT "ParsedBundleFinding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ParsedBundleArtifact" (
    "id" TEXT NOT NULL,
    "parsedBundleId" TEXT NOT NULL,
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

    CONSTRAINT "ParsedBundleArtifact_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Submission" ADD COLUMN "parsedBundleId" TEXT;

CREATE TEMP TABLE "_parsed_bundle_seed" AS
SELECT DISTINCT ON (s."sha256", s."parserVersion")
  s.id AS source_submission_id,
  encode(gen_random_bytes(16), 'hex') AS parsed_bundle_id,
  s."sha256",
  s."parserVersion"
FROM "Submission" s
ORDER BY s."sha256", s."parserVersion", s."createdAt", s.id;

INSERT INTO "ParsedBundle" (
  "id",
  "sha256",
  "parserVersion",
  "storageKey",
  "parseError",
  "bundleMeta",
  "parsedIndex",
  "displayPayload",
  "summaryStats",
  "redactionSummary",
  "createdAt",
  "updatedAt"
)
SELECT
  seed.parsed_bundle_id,
  s."sha256",
  s."parserVersion",
  s."storageKey",
  s."parseError",
  s."bundleMeta",
  s."parsedIndex",
  s."displayPayload",
  s."summaryStats",
  s."redactionSummary",
  s."createdAt",
  s."updatedAt"
FROM "_parsed_bundle_seed" seed
JOIN "Submission" s ON s.id = seed.source_submission_id;

INSERT INTO "ParsedBundleFinding" (
  "id",
  "parsedBundleId",
  "sortOrder",
  "reportPath",
  "reportSkillId",
  "sourceLink",
  "skillHash",
  "findingKey",
  "harmType",
  "vulnerabilitySurface",
  "provider",
  "model",
  "verdict",
  "reasonCode",
  "confidence",
  "harmfulPromptPreview",
  "smokingGunPreview",
  "evidenceSummaryPreview",
  "finalResponsePreview",
  "redactionFlags",
  "judgeSummary",
  "createdAt",
  "updatedAt"
)
SELECT
  encode(gen_random_bytes(16), 'hex'),
  seed.parsed_bundle_id,
  f."sortOrder",
  f."reportPath",
  f."reportSkillId",
  f."sourceLink",
  f."skillHash",
  f."findingKey",
  f."harmType",
  f."vulnerabilitySurface",
  f."provider",
  f."model",
  f."verdict",
  f."reasonCode",
  f."confidence",
  f."harmfulPromptPreview",
  f."smokingGunPreview",
  f."evidenceSummaryPreview",
  f."finalResponsePreview",
  f."redactionFlags",
  f."judgeSummary",
  f."createdAt",
  f."updatedAt"
FROM "_parsed_bundle_seed" seed
JOIN "SubmissionFinding" f ON f."submissionId" = seed.source_submission_id;

INSERT INTO "ParsedBundleArtifact" (
  "id",
  "parsedBundleId",
  "kind",
  "visibility",
  "fileName",
  "pathInBundle",
  "storageKey",
  "contentType",
  "sizeBytes",
  "sha256",
  "redactionFlags",
  "previewText",
  "createdAt",
  "updatedAt"
)
SELECT
  encode(gen_random_bytes(16), 'hex'),
  seed.parsed_bundle_id,
  a."kind",
  a."visibility",
  a."fileName",
  a."pathInBundle",
  a."storageKey",
  a."contentType",
  a."sizeBytes",
  a."sha256",
  a."redactionFlags",
  a."previewText",
  a."createdAt",
  a."updatedAt"
FROM "_parsed_bundle_seed" seed
JOIN "SubmissionArtifact" a ON a."submissionId" = seed.source_submission_id;

UPDATE "Submission" s
SET "parsedBundleId" = pb.id
FROM "ParsedBundle" pb
WHERE s."sha256" = pb."sha256"
  AND s."parserVersion" = pb."parserVersion";

ALTER TABLE "Submission"
  ALTER COLUMN "parsedBundleId" SET NOT NULL;

ALTER TABLE "Submission"
  ADD CONSTRAINT "Submission_parsedBundleId_fkey"
  FOREIGN KEY ("parsedBundleId") REFERENCES "ParsedBundle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ParsedBundleFinding"
  ADD CONSTRAINT "ParsedBundleFinding_parsedBundleId_fkey"
  FOREIGN KEY ("parsedBundleId") REFERENCES "ParsedBundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ParsedBundleArtifact"
  ADD CONSTRAINT "ParsedBundleArtifact_parsedBundleId_fkey"
  FOREIGN KEY ("parsedBundleId") REFERENCES "ParsedBundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "ParsedBundle_sha256_parserVersion_key" ON "ParsedBundle"("sha256", "parserVersion");
CREATE INDEX "ParsedBundleFinding_parsedBundleId_sortOrder_idx" ON "ParsedBundleFinding"("parsedBundleId", "sortOrder");
CREATE INDEX "ParsedBundleFinding_reportSkillId_idx" ON "ParsedBundleFinding"("reportSkillId");
CREATE INDEX "ParsedBundleArtifact_parsedBundleId_kind_idx" ON "ParsedBundleArtifact"("parsedBundleId", "kind");
CREATE INDEX "Submission_parsedBundleId_idx" ON "Submission"("parsedBundleId");

DROP TABLE "SubmissionFinding";
DROP TABLE "SubmissionArtifact";

DROP INDEX IF EXISTS "Submission_sha256_parserVersion_idx";

ALTER TABLE "Submission" DROP COLUMN "storageKey";
ALTER TABLE "Submission" DROP COLUMN "sha256";
ALTER TABLE "Submission" DROP COLUMN "parserVersion";
ALTER TABLE "Submission" DROP COLUMN "parseError";
ALTER TABLE "Submission" DROP COLUMN "bundleMeta";
ALTER TABLE "Submission" DROP COLUMN "parsedIndex";
ALTER TABLE "Submission" DROP COLUMN "displayPayload";
ALTER TABLE "Submission" DROP COLUMN "summaryStats";
ALTER TABLE "Submission" DROP COLUMN "redactionSummary";

COMMIT;
