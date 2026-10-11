import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "./locales/en/common.json";
import enWorkflows from "./locales/en/workflows.json";
import ptBRCommon from "./locales/pt-BR/common.json";
import ptBRWorkflows from "./locales/pt-BR/workflows.json";

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
  resources: {
    "pt-BR": { common: ptBRCommon, workflows: ptBRWorkflows },
    en: { common: enCommon, workflows: enWorkflows },
  },
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
