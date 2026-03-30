import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";

const STORAGE_SUBDIR = (process.env.LOCAL_STORAGE_ROOT || "uploads").replace(/^\/+/, "");
const DEFAULT_ROOT = path.join(process.cwd(), "var", STORAGE_SUBDIR, "submissions");

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export function sha256(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export async function saveSubmissionBundle(
  folderId: string,
  fileName: string,
  buffer: Buffer
) {
  const safeName = sanitizeName(fileName || "report_bundle.zip");
  const storageKey = path.posix.join("submissions", folderId, safeName);
  const absolutePath = path.join(DEFAULT_ROOT, folderId, safeName);
  await ensureDir(path.dirname(absolutePath));
  await fs.writeFile(absolutePath, buffer);
  return {
    storageKey,
    absolutePath,
    sha256: sha256(buffer),
  };
}

export async function readSubmissionBundle(storageKey: string) {
  const relativePath = storageKey.replace(/^submissions\//, "");
  return fs.readFile(path.join(DEFAULT_ROOT, relativePath));
}
