import { useCallback, useEffect } from "react";
import { useAnalysisStore, useUIStore } from "@/store";
import { Header } from "@/components/layout/Header";
import { PhraseInput } from "@/components/analysis/PhraseInput";
import { TokenizedPhrase } from "@/components/analysis/TokenizedPhrase";
import { TagPanel } from "@/components/analysis/TagsPanel";
import { Autocomplete } from "@/components/autocomplete/Autocomplete";
import { FunctionSelector } from "@/components/autocomplete/FunctionSelector";
import { cn } from "@/lib/utils";

export function App() {
  const { isAnalyzed } = useAnalysisStore();
  const { isTagPanelOpen, selectedTokenIds, setAutocompleteOpen } = useUIStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "e") {
        e.preventDefault();
        if (selectedTokenIds.length > 0) {
          setAutocompleteOpen(true);
        }
      }
    },
    [selectedTokenIds, setAutocompleteOpen]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main
        className={cn(
          "flex-1 transition-all duration-300",
          isTagPanelOpen ? "mr-72" : ""
        )}
      >
        <div className="container px-4 sm:px-6 py-8 max-w-none">
          {!isAnalyzed ? (
            <PhraseInput />
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-lg font-medium text-foreground">
                  Análisis de la oración
                </h2>
                <p className="text-sm text-muted-foreground">
                  Selecciona tokens y aplica etiquetas
                </p>
              </div>

              <TokenizedPhrase />

              {selectedTokenIds.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {selectedTokenIds.length} token
                  {selectedTokenIds.length !== 1 ? "s" : ""} seleccionado
                  {selectedTokenIds.length !== 1 ? "s" : ""}. Presiona{" "}
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">
                    Ctrl+E
                  </kbd>{" "}
                  para agregar etiqueta.
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {isTagPanelOpen && <TagPanel />}
      <Autocomplete />
      <FunctionSelector />
    </div>
  );
}