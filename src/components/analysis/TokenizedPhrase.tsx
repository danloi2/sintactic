import { useCallback, useMemo, useState, useRef } from "react";
import { useAnalysisStore, useUIStore } from "@/store";
import { Token } from "./Token";
import { cn } from "@/lib/utils";
import { tags as allTags } from "@/data/tags";
import { ChevronUp, ChevronDown, Trash2, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

export function TokenizedPhrase({ className }: { className?: string }) {
  const { tokens, spans, isAnalyzed, currentLayer, setCurrentLayer, removeSpan } = useAnalysisStore();
  const { clearSelection, setActiveSpanId, activeSpanId, selectAll, setAutocompleteOpen } = useUIStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [selectionRect, setSelectionRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
  const [hasMovedEnough, setHasMovedEnough] = useState(false);

  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      if (hasMovedEnough) return;
      if (e.target === e.currentTarget) {
        clearSelection();
      }
    },
    [clearSelection, hasMovedEnough]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setIsDragging(true);
      setDragStart({ x, y });
      setHasMovedEnough(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && dragStart) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;
      const dist = Math.sqrt(dx*dx + dy*dy);

      if (dist > 10) {
        setHasMovedEnough(true);
        setSelectionRect({
          x: Math.min(x, dragStart.x),
          y: Math.min(y, dragStart.y),
          w: Math.abs(dx),
          h: Math.abs(dy)
        });
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDragging) {
      if (hasMovedEnough && selectionRect) {
        const container = e.currentTarget;
        const tokensElements = container.querySelectorAll('[data-token-id]');
        const selectedIds: string[] = [];
        
        const containerRect = container.getBoundingClientRect();
        const selRect = {
          left: selectionRect.x + containerRect.left,
          top: selectionRect.y + containerRect.top,
          right: selectionRect.x + selectionRect.w + containerRect.left,
          bottom: selectionRect.y + selectionRect.h + containerRect.top
        };

        tokensElements.forEach((el) => {
          const elRect = el.getBoundingClientRect();
          const overlap = !(elRect.right < selRect.left || 
                          elRect.left > selRect.right || 
                          elRect.bottom < selRect.top || 
                          elRect.top > selRect.bottom);
          
          if (overlap) {
            const id = el.getAttribute('data-token-id');
            if (id) selectedIds.push(id);
          }
        });

        if (selectedIds.length > 0) {
          selectAll(selectedIds);
        }
      }

      setIsDragging(false);
      setDragStart(null);
      setSelectionRect(null);
      setTimeout(() => setHasMovedEnough(false), 0);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setAutocompleteOpen(true);
  };

  const maxHierarchicalLayer = useMemo(() => {
    const layers = spans.filter(s => !s.isStructure).map(s => s.layer);
    return Math.max(1, ...layers);
  }, [spans]);

  const structureLayer = maxHierarchicalLayer + 1;

  const layerNumbers = useMemo(() => {
    const layers = new Set(spans.map((s) => s.layer));
    layers.add(1); 
    layers.add(currentLayer); 
    layers.add(structureLayer); 
    return Array.from(layers).sort((a, b) => b - a);
  }, [spans, currentLayer, structureLayer]);

  const getTagInfo = (tagId: string) => allTags.find((t) => t.id === tagId);

  if (!isAnalyzed || tokens.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className={cn("space-y-6", className)}>
        {/* Barra de Nivel (Simplificada) */}
        <div className="flex items-center justify-center gap-4 bg-card p-3 rounded-xl border-2 border-primary/20 shadow-lg w-fit mx-auto animate-fade-in">
          <div className="flex items-center gap-2 px-3 border-r border-border mr-2">
            <Layers className="w-5 h-5 text-primary" />
            <span className="text-sm font-bold uppercase tracking-wider text-foreground">Nivel Actual</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentLayer(Math.max(1, currentLayer - 1))}
              className="p-1.5 hover:bg-accent rounded-full transition-colors disabled:opacity-30 border border-border"
              disabled={currentLayer <= 1}
            >
              <ChevronDown className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col items-center min-w-[60px]">
              <span className="text-2xl font-black text-primary leading-none">{currentLayer}</span>
            </div>
            
            <button
              onClick={() => setCurrentLayer(currentLayer + 1)}
              className="p-1.5 hover:bg-accent rounded-full transition-colors border border-border"
              disabled={currentLayer >= structureLayer}
            >
              <ChevronUp className="w-5 h-5" />
            </button>
          </div>
          
          <div className="px-4 py-1 bg-primary/10 rounded-full border border-primary/20 ml-2">
            <span className="text-sm font-bold text-primary">
              {currentLayer === 1 ? "Oracional" : currentLayer === structureLayer ? "Estructura" : "Sintáctico"}
            </span>
          </div>
        </div>

        {/* Grid de Tokens y Spans */}
        <div 
          ref={containerRef}
          className="token-grid-container token-grid-container-export relative overflow-x-auto pb-12 pt-4 scrollbar-thin rounded-2xl bg-white p-8 select-none"
          onClick={handleContainerClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onContextMenu={handleContextMenu}
        >
          {selectionRect && (
            <div 
              className="absolute border-2 border-primary bg-primary/10 pointer-events-none z-50 rounded-sm"
              style={{ left: selectionRect.x, top: selectionRect.y, width: selectionRect.w, height: selectionRect.h }}
            />
          )}

          <div 
            className="grid gap-x-1 gap-y-6 bg-white"
            style={{ gridTemplateColumns: `repeat(${tokens.length}, minmax(110px, 1fr))`, minWidth: `${tokens.length * 110}px` }}
          >
            {tokens.map((token, index) => (
              <Token key={token.id} token={token} index={index} />
            ))}

            {layerNumbers.map((layerNum) => {
              const spansInLayer = spans.filter((s) => s.layer === layerNum);
              const isActive = layerNum === currentLayer;
              const isNivel1 = layerNum === 1;
              
              if (spansInLayer.length === 0 && !isActive) return null;

              return (
                <div 
                  key={layerNum} 
                  className={cn(
                    "grid grid-cols-subgrid col-span-full relative py-2 min-h-[60px] transition-all duration-300",
                    isActive ? "bg-primary/5 ring-2 ring-primary/20 rounded-xl z-10" : "opacity-80 hover:opacity-100",
                    isNivel1 && "border-t-2 border-primary/20 pt-4 mt-2"
                  )}
                >
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 -translate-x-full">
                    <Badge 
                      variant={isActive ? "default" : "secondary"} 
                      className={cn(
                        "whitespace-nowrap font-bold", 
                        isActive && "animate-pulse"
                      )}
                    >
                      Nivel {layerNum} {layerNum === 1 && "(Oracional)"}
                    </Badge>
                  </div>
                  
                  {spansInLayer.map((span) => {
                    const tag = getTagInfo(span.tagId);
                    const funcTag = span.functionTagId ? getTagInfo(span.functionTagId) : null;
                    if (!tag) return null;

                    const tokenIndices = span.tokenIds.map(id => tokens.findIndex(t => t.id === id)).filter(idx => idx !== -1);
                    const minIdx = Math.min(...tokenIndices);
                    const maxIdx = Math.max(...tokenIndices);
                    const isSingleToken = minIdx === maxIdx;

                    return (
                      <div
                        key={span.id}
                        className={cn(
                          "relative flex flex-col items-center justify-start pt-8 group transition-all duration-200",
                          activeSpanId === span.id && "z-20 scale-[1.05]"
                        )}
                        style={{ gridColumn: `${minIdx + 1} / ${maxIdx + 2}` }}
                      >
                        {tag.category === "structure" ? (
                          <div className="absolute top-0 w-full border-t-2" style={{ borderColor: tag.color }} />
                        ) : (
                          <div 
                            className={cn("absolute top-0 h-6 border-x-2 border-b-2 rounded-b-md", isSingleToken ? "w-6" : "left-8 right-8")}
                            style={{ borderColor: tag.color }}
                          />
                        )}
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="relative px-3 py-1.5 rounded-lg text-[12px] font-black cursor-pointer flex items-center gap-1.5 shadow-sm border-2"
                              style={{ backgroundColor: `${tag.color}15`, color: tag.color, borderColor: tag.color }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveSpanId(span.id === activeSpanId ? null : span.id);
                              }}
                            >
                              <span className="whitespace-nowrap flex items-center gap-1">
                                {tag.short}
                                {funcTag && <span className="opacity-90 border-l-2 pl-1.5 border-current ml-1 text-[11px]">{funcTag.short}</span>}
                              </span>
                              
                              {activeSpanId === span.id && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); removeSpan(span.id); setActiveSpanId(null); }}
                                  className="ml-1 p-0.5 hover:bg-destructive hover:text-white rounded-full transition-colors bg-white/10"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-[250px] p-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                                <span className="font-bold text-foreground">{tag.label}</span>
                                {funcTag && (
                                  <>
                                    <span className="text-muted-foreground">/</span>
                                    <span className="font-bold text-primary">{funcTag.label}</span>
                                  </>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {tag.description}
                                {funcTag && (
                                  <span className="block mt-1 pt-1 border-t border-border">
                                    <strong className="text-primary/70">Función:</strong> {funcTag.description}
                                  </span>
                                )}
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}