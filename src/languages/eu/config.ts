import { LanguageConfig } from "../types";
import { Tag } from "@/core/types";
import { euTags } from "./tags";
import { euCategoryLabels, CATEGORY_ORDER_EU } from "./categories";
import { applyPedagogicalRules } from "./rules";
import { VerbSelector } from "./VerbSelector";

const filterByQuery = (list: Tag[], query: string) => {
  const q = query.toLowerCase().trim();
  if (!q) return list;
  return list.filter(
    (t) =>
      t.label.toLowerCase().includes(q) ||
      t.short.toLowerCase().includes(q) ||
      t.aliases.some((a) => a.toLowerCase().includes(q))
  );
};

export const euConfig: LanguageConfig = {
  code: "eu",
  name: "Euskara",
  categoryLabels: euCategoryLabels,
  categoryOrder: CATEGORY_ORDER_EU,
  tags: euTags,
  
  applyPedagogicalRules,
  
  needsSecondaryStep: (tag: Tag) => {
    return (
      tag.category === "phrase" ||
      ["nucleo", "enlace", "nexo", "modificador", "eu-n", "eu-p"].includes(tag.id)
    );
  },
  
  isMorphologyMode: (tagId: string) => {
    return ["nucleo", "enlace", "nexo", "modificador", "eu-n", "eu-p"].includes(tagId);
  },
  
  getFilteredTags: (searchQuery, pendingSpan, isMorphologyMode, allTags) => {
    if (pendingSpan) {
      if (pendingSpan.declinationTagId) {
        // EU Step 3
        const parentTag = allTags.find((t) => t.id === pendingSpan.tagId);
        const isPhrase = parentTag?.category === "phrase";
        if (isPhrase) {
          return {
            morphology: filterByQuery(
              allTags.filter((t) => t.category === "morphology"),
              searchQuery
            ),
            function: filterByQuery(
              allTags.filter((t) => t.category === "function"),
              searchQuery
            ),
          };
        }
        return {
          function: filterByQuery(
            allTags.filter((t) => t.category === "function"),
            searchQuery
          ),
        };
      } else {
        // EU Step 2
        // Aditz Sintagma (eu-as) skips declension and goes straight to function
        if (pendingSpan.tagId === "eu-as") {
          return {
            function: filterByQuery(
              allTags.filter((t) => t.category === "function"),
              searchQuery
            ),
          };
        }
        if (isMorphologyMode) {
          return {
            morphology: filterByQuery(
              allTags.filter((t) => t.category === "morphology"),
              searchQuery
            ),
          };
        }
        return {
          declension: filterByQuery(
            allTags.filter((t) => t.category === "declension"),
            searchQuery
          ),
        };
      }
    }
    
    const filtered = filterByQuery(allTags, searchQuery);
    return {
      phrase: filtered.filter((t) => t.category === "phrase"),
      function: filtered.filter((t) => t.category === "function"),
      declension: filtered.filter((t) => t.category === "declension"),
      morphology: filtered.filter((t) => t.category === "morphology"),
      structure: filtered.filter((t) => t.category === "structure"),
      verbdecl: filtered.filter((t) => t.category === "verbdecl"),
      sentence: filtered.filter((t) => t.category === "sentence"),
      connector: filtered.filter((t) => t.category === "connector"),
    };
  },
  
  handleSelectTag: (tag, pendingSpan, selectedTokenIds, allTags, onTransition, onComplete) => {
    if (pendingSpan) {
      if (pendingSpan.declinationTagId) {
        // Finish Step 3
        if (tag.category === "function" || tag.category === "morphology") {
          const parentTag = allTags.find((t) => t.id === pendingSpan.tagId);
          onComplete(
            pendingSpan.tagId,
            pendingSpan.tokenIds,
            pendingSpan.declinationTagId,
            parentTag?.category === "structure",
            tag.id
          );
          return true;
        }
      } else {
        // Step 2 or transition to Step 3
        // Aditz Sintagma (eu-as): step 2 is function selection (Subjektua / Predikatua)
        if (pendingSpan.tagId === "eu-as" && tag.category === "function") {
          onComplete(
            pendingSpan.tagId,
            pendingSpan.tokenIds,
            tag.id,
            false
          );
          return true;
        }
        const isMorph = ["nucleo", "enlace", "nexo", "modificador", "eu-n", "eu-p"].includes(pendingSpan.tagId);
        if (isMorph && tag.category === "morphology") {
          if (tag.id === "eu-ad") {
            onTransition({ ...pendingSpan, declinationTagId: tag.id });
            return false;
          }
          const parentTag = allTags.find((t) => t.id === pendingSpan.tagId);
          onComplete(
            pendingSpan.tagId,
            pendingSpan.tokenIds,
            tag.id,
            parentTag?.category === "structure"
          );
          return true;
        } else if (!isMorph && tag.category === "declension") {
          onTransition({ ...pendingSpan, declinationTagId: tag.id });
          return false;
        }
      }
      return false;
    }
    
    if (selectedTokenIds.length > 0) {
      const isPhr = tag.category === "phrase";
      const isExtra = ["nucleo", "enlace", "nexo", "modificador", "eu-n", "eu-p"].includes(tag.id);
      if (isPhr || isExtra) {
        onTransition({ tagId: tag.id, tokenIds: selectedTokenIds });
        return false;
      } else {
        onComplete(
          tag.id,
          selectedTokenIds,
          undefined,
          tag.category === "structure"
        );
        return true;
      }
    }
    return false;
  },
  
  getStepText: (pendingSpan, isMorphologyMode, allTags) => {
    if (!pendingSpan) return "";
    if (pendingSpan.declinationTagId === "eu-ad") return "3. Urratsa: Konfiguratu Aditza";
    if (pendingSpan.tagId === "eu-as" && !pendingSpan.declinationTagId) return "2. Urratsa: Zein funtzio betetzen du?";
    if (isMorphologyMode) return "2. Urratsa: Zein da bere morfologia?";
    if (!pendingSpan.declinationTagId) return "2. Urratsa: Zein da bere deklinazioa?";
    const parentTag = allTags.find((t) => t.id === pendingSpan.tagId);
    const isPhrase = parentTag?.category === "phrase";
    if (isPhrase) return "3. Urratsa: Zein funtzio edo morfologia?";
    return "3. Urratsa: Zein funtzio betetzen du?";
  },
  
  stepTitle: (pendingSpan, isMorphologyMode, allTags) => {
    if (pendingSpan?.tagId === "eu-as" && !pendingSpan.declinationTagId) {
      return "funtzioa";
    }
    if (pendingSpan && pendingSpan.declinationTagId) {
      const parentTag = allTags.find((t) => t.id === pendingSpan.tagId);
      const isPhrase = parentTag?.category === "phrase";
      return isPhrase ? "la morfología o función" : "la función";
    }
    return isMorphologyMode ? "la morfología" : "la declinación";
  },
  
  shouldShowCustomWizard: (pendingSpan) => {
    return pendingSpan?.declinationTagId === "eu-ad";
  },
  
  CustomWizardComponent: VerbSelector,
  
  ui: {
    phraseInputPlaceholder: "Idatzi aztertzeko esaldi bat...\nAdibidea: Mutilak parkean azkar jaten du",
    phraseInputChecking: "Aztertzen...",
    phraseInputHint: "Enter analisia egiteko",
    phraseInputAnalyzeButton: "Aztertu",
    phraseInputErrors: (count) => `${count} ${count === 1 ? "akats" : "akats"}`,
    
    headerToggleLanguageTitle: "Aldatu gaztelaniara",
    headerChangeLanguageLabel: "ES",
    headerTagsPanelLabel: "Etiketak",
    headerTagsPanelTooltip: "Etiketa panela ireki",
    headerResetLabel: "Berrabiarazi",
    headerResetTooltip: "Analisia berrabiarazi",
    headerExportLabel: "Esportatu",
    headerExportTooltip: "Deskargatu (PNG/JSON)",
    headerExportImageLabel: "Irudi gisa deskargatu",
    headerExportJsonLabel: "JSON gisa deskargatu",
    headerImportLabel: "Inportatu",
    headerImportTooltip: "JSON fitxategitik kargatu",
    headerWordsLabel: "HITZ",
    headerLangChangeConfirm: "Euskarara aldatzean analisia berrezarriko da. Jarraitu?",
    
    appTitle: "Esaldiari buruzko analisia",
    appShortcutPrompt: "etiketa gehitzeko",
    appTokensSelected: (count) => `${count} hizki hautatuta`,
    
    autocompletePlaceholder: "Idatzi etiketak bilatzeko...",
    autocompleteWarningSelectTokens: "Hautatu token bat edo gehiago lehenik",
    autocompleteEmptyState: (query) => `Ez da aurkitu etiketarik "${query}"-rentzat`,
    autocompleteFooterHint: "↑↓ Nabigatu · Enter hautatu · Esc itxi",
    
    tagsPanelAssignTagTitle: "Esleitu Etiketa",
    tagsPanelTagsTitle: "Etiketak",
    tagsPanelLevelLabel: "MAILA",
    tagsPanelSearchPlaceholder: "Bilatu etiketak...",
    tagsPanelSelectionStatus: (count) => `${count} hizki hautatuta`,
    tagsPanelSelectPrompt: "Hautatu hizkiak aztertzeko",
    tagsPanelSkipButton: "Omitir",
    tagsPanelCancelButton: "Cancelar",
    tagsPanelBackStepButton: "Volver al paso anterior",
  },
};
