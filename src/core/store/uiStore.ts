import { create } from "zustand";

export interface UIState {
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
