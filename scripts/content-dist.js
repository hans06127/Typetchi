(() => {
  const ROOT_ID = 'typetchi-root';
  const APP_ID = 'typetchi-app';
  const PET_KEY = 'typetchi.petState';
  const WIDGET_KEY = 'typetchi.widgetState';
  const FLUSH_DELAY_MS = 1000;
  const STAGES = [
    { id: 'stage_1', name: '幼年期', requiredExp: 0, icon: '🌱' },
    { id: 'stage_2', name: '成長期', requiredExp: 500, icon: '🌿' },
    { id: 'stage_3', name: '成熟期', requiredExp: 2000, icon: '🌸' },
  ];

  console.log('[Typetchi] content script loaded');

  const previousLengthMap = new WeakMap();
  let isComposing = false;
  let shadowRoot;
  let appRoot;
  let petState = defaultPetState();
  let widgetState = defaultWidgetState();
  let petFlushTimer;
  let widgetFlushTimer;
  let pendingPetState = null;
  let pendingWidgetState = null;
  let isMounting = false;
  let ensureRootTimer;
  let rootRemovalObserver;
  let hasLoggedStorageUnavailable = false;
  let isStorageDisabled = false;

  function dateKey(date = new Date()) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
  function defaultPetState() {
    return { totalExp: 0, level: 1, currentStage: 'stage_1', todayTypedCount: 0, lastActiveDate: dateKey() };
  }
  function defaultWidgetState() {
    return { x: Math.max(16, window.innerWidth - 300), y: Math.max(16, window.innerHeight - 380), width: 280, height: 360, pinned: false, collapsed: false, closed: false };
  }
  function isExtensionContextInvalidated(error) {
    return error instanceof Error && error.message.includes('Extension context invalidated');
  }
  function warnStorageUnavailable(error) {
    if (hasLoggedStorageUnavailable) return;
    hasLoggedStorageUnavailable = true;
    if (isExtensionContextInvalidated(error)) {
      console.warn('[Typetchi] extension context invalidated; storage is disabled until the page reloads');
      return;
    }
    console.warn('[Typetchi] storage unavailable, using in-memory state', error);
  }
  function disableStorage(error) {
    isStorageDisabled = true;
    warnStorageUnavailable(error);
  }
  function getChromeLocalStorage() {
    if (isStorageDisabled) return null;
    try {
      return globalThis.chrome?.storage?.local ?? null;
    } catch (error) {
      disableStorage(error);
      return null;
    }
  }

  function numberOrFallback(value, fallback) {
    return Number.isFinite(value) ? value : fallback;
  }
  function normalizeWidgetState(state) {
    const defaults = defaultWidgetState();
    const widthMax = Math.max(220, Math.min(420, window.innerWidth - 16));
    const heightMax = Math.max(180, Math.min(560, window.innerHeight - 16));
    const width = clamp(numberOrFallback(state?.width, defaults.width), 220, widthMax);
    const height = clamp(numberOrFallback(state?.height, defaults.height), 180, heightMax);
    return {
      ...defaults,
      ...(state ?? {}),
      x: clamp(numberOrFallback(state?.x, defaults.x), 8, Math.max(8, window.innerWidth - width - 8)),
      y: clamp(numberOrFallback(state?.y, defaults.y), 8, Math.max(8, window.innerHeight - height - 8)),
      width,
      height,
      closed: false,
    };
  }
  function storageGet(key, fallback) {
    return new Promise((resolve) => {
      const localStorage = getChromeLocalStorage();
      if (!localStorage) return resolve(fallback);
      try {
        localStorage.get(key, (result) => {
          const error = chrome.runtime?.lastError;
          if (error) {
            disableStorage(error);
            resolve(fallback);
            return;
          }
          resolve(result[key] ?? fallback);
        });
      } catch (error) {
        disableStorage(error);
        resolve(fallback);
      }
    });
  }
  function storageSet(key, value) {
    return new Promise((resolve) => {
      const localStorage = getChromeLocalStorage();
      if (!localStorage) return resolve();
      try {
        localStorage.set({ [key]: value }, () => {
          const error = chrome.runtime?.lastError;
          if (error) disableStorage(error);
          resolve();
        });
      } catch (error) {
        disableStorage(error);
        resolve();
      }
    });
  }
  function flushPetState() {
    if (petFlushTimer) window.clearTimeout(petFlushTimer);
    petFlushTimer = undefined;
    if (!pendingPetState) return;
    const state = pendingPetState;
    pendingPetState = null;
    storageSet(PET_KEY, state).then(() => console.log('[Typetchi] storage flushed'));
  }
  function flushWidgetState() {
    if (widgetFlushTimer) window.clearTimeout(widgetFlushTimer);
    widgetFlushTimer = undefined;
    if (!pendingWidgetState) return;
    const state = pendingWidgetState;
    pendingWidgetState = null;
    storageSet(WIDGET_KEY, state).then(() => console.log('[Typetchi] storage flushed'));
  }
  function schedulePetFlush(state) {
    pendingPetState = state;
    if (petFlushTimer) window.clearTimeout(petFlushTimer);
    petFlushTimer = window.setTimeout(flushPetState, FLUSH_DELAY_MS);
  }
  function scheduleWidgetFlush(state) {
    pendingWidgetState = state;
    if (widgetFlushTimer) window.clearTimeout(widgetFlushTimer);
    widgetFlushTimer = window.setTimeout(flushWidgetState, FLUSH_DELAY_MS);
  }
  function flushAllStorage() {
    flushPetState();
    flushWidgetState();
  }
  function calculateLevel(totalExp) {
    return Math.floor(totalExp / 100) + 1;
  }
  function calculateStage(totalExp) {
    if (totalExp >= 2000) return 'stage_3';
    if (totalExp >= 500) return 'stage_2';
    return 'stage_1';
  }
  function getStage(totalExp) {
    return STAGES.find((stage) => stage.id === calculateStage(totalExp)) ?? STAGES[0];
  }
  function getNextStage(totalExp) {
    return STAGES.find((stage) => stage.requiredExp > totalExp);
  }
  function isTrackableInput(target) {
    if (!(target instanceof HTMLElement)) return false;
    if (target instanceof HTMLInputElement) {
      return ['text', 'search'].includes(target.type) && !target.disabled && !target.readOnly;
    }
    if (target instanceof HTMLTextAreaElement) return !target.disabled && !target.readOnly;
    return target.isContentEditable;
  }
  function getElementTextLength(element) {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) return element.value.length;
    if (element.isContentEditable) return element.innerText.length;
    return 0;
  }
  function calculateAddedChars(element) {
    const currentLength = getElementTextLength(element);
    const previousLength = previousLengthMap.get(element) ?? currentLength - 1;
    previousLengthMap.set(element, currentLength);
    return Math.max(currentLength - previousLength, 0);
  }
  function hasTypetchiRoot() {
    return Boolean(document.getElementById(ROOT_ID));
  }
  function getMountParent() {
    return document.documentElement;
  }
  function applyRootStyles(root) {
    root.style.position = 'fixed';
    root.style.inset = '0';
    root.style.zIndex = '2147483647';
    root.style.width = '0';
    root.style.height = '0';
    root.style.pointerEvents = 'none';
    root.style.overflow = 'visible';
    root.style.contain = 'layout style';
  }
  function injectTypetchiRoot() {
    const existingRoot = document.getElementById(ROOT_ID);
    if (existingRoot) {
      console.log('[Typetchi] root already exists, skip mount');
      return false;
    }
    const root = document.createElement('div');
    root.id = ROOT_ID;
    applyRootStyles(root);
    getMountParent().appendChild(root);
    console.log('[Typetchi] root injected');

    shadowRoot = root.attachShadow({ mode: 'open' });
    console.log('[Typetchi] shadow root attached');

    const style = document.createElement('style');
    style.textContent = `
      :host { all: initial; }
      #typetchi-app { pointer-events: none; }
      .typetchi-widget { position: fixed; z-index: 2147483647; box-sizing: border-box; display: flex; flex-direction: column; overflow: visible; border: 1px solid rgba(255,255,255,.75); border-radius: 22px; background: rgba(255,249,244,.92); box-shadow: 0 18px 50px rgba(91,68,56,.22); color: #574941; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; backdrop-filter: blur(14px); pointer-events: auto; transform-origin: bottom right; transform: translateY(0) scale(1); opacity: 1; transition: transform 180ms ease, opacity 180ms ease; }
      .typetchi-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 12px 12px 8px 16px; background: linear-gradient(135deg, rgba(255,218,226,.78), rgba(222,248,235,.66)); cursor: grab; user-select: none; border-radius: 22px 22px 0 0; }
      .typetchi-title { font-weight: 800; letter-spacing: .02em; }
      .typetchi-controls { display: flex; gap: 6px; }
      button { border: 0; border-radius: 999px; background: rgba(255,255,255,.72); color: #6b5a52; cursor: pointer; font-size: 12px; padding: 5px 8px; pointer-events: auto; }
      button:hover { background: white; }
      .typetchi-body { padding: 14px 16px 18px; display: grid; gap: 12px; }
      .typetchi-stage { display: grid; place-items: center; min-height: 112px; }
      .typetchi-pet { width: 96px; height: 96px; border-radius: 48% 52% 45% 55%; display: grid; place-items: center; font-size: 42px; box-shadow: inset -10px -14px 22px rgba(116,80,70,.12); animation: typetchi-float 2.8s ease-in-out infinite; }
      .stage_1 { background: #ffd7df; } .stage_2 { background: #c7f2dd; transform: scale(1.08); } .stage_3 { background: #d8d0ff; transform: scale(1.16); }
      .typetchi-name { margin-top: 8px; color: #6b5a52; font-weight: 700; text-align: center; }
      .typetchi-stats { display: grid; gap: 7px; font-size: 13px; }
      .typetchi-row { display: flex; justify-content: space-between; gap: 12px; }
      .typetchi-muted { color: #8a786e; }
      .typetchi-bar { height: 10px; background: rgba(95,78,65,.14); border-radius: 999px; overflow: hidden; }
      .typetchi-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, #ffb7c5, #ffd88a, #9ee7c6); transition: width 220ms ease; }
      .typetchi-resize { position: absolute; right: 4px; bottom: 4px; width: 18px; height: 18px; cursor: nwse-resize; pointer-events: auto; }
      .typetchi-resize::after { content: ''; position: absolute; right: 3px; bottom: 3px; width: 9px; height: 9px; border-right: 2px solid rgba(87,73,65,.38); border-bottom: 2px solid rgba(87,73,65,.38); }
      .typetchi-collapsed { transform: translateY(calc(100% - 48px)) scale(.96); }
      .typetchi-collapsed .typetchi-body, .typetchi-collapsed .typetchi-resize { visibility: hidden; pointer-events: none; }
      .typetchi-collapsed .typetchi-header { border-radius: 22px; }
      .typetchi-reopen { position: fixed; right: 16px; bottom: 16px; z-index: 2147483647; box-shadow: 0 12px 28px rgba(91,68,56,.2); pointer-events: auto; }
      @keyframes typetchi-float { 0%,100% { translate: 0 0; } 50% { translate: 0 -8px; } }
    `;
    appRoot = document.createElement('div');
    appRoot.id = APP_ID;
    shadowRoot.append(style, appRoot);
    console.log('[Typetchi] React app mounted');
    return true;
  }
  function createButton(label, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }
  function render() {
    if (!appRoot) return;
    appRoot.replaceChildren();
    if (widgetState.closed) {
      appRoot.append(createButton('開啟 Typetchi', () => setWidget({ ...widgetState, closed: false })));
      appRoot.firstElementChild.className = 'typetchi-reopen';
      return;
    }
    const stage = getStage(petState.totalExp);
    const nextStage = getNextStage(petState.totalExp);
    const expBase = stage.requiredExp;
    const expTarget = nextStage?.requiredExp ?? petState.totalExp;
    const percent = nextStage ? Math.min(100, ((petState.totalExp - expBase) / Math.max(1, expTarget - expBase)) * 100) : 100;

    const widget = document.createElement('section');
    widget.className = 'typetchi-widget' + (widgetState.collapsed ? ' typetchi-collapsed' : '');
    widget.style.left = widgetState.x + 'px';
    widget.style.top = widgetState.y + 'px';
    widget.style.width = widgetState.width + 'px';
    widget.style.height = widgetState.height + 'px';

    const header = document.createElement('header');
    header.className = 'typetchi-header';
    const title = document.createElement('span');
    title.className = 'typetchi-title';
    title.textContent = 'Typetchi';
    const controls = document.createElement('div');
    controls.className = 'typetchi-controls';
    controls.append(
      createButton(widgetState.pinned ? '解除固定' : '固定', () => setWidget({ ...widgetState, pinned: !widgetState.pinned })),
      createButton(widgetState.collapsed ? '展開' : '收合', toggleCollapse),
      createButton('重置', () => setWidget(defaultWidgetState())),
      createButton('關閉', () => { widgetState = { ...widgetState, closed: true }; render(); }),
    );
    header.append(title, controls);

    const body = document.createElement('div');
    body.className = 'typetchi-body';
    const stageArea = document.createElement('div');
    stageArea.className = 'typetchi-stage';
    const stageWrap = document.createElement('div');
    const pet = document.createElement('div');
    pet.className = `typetchi-pet ${stage.id}`;
    pet.textContent = stage.icon;
    const petName = document.createElement('div');
    petName.className = 'typetchi-name';
    petName.textContent = stage.name;
    stageWrap.append(pet, petName);
    stageArea.append(stageWrap);

    const stats = document.createElement('div');
    stats.className = 'typetchi-stats';
    const makeRow = (left, right, muted = false, strong = false) => {
      const row = document.createElement('div');
      row.className = 'typetchi-row';
      const leftEl = document.createElement(strong ? 'strong' : 'span');
      if (muted) leftEl.className = 'typetchi-muted';
      leftEl.textContent = left;
      const rightEl = document.createElement('span');
      rightEl.textContent = right;
      row.append(leftEl, rightEl);
      return row;
    };
    const bar = document.createElement('div');
    bar.className = 'typetchi-bar';
    const fill = document.createElement('div');
    fill.className = 'typetchi-fill';
    fill.style.width = percent + '%';
    bar.append(fill);
    stats.append(
      makeRow(`Lv. ${petState.level}`, stage.name, false, true),
      makeRow('EXP', nextStage ? petState.totalExp + ' / ' + nextStage.requiredExp : petState.totalExp + ' / MAX'),
      bar,
      makeRow('今日輸入', petState.todayTypedCount + ' 字', true),
      makeRow('下一階段', nextStage?.name ?? '已成熟', true),
    );
    body.append(stageArea, stats);
    const resize = document.createElement('span');
    resize.className = 'typetchi-resize';
    header.addEventListener('pointerdown', startDrag);
    resize.addEventListener('pointerdown', startResize);
    widget.append(header, body, resize);
    appRoot.append(widget);
  }
  function setWidget(next) {
    widgetState = next;
    scheduleWidgetFlush(widgetState);
    render();
  }

  function toggleCollapse() {
    const collapsed = !widgetState.collapsed;
    console.log(collapsed ? '[Typetchi] widget collapsed' : '[Typetchi] widget expanded');
    setWidget({ ...widgetState, collapsed });
  }
  function addTypingExp(addedChars) {
    const totalExp = petState.totalExp + addedChars;
    petState = { ...petState, totalExp, level: calculateLevel(totalExp), currentStage: calculateStage(totalExp), todayTypedCount: petState.todayTypedCount + addedChars, lastActiveDate: dateKey() };
    schedulePetFlush(petState);
    render();
  }
  function startDrag(event) {
    if (widgetState.pinned || event.target.closest('.typetchi-controls')) return;
    const start = { x: event.clientX, y: event.clientY, left: widgetState.x, top: widgetState.y };
    const onMove = (moveEvent) => {
      widgetState = { ...widgetState, x: clamp(start.left + moveEvent.clientX - start.x, 8, window.innerWidth - widgetState.width - 8), y: clamp(start.top + moveEvent.clientY - start.y, 8, window.innerHeight - widgetState.height - 8) };
      scheduleWidgetFlush(widgetState);
      render();
    };
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); flushWidgetState(); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  }
  function startResize(event) {
    if (widgetState.pinned) return;
    const start = { x: event.clientX, y: event.clientY, width: widgetState.width, height: widgetState.height };
    const onMove = (moveEvent) => {
      widgetState = { ...widgetState, width: clamp(start.width + moveEvent.clientX - start.x, 220, 420), height: clamp(start.height + moveEvent.clientY - start.y, 180, 560) };
      scheduleWidgetFlush(widgetState);
      render();
    };
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); flushWidgetState(); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  }
  function handleInput(event) {
    if (isComposing) return;
    if (!isTrackableInput(event.target)) return;
    const addedChars = calculateAddedChars(event.target);
    if (addedChars > 0) {
      console.log('[Typetchi] typing tracked', { addedChars });
      addTypingExp(addedChars);
    }
  }
  function attachGlobalListeners() {
    document.addEventListener('compositionstart', () => { isComposing = true; }, true);
    document.addEventListener('compositionend', () => { isComposing = false; }, true);
    document.addEventListener('input', handleInput, true);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushAllStorage(); });
    window.addEventListener('beforeunload', flushAllStorage);
  }
  function loadStorageAndRender() {
    Promise.all([storageGet(PET_KEY, defaultPetState()), storageGet(WIDGET_KEY, defaultWidgetState())]).then(([storedPet, storedWidget]) => {
      const today = dateKey();
      petState = { ...storedPet, level: calculateLevel(storedPet.totalExp), currentStage: calculateStage(storedPet.totalExp), todayTypedCount: storedPet.lastActiveDate === today ? storedPet.todayTypedCount : 0, lastActiveDate: today };
      widgetState = normalizeWidgetState(storedWidget);
      console.log('[Typetchi] storage loaded');
      schedulePetFlush(petState);
      render();
    });
  }
  function ensureTypetchiRoot() {
    if (isMounting) return;
    if (hasTypetchiRoot()) return;
    isMounting = true;
    try {
      if (injectTypetchiRoot()) {
        console.log('[Typetchi] root ensured');
        render();
      }
    } catch (error) {
      console.error('[Typetchi] failed to ensure root', error);
    } finally {
      isMounting = false;
    }
  }
  function scheduleEnsureRoot() {
    if (ensureRootTimer) window.clearTimeout(ensureRootTimer);
    ensureRootTimer = window.setTimeout(() => {
      ensureTypetchiRoot();
    }, 300);
  }
  function observeRootRemoval() {
    if (rootRemovalObserver) return rootRemovalObserver;
    const target = document.documentElement;
    const observer = new MutationObserver(() => {
      if (!document.getElementById(ROOT_ID)) {
        console.warn('[Typetchi] root removed, reinjecting');
        scheduleEnsureRoot();
      }
    });
    observer.observe(target, { childList: true, subtree: true });
    console.log('[Typetchi] root removal observer started');
    rootRemovalObserver = observer;
    return observer;
  }
  function startTypetchi() {
    console.log('[Typetchi] content script loaded');
    ensureTypetchiRoot();
    observeRootRemoval();
    attachGlobalListeners();
    loadStorageAndRender();
    window.setTimeout(() => { console.log('[Typetchi] delayed ensure root 1000ms'); ensureTypetchiRoot(); }, 1000);
    window.setTimeout(() => { console.log('[Typetchi] delayed ensure root 3000ms'); ensureTypetchiRoot(); }, 3000);
    window.setTimeout(() => { console.log('[Typetchi] delayed ensure root 5000ms'); ensureTypetchiRoot(); }, 5000);
    window.addEventListener('load', () => { console.log('[Typetchi] window loaded, ensure root'); ensureTypetchiRoot(); }, { once: true });
  }

  if (document.body) startTypetchi();
  else window.addEventListener('DOMContentLoaded', startTypetchi, { once: true });
})();

