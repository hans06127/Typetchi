import type { PetAnimationState, PetStageId } from '../../types/pet';
import styles from './PetCharacter.module.scss';

export interface PetCharacterProps {
  stage: PetStageId;
  animationState: PetAnimationState;
  compact?: boolean;
}

export function PetCharacter({ stage, animationState, compact = false }: PetCharacterProps) {
  return <div className={`${styles.wrap} ${compact ? styles.compact : ''}`}>
    <div className={[styles.pet, styles[`pet--${stage}`], styles[`pet--${animationState}`]].join(' ')} aria-label="Typetchi character" role="img">
      <div className={styles.petBody} />
      <div className={styles.petFace}><span className={styles.eye} /><span className={styles.eye} /></div>
      {stage !== 'stage_1' && <><span className={styles.earLeft} /><span className={styles.earRight} /></>}
      {stage === 'stage_3' && <><span className={styles.armLeft} /><span className={styles.armRight} /></>}
    </div>
  </div>;
}
