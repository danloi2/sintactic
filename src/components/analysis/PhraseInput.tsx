import { useState, useCallback, KeyboardEvent } from "react";
import { useAnalysisStore } from "@/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export function PhraseInput() {
  const { phrase, setPhrase, analyze, isAnalyzed } = useAnalysisStore();
  const [localPhrase, setLocalPhrase] = useState(phrase);

  const handleAnalyze = useCallback(() => {
    setPhrase(localPhrase);
    setTimeout(() => analyze(), 0);
  }, [localPhrase, setPhrase, analyze]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  if (isAnalyzed) {
    return null;
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <div className="relative">
        <textarea
          value={localPhrase}
          onChange={(e) => setLocalPhrase(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe una oración para analizar...&#10;Ejemplo: El perro come rápidamente en el parque"
          className={cn(
            "input-area min-h-[120px] text-lg",
            "focus:outline-none focus:ring-2 focus:ring-ring"
          )}
          rows={3}
        />

        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:block">
            Enter para analizar
          </span>
          <Button
            onClick={handleAnalyze}
            disabled={!localPhrase.trim()}
            size="sm"
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Analizar
          </Button>
        </div>
      </div>
    </div>
  );
}