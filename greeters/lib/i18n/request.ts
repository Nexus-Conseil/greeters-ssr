import { cache } from "react";
import { headers } from "next/headers";

import { DEFAULT_LOCALE, ROOT_DOMAIN, buildLocaleUrl, normalizeLocale, type AppLocale } from "./config";

export function getLocaleFromHost(host: string | null | undefined): AppLocale {
  if (!host) {
    return DEFAULT_LOCALE;
  }

  const hostname = host.split(":")[0].toLowerCase();

  if (hostname === ROOT_DOMAIN || hostname.endsWith(`.${ROOT_DOMAIN}`) === false) {
    return DEFAULT_LOCALE;
  }

  const candidate = hostname.replace(`.${ROOT_DOMAIN}`, "");
  return normalizeLocale(candidate);
}

export const getRequestLocale = cache(async () => {
  const headerStore = await headers();
  return getLocaleFromHost(headerStore.get("x-forwarded-host") ?? headerStore.get("host"));
});

export async function getRequestOriginForLocale(path = "/") {
  const locale = await getRequestLocale();
  return buildLocaleUrl(locale, path);
}