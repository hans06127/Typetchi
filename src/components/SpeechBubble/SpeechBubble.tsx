import styles from './SpeechBubble.module.scss';

export interface SpeechBubbleProps {
  message: string | null;
  visible: boolean;
}

export function SpeechBubble({ message, visible }: SpeechBubbleProps) {
  return <div className={`${styles.bubble} ${visible && message ? styles.visible : ''}`} aria-live="polite">{message}</div>;
}
