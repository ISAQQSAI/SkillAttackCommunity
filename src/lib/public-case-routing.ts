function readJsonRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function readJsonList(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function normalizeId(value: unknown) {
  return String(value || "").trim();
}

function firstMatchingFinding(
  findings: Record<string, unknown>[],
  findingKey: string,
  options: { reportSkillId?: string | null; model?: string | null } = {}
) {
  const normalizedFindingKey = normalizeId(findingKey);
  const normalizedSkillId = normalizeId(options.reportSkillId);
  const normalizedModel = normalizeId(options.model);

  const candidates = findings
    .map((finding, index) => ({ finding, index }))
    .filter(({ finding }) => normalizeId(finding.findingKey) === normalizedFindingKey);

  if (!candidates.length) {
    return null;
  }

  const exactMatch = candidates.find(({ finding }) => {
    return (
      (!normalizedSkillId || normalizeId(finding.reportSkillId) === normalizedSkillId) &&
      (!normalizedModel || normalizeId(finding.model) === normalizedModel)
    );
  });

  if (exactMatch) {
    return exactMatch;
  }

  const skillMatch = normalizedSkillId
    ? candidates.find(({ finding }) => normalizeId(finding.reportSkillId) === normalizedSkillId)
    : null;

  if (skillMatch) {
    return skillMatch;
  }

  const modelMatch = normalizedModel
    ? candidates.find(({ finding }) => normalizeId(finding.model) === normalizedModel)
    : null;

  return modelMatch || candidates[0];
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

export function getPrimaryPublicFindingTarget(payload: unknown) {
  const record = readJsonRecord(payload);
  const findings = readJsonList(record.findings).map((item) => readJsonRecord(item));
  const firstFinding = findings[0];

  if (!firstFinding) {
    return null;
  }

  const findingKey = normalizeId(firstFinding.findingKey);

  if (!findingKey) {
    return null;
  }

  return {
    findingKey,
    reportSkillId: normalizeId(firstFinding.reportSkillId) || null,
    model: normalizeId(firstFinding.model) || null,
  };
}

export function findPublicCaseFinding(
  payload: unknown,
  findingKey: string,
  options: { reportSkillId?: string | null; model?: string | null } = {}
) {
  const record = readJsonRecord(payload);
  const findings = readJsonList(record.findings).map((item) => readJsonRecord(item));
  const matched = firstMatchingFinding(findings, findingKey, options);

  if (!matched) {
    return null;
  }

  return {
    finding: matched.finding,
    index: matched.index,
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
  reportSkillId,
  model,
  payload,
  preferredSkillId,
}: {
  slug: string;
  findingKey: string;
  reportSkillId?: string | null;
  model?: string | null;
  payload?: unknown;
  preferredSkillId?: string | null;
}) {
  const normalizedSlug = encodeURIComponent(slug);
  const normalizedFindingKey = encodeURIComponent(normalizeId(findingKey));
  const normalizedSkillId = normalizeId(reportSkillId || preferredSkillId);
  const normalizedModel = normalizeId(model);

  if (!normalizedFindingKey) {
    return getPublicCasePath({ slug, payload, preferredSkillId });
  }

  const query = new URLSearchParams();

  if (normalizedSkillId) {
    query.set("skill", normalizedSkillId);
  }

  if (normalizedModel) {
    query.set("model", normalizedModel);
  }

  const suffix = query.toString();

  return suffix
    ? `/vulnerabilities/${normalizedSlug}/${normalizedFindingKey}?${suffix}`
    : `/vulnerabilities/${normalizedSlug}/${normalizedFindingKey}`;
}

export { readJsonList, readJsonRecord };
