import { useMemo, useState } from "react";
import { useAnalysisStore, useUIStore } from "@/store";
import { Tag, TagCategory } from "@/types";
import { getTagsForLanguage } from "@/data/tags";
import { cn } from "@/lib/utils";
import { X, Search } from "lucide-react";
import { VerbSelector } from "@/components/autocomplete/VerbSelector";

interface FunctionSelectorProps {
  className?: string;
}

export function FunctionSelector({ className }: FunctionSelectorProps) {
  const { pendingSpan, setPendingSpan, addSpan, language } = useAnalysisStore();
  const { clearSelection } = useUIStore();
  const [searchQuery, setSearchQuery] = useState("");

  const isEU = language === "eu";
  const allTags = getTagsForLanguage(language);

  // Determinar en qué "paso" estamos
  const isMorphologyMode = useMemo(() => {
    return (
      pendingSpan &&
      ["nucleo", "enlace", "nexo", "modificador", "eu-n", "eu-p"].includes(
        pendingSpan.tagId
      )
    );
  }, [pendingSpan]);

  const currentStepCategories = useMemo((): TagCategory[] => {
    if (!pendingSpan) return [];
    if (isEU) {
      if (pendingSpan.declinationTagId) {
        if (pendingSpan.declinationTagId === "eu-ad") {
          return []; // Show verb selector instead of this popup
        }
        // Step 3 (EU): After declension
        const parentTag = allTags.find((t) => t.id === pendingSpan.tagId);
        const isPhrase = parentTag?.category === "phrase";
        // For phrase sintagmas (PS, SN…): show morphology and functions
        if (isPhrase) {
          return ["morphology", "function"];
        }
        return ["function"];
      }
      if (isMorphologyMode) return ["morphology"]; // Step 2 (morph)
      return ["declension"]; // Step 2 (declension)
    } else {
      return isMorphologyMode ? ["morphology"] : ["function"];
    }
  }, [pendingSpan, isEU, isMorphologyMode, allTags]);

  const functions = useMemo(() => {
    if (currentStepCategories.length === 0) return [];
    const baseTags = allTags.filter((t) => currentStepCategories.includes(t.category));

    if (!searchQuery.trim()) return baseTags;

    const term = searchQuery.toLowerCase().trim();
    return baseTags.filter(
      (tag) =>
        tag.label.toLowerCase().includes(term) ||
        tag.short.toLowerCase().includes(term) ||
        (tag.aliases && tag.aliases.some((a) => a.toLowerCase().includes(term)))
    );
  }, [currentStepCategories, allTags, searchQuery]);

  if (!pendingSpan) return null;

  const showVerbSelector = isEU && pendingSpan.declinationTagId === "eu-ad";

  if (!showVerbSelector && currentStepCategories.length === 0) return null;

  const selectedTag = allTags.find((t) => t.id === pendingSpan.tagId);
  const selectedDeclTag = pendingSpan.declinationTagId
    ? allTags.find((t) => t.id === pendingSpan.declinationTagId)
    : null;

  const handleSelectFunction = (tagId: string) => {
    if (!pendingSpan) return;

    if (isEU) {
      const clickedTag = allTags.find((t) => t.id === tagId);
      if (!clickedTag) return;

      if (clickedTag.category === "declension") {
        // Go to step 3
        setPendingSpan({ ...pendingSpan, declinationTagId: tagId });
        setSearchQuery("");
      } else if (clickedTag.category === "function" || clickedTag.category === "morphology") {
        if (clickedTag.id === "eu-ad") {
          setPendingSpan({ ...pendingSpan, declinationTagId: tagId });
          setSearchQuery("");
          return;
        }
        // Finish Step 3 or Step 2 (morph)
        const isStructure = selectedTag?.category === "structure";
        addSpan(
          pendingSpan.tagId,
          pendingSpan.tokenIds,
          pendingSpan.declinationTagId || tagId,
          isStructure,
          pendingSpan.declinationTagId ? tagId : undefined
        );
        clearSelection();
        setPendingSpan(null);
      }
    } else {
      // Normal ES behavior
      const isStructure = selectedTag?.category === "structure";
      addSpan(pendingSpan.tagId, pendingSpan.tokenIds, tagId, isStructure);
      clearSelection();
      setPendingSpan(null);
    }
  };

  const handleSkip = () => {
    if (!pendingSpan) return;

    const isStep2Declension = isEU && !pendingSpan.declinationTagId && !isMorphologyMode;
    if (isStep2Declension) {
      // Skip declension, go to function? Or finish?
      // Assuming finishing is safer.
      const isStructure = selectedTag?.category === "structure";
      addSpan(
        pendingSpan.tagId,
        pendingSpan.tokenIds,
        undefined,
        isStructure
      );
      clearSelection();
      setPendingSpan(null);
    } else {
      // Finish
      const isStructure = selectedTag?.category === "structure";
      addSpan(
        pendingSpan.tagId,
        pendingSpan.tokenIds,
        pendingSpan.declinationTagId,
        isStructure
      );
      clearSelection();
      setPendingSpan(null);
    }
  };

  const handleCancel = () => {
    if (isEU && pendingSpan.declinationTagId) {
      // Go back to step 2
      setPendingSpan({
        tagId: pendingSpan.tagId,
        tokenIds: pendingSpan.tokenIds,
      });
    } else {
      setPendingSpan(null);
    }
  };

  const stepTitle = () => {
    if (isEU) {
      if (pendingSpan.declinationTagId) {
        const parentTag = allTags.find((t) => t.id === pendingSpan.tagId);
        const isPhrase = parentTag?.category === "phrase";
        return isPhrase ? "la morfología o función" : "la función";
      }
      return isMorphologyMode ? "la morfología" : "la declinación";
    }
    return isMorphologyMode ? "la categoría morfológica" : "la función";
  };

  const parentLabel = selectedDeclTag
    ? `${selectedTag?.label} → ${selectedDeclTag.label}`
    : selectedTag?.label;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-start justify-center pt-24",
        "bg-black/60 animate-fade-in",
        className
      )}
      onClick={() => setPendingSpan(null)}
    >
      <div
        className="w-full max-w-lg bg-popover border-2 border-primary rounded-xl shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {showVerbSelector ? (
          <div className="p-4 bg-popover">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Aditza Konfiguratu
                </span>
                <p className="text-lg font-bold text-foreground">
                  {selectedTag?.label} → Aditza
                </p>
              </div>
              <button
                className="text-muted-foreground hover:text-foreground p-2"
                onClick={() => setPendingSpan(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <VerbSelector
              onSave={(paradigm, conjugation) => {
                const isStructure = selectedTag?.category === "structure";
                addSpan(
                  pendingSpan.tagId,
                  pendingSpan.tokenIds,
                  "eu-ad",
                  isStructure,
                  undefined,
                  paradigm,
                  conjugation
                );
                clearSelection();
                setPendingSpan(null);
              }}
              onCancel={() => {
                setPendingSpan({
                  tagId: pendingSpan.tagId,
                  tokenIds: pendingSpan.tokenIds,
                });
              }}
            />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-4 border-b border-border bg-primary/10">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Selecciona {stepTitle()} de
                </span>
                <p className="text-lg font-bold text-foreground">{parentLabel}</p>
              </div>
              <button
                className="text-muted-foreground hover:text-foreground p-2"
                onClick={() => setPendingSpan(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 border-b border-border bg-muted/20">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  autoFocus
                  placeholder={`Buscar ${stepTitle()}...`}
                  className="w-full bg-background border border-border rounded-md py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="p-3 grid grid-cols-2 gap-2 max-h-72 overflow-y-auto">
              {functions.map((func: Tag) => (
                <button
                  key={func.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left border border-border hover:border-primary"
                  onClick={() => handleSelectFunction(func.id)}
                >
                  <span
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: func.color }}
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground block">
                      {func.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {func.short}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-3 border-t border-border bg-muted/30 flex justify-between">
              <button
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={handleSkip}
              >
                Omitir
              </button>
              <button
                className="text-sm text-destructive hover:underline"
                onClick={handleCancel}
              >
                {isEU && pendingSpan.declinationTagId ? "Volver al paso anterior" : "Cancelar"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}