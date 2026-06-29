import { useCallback, useRef } from 'react';
import type { WidgetState } from '../types/widget';
import { clamp } from '../utils/clamp';

export function useDraggable(widget: WidgetState, onChange: (next: WidgetState) => void) {
  const startRef = useRef({ x: 0, y: 0, left: 0, top: 0 });
  return useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (widget.pinned) return;
    startRef.current = { x: event.clientX, y: event.clientY, left: widget.x, top: widget.y };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    const onMove = (moveEvent: PointerEvent) => {
      const nextX = clamp(startRef.current.left + moveEvent.clientX - startRef.current.x, 8, window.innerWidth - widget.width - 8);
      const nextY = clamp(startRef.current.top + moveEvent.clientY - startRef.current.y, 8, window.innerHeight - widget.height - 8);
      onChange({ ...widget, x: nextX, y: nextY });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  }, [onChange, widget]);
}
