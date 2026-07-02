import styles from './SettingsPanel.module.scss';

interface SettingsPanelProps {
  onResetPetProgress: () => void;
  devToolsEnabled?: boolean;
  onDevAddExp?: (amount: number) => void;
  onDisableDevTools?: () => void;
}

export function SettingsPanel({ onResetPetProgress, devToolsEnabled = false, onDevAddExp, onDisableDevTools }: SettingsPanelProps) {
  return <footer className={styles.panel} aria-label="設定與進階操作">
    <div className={styles.sectionLabel}>Advanced</div>
    <button className={`${styles.button} ${styles.subtleDanger}`} type="button" onClick={onResetPetProgress}>重置角色進度</button>
    {devToolsEnabled && <div className={styles.devTools} aria-label="Dev only 測試工具">
      <div className={styles.sectionLabel}>Dev only</div>
      <div className={styles.devButtons}>
        <button className={styles.button} type="button" onClick={() => onDevAddExp?.(100)}>+100 EXP</button>
        <button className={styles.button} type="button" onClick={() => onDevAddExp?.(500)}>Stage 2</button>
        <button className={styles.button} type="button" onClick={() => onDevAddExp?.(2000)}>Stage 3</button>
        <button className={`${styles.button} ${styles.subtleDanger}`} type="button" onClick={onDisableDevTools}>關閉 Dev</button>
      </div>
    </div>}
  </footer>;
}
