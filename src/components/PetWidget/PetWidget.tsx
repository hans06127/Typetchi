import { useCallback, useEffect, useState } from 'react';
import { createDefaultWidgetState } from '../../config/defaultState';
import { getNextStage, getStage } from '../../systems/evolutionSystem';
import { calculateStageProgress } from '../../systems/stageProgressSystem';
import { loadWidgetState, normalizeWidgetState, saveWidgetState } from '../../storage/widgetStorage';
import type { PetAnimationState, UserPetState } from '../../types/pet';
import type { WidgetState } from '../../types/widget';
import type { TypingSpeedState } from '../../types/typingStats';
import { ExpBar } from '../ExpBar/ExpBar';
import { ExpGainToast } from '../ExpGainToast/ExpGainToast';
import { PetCharacter } from '../PetCharacter/PetCharacter';
import { SpeechBubble } from '../SpeechBubble/SpeechBubble';
import { WidgetControls } from '../WidgetControls/WidgetControls';
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
  onResetPetProgress: () => void;
  onWidgetStateReady?: (handler: (nextState: WidgetState) => void) => void;
}

export function PetWidget({ petState, animationState, expToast, speechBubble, speedState, onResetPetProgress, onWidgetStateReady }: PetWidgetProps) {
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
  const updateWidget = useCallback((next: WidgetState) => { setWidget(next); scheduleWidgetFlush(next); }, [scheduleWidgetFlush]);
  const drag = useDraggable(widget, updateWidget);
  const resize = useResizable(widget, updateWidget);
  const toggleCollapse = useCallback(() => {
    const collapsed = !widget.collapsed;
    console.log(collapsed ? '[Typetchi] widget collapsed' : '[Typetchi] widget expanded');
    updateWidget({ ...widget, collapsed });
  }, [updateWidget, widget]);
  const stage = getStage(petState.currentStage);
  const nextStage = getNextStage(petState.totalExp);
  const stageProgress = calculateStageProgress(petState.totalExp);
  return <section className={`${styles.widget} ${widget.collapsed ? styles.collapsed : ''}`} style={{ left: widget.x, top: widget.y, width: widget.width, height: widget.height, '--typetchi-expanded-height': `${widget.height}px` } as Record<string, string | number>}>
    <button className={styles.collapsedHandle} type="button" title="展開 Typetchi" aria-label="展開 Typetchi" onClick={toggleCollapse}>
      <PetCharacter stage={petState.currentStage} animationState={animationState} compact />
    </button>
    <header className={styles.header} onPointerDown={drag}>
      <span className={styles.title}>Typetchi</span>
      <WidgetControls pinned={widget.pinned} collapsed={widget.collapsed} onTogglePin={() => updateWidget({ ...widget, pinned: !widget.pinned })} onToggleCollapse={toggleCollapse} onClose={() => updateWidget({ ...widget, collapsed: true, closed: false })} />
    </header>
    <div className={styles.body}>
      <SpeechBubble message={speechBubble.message} visible={speechBubble.visible} />
      <PetCharacter stage={petState.currentStage} animationState={animationState} />
      <div className={styles.stats}>
        <div className={styles.row}><strong>Lv. {petState.level}</strong><span>{stage.name}</span></div>
        <div className={styles.row}><span>EXP</span><span>{stageProgress.isMaxStage ? '最高階段' : `${stageProgress.current} / ${stageProgress.required}`}</span></div>
        <ExpBar value={stageProgress.current} max={stageProgress.required} percentage={stageProgress.percentage} />
        <TypingStatsPanel todayTypedCount={petState.todayTypedCount} recentCpm={speedState.recentCpm} recentWpm={speedState.recentWpm} todayMaxCpm={speedState.todayMaxCpm} />
        <div className={styles.row}><span className={styles.muted}>下一階段</span><span>{nextStage?.name ?? '已成熟'}</span></div>
      </div>
    </div>
    <SettingsPanel onResetPetProgress={onResetPetProgress} />
    <ExpGainToast amount={expToast.amount} visible={expToast.visible} />
    <span className={styles.resize} onPointerDown={resize} />
  </section>;
}
