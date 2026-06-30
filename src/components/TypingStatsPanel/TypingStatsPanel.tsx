import styles from './TypingStatsPanel.module.scss';

export interface TypingStatsPanelProps {
  todayTypedCount: number;
  recentCpm: number;
  recentWpm: number;
  todayMaxCpm: number;
}

export function TypingStatsPanel({ todayTypedCount, recentCpm, recentWpm, todayMaxCpm }: TypingStatsPanelProps) {
  return <div className={styles.panel} aria-label="打字統計">
    <div className={styles.row}><span className={styles.label}>今日輸入</span><span className={styles.value}>{todayTypedCount} 字</span></div>
    <div className={styles.row}><span className={styles.label}>目前速度</span><span className={styles.value}>{recentCpm} CPM / {recentWpm} WPM</span></div>
    <div className={styles.row}><span className={styles.label}>今日最高</span><span className={styles.value}>{todayMaxCpm} CPM</span></div>
  </div>;
}
