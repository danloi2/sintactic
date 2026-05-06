import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { Analysis, Span, Token } from "@/types";
import { tokenize } from "@/lib/tokenizer";

interface AnalysisState {
  currentAnalysis: Analysis | null;
  phrase: string;
  tokens: Token[];
  spans: Span[];
  currentLayer: number;
  isAnalyzed: boolean;
  pendingSpan: { tagId: string; tokenIds: string[] } | null;

  setPhrase: (phrase: string) => void;
  analyze: () => void;
  addSpan: (tagId: string, tokenIds: string[], functionTagId?: string, isStructure?: boolean) => void;
  setPendingSpan: (span: { tagId: string; tokenIds: string[] } | null) => void;
  removeSpan: (spanId: string) => void;
  updateSpanTag: (spanId: string, tagId: string) => void;
  setCurrentLayer: (layer: number) => void;
  clearAnalysis: () => void;
  loadAnalysis: (data: { phrase: string; tokens: Token[]; spans: Span[] }) => void;
  reset: () => void;
  getSpansForToken: (tokenId: string) => Span[];
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
      pendingSpan: null,

      setPhrase: (phrase: string) => {
        set({ phrase, isAnalyzed: false });
      },

      analyze: () => {
        const { phrase } = get();
        if (!phrase.trim()) return;
        const tokens = tokenize(phrase);
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
       * Rule 2 (Displacement): Level 1 is reserved for the orational level. If something
       * other than Subject/Predicate is added at Level 1, it automatically jumps to Level 2.
       * Rule 3 (Floating Structure): Structural elements (N, Det) always float to the N+1 layer.
       */
      addSpan: (tagId: string, tokenIds: string[], functionTagId?: string, isStructure?: boolean) => {
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

        const isSujetoPredicado = finalFunctionTagId === "sujeto" || finalFunctionTagId === "predicado";
        
        // Calculate the current maximum hierarchical level (excluding structure)
        const hierarchicalLayers = spans.filter(s => !s.isStructure).map(s => s.layer);
        const maxHierarchical = Math.max(1, ...hierarchicalLayers);
        
        let targetLayer = currentLayer;
        if (isSujetoPredicado) {
          targetLayer = 1; // Subject and Predicate are strictly Level 1 (Orational)
        } else if (isStructure) {
          // Structure tags ALWAYS go to the floating top layer
          targetLayer = maxHierarchical + 1;
        } else if (currentLayer === 1 && !isSujetoPredicado) {
          // Displacement: If not orational and we are at Level 1, push to Level 2
          targetLayer = 2;
        }

        // Check for duplicates
        const alreadyExists = spans.some(
          (s) => s.tagId === finalTagId && 
            s.functionTagId === finalFunctionTagId &&
            s.tokenIds.length === tokenIds.length &&
            s.tokenIds.every((id, idx) => id === tokenIds[idx])
        );
        if (alreadyExists) return;

        const newSpan: Span = {
          id: uuidv4(),
          tagId: finalTagId,
          functionTagId: finalFunctionTagId,
          tokenIds,
          layer: targetLayer,
          isStructure,
          createdAt: Date.now(),
        };

        let newSpans = [...spans, newSpan];

        // STRUCTURE GOLDEN RULE: If a new hierarchy is generated (Level 2, 3...), 
        // all internal structure elements (N, Det) "float" to the new top layer (N+1)
        const newHierarchicalLayers = newSpans.filter(s => !s.isStructure).map(s => s.layer);
        const newMaxHierarchical = Math.max(1, ...newHierarchicalLayers);
        
        newSpans = newSpans.map(s => {
          if (s.isStructure) {
            return { ...s, layer: newMaxHierarchical + 1 };
          }
          return s;
        });

        // Update UI layer if necessary
        if (targetLayer > currentLayer && !isStructure) {
          set({ currentLayer: targetLayer });
        }

        set({ spans: newSpans, pendingSpan: null });
      },

      setPendingSpan: (span) => set({ pendingSpan: span }),
      removeSpan: (spanId: string) => set({ spans: get().spans.filter((s) => s.id !== spanId) }),
      updateSpanTag: (spanId: string, tagId: string) => set({ spans: get().spans.map((s) => s.id === spanId ? { ...s, tagId } : s) }),
      setCurrentLayer: (layer: number) => set({ currentLayer: layer }),
      clearAnalysis: () => set({ tokens: [], spans: [], currentAnalysis: null, isAnalyzed: false }),
      loadAnalysis: (data) => {
        set({
          phrase: data.phrase,
          tokens: data.tokens,
          spans: data.spans,
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

      reset: () => set({ currentAnalysis: null, phrase: "", tokens: [], spans: [], currentLayer: 1, isAnalyzed: false, pendingSpan: null }),
      getSpansForToken: (tokenId: string) => get().spans.filter((s) => s.tokenIds.includes(tokenId)),
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
}));