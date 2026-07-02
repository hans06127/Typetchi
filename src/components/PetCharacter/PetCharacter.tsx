import type { PetAnimationState, PetStageId } from '../../types/pet';
import styles from './PetCharacter.module.scss';

export interface PetCharacterProps {
  stage: PetStageId;
  animationState: PetAnimationState;
  compact?: boolean;
}

function Flame() {
  return <g className={styles.flame}>
    <path d="M14 34c-8-5-9-15-2-23 1 7 6 8 6 15 5-5 3-13 0-18 12 7 16 20 8 28-4 4-8 5-12-2Z" fill="url(#flameFill)" />
    <path d="M16 34c-4-3-4-8 0-13 1 4 5 5 4 11 3-2 3-6 2-9 7 6 5 14-2 15-2 0-3-1-4-4Z" fill="#effdff" opacity=".92" />
  </g>;
}

function Stage1Svg() {
  return <svg className={styles.stageSvg} viewBox="0 0 160 150" aria-hidden="true">
    <defs>
      <linearGradient id="furStage1" x1="28" x2="130" y1="24" y2="130" gradientUnits="userSpaceOnUse"><stop stopColor="#fff" /><stop offset=".58" stopColor="#f7fdff" /><stop offset="1" stopColor="#b7eaff" /></linearGradient>
      <linearGradient id="tailStage1" x1="92" x2="143" y1="79" y2="122" gradientUnits="userSpaceOnUse"><stop stopColor="#fafdff" /><stop offset=".64" stopColor="#bfeeff" /><stop offset="1" stopColor="#41c8ff" /></linearGradient>
      <linearGradient id="eyeBlue" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#173268" /><stop offset=".5" stopColor="#2497f2" /><stop offset="1" stopColor="#87efff" /></linearGradient>
      <linearGradient id="flameFill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#74f7ff" /><stop offset=".48" stopColor="#00b8ff" /><stop offset="1" stopColor="#075ee7" /></linearGradient>
    </defs>
    <ellipse cx="76" cy="133" rx="48" ry="8" fill="#c8d5e8" opacity=".24" />
    <g transform="translate(114 38)"><Flame /></g>
    <path className={styles.tailMark} d="M94 91c20-36 53-16 43 19-5 17-21 23-40 17 18-4 24-14 21-24-5 5-12 8-21 8 13-8 18-16 16-24-5 4-11 6-19 4Z" fill="url(#tailStage1)" stroke="#2b5b91" strokeWidth="2" />
    <path d="M37 62 31 25l27 24Zm53-13 28-24-5 39Z" fill="url(#furStage1)" stroke="#183a70" strokeWidth="3" strokeLinejoin="round" />
    <path d="M41 56 36 36l16 15Zm53-4 17-15-5 21Z" fill="#ffd8df" opacity=".7" />
    <path d="M30 72c-7 38 12 59 48 59 30 0 45-20 40-54-4-24-22-38-46-38-23 0-38 12-42 33Z" fill="url(#furStage1)" stroke="#315580" strokeWidth="2.4" />
    <path d="M65 35c7 10 12 10 18 0 0 17-5 22-9 28-6-8-9-13-9-28Z" fill="#65cfff" opacity=".9" />
    <path d="M67 50c4 5 8 5 13 0" fill="none" stroke="#65cfff" strokeWidth="3" strokeLinecap="round" />
    <ellipse cx="55" cy="79" rx="9" ry="12" fill="url(#eyeBlue)" /><ellipse cx="95" cy="79" rx="9" ry="12" fill="url(#eyeBlue)" />
    <circle cx="52" cy="74" r="3" fill="#fff" /><circle cx="92" cy="74" r="3" fill="#fff" />
    <path d="M73 88c2 2 4 2 6 0M68 93c5 5 12 5 17 0" fill="none" stroke="#3d4262" strokeWidth="2" strokeLinecap="round" />
    <path d="M37 117c-2 11 6 15 16 11M93 128c11 4 20-1 18-12" fill="none" stroke="#315580" strokeWidth="3" strokeLinecap="round" />
    <path d="M47 97c10 6 21 8 33 5" fill="none" stroke="#9de9ff" strokeWidth="5" strokeLinecap="round" opacity=".7" />
    <circle cx="98" cy="109" r="4" fill="#8be3ff" opacity=".75" /><circle cx="106" cy="117" r="3" fill="#8be3ff" opacity=".6" />
  </svg>;
}

