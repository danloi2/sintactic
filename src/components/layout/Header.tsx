import { useAnalysisStore, useUIStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Layers, Download, Upload, RotateCcw, Image as ImageIcon, FileJson } from "lucide-react";
import { toPng } from "html-to-image";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useRef } from "react";
import { cn } from "@/lib/utils";

// Tauri imports (v2)
const isTauri = typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__;

export function Header() {
  const { reset, isAnalyzed, phrase, tokens, spans, loadAnalysis } = useAnalysisStore();
  const { isTagPanelOpen, setTagPanelOpen, isExporting, setExporting } = useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveFile = async (dataUrl: string | Blob, fileName: string) => {
    // Escenario Desktop (Tauri)
    if (isTauri) {
      try {
        const { save } = await import("@tauri-apps/plugin-dialog");
        const { writeTextFile, writeFile } = await import("@tauri-apps/plugin-fs");

        const extension = fileName.split(".").pop() || "*";
        const filterName = extension === "json" ? "Análisis Sintáctico" : "Imagen PNG";

        const path = await save({
          defaultPath: fileName,
          filters: [{ name: filterName, extensions: [extension] }]
        });

        if (path) {
          if (typeof dataUrl === "string" && dataUrl.startsWith("data:image")) {
            const base64Data = dataUrl.split(",")[1];
            const binaryData = new Uint8Array(
              atob(base64Data)
                .split("")
                .map(char => char.charCodeAt(0))
            );
            await writeFile(path, binaryData);
          } else {
            await writeTextFile(path, typeof dataUrl === "string" ? dataUrl : JSON.stringify(dataUrl, null, 2));
          }
          alert("Archivo guardado correctamente");
        }
        return;
      } catch (err) {
        console.error("Error saving via Tauri", err);
        alert("Error al guardar el archivo: " + (err instanceof Error ? err.message : String(err)));
        return;
      }
    }

    // Escenario Web con API de Sistema de Archivos (Chrome/Edge/Opera)
    if ("showSaveFilePicker" in window) {
      try {
        const extension = fileName.split(".").pop() || "json";
        const mimeType = extension === "json" ? "application/json" : "image/png";
        
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [{
            description: extension === "json" ? "Análisis Sintáctico" : "Imagen de Análisis",
            accept: { [mimeType]: [`.${extension}`] }
          }]
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
        // Si el usuario cancela, no hacemos nada. Si es otro error, fallback a descarga clásica.
        if (err.name !== "AbortError") {
          console.error("FileSystem API error, falling back to legacy download", err);
        } else {
          return;
        }
      }
    }

    // Fallback web clásico (Descarga directa)
    const link = document.createElement("a");
    link.download = fileName;
    link.href = typeof dataUrl === "string" ? dataUrl : URL.createObjectURL(dataUrl);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (typeof dataUrl !== "string") URL.revokeObjectURL(link.href);
  };

  const exportAsImage = async () => {
    try {
      setExporting(true);
      await new Promise(r => setTimeout(r, 200));

      const grid = document.querySelector(".token-grid-container-export") as HTMLElement;
      if (!grid) {
        setExporting(false);
        return;
      }

      const dataUrl = await toPng(grid, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        style: { padding: "50px", borderRadius: "0px" }
      });

      setExporting(false);
      await saveFile(dataUrl, `analisis-${phrase.substring(0, 20).replace(/\s+/g, "_")}.png`);
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
      exportedAt: new Date().toISOString()
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const fileName = `analisis-${phrase.substring(0, 20).replace(/\s+/g, "_")}.json`;
    
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
          filters: [{ name: "Análisis Sintáctico", extensions: ["json"] }]
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
        alert("Error al importar: " + (err instanceof Error ? err.message : String(err)));
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
          <h1 className="text-xl font-black text-primary tracking-tighter">Sintactic</h1>
          {isAnalyzed && (
            <Badge variant="secondary" className="text-xs font-bold bg-primary/10 text-primary border-primary/20">
              {tokens.length} PALABRAS
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isTagPanelOpen ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTagPanelOpen(!isTagPanelOpen)}
                className={cn(isTagPanelOpen && "bg-primary/10 text-primary")}
              >
                <Layers className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline font-bold">Etiquetas</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Abrir panel de etiquetas</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={reset} className="hover:text-destructive transition-colors">
                <RotateCcw className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline font-bold">Reiniciar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reiniciar análisis</p>
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Exportación */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={!isAnalyzed || isExporting}>
                    <Download className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline font-bold">Exportar</span>
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Descargar análisis (PNG/JSON)</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-56 p-2">
              <DropdownMenuItem className="gap-3 p-3 cursor-pointer rounded-md font-bold" onClick={exportAsImage}>
                <ImageIcon className="w-4 h-4 text-primary" />
                Descargar como Imagen
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3 p-3 cursor-pointer rounded-md font-bold" onClick={exportAsJSON}>
                <FileJson className="w-4 h-4 text-primary" />
                Descargar como JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Importación */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={handleImportClick}>
                <Upload className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline font-bold">Importar</span>
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
              <p>Cargar análisis desde un archivo JSON</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  );
}