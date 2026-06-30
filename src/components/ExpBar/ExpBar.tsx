import styles from './ExpBar.module.scss';
export function ExpBar({ value, max, percentage }: { value: number; max: number; percentage?: number }) {
  const progress = percentage ?? (max <= 0 ? 100 : Math.min(100, Math.round((value / max) * 100)));
  return <div className={styles.bar} aria-label={`EXP ${value} / ${max}`}><div className={styles.fill} style={{ width: `${progress}%` }} /></div>;
}
