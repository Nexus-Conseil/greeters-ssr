import { getStructuredDataPayload } from "@/lib/seo/page-seo";
import type { PageInput } from "@/lib/services/pages";
import type { AppLocale } from "@/lib/i18n/config";

export const StructuredDataScript = ({ page, locale, path }: { page: Partial<PageInput>; locale: AppLocale; path: string }) => {
  const payload = getStructuredDataPayload(page, locale, path);

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
      data-testid="structured-data-script"
    />
  );
};