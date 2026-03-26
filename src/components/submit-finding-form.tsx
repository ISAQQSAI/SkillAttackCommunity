"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import type { FindingReport } from "@/lib/community";

const severityOptions = ["low", "medium", "high", "critical"];
const datasetOptions = ["community", "obvious", "contextual", "hot100"];

type SubmitAction = "save" | "submit";

interface SubmitFindingFormProps {
  initialFinding?: FindingReport;
}

export function SubmitFindingForm({ initialFinding }: SubmitFindingFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [working, setWorking] = useState<SubmitAction | null>(null);
  const [message, setMessage] = useState<string>("");
  const [currentId, setCurrentId] = useState<string>(initialFinding?.id || "");
  const accept = useMemo(
    () =>
      [
        ".zip",
        ".json",
        ".txt",
        ".md",
        ".pdf",
        ".png",
        ".jpg",
        ".jpeg",
      ].join(","),
    []
  );

  async function handleAction(action: SubmitAction) {
    const form = formRef.current;
    if (!form) {
      return;
    }

    setWorking(action);
    setMessage("");

    try {
      const formData = new FormData(form);
      const payload = {
        id: (formData.get("id") as string) || undefined,
        title: String(formData.get("title") || ""),
        summary: String(formData.get("summary") || ""),
        skillName: String(formData.get("skillName") || ""),
        skillUrl: String(formData.get("skillUrl") || ""),
        vendor: String(formData.get("vendor") || ""),
        skillVersion: String(formData.get("skillVersion") || ""),
        datasetTag: String(formData.get("datasetTag") || "community"),
        modelTags: String(formData.get("modelTags") || ""),
        vulnType: String(formData.get("vulnType") || ""),
        severityClaim: String(formData.get("severityClaim") || "medium"),
        attackPrompt: String(formData.get("attackPrompt") || ""),
        expectedRisk: String(formData.get("expectedRisk") || ""),
        reproSteps: String(formData.get("reproSteps") || ""),
        observedResult: String(formData.get("observedResult") || ""),
        smokingGun: String(formData.get("smokingGun") || ""),
        publicSafe: formData.get("publicSafe") === "on",
      };

      const draftResponse = await fetch("/api/findings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const draftJson = await draftResponse.json();
      if (!draftResponse.ok) {
        throw new Error(draftJson.error || "Could not save the report.");
      }

      const findingId = draftJson.finding.id as string;
      const idInput = form.querySelector<HTMLInputElement>('input[name="id"]');
      if (idInput) {
        idInput.value = findingId;
      }
      setCurrentId(findingId);

      const files = formData.getAll("files").filter((value): value is File => value instanceof File && value.size > 0);
      if (files.length) {
        const uploadData = new FormData();
        files.forEach((file) => uploadData.append("files", file));
        uploadData.append("publicSafe", String(payload.publicSafe));
        const uploadResponse = await fetch(`/api/findings/${findingId}/uploads`, {
          method: "POST",
          body: uploadData,
        });
        const uploadJson = await uploadResponse.json();
        if (!uploadResponse.ok) {
          throw new Error(uploadJson.error || "Could not upload artifacts.");
        }
      }

      if (action === "submit") {
        const submitResponse = await fetch(`/api/findings/${findingId}/submit`, { method: "POST" });
        const submitJson = await submitResponse.json();
        if (!submitResponse.ok) {
          throw new Error(submitJson.error || "Could not submit the report.");
        }
        setMessage("Finding submitted for review.");
        router.push(`/reports/${findingId}`);
        router.refresh();
        return;
      }

      setMessage("Draft saved. You can keep editing or submit for review.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setWorking(null);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-black/10 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <h2 className="text-2xl font-semibold tracking-tight">Submit a finding report</h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
          This community collects already-audited vulnerability reports, not raw skills. Submit the report narrative,
          attach public-safe artifacts, and send it into reviewer triage.
        </p>
        {initialFinding ? (
          <div className="mt-4 rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            Editing existing report <strong>{initialFinding.id}</strong> in status <strong>{initialFinding.status}</strong>.
          </div>
        ) : null}
      </div>

      <form ref={formRef} className="grid gap-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <input type="hidden" name="id" defaultValue={initialFinding?.id || ""} />

        <section className="grid gap-4">
          <h3 className="text-lg font-semibold">Public case framing</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              Public title draft
              <input
                name="title"
                className="rounded-2xl border border-black/10 px-4 py-3"
                placeholder="Short public-safe title"
                defaultValue={initialFinding?.title || ""}
              />
            </label>
            <label className="grid gap-2 text-sm">
              Severity claim
              <select
                name="severityClaim"
                defaultValue={initialFinding?.severityClaim || "medium"}
                className="rounded-2xl border border-black/10 px-4 py-3"
              >
                {severityOptions.map((severity) => (
                  <option key={severity} value={severity}>
                    {severity}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="grid gap-2 text-sm">
            Short summary
            <textarea
              name="summary"
              className="min-h-28 rounded-2xl border border-black/10 px-4 py-3"
              placeholder="One paragraph that explains the issue in public-safe language"
              defaultValue={initialFinding?.summary || ""}
            />
          </label>
        </section>

        <section className="grid gap-4">
          <h3 className="text-lg font-semibold">Affected skill metadata</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              Skill name
              <input name="skillName" className="rounded-2xl border border-black/10 px-4 py-3" defaultValue={initialFinding?.skillName || ""} />
            </label>
            <label className="grid gap-2 text-sm">
              Skill URL / repo URL / marketplace URL
              <input name="skillUrl" className="rounded-2xl border border-black/10 px-4 py-3" defaultValue={initialFinding?.skillUrl || ""} />
            </label>
            <label className="grid gap-2 text-sm">
              Vendor / maintainer
              <input name="vendor" className="rounded-2xl border border-black/10 px-4 py-3" defaultValue={initialFinding?.vendor || ""} />
            </label>
            <label className="grid gap-2 text-sm">
              Version / commit / release tag
              <input name="skillVersion" className="rounded-2xl border border-black/10 px-4 py-3" defaultValue={initialFinding?.skillVersion || ""} />
            </label>
            <label className="grid gap-2 text-sm">
              Dataset tag
              <select
                name="datasetTag"
                defaultValue={initialFinding?.datasetTag || "community"}
                className="rounded-2xl border border-black/10 px-4 py-3"
              >
                {datasetOptions.map((dataset) => (
                  <option key={dataset} value={dataset}>
                    {dataset}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              Model tags
              <input
                name="modelTags"
                className="rounded-2xl border border-black/10 px-4 py-3"
                placeholder="gpt-5.1, kimi-k2.5"
                defaultValue={initialFinding?.modelTags.join(", ") || ""}
              />
            </label>
            <label className="grid gap-2 text-sm md:col-span-2">
              Vulnerability type
              <input
                name="vulnType"
                className="rounded-2xl border border-black/10 px-4 py-3"
                placeholder="Prompt Injection via Contextual Payloads"
                defaultValue={initialFinding?.vulnType || ""}
              />
            </label>
          </div>
        </section>

        <section className="grid gap-4">
          <h3 className="text-lg font-semibold">Evidence and reproduction narrative</h3>
          <label className="grid gap-2 text-sm">
            Attack prompt or repro input
            <textarea name="attackPrompt" className="min-h-28 rounded-2xl border border-black/10 px-4 py-3" defaultValue={initialFinding?.attackPrompt || ""} />
          </label>
          <label className="grid gap-2 text-sm">
            Expected risk
            <textarea name="expectedRisk" className="min-h-24 rounded-2xl border border-black/10 px-4 py-3" defaultValue={initialFinding?.expectedRisk || ""} />
          </label>
          <label className="grid gap-2 text-sm">
            Reproduction steps
            <textarea name="reproSteps" className="min-h-32 rounded-2xl border border-black/10 px-4 py-3" defaultValue={initialFinding?.reproSteps || ""} />
          </label>
          <label className="grid gap-2 text-sm">
            Observed result
            <textarea name="observedResult" className="min-h-28 rounded-2xl border border-black/10 px-4 py-3" defaultValue={initialFinding?.observedResult || ""} />
          </label>
          <label className="grid gap-2 text-sm">
            Smoking gun
            <textarea name="smokingGun" className="min-h-24 rounded-2xl border border-black/10 px-4 py-3" defaultValue={initialFinding?.smokingGun || ""} />
          </label>
          <label className="grid gap-2 text-sm">
            External references
            <textarea
              name="externalReferences"
              className="min-h-24 rounded-2xl border border-black/10 px-4 py-3"
              placeholder="One URL per line or comma-separated"
              defaultValue={initialFinding?.externalReferences.join("\n") || ""}
            />
          </label>
        </section>

        <section className="grid gap-4">
          <h3 className="text-lg font-semibold">Artifacts</h3>
          <p className="text-sm text-slate-600">
            Upload individual files or one zip bundle. Known artifacts are parsed automatically where possible.
          </p>
          <input
            name="files"
            type="file"
            multiple
            accept={accept}
            className="rounded-2xl border border-dashed border-black/20 bg-slate-50 px-4 py-6 text-sm"
          />
          <label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 text-sm">
            <input name="publicSafe" type="checkbox" className="size-4" defaultChecked={Boolean(initialFinding?.publicSafe)} />
            Reporter claims the submitted report and uploaded files are already public-safe
          </label>
        </section>

        {message ? (
          <div className="rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 text-sm text-slate-700">{message}</div>
        ) : null}

        {currentId ? (
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href={`/reports/${currentId}`} className="rounded-full border border-black/10 bg-slate-50 px-4 py-2 transition hover:-translate-y-0.5">
              View report status
            </Link>
            <Link href={`/submit?id=${currentId}`} className="rounded-full border border-black/10 bg-slate-50 px-4 py-2 transition hover:-translate-y-0.5">
              Reload this draft
            </Link>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handleAction("save")}
            disabled={Boolean(working)}
            className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {working === "save" ? "Saving..." : "Save draft"}
          </button>
          <button
            type="button"
            onClick={() => handleAction("submit")}
            disabled={Boolean(working)}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {working === "submit" ? "Submitting..." : "Submit for review"}
          </button>
        </div>
      </form>
    </div>
  );
}
