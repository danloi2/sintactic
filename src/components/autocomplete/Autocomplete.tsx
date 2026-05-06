import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Tag } from "@/types";
import { filterTags } from "@/data/tags";
import { useAnalysisStore, useUIStore } from "@/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface AutocompleteProps {
  className?: string;
}

export function Autocomplete({ className }: AutocompleteProps) {
  const { addSpan, setPendingSpan } = useAnalysisStore();
  const {
    isAutocompleteOpen,
    setAutocompleteOpen,
    autocompleteQuery,
    setAutocompleteQuery,
    selectedTokenIds,
    clearSelection,
  } = useUIStore();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredTags = useMemo(() => {
    return filterTags(autocompleteQuery);
  }, [autocompleteQuery]);

  useEffect(() => {
    if (isAutocompleteOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAutocompleteOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [autocompleteQuery]);

  const handleSelectTag = useCallback(
    (tag: Tag) => {
      if (selectedTokenIds.length > 0) {
        if (tag.category === "phrase") {
          // Si es un sintagma, pedir función
          setPendingSpan({ tagId: tag.id, tokenIds: selectedTokenIds });
        } else {
          // Función, Conector o Estructura, agregar directamente
          addSpan(tag.id, selectedTokenIds, undefined, tag.category === "structure");
        }
        clearSelection();
      }
      setAutocompleteOpen(false);
      setAutocompleteQuery("");
    },
    [selectedTokenIds, addSpan, setPendingSpan, clearSelection, setAutocompleteOpen, setAutocompleteQuery]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            Math.min(prev + 1, filteredTags.length - 1)
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredTags[selectedIndex]) {
            handleSelectTag(filteredTags[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setAutocompleteOpen(false);
          setAutocompleteQuery("");
          break;
      }
    },
    [filteredTags, selectedIndex, handleSelectTag, setAutocompleteOpen, setAutocompleteQuery]
  );

  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        setAutocompleteOpen(false);
      }
    },
    [setAutocompleteOpen]
  );

  if (!isAutocompleteOpen) return null;

  const hasSelection = selectedTokenIds.length > 0;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-start justify-center pt-20",
        "bg-black/50 animate-fade-in",
        className
      )}
      onClick={handleContainerClick}
    >
      <div
        className="w-full max-w-md bg-popover border border-border rounded-lg shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 p-3 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={autocompleteQuery}
            onChange={(e) => setAutocompleteQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe para buscar etiquetas..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
            autoComplete="off"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAutocompleteOpen(false);
              setAutocompleteQuery("");
            }}
          >
            Esc
          </Button>
        </div>

        {!hasSelection && (
          <div className="px-3 py-2 bg-destructive/10 border-b border-destructive/20">
            <p className="text-xs text-destructive">
              Selecciona uno o más tokens primero
            </p>
          </div>
        )}

        <div className="max-h-64 overflow-y-auto">
          {filteredTags.length > 0 ? (
            filteredTags.map((tag, index) => (
              <button
                key={tag.id}
                className={cn(
                  "autocomplete-item w-full text-left flex items-center gap-3",
                  index === selectedIndex && "bg-accent"
                )}
                onClick={() => handleSelectTag(tag)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="flex-1 text-sm text-foreground">
                  {tag.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {tag.short}
                </span>
                {tag.aliases.length > 0 && (
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    · {tag.aliases[0]}
                  </span>
                )}
              </button>
            ))
          ) : (
            <div className="px-3 py-8 text-center text-muted-foreground">
              <p className="text-sm">No se encontraron etiquetas</p>
            </div>
          )}
        </div>

        <div className="px-3 py-2 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">
            ↑↓ Navegar · Enter seleccionar · Esc cerrar
          </p>
        </div>
      </div>
    </div>
  );
}