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

export function getPrimaryPublicFindingKey(payload: unknown) {
  const record = readJsonRecord(payload);
  const findings = readJsonList(record.findings);
  const firstFindingKey = normalizeId(readJsonRecord(findings[0]).findingKey);
  return firstFindingKey || null;
}

export function findPublicCaseFinding(payload: unknown, findingKey: string) {
  const record = readJsonRecord(payload);
  const findings = readJsonList(record.findings).map((item) => readJsonRecord(item));
  const normalizedFindingKey = normalizeId(findingKey);

  if (!normalizedFindingKey) {
    return null;
  }

  const index = findings.findIndex(
    (item) => normalizeId(item.findingKey) === normalizedFindingKey
  );

  if (index < 0) {
    return null;
  }

  return {
    finding: findings[index],
    index,
  };
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
  const normalizedSlug = encodeURIComponent(slug);
  const normalizedFindingKey = encodeURIComponent(normalizeId(findingKey));

  if (!normalizedFindingKey) {
    return getPublicCasePath({ slug, payload, preferredSkillId });
  }

  return `/vulnerabilities/${normalizedSlug}/${normalizedFindingKey}`;
}

export { readJsonList, readJsonRecord };
