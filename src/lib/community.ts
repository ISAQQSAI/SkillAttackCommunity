import { z } from "zod";

export const USER_ROLES = ["reporter", "reviewer", "admin"] as const;
export const FINDING_STATUSES = [
  "draft",
  "submitted",
  "needs_info",
  "triaged",
  "duplicate",
  "redaction_required",
  "reviewer_verified",
  "published",
  "rejected",
] as const;
export const JOB_TYPES = [
  "parse_artifact_bundle",
  "suggest_duplicates",
  "build_public_case_payload",
  "refresh_public_aggregates",
] as const;
export const JOB_STATUSES = ["queued", "running", "done", "failed"] as const;
export const SNAPSHOT_SCOPES = ["home", "leaderboard", "dataset", "model"] as const;
export const KNOWN_ARTIFACT_FILES = [
  "analysis.json",
  "attack.json",
  "judge.json",
  "judge_evidence.json",
  "judge_path_delta.json",
  "judge_decision_trace.json",
  "stdout.txt",
  "stderr.txt",
  "file_changes.json",
  "summary.md",
  "summary.pdf",
] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type FindingStatus = (typeof FINDING_STATUSES)[number];
export type JobType = (typeof JOB_TYPES)[number];
export type JobStatus = (typeof JOB_STATUSES)[number];
export type SnapshotScope = (typeof SNAPSHOT_SCOPES)[number];

