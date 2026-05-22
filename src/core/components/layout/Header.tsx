import { useCallback, useMemo, useRef } from "react";
import { useAnalysisStore, useUIStore } from "@/core/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  Layers,
  Download,
  Upload,
  RotateCcw,
  Image as ImageIcon,
  FileJson,
} from "lucide-react";
import { toPng } from "html-to-image";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/core/lib/utils";
import { AppLanguage } from "@/core/types";
import { getLanguageConfig } from "@/languages";

// Tauri imports (v2)
const isTauri =
  typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__;

// ── Language toggle slider ──────────────────────────────────────────────────
interface LangToggleProps {
  language: AppLanguage;
  onChange: (lang: AppLanguage) => void;
}

function LangToggle({ language, onChange }: LangToggleProps) {
  const isEU = language === "eu";

  const handleClick = useCallback(() => {
    const next: AppLanguage = isEU ? "es" : "eu";
    onChange(next);
  }, [isEU, onChange]);

  return (
    <button
      id="lang-toggle"
      onClick={handleClick}
      title={getLanguageConfig(language).ui.headerToggleLanguageTitle}
      className={cn(
        "relative flex items-center h-8 rounded-full border-2 transition-all duration-300 select-none",
        "px-1 gap-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isEU
          ? "border-green-500/60 bg-green-950/40"
          : "border-primary/40 bg-primary/5"
      )}
      style={{ minWidth: 88 }}
      aria-pressed={isEU}
    >
      {/* Sliding pill */}
      <span
        className={cn(
          "absolute top-0.5 bottom-0.5 w-10 rounded-full transition-all duration-300 shadow-md",
          isEU
            ? "translate-x-[calc(100%-2px)] bg-green-500"
            : "translate-x-0 bg-primary"
        )}
        style={{ left: 2 }}
      />

      {/* Labels */}
      <span
        className={cn(
          "relative z-10 text-[11px] font-black w-10 text-center transition-colors duration-200",
          !isEU ? "text-white" : "text-muted-foreground"
        )}
      >
        ES
      </span>
      <span
        className={cn(
          "relative z-10 text-[11px] font-black w-10 text-center transition-colors duration-200",
          isEU ? "text-white" : "text-muted-foreground"
        )}
      >
        EU
      </span>
    </button>
  );
}

