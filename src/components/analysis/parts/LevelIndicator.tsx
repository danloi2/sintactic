import { cn } from "@/lib/utils";
import { useAnalysisStore } from "@/store";
import { useState } from "react";

interface LevelIndicatorProps {
  layerNum: number;
  isActive: boolean;
  onClick: () => void;
}

export function LevelIndicator({ layerNum, isActive, onClick }: LevelIndicatorProps) {
  const { swapLayers } = useAnalysisStore();
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div 
      className="col-start-1 sticky left-0 z-40 flex items-center justify-center pointer-events-auto"
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const fromLayer = parseInt(e.dataTransfer.getData("text/plain"), 10);
        if (!isNaN(fromLayer) && fromLayer !== layerNum) {
          swapLayers(fromLayer, layerNum);
        }
      }}
    >
      <div 
        draggable
        onMouseDown={(e) => e.stopPropagation()}
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", layerNum.toString());
          e.dataTransfer.effectAllowed = "move";
        }}
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 shadow-lg border cursor-grab active:cursor-grabbing",
          isActive 
            ? "bg-primary text-primary-foreground scale-110 ring-4 ring-primary/20 border-primary" 
            : "bg-white/40 backdrop-blur-md text-muted-foreground border-white/40 hover:bg-white/60",
          isDragOver && "ring-4 ring-primary/50 scale-110"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <span className="text-[12px] font-black tracking-tighter pointer-events-none">N{layerNum}</span>
      </div>
    </div>
  );
}
