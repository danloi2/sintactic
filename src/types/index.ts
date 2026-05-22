export interface Token {
  id: string;
  text: string;
  startIndex: number;
  endIndex: number;
  line: number;
  column: number;
  /** True when this token is a single letter split from a parent word (EU mode) */
  isLetter?: boolean;
  /** Groups letters of the same word together visually */
  wordId?: string;
  /** True when this token was added manually as an omitted/implicit subject */
  isImplicit?: boolean;
}

export type TagCategory =
  | "function"
  | "phrase"
  | "connector"
  | "structure"
  | "sentence"
  | "morphology"
  /** Basque: declension cases (Nork, Nor, Nori…) */
  | "declension"
  /** Basque: verb agreement paradigm (NOR, NORK, NORI with person/number) */
  | "verbdecl";

export type AppLanguage = "es" | "eu";

export interface Tag {
  id: string;
  label: string;
  short: string;
  aliases: string[];
  category: TagCategory;
  color: string;
  description: string;
  renderShape?: "line" | "bracket";
}

export type SelectionMode = "single" | "range";

export interface Selection {
  mode: SelectionMode;
  tokenIds: string[];
  lastSelectedId: string | null;
}

export interface Span {
  id: string;
  tagId: string;
  /** Step-2 tag: declension (EU) or function (ES) */
  functionTagId?: string;
  /** Step-3 tag: syntactic function (EU 3-step flow only) */
  secondaryTagId?: string;
  tokenIds: string[];
  layer: number;
  isStructure?: boolean;
  createdAt: number;
  /** Basque verb paradigm (e.g., NOR-NORI) */
  verbParadigm?: string;
  /** Basque verb conjugation pronouns (e.g., Hura-Zuri) */
  verbConjugation?: string;
}

export interface PendingSpan {
  tagId: string;
  tokenIds: string[];
  /** Intermediate declension tag stored between step 2→3 in EU mode */
  declinationTagId?: string;
  /** Basque verb paradigm (e.g., NOR-NORI) */
  verbParadigm?: string;
  /** Basque verb conjugation pronouns (e.g., Hura-Zuri) */
  verbConjugation?: string;
}

export interface Analysis {
  id: string;
  phrase: string;
  tokens: Token[];
  spans: Span[];
  currentLayer: number;
  createdAt: number;
  updatedAt: number;
}

export interface UserPreferences {
  theme: "dark" | "light";
  showShortcuts: boolean;
  language: AppLanguage;
}

export interface PersistedState {
  analyses: Analysis[];
  currentAnalysisId: string | null;
  userPreferences: UserPreferences;
}