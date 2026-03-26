import AdmZip from "adm-zip";
import { promises as fs } from "fs";
import path from "path";

import {
  KNOWN_ARTIFACT_FILES,
  type ArtifactExtraction,
  type StoredArtifact,
  createId,
  nowIso,
} from "@/lib/community";

const STORAGE_SUBDIR = (process.env.LOCAL_STORAGE_ROOT || "uploads").replace(/^\/+/, "");
const DEFAULT_ROOT = path.join(process.cwd(), "var", STORAGE_SUBDIR);
const REDACTION_PATTERNS = [
  /sk-[a-z0-9]{16,}/i,
  /ghp_[a-z0-9]{20,}/i,
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN [A-Z ]+ PRIVATE KEY-----/,
  /\/root\/[^\s]+/,
];

export interface StoredUploadResult {
  artifacts: StoredArtifact[];
  detectedFiles: string[];
  extractedMetadata: ArtifactExtraction;
  redactionFlags: string[];
  parsedManifest: Record<string, unknown>;
  rawUploadLocation: string;
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

async function saveBuffer(target: string, buffer: Buffer): Promise<void> {
  await ensureDir(path.dirname(target));
  await fs.writeFile(target, buffer);
}

function buildPreview(contentType: string, buffer: Buffer): string | undefined {
  if (contentType.includes("image") || contentType.includes("pdf")) {
    return undefined;
  }
  const text = buffer.toString("utf-8").trim();
  return text.slice(0, 1200);
}

function updateExtractionFromJson(name: string, parsed: Record<string, unknown>, extraction: ArtifactExtraction) {
  if (name === "judge.json") {
    extraction.verdict = String(parsed.verdict || extraction.verdict || "");
    extraction.confidence = typeof parsed.confidence === "number" ? parsed.confidence : extraction.confidence;
    const smokingGun = parsed.smoking_gun;
    if (Array.isArray(smokingGun) && smokingGun[0]) {
      extraction.smokingGun = String(smokingGun[0]);
    } else if (typeof smokingGun === "string") {
      extraction.smokingGun = smokingGun;
    }
    if (parsed.failure_reason) {
      extraction.failureReason = String(parsed.failure_reason);
    }
    if (parsed.run_id) {
      extraction.runId = String(parsed.run_id);
    }
    if (parsed.skill_id) {
      extraction.skillId = String(parsed.skill_id);
    }
  }

  if (name === "analysis.json") {
    if (parsed.skill_id) {
      extraction.skillId = String(parsed.skill_id);
    }
    if (parsed.vuln_type) {
      extraction.vulnType = String(parsed.vuln_type);
    }
  }

  if (name === "attack.json") {
    if (parsed.target_objective) {
      extraction.targetObjective = String(parsed.target_objective);
    }
  }
}

function detectRedactionFlags(previews: string[]): string[] {
  const flags = new Set<string>();
  for (const preview of previews) {
    for (const pattern of REDACTION_PATTERNS) {
      if (pattern.test(preview)) {
        flags.add("possible secret or local-path leakage");
      }
    }
  }
  return [...flags];
}

async function persistExtractedArtifact(
  baseDir: string,
  findingId: string,
  fileName: string,
  contentType: string,
  buffer: Buffer,
  publicSafe: boolean
): Promise<StoredArtifact> {
  const artifactId = createId("artifact");
  const safeName = sanitizeName(fileName);
  const targetPath = path.join(baseDir, findingId, `${artifactId}__${safeName}`);
  await saveBuffer(targetPath, buffer);
  return {
    id: artifactId,
    name: fileName,
    originalName: fileName,
    storagePath: targetPath,
    contentType,
    sizeBytes: buffer.byteLength,
    uploadedAt: nowIso(),
    publicSafe,
    preview: buildPreview(contentType, buffer),
  };
}

export async function saveUploadedArtifacts(
  findingId: string,
  files: File[],
  publicSafe: boolean
): Promise<StoredUploadResult> {
  const artifacts: StoredArtifact[] = [];
  const detectedFiles = new Set<string>();
  const extraction: ArtifactExtraction = {};
  const previews: string[] = [];
  const zipEntries: string[] = [];

  await ensureDir(DEFAULT_ROOT);

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const originalArtifact = await persistExtractedArtifact(
      DEFAULT_ROOT,
      findingId,
      file.name,
      file.type || "application/octet-stream",
      buffer,
      publicSafe
    );
    artifacts.push(originalArtifact);
    if (originalArtifact.preview) {
      previews.push(originalArtifact.preview);
    }

    if (file.name.toLowerCase().endsWith(".zip")) {
      const archive = new AdmZip(buffer);
      for (const entry of archive.getEntries()) {
        if (entry.isDirectory) {
          continue;
        }
        const entryName = path.basename(entry.entryName);
        zipEntries.push(entry.entryName);
        const isKnown = KNOWN_ARTIFACT_FILES.includes(entryName as (typeof KNOWN_ARTIFACT_FILES)[number]);
        const isTextLike = /\.(json|txt|md)$/i.test(entryName);
        if (!isKnown && !isTextLike) {
          continue;
        }
        const entryBuffer = entry.getData();
        const entryArtifact = await persistExtractedArtifact(
          DEFAULT_ROOT,
          findingId,
          entryName,
          entryName.endsWith(".json") ? "application/json" : "text/plain",
          entryBuffer,
          publicSafe
        );
        artifacts.push(entryArtifact);
        detectedFiles.add(entryName);
        if (entryArtifact.preview) {
          previews.push(entryArtifact.preview);
        }
        if (entryName.endsWith(".json")) {
          try {
            updateExtractionFromJson(entryName, JSON.parse(entryBuffer.toString("utf-8")), extraction);
          } catch {
            // Ignore invalid JSON and keep the artifact available for reviewer preview.
          }
        }
      }
      continue;
    }

    detectedFiles.add(file.name);
    if (file.name.endsWith(".json")) {
      try {
        updateExtractionFromJson(file.name, JSON.parse(buffer.toString("utf-8")), extraction);
      } catch {
        // keep raw preview only
      }
    }
  }

  return {
    artifacts,
    detectedFiles: [...detectedFiles].sort(),
    extractedMetadata: extraction,
    redactionFlags: detectRedactionFlags(previews),
    parsedManifest: {
      source: "next-upload",
      uploadedArtifactCount: artifacts.length,
      zipEntries,
    },
    rawUploadLocation: path.join(DEFAULT_ROOT, findingId),
  };
}

export async function readStoredArtifact(storagePath: string): Promise<Buffer> {
  return fs.readFile(storagePath);
}
