import React, { useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { PetWidget } from '../components/PetWidget/PetWidget';
import { useExpGainToast } from '../hooks/useExpGainToast';
import { usePasteDetection } from '../hooks/usePasteDetection';
import { usePetAnimation } from '../hooks/usePetAnimation';
import { usePetProgress, type TypingProgressResult } from '../hooks/usePetProgress';
import { useSpeechBubble } from '../hooks/useSpeechBubble';
import { useTypingStats } from '../hooks/useTypingStats';
import { useTypingTracker, type ValidTypingInput } from '../hooks/useTypingTracker';
import { hasTypetchiRoot, injectTypetchiRoot, ROOT_ID } from './injectRoot';

let isMounting = false;
let ensureRootTimer: number | undefined;
let rootRemovalObserver: MutationObserver | undefined;

function App() {
  const animation = usePetAnimation();
  const expToast = useExpGainToast();
  const speechBubble = useSpeechBubble();
  const pasteDetection = usePasteDetection(() => speechBubble.showMessage('paste'));
  const handleTypingProgress = useCallback((result: TypingProgressResult) => {
    animation.playAnimation(result.animationState);
    expToast.showExpGain(result.gainedExp);
    if (result.evolved) speechBubble.showMessage('evolve', true);
    else if (result.leveledUp) speechBubble.showMessage('levelUp', true);
    else speechBubble.showMessage('typing');
  }, [animation, expToast, speechBubble]);
  const { petState, addTypingExp, updateTodayTypingSpeedMax, resetProgress } = usePetProgress(handleTypingProgress);
  const { speedState, recordTyping, resetTypingStats } = useTypingStats({
    todayMaxCpm: petState.todayMaxCpm,
    todayMaxWpm: petState.todayMaxWpm,
    onTodayMaxChange: updateTodayTypingSpeedMax,
  });
  const handleValidTyping = useCallback((input: ValidTypingInput) => {
    addTypingExp(input.addedChars);
    recordTyping(input.addedChars, input.timestamp);
  }, [addTypingExp, recordTyping]);
  useTypingTracker(handleValidTyping, pasteDetection.showPasteHint);
  const handleResetPetProgress = useCallback(async () => {
    const confirmed = window.confirm('確定要重置角色進度嗎？EXP、等級與今日統計會歸零。');
    if (!confirmed) return;
    await resetProgress();
    resetTypingStats();
    speechBubble.showMessage('resetProgress', true);
  }, [resetProgress, resetTypingStats, speechBubble]);

  return <PetWidget petState={petState} animationState={animation.animationState} expToast={expToast} speechBubble={speechBubble} speedState={speedState} onResetPetProgress={handleResetPetProgress} />;
}

function ensureTypetchiRoot() {
  if (isMounting) return;

  if (hasTypetchiRoot()) {
    return;
  }

  isMounting = true;

  try {
    const rootElement = injectTypetchiRoot();
    if (rootElement) {
      createRoot(rootElement).render(<React.StrictMode><App /></React.StrictMode>);
      console.log('[Typetchi] React app mounted');
      console.log('[Typetchi] root ensured');
    }
  } catch (error) {
    console.error('[Typetchi] failed to ensure root', error);
  } finally {
    isMounting = false;
  }
}

function scheduleEnsureRoot() {
  if (ensureRootTimer) {
    window.clearTimeout(ensureRootTimer);
  }

  ensureRootTimer = window.setTimeout(() => {
    ensureTypetchiRoot();
  }, 300);
}

function observeRootRemoval() {
  if (rootRemovalObserver) return rootRemovalObserver;

  const target = document.documentElement;

  const observer = new MutationObserver(() => {
    if (!document.getElementById(ROOT_ID)) {
      console.warn('[Typetchi] root removed, reinjecting');
      scheduleEnsureRoot();
    }
  });

  observer.observe(target, {
    childList: true,
    subtree: true,
  });

  console.log('[Typetchi] root removal observer started');
  rootRemovalObserver = observer;

  return observer;
}

function startTypetchi() {
  console.log('[Typetchi] content script loaded');

  ensureTypetchiRoot();
  observeRootRemoval();

  window.setTimeout(() => {
    console.log('[Typetchi] delayed ensure root 1000ms');
    ensureTypetchiRoot();
  }, 1000);

  window.setTimeout(() => {
    console.log('[Typetchi] delayed ensure root 3000ms');
    ensureTypetchiRoot();
  }, 3000);

  window.setTimeout(() => {
    console.log('[Typetchi] delayed ensure root 5000ms');
    ensureTypetchiRoot();
  }, 5000);

  window.addEventListener(
    'load',
    () => {
      console.log('[Typetchi] window loaded, ensure root');
      ensureTypetchiRoot();
    },
    { once: true }
  );
}

if (document.body) {
  startTypetchi();
} else {
  window.addEventListener('DOMContentLoaded', startTypetchi, { once: true });
}
