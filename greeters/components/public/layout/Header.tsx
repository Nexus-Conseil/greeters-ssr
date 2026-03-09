import { getRequestLocale } from "@/lib/i18n/request";
import { HEADER_FALLBACK_NAV } from "@/lib/public-site-data";
import { getMenu } from "@/lib/services/menu";

import { HeaderClient } from "./HeaderClient";

export const Header = async () => {
  const locale = await getRequestLocale();
  const navigation = await getMenu(locale)
    .then((menu) => (menu.items.length > 0 ? menu.items : HEADER_FALLBACK_NAV))
    .catch(() => HEADER_FALLBACK_NAV);

  return <HeaderClient currentLocale={locale} navigation={navigation} />;
};