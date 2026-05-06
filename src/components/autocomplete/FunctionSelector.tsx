import { useMemo } from "react";
import { useAnalysisStore, useUIStore } from "@/store";
import { tags as allTags, getTagsByCategory } from "@/data/tags";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface FunctionSelectorProps {
  className?: string;
}

export function FunctionSelector({ className }: FunctionSelectorProps) {
  const { pendingSpan, setPendingSpan, addSpan } = useAnalysisStore();
  const { clearSelection } = useUIStore();

  const functions = useMemo(() => getTagsByCategory("function"), []);

  if (!pendingSpan) return null;

  const selectedTag = allTags.find((t) => t.id === pendingSpan.tagId);

  const handleSelectFunction = (functionTagId: string) => {
    if (pendingSpan) {
      addSpan(pendingSpan.tagId, pendingSpan.tokenIds, functionTagId);
      clearSelection();
      setPendingSpan(null);
    }
  };

  const handleSkip = () => {
    if (pendingSpan) {
      addSpan(pendingSpan.tagId, pendingSpan.tokenIds);
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
              Selecciona la función de
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

        <div className="p-3 grid grid-cols-2 gap-2 max-h-72 overflow-y-auto">
          {functions.map((func) => (
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
            Omitir (sin función)
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