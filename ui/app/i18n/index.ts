import i18n from "i18next";
import { initReactI18next } from "react-i18next";

/** Every `locales/<language>/<namespace>.json`, loaded at build time. */
const files = import.meta.glob<Record<string, unknown>>("./locales/*/*.json", {
  eager: true,
  import: "default",
});

const resources: Record<string, Record<string, Record<string, unknown>>> = {};
for (const [path, messages] of Object.entries(files)) {
  const [, language, namespace] = path.match(/\.\/locales\/(.+)\/(.+)\.json$/)!;
  (resources[language] ??= {})[namespace] = messages;
}

export const supportedLanguages = ["pt-BR", "en"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

const STORAGE_KEY = "relay-language";

const readStoredLanguage = (): string | null => {
  try {
    return typeof window !== "undefined"
      ? window.localStorage.getItem(STORAGE_KEY)
      : null;
  } catch {
    return null;
  }
};

const isSupported = (value: string | null): value is SupportedLanguage =>
  supportedLanguages.includes(value as SupportedLanguage);

const storedLanguage = readStoredLanguage();
const initialLanguage: SupportedLanguage = isSupported(storedLanguage)
  ? storedLanguage
  : "pt-BR";

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: "en",
  supportedLngs: supportedLanguages,
  defaultNS: "common",
  interpolation: { escapeValue: false },
});

export const changeLanguage = async (language: SupportedLanguage) => {
  await i18n.changeLanguage(language);
  try {
    window.localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Storage blocked: the choice lasts for this session only.
  }
  document.documentElement.lang = language;
};

if (typeof document !== "undefined") {
  document.documentElement.lang = initialLanguage;
}

export default i18n;
