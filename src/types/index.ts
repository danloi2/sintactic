export interface Token {
  id: string;
  text: string;
  startIndex: number;
  endIndex: number;
  line: number;
  column: number;
}

export type TagCategory = "function" | "phrase" | "connector" | "structure";

export interface Tag {
  id: string;
  label: string;
  short: string;
  aliases: string[];
  category: TagCategory;
  color: string;
  description: string;
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
  functionTagId?: string; 
  tokenIds: string[];
  layer: number;
  isStructure?: boolean;
  createdAt: number;
}

export interface PendingSpan {
  tagId: string;
  tokenIds: string[];
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
}

export interface PersistedState {
  analyses: Analysis[];
  currentAnalysisId: string | null;
  userPreferences: UserPreferences;
}