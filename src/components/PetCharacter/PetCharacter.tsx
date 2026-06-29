import type { EvolutionStage } from '../../types/pet';
import styles from './PetCharacter.module.scss';
const icons = { stage_1: '🌱', stage_2: '🌿', stage_3: '🌸' };
export function PetCharacter({ stage }: { stage: EvolutionStage }) {
  return <div className={styles.stage}><div><div className={`${styles.pet} ${styles[stage.id]}`}>{icons[stage.id]}</div><div className={styles.name}>{stage.name}</div></div></div>;
}
