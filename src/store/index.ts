import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { Analysis, AppLanguage, Span, Token, PendingSpan } from "@/types";
import { tokenize } from "@/lib/tokenizer";

interface AnalysisState {
  currentAnalysis: Analysis | null;
  phrase: string;
  tokens: Token[];
  spans: Span[];
  currentLayer: number;
  isAnalyzed: boolean;
  language: AppLanguage;
  pendingSpan: PendingSpan | null;

  setPhrase: (phrase: string) => void;
  setLanguage: (lang: AppLanguage) => void;
  analyze: () => void;
  addSpan: (
    tagId: string,
    tokenIds: string[],
    functionTagId?: string,
    isStructure?: boolean,
    secondaryTagId?: string,
    verbParadigm?: string,
    verbConjugation?: string
  ) => void;
  setPendingSpan: (span: PendingSpan | null) => void;
  removeSpan: (spanId: string) => void;
  removeLayer: (layer: number) => void;
  swapLayers: (layerA: number, layerB: number) => void;
  updateSpanTag: (spanId: string, tagId: string) => void;
  setCurrentLayer: (layer: number) => void;
  clearAnalysis: () => void;
  loadAnalysis: (data: { phrase: string; tokens: Token[]; spans: Span[]; language?: AppLanguage }) => void;
  reset: () => void;
  getSpansForToken: (tokenId: string) => Span[];
  addImplicitToken: (text: string) => void;
  removeToken: (tokenId: string) => void;
}

export const useAnalysisStore = create<AnalysisState>()(
  persist(
    (set, get) => ({
      currentAnalysis: null,
      phrase: "",
      tokens: [],
      spans: [],
      currentLayer: 1,
      isAnalyzed: false,
      language: "es" as AppLanguage,
      pendingSpan: null,

      setPhrase: (phrase: string) => {
        set({ phrase, isAnalyzed: false });
      },

      setLanguage: (lang: AppLanguage) => {
        set({ language: lang });
      },

      analyze: () => {
        const { phrase, language } = get();
        if (!phrase.trim()) return;
        const tokens = tokenize(phrase, language);
        const now = Date.now();
        set({
          currentAnalysis: { id: uuidv4(), phrase, tokens, spans: [], currentLayer: 1, createdAt: now, updatedAt: now },
          tokens,
          spans: [],
          currentLayer: 1,
          isAnalyzed: true,
          pendingSpan: null,
        });
      },

      /**
       * Adds a new element (span) to the syntactic tree applying strict pedagogical rules.
       * 
       * Rule 1 (Auto-correction): If the user selects "Subject" (Sujeto), Nominal Phrase (SN) is assumed.
       * Rule 2 (Floating Structure): Structural elements (N, Det) always float to the N+1 layer.
       */
      addSpan: (tagId: string, tokenIds: string[], functionTagId?: string, isStructure?: boolean, secondaryTagId?: string, verbParadigm?: string, verbConjugation?: string) => {
        const { spans, currentLayer } = get();
        if (tokenIds.length === 0) return;

        let finalTagId = tagId;
        let finalFunctionTagId = functionTagId;

        // Pedagogical Auto-correction: Subject and Predicate always force their corresponding phrase
        if (tagId === "sujeto" || functionTagId === "sujeto") {
          finalTagId = "sn";
          finalFunctionTagId = "sujeto";
        } else if (tagId === "predicado" || functionTagId === "predicado") {
          finalTagId = "sv";
          finalFunctionTagId = "predicado";
        }


        
        let targetLayer = currentLayer;
        
        // Find the first available layer for these tokens starting from the current layer
        while (spans.some(s => s.layer === targetLayer && s.tokenIds.some(id => tokenIds.includes(id)))) {
          targetLayer++;
        }

        // Check for exact duplicates in the calculated target layer
        const alreadyExists = spans.some(
          (s) => s.tagId === finalTagId && 
            s.functionTagId === finalFunctionTagId &&
            s.layer === targetLayer &&
            s.tokenIds.length === tokenIds.length &&
            s.tokenIds.every((id, idx) => id === tokenIds[idx])
        );
        if (alreadyExists) return;

        const newSpan: Span = {
          id: uuidv4(),
          tagId: finalTagId,
          functionTagId: finalFunctionTagId,
          secondaryTagId,
          tokenIds,
          layer: targetLayer,
          isStructure,
          createdAt: Date.now(),
          verbParadigm,
          verbConjugation,
        };

        const newSpans = [...spans, newSpan];

        // Update UI layer if necessary
        if (targetLayer > currentLayer) {
          set({ currentLayer: targetLayer });
        }

        set({ spans: newSpans, pendingSpan: null });
      },

      setPendingSpan: (span) => set({ pendingSpan: span }),
      addImplicitToken: (text: string) => {
        const { tokens } = get();
        const lastToken = tokens[tokens.length - 1];
        const startIndex = lastToken ? lastToken.endIndex + 1 : 0;
        const endIndex = startIndex + text.length;
        const wordId = uuidv4();
        
        const newToken: Token = {
          id: uuidv4(),
          text,
          startIndex,
          endIndex,
          line: 1,
          column: startIndex,
          isLetter: false, // Implicit tokens are always treated as whole words
          wordId,
          isImplicit: true,
        };
        
        set({ tokens: [...tokens, newToken] });
      },
      removeSpan: (spanId: string) => set({ spans: get().spans.filter((s) => s.id !== spanId) }),
      removeLayer: (layer: number) => {
        set({
          spans: get().spans
            .filter((s) => s.layer !== layer)
            .map((s) => s.layer > layer ? { ...s, layer: s.layer - 1 } : s),
          currentLayer: Math.max(1, get().currentLayer > layer ? get().currentLayer - 1 : get().currentLayer)
        });
      },
      swapLayers: (layerA: number, layerB: number) => {
        set({
          spans: get().spans.map((s) => {
            if (s.layer === layerA) return { ...s, layer: layerB };
            if (s.layer === layerB) return { ...s, layer: layerA };
            return s;
          })
        });
      },
      updateSpanTag: (spanId: string, tagId: string) => set({ spans: get().spans.map((s) => s.id === spanId ? { ...s, tagId } : s) }),
      setCurrentLayer: (layer: number) => set({ currentLayer: layer }),
      clearAnalysis: () => set({ tokens: [], spans: [], currentAnalysis: null, isAnalyzed: false }),
      loadAnalysis: (data) => {
        set({
          phrase: data.phrase,
          tokens: data.tokens,
          spans: data.spans,
          language: data.language || "es", // Recuperar idioma o ES por defecto
          isAnalyzed: true,
          currentLayer: 1, // Reset to level 1 for safety
          currentAnalysis: {
            id: uuidv4(),
            phrase: data.phrase,
            tokens: data.tokens,
            spans: data.spans,
            currentLayer: 1,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }
        });
      },

      reset: () => set({ currentAnalysis: null, phrase: "", tokens: [], spans: [], currentLayer: 1, isAnalyzed: false, pendingSpan: null, language: get().language }),
      getSpansForToken: (tokenId: string) => get().spans.filter((s) => s.tokenIds.includes(tokenId)),
      removeToken: (tokenId: string) => {
        set({
          tokens: get().tokens.filter((t) => t.id !== tokenId),
          spans: get().spans.filter((s) => !s.tokenIds.includes(tokenId)),
        });
      },
    }),
    {
      name: "sintactic-analysis",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentAnalysis: state.currentAnalysis,
        phrase: state.phrase,
        tokens: state.tokens,
        spans: state.spans,
        currentLayer: state.currentLayer,
        isAnalyzed: state.isAnalyzed,
        language: state.language,
      }),
    }
  )
);

