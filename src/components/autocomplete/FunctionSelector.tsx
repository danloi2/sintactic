import { useMemo, useState } from "react";
import { useAnalysisStore, useUIStore } from "@/store";
import { Tag, TagCategory } from "@/types";
import { tags as allTags, getTagsByCategory } from "@/data/tags";
import { cn } from "@/lib/utils";
import { X, Search } from "lucide-react";

interface FunctionSelectorProps {
  className?: string;
}

export function FunctionSelector({ className }: FunctionSelectorProps) {
  const { pendingSpan, setPendingSpan, addSpan } = useAnalysisStore();
  const { clearSelection } = useUIStore();
  const [searchQuery, setSearchQuery] = useState("");

  const isMorphologyMode = useMemo(() => {
    return pendingSpan && ["nucleo", "enlace", "nexo", "modificador"].includes(pendingSpan.tagId);
  }, [pendingSpan]);

  const functions = useMemo(() => {
    const category: TagCategory = isMorphologyMode ? "morphology" : "function";
    const baseTags = getTagsByCategory(category);
    if (!searchQuery.trim()) return baseTags;

    const term = searchQuery.toLowerCase().trim();
    return baseTags.filter(tag =>
      tag.label.toLowerCase().includes(term) ||
      tag.short.toLowerCase().includes(term) ||
      (tag.aliases && tag.aliases.some(a => a.toLowerCase().includes(term)))
    );
  }, [isMorphologyMode, searchQuery]);

  if (!pendingSpan) return null;

  const selectedTag = allTags.find((t) => t.id === pendingSpan.tagId);

  const handleSelectFunction = (functionTagId: string) => {
    if (pendingSpan) {
      addSpan(pendingSpan.tagId, pendingSpan.tokenIds, functionTagId, selectedTag?.category === "structure");
      clearSelection();
      setPendingSpan(null);
    }
  };

  const handleSkip = () => {
    if (pendingSpan) {
      addSpan(pendingSpan.tagId, pendingSpan.tokenIds, undefined, selectedTag?.category === "structure");
      clearSelection();
      setPendingSpan(null);
    }
  };

  const handleCancel = () => {
    setPendingSpan(null);
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-start justify-center pt-24",
        "bg-black/60 animate-fade-in",
        className
      )}
      onClick={handleCancel}
    >
      <div
        className="w-full max-w-lg bg-popover border-2 border-primary rounded-xl shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border bg-primary/10">
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Selecciona {isMorphologyMode ? "la categoría morfológica" : "la función"} de
            </span>
            <p className="text-lg font-bold text-foreground">
              {selectedTag?.label}
            </p>
          </div>
          <button
            className="text-muted-foreground hover:text-foreground p-2"
            onClick={handleCancel}
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
              placeholder={isMorphologyMode ? "Buscar categoría..." : "Buscar función..."}
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
            Omitir ({isMorphologyMode ? "sin categoría" : "sin función"})
          </button>
          <button
            className="text-sm text-destructive hover:underline"
            onClick={handleCancel}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}