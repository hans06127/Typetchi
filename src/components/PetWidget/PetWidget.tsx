import { useCallback, useEffect, useRef, useState } from 'react';
import { createDefaultWidgetState } from '../../config/defaultState';
import { getNextStage, getStage } from '../../systems/evolutionSystem';
import { calculateStageProgress } from '../../systems/stageProgressSystem';
import { loadWidgetState, normalizeWidgetState, saveWidgetState } from '../../storage/widgetStorage';
import type { DailyMissionsState } from '../../types/dailyMission';
import type { PetAnimationState, UserPetState } from '../../types/pet';
import type { WidgetState } from '../../types/widget';
import type { TypingSpeedState } from '../../types/typingStats';
import { ExpBar } from '../ExpBar/ExpBar';
import { ExpGainToast } from '../ExpGainToast/ExpGainToast';
import { PetCharacter } from '../PetCharacter/PetCharacter';
import { SpeechBubble } from '../SpeechBubble/SpeechBubble';
import { WidgetControls } from '../WidgetControls/WidgetControls';
import { DailyMissionsPanel } from '../DailyMissionsPanel/DailyMissionsPanel';
import { TypingStatsPanel } from '../TypingStatsPanel/TypingStatsPanel';
import { SettingsPanel } from '../SettingsPanel/SettingsPanel';
import { useDraggable } from '../../hooks/useDraggable';
import { useResizable } from '../../hooks/useResizable';
import { useDebouncedStorageFlush } from '../../hooks/useDebouncedStorageFlush';
import styles from './PetWidget.module.scss';

interface PetWidgetProps {
  petState: UserPetState;
  animationState: PetAnimationState;
  expToast: { amount: number; visible: boolean };
  speechBubble: { message: string | null; visible: boolean; showMessage: (kind: 'typing' | 'levelUp' | 'evolve' | 'paste' | 'resetWidget' | 'resetProgress', force?: boolean) => void };
  speedState: TypingSpeedState;
  missionsState: DailyMissionsState | null;
  onResetPetProgress: () => void;
  onWidgetStateReady?: (handler: (nextState: WidgetState) => void) => void;
}

export function PetWidget({ petState, animationState, expToast, speechBubble, speedState, missionsState, onResetPetProgress, onWidgetStateReady }: PetWidgetProps) {
  const [widget, setWidget] = useState<WidgetState>(createDefaultWidgetState);
  const { scheduleFlush: scheduleWidgetFlush } = useDebouncedStorageFlush<WidgetState>(saveWidgetState, 1000);
  useEffect(() => { void loadWidgetState().then((state) => { console.log('[Typetchi] storage loaded'); setWidget(state); }); }, []);
  const applyRemoteWidgetState = useCallback((next: WidgetState) => {
    setWidget((current) => {
      const normalizedNext = normalizeWidgetState(next);
      return (normalizedNext.updatedAt ?? 0) >= (current.updatedAt ?? 0) ? normalizedNext : current;
    });
  }, []);
  useEffect(() => { onWidgetStateReady?.(applyRemoteWidgetState); }, [applyRemoteWidgetState, onWidgetStateReady]);
  const updateWidget = useCallback((next: WidgetState) => {
    const normalizedNext = normalizeWidgetState(next);
    setWidget(normalizedNext);
    scheduleWidgetFlush(normalizedNext);
  }, [scheduleWidgetFlush]);
  const closeWidget = useCallback(() => {
    console.log('[Typetchi] widget closed');
    updateWidget({ ...widget, collapsed: false, closed: true });
  }, [updateWidget, widget]);
  const handleDragState = useRef({ moved: false, startX: 0, startY: 0 });
  const drag = useDraggable(widget, updateWidget);
  const resize = useResizable(widget, updateWidget);
  const toggleCollapse = useCallback(() => {
    const collapsed = !widget.collapsed;
    console.log(collapsed ? '[Typetchi] widget collapsed' : '[Typetchi] widget expanded');
    updateWidget({ ...widget, collapsed, closed: false });
  }, [updateWidget, widget]);
  const handleCollapsedPointerDown = useCallback((event: React.PointerEvent<HTMLElement>) => {
    handleDragState.current = { moved: false, startX: event.clientX, startY: event.clientY };
    const onMove = (moveEvent: PointerEvent) => {
      if (Math.abs(moveEvent.clientX - handleDragState.current.startX) > 4 || Math.abs(moveEvent.clientY - handleDragState.current.startY) > 4) {
        handleDragState.current.moved = true;
      }
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
    drag(event);
  }, [drag]);
  const handleCollapsedClick = useCallback((event: globalThis.MouseEvent) => {
    if (handleDragState.current.moved) {
      event.preventDefault();
      event.stopPropagation();
      handleDragState.current.moved = false;
      return;
    }
    toggleCollapse();
  }, [toggleCollapse]);
  const stage = getStage(petState.currentStage);
  const nextStage = getNextStage(petState.totalExp);
  const stageProgress = calculateStageProgress(petState.totalExp);
  if (widget.closed) return null;
  return <section className={`${styles.widget} ${widget.collapsed ? styles.collapsed : ''}`} style={{ left: widget.x, top: widget.y, width: widget.width, height: widget.height, '--typetchi-expanded-height': `${widget.height}px` } as Record<string, string | number>}>
    <button className={styles.collapsedHandle} type="button" title="展開 Typetchi" aria-label="展開 Typetchi" onPointerDown={handleCollapsedPointerDown} onClick={handleCollapsedClick}>
      <PetCharacter stage={petState.currentStage} animationState={animationState} compact />
    </button>
    <header className={styles.header} onPointerDown={drag}>
      <span className={styles.title}>Typetchi</span>
      <WidgetControls pinned={widget.pinned} collapsed={widget.collapsed} onTogglePin={() => updateWidget({ ...widget, pinned: !widget.pinned })} onToggleCollapse={toggleCollapse} onClose={closeWidget} />
    </header>
    <div className={styles.body}>
      <SpeechBubble message={speechBubble.message} visible={speechBubble.visible} />
      <div className={styles.hero}>
        <PetCharacter stage={petState.currentStage} animationState={animationState} />
      </div>
      <section className={styles.progressCard} aria-label="等級與 EXP">
        <div className={styles.levelRow}>
          <strong className={styles.levelText}>Lv. {petState.level}</strong>
          <span className={styles.stageText}>{stage.name}</span>
        </div>
        <div className={styles.expRow}>
          <span className={styles.label}>EXP</span>
          <span className={styles.value}>{stageProgress.isMaxStage ? '最高階段' : `${stageProgress.current} / ${stageProgress.required}`}</span>
        </div>
        <ExpBar value={stageProgress.current} max={stageProgress.required} percentage={stageProgress.percentage} />
        <div className={styles.nextHint}>下一階段：{nextStage?.name ?? '已成熟'}</div>
      </section>
      <div className={styles.sections}>
        <DailyMissionsPanel missionsState={missionsState} />
        <TypingStatsPanel todayTypedCount={petState.todayTypedCount} recentCpm={speedState.recentCpm} recentWpm={speedState.recentWpm} todayMaxCpm={speedState.todayMaxCpm} />
      </div>
    </div>
    <SettingsPanel onResetPetProgress={onResetPetProgress} />
    <ExpGainToast amount={expToast.amount} visible={expToast.visible} />
    <span className={styles.resize} onPointerDown={resize} />
  </section>;
}
