import { Token as TokenType } from "@/types";
import { useAnalysisStore, useUIStore } from "@/store";
import { cn } from "@/lib/utils";

interface TokenProps {
  token: TokenType;
  index: number;
}

export function Token({ token, index }: TokenProps) {
  const { selectedTokenIds, selectToken, highlightedTokenIds } = useUIStore();

  const isSelected = selectedTokenIds.includes(token.id);
  const isHighlighted = highlightedTokenIds.includes(token.id);

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      const lastSelected = useUIStore.getState().lastSelectedTokenId;
      if (lastSelected && lastSelected !== token.id) {
        const tokenIds = useAnalysisStore.getState().tokens.map(t => t.id);
        const startIdx = tokenIds.indexOf(lastSelected);
        const endIdx = tokenIds.indexOf(token.id);
        const [min, max] = [Math.min(startIdx, endIdx), Math.max(startIdx, endIdx)];
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
        "token-cell relative flex flex-col items-center justify-center",
        isSelected && "selected",
        isHighlighted && "highlighted"
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-selected={isSelected}
      aria-label={`Token ${index + 1}: ${token.text}`}
    >
      <span className="token-text px-4 py-2 rounded-md font-mono text-lg font-medium cursor-pointer transition-all duration-150 border-2 border-transparent">
        {token.text}
      </span>
    </div>
  );
}