interface UIState {
  selectedTokenIds: string[];
  lastSelectedTokenId: string | null;
  isTagPanelOpen: boolean;
  isAutocompleteOpen: boolean;
  autocompleteQuery: string;
  highlightedTokenIds: string[];
  activeSpanId: string | null;
  selectToken: (tokenId: string, mode?: "single" | "toggle" | "range") => void;
  selectRange: (fromTokenId: string, toTokenId: string) => void;
  addToSelection: (tokenId: string) => void;
  removeFromSelection: (tokenId: string) => void;
  clearSelection: () => void;
  selectAll: (tokenIds: string[]) => void;
  setTagPanelOpen: (open: boolean) => void;
  setAutocompleteOpen: (open: boolean) => void;
  setAutocompleteQuery: (query: string) => void;
  highlightTokens: (tokenIds: string[]) => void;
  clearHighlights: () => void;
  setActiveSpanId: (spanId: string | null) => void;
  isExporting: boolean;
  setExporting: (exporting: boolean) => void;
}

export const useUIStore = create<UIState>()((set, get) => ({
  selectedTokenIds: [],
  lastSelectedTokenId: null,
  isTagPanelOpen: false,
  isAutocompleteOpen: false,
  autocompleteQuery: "",
  highlightedTokenIds: [],
  activeSpanId: null,
  selectToken: (tokenId: string, mode = "single") => {
    const { selectedTokenIds } = get();
    switch (mode) {
      case "single": set({ selectedTokenIds: [tokenId], lastSelectedTokenId: tokenId }); break;
      case "toggle":
        if (selectedTokenIds.includes(tokenId)) {
          set({ selectedTokenIds: selectedTokenIds.filter((id) => id !== tokenId), lastSelectedTokenId: tokenId });
        } else {
          set({ selectedTokenIds: [...selectedTokenIds, tokenId], lastSelectedTokenId: tokenId });
        }
        break;
    }
  },
  selectRange: (fromTokenId: string, toTokenId: string) => {
    const { selectedTokenIds } = get();
    const allIds = [...selectedTokenIds, fromTokenId, toTokenId];
    set({ selectedTokenIds: [...new Set(allIds)], lastSelectedTokenId: toTokenId });
  },
  addToSelection: (tokenId: string) => {
    const { selectedTokenIds } = get();
    if (!selectedTokenIds.includes(tokenId)) {
      set({ selectedTokenIds: [...selectedTokenIds, tokenId], lastSelectedTokenId: tokenId });
    }
  },
  removeFromSelection: (tokenId: string) => {
    const { selectedTokenIds } = get();
    set({ selectedTokenIds: selectedTokenIds.filter((id) => id !== tokenId) });
  },
  clearSelection: () => set({ selectedTokenIds: [], lastSelectedTokenId: null }),
  selectAll: (tokenIds: string[]) => set({ selectedTokenIds: tokenIds, lastSelectedTokenId: tokenIds[tokenIds.length - 1] || null }),
  setTagPanelOpen: (open: boolean) => set({ isTagPanelOpen: open }),
  setAutocompleteOpen: (open: boolean) => set({ isAutocompleteOpen: open, autocompleteQuery: "" }),
  setAutocompleteQuery: (query: string) => set({ autocompleteQuery: query }),
  highlightTokens: (tokenIds: string[]) => set({ highlightedTokenIds: tokenIds }),
  clearHighlights: () => set({ highlightedTokenIds: [] }),
  setActiveSpanId: (spanId: string | null) => set({ activeSpanId: spanId }),
  isExporting: false,
  setExporting: (exporting: boolean) => set({ isExporting: exporting }),
}));