function Stage2Svg() {
  return <svg className={styles.stageSvg} viewBox="0 0 210 150" aria-hidden="true">
    <defs>
      <linearGradient id="furStage2" x1="54" x2="150" y1="20" y2="135" gradientUnits="userSpaceOnUse"><stop stopColor="#fff" /><stop offset=".56" stopColor="#f4fcff" /><stop offset="1" stopColor="#a9e6ff" /></linearGradient>
      <linearGradient id="tailStage2" x1="124" x2="205" y1="32" y2="122" gradientUnits="userSpaceOnUse"><stop stopColor="#fdfdff" /><stop offset=".48" stopColor="#dff6ff" /><stop offset="1" stopColor="#3ec4fa" /></linearGradient>
      <linearGradient id="eyeBlue" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#173268" /><stop offset=".5" stopColor="#2497f2" /><stop offset="1" stopColor="#87efff" /></linearGradient>
      <linearGradient id="flameFill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#74f7ff" /><stop offset=".48" stopColor="#00b8ff" /><stop offset="1" stopColor="#075ee7" /></linearGradient>
    </defs>
    <ellipse cx="103" cy="135" rx="72" ry="8" fill="#c8d5e8" opacity=".22" />
    <g transform="translate(16 52)"><Flame /></g>
    <path d="M120 77c13-48 69-72 76-18 5 40-34 69-75 59 27-6 43-17 50-36-17 10-34 14-52 10 27-13 39-29 42-48-15 13-27 23-41 33Z" fill="url(#tailStage2)" stroke="#285a91" strokeWidth="2.2" />
    <path d="M54 57 50 15l31 30Zm50-14 31-30-5 46Z" fill="url(#furStage2)" stroke="#173a70" strokeWidth="3" strokeLinejoin="round" />
    <path d="M60 51 56 28l17 18Zm50-6 18-17-4 23Z" fill="#ffd6df" opacity=".65" />
    <path d="M51 61c22-30 65-24 77 9 10 28-8 58-45 61-37 3-58-18-49-45 3-11 8-18 17-25Z" fill="url(#furStage2)" stroke="#315580" strokeWidth="2.3" />
    <path d="M86 74c33-8 54 10 62 38 7 25 0 31-22 22-16 9-44 8-67 0-18 7-25 0-18-20 7-21 18-34 45-40Z" fill="url(#furStage2)" stroke="#315580" strokeWidth="2.3" />
    <path d="M75 28c8 11 17 11 25 0-1 18-7 25-13 33-7-8-12-15-12-33Z" fill="#5fd2ff" opacity=".88" />
    <path d="M78 45c6 6 13 6 19 0" fill="none" stroke="#5fd2ff" strokeWidth="3" strokeLinecap="round" />
    <path d="M67 75c7 5 15 5 22 0" fill="none" stroke="#183a70" strokeWidth="3" strokeLinecap="round" />
    <ellipse cx="99" cy="73" rx="7" ry="10" fill="url(#eyeBlue)" transform="rotate(12 99 73)" />
    <path d="M88 84c3 2 7 2 10-1" fill="none" stroke="#34395c" strokeWidth="2" strokeLinecap="round" />
    <path d="M64 113c-3 14 8 20 22 14M124 130c14 4 26-5 22-21" fill="none" stroke="#315580" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M110 92c12 6 23 8 35 5M128 111c14 2 26-1 38-8" fill="none" stroke="#8ce7ff" strokeWidth="4" opacity=".75" strokeLinecap="round" />
    <path d="M62 93c-10 4-17 12-21 23" fill="none" stroke="#c9f3ff" strokeWidth="8" strokeLinecap="round" />
    <circle cx="110" cy="104" r="4" fill="#8be3ff" opacity=".7" /><circle cx="118" cy="112" r="3" fill="#8be3ff" opacity=".55" />
  </svg>;
}