export interface CommunityUser {
  id: string;
  githubId?: string;
  githubLogin?: string;
  name: string;
  email?: string;
  image?: string;
  role: UserRole;
  visibility: {
    showProfile: boolean;
    showEmail: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface StoredArtifact {
  id: string;
  name: string;
  originalName: string;
  storagePath: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
  publicSafe: boolean;
  preview?: string;
}

export interface DuplicateCandidate {
  findingId: string;
  title: string;
  score: number;
  reason: string;
}

export interface ArtifactExtraction {
  verdict?: string;
  confidence?: number;
  smokingGun?: string;
  failureReason?: string;
  skillId?: string;
  runId?: string;
  vulnType?: string;
  targetObjective?: string;
  duplicateCandidates?: DuplicateCandidate[];
}

export interface ArtifactBundle {
  id: string;
  findingId: string;
  rawUploadLocation: string;
  parsedManifest: Record<string, unknown>;
  detectedFiles: string[];
  extractedMetadata: ArtifactExtraction;
  redactionFlags: string[];
  artifacts: StoredArtifact[];
  createdAt: string;
  updatedAt: string;
}

export interface FindingReport {
  id: string;
  status: FindingStatus;
  reporterId: string;
  title: string;
  summary: string;
  skillName: string;
  skillUrl: string;
  vendor: string;
  skillVersion?: string;
  datasetTag: string;
  modelTags: string[];
  vulnType: string;
  severityClaim: string;
  attackPrompt: string;
  expectedRisk: string;
  reproSteps: string;
  observedResult: string;
  smokingGun: string;
  externalReferences: string[];
  publicSafe: boolean;
  submittedAt?: string;
  verificationSummary?: string;
  duplicateOfId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewRecord {
  id: string;
  findingId: string;
  reviewerId: string;
  statusBefore?: FindingStatus;
  statusAfter: FindingStatus;
  reviewerNotes?: string;
  redactionNotes?: string;
  duplicateTargetId?: string;
  verificationSummary?: string;
  createdAt: string;
}

export interface EvidenceBlock {
  title: string;
  content: string;
}

export interface PublicArtifactLink {
  label: string;
  artifactId: string;
}

export interface PublishedFinding {
  id: string;
  findingId: string;
  slug: string;
  publicTitle: string;
  publicSummary: string;
  publicEvidenceBlocks: EvidenceBlock[];
  publicArtifactLinks: PublicArtifactLink[];
  verificationBadge: string;
  verdict?: string;
  publishedAt: string;
  skillName: string;
  vendor: string;
  datasetTag: string;
  modelTags: string[];
  vulnType: string;
  severityClaim: string;
  reporterId: string;
}

export interface AggregateSnapshot {
  id: string;
  scope: SnapshotScope;
  key: string;
  payload: Record<string, unknown>;
  updatedAt: string;
}

export interface JobRecord {
  id: string;
  type: JobType;
  status: JobStatus;
  payload: Record<string, unknown>;
  attempts: number;
  lastError?: string;
  runAfter?: string;
  lockedAt?: string;
  lockedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityState {
  users: CommunityUser[];
  findings: FindingReport[];
  artifactBundles: ArtifactBundle[];
  reviewRecords: ReviewRecord[];
  publishedFindings: PublishedFinding[];
  aggregateSnapshots: AggregateSnapshot[];
  jobs: JobRecord[];
}

export interface Viewer {
  id: string;
  name: string;
  role: UserRole;
  login?: string;
  email?: string;
  image?: string;
  isDemo?: boolean;
}

const stringListSchema = z
  .union([z.array(z.string()), z.string(), z.undefined()])
  .transform((value) => {
    if (Array.isArray(value)) {
      return value.map((item) => item.trim()).filter(Boolean);
    }
    if (typeof value === "string") {
      return value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  });

export const findingDraftSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().default(""),
  summary: z.string().trim().default(""),
  skillName: z.string().trim().default(""),
  skillUrl: z.string().trim().default(""),
  vendor: z.string().trim().default(""),
  skillVersion: z.string().trim().optional().default(""),
  datasetTag: z.string().trim().default("community"),
  modelTags: stringListSchema,
  vulnType: z.string().trim().default(""),
  severityClaim: z.string().trim().default("medium"),
  attackPrompt: z.string().trim().default(""),
  expectedRisk: z.string().trim().default(""),
  reproSteps: z.string().trim().default(""),
  observedResult: z.string().trim().default(""),
  smokingGun: z.string().trim().default(""),
  externalReferences: stringListSchema,
  publicSafe: z.boolean().default(false),
});

export type FindingDraftInput = z.infer<typeof findingDraftSchema>;

export const reviewStatusSchema = z.object({
  status: z.enum(FINDING_STATUSES.filter((value) => value !== "draft" && value !== "published") as [FindingStatus, ...FindingStatus[]]),
  reviewerNotes: z.string().trim().optional().default(""),
  redactionNotes: z.string().trim().optional().default(""),
  duplicateTargetId: z.string().trim().optional().default(""),
  verificationSummary: z.string().trim().optional().default(""),
  redactionFlags: stringListSchema,
});

export type ReviewStatusInput = z.infer<typeof reviewStatusSchema>;

export const publishFindingSchema = z.object({
  publicTitle: z.string().trim().optional().default(""),
  publicSummary: z.string().trim().optional().default(""),
  verificationBadge: z.string().trim().optional().default("reviewer verified"),
});

export type PublishFindingInput = z.infer<typeof publishFindingSchema>;

export function createId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function humanizeStatus(status: FindingStatus): string {
  return status.replaceAll("_", " ");
}

export function missingRequiredFields(finding: FindingReport): string[] {
  const required: Array<[keyof FindingReport, string]> = [
    ["title", "title"],
    ["summary", "summary"],
    ["skillName", "skill name"],
    ["skillUrl", "skill URL"],
    ["vendor", "vendor"],
    ["datasetTag", "dataset tag"],
    ["vulnType", "vulnerability type"],
    ["severityClaim", "severity claim"],
    ["attackPrompt", "attack prompt"],
    ["expectedRisk", "expected risk"],
    ["reproSteps", "reproduction steps"],
    ["observedResult", "observed result"],
    ["smokingGun", "smoking gun"],
  ];

  return required
    .filter(([field]) => !String(finding[field] || "").trim())
    .map(([, label]) => label);
}

export function canEditFinding(status: FindingStatus): boolean {
  return status === "draft" || status === "needs_info" || status === "redaction_required";
}

export function buildEvidenceBlocks(
  finding: FindingReport,
  bundle?: ArtifactBundle,
  verificationSummary?: string
): EvidenceBlock[] {
  const blocks: EvidenceBlock[] = [
    { title: "Expected risk", content: finding.expectedRisk },
    { title: "Observed result", content: finding.observedResult },
    { title: "Smoking gun", content: finding.smokingGun },
  ];

  if (verificationSummary?.trim()) {
    blocks.push({ title: "Reviewer verification", content: verificationSummary });
  }

  if (bundle?.extractedMetadata.failureReason) {
    blocks.push({
      title: "Artifact summary",
      content: bundle.extractedMetadata.failureReason,
    });
  }

  return blocks.filter((block) => block.content.trim());
}

export function buildPublishedFinding(
  finding: FindingReport,
  bundle: ArtifactBundle | undefined,
  latestReview: ReviewRecord | undefined,
  input?: PublishFindingInput
): PublishedFinding {
  const publicTitle = input?.publicTitle?.trim() || finding.title;
  const publicSummary = input?.publicSummary?.trim() || finding.summary;
  const verificationBadge = input?.verificationBadge?.trim() || "reviewer verified";
  const slug = slugify(`${finding.skillName}-${finding.vulnType}-${publicTitle}`) || slugify(finding.id);

  return {
    id: createId("pub"),
    findingId: finding.id,
    slug,
    publicTitle,
    publicSummary,
    publicEvidenceBlocks: buildEvidenceBlocks(
      finding,
      bundle,
      latestReview?.verificationSummary || finding.verificationSummary
    ),
    publicArtifactLinks:
      bundle?.artifacts
        .filter((artifact) => artifact.publicSafe)
        .map((artifact) => ({
          label: artifact.originalName,
          artifactId: artifact.id,
        })) || [],
    verificationBadge,
    verdict: bundle?.extractedMetadata.verdict,
    publishedAt: nowIso(),
    skillName: finding.skillName,
    vendor: finding.vendor,
    datasetTag: finding.datasetTag,
    modelTags: finding.modelTags,
    vulnType: finding.vulnType,
    severityClaim: finding.severityClaim,
    reporterId: finding.reporterId,
  };
}

export function findLatestReview(reviews: ReviewRecord[], findingId: string): ReviewRecord | undefined {
  return reviews
    .filter((review) => review.findingId === findingId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

export function scoreDuplicateCandidate(
  current: FindingReport,
  candidate: FindingReport
): DuplicateCandidate | null {
  if (current.id === candidate.id) {
    return null;
  }

  let score = 0;
  const reasons: string[] = [];

  if (normalizeUrl(current.skillUrl) === normalizeUrl(candidate.skillUrl)) {
    score += 5;
    reasons.push("same skill URL");
  }
  if (normalizeTokenString(current.vulnType) === normalizeTokenString(candidate.vulnType)) {
    score += 3;
    reasons.push("same vulnerability type");
  }
  if (normalizeTokenString(current.skillName) === normalizeTokenString(candidate.skillName)) {
    score += 2;
    reasons.push("same skill name");
  }
  if (
    tokenize(current.smokingGun).some((token) => token.length > 6 && tokenize(candidate.smokingGun).includes(token))
  ) {
    score += 2;
    reasons.push("similar smoking gun");
  }
  if (
    tokenize(current.attackPrompt).some((token) => token.length > 8 && tokenize(candidate.attackPrompt).includes(token))
  ) {
    score += 1;
    reasons.push("similar prompt");
  }

  if (score < 4) {
    return null;
  }

  return {
    findingId: candidate.id,
    title: candidate.title,
    score,
    reason: reasons.join(", "),
  };
}

export function buildDuplicateCandidates(
  current: FindingReport,
  findings: FindingReport[]
): DuplicateCandidate[] {
  return findings
    .map((candidate) => scoreDuplicateCandidate(current, candidate))
    .filter((item): item is DuplicateCandidate => Boolean(item))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export function computeSnapshots(state: CommunityState): AggregateSnapshot[] {
  const published = [...state.publishedFindings].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const reviews = state.reviewRecords;
  const users = new Map(state.users.map((user) => [user.id, user]));

  const homePayload = {
    publishedCount: published.length,
    verifiedCount: reviews.filter((review) => review.statusAfter === "reviewer_verified").length,
    reporterCount: new Set(state.findings.map((finding) => finding.reporterId)).size,
    latestPublished: published.slice(0, 5),
    latestVerified: reviews
      .filter((review) => review.statusAfter === "reviewer_verified")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5)
      .map((review) => {
        const finding = state.findings.find((item) => item.id === review.findingId);
        return {
          reviewId: review.id,
          findingId: review.findingId,
          title: finding?.title,
          verificationSummary: review.verificationSummary,
          createdAt: review.createdAt,
        };
      }),
  };

  const reporterPublished = new Map<string, number>();
  const reporterVerified = new Map<string, number>();
  const skillCounts = new Map<string, number>();
  const vendorCounts = new Map<string, number>();
  const datasetCounts = new Map<string, number>();
  const modelCounts = new Map<
    string,
    { count: number; verdicts: Record<string, number>; skills: Set<string> }
  >();

  for (const item of published) {
    reporterPublished.set(item.reporterId, (reporterPublished.get(item.reporterId) || 0) + 1);
    skillCounts.set(item.skillName, (skillCounts.get(item.skillName) || 0) + 1);
    vendorCounts.set(item.vendor, (vendorCounts.get(item.vendor) || 0) + 1);
    datasetCounts.set(item.datasetTag, (datasetCounts.get(item.datasetTag) || 0) + 1);

    for (const model of item.modelTags) {
      const current = modelCounts.get(model) || {
        count: 0,
        verdicts: {},
        skills: new Set<string>(),
      };
      current.count += 1;
      current.verdicts[item.verdict || "reported"] = (current.verdicts[item.verdict || "reported"] || 0) + 1;
      current.skills.add(item.skillName);
      modelCounts.set(model, current);
    }
  }

  for (const review of reviews.filter((item) => item.statusAfter === "reviewer_verified")) {
    const finding = state.findings.find((item) => item.id === review.findingId);
    if (finding) {
      reporterVerified.set(finding.reporterId, (reporterVerified.get(finding.reporterId) || 0) + 1);
    }
  }

  const leaderboardPayload = {
    reportersByPublished: [...reporterPublished.entries()]
      .map(([userId, count]) => ({
        userId,
        label: users.get(userId)?.name || userId,
        count,
      }))
      .sort((a, b) => b.count - a.count),
    reportersByVerified: [...reporterVerified.entries()]
      .map(([userId, count]) => ({
        userId,
        label: users.get(userId)?.name || userId,
        count,
      }))
      .sort((a, b) => b.count - a.count),
    skillsByPublished: [...skillCounts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
    vendorsByPublished: [...vendorCounts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
  };

  const datasetPayload = [...datasetCounts.entries()]
    .map(([label, count]) => ({
      label,
      count,
      findings: published.filter((item) => item.datasetTag === label).slice(0, 4),
    }))
    .sort((a, b) => b.count - a.count);

  const modelPayload = [...modelCounts.entries()]
    .map(([label, value]) => ({
      label,
      count: value.count,
      verdicts: value.verdicts,
      affectedSkillCount: value.skills.size,
    }))
    .sort((a, b) => b.count - a.count);

  return [
    {
      id: createId("snap"),
      scope: "home",
      key: "default",
      payload: homePayload,
      updatedAt: nowIso(),
    },
    {
      id: createId("snap"),
      scope: "leaderboard",
      key: "default",
      payload: leaderboardPayload,
      updatedAt: nowIso(),
    },
    {
      id: createId("snap"),
      scope: "dataset",
      key: "default",
      payload: { items: datasetPayload },
      updatedAt: nowIso(),
    },
    {
      id: createId("snap"),
      scope: "model",
      key: "default",
      payload: { items: modelPayload },
      updatedAt: nowIso(),
    },
  ];
}

export function normalizeUrl(value: string): string {
  return value.trim().toLowerCase().replace(/\/+$/, "");
}

export function normalizeTokenString(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

export function tokenize(value: string): string[] {
  return normalizeTokenString(value)
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean);
}
