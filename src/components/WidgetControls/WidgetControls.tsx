import styles from './WidgetControls.module.scss';
interface Props { pinned: boolean; collapsed: boolean; onTogglePin: () => void; onToggleCollapse: () => void; onClose: () => void; }
export function WidgetControls({ pinned, collapsed, onTogglePin, onToggleCollapse, onClose }: Props) {
  return <div className={styles.controls} aria-label="Widget 操作">
    <button className={styles.button} type="button" title={pinned ? '解除固定 Typetchi' : '固定 Typetchi'} aria-label={pinned ? '解除固定 Typetchi' : '固定 Typetchi'} onClick={onTogglePin}>{pinned ? '解除固定' : '固定'}</button>
    <button className={styles.button} type="button" title={collapsed ? '展開 Typetchi' : '收合 Typetchi'} aria-label={collapsed ? '展開 Typetchi' : '收合 Typetchi'} onClick={onToggleCollapse}>{collapsed ? '展開' : '收合'}</button>
    <button className={styles.button} type="button" title="關閉 Typetchi（可從 popup 重新顯示）" aria-label="關閉 Typetchi" onClick={onClose}>關閉</button>
  </div>;
}
