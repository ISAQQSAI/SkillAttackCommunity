"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import type { FindingReport } from "@/lib/community";
import { getDictionary, translateStatus, type Locale } from "@/lib/i18n";

const severityOptions = ["low", "medium", "high", "critical"];
const datasetOptions = ["community", "obvious", "contextual", "hot100"];

type SubmitAction = "save" | "submit";

interface SubmitFindingFormProps {
  initialFinding?: FindingReport;
  locale: Locale;
}

export function SubmitFindingForm({ initialFinding, locale }: SubmitFindingFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [working, setWorking] = useState<SubmitAction | null>(null);
  const [message, setMessage] = useState<string>("");
  const [currentId, setCurrentId] = useState<string>(initialFinding?.id || "");
  const dict = getDictionary(locale);
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
        throw new Error(draftJson.error || dict.submitForm.saveError);
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
          throw new Error(uploadJson.error || dict.submitForm.uploadError);
        }
      }

      if (action === "submit") {
        const submitResponse = await fetch(`/api/findings/${findingId}/submit`, { method: "POST" });
        const submitJson = await submitResponse.json();
        if (!submitResponse.ok) {
          throw new Error(submitJson.error || dict.submitForm.submitError);
        }
        setMessage(dict.submitForm.submittedMessage);
        router.push(`/reports/${findingId}`);
        router.refresh();
        return;
      }

      setMessage(dict.submitForm.savedMessage);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : dict.submitForm.unknownError);
    } finally {
      setWorking(null);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-black/10 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <h2 className="text-2xl font-semibold tracking-tight">{dict.submitForm.title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
          {dict.submitForm.intro}
        </p>
        {initialFinding ? (
          <div className="mt-4 rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {dict.submitForm.editingPrefix} <strong>{initialFinding.id}</strong> {dict.submitForm.editingStatus}{" "}
            <strong>{translateStatus(initialFinding.status, locale)}</strong>.
          </div>
        ) : null}
      </div>

      <form ref={formRef} className="grid gap-6 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <input type="hidden" name="id" defaultValue={initialFinding?.id || ""} />

        <section className="grid gap-4">
          <h3 className="text-lg font-semibold">{dict.submitForm.framing}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              {dict.submitForm.labels.publicTitle}
              <input
                name="title"
                className="rounded-2xl border border-black/10 px-4 py-3"
                placeholder={dict.submitForm.placeholders.publicTitle}
                defaultValue={initialFinding?.title || ""}
              />
            </label>
            <label className="grid gap-2 text-sm">
              {dict.submitForm.labels.severity}
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
            {dict.submitForm.labels.summary}
            <textarea
              name="summary"
              className="min-h-28 rounded-2xl border border-black/10 px-4 py-3"
              placeholder={dict.submitForm.placeholders.summary}
              defaultValue={initialFinding?.summary || ""}
            />
          </label>
        </section>

        <section className="grid gap-4">
          <h3 className="text-lg font-semibold">{dict.submitForm.affected}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              {dict.submitForm.labels.skillName}
              <input name="skillName" className="rounded-2xl border border-black/10 px-4 py-3" defaultValue={initialFinding?.skillName || ""} />
            </label>
            <label className="grid gap-2 text-sm">
              {dict.submitForm.labels.skillUrl}
              <input name="skillUrl" className="rounded-2xl border border-black/10 px-4 py-3" defaultValue={initialFinding?.skillUrl || ""} />
            </label>
            <label className="grid gap-2 text-sm">
              {dict.submitForm.labels.vendor}
              <input name="vendor" className="rounded-2xl border border-black/10 px-4 py-3" defaultValue={initialFinding?.vendor || ""} />
            </label>
            <label className="grid gap-2 text-sm">
              {dict.submitForm.labels.skillVersion}
              <input name="skillVersion" className="rounded-2xl border border-black/10 px-4 py-3" defaultValue={initialFinding?.skillVersion || ""} />
            </label>
            <label className="grid gap-2 text-sm">
              {dict.submitForm.labels.dataset}
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
              {dict.submitForm.labels.modelTags}
              <input
                name="modelTags"
                className="rounded-2xl border border-black/10 px-4 py-3"
                placeholder={dict.submitForm.placeholders.modelTags}
                defaultValue={initialFinding?.modelTags.join(", ") || ""}
              />
            </label>
            <label className="grid gap-2 text-sm md:col-span-2">
              {dict.submitForm.labels.vulnType}
              <input
                name="vulnType"
                className="rounded-2xl border border-black/10 px-4 py-3"
                placeholder={dict.submitForm.placeholders.vulnType}
                defaultValue={initialFinding?.vulnType || ""}
              />
            </label>
          </div>
        </section>

        <section className="grid gap-4">
          <h3 className="text-lg font-semibold">{dict.submitForm.evidence}</h3>
          <label className="grid gap-2 text-sm">
            {dict.submitForm.labels.attackPrompt}
            <textarea name="attackPrompt" className="min-h-28 rounded-2xl border border-black/10 px-4 py-3" defaultValue={initialFinding?.attackPrompt || ""} />
          </label>
          <label className="grid gap-2 text-sm">
            {dict.submitForm.labels.expectedRisk}
            <textarea name="expectedRisk" className="min-h-24 rounded-2xl border border-black/10 px-4 py-3" defaultValue={initialFinding?.expectedRisk || ""} />
          </label>
          <label className="grid gap-2 text-sm">
            {dict.submitForm.labels.reproSteps}
            <textarea name="reproSteps" className="min-h-32 rounded-2xl border border-black/10 px-4 py-3" defaultValue={initialFinding?.reproSteps || ""} />
          </label>
          <label className="grid gap-2 text-sm">
            {dict.submitForm.labels.observedResult}
            <textarea name="observedResult" className="min-h-28 rounded-2xl border border-black/10 px-4 py-3" defaultValue={initialFinding?.observedResult || ""} />
          </label>
          <label className="grid gap-2 text-sm">
            {dict.submitForm.labels.smokingGun}
            <textarea name="smokingGun" className="min-h-24 rounded-2xl border border-black/10 px-4 py-3" defaultValue={initialFinding?.smokingGun || ""} />
          </label>
          <label className="grid gap-2 text-sm">
            {dict.submitForm.labels.externalReferences}
            <textarea
              name="externalReferences"
              className="min-h-24 rounded-2xl border border-black/10 px-4 py-3"
              placeholder={dict.submitForm.placeholders.externalReferences}
              defaultValue={initialFinding?.externalReferences.join("\n") || ""}
            />
          </label>
        </section>

        <section className="grid gap-4">
          <h3 className="text-lg font-semibold">{dict.submitForm.artifacts}</h3>
          <p className="text-sm text-slate-600">
            {dict.submitForm.artifactBody}
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
            {dict.submitForm.publicSafe}
          </label>
        </section>

        {message ? (
          <div className="rounded-2xl border border-black/10 bg-slate-50 px-4 py-3 text-sm text-slate-700">{message}</div>
        ) : null}

        {currentId ? (
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href={`/reports/${currentId}`} className="rounded-full border border-black/10 bg-slate-50 px-4 py-2 transition hover:-translate-y-0.5">
              {dict.submitForm.viewReport}
            </Link>
            <Link href={`/submit?id=${currentId}`} className="rounded-full border border-black/10 bg-slate-50 px-4 py-2 transition hover:-translate-y-0.5">
              {dict.submitForm.reloadDraft}
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
            {working === "save" ? dict.submitForm.saving : dict.submitForm.save}
          </button>
          <button
            type="button"
            onClick={() => handleAction("submit")}
            disabled={Boolean(working)}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {working === "submit" ? dict.submitForm.submitting : dict.submitForm.submit}
          </button>
        </div>
      </form>
    </div>
  );
}
