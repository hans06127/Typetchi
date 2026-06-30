export const petMessages = {
  typing: ['正在吸收文字能量...', '今天也很努力呢', '繼續打字，我會長大！'],
  levelUp: ['升級了！', '變得更有精神了！'],
  evolve: ['進化了！', '新的樣子登場！'],
  paste: ['貼上的文字不會增加經驗值', '只計算手打的文字喔'],
  resetWidget: ['視窗位置已重置'],
  resetProgress: ['角色進度已重置'],
} as const;

export type PetMessageKind = keyof typeof petMessages;

export function pickPetMessage(kind: PetMessageKind): string {
  const messages = petMessages[kind];
  return messages[Math.floor(Math.random() * messages.length)] ?? '';
}
