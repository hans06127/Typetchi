import styles from './WidgetControls.module.scss';
interface Props { pinned: boolean; collapsed: boolean; onTogglePin: () => void; onToggleCollapse: () => void; onClose: () => void; }
export function WidgetControls({ pinned, collapsed, onTogglePin, onToggleCollapse, onClose }: Props) {
  return <div className={styles.controls}>
    <button className={styles.button} type="button" onClick={onTogglePin}>{pinned ? '解除固定' : '固定'}</button>
    <button className={styles.button} type="button" onClick={onToggleCollapse}>{collapsed ? '展開' : '收合'}</button>
    <button className={styles.button} type="button" title="收合小視窗" onClick={onClose}>收合</button>
  </div>;
}
