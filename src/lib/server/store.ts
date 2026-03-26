import { promises as fs } from "fs";
import path from "path";

import {
  buildDuplicateCandidates,
  buildPublishedFinding,
  canEditFinding,
  computeSnapshots,
  createId,
  findLatestReview,
  findingDraftSchema,
  humanizeStatus,
  missingRequiredFields,
  nowIso,
  publishFindingSchema,
  reviewStatusSchema,
  type AggregateSnapshot,
  type ArtifactBundle,
  type CommunityState,
  type CommunityUser,
  type FindingDraftInput,
  type FindingReport,
  type PublishedFinding,
  type ReviewRecord,
  type StoredArtifact,
  type Viewer,
} from "@/lib/community";
import { createSeedState } from "@/lib/demo-seed";

const VAR_DIR = path.join(process.cwd(), "var");
const STATE_FILE = path.join(VAR_DIR, "community-state.json");

export interface PublicFindingView {
  finding: FindingReport;
  published: PublishedFinding;
  bundle?: ArtifactBundle;
  reporter?: CommunityUser;
}

export interface ReviewFindingView {
  finding: FindingReport;
  reporter?: CommunityUser;
  bundle?: ArtifactBundle;
  latestReview?: ReviewRecord;
  duplicateCandidates: ReturnType<typeof buildDuplicateCandidates>;
  published?: PublishedFinding;
}

export interface ViewerFindingView {
  finding: FindingReport;
  reporter?: CommunityUser;
  bundle?: ArtifactBundle;
  latestReview?: ReviewRecord;
  published?: PublishedFinding;
}

async function ensureState(): Promise<CommunityState> {
  await fs.mkdir(VAR_DIR, { recursive: true });
  try {
    const content = await fs.readFile(STATE_FILE, "utf-8");
    const parsed = JSON.parse(content) as CommunityState;
    let changed = false;
    for (const finding of parsed.findings || []) {
      if (!Array.isArray(finding.externalReferences)) {
        finding.externalReferences = [];
        changed = true;
      }
    }
    if (!parsed.aggregateSnapshots?.length) {
      parsed.aggregateSnapshots = computeSnapshots(parsed);
      changed = true;
    }
    if (changed) {
      await writeState(parsed);
    }
    return parsed;
  } catch {
    const seed = createSeedState();
    await writeState(seed);
    return seed;
  }
}

async function writeState(state: CommunityState): Promise<void> {
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
}

async function withState<T>(mutator: (state: CommunityState) => Promise<T> | T): Promise<T> {
  const state = await ensureState();
  const result = await mutator(state);
  await writeState(state);
  return result;
}

