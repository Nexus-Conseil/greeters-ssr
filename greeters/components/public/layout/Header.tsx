import { getRequestLocale } from "@/lib/i18n/request";
import { getLocalizedHeaderFallbackNav } from "@/lib/i18n/site-copy";
import { getMenu } from "@/lib/services/menu";

import { HeaderClient } from "./HeaderClient";

function hasRequiredPrimaryLinks(hrefs: string[]) {
  return hrefs.includes("/") && hrefs.some((href) => href === "BOOKING_URL_PLACEHOLDER" || href.includes("parisiendunjour.fr"));
}

export const Header = async ({ currentPath = "/" }: { currentPath?: string }) => {
  const locale = await getRequestLocale();
  const fallbackNavigation = getLocalizedHeaderFallbackNav(locale);
  const navigation = await getMenu(locale)
    .then((menu) => {
      const visibleItems = menu.items.filter((item) => item.isVisible);
      const visibleHrefs = visibleItems.map((item) => item.href);

      if (visibleItems.length < fallbackNavigation.length || !hasRequiredPrimaryLinks(visibleHrefs)) {
        return fallbackNavigation;
      }

      return visibleItems;
    })
    .catch(() => fallbackNavigation);

  return <HeaderClient currentLocale={locale} navigation={navigation} initialPathname={currentPath} />;
};