export const ROOT_ID = 'typetchi-root';
export const APP_ID = 'typetchi-app';

export function hasTypetchiRoot(): boolean {
  return Boolean(document.getElementById(ROOT_ID));
}

function getMountParent(): HTMLElement {
  return document.documentElement;
}

function applyRootIsolationStyles(root: HTMLElement): void {
  root.style.position = 'fixed';
  root.style.inset = '0';
  root.style.zIndex = '2147483647';
  root.style.width = '0';
  root.style.height = '0';
  root.style.pointerEvents = 'none';
  root.style.overflow = 'visible';
  root.style.contain = 'layout style';
}

export function injectTypetchiRoot(): HTMLElement | null {
  const existingRoot = document.getElementById(ROOT_ID);
  if (existingRoot) {
    console.log('[Typetchi] root already exists, skip mount');
    return null;
  }

  const root = document.createElement('div');
  root.id = ROOT_ID;
  applyRootIsolationStyles(root);
  getMountParent().appendChild(root);
  console.log('[Typetchi] root injected');

  const shadowRoot = root.attachShadow({ mode: 'open' });
  console.log('[Typetchi] shadow root attached');

  const app = document.createElement('div');
  app.id = APP_ID;
  app.style.pointerEvents = 'auto';
  shadowRoot.append(app);

  return app;
}
