import styles from './SettingsPanel.module.scss';

interface SettingsPanelProps {
  onResetWidgetPosition: () => void;
  onResetPetProgress: () => void;
}

export function SettingsPanel({ onResetWidgetPosition, onResetPetProgress }: SettingsPanelProps) {
  return <footer className={styles.panel} aria-label="設定與操作">
    <button className={styles.button} type="button" onClick={onResetWidgetPosition}>重置視窗位置</button>
    <button className={`${styles.button} ${styles.danger}`} type="button" onClick={onResetPetProgress}>重置角色進度</button>
  </footer>;
}
