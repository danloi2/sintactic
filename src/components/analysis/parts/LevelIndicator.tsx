import { cn } from "@/lib/utils";

interface LevelIndicatorProps {
  layerNum: number;
  isActive: boolean;
  onClick: () => void;
}

export function LevelIndicator({ layerNum, isActive, onClick }: LevelIndicatorProps) {
  return (
    <div className="col-start-1 sticky left-0 z-40 flex items-center justify-center pointer-events-none">
      <div 
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 pointer-events-auto shadow-lg border",
          isActive 
            ? "bg-primary text-primary-foreground scale-110 ring-4 ring-primary/20 border-primary" 
            : "bg-white/40 backdrop-blur-md text-muted-foreground border-white/40 hover:bg-white/60"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <span className="text-[12px] font-black tracking-tighter">N{layerNum}</span>
      </div>
    </div>
  );
}
