import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAnalysisStore, useUIStore } from "@/store";
import { Header } from "@/core/components/layout/Header";
import { PhraseInput } from "@/features/analysis/PhraseInput";
import { TokenizedPhrase } from "@/core/components/TokenizedPhrase";
import { TagPanel } from "@/features/panel/TagsPanel";
import { Autocomplete } from "@/features/autocomplete/Autocomplete";
import { FunctionSelector } from "@/features/autocomplete/FunctionSelector";
import { cn } from "@/core/lib/utils";
import { ChevronUp, ChevronDown, Plus, Minus, UserX, Check, X } from "lucide-react";
import { getLanguageConfig } from "@/languages";

export function App() {
  const { isAnalyzed, language, currentLayer, setCurrentLayer, removeLayer, addImplicitToken } = useAnalysisStore();
  const { isTagPanelOpen, selectedTokenIds, setAutocompleteOpen } = useUIStore();
  const [showImplicitInput, setShowImplicitInput] = useState(false);
  const [implicitText, setImplicitText] = useState("");
  const implicitInputRef = useRef<HTMLInputElement>(null);

  const ui = useMemo(() => getLanguageConfig(language ?? "es").ui, [language]);

  const handleAddImplicit = () => {
    setShowImplicitInput(true);
    setTimeout(() => implicitInputRef.current?.focus(), 50);
  };
  const handleConfirmImplicit = () => {
    const trimmed = implicitText.trim();
    if (trimmed) addImplicitToken(trimmed);
    setImplicitText("");
    setShowImplicitInput(false);
  };
  const handleCancelImplicit = () => {
    setImplicitText("");
    setShowImplicitInput(false);
  };

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
        <div className="container px-4 sm:px-6 py-3 max-w-none">
          {!isAnalyzed ? (
            <PhraseInput />
          ) : (
            <div className="space-y-2">
              {/* ── Barra de título + controles de nivel ── */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h2 className="text-base font-semibold text-foreground leading-none">
                  {ui.appTitle}
                </h2>

                {/* Controles compactos: nivel actual + Ø */}
                <div className="flex items-center gap-1.5">
                  {/* − nivel actual + */}
                  <button
                    onClick={() => removeLayer(currentLayer)}
                    className="p-1 hover:bg-destructive/20 bg-destructive/10 rounded-md transition-colors border border-destructive/20 text-destructive"
                    title="Eliminar nivel"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCurrentLayer(Math.max(1, currentLayer - 1))}
                    className="p-1 hover:bg-accent rounded-md transition-colors border border-border disabled:opacity-30"
                    disabled={currentLayer <= 1}
                    title="Nivel anterior"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">N</span>
                  <span className="text-lg font-black text-primary leading-none min-w-[24px] text-center">{currentLayer}</span>
                  <button
                    onClick={() => setCurrentLayer(currentLayer + 1)}
                    className="p-1 hover:bg-accent rounded-md transition-colors border border-border"
                    title="Nivel siguiente"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCurrentLayer(currentLayer + 1)}
                    className="p-1 hover:bg-primary/20 bg-primary/10 rounded-md transition-colors border border-primary/20 text-primary"
                    title="Añadir nivel"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                  {/* Separador */}
                  <div className="w-px h-5 bg-border mx-1" />

                  {/* Sujeto omitido Ø */}
                  {!showImplicitInput ? (
                    <button
                      onClick={handleAddImplicit}
                      className="flex items-center gap-1 px-2 py-1 hover:bg-amber-500/20 bg-amber-500/10 rounded-md transition-colors border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold"
                      title="Añadir sujeto omitido (tácito/elíptico)"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Ø</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-amber-600 dark:text-amber-400 font-bold text-xs">Ø</span>
                      <input
                        ref={implicitInputRef}
                        value={implicitText}
                        onChange={(e) => setImplicitText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleConfirmImplicit();
                          if (e.key === "Escape") handleCancelImplicit();
                        }}
                        placeholder="ej: yo"
                        className="w-20 px-2 py-0.5 text-xs rounded border-2 border-amber-400 bg-background focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                      />
                      <button onClick={handleConfirmImplicit} className="p-0.5 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-600 dark:text-amber-400 transition-colors">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={handleCancelImplicit} className="p-0.5 rounded hover:bg-destructive/20 text-muted-foreground transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <TokenizedPhrase />

              {selectedTokenIds.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {ui.appTokensSelected(selectedTokenIds.length)}. Presiona{" "}
                  <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+E</kbd>{" "}
                  {ui.appShortcutPrompt}.
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