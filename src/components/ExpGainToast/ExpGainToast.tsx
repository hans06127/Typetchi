import styles from './ExpGainToast.module.scss';

export interface ExpGainToastProps {
  amount: number;
  visible: boolean;
}

export function ExpGainToast({ amount, visible }: ExpGainToastProps) {
  return <span className={`${styles.toast} ${visible ? styles.visible : ''}`} aria-live="polite">+{amount} EXP</span>;
}