function upsertViewerAsUser(state: CommunityState, viewer: Viewer): CommunityUser {
  const existing = state.users.find((user) => user.id === viewer.id || user.githubLogin === viewer.login);
  if (existing) {
    existing.name = viewer.name;
    existing.role = viewer.role;
    existing.email = viewer.email || existing.email;
    existing.image = viewer.image || existing.image;
    existing.githubLogin = viewer.login || existing.githubLogin;
    existing.updatedAt = nowIso();
    return existing;
  }

  const created: CommunityUser = {
    id: viewer.id,
    githubLogin: viewer.login,
    name: viewer.name,
    email: viewer.email,
    image: viewer.image,
    role: viewer.role,
    visibility: { showProfile: true, showEmail: false },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  state.users.push(created);
  return created;
}

function getBundle(state: CommunityState, findingId: string): ArtifactBundle | undefined {
  return state.artifactBundles.find((bundle) => bundle.findingId === findingId);
}

function getPublished(state: CommunityState, findingId: string): PublishedFinding | undefined {
  return state.publishedFindings.find((item) => item.findingId === findingId);
}

function computeAndStoreSnapshots(state: CommunityState): AggregateSnapshot[] {
  const snapshots = computeSnapshots(state);
  state.aggregateSnapshots = snapshots;
  return snapshots;
}

function serializeFindingInput(existing: FindingReport | undefined, viewer: Viewer, input: FindingDraftInput): FindingReport {
  const parsed = findingDraftSchema.parse(input);
  const now = nowIso();

  return {
    id: existing?.id || createId("finding"),
    status: existing?.status || "draft",
    reporterId: existing?.reporterId || viewer.id,
    title: parsed.title,
    summary: parsed.summary,
    skillName: parsed.skillName,
    skillUrl: parsed.skillUrl,
    vendor: parsed.vendor,
    skillVersion: parsed.skillVersion || "",
    datasetTag: parsed.datasetTag || "community",
    modelTags: parsed.modelTags,
    vulnType: parsed.vulnType,
    severityClaim: parsed.severityClaim || "medium",
    attackPrompt: parsed.attackPrompt,
    expectedRisk: parsed.expectedRisk,
    reproSteps: parsed.reproSteps,
    observedResult: parsed.observedResult,
    smokingGun: parsed.smokingGun,
    externalReferences: parsed.externalReferences,
    publicSafe: parsed.publicSafe,
    submittedAt: existing?.submittedAt,
    verificationSummary: existing?.verificationSummary,
    duplicateOfId: existing?.duplicateOfId,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
}

export async function getBackendSummary(): Promise<{
  mode: "file-demo";
  statePath: string;
  prismaReady: boolean;
}> {
  return {
    mode: "file-demo",
    statePath: STATE_FILE,
    prismaReady: Boolean(process.env.DATABASE_URL),
  };
}

export async function getHomeSnapshot() {
  const state = await ensureState();
  return state.aggregateSnapshots.find((snapshot) => snapshot.scope === "home");
}

export async function getLeaderboardSnapshot() {
  const state = await ensureState();
  return state.aggregateSnapshots.find((snapshot) => snapshot.scope === "leaderboard");
}

export async function getDatasetSnapshot() {
  const state = await ensureState();
  return state.aggregateSnapshots.find((snapshot) => snapshot.scope === "dataset");
}

export async function getModelSnapshot() {
  const state = await ensureState();
  return state.aggregateSnapshots.find((snapshot) => snapshot.scope === "model");
}

export async function listPublicFindingViews(filters?: {
  q?: string;
  skill?: string;
  skillUrl?: string;
  model?: string;
  dataset?: string;
  vuln?: string;
  verification?: string;
}) {
  const state = await ensureState();
  const users = new Map(state.users.map((user) => [user.id, user]));

  return state.publishedFindings
    .map<PublicFindingView>((published) => ({
      finding: state.findings.find((finding) => finding.id === published.findingId)!,
      published,
      bundle: getBundle(state, published.findingId),
      reporter: users.get(published.reporterId),
    }))
    .filter((item) => {
      const q = (filters?.q || "").trim().toLowerCase();
      if (filters?.skill && !item.finding.skillName.toLowerCase().includes(filters.skill.toLowerCase())) {
        return false;
      }
      if (filters?.skillUrl && !item.finding.skillUrl.toLowerCase().includes(filters.skillUrl.toLowerCase())) {
        return false;
      }
      if (filters?.model && !item.finding.modelTags.includes(filters.model)) {
        return false;
      }
      if (filters?.dataset && item.finding.datasetTag !== filters.dataset) {
        return false;
      }
      if (filters?.vuln && item.finding.vulnType !== filters.vuln) {
        return false;
      }
      if (filters?.verification && item.published.verificationBadge !== filters.verification) {
        return false;
      }
      if (
        q &&
        ![
          item.finding.title,
          item.finding.summary,
          item.finding.skillName,
          item.finding.skillUrl,
          item.finding.vulnType,
          item.finding.smokingGun,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => b.published.publishedAt.localeCompare(a.published.publishedAt));
}

export async function getPublicFindingBySlug(slug: string) {
  const state = await ensureState();
  const published = state.publishedFindings.find((item) => item.slug === slug);
  if (!published) {
    return null;
  }
  const finding = state.findings.find((item) => item.id === published.findingId)!;
  const reporter = state.users.find((item) => item.id === published.reporterId);
  const bundle = getBundle(state, finding.id);
  return { finding, published, reporter, bundle };
}

export async function listReviewFindings(filters?: {
  status?: string;
  vendor?: string;
  vuln?: string;
  dataset?: string;
}) {
  const state = await ensureState();
  return state.findings
    .filter((finding) => finding.status !== "draft")
    .filter((finding) => !filters?.status || finding.status === filters.status)
    .filter((finding) => !filters?.vendor || finding.vendor === filters.vendor)
    .filter((finding) => !filters?.vuln || finding.vulnType === filters.vuln)
    .filter((finding) => !filters?.dataset || finding.datasetTag === filters.dataset)
    .map<ReviewFindingView>((finding) => ({
      finding,
      reporter: state.users.find((user) => user.id === finding.reporterId),
      bundle: getBundle(state, finding.id),
      latestReview: findLatestReview(state.reviewRecords, finding.id),
      duplicateCandidates: buildDuplicateCandidates(finding, state.findings),
      published: getPublished(state, finding.id),
    }))
    .sort((a, b) => b.finding.updatedAt.localeCompare(a.finding.updatedAt));
}

export async function getReviewFinding(id: string): Promise<ReviewFindingView | null> {
  const state = await ensureState();
  const finding = state.findings.find((item) => item.id === id);
  if (!finding) {
    return null;
  }
  return {
    finding,
    reporter: state.users.find((user) => user.id === finding.reporterId),
    bundle: getBundle(state, finding.id),
    latestReview: findLatestReview(state.reviewRecords, finding.id),
    duplicateCandidates: buildDuplicateCandidates(finding, state.findings),
    published: getPublished(state, finding.id),
  };
}

export async function saveDraft(input: FindingDraftInput, viewer: Viewer): Promise<FindingReport> {
  return withState(async (state) => {
    upsertViewerAsUser(state, viewer);
    const existing = input.id ? state.findings.find((item) => item.id === input.id) : undefined;
    if (existing && existing.reporterId !== viewer.id) {
      throw new Error("You can only edit your own reports.");
    }
    if (existing && !canEditFinding(existing.status)) {
      throw new Error(`This report cannot be edited while in ${humanizeStatus(existing.status)}.`);
    }
    const serialized = serializeFindingInput(existing, viewer, input);
    if (existing) {
      Object.assign(existing, serialized);
      return existing;
    }
    state.findings.push(serialized);
    return serialized;
  });
}

export async function submitFinding(id: string, viewer: Viewer): Promise<FindingReport> {
  return withState(async (state) => {
    upsertViewerAsUser(state, viewer);
    const finding = state.findings.find((item) => item.id === id);
    if (!finding) {
      throw new Error("Finding not found.");
    }
    if (finding.reporterId !== viewer.id) {
      throw new Error("You can only submit your own report.");
    }
    if (!canEditFinding(finding.status)) {
      throw new Error(`This report cannot be submitted while in ${humanizeStatus(finding.status)}.`);
    }
    const missing = missingRequiredFields(finding);
    if (missing.length) {
      throw new Error(`Missing required fields: ${missing.join(", ")}.`);
    }
    finding.status = "submitted";
    finding.submittedAt = nowIso();
    finding.updatedAt = nowIso();
    return finding;
  });
}

export async function attachArtifacts(
  findingId: string,
  viewer: Viewer,
  bundleInput: Omit<ArtifactBundle, "id" | "findingId" | "createdAt" | "updatedAt">
): Promise<ArtifactBundle> {
  return withState(async (state) => {
    upsertViewerAsUser(state, viewer);
    const finding = state.findings.find((item) => item.id === findingId);
    if (!finding) {
      throw new Error("Finding not found.");
    }
    if (finding.reporterId !== viewer.id && viewer.role === "reporter") {
      throw new Error("You can only upload evidence to your own report.");
    }

    const existing = getBundle(state, findingId);
    const mergedArtifacts = [...(existing?.artifacts || []), ...bundleInput.artifacts];
    const mergedDetected = [...new Set([...(existing?.detectedFiles || []), ...bundleInput.detectedFiles])].sort();
    const mergedFlags = [...new Set([...(existing?.redactionFlags || []), ...bundleInput.redactionFlags])];
    const mergedBundle: ArtifactBundle = {
      id: existing?.id || createId("bundle"),
      findingId,
      rawUploadLocation: bundleInput.rawUploadLocation,
      parsedManifest: {
        ...(existing?.parsedManifest || {}),
        ...(bundleInput.parsedManifest || {}),
      },
      detectedFiles: mergedDetected,
      extractedMetadata: {
        ...(existing?.extractedMetadata || {}),
        ...(bundleInput.extractedMetadata || {}),
      },
      redactionFlags: mergedFlags,
      artifacts: mergedArtifacts,
      createdAt: existing?.createdAt || nowIso(),
      updatedAt: nowIso(),
    };

    if (existing) {
      Object.assign(existing, mergedBundle);
    } else {
      state.artifactBundles.push(mergedBundle);
    }

    state.jobs.push(
      {
        id: createId("job"),
        type: "parse_artifact_bundle",
        status: "queued",
        payload: { findingId },
        attempts: 0,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
      {
        id: createId("job"),
        type: "suggest_duplicates",
        status: "queued",
        payload: { findingId },
        attempts: 0,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
    );

    return existing || mergedBundle;
  });
}

export async function transitionFindingStatus(
  findingId: string,
  viewer: Viewer,
  input: unknown
): Promise<FindingReport> {
  const parsed = reviewStatusSchema.parse(input);
  return withState(async (state) => {
    upsertViewerAsUser(state, viewer);
    const finding = state.findings.find((item) => item.id === findingId);
    if (!finding) {
      throw new Error("Finding not found.");
    }
    const bundle = getBundle(state, findingId);
    const before = finding.status;

    if (parsed.status === "duplicate" && !parsed.duplicateTargetId) {
      throw new Error("duplicateTargetId is required for duplicate reports.");
    }
    if (parsed.status === "reviewer_verified" && !parsed.verificationSummary.trim()) {
      throw new Error("verificationSummary is required before reviewer verification.");
    }

    if (bundle) {
      bundle.redactionFlags = parsed.redactionFlags;
      bundle.updatedAt = nowIso();
    }

    finding.status = parsed.status;
    finding.verificationSummary = parsed.verificationSummary || finding.verificationSummary;
    finding.duplicateOfId = parsed.duplicateTargetId || finding.duplicateOfId;
    finding.updatedAt = nowIso();

    state.reviewRecords.push({
      id: createId("review"),
      findingId,
      reviewerId: viewer.id,
      statusBefore: before,
      statusAfter: parsed.status,
      reviewerNotes: parsed.reviewerNotes,
      redactionNotes: parsed.redactionNotes,
      duplicateTargetId: parsed.duplicateTargetId,
      verificationSummary: parsed.verificationSummary,
      createdAt: nowIso(),
    });

    return finding;
  });
}

export async function publishFinding(
  findingId: string,
  viewer: Viewer,
  input: unknown
): Promise<PublishedFinding> {
  const parsed = publishFindingSchema.parse(input);
  return withState(async (state) => {
    upsertViewerAsUser(state, viewer);
    const finding = state.findings.find((item) => item.id === findingId);
    if (!finding) {
      throw new Error("Finding not found.");
    }
    if (finding.status !== "reviewer_verified") {
      throw new Error("Only reviewer_verified findings can be published.");
    }
    const bundle = getBundle(state, findingId);
    if (bundle?.redactionFlags.length) {
      throw new Error("Clear redaction flags before publishing.");
    }

    const latestReview = findLatestReview(state.reviewRecords, findingId);
    const published = buildPublishedFinding(finding, bundle, latestReview, parsed);
    const existing = getPublished(state, findingId);
    if (existing) {
      Object.assign(existing, published, { id: existing.id, findingId });
    } else {
      state.publishedFindings.push(published);
    }

    finding.status = "published";
    finding.updatedAt = nowIso();

    state.reviewRecords.push({
      id: createId("review"),
      findingId,
      reviewerId: viewer.id,
      statusBefore: "reviewer_verified",
      statusAfter: "published",
      reviewerNotes: "Published to the public findings index.",
      verificationSummary: finding.verificationSummary,
      createdAt: nowIso(),
    });

    state.jobs.push(
      {
        id: createId("job"),
        type: "build_public_case_payload",
        status: "queued",
        payload: { findingId },
        attempts: 0,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
      {
        id: createId("job"),
        type: "refresh_public_aggregates",
        status: "queued",
        payload: { findingId },
        attempts: 0,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
    );
    computeAndStoreSnapshots(state);

    return getPublished(state, findingId)!;
  });
}

export async function getArtifactById(
  findingId: string,
  artifactId: string
): Promise<{ artifact: StoredArtifact; finding: FindingReport; published?: PublishedFinding } | null> {
  const state = await ensureState();
  const finding = state.findings.find((item) => item.id === findingId);
  const bundle = getBundle(state, findingId);
  const artifact = bundle?.artifacts.find((item) => item.id === artifactId);
  if (!finding || !artifact) {
    return null;
  }
  return { artifact, finding, published: getPublished(state, findingId) };
}

export async function listViewerFindings(viewer: Viewer): Promise<ViewerFindingView[]> {
  const state = await ensureState();
  return state.findings
    .filter((finding) => finding.reporterId === viewer.id || viewer.role === "reviewer" || viewer.role === "admin")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((finding) => ({
      finding,
      reporter: state.users.find((user) => user.id === finding.reporterId),
      bundle: getBundle(state, finding.id),
      latestReview: findLatestReview(state.reviewRecords, finding.id),
      published: getPublished(state, finding.id),
    }));
}

export async function getViewerFinding(id: string, viewer: Viewer): Promise<ViewerFindingView | null> {
  const state = await ensureState();
  const finding = state.findings.find((item) => item.id === id);
  if (!finding) {
    return null;
  }
  if (finding.reporterId !== viewer.id && viewer.role !== "reviewer" && viewer.role !== "admin") {
    return null;
  }
  return {
    finding,
    reporter: state.users.find((user) => user.id === finding.reporterId),
    bundle: getBundle(state, finding.id),
    latestReview: findLatestReview(state.reviewRecords, finding.id),
    published: getPublished(state, finding.id),
  };
}

export async function unpublishFinding(findingId: string, viewer: Viewer): Promise<FindingReport> {
  return withState(async (state) => {
    upsertViewerAsUser(state, viewer);
    const finding = state.findings.find((item) => item.id === findingId);
    if (!finding) {
      throw new Error("Finding not found.");
    }
    const publishedIndex = state.publishedFindings.findIndex((item) => item.findingId === findingId);
    if (publishedIndex === -1) {
      throw new Error("Finding is not currently published.");
    }

    state.publishedFindings.splice(publishedIndex, 1);
    const previousStatus = finding.status;
    finding.status = "reviewer_verified";
    finding.updatedAt = nowIso();

    state.reviewRecords.push({
      id: createId("review"),
      findingId,
      reviewerId: viewer.id,
      statusBefore: previousStatus,
      statusAfter: "reviewer_verified",
      reviewerNotes: "Unpublished from the public findings index.",
      verificationSummary: finding.verificationSummary,
      createdAt: nowIso(),
    });
    state.jobs.push({
      id: createId("job"),
      type: "refresh_public_aggregates",
      status: "queued",
      payload: { findingId, action: "unpublish" },
      attempts: 0,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    computeAndStoreSnapshots(state);
    return finding;
  });
}
