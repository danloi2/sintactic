import { useCallback, useMemo, useRef } from "react";
import { useAnalysisStore } from "@/core/store/analysisStore";
import { useUIStore } from "@/core/store/uiStore";
import { Token } from "./Token";
import { cn } from "@/core/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

import { SelectionBox } from "./parts/SelectionBox";
import { LayerRow } from "./parts/LayerRow";
import { useSelection } from "@/core/hooks/useSelection";

const SIDEBAR_W = 160;
const MIN_TOKEN_W = 110;

export function TokenizedPhrase({ className }: { className?: string }) {
  const { tokens, spans, isAnalyzed, currentLayer, setCurrentLayer } = useAnalysisStore();
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
    const layers = [];
    for (let i = maxLayer; i >= 1; i--) {
      layers.push(i);
    }
    return layers;
  }, [maxLayer]);

  if (!isAnalyzed || tokens.length === 0) return null;

  const wordCount = useMemo(() => new Set(tokens.map((t) => t.wordId || t.id)).size, [tokens]);
  const minScrollWidth = SIDEBAR_W + wordCount * MIN_TOKEN_W;

  return (
    <TooltipProvider>
      <div className={cn(className)}>
        {/* Lienzo — scrollable horizontalmente si la frase es larga */}
        <div
          ref={containerRef}
          className={cn("relative select-none pt-2 pb-4", isExporting ? "overflow-visible" : "overflow-x-auto")}
          onClick={handleContainerClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onContextMenu={(e) => { e.preventDefault(); setAutocompleteOpen(true); }}
        >
          {selectionRect && <SelectionBox rect={selectionRect} />}

          <div
            className={cn(
              "token-grid-container-export relative",
              isExporting ? "px-12 pb-16 pt-8" : "pr-8 pb-10"
            )}
            style={{
              width: isExporting ? "max-content" : "100%",
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

            <div className="relative z-10 flex" style={{ minHeight: 80, paddingTop: 8 }}>
              {/* Sidebar placeholder */}
              {!isExporting && (
                <div className="shrink-0" style={{ width: SIDEBAR_W }} />
              )}
              {/* Tokens */}
              {tokens.map((token, index) => {
                const prevToken = index > 0 ? tokens[index - 1] : null;
                const isNewWord =
                  token.wordId && prevToken?.wordId && token.wordId !== prevToken.wordId;

                return (
                  <div
                    key={token.id}
                    className="flex flex-col items-center justify-center"
                    style={{
                      minWidth: token.isLetter ? undefined : MIN_TOKEN_W,
                      marginLeft: isNewWord ? 16 : 0,
                    }}
                  >
                    <Token token={token} index={index} />
                  </div>
                );
              })}
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
