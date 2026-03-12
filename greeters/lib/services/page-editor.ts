import { listPageEditsByPageId } from "@/lib/repositories/page-edits";
import { listPagePreviewsByPageId } from "@/lib/repositories/page-previews";

export async function getPageEditorActivity(pageId: string) {
  const [edits, previews] = await Promise.all([
    listPageEditsByPageId(pageId),
    listPagePreviewsByPageId(pageId),
  ]);

  return {
    edits: edits.map((edit) => ({
      id: edit.id,
      prompt: edit.prompt,
      changesSummary: edit.changesSummary,
      editorId: edit.editorId,
      editorName: edit.editorName,
      createdAt: edit.createdAt.toISOString(),
    })),
    previews: previews.map((preview) => ({
      id: preview.id,
      status: preview.status.toLowerCase(),
      createdBy: preview.createdBy,
      createdAt: preview.createdAt.toISOString(),
    })),
  };
}