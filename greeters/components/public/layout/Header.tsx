import { getRequestLocale } from "@/lib/i18n/request";
import { getLocalizedHeaderFallbackNav } from "@/lib/i18n/site-copy";
import { getMenu } from "@/lib/services/menu";

import { HeaderClient } from "./HeaderClient";

export const Header = async () => {
  const locale = await getRequestLocale();
  const fallbackNavigation = getLocalizedHeaderFallbackNav(locale);
  const navigation = await getMenu(locale)
    .then((menu) => (menu.items.length > 0 ? menu.items : fallbackNavigation))
    .catch(() => fallbackNavigation);

  return <HeaderClient currentLocale={locale} navigation={navigation} />;
};