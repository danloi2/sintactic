import { AppLanguage } from "@/core/types";
import { LanguageConfig } from "./types";
import { esConfig } from "./es/config";
import { euConfig } from "./eu/config";

const LANGUAGE_REGISTRY: Record<AppLanguage, LanguageConfig> = {
  es: esConfig,
  eu: euConfig,
};

export function getLanguageConfig(lang: AppLanguage): LanguageConfig {
  return LANGUAGE_REGISTRY[lang];
}

export type { LanguageConfig };
