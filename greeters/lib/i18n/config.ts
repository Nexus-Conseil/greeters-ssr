export const ROOT_DOMAIN = "greeters.paris";

export const SUPPORTED_LOCALES = ["fr", "en", "de", "es", "it", "ja", "nl", "pt-pt", "zh-hans"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "fr";

export const LOCALE_LABELS: Record<AppLocale, string> = {
  fr: "Français",
  en: "English",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
  ja: "日本語",
  nl: "Nederlands",
  "pt-pt": "Português",
  "zh-hans": "简体中文",
};

export function isSupportedLocale(locale: string): locale is AppLocale {
  return SUPPORTED_LOCALES.includes(locale as AppLocale);
}

export function normalizeLocale(locale: string | null | undefined): AppLocale {
  if (!locale) {
    return DEFAULT_LOCALE;
  }

  const normalized = locale.trim().toLowerCase();
  return isSupportedLocale(normalized) ? normalized : DEFAULT_LOCALE;
}

export function getLocaleHost(locale: AppLocale) {
  return locale === DEFAULT_LOCALE ? ROOT_DOMAIN : `${locale}.${ROOT_DOMAIN}`;
}

export function buildLocaleUrl(locale: AppLocale, path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `https://${getLocaleHost(locale)}${normalizedPath}`;
}
