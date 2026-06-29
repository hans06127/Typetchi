(() => {
  const ROOT_ID = 'typetchi-root';
  const PET_KEY = 'typetchi.petState';
  const WIDGET_KEY = 'typetchi.widgetState';
  const STAGES = [
    { id: 'stage_1', name: '幼年期', requiredExp: 0, icon: '🌱' },
    { id: 'stage_2', name: '成長期', requiredExp: 500, icon: '🌿' },
    { id: 'stage_3', name: '成熟期', requiredExp: 2000, icon: '🌸' },
  ];
  const previousValueMap = new WeakMap();

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
  function storageGet(key, fallback) {
    return new Promise((resolve) => {
      if (!globalThis.chrome?.storage?.local) return resolve(fallback);
      chrome.storage.local.get(key, (result) => resolve(result[key] ?? fallback));
    });
  }
  function storageSet(key, value) {
    if (globalThis.chrome?.storage?.local) chrome.storage.local.set({ [key]: value });
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
      const ignoredTypes = ['password', 'hidden', 'checkbox', 'radio', 'file', 'submit', 'button'];
      return !ignoredTypes.includes(target.type) && !target.disabled && !target.readOnly;
    }
    if (target instanceof HTMLTextAreaElement) return !target.disabled && !target.readOnly;
    return target.isContentEditable;
  }
  function getElementText(element) {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) return element.value;
    if (element.isContentEditable) return element.innerText;
    return '';
  }
  function calculateAddedChars(element) {
    const currentValue = getElementText(element);
    const previousValue = previousValueMap.get(element) ?? '';
    previousValueMap.set(element, currentValue);
    return Math.max(currentValue.length - previousValue.length, 0);
  }

  const root = document.getElementById(ROOT_ID) ?? document.createElement('div');
  root.id = ROOT_ID;
  document.documentElement.append(root);

  const style = document.createElement('style');
  style.textContent = `
    #typetchi-root .typetchi-widget { position: fixed; z-index: 2147483647; box-sizing: border-box; display: flex; flex-direction: column; overflow: hidden; border: 1px solid rgba(255,255,255,.75); border-radius: 22px; background: rgba(255,249,244,.92); box-shadow: 0 18px 50px rgba(91,68,56,.22); color: #574941; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; backdrop-filter: blur(14px); }
    #typetchi-root .typetchi-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 12px 12px 8px 16px; background: linear-gradient(135deg, rgba(255,218,226,.78), rgba(222,248,235,.66)); cursor: grab; user-select: none; }
    #typetchi-root .typetchi-title { font-weight: 800; letter-spacing: .02em; }
    #typetchi-root .typetchi-controls { display: flex; gap: 6px; }
    #typetchi-root button { border: 0; border-radius: 999px; background: rgba(255,255,255,.72); color: #6b5a52; cursor: pointer; font-size: 12px; padding: 5px 8px; }
    #typetchi-root button:hover { background: white; }
    #typetchi-root .typetchi-body { padding: 14px 16px 18px; display: grid; gap: 12px; }
    #typetchi-root .typetchi-stage { display: grid; place-items: center; min-height: 112px; }
    #typetchi-root .typetchi-pet { width: 96px; height: 96px; border-radius: 48% 52% 45% 55%; display: grid; place-items: center; font-size: 42px; box-shadow: inset -10px -14px 22px rgba(116,80,70,.12); animation: typetchi-float 2.8s ease-in-out infinite; }
    #typetchi-root .stage_1 { background: #ffd7df; } #typetchi-root .stage_2 { background: #c7f2dd; transform: scale(1.08); } #typetchi-root .stage_3 { background: #d8d0ff; transform: scale(1.16); }
    #typetchi-root .typetchi-name { margin-top: 8px; color: #6b5a52; font-weight: 700; text-align: center; }
    #typetchi-root .typetchi-stats { display: grid; gap: 7px; font-size: 13px; }
    #typetchi-root .typetchi-row { display: flex; justify-content: space-between; gap: 12px; }
    #typetchi-root .typetchi-muted { color: #8a786e; }
    #typetchi-root .typetchi-bar { height: 10px; background: rgba(95,78,65,.14); border-radius: 999px; overflow: hidden; }
    #typetchi-root .typetchi-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, #ffb7c5, #ffd88a, #9ee7c6); transition: width 220ms ease; }
    #typetchi-root .typetchi-resize { position: absolute; right: 4px; bottom: 4px; width: 18px; height: 18px; cursor: nwse-resize; }
    #typetchi-root .typetchi-resize::after { content: ''; position: absolute; right: 3px; bottom: 3px; width: 9px; height: 9px; border-right: 2px solid rgba(87,73,65,.38); border-bottom: 2px solid rgba(87,73,65,.38); }
    #typetchi-root .typetchi-collapsed .typetchi-body, #typetchi-root .typetchi-collapsed .typetchi-resize { display: none; }
    #typetchi-root .typetchi-reopen { position: fixed; right: 16px; bottom: 16px; z-index: 2147483647; box-shadow: 0 12px 28px rgba(91,68,56,.2); }
    @keyframes typetchi-float { 0%,100% { translate: 0 0; } 50% { translate: 0 -8px; } }
  `;
  root.append(style);

  let petState = defaultPetState();
  let widgetState = defaultWidgetState();

  function savePet() { storageSet(PET_KEY, petState); }
  function saveWidget() { storageSet(WIDGET_KEY, widgetState); }
  function setWidget(next) { widgetState = next; saveWidget(); render(); }
  function addTypingExp(addedChars) {
    const totalExp = petState.totalExp + addedChars;
    petState = { ...petState, totalExp, level: calculateLevel(totalExp), currentStage: calculateStage(totalExp), todayTypedCount: petState.todayTypedCount + addedChars, lastActiveDate: dateKey() };
    savePet();
    render();
  }
  function render() {
    [...root.querySelectorAll('.typetchi-widget,.typetchi-reopen')].forEach((node) => node.remove());
    if (widgetState.closed) {
      const reopen = document.createElement('button');
      reopen.className = 'typetchi-reopen';
      reopen.textContent = '開啟 Typetchi';
      reopen.addEventListener('click', () => setWidget({ ...widgetState, closed: false }));
      root.append(reopen);
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
    if (!widgetState.collapsed) widget.style.height = widgetState.height + 'px';
    widget.innerHTML = `
      <header class="typetchi-header"><span class="typetchi-title">Typetchi</span><div class="typetchi-controls"><button data-action="pin">${widgetState.pinned ? '解除固定' : '固定'}</button><button data-action="collapse">${widgetState.collapsed ? '展開' : '收合'}</button><button data-action="reset">重置</button><button data-action="close">關閉</button></div></header>
      <div class="typetchi-body"><div class="typetchi-stage"><div><div class="typetchi-pet ${stage.id}">${stage.icon}</div><div class="typetchi-name">${stage.name}</div></div></div><div class="typetchi-stats"><div class="typetchi-row"><strong>Lv. ${petState.level}</strong><span>${stage.name}</span></div><div class="typetchi-row"><span>EXP</span><span>${nextStage ? petState.totalExp + ' / ' + nextStage.requiredExp : petState.totalExp + ' / MAX'}</span></div><div class="typetchi-bar"><div class="typetchi-fill" style="width: ${percent}%"></div></div><div class="typetchi-row"><span class="typetchi-muted">今日輸入</span><span>${petState.todayTypedCount} 字</span></div><div class="typetchi-row"><span class="typetchi-muted">下一階段</span><span>${nextStage?.name ?? '已成熟'}</span></div></div></div><span class="typetchi-resize"></span>
    `;
    root.append(widget);

    widget.querySelector('[data-action=pin]').addEventListener('click', () => setWidget({ ...widgetState, pinned: !widgetState.pinned }));
    widget.querySelector('[data-action=collapse]').addEventListener('click', () => setWidget({ ...widgetState, collapsed: !widgetState.collapsed }));
    widget.querySelector('[data-action=reset]').addEventListener('click', () => setWidget(defaultWidgetState()));
    widget.querySelector('[data-action=close]').addEventListener('click', () => setWidget({ ...widgetState, closed: true }));
    widget.querySelector('.typetchi-header').addEventListener('pointerdown', startDrag);
    widget.querySelector('.typetchi-resize').addEventListener('pointerdown', startResize);
  }
  function startDrag(event) {
    if (widgetState.pinned) return;
    const start = { x: event.clientX, y: event.clientY, left: widgetState.x, top: widgetState.y };
    const onMove = (moveEvent) => setWidget({ ...widgetState, x: clamp(start.left + moveEvent.clientX - start.x, 8, window.innerWidth - widgetState.width - 8), y: clamp(start.top + moveEvent.clientY - start.y, 8, window.innerHeight - widgetState.height - 8) });
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  }
  function startResize(event) {
    event.stopPropagation();
    if (widgetState.pinned) return;
    const start = { x: event.clientX, y: event.clientY, width: widgetState.width, height: widgetState.height };
    const onMove = (moveEvent) => setWidget({ ...widgetState, width: clamp(start.width + moveEvent.clientX - start.x, 220, 420), height: clamp(start.height + moveEvent.clientY - start.y, 180, 560) });
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  }

  document.addEventListener('input', (event) => {
    if (!isTrackableInput(event.target)) return;
    const addedChars = calculateAddedChars(event.target);
    if (addedChars > 0) addTypingExp(addedChars);
  }, true);

  Promise.all([storageGet(PET_KEY, defaultPetState()), storageGet(WIDGET_KEY, defaultWidgetState())]).then(([storedPet, storedWidget]) => {
    const today = dateKey();
    petState = { ...storedPet, level: calculateLevel(storedPet.totalExp), currentStage: calculateStage(storedPet.totalExp), todayTypedCount: storedPet.lastActiveDate === today ? storedPet.todayTypedCount : 0, lastActiveDate: today };
    widgetState = { ...defaultWidgetState(), ...storedWidget };
    savePet();
    render();
  });
})();
