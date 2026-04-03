BEGIN;

UPDATE "Submission"
SET "status" = CASE
  WHEN "status" IN ('uploaded', 'parsing', 'preview_ready') THEN 'submitted'::"SubmissionStatus"
  WHEN "status" = 'parse_failed' THEN 'rejected'::"SubmissionStatus"
  WHEN "status" = 'approved' THEN 'published'::"SubmissionStatus"
  ELSE "status"
END;

UPDATE "ReviewRecord"
SET "statusBefore" = CASE
  WHEN "statusBefore" IN ('uploaded', 'parsing', 'preview_ready') THEN 'submitted'::"SubmissionStatus"
  WHEN "statusBefore" = 'parse_failed' THEN 'rejected'::"SubmissionStatus"
  WHEN "statusBefore" = 'approved' THEN 'published'::"SubmissionStatus"
  ELSE "statusBefore"
END
WHERE "statusBefore" IS NOT NULL;

UPDATE "ReviewRecord"
SET "statusAfter" = CASE
  WHEN "statusAfter" IN ('uploaded', 'parsing', 'preview_ready') THEN 'submitted'::"SubmissionStatus"
  WHEN "statusAfter" = 'parse_failed' THEN 'rejected'::"SubmissionStatus"
  WHEN "statusAfter" = 'approved' THEN 'published'::"SubmissionStatus"
  ELSE "statusAfter"
END;

UPDATE "ReviewRecord"
SET "action" = CASE
  WHEN "action" = 'approved' THEN 'published'::"ReviewAction"
  WHEN "action" = 'unpublished' THEN 'rejected'::"ReviewAction"
  ELSE "action"
END;

UPDATE "SubmissionArtifact"
SET "visibility" = 'admin_only'::"ArtifactVisibility"
WHERE "visibility" = 'preview_only'::"ArtifactVisibility";

ALTER TABLE "Submission" RENAME COLUMN "previewPayload" TO "displayPayload";
ALTER TABLE "Submission" DROP COLUMN "previewTokenHash";
ALTER TABLE "Submission" DROP COLUMN "previewReadyAt";
ALTER TABLE "Submission" ALTER COLUMN "trackingTokenHash" SET NOT NULL;
UPDATE "Submission" SET "parserVersion" = 'skillatlas-submission-v2';
ALTER TABLE "Submission" ALTER COLUMN "parserVersion" SET DEFAULT 'skillatlas-submission-v2';

ALTER TYPE "SubmissionStatus" RENAME TO "SubmissionStatus_old";
CREATE TYPE "SubmissionStatus" AS ENUM ('submitted', 'under_review', 'rejected', 'published');

ALTER TABLE "Submission" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ReviewRecord" ALTER COLUMN "statusBefore" TYPE TEXT USING "statusBefore"::TEXT;
ALTER TABLE "ReviewRecord" ALTER COLUMN "statusAfter" TYPE TEXT USING "statusAfter"::TEXT;
ALTER TABLE "Submission" ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;

ALTER TABLE "Submission"
  ALTER COLUMN "status" TYPE "SubmissionStatus"
  USING "status"::"SubmissionStatus";
ALTER TABLE "ReviewRecord"
  ALTER COLUMN "statusBefore" TYPE "SubmissionStatus"
  USING CASE WHEN "statusBefore" IS NULL THEN NULL ELSE "statusBefore"::"SubmissionStatus" END;
ALTER TABLE "ReviewRecord"
  ALTER COLUMN "statusAfter" TYPE "SubmissionStatus"
  USING "statusAfter"::"SubmissionStatus";

DROP TYPE "SubmissionStatus_old";
ALTER TABLE "Submission" ALTER COLUMN "status" SET DEFAULT 'submitted';

ALTER TYPE "ReviewAction" RENAME TO "ReviewAction_old";
CREATE TYPE "ReviewAction" AS ENUM ('submitted', 'under_review', 'rejected', 'published', 'note');

ALTER TABLE "ReviewRecord" ALTER COLUMN "action" TYPE TEXT USING "action"::TEXT;
ALTER TABLE "ReviewRecord"
  ALTER COLUMN "action" TYPE "ReviewAction"
  USING "action"::"ReviewAction";

DROP TYPE "ReviewAction_old";

ALTER TYPE "ArtifactVisibility" RENAME TO "ArtifactVisibility_old";
CREATE TYPE "ArtifactVisibility" AS ENUM ('admin_only', 'public_case');

ALTER TABLE "SubmissionArtifact" ALTER COLUMN "visibility" DROP DEFAULT;
ALTER TABLE "SubmissionArtifact" ALTER COLUMN "visibility" TYPE TEXT USING "visibility"::TEXT;
ALTER TABLE "SubmissionArtifact"
  ALTER COLUMN "visibility" TYPE "ArtifactVisibility"
  USING "visibility"::"ArtifactVisibility";

DROP TYPE "ArtifactVisibility_old";
ALTER TABLE "SubmissionArtifact" ALTER COLUMN "visibility" SET DEFAULT 'admin_only';

CREATE INDEX "Submission_sha256_parserVersion_idx"
  ON "Submission"("sha256", "parserVersion");

COMMIT;
