import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Tag } from "@/core/types";
import { filterTags } from "../tags/tagRegistry";
import { useTagFlow } from "../tags/useTagFlow";
import { useUIStore } from "@/core/store/uiStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/core/lib/utils";
import { Search } from "lucide-react";

interface AutocompleteProps {
  className?: string;
}

export function Autocomplete({ className }: AutocompleteProps) {
  const {
    language,
    selectedTokenIds,
    categoryLabels,
    handleSelectTag,
    config,
  } = useTagFlow();

  const {
    isAutocompleteOpen,
    setAutocompleteOpen,
    autocompleteQuery,
    setAutocompleteQuery,
  } = useUIStore();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredTags = useMemo(() => {
    return filterTags(autocompleteQuery, language);
  }, [autocompleteQuery, language]);

  useEffect(() => {
    if (isAutocompleteOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAutocompleteOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [autocompleteQuery]);

  const onSelect = useCallback(
    (tag: Tag) => {
      handleSelectTag(tag);
      setAutocompleteOpen(false);
      setAutocompleteQuery("");
    },
    [handleSelectTag, setAutocompleteOpen, setAutocompleteQuery]
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
            onSelect(filteredTags[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setAutocompleteOpen(false);
          setAutocompleteQuery("");
          break;
      }
    },
    [filteredTags, selectedIndex, onSelect, setAutocompleteOpen, setAutocompleteQuery]
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
            placeholder={config.ui.autocompletePlaceholder}
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
              {config.ui.autocompleteWarningSelectTokens}
            </p>
          </div>
        )}

        <div className="max-h-[60vh] overflow-y-auto p-1 custom-scrollbar">
          {filteredTags.length > 0 ? (
            (() => {
              let lastCategory = "";
              return filteredTags.map((tag, index) => {
                const showHeader = tag.category !== lastCategory;
                lastCategory = tag.category;
                
                return (
                  <div key={tag.id}>
                    {showHeader && (
                      <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 bg-muted/30 sticky top-0 z-10 backdrop-blur-sm border-y border-border/50 first:border-t-0">
                        {categoryLabels[tag.category] || tag.category}
                      </div>
                    )}
                    <button
                      className={cn(
                        "w-full text-left flex items-center gap-3 px-3 py-2.5 transition-all duration-200 rounded-md",
                        index === selectedIndex ? "bg-primary text-primary-foreground shadow-md scale-[1.02] z-20" : "hover:bg-accent text-foreground"
                      )}
                      onClick={() => onSelect(tag)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      ref={index === selectedIndex ? (el) => el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) : null}
                    >
                      <span
                        className={cn(
                          "w-2.5 h-2.5 rounded-full shrink-0 border border-white/20",
                          index === selectedIndex ? "bg-white" : ""
                        )}
                        style={{ backgroundColor: index === selectedIndex ? undefined : tag.color }}
                      />
                      <span className="flex-1 text-sm font-medium">
                        {tag.label}
                      </span>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded font-bold border",
                        index === selectedIndex ? "bg-white/20 border-white/40 text-white" : "bg-muted border-border text-muted-foreground"
                      )}>
                        {tag.short}
                      </span>
                    </button>
                  </div>
                );
              });
            })()
          ) : (
            <div className="px-3 py-12 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-3 opacity-20" />
              <p className="text-sm">
                {config.ui.autocompleteEmptyState(autocompleteQuery)}
              </p>
            </div>
          )}
        </div>

        <div className="px-3 py-2 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">
            {config.ui.autocompleteFooterHint}
          </p>
        </div>
      </div>
    </div>
  );
}
