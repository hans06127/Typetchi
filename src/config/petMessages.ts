export const petMessages = {
  typing: ['字光被我接住了。', '冰尾正在充能，繼續敲吧！', '你的文字有暖暖的聲音。', '我聽見鍵盤像小雪鈴一樣。'],
  levelUp: ['狐靈升級，尾巴更亮了！', '我長出新的文字靈光了。', '這份努力，我收到了。'],
  evolve: ['冰藍狐靈進化了！', '新的狐靈姿態登場。', '謝謝你陪我長大。'],
  missionComplete: ['今日任務完成，狐火獻上獎勵！', '任務星光收集完畢。', '好棒，我們完成一個小約定了。'],
  paste: ['貼上的文字不會增加經驗值', '只計算手打的文字喔', '手打的字才會變成狐火。'],
  resetWidget: ['視窗位置已重置'],
  resetProgress: ['角色進度已重置，狐靈重新出發。'],
} as const;

export type PetMessageKind = keyof typeof petMessages;

export function pickPetMessage(kind: PetMessageKind): string {
  const messages = petMessages[kind];
  return messages[Math.floor(Math.random() * messages.length)] ?? '';
}
