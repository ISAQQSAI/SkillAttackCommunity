import { GuestUploadForm } from "@/components/guest-upload-form";
import { getLocale } from "@/lib/server/locale";
import { getSubmittedUpload } from "@/lib/server/report-submissions";

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getLocale();
  const params = await searchParams;
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  let initialDisplay = null;
  let initialError: string | null = null;

  if (id) {
    try {
      initialDisplay = await getSubmittedUpload(id);
    } catch (error) {
      initialError = error instanceof Error ? error.message : "Could not load submission.";
    }
  }

  return (
    <GuestUploadForm
      locale={locale}
      initialDisplay={initialDisplay}
      initialError={initialError}
    />
  );
}
