import { useCallback, useEffect, useState } from 'react';
import { defaultWidgetState } from '../../config/defaultState';
import { getNextStage, getStage } from '../../systems/evolutionSystem';
import { loadWidgetState, saveWidgetState } from '../../storage/widgetStorage';
import type { UserPetState } from '../../types/pet';
import type { WidgetState } from '../../types/widget';
import { ExpBar } from '../ExpBar/ExpBar';
import { PetCharacter } from '../PetCharacter/PetCharacter';
import { WidgetControls } from '../WidgetControls/WidgetControls';
import { useDraggable } from '../../hooks/useDraggable';
import { useResizable } from '../../hooks/useResizable';
import { useDebouncedStorageFlush } from '../../hooks/useDebouncedStorageFlush';
import styles from './PetWidget.module.scss';

export function PetWidget({ petState }: { petState: UserPetState }) {
  const [widget, setWidget] = useState<WidgetState>(defaultWidgetState());
  const { scheduleFlush: scheduleWidgetFlush } = useDebouncedStorageFlush<WidgetState>(saveWidgetState, 1000);
  useEffect(() => { void loadWidgetState().then((state) => { console.log('[Typetchi] storage loaded'); setWidget(state); }); }, []);
  const updateWidget = useCallback((next: WidgetState) => { setWidget(next); scheduleWidgetFlush(next); }, [scheduleWidgetFlush]);
  const drag = useDraggable(widget, updateWidget);
  const resize = useResizable(widget, updateWidget);
  const stage = getStage(petState.currentStage);
  const nextStage = getNextStage(petState.totalExp);
  const expBase = stage.requiredExp;
  const expTarget = nextStage?.requiredExp ?? petState.totalExp;
  if (widget.closed) return null;
  return <section className={`${styles.widget} ${widget.collapsed ? styles.collapsed : ''}`} style={{ left: widget.x, top: widget.y, width: widget.width, height: widget.collapsed ? undefined : widget.height }}>
    <header className={styles.header} onPointerDown={drag}>
      <span className={styles.title}>Typetchi</span>
      <WidgetControls pinned={widget.pinned} collapsed={widget.collapsed} onTogglePin={() => updateWidget({ ...widget, pinned: !widget.pinned })} onToggleCollapse={() => updateWidget({ ...widget, collapsed: !widget.collapsed })} onReset={() => updateWidget(defaultWidgetState())} onClose={() => updateWidget({ ...widget, closed: true })} />
    </header>
    <div className={styles.body}>
      <PetCharacter stage={stage} />
      <div className={styles.stats}>
        <div className={styles.row}><strong>Lv. {petState.level}</strong><span>{stage.name}</span></div>
        <div className={styles.row}><span>EXP</span><span>{nextStage ? `${petState.totalExp} / ${nextStage.requiredExp}` : `${petState.totalExp} / MAX`}</span></div>
        <ExpBar value={petState.totalExp - expBase} max={Math.max(1, expTarget - expBase)} />
        <div className={styles.row}><span className={styles.muted}>今日輸入</span><span>{petState.todayTypedCount} 字</span></div>
        <div className={styles.row}><span className={styles.muted}>下一階段</span><span>{nextStage?.name ?? '已成熟'}</span></div>
      </div>
    </div>
    <span className={styles.resize} onPointerDown={resize} />
  </section>;
}
