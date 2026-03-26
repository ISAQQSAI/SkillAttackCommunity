"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { DuplicateCandidate, FindingReport, PublishedFinding } from "@/lib/community";

interface ReviewActionsProps {
  finding: FindingReport;
  duplicateCandidates: DuplicateCandidate[];
  published?: PublishedFinding;
}

export function ReviewActions({ finding, duplicateCandidates, published }: ReviewActionsProps) {
  const router = useRouter();
  const [working, setWorking] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [redactionNotes, setRedactionNotes] = useState("");
  const [redactionFlags, setRedactionFlags] = useState("");
  const [verificationSummary, setVerificationSummary] = useState(finding.verificationSummary || "");
  const [duplicateTargetId, setDuplicateTargetId] = useState("");
  const [publicTitle, setPublicTitle] = useState(finding.title);
  const [publicSummary, setPublicSummary] = useState(finding.summary);

  async function transition(status: string) {
    setWorking(status);
    setMessage("");
    try {
      const response = await fetch(`/api/review/findings/${finding.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reviewerNotes: notes,
          redactionNotes,
          duplicateTargetId,
          verificationSummary,
          redactionFlags,
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || "Could not update status.");
      }
      setMessage(`Status moved to ${status}.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update status.");
    } finally {
      setWorking(null);
    }
  }

  async function publish() {
    setWorking("publish");
    setMessage("");
    try {
      const response = await fetch(`/api/review/findings/${finding.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicTitle,
          publicSummary,
          verificationBadge: "reviewer verified",
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || "Could not publish.");
      }
      router.push(`/findings/${json.published.slug}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not publish.");
      setWorking(null);
    }
  }

  async function unpublish() {
    setWorking("unpublish");
    setMessage("");
    try {
      const response = await fetch(`/api/review/findings/${finding.id}/unpublish`, {
        method: "POST",
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || "Could not unpublish.");
      }
      setMessage("Public case removed from the index. Finding returned to reviewer_verified.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not unpublish.");
    } finally {
      setWorking(null);
    }
  }

  return (
    <div className="grid gap-4 rounded-3xl border border-black/10 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <h3 className="text-xl font-semibold">Reviewer actions</h3>

      <label className="grid gap-2 text-sm">
        Reviewer notes
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-24 rounded-2xl border border-black/10 px-4 py-3" />
      </label>

      <label className="grid gap-2 text-sm">
        Redaction notes
        <textarea
          value={redactionNotes}
          onChange={(event) => setRedactionNotes(event.target.value)}
          className="min-h-24 rounded-2xl border border-black/10 px-4 py-3"
        />
      </label>

      <label className="grid gap-2 text-sm">
        Redaction flags (comma separated)
        <input
          value={redactionFlags}
          onChange={(event) => setRedactionFlags(event.target.value)}
          className="rounded-2xl border border-black/10 px-4 py-3"
          placeholder="e.g. needs vendor-safe rewrite, scrub local path"
        />
      </label>

      <label className="grid gap-2 text-sm">
        Verification summary
        <textarea
          value={verificationSummary}
          onChange={(event) => setVerificationSummary(event.target.value)}
          className="min-h-24 rounded-2xl border border-black/10 px-4 py-3"
        />
      </label>

      {duplicateCandidates.length ? (
        <label className="grid gap-2 text-sm">
          Duplicate target
          <select
            value={duplicateTargetId}
            onChange={(event) => setDuplicateTargetId(event.target.value)}
            className="rounded-2xl border border-black/10 px-4 py-3"
          >
            <option value="">Select a duplicate target</option>
            {duplicateCandidates.map((candidate) => (
              <option key={candidate.findingId} value={candidate.findingId}>
                {candidate.title} · score {candidate.score}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => transition("needs_info")} disabled={Boolean(working)} className="rounded-full border border-black/10 px-4 py-2 text-sm">
          {working === "needs_info" ? "Working..." : "Mark needs_info"}
        </button>
        <button type="button" onClick={() => transition("triaged")} disabled={Boolean(working)} className="rounded-full border border-black/10 px-4 py-2 text-sm">
          {working === "triaged" ? "Working..." : "Mark triaged"}
        </button>
        <button type="button" onClick={() => transition("duplicate")} disabled={Boolean(working)} className="rounded-full border border-black/10 px-4 py-2 text-sm">
          {working === "duplicate" ? "Working..." : "Mark duplicate"}
        </button>
        <button type="button" onClick={() => transition("redaction_required")} disabled={Boolean(working)} className="rounded-full border border-black/10 px-4 py-2 text-sm">
          {working === "redaction_required" ? "Working..." : "Mark redaction_required"}
        </button>
        <button type="button" onClick={() => transition("reviewer_verified")} disabled={Boolean(working)} className="rounded-full bg-emerald-700 px-4 py-2 text-sm text-white">
          {working === "reviewer_verified" ? "Working..." : "Mark reviewer_verified"}
        </button>
        <button type="button" onClick={() => transition("rejected")} disabled={Boolean(working)} className="rounded-full bg-red-700 px-4 py-2 text-sm text-white">
          {working === "rejected" ? "Working..." : "Reject"}
        </button>
      </div>

      <div className="grid gap-3 rounded-3xl border border-black/10 bg-slate-50 p-4">
        <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Publish composer</h4>
        <label className="grid gap-2 text-sm">
          Public title
          <input value={publicTitle} onChange={(event) => setPublicTitle(event.target.value)} className="rounded-2xl border border-black/10 px-4 py-3" />
        </label>
        <label className="grid gap-2 text-sm">
          Public summary
          <textarea
            value={publicSummary}
            onChange={(event) => setPublicSummary(event.target.value)}
            className="min-h-24 rounded-2xl border border-black/10 px-4 py-3"
          />
        </label>
        <button type="button" onClick={publish} disabled={Boolean(working)} className="w-fit rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white">
          {working === "publish" ? "Publishing..." : "Publish public case"}
        </button>
        {published ? (
          <button
            type="button"
            onClick={unpublish}
            disabled={Boolean(working)}
            className="w-fit rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium"
          >
            {working === "unpublish" ? "Unpublishing..." : "Unpublish public case"}
          </button>
        ) : null}
      </div>

      {message ? <div className="rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 text-sm text-slate-700">{message}</div> : null}
    </div>
  );
}
