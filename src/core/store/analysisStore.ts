import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { Analysis, AppLanguage, Span, Token, PendingSpan } from "../types";
import { tokenize } from "../lib/tokenizer";
import { getLanguageConfig } from "@/languages";

export interface AnalysisState {
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

      addSpan: (tagId, tokenIds, functionTagId, isStructure, secondaryTagId, verbParadigm, verbConjugation) => {
        const { spans, currentLayer, language } = get();
        if (tokenIds.length === 0) return;

        // Decouple pedagogical rules from store code by applying language-specific functions
        const { finalTagId, finalFunctionTagId } = getLanguageConfig(language).applyPedagogicalRules(tagId, functionTagId);

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
          isLetter: false,
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
          language: data.language || "es",
          isAnalyzed: true,
          currentLayer: 1,
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
