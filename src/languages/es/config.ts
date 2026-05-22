import { LanguageConfig } from "../types";
import { Tag } from "@/core/types";
import { tags as esTags } from "./tags";
import { categoryLabelsES, CATEGORY_ORDER_ES } from "./categories";
import { applyPedagogicalRules } from "./rules";

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

export const esConfig: LanguageConfig = {
  code: "es",
  name: "Español",
  categoryLabels: categoryLabelsES,
  categoryOrder: CATEGORY_ORDER_ES,
  tags: esTags,
  
  applyPedagogicalRules,
  
  needsSecondaryStep: (tag: Tag) => {
    return tag.category === "phrase" || ["nucleo", "enlace", "nexo", "modificador"].includes(tag.id);
  },
  
  isMorphologyMode: (tagId: string) => {
    return ["nucleo", "enlace", "nexo", "modificador"].includes(tagId);
  },
  
  getFilteredTags: (searchQuery, pendingSpan, isMorphologyMode, allTags) => {
    if (pendingSpan) {
      const targetCategory = isMorphologyMode ? "morphology" : "function";
      return {
        [targetCategory]: filterByQuery(
          allTags.filter((t) => t.category === targetCategory),
          searchQuery
        ),
      };
    }
    
    const filtered = filterByQuery(allTags, searchQuery);
    return {
      sentence: filtered.filter((t) => t.category === "sentence"),
      phrase: filtered.filter((t) => t.category === "phrase"),
      connector: filtered.filter((t) => t.category === "connector"),
      function: filtered.filter((t) => t.category === "function"),
      structure: filtered.filter((t) => t.category === "structure"),
      morphology: filtered.filter((t) => t.category === "morphology"),
    };
  },
  
  handleSelectTag: (tag, pendingSpan, selectedTokenIds, allTags, onTransition, onComplete) => {
    if (pendingSpan) {
      const isMorph = ["nucleo", "enlace", "nexo", "modificador"].includes(pendingSpan.tagId);
      const targetCategory = isMorph ? "morphology" : "function";
      if (tag.category === targetCategory) {
        const parentTag = allTags.find((t) => t.id === pendingSpan.tagId);
        onComplete(
          pendingSpan.tagId,
          pendingSpan.tokenIds,
          tag.id,
          parentTag?.category === "structure"
        );
        return true;
      }
      return false;
    }
    
    if (selectedTokenIds.length > 0) {
      const isPhr = tag.category === "phrase";
      const isExtra = ["nucleo", "enlace", "nexo", "modificador"].includes(tag.id);
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
  
  getStepText: () => {
    return "Paso 2: ¿Qué función cumple?";
  },
  
  stepTitle: (_pendingSpan, isMorphologyMode) => {
    return isMorphologyMode ? "la categoría morfológica" : "la función";
  },
  
  shouldShowCustomWizard: () => false,
  
  ui: {
    phraseInputPlaceholder: "Escribe una oración para analizar...\nEjemplo: El perro come rápidamente en el parque",
    phraseInputChecking: "Revisando...",
    phraseInputHint: "Enter para analizar",
    phraseInputAnalyzeButton: "Analizar",
    phraseInputErrors: (count) => `${count} ${count === 1 ? "error" : "errores"}`,
    
    headerToggleLanguageTitle: "Cambiar a Euskara",
    headerChangeLanguageLabel: "EUS",
    headerTagsPanelLabel: "Etiquetas",
    headerTagsPanelTooltip: "Abrir panel de etiquetas",
    headerResetLabel: "Reiniciar",
    headerResetTooltip: "Reiniciar análisis",
    headerExportLabel: "Exportar",
    headerExportTooltip: "Descargar análisis (PNG/JSON)",
    headerExportImageLabel: "Descargar como Imagen",
    headerExportJsonLabel: "Descargar como JSON",
    headerImportLabel: "Importar",
    headerImportTooltip: "Cargar análisis desde un archivo JSON",
    headerWordsLabel: "PALABRAS",
    headerLangChangeConfirm: "Al cambiar a Euskara se reiniciará el análisis. ¿Continuar?",
    
    appTitle: "Análisis de la oración",
    appShortcutPrompt: "para agregar etiqueta",
    appTokensSelected: (count) => `${count} letra${count !== 1 ? "s" : ""} seleccionada${count !== 1 ? "s" : ""}`,
    
    autocompletePlaceholder: "Escribe para buscar etiquetas...",
    autocompleteWarningSelectTokens: "Selecciona uno o más tokens primero",
    autocompleteEmptyState: (query) => `No se encontraron etiquetas para "${query}"`,
    autocompleteFooterHint: "↑↓ Navegar · Enter seleccionar · Esc cerrar",
    
    tagsPanelAssignTagTitle: "Asignar Función",
    tagsPanelTagsTitle: "Etiquetas",
    tagsPanelLevelLabel: "NIVEL",
    tagsPanelSearchPlaceholder: "Buscar etiquetas...",
    tagsPanelSelectionStatus: (count) => `${count} letra${count !== 1 ? "s" : ""} seleccionada`,
    tagsPanelSelectPrompt: "Selecciona letras para analizar",
    tagsPanelSkipButton: "Omitir",
    tagsPanelCancelButton: "Cancelar",
  },
};
