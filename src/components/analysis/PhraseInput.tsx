import { useState, useCallback, useRef, KeyboardEvent, useEffect } from "react";
import { useAnalysisStore } from "@/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";

interface LTMatch {
  message: string;
  offset: number;
  length: number;
  replacements: { value: string }[];
  rule: { description: string };
}

const UI = {
  es: {
    placeholder: "Escribe una oración para analizar...\nEjemplo: El perro come rápidamente en el parque",
    checking: "Revisando...",
    errors: (n: number) => `${n} ${n === 1 ? "error" : "errores"}`,
    hint: "Enter para analizar",
    button: "Analizar",
    lang: "es" as const,
  },
  eu: {
    placeholder: "Idatzi aztertzeko esaldi bat...\nAdibidea: Mutilak parkean azkar jaten du",
    checking: "Aztertzen...",
    errors: (n: number) => `${n} ${n === 1 ? "akats" : "akats"}`,
    hint: "Enter analisia egiteko",
    button: "Aztertu",
    lang: "eu" as const,
  },
};

export function PhraseInput() {
  const { phrase, setPhrase, analyze, isAnalyzed, language } = useAnalysisStore();
  const [localPhrase, setLocalPhrase] = useState(phrase);
  const [ltMatches, setLtMatches] = useState<LTMatch[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const t = UI[language ?? "es"];

  const checkGrammar = useCallback(
    async (text: string, lang: "es" | "eu") => {
      if (!text.trim() || text.trim().split(" ").length < 2) {
        setLtMatches([]);
        return;
      }
      setIsChecking(true);
      try {
        const params = new URLSearchParams({ language: lang, text });
        const res = await fetch("https://api.languagetool.org/v2/check", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString(),
        });
        const data = await res.json();
        setLtMatches(data.matches ?? []);
      } catch {
        // Silently fail — no interrumpir el flujo si la API no está disponible
      } finally {
        setIsChecking(false);
      }
    },
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalPhrase(val);
    setLtMatches([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => checkGrammar(val, t.lang), 900);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

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

  const applyFix = (match: LTMatch, replacement: string) => {
    const fixed =
      localPhrase.slice(0, match.offset) +
      replacement +
      localPhrase.slice(match.offset + match.length);
    setLocalPhrase(fixed);
    setLtMatches((prev) => prev.filter((m) => m !== match));
  };

  if (isAnalyzed) return null;

  const hasErrors = ltMatches.length > 0;

  return (
    <div className="w-full max-w-3xl mx-auto p-4 space-y-3">
      <div className="relative">
        <textarea
          value={localPhrase}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={t.placeholder}
          className={cn(
            "input-area min-h-[120px] text-lg w-full resize-none",
            "focus:outline-none focus:ring-2 focus:ring-ring",
            hasErrors && "focus:ring-destructive/50"
          )}
          rows={3}
          spellCheck
          lang={t.lang}
        />

        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          {isChecking && (
            <span className="text-xs text-muted-foreground animate-pulse">
              {t.checking}
            </span>
          )}
          {!isChecking && localPhrase.trim().length > 0 && !hasErrors && (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          )}
          {!isChecking && hasErrors && (
            <span className="flex items-center gap-1 text-xs font-medium text-destructive">
              <AlertCircle className="w-4 h-4" />
              {t.errors(ltMatches.length)}
            </span>
          )}
          <span className="text-xs text-muted-foreground hidden sm:block">
            {t.hint}
          </span>
          <Button
            onClick={handleAnalyze}
            disabled={!localPhrase.trim()}
            size="sm"
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {t.button}
          </Button>
        </div>
      </div>

      {/* Lista de errores gramaticales con corrección rápida */}
      {hasErrors && (
        <div className="space-y-2">
          {ltMatches.map((match, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-sm"
            >
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">
                  «{localPhrase.slice(match.offset, match.offset + match.length)}»
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {match.message}
                </p>
                {match.replacements.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {match.replacements.slice(0, 4).map((r, j) => (
                      <button
                        key={j}
                        onClick={() => applyFix(match, r.value)}
                        className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors border border-primary/20"
                      >
                        {r.value}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}