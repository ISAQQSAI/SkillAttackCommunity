#!/usr/bin/env python3
"""SkillAttackCommunity file-backed worker.

This MVP worker processes jobs stored in var/community-state.json. It keeps the
job contract aligned with the app's future Postgres-backed schema, but the
runtime storage for this first version is local JSON so the demo can run
without additional infrastructure.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import uuid
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

ROOT = Path(__file__).resolve().parent.parent
STATE_PATH = ROOT / "var" / "community-state.json"
STORAGE_ROOT = ROOT / "var" / os.environ.get("LOCAL_STORAGE_ROOT", "uploads").lstrip("/")
WORKER_NAME = os.environ.get("WORKER_NAME", "local-worker")
POLL_SECONDS = float(os.environ.get("WORKER_POLL_SECONDS", "2"))

FINDING_STATUSES = [
    "draft",
    "submitted",
    "needs_info",
    "triaged",
    "duplicate",
    "redaction_required",
    "reviewer_verified",
    "published",
    "rejected",
]
REDACTION_PATTERNS = [
    re.compile(r"sk-[a-z0-9]{16,}", re.I),
    re.compile(r"ghp_[a-z0-9]{20,}", re.I),
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"-----BEGIN [A-Z ]+ PRIVATE KEY-----"),
    re.compile(r"/root/[^\s]+"),
]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def create_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}"


def load_state() -> Dict[str, Any]:
    if not STATE_PATH.exists():
        raise FileNotFoundError(f"State file not found: {STATE_PATH}")
    with STATE_PATH.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def save_state(state: Dict[str, Any]) -> None:
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with STATE_PATH.open("w", encoding="utf-8") as handle:
        json.dump(state, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def normalize_url(value: str) -> str:
    return value.strip().lower().rstrip("/")


def normalize_token_string(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.strip().lower())


def tokenize(value: str) -> List[str]:
    return [token for token in normalize_token_string(value).split() if token]


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def build_preview(content_type: str, raw: bytes) -> Optional[str]:
    if "image" in content_type or "pdf" in content_type:
        return None
    preview = raw.decode("utf-8", errors="ignore").strip()
    return preview[:1200] if preview else None


def detect_redaction_flags(previews: Iterable[str]) -> List[str]:
    flags = set()
    for preview in previews:
        for pattern in REDACTION_PATTERNS:
            if pattern.search(preview):
                flags.add("possible secret or local-path leakage")
    return sorted(flags)


def update_extraction_from_json(name: str, parsed: Dict[str, Any], extraction: Dict[str, Any]) -> None:
    if name == "judge.json":
        extraction["verdict"] = str(parsed.get("verdict") or extraction.get("verdict") or "")
        confidence = parsed.get("confidence")
        if isinstance(confidence, (float, int)):
            extraction["confidence"] = confidence
        smoking_gun = parsed.get("smoking_gun")
        if isinstance(smoking_gun, list) and smoking_gun:
            extraction["smokingGun"] = str(smoking_gun[0])
        elif isinstance(smoking_gun, str):
            extraction["smokingGun"] = smoking_gun
        if parsed.get("failure_reason"):
            extraction["failureReason"] = str(parsed["failure_reason"])
        if parsed.get("run_id"):
            extraction["runId"] = str(parsed["run_id"])
        if parsed.get("skill_id"):
            extraction["skillId"] = str(parsed["skill_id"])

    if name == "analysis.json":
        if parsed.get("skill_id"):
            extraction["skillId"] = str(parsed["skill_id"])
        if parsed.get("vuln_type"):
            extraction["vulnType"] = str(parsed["vuln_type"])

    if name == "attack.json" and parsed.get("target_objective"):
        extraction["targetObjective"] = str(parsed["target_objective"])


def score_duplicate_candidate(current: Dict[str, Any], candidate: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if current["id"] == candidate["id"]:
        return None

    score = 0
    reasons: List[str] = []

    if normalize_url(current.get("skillUrl", "")) == normalize_url(candidate.get("skillUrl", "")):
        score += 5
        reasons.append("same skill URL")
    if normalize_token_string(current.get("vulnType", "")) == normalize_token_string(candidate.get("vulnType", "")):
        score += 3
        reasons.append("same vulnerability type")
    if normalize_token_string(current.get("skillName", "")) == normalize_token_string(candidate.get("skillName", "")):
        score += 2
        reasons.append("same skill name")

    current_smoking = tokenize(current.get("smokingGun", ""))
    candidate_smoking = tokenize(candidate.get("smokingGun", ""))
    if any(token for token in current_smoking if len(token) > 6 and token in candidate_smoking):
        score += 2
        reasons.append("similar smoking gun")

    current_prompt = tokenize(current.get("attackPrompt", ""))
    candidate_prompt = tokenize(candidate.get("attackPrompt", ""))
    if any(token for token in current_prompt if len(token) > 8 and token in candidate_prompt):
        score += 1
        reasons.append("similar prompt")

    if score < 4:
        return None

    return {
        "findingId": candidate["id"],
        "title": candidate["title"],
        "score": score,
        "reason": ", ".join(reasons),
    }


def build_duplicate_candidates(current: Dict[str, Any], findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    results = []
    for candidate in findings:
        scored = score_duplicate_candidate(current, candidate)
        if scored:
            results.append(scored)
    results.sort(key=lambda item: item["score"], reverse=True)
    return results[:5]


def latest_review(reviews: List[Dict[str, Any]], finding_id: str) -> Optional[Dict[str, Any]]:
    candidates = [review for review in reviews if review["findingId"] == finding_id]
    candidates.sort(key=lambda item: item["createdAt"], reverse=True)
    return candidates[0] if candidates else None


def build_evidence_blocks(finding: Dict[str, Any], bundle: Optional[Dict[str, Any]], verification_summary: str) -> List[Dict[str, str]]:
    blocks = [
        {"title": "Expected risk", "content": finding.get("expectedRisk", "")},
        {"title": "Observed result", "content": finding.get("observedResult", "")},
        {"title": "Smoking gun", "content": finding.get("smokingGun", "")},
    ]
    if verification_summary.strip():
        blocks.append({"title": "Reviewer verification", "content": verification_summary})
    if bundle and bundle.get("extractedMetadata", {}).get("failureReason"):
        blocks.append({
            "title": "Artifact summary",
            "content": bundle["extractedMetadata"]["failureReason"],
        })
    return [block for block in blocks if block["content"].strip()]


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug[:80] or "finding"


def compute_snapshots(state: Dict[str, Any]) -> List[Dict[str, Any]]:
    published = sorted(state["publishedFindings"], key=lambda item: item["publishedAt"], reverse=True)
    reviews = state["reviewRecords"]
    users = {user["id"]: user for user in state["users"]}

    home_payload = {
        "publishedCount": len(published),
        "verifiedCount": len([review for review in reviews if review["statusAfter"] == "reviewer_verified"]),
        "reporterCount": len({finding["reporterId"] for finding in state["findings"]}),
        "latestPublished": published[:5],
        "latestVerified": [
            {
                "reviewId": review["id"],
                "findingId": review["findingId"],
                "title": next((finding["title"] for finding in state["findings"] if finding["id"] == review["findingId"]), None),
                "verificationSummary": review.get("verificationSummary"),
                "createdAt": review["createdAt"],
            }
            for review in sorted(
                [review for review in reviews if review["statusAfter"] == "reviewer_verified"],
                key=lambda item: item["createdAt"],
                reverse=True,
            )[:5]
        ],
    }

    reporter_published: Dict[str, int] = {}
    reporter_verified: Dict[str, int] = {}
    skill_counts: Dict[str, int] = {}
    vendor_counts: Dict[str, int] = {}
    dataset_counts: Dict[str, int] = {}
    model_counts: Dict[str, Dict[str, Any]] = {}

    for item in published:
        reporter_published[item["reporterId"]] = reporter_published.get(item["reporterId"], 0) + 1
        skill_counts[item["skillName"]] = skill_counts.get(item["skillName"], 0) + 1
        vendor_counts[item["vendor"]] = vendor_counts.get(item["vendor"], 0) + 1
        dataset_counts[item["datasetTag"]] = dataset_counts.get(item["datasetTag"], 0) + 1
        for model in item.get("modelTags", []):
            current = model_counts.setdefault(model, {"count": 0, "verdicts": {}, "skills": set()})
            current["count"] += 1
            verdict = item.get("verdict") or "reported"
            current["verdicts"][verdict] = current["verdicts"].get(verdict, 0) + 1
            current["skills"].add(item["skillName"])

    for review in reviews:
        if review["statusAfter"] != "reviewer_verified":
            continue
        finding = next((item for item in state["findings"] if item["id"] == review["findingId"]), None)
        if finding:
            reporter_verified[finding["reporterId"]] = reporter_verified.get(finding["reporterId"], 0) + 1

    leaderboard_payload = {
        "reportersByPublished": sorted(
            [{"userId": user_id, "label": users.get(user_id, {}).get("name", user_id), "count": count} for user_id, count in reporter_published.items()],
            key=lambda item: item["count"],
            reverse=True,
        ),
        "reportersByVerified": sorted(
            [{"userId": user_id, "label": users.get(user_id, {}).get("name", user_id), "count": count} for user_id, count in reporter_verified.items()],
            key=lambda item: item["count"],
            reverse=True,
        ),
        "skillsByPublished": sorted(
            [{"label": label, "count": count} for label, count in skill_counts.items()],
            key=lambda item: item["count"],
            reverse=True,
        ),
        "vendorsByPublished": sorted(
            [{"label": label, "count": count} for label, count in vendor_counts.items()],
            key=lambda item: item["count"],
            reverse=True,
        ),
    }

    dataset_payload = sorted(
        [
            {
                "label": label,
                "count": count,
                "findings": [item for item in published if item["datasetTag"] == label][:4],
            }
            for label, count in dataset_counts.items()
        ],
        key=lambda item: item["count"],
        reverse=True,
    )

    model_payload = sorted(
        [
            {
                "label": label,
                "count": value["count"],
                "verdicts": value["verdicts"],
                "affectedSkillCount": len(value["skills"]),
            }
            for label, value in model_counts.items()
        ],
        key=lambda item: item["count"],
        reverse=True,
    )

    return [
        {"id": create_id("snap"), "scope": "home", "key": "default", "payload": home_payload, "updatedAt": now_iso()},
        {"id": create_id("snap"), "scope": "leaderboard", "key": "default", "payload": leaderboard_payload, "updatedAt": now_iso()},
        {"id": create_id("snap"), "scope": "dataset", "key": "default", "payload": {"items": dataset_payload}, "updatedAt": now_iso()},
        {"id": create_id("snap"), "scope": "model", "key": "default", "payload": {"items": model_payload}, "updatedAt": now_iso()},
    ]


def process_parse_artifact_bundle(state: Dict[str, Any], job: Dict[str, Any]) -> None:
    finding_id = str(job.get("payload", {}).get("findingId", ""))
    bundle = next((item for item in state["artifactBundles"] if item["findingId"] == finding_id), None)
    if not bundle:
        raise ValueError(f"Artifact bundle not found for {finding_id}")

    previews: List[str] = []
    detected = set(bundle.get("detectedFiles", []))
    extraction = deepcopy(bundle.get("extractedMetadata", {}))

    for artifact in bundle.get("artifacts", []):
        file_name = artifact.get("originalName") or artifact.get("name") or ""
        detected.add(file_name)
        storage_path = Path(artifact["storagePath"])
        if not storage_path.exists():
            continue
        raw = storage_path.read_bytes()
        preview = build_preview(artifact.get("contentType", "application/octet-stream"), raw)
        if preview:
            artifact["preview"] = preview
            previews.append(preview)
        if file_name.endswith(".json"):
            try:
                update_extraction_from_json(file_name, json.loads(raw.decode("utf-8", errors="ignore")), extraction)
            except json.JSONDecodeError:
                pass

    bundle["detectedFiles"] = sorted(detected)
    bundle["extractedMetadata"] = extraction
    bundle["redactionFlags"] = sorted(set(bundle.get("redactionFlags", []) + detect_redaction_flags(previews)))
    bundle["updatedAt"] = now_iso()


def process_suggest_duplicates(state: Dict[str, Any], job: Dict[str, Any]) -> None:
    finding_id = str(job.get("payload", {}).get("findingId", ""))
    finding = next((item for item in state["findings"] if item["id"] == finding_id), None)
    bundle = next((item for item in state["artifactBundles"] if item["findingId"] == finding_id), None)
    if not finding or not bundle:
        raise ValueError(f"Finding or bundle missing for {finding_id}")
    bundle.setdefault("extractedMetadata", {})
    bundle["extractedMetadata"]["duplicateCandidates"] = build_duplicate_candidates(finding, state["findings"])
    bundle["updatedAt"] = now_iso()


def process_build_public_case_payload(state: Dict[str, Any], job: Dict[str, Any]) -> None:
    finding_id = str(job.get("payload", {}).get("findingId", ""))
    finding = next((item for item in state["findings"] if item["id"] == finding_id), None)
    published = next((item for item in state["publishedFindings"] if item["findingId"] == finding_id), None)
    if not finding or not published:
        return

    bundle = next((item for item in state["artifactBundles"] if item["findingId"] == finding_id), None)
    review = latest_review(state["reviewRecords"], finding_id)
    verification_summary = (review or {}).get("verificationSummary") or finding.get("verificationSummary", "")

    published["slug"] = published.get("slug") or slugify(f"{finding['skillName']}-{finding['vulnType']}-{published['publicTitle']}")
    published["publicTitle"] = published.get("publicTitle") or finding["title"]
    published["publicSummary"] = published.get("publicSummary") or finding["summary"]
    published["publicEvidenceBlocks"] = build_evidence_blocks(finding, bundle, verification_summary)
    published["publicArtifactLinks"] = [
        {"label": artifact["originalName"], "artifactId": artifact["id"]}
        for artifact in (bundle or {}).get("artifacts", [])
        if artifact.get("publicSafe")
    ]
    published["verificationBadge"] = published.get("verificationBadge") or "reviewer verified"
    published["verdict"] = (bundle or {}).get("extractedMetadata", {}).get("verdict")
    published["skillName"] = finding["skillName"]
    published["vendor"] = finding["vendor"]
    published["datasetTag"] = finding["datasetTag"]
    published["modelTags"] = finding["modelTags"]
    published["vulnType"] = finding["vulnType"]
    published["severityClaim"] = finding["severityClaim"]
    published["reporterId"] = finding["reporterId"]


def process_refresh_public_aggregates(state: Dict[str, Any], _job: Dict[str, Any]) -> None:
    state["aggregateSnapshots"] = compute_snapshots(state)


JOB_HANDLERS = {
    "parse_artifact_bundle": process_parse_artifact_bundle,
    "suggest_duplicates": process_suggest_duplicates,
    "build_public_case_payload": process_build_public_case_payload,
    "refresh_public_aggregates": process_refresh_public_aggregates,
}


def acquire_job(state: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    for job in state.get("jobs", []):
        if job.get("status") != "queued":
            continue
        job["status"] = "running"
        job["lockedAt"] = now_iso()
        job["lockedBy"] = WORKER_NAME
        job["attempts"] = int(job.get("attempts", 0)) + 1
        job["updatedAt"] = now_iso()
        return job
    return None


def complete_job(job: Dict[str, Any]) -> None:
    job["status"] = "done"
    job["updatedAt"] = now_iso()
    job["lastError"] = None


def fail_job(job: Dict[str, Any], error: Exception) -> None:
    job["status"] = "failed"
    job["updatedAt"] = now_iso()
    job["lastError"] = str(error)


def process_one_job() -> bool:
    state = load_state()
    job = acquire_job(state)
    if not job:
        return False
    save_state(state)

    try:
        latest_state = load_state()
        latest_job = next(item for item in latest_state["jobs"] if item["id"] == job["id"])
        handler = JOB_HANDLERS.get(latest_job["type"])
        if not handler:
            raise ValueError(f"Unsupported job type: {latest_job['type']}")
        handler(latest_state, latest_job)
        complete_job(latest_job)
        save_state(latest_state)
        print(f"[worker] completed {latest_job['type']} for {latest_job.get('payload')}")
    except Exception as error:  # noqa: BLE001
        latest_state = load_state()
        latest_job = next((item for item in latest_state["jobs"] if item["id"] == job["id"]), None)
        if latest_job:
            fail_job(latest_job, error)
            save_state(latest_state)
        print(f"[worker] failed {job['type']}: {error}", file=sys.stderr)
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="Run the SkillAttackCommunity MVP worker.")
    parser.add_argument("--once", action="store_true", help="Process at most one queued job and exit.")
    args = parser.parse_args()

    if not STATE_PATH.exists():
        print(f"[worker] state file not found at {STATE_PATH}. Start the web app once to seed demo data.", file=sys.stderr)
        return 1

    if args.once:
        processed = process_one_job()
        return 0 if processed else 0

    print(f"[worker] watching {STATE_PATH} as {WORKER_NAME} (poll {POLL_SECONDS}s)")
    while True:
        processed = process_one_job()
        if not processed:
            time.sleep(POLL_SECONDS)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
