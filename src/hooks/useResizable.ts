import { useCallback, useRef } from 'react';
import type { WidgetState } from '../types/widget';
import { clamp } from '../utils/clamp';

export function useResizable(widget: WidgetState, onChange: (next: WidgetState) => void) {
  const startRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  return useCallback((event: React.PointerEvent<HTMLElement>) => {
    event.stopPropagation();
    if (widget.pinned) return;
    startRef.current = { x: event.clientX, y: event.clientY, width: widget.width, height: widget.height };
    const onMove = (moveEvent: PointerEvent) => {
      const width = clamp(startRef.current.width + moveEvent.clientX - startRef.current.x, 220, 420);
      const height = clamp(startRef.current.height + moveEvent.clientY - startRef.current.y, 180, 560);
      onChange({ ...widget, width, height });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  }, [onChange, widget]);
}
