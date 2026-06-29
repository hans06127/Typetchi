export const ROOT_ID = 'typetchi-root';
export function injectRoot(): HTMLElement {
  const existing = document.getElementById(ROOT_ID);
  if (existing) return existing;
  const root = document.createElement('div');
  root.id = ROOT_ID;
  document.documentElement.append(root);
  return root;
}