// ── Header ──────────────────────────────────────────────────────────────────
export function Header() {
  const {
    reset,
    isAnalyzed,
    phrase,
    tokens,
    spans,
    loadAnalysis,
    language,
    setLanguage,
  } = useAnalysisStore();
  const { isTagPanelOpen, setTagPanelOpen, isExporting, setExporting } =
    useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = useMemo(() => getLanguageConfig(language), [language]);
  const ui = config.ui;

  const handleLanguageChange = useCallback(
    (lang: AppLanguage) => {
      if (isAnalyzed) {
        const targetConfig = getLanguageConfig(lang);
        if (!window.confirm(targetConfig.ui.headerLangChangeConfirm)) return;
        reset();
      }
      setLanguage(lang);
    },
    [isAnalyzed, reset, setLanguage]
  );

  const saveFile = async (dataUrl: string | Blob, fileName: string) => {
    // Escenario Desktop (Tauri)
    if (isTauri) {
      try {
        const { save } = await import("@tauri-apps/plugin-dialog");
        const { writeTextFile, writeFile } = await import(
          "@tauri-apps/plugin-fs"
        );

        const extension = fileName.split(".").pop() || "*";
        const filterName =
          extension === "json" ? "Análisis Sintáctico" : "Imagen PNG";

        const path = await save({
          defaultPath: fileName,
          filters: [{ name: filterName, extensions: [extension] }],
        });

        if (path) {
          if (typeof dataUrl === "string" && dataUrl.startsWith("data:image")) {
            const base64Data = dataUrl.split(",")[1];
            const binaryData = new Uint8Array(
              atob(base64Data)
                .split("")
                .map((char) => char.charCodeAt(0))
            );
            await writeFile(path, binaryData);
          } else {
            await writeTextFile(
              path,
              typeof dataUrl === "string"
                ? dataUrl
                : JSON.stringify(dataUrl, null, 2)
            );
          }
          alert("Archivo guardado correctamente");
        }
        return;
      } catch (err) {
        console.error("Error saving via Tauri", err);
        alert(
          "Error al guardar el archivo: " +
            (err instanceof Error ? err.message : String(err))
        );
        return;
      }
    }

    // Escenario Web con API de Sistema de Archivos (Chrome/Edge/Opera)
    if ("showSaveFilePicker" in window) {
      try {
        const extension = fileName.split(".").pop() || "json";
        const mimeType =
          extension === "json" ? "application/json" : "image/png";

        const handle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description:
                extension === "json"
                  ? "Análisis Sintáctico"
                  : "Imagen de Análisis",
              accept: { [mimeType]: [`.${extension}`] },
            },
          ],
        });

        const writable = await handle.createWritable();

        if (typeof dataUrl === "string" && dataUrl.startsWith("data:image")) {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          await writable.write(blob);
        } else {
          await writable.write(dataUrl);
        }

        await writable.close();
        return;
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error(
            "FileSystem API error, falling back to legacy download",
            err
          );
        } else {
          return;
        }
      }
    }

    // Fallback web clásico (Descarga directa)
    const link = document.createElement("a");
    link.download = fileName;
    link.href =
      typeof dataUrl === "string" ? dataUrl : URL.createObjectURL(dataUrl);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (typeof dataUrl !== "string") URL.revokeObjectURL(link.href);
  };

  const exportAsImage = async () => {
    try {
      setExporting(true);
      await new Promise((r) => setTimeout(r, 200));

      const grid = document.querySelector(
        ".token-grid-container-export"
      ) as HTMLElement;
      if (!grid) {
        setExporting(false);
        return;
      }

      const dataUrl = await toPng(grid, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        style: { padding: "50px", borderRadius: "0px" },
      });

      setExporting(false);
      await saveFile(
        dataUrl,
        `analisis-${phrase.substring(0, 20).replace(/\s+/g, "_")}.png`
      );
    } catch (err) {
      console.error("Error al exportar imagen", err);
      setExporting(false);
    }
  };

  const exportAsJSON = async () => {
    const data = {
      phrase,
      tokens,
      spans,
      language,
      exportedAt: new Date().toISOString(),
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const fileName = `analisis-${phrase
      .substring(0, 20)
      .replace(/\s+/g, "_")}.json`;

    if (isTauri) {
      await saveFile(jsonStr, fileName);
    } else {
      const blob = new Blob([jsonStr], { type: "application/json" });
      await saveFile(blob, fileName);
    }
  };

  const handleImportClick = async () => {
    if (isTauri) {
      try {
        const { open } = await import("@tauri-apps/plugin-dialog");
        const { readTextFile } = await import("@tauri-apps/plugin-fs");

        const selected = await open({
          multiple: false,
          filters: [{ name: "Análisis Sintáctico", extensions: ["json"] }],
        });

        if (selected && !Array.isArray(selected)) {
          const contents = await readTextFile(selected);
          const json = JSON.parse(contents);
          if (json.phrase && json.tokens && json.spans) {
            loadAnalysis(json);
          } else {
            alert("El archivo JSON no tiene un formato de análisis válido.");
          }
        }
        return;
      } catch (err) {
        console.error("Error importing via Tauri", err);
        alert(
          "Error al importar: " +
            (err instanceof Error ? err.message : String(err))
        );
      }
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.phrase && json.tokens && json.spans) {
          loadAnalysis(json);
        } else {
          alert("El archivo JSON no tiene un formato de análisis válido.");
        }
      } catch (err) {
        console.error("Error al leer el archivo JSON", err);
        alert("Error al procesar el archivo JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <TooltipProvider>
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black text-primary tracking-tighter">
            Sintactic
          </h1>
          {isAnalyzed && (
            <Badge
              variant="secondary"
              className="text-xs font-bold bg-primary/10 text-primary border-primary/20"
            >
              {new Set(tokens.filter(t => !t.isImplicit).map(t => t.wordId)).size} {ui.headerWordsLabel}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* ── Language Toggle ── */}
          <LangToggle language={language} onChange={handleLanguageChange} />

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isTagPanelOpen ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTagPanelOpen(!isTagPanelOpen)}
                className={cn(isTagPanelOpen && "bg-primary/10 text-primary")}
              >
                <Layers className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline font-bold">
                  {ui.headerTagsPanelLabel}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{ui.headerTagsPanelTooltip}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                className="hover:text-destructive transition-colors"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline font-bold">
                  {ui.headerResetLabel}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{ui.headerResetTooltip}</p>
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Exportación */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!isAnalyzed || isExporting}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline font-bold">
                      {ui.headerExportLabel}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>{ui.headerExportTooltip}</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-56 p-2">
              <DropdownMenuItem
                className="gap-3 p-3 cursor-pointer rounded-md font-bold"
                onClick={exportAsImage}
              >
                <ImageIcon className="w-4 h-4 text-primary" />
                {ui.headerExportImageLabel}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-3 p-3 cursor-pointer rounded-md font-bold"
                onClick={exportAsJSON}
              >
                <FileJson className="w-4 h-4 text-primary" />
                {ui.headerExportJsonLabel}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Importación */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={handleImportClick}>
                <Upload className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline font-bold">
                  {ui.headerImportLabel}
                </span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json"
                  className="hidden"
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{ui.headerImportTooltip}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  );
}
