import { cn } from "@/lib/utils";
import { Span } from "@/types";
import { LevelIndicator } from "./LevelIndicator";
import { SyntacticSpan } from "./SyntacticSpan";
import { tags as allTags } from "@/data/tags";
import { useRef, useLayoutEffect, useState } from "react";


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
  const getTagInfo = (tagId: string) => allTags.find((t) => t.id === tagId);
  const areaRef = useRef<HTMLDivElement>(null);
  const [colWidth, setColWidth] = useState(120);

  // Medir el ancho real del contenedor y dividirlo entre los tokens
  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el || tokenCount === 0) return;
    const update = () => setColWidth(el.offsetWidth / tokenCount);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [tokenCount]);

  return (
    <div
      className={cn(
        "flex items-stretch min-h-[150px] transition-all duration-300",
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
      <div ref={areaRef} className="relative flex-1 min-w-0" style={{ minHeight: 150 }}>
        {/* Highlight capa activa */}
        {isActive && !isExportMode && (
          <div className="absolute inset-y-2 inset-x-2 bg-primary/5 ring-2 ring-primary/20 rounded-xl pointer-events-none z-0" />
        )}

        {spans.map((span) => {
          const tag = getTagInfo(span.tagId);
          const funcTag = span.functionTagId ? getTagInfo(span.functionTagId) : null;
          if (!tag) return null;

          const isPhraseOrSentence =
            tag.category === "phrase" || tag.category === "sentence";
          const displayColor =
            isPhraseOrSentence || !funcTag ? tag.color : funcTag.color;
          const isTopLine =
            span.layer === maxLayer || tag.renderShape === "line";

          return (
            <SyntacticSpan
              key={span.id}
              span={span}
              tag={tag}
              funcTag={funcTag}
              isTopLine={isTopLine}
              displayColor={displayColor}
              colWidth={colWidth}
              isExportMode={isExportMode}
            />
          );
        })}
      </div>
    </div>
  );
}
