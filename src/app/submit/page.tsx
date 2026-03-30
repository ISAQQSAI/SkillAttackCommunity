import { GuestUploadForm } from "@/components/guest-upload-form";
import { getLocale } from "@/lib/server/locale";
import { getUploadPreview } from "@/lib/server/report-submissions";

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getLocale();
  const params = await searchParams;
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const previewToken = Array.isArray(params.previewToken) ? params.previewToken[0] : params.previewToken;

  let initialPreview = null;
  let initialError: string | null = null;

  if (id && previewToken) {
    try {
      const preview = await getUploadPreview(id, previewToken);
      initialPreview = {
        ...preview,
        previewToken,
      };
    } catch (error) {
      initialError = error instanceof Error ? error.message : "Could not load preview.";
    }
  }

  return (
    <GuestUploadForm
      locale={locale}
      initialPreview={initialPreview}
      initialError={initialError}
    />
  );
}
