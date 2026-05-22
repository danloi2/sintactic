interface SelectionBoxProps {
  rect: { x: number, y: number, w: number, h: number };
}

export function SelectionBox({ rect }: SelectionBoxProps) {
  return (
    <div 
      className="absolute border-2 border-primary bg-primary/10 pointer-events-none z-100 rounded-sm"
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
    />
  );
}
