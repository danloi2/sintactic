import { Token as TokenType } from "@/types";
import { useAnalysisStore, useUIStore } from "@/store";
import { cn } from "@/lib/utils";

interface TokenProps {
  token: TokenType;
  index: number;
}

export function Token({ token, index }: TokenProps) {
  const { selectedTokenIds, selectToken, highlightedTokenIds } = useUIStore();
  const { removeToken } = useAnalysisStore();

  const isSelected = selectedTokenIds.includes(token.id);
  const isHighlighted = highlightedTokenIds.includes(token.id);

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      const lastSelected = useUIStore.getState().lastSelectedTokenId;
      if (lastSelected && lastSelected !== token.id) {
        const tokenIds = useAnalysisStore.getState().tokens.map((t) => t.id);
        const startIdx = tokenIds.indexOf(lastSelected);
        const endIdx = tokenIds.indexOf(token.id);
        const [min, max] = [
          Math.min(startIdx, endIdx),
          Math.max(startIdx, endIdx),
        ];
        const rangeIds = tokenIds.slice(min, max + 1);
        useUIStore.getState().selectAll(rangeIds);
      } else {
        selectToken(token.id, "toggle");
      }
    } else if (e.ctrlKey || e.metaKey) {
      selectToken(token.id, "toggle");
    } else {
      selectToken(token.id, "single");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectToken(token.id, "toggle");
    }
  };

  return (
    <div
      data-token-id={token.id}
      className={cn(
        "token-cell relative flex flex-col items-center justify-center group",
        isSelected && "selected",
        isHighlighted && "highlighted",
        token.isLetter && "letter-token"
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-selected={isSelected}
      aria-label={`Token ${index + 1}: ${token.text}`}
    >
      {/* Implicit subject marker */}
      {token.isImplicit && (
        <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400 mb-0.5 tracking-wide uppercase">
          Ø suj.
        </span>
      )}
      <div className="relative">
        <span
          className={cn(
            "token-text rounded-md font-mono font-medium cursor-pointer",
            "transition-all duration-150",
            token.isImplicit
              ? "border-dashed border-2 border-amber-400/70 text-amber-700 dark:text-amber-300 italic bg-amber-50 dark:bg-amber-950/30"
              : "border-2 border-transparent",
            token.isLetter
              ? "px-[3px] py-1 text-[1.1rem]" // Much tighter for letters
              : "px-4 py-2 text-lg"
          )}
        >
          {token.text}
        </span>
        {/* Delete button for implicit tokens */}
        {token.isImplicit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeToken(token.id);
            }}
            className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
            title="Eliminar sujeto omitido"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}