function Stage3Svg() {
  return <svg className={styles.stageSvg} viewBox="0 0 220 170" aria-hidden="true">
    <defs>
      <linearGradient id="spiritTail" x1="116" x2="214" y1="18" y2="146" gradientUnits="userSpaceOnUse"><stop stopColor="#fbf7ff" /><stop offset=".46" stopColor="#cfefff" /><stop offset="1" stopColor="#2fc2f6" /></linearGradient>
      <linearGradient id="robe" x1="83" x2="132" y1="65" y2="156" gradientUnits="userSpaceOnUse"><stop stopColor="#fff" /><stop offset=".58" stopColor="#eaf8ff" /><stop offset="1" stopColor="#52c8f2" /></linearGradient>
      <linearGradient id="hair" x1="78" x2="138" y1="25" y2="145" gradientUnits="userSpaceOnUse"><stop stopColor="#ebfdff" /><stop offset=".45" stopColor="#62cde8" /><stop offset="1" stopColor="#098fca" /></linearGradient>
      <linearGradient id="flameFill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#74f7ff" /><stop offset=".48" stopColor="#00b8ff" /><stop offset="1" stopColor="#075ee7" /></linearGradient>
    </defs>
    <ellipse cx="116" cy="159" rx="72" ry="8" fill="#c8d5e8" opacity=".2" />
    <path className={styles.spiritRibbon} d="M38 105c-31 2-25-47 10-34 28 11 8 50-26 66 37-4 67-20 83-48" fill="none" stroke="#d9c5ff" strokeWidth="10" strokeLinecap="round" opacity=".28" />
    <path className={styles.spiritRibbon} d="M132 65c35-48 91-6 55 44-19 26-51 30-82 20 35 20 67 19 95-2" fill="none" stroke="#b7eaff" strokeWidth="11" strokeLinecap="round" opacity=".34" />
    <path d="M133 81c25-62 78-72 80-18 2 48-42 76-88 65 34-10 50-24 56-45-16 9-33 12-52 7 22-10 39-27 48-50-16 13-29 27-44 41Z" fill="url(#spiritTail)" stroke="#5ca4d4" strokeWidth="1.8" opacity=".82" />
    <path d="M80 60 74 24l24 24Zm31-12 24-26-3 38Z" fill="#f7fdff" stroke="#214574" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M80 61c-3 29 8 59 27 91 20-34 27-65 19-92-14-11-31-12-46 1Z" fill="url(#robe)" stroke="#315580" strokeWidth="2" />
    <path d="M92 27c-25 27-22 74-9 118 24-9 42-47 35-89-3-16-12-25-26-29Z" fill="url(#hair)" opacity=".9" />
    <path d="M73 94c-19 16-27 33-35 58 19-10 34-20 51-38Zm58-4c19 16 27 35 34 61-19-10-34-23-48-40Z" fill="url(#robe)" opacity=".92" stroke="#4aa7d2" strokeWidth="1.4" />
    <ellipse cx="101" cy="54" rx="18" ry="20" fill="#fff6f2" stroke="#315580" strokeWidth="1.6" />
    <path d="M85 43c7-21 32-18 40 2-13-7-26-6-40-2Z" fill="url(#hair)" />
    <path d="M76 74c-11 11-19 20-26 31" stroke="#fff6f2" strokeWidth="8" strokeLinecap="round" />
    <path d="M58 94c-8-5-8-17 4-22" stroke="#fff6f2" strokeWidth="7" strokeLinecap="round" />
    <g transform="translate(40 52)"><Flame /></g>
    <path d="M95 57c3 3 7 3 10 0M110 56c4 2 8 2 11-1" fill="none" stroke="#173a70" strokeWidth="2" strokeLinecap="round" />
    <path d="M101 66c4 3 9 3 13 0" fill="none" stroke="#7d5260" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M98 45c7 8 14 8 20 0" fill="none" stroke="#48d1ff" strokeWidth="3" strokeLinecap="round" />
    <path d="M91 94c12 8 27 8 39 0" fill="none" stroke="#48d1ff" strokeWidth="4" strokeLinecap="round" opacity=".75" />
    <path d="M96 151c-3 11 13 11 11 0M119 151c-3 11 13 11 10 0" fill="none" stroke="#315580" strokeWidth="3" strokeLinecap="round" />
    <path d="M153 67c11-30 42-27 49-1-17-10-32-9-49 1Z" fill="#f8fdff" stroke="#5ca4d4" strokeWidth="1.6" opacity=".88" />
    <path d="M165 56c9 8 17 8 25 0" fill="none" stroke="#4bd6ff" strokeWidth="3" strokeLinecap="round" opacity=".75" />
  </svg>;
}

const stageRenderers: Record<PetStageId, () => unknown> = {
  stage_1: Stage1Svg,
  stage_2: Stage2Svg,
  stage_3: Stage3Svg,
};

export function PetCharacter({ stage, animationState, compact = false }: PetCharacterProps) {
  const StageArt = stageRenderers[stage];

  return <div className={`${styles.wrap} ${compact ? styles.compact : ''}`}>
    <div className={[styles.pet, styles[`pet--${stage}`], styles[`pet--${animationState}`]].join(' ')} aria-label="Typetchi 冰藍狐靈" role="img">
      <StageArt />
    </div>
  </div>;
}
