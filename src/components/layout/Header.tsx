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
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

export function Header() {
  const { reset, isAnalyzed, phrase, tokens, spans, loadAnalysis } = useAnalysisStore();
  const { isTagPanelOpen, setTagPanelOpen } = useUIStore();
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportAsImage = async () => {
    const grid = document.querySelector(".token-grid-container-export") as HTMLElement;
    if (!grid) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(grid, {
        backgroundColor: "#ffffff",
        style: {
          padding: "40px",
          borderRadius: "0px",
        }
      });
      const link = document.createElement("a");
      link.download = `analisis-${phrase.substring(0, 20)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error al exportar imagen", err);
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsJSON = () => {
    const data = {
      phrase,
      tokens,
      spans,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `analisis-${phrase.substring(0, 20)}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
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
    // Limpiar el input para permitir volver a cargar el mismo archivo
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