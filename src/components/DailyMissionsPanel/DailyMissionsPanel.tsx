import type { DailyMissionsState } from '../../types/dailyMission';
import styles from './DailyMissionsPanel.module.scss';

export function DailyMissionsPanel({ missionsState }: { missionsState: DailyMissionsState | null }) {
  const missions = missionsState?.missions ?? [];
  return <section className={styles.panel} aria-label="今日任務">
    <div className={styles.heading}>今日任務</div>
    {missions.length === 0 ? <div className={styles.empty}>任務準備中…</div> : missions.map((mission) => (
      <div key={mission.id} className={`${styles.mission} ${mission.completed ? styles.completed : ''}`}>
        <div className={styles.titleRow}>
          <span className={styles.title}>{mission.completed ? '✓ ' : ''}{mission.title}</span>
          <span className={styles.reward}>+{mission.rewardExp} EXP</span>
        </div>
        <div className={styles.progressRow}>
          <span>{mission.completed ? '已完成' : `${mission.progress} / ${mission.targetValue}`}</span>
          <span>{mission.rewardClaimed ? '已領取' : '未完成'}</span>
        </div>
        <div className={styles.track}><span style={{ width: `${Math.min(100, Math.round((mission.progress / mission.targetValue) * 100))}%` }} /></div>
      </div>
    ))}
  </section>;
}
