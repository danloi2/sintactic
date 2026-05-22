import { Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { Tag, Span } from "../../types";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useAnalysisStore, useUIStore } from "../../store";

// Margen horizontal interno para separar visualmente spans adyacentes
const INSET = 8; // px

interface SyntacticSpanProps {
  span: Span;
  tag: Tag;
  funcTag: Tag | null | undefined;
  secTag: Tag | null | undefined;
  isTopLine: boolean;
  displayColor: string;
  rect: { left: number; width: number };
  isExportMode?: boolean;
}

export function SyntacticSpan({
  span,
  tag,
  funcTag,
  secTag,
  isTopLine,
  displayColor,
  rect,
  isExportMode,
}: SyntacticSpanProps) {
  const { removeSpan } = useAnalysisStore();
  const { activeSpanId, setActiveSpanId } = useUIStore();

  const isActive = activeSpanId === span.id;
  const isSingleToken = span.tokenIds.length === 1;
  const { left, width } = rect;

  // Línea horizontal: con inset para no pegarse a span contiguo
  const lineStyle: React.CSSProperties = {
    position: "absolute",
    top: "12px",
    borderColor: displayColor,
    borderTopWidth: "2px",
    left: INSET,
    right: INSET,
  };

  // U-bracket: inset mayor para que se vea la separación
  const bracketStyle: React.CSSProperties = {
    position: "absolute",
    top: "12px",
    borderColor: displayColor,
    borderLeftWidth: "2px",
    borderRightWidth: "2px",
    borderBottomWidth: "2px",
    borderRadius: "0 0 8px 8px",
    height: "14px",
    left: isSingleToken ? "calc(50% - 12px)" : INSET,
    right: isSingleToken ? "calc(50% - 12px)" : INSET,
  };

  const labelTop = isTopLine ? "16px" : "30px";

  return (
    <div
      className={cn(
        "absolute top-0 bottom-0 flex flex-col items-center justify-start",
        isActive && !isExportMode && "z-20"
      )}
      style={{ left, width }}
    >
      {/* Decoración: línea o bracket */}
      {isTopLine ? <div style={lineStyle} /> : <div style={bracketStyle} />}

      {/* Etiqueta centrada */}
      <div
        className="absolute flex items-center justify-center"
        style={{ top: labelTop, left: 0, right: 0 }}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "px-3 py-1 rounded-lg text-[13px] font-black cursor-pointer flex items-center gap-1.5",
                "shadow-sm border-2 transition-transform active:scale-95 whitespace-nowrap",
                isActive && !isExportMode && "ring-2 ring-offset-1"
              )}
              style={{
                backgroundColor: `${displayColor}18`,
                color: displayColor,
                borderColor: displayColor,
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (!isExportMode) {
                  setActiveSpanId(isActive ? null : span.id);
                }
              }}
            >
              {tag.short}
              {funcTag && (
                <span className="opacity-90 border-l-2 pl-1.5 border-current ml-1 text-[11px] font-bold">
                  {funcTag.short}
                </span>
              )}
              {secTag && (
                <span className="opacity-90 border-l-2 pl-1.5 border-current ml-1 text-[11px] font-bold">
                  {secTag.short}
                </span>
              )}
              {span.verbParadigm && (
                <span className="opacity-90 border-l-2 pl-1.5 border-current ml-1 text-[11px] font-bold flex flex-col leading-tight">
                  <span>{span.verbParadigm}</span>
                  {span.verbConjugation && <span className="font-normal opacity-80">{span.verbConjugation}</span>}
                </span>
              )}
              {isActive && !isExportMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSpan(span.id);
                    setActiveSpanId(null);
                  }}
                  className="ml-1 p-0.5 hover:bg-destructive hover:text-white rounded-full transition-colors bg-white/20"
                >
                  <Trash2 className="w-3 h-3" />
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
                {secTag && (
                  <>
                    <span className="text-muted-foreground">/</span>
                    <span className="font-bold text-primary">{secTag.label}</span>
                  </>
                )}
                {span.verbParadigm && (
                  <>
                    <span className="text-muted-foreground">/</span>
                    <span className="font-bold text-primary">{span.verbParadigm}</span>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {tag.description}
                {funcTag && (
                  <span className="block mt-1 pt-1 border-t border-border">
                    <strong className="text-primary/70">Paso 2:</strong> {funcTag.description}
                  </span>
                )}
                {secTag && (
                  <span className="block mt-1 pt-1 border-t border-border">
                    <strong className="text-primary/70">Paso 3:</strong> {secTag.description}
                  </span>
                )}
                {span.verbConjugation && (
                  <span className="block mt-1 pt-1 border-t border-border">
                    <strong className="text-primary/70">Aditz:</strong> {span.verbParadigm} → {span.verbConjugation}
                  </span>
                )}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
