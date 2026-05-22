import { useMemo } from "react";
import { useAnalysisStore, useUIStore } from "@/store";
import { getLanguageConfig } from "@/languages";

export function useTagFlow() {
  const { addSpan, setPendingSpan, pendingSpan, currentLayer, language } = useAnalysisStore();
  const { selectedTokenIds, clearSelection } = useUIStore();

  const config = useMemo(() => getLanguageConfig(language), [language]);
  const tags = config.tags;
  const categoryLabels = config.categoryLabels;

  const isEU = language === "eu";

  const pendingTag = useMemo(
    () => (pendingSpan ? tags.find((t) => t.id === pendingSpan.tagId) : null),
    [pendingSpan, tags]
  );

  const pendingDeclinationTag = useMemo(
    () => (pendingSpan?.declinationTagId ? tags.find((t) => t.id === pendingSpan.declinationTagId) : null),
    [pendingSpan, tags]
  );

  const isMorphologyMode = useMemo(
    () => (pendingSpan ? config.isMorphologyMode(pendingSpan.tagId) : false),
    [pendingSpan, config]
  );

  const getFilteredTags = (searchQuery: string) => {
    return config.getFilteredTags(searchQuery, pendingSpan, isMorphologyMode, tags);
  };

  const handleSelectTag = (tag: (typeof tags)[0]): boolean => {
    return config.handleSelectTag(
      tag,
      pendingSpan,
      selectedTokenIds,
      tags,
      // onTransition: update pending span without completing
      (updatedSpan) => {
        setPendingSpan(updatedSpan);
        if (!pendingSpan) clearSelection();
      },
      // onComplete: add span and reset
      (tagId, tokenIds, functionTagId, isStructure, secondaryTagId, verbParadigm, verbConjugation) => {
        addSpan(tagId, tokenIds, functionTagId, isStructure, secondaryTagId, verbParadigm, verbConjugation);
        setPendingSpan(null);
        clearSelection();
      }
    );
  };

  const getStepText = (): string => {
    return config.getStepText(pendingSpan, isMorphologyMode, tags);
  };

  return {
    isEU,
    tags,
    categoryLabels,
    pendingSpan,
    pendingTag,
    pendingDeclinationTag,
    currentLayer,
    selectedTokenIds,
    clearSelection,
    setPendingSpan,
    addSpan,
    isMorphologyMode,
    getFilteredTags,
    handleSelectTag,
    getStepText,
    language,
    config,
  };
}
