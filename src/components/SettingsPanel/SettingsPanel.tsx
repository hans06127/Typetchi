import styles from './SettingsPanel.module.scss';

interface SettingsPanelProps {
  onResetPetProgress: () => void;
}

export function SettingsPanel({ onResetPetProgress }: SettingsPanelProps) {
  return <footer className={styles.panel} aria-label="設定與進階操作">
    <details className={styles.details}>
      <summary className={styles.summary}>Advanced</summary>
      <button className={`${styles.button} ${styles.subtleDanger}`} type="button" onClick={onResetPetProgress}>重置角色進度</button>
    </details>
  </footer>;
}
