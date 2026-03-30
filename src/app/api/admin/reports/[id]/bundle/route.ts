import { requireRole } from "@/lib/server/auth";
import { getAdminBundleDownload } from "@/lib/server/report-submissions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireRole(["admin"]);
  const { id } = await params;
  const bundle = await getAdminBundleDownload(id);

  return new Response(bundle.buffer, {
    headers: {
      "Content-Type": bundle.contentType,
      "Content-Disposition": `attachment; filename="${bundle.fileName}"`,
    },
  });
}
