import { DynamicPageRenderer } from "@/components/cms/DynamicPageRenderer";
import { getRequestLocale } from "@/lib/i18n/request";
import { findPublicPageBySlug } from "@/lib/services/pages";

export async function getPublicPageOverrideContent(slug: string, testId: string) {
  const locale = await getRequestLocale();
  const livePage = await findPublicPageBySlug(slug, locale).catch(() => null);

  if (!livePage) {
    return null;
  }

  return (
    <div className="site-live-page" data-testid={testId}>
      <DynamicPageRenderer page={livePage} />
    </div>
  );
}