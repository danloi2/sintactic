import { Tag, AppLanguage, TagCategory } from "@/core/types";
import { getLanguageConfig } from "@/languages";

/**
 * Returns the tag list for the requested language.
 */
export function getTagsForLanguage(lang: AppLanguage): Tag[] {
  return getLanguageConfig(lang).tags;
}

/**
 * Returns the category display label map for the requested language.
 */
export function getCategoryLabelsForLanguage(lang: AppLanguage): Record<string, string> {
  return getLanguageConfig(lang).categoryLabels;
}

/**
 * Returns the sorting order map for the requested language.
 */
export function getCategoryOrderForLanguage(lang: AppLanguage): Record<string, number> {
  return getLanguageConfig(lang).categoryOrder;
}

/**
 * Filters tags by matching text against labels, shortcuts, aliases, and descriptions,
 * then sorting by category precedence.
 */
export function filterTags(query: string, lang: AppLanguage = "es"): Tag[] {
  const config = getLanguageConfig(lang);
  const lowerQuery = query.toLowerCase().trim();
  const source = config.tags;
  const order = config.categoryOrder;

  let result = source;
  if (lowerQuery) {
    result = source.filter(
      (tag) =>
        tag.label.toLowerCase().includes(lowerQuery) ||
        tag.short.toLowerCase().includes(lowerQuery) ||
        tag.description.toLowerCase().includes(lowerQuery) ||
        tag.aliases.some((alias) => alias.toLowerCase().includes(lowerQuery))
    );
  }

  return [...result].sort(
    (a, b) => (order[a.category] ?? 99) - (order[b.category] ?? 99)
  );
}

/**
 * Resolves a tag by checking standard identifiers or customized student aliases.
 */
export function findTagByAlias(query: string, lang: AppLanguage = "es"): Tag | undefined {
  const lowerQuery = query.toLowerCase().trim();
  const source = getLanguageConfig(lang).tags;
  return source.find(
    (tag) =>
      tag.id === lowerQuery ||
      tag.label.toLowerCase() === lowerQuery ||
      tag.short.toLowerCase() === lowerQuery ||
      tag.aliases.some((alias) => alias.toLowerCase() === lowerQuery)
  );
}

/**
 * Returns tags filtered by category for a specific language.
 */
export function getTagsByCategory(category: TagCategory, lang: AppLanguage = "es"): Tag[] {
  return getLanguageConfig(lang).tags.filter((tag) => tag.category === category);
}
