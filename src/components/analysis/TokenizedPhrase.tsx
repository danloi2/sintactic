import { useCallback, useMemo, useRef } from "react";
import { useAnalysisStore, useUIStore } from "@/store";
import { Token } from "./Token";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown, Layers, Plus, Minus } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";

import { SelectionBox } from "./parts/SelectionBox";
import { LayerRow } from "./parts/LayerRow";
import { useSelection } from "@/hooks/useSelection";

const SIDEBAR_W = 160; // 100 nivel + 60 gutter
const MIN_TOKEN_W = 110; // ancho mínimo por token

export function TokenizedPhrase({ className }: { className?: string }) {
  const { tokens, spans, isAnalyzed, currentLayer, setCurrentLayer, removeLayer } = useAnalysisStore();
  const { clearSelection, setAutocompleteOpen, isExporting } = useUIStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const { selectionRect, hasMovedEnough, handleMouseDown, handleMouseMove, handleMouseUp } = useSelection();

  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      if (hasMovedEnough) return;
      if (e.target === e.currentTarget) clearSelection();
    },
    [clearSelection, hasMovedEnough]
  );

  const maxLayer = useMemo(() => Math.max(currentLayer, ...spans.map((s) => s.layer)), [spans, currentLayer]);

  const layerNumbers = useMemo(() => {
    const layers = new Set(spans.map((s) => s.layer));
    layers.add(1);
    layers.add(currentLayer);
    return Array.from(layers).sort((a, b) => b - a);
  }, [spans, currentLayer]);

  if (!isAnalyzed || tokens.length === 0) return null;

  // El ancho mínimo del scroll: sidebar + tokens
  const minScrollWidth = SIDEBAR_W + tokens.length * MIN_TOKEN_W;

  return (
    <TooltipProvider>
      <div className={cn("space-y-6", className)}>
        {/* Barra de Control de Niveles */}
        {!isExporting && (
          <div className="flex items-center justify-center gap-4 bg-card p-3 rounded-xl border-2 border-primary/20 shadow-lg w-fit mx-auto">
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
              <span className="text-2xl font-black text-primary leading-none min-w-[40px] text-center">{currentLayer}</span>
              <button
                onClick={() => setCurrentLayer(currentLayer + 1)}
                className="p-1.5 hover:bg-accent rounded-full transition-colors border border-border"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <button
                onClick={() => removeLayer(currentLayer)}
                className="p-1.5 hover:bg-destructive/20 bg-destructive/10 rounded-full transition-colors border border-destructive/20 text-destructive"
                title="Eliminar capa"
              >
                <Minus className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentLayer(currentLayer + 1)}
                className="p-1.5 hover:bg-primary/20 bg-primary/10 rounded-full transition-colors border border-primary/20 text-primary"
                title="Añadir capa"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Lienzo — scrollable horizontalmente si la frase es larga */}
        <div
          ref={containerRef}
          className={cn("relative select-none pb-12 pt-4", isExporting ? "overflow-visible" : "overflow-x-auto")}
          onClick={handleContainerClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onContextMenu={(e) => { e.preventDefault(); setAutocompleteOpen(true); }}
        >
          {selectionRect && <SelectionBox rect={selectionRect} />}

          {/*
            Contenedor exportable.
            - En modo normal: ocupa 100% del scroll container pero nunca menos de minScrollWidth
            - En modo exportación: solo los tokens, sin sidebar
          */}
          <div
            className="token-grid-container-export relative pb-10 pr-8"
            style={{
              width: "100%",
              minWidth: isExporting ? undefined : `${minScrollWidth}px`,
            }}
          >
            {/* Fondo blanco tipo "hoja de papel" */}
            <div
              className={cn(
                "absolute inset-y-0 right-0 bg-white shadow-2xl border border-border/50 z-0",
                isExporting ? "rounded-none border-none shadow-none left-0" : "rounded-3xl left-[132px]"
              )}
            />

            <div className="relative z-10 flex" style={{ minHeight: 120, paddingTop: 12 }}>
              {/* Sidebar placeholder */}
              {!isExporting && (
                <div className="shrink-0" style={{ width: SIDEBAR_W }} />
              )}
              {/* Tokens: se reparten el espacio disponible con flex-1 */}
              {tokens.map((token, index) => (
                <div
                  key={token.id}
                  className="flex-1 flex items-center justify-center"
                  style={{ minWidth: MIN_TOKEN_W }}
                >
                  <Token token={token} index={index} />
                </div>
              ))}
            </div>

            {/* ── Capas de Análisis ── */}
            {layerNumbers.map((layerNum) => (
              <LayerRow
                key={layerNum}
                layerNum={layerNum}
                isActive={layerNum === currentLayer}
                spans={spans.filter((s) => s.layer === layerNum)}
                tokenCount={tokens.length}
                maxLayer={maxLayer}
                onLayerClick={setCurrentLayer}
                isExportMode={isExporting}
              />
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}