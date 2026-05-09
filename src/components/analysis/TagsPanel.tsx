import { useState, useMemo } from "react";
import { Tag, TagCategory } from "@/types";
import { tags } from "@/data/tags";
import { useAnalysisStore, useUIStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Search, X, ArrowLeft, Layers } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

const categoryLabels: Record<TagCategory, string> = {
  sentence: "1. Oraciones",
  phrase: "2. Sintagmas",
  connector: "3. Enlaces",
  function: "4. Funciones Sintácticas",
  structure: "5. Estructura Interna",
  morphology: "6. Morfología",
};

export function TagPanel({ className }: { className?: string }) {
  const { addSpan, setPendingSpan, pendingSpan, currentLayer } = useAnalysisStore();
  const { selectedTokenIds, clearSelection } = useUIStore();

  const [searchQuery, setSearchQuery] = useState("");

  const pendingTag = useMemo(() => 
    pendingSpan ? tags.find(t => t.id === pendingSpan.tagId) : null
  , [pendingSpan]);

  const filteredTags = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const list = query 
      ? tags.filter(
          (tag) =>
            tag.label.toLowerCase().includes(query) ||
            tag.short.toLowerCase().includes(query) ||
            tag.aliases.some((alias) => alias.toLowerCase().includes(query))
        )
      : tags;

    if (pendingSpan) {
      return {
        function: list.filter((t) => t.category === "function"),
      };
    }

    return {
      sentence: list.filter((t) => t.category === "sentence"),
      phrase: list.filter((t) => t.category === "phrase"),
      connector: list.filter((t) => t.category === "connector"),
      function: list.filter((t) => t.category === "function"),
      structure: list.filter((t) => t.category === "structure"),
      morphology: list.filter((t) => t.category === "morphology"),
    };
  }, [searchQuery, pendingSpan]);

  const handleTagClick = (tag: Tag) => {
    if (pendingSpan) {
      const isMorphologyMode = ["nucleo", "enlace", "nexo", "modificador"].includes(pendingSpan.tagId);
      const targetCategory = isMorphologyMode ? "morphology" : "function";
      
      if (tag.category === targetCategory) {
        const isStructure = tags.find(t => t.id === pendingSpan.tagId)?.category === "structure";
        addSpan(pendingSpan.tagId, pendingSpan.tokenIds, tag.id, isStructure);
        setPendingSpan(null);
        clearSelection();
      }
      return;
    }

    if (selectedTokenIds.length > 0) {
      const needsSecondary = tag.category === "phrase" || ["nucleo", "enlace", "nexo", "modificador"].includes(tag.id);
      
      if (needsSecondary) {
        setPendingSpan({ tagId: tag.id, tokenIds: selectedTokenIds });
        clearSelection();
      } else {
        addSpan(tag.id, selectedTokenIds, undefined, tag.category === "structure");
        clearSelection();
      }
    }
  };

  const hasSelection = selectedTokenIds.length > 0;

  return (
    <TooltipProvider>
      <div
        className={cn(
          "sidebar fixed right-0 top-14 bottom-0 z-40",
          "border-l border-border bg-card",
          "flex flex-col",
          className
        )}
      >
        <div className="panel-header">
          {pendingSpan ? (
            <div className="flex flex-col gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setPendingSpan(null)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="font-semibold text-foreground">Asignar Función</h2>
              </div>
              <div className="flex items-center gap-2 px-2 py-1 bg-primary/10 rounded border border-primary/20">
                <span className="text-xs font-bold text-primary">{pendingTag?.short}</span>
                <span className="text-xs text-muted-foreground truncate">{pendingTag?.label}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-foreground">Etiquetas</h2>
              </div>
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 font-black">
                NIVEL {currentLayer}
              </Badge>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar etiquetas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {pendingSpan ? (
          <div className="px-4 py-2 bg-accent/50 border-y border-border">
            <p className="text-[11px] font-medium text-foreground uppercase tracking-wider">
              Paso 2: ¿Qué función cumple?
            </p>
          </div>
        ) : hasSelection ? (
          <div className="px-4 py-2 bg-primary/10 border-y border-primary/20">
            <p className="text-xs text-muted-foreground">
              {selectedTokenIds.length} palabra{selectedTokenIds.length !== 1 ? "s" : ""} seleccionada
            </p>
          </div>
        ) : (
          <div className="px-4 py-2 bg-muted/20 border-y border-border">
            <p className="text-[10px] text-muted-foreground uppercase font-bold text-center">
              Selecciona palabras para analizar
            </p>
          </div>
        )}

        <div className="panel-content scrollbar-thin">
          {Object.entries(filteredTags).map(([category, tagsList]) => {
            if (tagsList.length === 0) return null;
            return (
              <div key={category} className="category-section">
                <h3 className="category-title">
                  {categoryLabels[category as TagCategory]}
                </h3>
                <div className="flex flex-col gap-1">
                  {tagsList.map((tag: Tag) => (
                    <TagItem
                      key={tag.id}
                      tag={tag}
                      onClick={() => handleTagClick(tag)}
                      disabled={!hasSelection && !pendingSpan}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}

interface TagItemProps {
  tag: Tag;
  onClick: () => void;
  disabled?: boolean;
}

function TagItem({ tag, onClick, disabled }: TagItemProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={cn(
            "tag-item w-full text-left transition-all",
            disabled && "opacity-30 cursor-not-allowed grayscale",
            !disabled && "hover:translate-x-1"
          )}
          onClick={onClick}
          disabled={disabled}
        >
          <span
            className="w-3 h-3 rounded-full shrink-0 shadow-sm"
            style={{ backgroundColor: tag.color }}
          />
          <span className="flex-1 text-sm text-foreground truncate font-medium">
            {tag.label}
          </span>
          <Badge
            variant="secondary"
            className="text-[10px] py-0 px-1.5 font-bold"
            style={{ color: tag.color, borderColor: tag.color, backgroundColor: `${tag.color}15` }}
          >
            {tag.short}
          </Badge>
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-[200px]">
        <p className="font-bold mb-1">{tag.label}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{tag.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}