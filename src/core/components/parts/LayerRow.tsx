import { cn } from "../../lib/utils";
import { Span } from "../../types";
import { LevelIndicator } from "./LevelIndicator";
import { SyntacticSpan } from "./SyntacticSpan";
import { getTagsForLanguage } from "@/features/tags/tagRegistry";
import { useRef, useLayoutEffect, useState } from "react";
import { useAnalysisStore } from "../../store";

interface LayerRowProps {
  layerNum: number;
  isActive: boolean;
  spans: Span[];
  tokenCount: number;
  maxLayer: number;
  onLayerClick: (layer: number) => void;
  isExportMode?: boolean;
}

export function LayerRow({
  layerNum,
  isActive,
  spans,
  tokenCount,
  maxLayer,
  onLayerClick,
  isExportMode,
}: LayerRowProps) {
  const { language } = useAnalysisStore();
  const allTags = getTagsForLanguage(language);
  const getTagInfo = (tagId: string) => allTags.find((t) => t.id === tagId);
  const [spanRects, setSpanRects] = useState<Record<string, { left: number; width: number }>>({});
  const areaRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el || tokenCount === 0 || spans.length === 0) return;

    const updateRects = () => {
      // Usar el contenedor padre relativo para cálculos de posición
      const container = el.closest(".token-grid-container-export") as HTMLElement || el;
      const containerRect = container.getBoundingClientRect();
      const newRects: Record<string, { left: number; width: number }> = {};

      spans.forEach((span) => {
        let minLeft = Infinity;
        let maxRight = -Infinity;

        span.tokenIds.forEach((id) => {
          const tokenEl = document.querySelector(`[data-token-id="${id}"]`);
          if (tokenEl) {
            const tRect = tokenEl.getBoundingClientRect();
            const left = tRect.left - containerRect.left;
            const right = left + tRect.width;
            if (left < minLeft) minLeft = left;
            if (right > maxRight) maxRight = right;
          }
        });

        if (minLeft !== Infinity) {
          // Ajustar a las dimensiones de `el` (área relativa sin sidebar)
          const areaOffset = el.getBoundingClientRect().left - containerRect.left;
          newRects[span.id] = { left: minLeft - areaOffset, width: maxRight - minLeft };
        }
      });
      setSpanRects(newRects);
    };

    updateRects();

    // Re-calcular si la ventana o el contenedor cambian
    const ro = new ResizeObserver(updateRects);
    ro.observe(el);
    const container = el.closest(".token-grid-container-export");
    if (container) ro.observe(container);

    // Timeout por si los tokens tardan un frame en renderizarse
    const timer = setTimeout(updateRects, 50);

    return () => {
      ro.disconnect();
      clearTimeout(timer);
    };
  }, [tokenCount, spans]);

  return (
    <div
      className={cn(
        "flex items-stretch min-h-[68px] transition-all duration-300",
        isActive && !isExportMode && "z-10"
      )}
      onClick={() => onLayerClick(layerNum)}
    >
      {/* Sidebar: indicador de nivel */}
      {!isExportMode && (
        <>
          <div
            className="shrink-0 sticky left-0 z-40 flex items-center justify-center"
            style={{ width: 100 }}
          >
            <LevelIndicator
              layerNum={layerNum}
              isActive={isActive}
              onClick={() => onLayerClick(layerNum)}
            />
          </div>
          {/* Gutter entre sidebar y papel */}
          <div className="shrink-0" style={{ width: 60 }} />
        </>
      )}

      {/* Área de análisis: ocupa TODO el espacio disponible */}
      <div ref={areaRef} className="relative flex-1 min-w-0" style={{ minHeight: 68 }}>
        {/* Highlight capa activa */}
        {isActive && !isExportMode && (
          <div className="absolute inset-y-2 inset-x-2 bg-primary/5 ring-2 ring-primary/20 rounded-xl pointer-events-none z-0" />
        )}

        {spans.map((span) => {
          const tag = getTagInfo(span.tagId);
          const funcTag = span.functionTagId ? getTagInfo(span.functionTagId) : null;
          const secTag = span.secondaryTagId ? getTagInfo(span.secondaryTagId) : null;
          if (!tag) return null;

          const isPhraseOrSentence =
            tag.category === "phrase" || tag.category === "sentence";
          const displayColor =
            isPhraseOrSentence || !funcTag ? tag.color : funcTag.color;
          const isTopLine =
            span.layer === maxLayer || tag.renderShape === "line";

          const rect = spanRects[span.id];
          if (!rect) return null; // Aún no medido

          return (
            <SyntacticSpan
              key={span.id}
              span={span}
              tag={tag}
              funcTag={funcTag}
              secTag={secTag}
              isTopLine={isTopLine}
              displayColor={displayColor}
              rect={rect}
              isExportMode={isExportMode}
            />
          );
        })}
      </div>
    </div>
  );
}
