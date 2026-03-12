import { PageEditorForm } from "@/components/admin/pages/PageEditorForm";

type AdminEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminEditPagePage({ params }: AdminEditPageProps) {
  const { id } = await params;
  return <PageEditorForm pageId={id} />;
}