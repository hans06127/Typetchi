import styles from './WidgetControls.module.scss';
interface Props { pinned: boolean; collapsed: boolean; onTogglePin: () => void; onToggleCollapse: () => void; onClose: () => void; onReset: () => void; }
export function WidgetControls({ pinned, collapsed, onTogglePin, onToggleCollapse, onClose, onReset }: Props) {
  return <div className={styles.controls}>
    <button className={styles.button} onClick={onTogglePin}>{pinned ? '解除固定' : '固定'}</button>
    <button className={styles.button} onClick={onToggleCollapse}>{collapsed ? '展開' : '收合'}</button>
    <button className={styles.button} onClick={onReset}>重置</button>
    <button className={styles.button} onClick={onClose}>關閉</button>
  </div>;
}
