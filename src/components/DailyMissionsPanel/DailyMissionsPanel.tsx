import type { DailyMissionsState } from '../../types/dailyMission';
import styles from './DailyMissionsPanel.module.scss';

export function DailyMissionsPanel({ missionsState }: { missionsState: DailyMissionsState | null }) {
  const missions = missionsState?.missions ?? [];
  const completedCount = missions.filter((mission) => mission.completed).length;
  return <section className={styles.panel} aria-label="今日任務">
    <div className={styles.header}>
      <div className={styles.heading}>今日任務</div>
      <div className={styles.summary}>{completedCount} / {missions.length}</div>
    </div>
    {missions.length > 0 && completedCount === missions.length ? <div className={styles.completeNote}>今日任務全部完成，辛苦了！</div> : null}
    {missions.length === 0 ? <div className={styles.empty}>任務準備中…</div> : missions.map((mission) => {
      const progressPercent = Math.min(100, Math.round((mission.progress / mission.targetValue) * 100));
      return <div key={mission.id} className={`${styles.mission} ${mission.completed ? styles.completed : ''}`}>
        <div className={styles.titleRow}>
          <span className={styles.titleWrap}>
            <span className={styles.check} aria-label={mission.completed ? '已完成' : '進行中'}>{mission.completed ? '✓' : '•'}</span>
            <span className={styles.title}>{mission.title}</span>
          </span>
          <span className={styles.reward}>+{mission.rewardExp} EXP</span>
        </div>
        <div className={styles.progressRow}>
          <span>{mission.completed ? '已完成' : `${mission.progress} / ${mission.targetValue}`}</span>
          <span>{mission.rewardClaimed ? '獎勵已領取' : `${progressPercent}%`}</span>
        </div>
        <div className={styles.track} aria-hidden="true"><span style={{ width: `${progressPercent}%` }} /></div>
      </div>;
    })}
  </section>;
}
