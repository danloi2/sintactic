import { useState, useCallback } from "react";
import { useUIStore } from "@/store";

export function useSelection() {
  const { selectAll } = useUIStore();
  const [selectionRect, setSelectionRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
  const [hasMovedEnough, setHasMovedEnough] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setIsDragging(true);
      setDragStart({ x, y });
      setHasMovedEnough(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && dragStart) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;
      const dist = Math.sqrt(dx*dx + dy*dy);

      if (dist > 10) {
        setHasMovedEnough(true);
        setSelectionRect({
          x: Math.min(x, dragStart.x),
          y: Math.min(y, dragStart.y),
          w: Math.abs(dx),
          h: Math.abs(dy)
        });
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDragging) {
      if (hasMovedEnough && selectionRect) {
        const container = e.currentTarget;
        const tokensElements = container.querySelectorAll('[data-token-id]');
        const selectedIds: string[] = [];
        
        const containerRect = container.getBoundingClientRect();
        const selRect = {
          left: selectionRect.x + containerRect.left,
          top: selectionRect.y + containerRect.top,
          right: selectionRect.x + selectionRect.w + containerRect.left,
          bottom: selectionRect.y + selectionRect.h + containerRect.top
        };

        tokensElements.forEach((el) => {
          const elRect = el.getBoundingClientRect();
          const overlap = !(elRect.right < selRect.left || 
                          elRect.left > selRect.right || 
                          elRect.bottom < selRect.top || 
                          elRect.top > selRect.bottom);
          
          if (overlap) {
            const id = el.getAttribute('data-token-id');
            if (id) selectedIds.push(id);
          }
        });

        if (selectedIds.length > 0) {
          selectAll(selectedIds);
        }
      }

      setIsDragging(false);
      setDragStart(null);
      setSelectionRect(null);
      setTimeout(() => setHasMovedEnough(false), 0);
    }
  };

  const resetSelection = useCallback(() => {
    setSelectionRect(null);
    setIsDragging(false);
    setDragStart(null);
    setHasMovedEnough(false);
  }, []);

  return {
    selectionRect,
    hasMovedEnough,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetSelection
  };
}
