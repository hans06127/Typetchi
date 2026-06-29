export const ROOT_ID = 'typetchi-root';
export const APP_ID = 'typetchi-app';

function applyRootIsolationStyles(root: HTMLElement): void {
  root.style.position = 'fixed';
  root.style.right = '24px';
  root.style.bottom = '24px';
  root.style.zIndex = '2147483647';
  root.style.width = '280px';
  root.style.height = '360px';
  root.style.pointerEvents = 'none';
  root.style.contain = 'layout style paint';
}

export function injectTypetchiRoot(): HTMLElement | null {
  const existingRoot = document.getElementById(ROOT_ID);
  if (existingRoot) {
    console.log('[Typetchi] root already exists, skip injection');
    return null;
  }

  const root = document.createElement('div');
  root.id = ROOT_ID;
  applyRootIsolationStyles(root);
  document.body.appendChild(root);
  console.log('[Typetchi] root injected');

  const shadowRoot = root.attachShadow({ mode: 'open' });
  console.log('[Typetchi] shadow root attached');

  const app = document.createElement('div');
  app.id = APP_ID;
  app.style.pointerEvents = 'auto';
  shadowRoot.append(app);

  return app;
}

export function mountWhenBodyReady(mount: (rootElement: HTMLElement) => void): void {
  const mountOnce = () => {
    console.log('[Typetchi] document body ready');
    const rootElement = injectTypetchiRoot();
    if (rootElement) mount(rootElement);
  };

  if (document.body) {
    mountOnce();
  } else {
    window.addEventListener('DOMContentLoaded', mountOnce, { once: true });
  }
}
