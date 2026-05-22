import { Tag, AppLanguage, PendingSpan } from "@/core/types";

export interface LanguageConfig {
  code: AppLanguage;
  name: string;
  categoryLabels: Record<string, string>;
  categoryOrder: Record<string, number>;
  tags: Tag[];
  
  // Pedagogical/syntax rules
  applyPedagogicalRules: (tagId: string, functionTagId?: string) => { finalTagId: string; finalFunctionTagId?: string };
  
  // Wizard steps logic
  needsSecondaryStep: (tag: Tag) => boolean;
  isMorphologyMode: (tagId: string) => boolean;
  getFilteredTags: (
    searchQuery: string,
    pendingSpan: PendingSpan | null,
    isMorphologyMode: boolean,
    allTags: Tag[]
  ) => Partial<Record<string, Tag[]>>;
  handleSelectTag: (
    tag: Tag,
    pendingSpan: PendingSpan | null,
    selectedTokenIds: string[],
    allTags: Tag[],
    onTransition: (updatedSpan: PendingSpan | null) => void,
    onComplete: (
      tagId: string,
      tokenIds: string[],
      functionTagId?: string,
      isStructure?: boolean,
      secondaryTagId?: string,
      verbParadigm?: string,
      verbConjugation?: string
    ) => void
  ) => boolean; // returns true if complete, false if transitions
  
  // UI Strings
  getStepText: (pendingSpan: PendingSpan | null, isMorphologyMode: boolean, allTags: Tag[]) => string;
  stepTitle: (pendingSpan: PendingSpan | null, isMorphologyMode: boolean, allTags: Tag[]) => string;
  
  // Custom Wizard (like VerbSelector in Basque)
  shouldShowCustomWizard: (pendingSpan: PendingSpan | null) => boolean;
  CustomWizardComponent?: React.ComponentType<{
    onSave: (paradigm: string, conjugation: string) => void;
    onCancel: () => void;
  }>;

  // Localized general UI labels
  ui: {
    // PhraseInput
    phraseInputPlaceholder: string;
    phraseInputChecking: string;
    phraseInputHint: string;
    phraseInputAnalyzeButton: string;
    phraseInputErrors: (count: number) => string;
    
    // Header / Toolbar
    headerToggleLanguageTitle: string;
    headerChangeLanguageLabel: string;
    headerTagsPanelLabel: string;
    headerTagsPanelTooltip: string;
    headerResetLabel: string;
    headerResetTooltip: string;
    headerExportLabel: string;
    headerExportTooltip: string;
    headerExportImageLabel: string;
    headerExportJsonLabel: string;
    headerImportLabel: string;
    headerImportTooltip: string;
    headerWordsLabel: string;
    headerLangChangeConfirm: string;
    
    // App
    appTitle: string;
    appShortcutPrompt: string;
    appTokensSelected: (count: number) => string;
    
    // Autocomplete
    autocompletePlaceholder: string;
    autocompleteWarningSelectTokens: string;
    autocompleteEmptyState: (query: string) => string;
    autocompleteFooterHint: string;
    
    // TagsPanel
    tagsPanelAssignTagTitle: string;
    tagsPanelTagsTitle: string;
    tagsPanelLevelLabel: string;
    tagsPanelSearchPlaceholder: string;
    tagsPanelSelectionStatus: (count: number) => string;
    tagsPanelSelectPrompt: string;
    tagsPanelSkipButton: string;
    tagsPanelCancelButton: string;
    tagsPanelBackStepButton?: string;
  };
}
