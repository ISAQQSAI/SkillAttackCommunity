function readJsonRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function readJsonList(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function normalizeId(value: unknown) {
  return String(value || "").trim();
}

export function getPublicCaseSkillIds(payload: unknown) {
  const record = readJsonRecord(payload);
  const findings = readJsonList(record.findings);
  const reports = readJsonList(record.reports);
  const ids = new Set<string>();

  for (const finding of findings) {
    const skillId = normalizeId(readJsonRecord(finding).reportSkillId);
    if (skillId) {
      ids.add(skillId);
    }
  }

  for (const report of reports) {
    const skillId = normalizeId(readJsonRecord(report).skillId);
    if (skillId) {
      ids.add(skillId);
    }
  }

  return [...ids];
}

export function getPrimaryPublicCaseSkillId(payload: unknown) {
  const record = readJsonRecord(payload);
  const findings = readJsonList(record.findings);
  const reports = readJsonList(record.reports);

  const findingSkillId = normalizeId(readJsonRecord(findings[0]).reportSkillId);
  if (findingSkillId) {
    return findingSkillId;
  }

  const reportSkillId = normalizeId(readJsonRecord(reports[0]).skillId);
  return reportSkillId || null;
}

export function getPublicCasePath({
  slug,
}: {
  slug: string;
  payload?: unknown;
  preferredSkillId?: string | null;
}) {
  const normalizedSlug = encodeURIComponent(slug);
  return `/vulnerabilities/${normalizedSlug}`;
}

export function getPublicFindingPath({
  slug,
  findingKey,
  payload,
  preferredSkillId,
}: {
  slug: string;
  findingKey: string;
  payload?: unknown;
  preferredSkillId?: string | null;
}) {
  return getPublicCasePath({ slug, payload, preferredSkillId });
}

export { readJsonList, readJsonRecord };
