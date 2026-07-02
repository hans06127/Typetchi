import type { PetAnimationState, PetStageId } from '../../types/pet';
import styles from './PetCharacter.module.scss';

export interface PetCharacterProps {
  stage: PetStageId;
  animationState: PetAnimationState;
  compact?: boolean;
}

export function PetCharacter({ stage, animationState, compact = false }: PetCharacterProps) {
  return <div className={`${styles.wrap} ${compact ? styles.compact : ''}`}>
    <div className={[styles.pet, styles[`pet--${stage}`], styles[`pet--${animationState}`]].join(' ')} aria-label="Typetchi 冰藍狐靈" role="img">
      <span className={styles.aura} />
      <span className={styles.tail} />
      {stage !== 'stage_1' && <span className={styles.tailExtra} />}
      {stage === 'stage_3' && <span className={styles.tailSpirit} />}
      <span className={styles.earLeft} />
      <span className={styles.earRight} />
      <div className={styles.petBody}>
        <span className={styles.chestGlow} />
      </div>
      <div className={styles.petFace}>
        <span className={styles.eye} />
        <span className={styles.muzzle} />
        <span className={styles.eye} />
      </div>
      <span className={styles.cheekLeft} />
      <span className={styles.cheekRight} />
      {stage === 'stage_3' && <><span className={styles.armLeft} /><span className={styles.armRight} /></>}
      <span className={styles.sparkleOne} />
      <span className={styles.sparkleTwo} />
    </div>
  </div>;
}
