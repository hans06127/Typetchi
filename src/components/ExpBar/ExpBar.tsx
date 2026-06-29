import styles from './ExpBar.module.scss';
export function ExpBar({ value, max }: { value: number; max: number }) {
  const percentage = max <= 0 ? 100 : Math.min(100, Math.round((value / max) * 100));
  return <div className={styles.bar} aria-label={`EXP ${value} / ${max}`}><div className={styles.fill} style={{ width: `${percentage}%` }} /></div>;
}
