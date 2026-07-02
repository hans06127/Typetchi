(() => {
  const ROOT_ID = 'typetchi-root';
  const APP_ID = 'typetchi-app';
  const PET_KEY = 'typetchi.petState';
  const WIDGET_KEY = 'typetchi.widgetState';
  const SETTINGS_KEY = 'typetchi.settings';
  const TYPING_STATS_KEY = 'typetchi.typingStats';
  const DAILY_MISSIONS_KEY = 'typetchi.dailyMissions';
  const DEV_TOOLS_KEY = 'typetchi.devTools';
  const FLUSH_DELAY_MS = 1000;
  const PET_ANIMATION_DURATION = { typing: 400, happy: 800, level_up: 1200, evolve: 1800 };
  const PET_MESSAGES = { typing: ['字光被我接住了。', '冰尾正在充能，繼續敲吧！', '你的文字有暖暖的聲音。', '我聽見鍵盤像小雪鈴一樣。'], levelUp: ['狐靈升級，尾巴更亮了！', '我長出新的文字靈光了。', '這份努力，我收到了。'], evolve: ['冰藍狐靈進化了！', '新的狐靈姿態登場。', '謝謝你陪我長大。'], missionComplete: ['今日任務完成，狐火獻上獎勵！', '任務星光收集完畢。', '好棒，我們完成一個小約定了。'], paste: ['貼上的文字不會增加經驗值', '只計算手打的文字喔', '手打的字才會變成狐火。'], resetWidget: ['視窗位置已重置'], resetProgress: ['角色進度已重置，狐靈重新出發。'] };
  const TYPING_MESSAGE_COOLDOWN_MS = 30000;
  const PASTE_HINT_COOLDOWN_MS = 30000;
  const PASTE_DETECTION_WINDOW_MS = 1000;
  const MAX_CHARS_PER_INPUT_EVENT = 20;
  const TYPING_SESSION_IDLE_TIMEOUT = 10000;
  const TYPING_EVENT_RETENTION_MS = 120000;
  const TYPING_SPEED_WINDOW_MS = 60000;
  const DAILY_MISSION_DEFINITIONS = [
    { id: 'typed-300', type: 'typed_chars', title: '今日手打 300 字', description: '只計算有效手打輸入，不包含貼上文字。', targetValue: 300, rewardExp: 30 },
    { id: 'max-cpm-60', type: 'max_cpm', title: '最高速度 60 CPM', description: '今日最高打字速度達到 60 CPM。', targetValue: 60, rewardExp: 50 },
    { id: 'sessions-3', type: 'typing_sessions', title: '完成 3 次打字 session', description: '有效手打並在閒置後重新開始會建立新 session。', targetValue: 3, rewardExp: 40 },
  ];
  const COLLAPSED_HANDLE_BOUNDS = { width: 68, height: 56 };
  const EVOLUTION_NODES = [
    { id: 'stage_1', name: '幼年期', requiredExp: 0, icon: '🌱', conditions: [{ type: 'total_exp', operator: '>=', value: 0 }] },
    { id: 'stage_2', name: '成長期', requiredExp: 500, icon: '🌿', parentId: 'stage_1', conditions: [{ type: 'total_exp', operator: '>=', value: 500 }] },
    { id: 'stage_3', name: '成熟期', requiredExp: 2000, icon: '🌸', parentId: 'stage_2', conditions: [{ type: 'total_exp', operator: '>=', value: 2000 }] },
  ];
  const STAGES = EVOLUTION_NODES.map(({ id, name, requiredExp, icon }) => ({ id, name, requiredExp, icon }));

  console.log('[Typetchi] content script loaded');

  const previousLengthMap = new WeakMap();
  const pasteElementMap = new WeakMap();
  let isComposing = false;
  let shadowRoot;
  let appRoot;
  let devToolsEnabled = window.localStorage.getItem(DEV_TOOLS_KEY) === 'enabled';
  let petState = defaultPetState();
  let widgetState = defaultWidgetState();
  let petFlushTimer;
  let widgetFlushTimer;
  let pendingPetState = null;
  let pendingWidgetState = null;
  let dailyMissionsState = defaultDailyMissionsState();
  let dailyMissionFlushTimer;
  let pendingDailyMissionsState = null;
  let todaySessionCount = 0;
  let isApplyingRemoteUpdate = false;
  let isMounting = false;
  let ensureRootTimer;
  let rootRemovalObserver;
  let hasLoggedStorageUnavailable = false;
  let isStorageDisabled = false;
  let animationState = 'idle';
  let animationTimer;
  let expToast = { amount: 0, visible: false };
  let expToastTimer;
  let speechBubble = { message: null, visible: false };
  let speechBubbleTimer;
  let lastTypingMessageAt = 0;
  let lastPasteHintAt = 0;
  let typingEvents = [];
  let typingStatsActiveDate = dateKey();
  let typingSpeedState = { recentCpm: 0, recentWpm: 0, todayMaxCpm: 0, todayMaxWpm: 0, sessionChars: 0, sessionStartedAt: null, lastTypedAt: null };
  let collapsedHandleMoved = false;

  function dateKey(date = new Date()) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
  function defaultPetState() {
    return { totalExp: 0, level: 1, currentStage: 'stage_1', todayTypedCount: 0, todayMaxCpm: 0, todayMaxWpm: 0, lastActiveDate: dateKey() };
  }
  function defaultWidgetState() {
    return { x: Math.max(16, window.innerWidth - 300), y: Math.max(16, window.innerHeight - 380), width: 280, height: 360, pinned: false, collapsed: false, closed: false };
  }
  function createDailyMissions(key = dateKey()) {
    return DAILY_MISSION_DEFINITIONS.map((definition) => ({ ...definition, progress: 0, completed: false, rewardClaimed: false, completedAt: null, dateKey: key }));
  }
  function defaultDailyMissionsState(key = dateKey()) {
    return { dateKey: key, missions: createDailyMissions(key), updatedAt: Date.now() };
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
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }
  function normalizeWidgetState(rawState) {
    const state = rawState && typeof rawState === 'object' ? rawState : {};
    const defaults = defaultWidgetState();
    const widthMax = Math.max(240, Math.min(420, window.innerWidth - 32));
    const heightMax = Math.max(280, Math.min(560, window.innerHeight - 32));
    const width = clamp(numberOrFallback(state.width, defaults.width), 240, widthMax);
    const height = clamp(numberOrFallback(state.height, defaults.height), 280, heightMax);
    const collapsed = typeof state.collapsed === 'boolean' ? state.collapsed : defaults.collapsed;
    const positionBounds = collapsed ? COLLAPSED_HANDLE_BOUNDS : { width, height };
    return {
      ...defaults,
      ...state,
      x: clamp(numberOrFallback(state.x, defaults.x), 8, Math.max(8, window.innerWidth - positionBounds.width - 8)),
      y: clamp(numberOrFallback(state.y, defaults.y), 8, Math.max(8, window.innerHeight - positionBounds.height - 8)),
      width,
      height,
      pinned: typeof state.pinned === 'boolean' ? state.pinned : defaults.pinned,
      collapsed,
      closed: typeof state.closed === 'boolean' ? state.closed : defaults.closed,
      updatedAt: numberOrFallback(state.updatedAt, 0) || undefined,
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
    storageSet(PET_KEY, { ...state, updatedAt: Date.now() }).then(() => console.log('[Typetchi] storage flushed'));
  }
  function flushDailyMissionsState() {
    if (dailyMissionFlushTimer) window.clearTimeout(dailyMissionFlushTimer);
    dailyMissionFlushTimer = undefined;
    if (!pendingDailyMissionsState) return;
    const state = pendingDailyMissionsState;
    pendingDailyMissionsState = null;
    storageSet(DAILY_MISSIONS_KEY, { ...state, updatedAt: Date.now() }).then(() => console.log('[Typetchi] storage flushed'));
  }
  function flushWidgetState() {
    if (widgetFlushTimer) window.clearTimeout(widgetFlushTimer);
    widgetFlushTimer = undefined;
    if (!pendingWidgetState) return;
    const state = pendingWidgetState;
    pendingWidgetState = null;
    storageSet(WIDGET_KEY, { ...state, updatedAt: Date.now() }).then(() => console.log('[Typetchi] storage flushed'));
  }
  function schedulePetFlush(state) {
    if (isApplyingRemoteUpdate) return;
    pendingPetState = state;
    if (petFlushTimer) window.clearTimeout(petFlushTimer);
    petFlushTimer = window.setTimeout(flushPetState, FLUSH_DELAY_MS);
  }
  function scheduleDailyMissionsFlush(state) {
    if (isApplyingRemoteUpdate) return;
    pendingDailyMissionsState = state;
    if (dailyMissionFlushTimer) window.clearTimeout(dailyMissionFlushTimer);
    dailyMissionFlushTimer = window.setTimeout(flushDailyMissionsState, 300);
  }
  function scheduleWidgetFlush(state) {
    if (isApplyingRemoteUpdate) return;
    pendingWidgetState = normalizeWidgetState(state);
    if (widgetFlushTimer) window.clearTimeout(widgetFlushTimer);
    widgetFlushTimer = window.setTimeout(flushWidgetState, FLUSH_DELAY_MS);
  }
  function resetPetProgress() {
    if (!window.confirm('確定要重置角色進度嗎？EXP、等級、今日統計會歸零。')) return;
    petState = defaultPetState();
    typingEvents = [];
    typingStatsActiveDate = dateKey();
    typingSpeedState = { recentCpm: 0, recentWpm: 0, todayMaxCpm: 0, todayMaxWpm: 0, sessionChars: 0, sessionStartedAt: null, lastTypedAt: null };
    todaySessionCount = 0;
    pendingPetState = petState;
    flushPetState();
    showSpeech('resetProgress', true);
    render();
  }
  function flushAllStorage() {
    flushPetState();
    flushWidgetState();
    flushDailyMissionsState();
  }
  function calculateLevel(totalExp) {
    return Math.floor(totalExp / 100) + 1;
  }
  function compareEvolutionValue(left, operator, right) {
    if (operator === '>=') return left >= right;
    if (operator === '<=') return left <= right;
    return left === right;
  }
  function evaluateEvolutionCondition(condition, context) {
    if (condition.type === 'total_exp') return compareEvolutionValue(context.totalExp, condition.operator, Number(condition.value));
    if (condition.type === 'typing_speed') return compareEvolutionValue(context.todayMaxCpm ?? 0, condition.operator, Number(condition.value));
    if (condition.type === 'daily_streak') return compareEvolutionValue(context.dailyStreak ?? 0, condition.operator, Number(condition.value));
    if (condition.type === 'special_event') return condition.operator === '===' && context.specialEvents?.includes(String(condition.value));
    return false;
  }
  function canUnlockEvolutionNode(node, context) {
    const conditions = node.conditions ?? [{ type: 'total_exp', operator: '>=', value: node.requiredExp }];
    return conditions.every((condition) => evaluateEvolutionCondition(condition, context));
  }
  function calculateStage(totalExp, context = {}) {
    const resolvedContext = { ...context, totalExp };
    return EVOLUTION_NODES.filter((node) => canUnlockEvolutionNode(node, resolvedContext))
      .reduce((stageId, node) => totalExp >= node.requiredExp ? node.id : stageId, 'stage_1');
  }
  function getStage(totalExp) {
    return STAGES.find((stage) => stage.id === calculateStage(totalExp)) ?? STAGES[0];
  }
  function getNextStage(totalExp) {
    const currentStageId = calculateStage(totalExp);
    return STAGES.find((stage) => stage.requiredExp > totalExp && stage.id !== currentStageId);
  }
  function calculateStageProgress(totalExp) {
    const currentStageId = calculateStage(totalExp);
    const currentStage = STAGES.find((stage) => stage.id === currentStageId) ?? STAGES[0];
    const nextStage = STAGES.find((stage) => stage.requiredExp > totalExp);
    if (!nextStage) return { current: currentStage.requiredExp, required: currentStage.requiredExp, percentage: 100, isMaxStage: true };
    const required = Math.max(1, nextStage.requiredExp - currentStage.requiredExp);
    const current = Math.max(0, totalExp - currentStage.requiredExp);
    return { current, required, percentage: Math.min((current / required) * 100, 100), isMaxStage: false };
  }
  function playAnimation(nextState) {
    const priority = { idle: 0, typing: 1, happy: 2, level_up: 3, evolve: 4 };
    if (priority[nextState] < priority[animationState]) return;
    window.clearTimeout(animationTimer);
    animationState = nextState;
    render();
    animationTimer = window.setTimeout(() => { animationState = 'idle'; render(); }, PET_ANIMATION_DURATION[nextState] ?? 0);
  }
  function showExpToast(amount) {
    if (amount <= 0) return;
    window.clearTimeout(expToastTimer);
    expToast = { amount, visible: true };
    render();
    expToastTimer = window.setTimeout(() => { expToast = { ...expToast, visible: false }; render(); }, 1000);
  }
  function pickMessage(kind) {
    const messages = PET_MESSAGES[kind];
    return messages[Math.floor(Math.random() * messages.length)] ?? '';
  }
  function showSpeech(kind, force = false) {
    const now = Date.now();
    if (kind === 'typing' && !force && now - lastTypingMessageAt < TYPING_MESSAGE_COOLDOWN_MS) return;
    if (kind === 'typing') lastTypingMessageAt = now;
    window.clearTimeout(speechBubbleTimer);
    speechBubble = { message: pickMessage(kind), visible: true };
    render();
    speechBubbleTimer = window.setTimeout(() => { speechBubble = { ...speechBubble, visible: false }; render(); }, 2600);
  }
  function showPasteHint() {
    const now = Date.now();
    if (now - lastPasteHintAt < PASTE_HINT_COOLDOWN_MS) return;
    lastPasteHintAt = now;
    showSpeech('paste', true);
  }
  function markPaste(element, pastedAt) { pasteElementMap.set(element, pastedAt); }
  function wasRecentlyPasted(element, now) { const pastedAt = pasteElementMap.get(element); return Boolean(pastedAt && now - pastedAt <= PASTE_DETECTION_WINDOW_MS); }
  function shouldIgnoreInputForExp(element, addedChars, now) {
    if (isComposing) return true;
    if (addedChars <= 0) return true;
    if (addedChars > MAX_CHARS_PER_INPUT_EVENT) return true;
    return wasRecentlyPasted(element, now);
  }
  function pruneTypingEvents(events, now) { const threshold = now - TYPING_EVENT_RETENTION_MS; return events.filter((event) => event.timestamp >= threshold); }
  function calculateCpm(events, now) { const windowStartedAt = now - TYPING_SPEED_WINDOW_MS; return events.filter((event) => event.timestamp >= windowStartedAt).reduce((sum, event) => sum + event.addedChars, 0); }
  function calculateWpm(cpm) { return Math.round(cpm / 5); }
  function applyBonusExp(bonusExp, fallbackSpeech = 'typing') {
    const nextTotalExp = petState.totalExp + Math.max(0, bonusExp);
    const previousLevel = petState.level;
    const previousStage = petState.currentStage;
    petState = { ...petState, totalExp: nextTotalExp, level: calculateLevel(nextTotalExp), currentStage: calculateStage(nextTotalExp, { todayMaxCpm: petState.todayMaxCpm }), lastActiveDate: dateKey() };
    schedulePetFlush(petState);
    showExpToast(bonusExp);
    if (previousStage !== petState.currentStage) showSpeech('evolve', true);
    else if (previousLevel < petState.level) showSpeech('levelUp', true);
    else showSpeech(fallbackSpeech, true);
  }
  function setDevToolsEnabled(enabled) {
    devToolsEnabled = enabled;
    if (enabled) window.localStorage.setItem(DEV_TOOLS_KEY, 'enabled');
    else window.localStorage.removeItem(DEV_TOOLS_KEY);
    render();
  }
  function addDevExp(amount) {
    applyBonusExp(amount, 'levelUp');
  }
  function ensureDailyMissionsForToday() {
    const today = dateKey();
    if (dailyMissionsState.dateKey !== today) dailyMissionsState = defaultDailyMissionsState(today);
  }
  function progressForMission(type, input) {
    if (type === 'typed_chars') return input.todayTypedCount;
    if (type === 'max_cpm') return input.todayMaxCpm;
    if (type === 'typing_sessions') return input.todaySessionCount;
    return 0;
  }
  function updateDailyMissionProgress(input) {
    ensureDailyMissionsForToday();
    const completions = [];
    dailyMissionsState = { ...dailyMissionsState, missions: dailyMissionsState.missions.map((mission) => {
      const progress = Math.min(mission.targetValue, Math.max(mission.progress, progressForMission(mission.type, input)));
      if (mission.completed || progress < mission.targetValue) return { ...mission, progress };
      completions.push(mission);
      return { ...mission, progress, completed: true, rewardClaimed: true, completedAt: input.timestamp };
    }), updatedAt: input.timestamp };
    if (completions.length > 0) {
      const rewardExp = completions.reduce((sum, mission) => sum + mission.rewardExp, 0);
      console.log('[Typetchi] daily mission completed', { title: completions[0].title, rewardExp });
      applyBonusExp(rewardExp, 'missionComplete');
    }
    scheduleDailyMissionsFlush(dailyMissionsState);
  }
  function updateTypingStats(addedChars, timestamp) {
    const eventDate = dateKey(new Date(timestamp));
    const isNewDay = typingStatsActiveDate !== eventDate;
    if (isNewDay) {
      typingStatsActiveDate = eventDate;
      typingEvents = [];
      typingSpeedState = { recentCpm: 0, recentWpm: 0, todayMaxCpm: 0, todayMaxWpm: 0, sessionChars: 0, sessionStartedAt: null, lastTypedAt: null };
    }
    typingEvents = pruneTypingEvents([...typingEvents, { timestamp, addedChars, source: 'typing' }], timestamp);
    const recentCpm = calculateCpm(typingEvents, timestamp);
    const recentWpm = calculateWpm(recentCpm);
    const shouldStartNewSession = !typingSpeedState.lastTypedAt || timestamp - typingSpeedState.lastTypedAt > TYPING_SESSION_IDLE_TIMEOUT;
    if (shouldStartNewSession) todaySessionCount = isNewDay ? 1 : todaySessionCount + 1;
    typingSpeedState = {
      recentCpm,
      recentWpm,
      todayMaxCpm: Math.max(typingSpeedState.todayMaxCpm, recentCpm),
      todayMaxWpm: Math.max(typingSpeedState.todayMaxWpm, recentWpm),
      sessionStartedAt: shouldStartNewSession ? timestamp : typingSpeedState.sessionStartedAt,
      lastTypedAt: timestamp,
      sessionChars: shouldStartNewSession ? addedChars : typingSpeedState.sessionChars + addedChars,
    };
    if (typingSpeedState.todayMaxCpm !== (petState.todayMaxCpm ?? 0) || typingSpeedState.todayMaxWpm !== (petState.todayMaxWpm ?? 0)) {
      petState = { ...petState, todayMaxCpm: typingSpeedState.todayMaxCpm, todayMaxWpm: typingSpeedState.todayMaxWpm };
      schedulePetFlush(petState);
    }
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
      .typetchi-widget { position: fixed; z-index: 2147483647; box-sizing: border-box; display: flex; flex-direction: column; overflow: hidden; min-width: 240px; min-height: 280px; max-width: min(420px, calc(100vw - 32px)); max-height: min(560px, calc(100vh - 32px)); border: 1px solid rgba(255,255,255,.75); border-radius: 22px; background: rgba(255,249,244,.92); box-shadow: 0 18px 50px rgba(91,68,56,.22); color: #574941; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; backdrop-filter: blur(14px); pointer-events: auto; transform-origin: bottom right; transform: translateY(0) scale(1); opacity: 1; transition: transform 180ms ease, opacity 180ms ease; }
      .typetchi-header { flex: 0 0 auto; min-height: 44px; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 12px 12px 8px 16px; background: linear-gradient(135deg, rgba(255,218,226,.78), rgba(222,248,235,.66)); cursor: grab; user-select: none; border-radius: 22px 22px 0 0; }
      .typetchi-title { font-weight: 800; letter-spacing: .02em; }
      .typetchi-controls { display: flex; gap: 6px; }
      button { border: 0; border-radius: 999px; background: rgba(255,255,255,.72); color: #6b5a52; cursor: pointer; font-size: 12px; padding: 5px 8px; pointer-events: auto; }
      button:hover { background: white; }
      .typetchi-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 10px 16px 12px; display: grid; gap: 8px; } .typetchi-body::-webkit-scrollbar { width: 6px; } .typetchi-body::-webkit-scrollbar-thumb { border-radius: 999px; background: rgba(138,120,110,.28); }
      .typetchi-stage { display: grid; place-items: center; min-height: 104px; }
      .typetchi-pet { position: relative; width: 82px; height: 82px; transform-origin: center bottom; }
      .typetchi-pet-body { position: absolute; inset: 10px; border-radius: 48% 52% 45% 55%; background: linear-gradient(145deg, #ffd6dc, #ffb7c7); box-shadow: inset -8px -10px 18px rgba(173,82,104,.13), 0 12px 24px rgba(153,96,96,.2); }
      .typetchi-face { position: absolute; left: 28px; right: 28px; top: 39px; display: flex; justify-content: space-between; } .typetchi-eye { width: 7px; height: 9px; border-radius: 999px; background: #58423c; }
      .stage_1 .typetchi-pet-body { background: linear-gradient(145deg, #d8f6c5, #aee7bc); } .stage_2 .typetchi-pet-body { background: linear-gradient(145deg, #c7f0ff, #9bd8ff); } .stage_3 .typetchi-pet-body { background: linear-gradient(145deg, #ffe3a8, #ffb9c9); }
      .typetchi-ear { position: absolute; top: 6px; width: 20px; height: 28px; border-radius: 999px 999px 12px 12px; background: #ffc4d0; z-index: -1; } .typetchi-ear.left { left: 16px; transform: rotate(-24deg); } .typetchi-ear.right { right: 16px; transform: rotate(24deg); }
      .typetchi-arm { position: absolute; top: 50px; width: 18px; height: 11px; border-radius: 999px; background: #ffc1ca; } .typetchi-arm.left { left: 2px; transform: rotate(-18deg); } .typetchi-arm.right { right: 2px; transform: rotate(18deg); }
      .typetchi-name { margin-top: 8px; color: #6b5a52; font-weight: 700; text-align: center; }
      .typetchi-bubble { min-height: 18px; justify-self: center; max-width: 100%; padding: 6px 10px; border-radius: 14px; background: rgba(255,255,255,.86); color: #6b5145; font-size: 12px; font-weight: 700; opacity: 0; transform: translateY(4px); pointer-events: none; transition: opacity 160ms ease, transform 160ms ease; } .typetchi-bubble.visible { opacity: 1; transform: translateY(0); }
      .typetchi-toast { position: absolute; right: 16px; bottom: 92px; z-index: 1; padding: 4px 10px; border-radius: 999px; background: rgba(255,238,170,.96); color: #765022; font-size: 12px; font-weight: 800; opacity: 0; pointer-events: none; transition: opacity 160ms ease, transform 160ms ease; } .typetchi-toast.visible { opacity: 1; animation: typetchi-exp-toast 1s ease-out; }
      .typetchi-pet.idle { animation: typetchi-idle 2.4s ease-in-out infinite; } .typetchi-pet.typing { animation: typetchi-typing .4s ease-in-out; } .typetchi-pet.happy { animation: typetchi-happy .8s ease-in-out; } .typetchi-pet.level_up { animation: typetchi-level-up 1.2s ease-in-out; } .typetchi-pet.evolve { animation: typetchi-evolve 1.8s ease-in-out; }
      .typetchi-stats { display: grid; gap: 7px; font-size: 13px; }
      .typetchi-row { display: flex; justify-content: space-between; gap: 12px; min-width: 0; } .typetchi-row span:last-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: right; } .typetchi-stats-panel { display: grid; gap: 7px; padding: 8px 10px; border-radius: 14px; background: rgba(255,255,255,.46); } .typetchi-footer { flex: 0 0 auto; display: grid; gap: 6px; padding: 8px 12px 12px; border-top: 1px solid rgba(126,101,88,.12); background: rgba(255,249,244,.58); border-radius: 0 0 22px 22px; } .typetchi-footer-label { color: #9a897f; font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; } .typetchi-footer .subtle-danger { justify-self: start; padding: 4px 8px; color: #8a5b50; background: transparent; box-shadow: none; text-decoration: underline; text-decoration-color: rgba(138,91,80,.32); text-underline-offset: 3px; } .typetchi-dev-tools { display: grid; gap: 6px; padding-top: 6px; border-top: 1px dashed rgba(126,101,88,.18); } .typetchi-dev-buttons { display: flex; flex-wrap: wrap; gap: 6px; }
      .typetchi-muted { color: #8a786e; }
      .typetchi-bar { height: 10px; background: rgba(95,78,65,.14); border-radius: 999px; overflow: hidden; }
      .typetchi-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, #ffb7c5, #ffd88a, #9ee7c6); transition: width 220ms ease; }
      .typetchi-resize { position: absolute; right: 4px; bottom: 4px; width: 18px; height: 18px; cursor: nwse-resize; pointer-events: auto; }
      .typetchi-resize::after { content: ''; position: absolute; right: 3px; bottom: 3px; width: 9px; height: 9px; border-right: 2px solid rgba(87,73,65,.38); border-bottom: 2px solid rgba(87,73,65,.38); }
      .typetchi-handle { position: absolute; left: 50%; top: 6px; display: none; align-items: center; justify-content: center; width: 44px; height: 36px; padding: 0; border: 0; border-radius: 999px; background: rgba(255,249,244,.96); transform: translateX(-50%); box-shadow: 0 8px 22px rgba(91,68,56,.18); pointer-events: auto; } .typetchi-handle:hover::after { content: '點擊展開'; position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%); white-space: nowrap; padding: 4px 8px; border-radius: 999px; background: rgba(87,73,65,.9); color: white; font-size: 11px; } .typetchi-handle .typetchi-pet { width: 32px; height: 32px; }
      .typetchi-collapsed { width: 64px !important; height: 52px !important; min-width: 64px; min-height: 52px; max-width: 64px; max-height: 52px; overflow: visible; transform: none; background: transparent; border-color: transparent; box-shadow: none; backdrop-filter: none; pointer-events: none; }
      .typetchi-collapsed .typetchi-header, .typetchi-collapsed .typetchi-body, .typetchi-collapsed .typetchi-resize, .typetchi-collapsed .typetchi-footer, .typetchi-collapsed .typetchi-toast { display: none; pointer-events: none; }
      .typetchi-collapsed .typetchi-handle { display: flex; visibility: visible; }

      .typetchi-stage { min-height: 136px; }
      .typetchi-pet { width: 184px; height: 136px; filter: drop-shadow(0 16px 22px rgba(55,132,172,.2)); }
      .typetchi-pet.stage_1 { width: 150px; height: 132px; }
      .typetchi-pet.stage_2 { width: 198px; height: 140px; }
      .typetchi-pet.stage_3 { width: 210px; height: 160px; }
      .typetchi-stage-svg { display: block; width: 100%; height: 100%; overflow: visible; }
      .typetchi-flame { transform-origin: 18px 25px; animation: typetchi-flame 1.5s ease-in-out infinite; filter: drop-shadow(0 0 7px rgba(0,190,255,.55)); }
      .typetchi-ribbon { animation: typetchi-ribbon 4s ease-in-out infinite; }
      .typetchi-handle { top: 4px; width: 52px; height: 44px; border: 1px solid rgba(255,255,255,.82); background: radial-gradient(circle at 50% 35%, rgba(255,255,255,.96), rgba(209,245,255,.9) 62%, rgba(140,218,255,.78)); box-shadow: 0 10px 24px rgba(55,132,172,.22), inset 0 1px 0 rgba(255,255,255,.8); }
      .typetchi-handle .typetchi-pet, .typetchi-handle .typetchi-pet.stage_1, .typetchi-handle .typetchi-pet.stage_2, .typetchi-handle .typetchi-pet.stage_3 { width: 46px; height: 38px; filter: drop-shadow(0 7px 10px rgba(55,132,172,.24)); }
      .typetchi-handle .typetchi-flame, .typetchi-handle .typetchi-ribbon { display: none; }
      .typetchi-collapsed { width: 68px !important; height: 56px !important; min-width: 68px; min-height: 56px; max-width: 68px; max-height: 56px; }
      @keyframes typetchi-idle { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-4px) scale(1.02); } } @keyframes typetchi-typing { 0% { transform: translateY(0) rotate(0); } 35% { transform: translateY(-6px) rotate(-3deg); } 70% { transform: translateY(0) rotate(3deg); } 100% { transform: translateY(0) rotate(0); } } @keyframes typetchi-happy { 0%,100% { transform: scale(1); } 40% { transform: scale(1.12); } 70% { transform: scale(.96); } } @keyframes typetchi-level-up { 0% { transform: scale(1); filter: brightness(1); } 40% { transform: scale(1.18); filter: brightness(1.25); } 100% { transform: scale(1); filter: brightness(1); } } @keyframes typetchi-evolve { 0% { transform: scale(1); opacity: 1; filter: brightness(1); } 40% { transform: scale(1.25); opacity: .7; filter: brightness(1.8); } 70% { transform: scale(.9); opacity: .9; } 100% { transform: scale(1); opacity: 1; filter: brightness(1); } } @keyframes typetchi-exp-toast { 0% { transform: translateY(6px) scale(.96); } 35% { transform: translateY(-6px) scale(1.04); } 100% { transform: translateY(-4px) scale(1); } } @keyframes typetchi-flame { 0%,100% { transform: translateY(0) scale(1); opacity: .94; } 50% { transform: translateY(-4px) scale(1.1); opacity: 1; } } @keyframes typetchi-ribbon { 0%,100% { transform: translateY(0); opacity: .28; } 50% { transform: translateY(-5px); opacity: .42; } } @media (prefers-reduced-motion: reduce) { .typetchi-widget, .typetchi-pet, .typetchi-fill, .typetchi-toast, .typetchi-bubble { animation: none !important; transition: none !important; } }
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
  function flameSvg() {
    return `<g class="typetchi-flame"><path d="M14 34c-8-5-9-15-2-23 1 7 6 8 6 15 5-5 3-13 0-18 12 7 16 20 8 28-4 4-8 5-12-2Z" fill="url(#flameFill)"/><path d="M16 34c-4-3-4-8 0-13 1 4 5 5 4 11 3-2 3-6 2-9 7 6 5 14-2 15-2 0-3-1-4-4Z" fill="#effdff" opacity=".92"/></g>`;
  }
  function stageSvgMarkup(stageId) {
    if (stageId === 'stage_1') return `<svg class="typetchi-stage-svg" viewBox="0 0 160 150" aria-hidden="true"><defs><linearGradient id="furStage1" x1="28" x2="130" y1="24" y2="130" gradientUnits="userSpaceOnUse"><stop stop-color="#fff"/><stop offset=".58" stop-color="#f7fdff"/><stop offset="1" stop-color="#b7eaff"/></linearGradient><linearGradient id="tailStage1" x1="92" x2="143" y1="79" y2="122" gradientUnits="userSpaceOnUse"><stop stop-color="#fafdff"/><stop offset=".64" stop-color="#bfeeff"/><stop offset="1" stop-color="#41c8ff"/></linearGradient><linearGradient id="eyeBlue" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#173268"/><stop offset=".5" stop-color="#2497f2"/><stop offset="1" stop-color="#87efff"/></linearGradient><linearGradient id="flameFill" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#74f7ff"/><stop offset=".48" stop-color="#00b8ff"/><stop offset="1" stop-color="#075ee7"/></linearGradient></defs><ellipse cx="76" cy="133" rx="48" ry="8" fill="#c8d5e8" opacity=".24"/><g transform="translate(114 38)">${flameSvg()}</g><path d="M94 91c20-36 53-16 43 19-5 17-21 23-40 17 18-4 24-14 21-24-5 5-12 8-21 8 13-8 18-16 16-24-5 4-11 6-19 4Z" fill="url(#tailStage1)" stroke="#2b5b91" stroke-width="2"/><path d="M37 62 31 25l27 24Zm53-13 28-24-5 39Z" fill="url(#furStage1)" stroke="#183a70" stroke-width="3" stroke-linejoin="round"/><path d="M41 56 36 36l16 15Zm53-4 17-15-5 21Z" fill="#ffd8df" opacity=".7"/><path d="M30 72c-7 38 12 59 48 59 30 0 45-20 40-54-4-24-22-38-46-38-23 0-38 12-42 33Z" fill="url(#furStage1)" stroke="#315580" stroke-width="2.4"/><path d="M65 35c7 10 12 10 18 0 0 17-5 22-9 28-6-8-9-13-9-28Z" fill="#65cfff" opacity=".9"/><path d="M67 50c4 5 8 5 13 0" fill="none" stroke="#65cfff" stroke-width="3" stroke-linecap="round"/><ellipse cx="55" cy="79" rx="9" ry="12" fill="url(#eyeBlue)"/><ellipse cx="95" cy="79" rx="9" ry="12" fill="url(#eyeBlue)"/><circle cx="52" cy="74" r="3" fill="#fff"/><circle cx="92" cy="74" r="3" fill="#fff"/><path d="M73 88c2 2 4 2 6 0M68 93c5 5 12 5 17 0" fill="none" stroke="#3d4262" stroke-width="2" stroke-linecap="round"/><path d="M37 117c-2 11 6 15 16 11M93 128c11 4 20-1 18-12" fill="none" stroke="#315580" stroke-width="3" stroke-linecap="round"/><path d="M47 97c10 6 21 8 33 5" fill="none" stroke="#9de9ff" stroke-width="5" stroke-linecap="round" opacity=".7"/></svg>`;
    if (stageId === 'stage_2') return `<svg class="typetchi-stage-svg" viewBox="0 0 210 150" aria-hidden="true"><defs><linearGradient id="furStage2" x1="54" x2="150" y1="20" y2="135" gradientUnits="userSpaceOnUse"><stop stop-color="#fff"/><stop offset=".56" stop-color="#f4fcff"/><stop offset="1" stop-color="#a9e6ff"/></linearGradient><linearGradient id="tailStage2" x1="124" x2="205" y1="32" y2="122" gradientUnits="userSpaceOnUse"><stop stop-color="#fdfdff"/><stop offset=".48" stop-color="#dff6ff"/><stop offset="1" stop-color="#3ec4fa"/></linearGradient><linearGradient id="eyeBlue" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#173268"/><stop offset=".5" stop-color="#2497f2"/><stop offset="1" stop-color="#87efff"/></linearGradient><linearGradient id="flameFill" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#74f7ff"/><stop offset=".48" stop-color="#00b8ff"/><stop offset="1" stop-color="#075ee7"/></linearGradient></defs><ellipse cx="103" cy="135" rx="72" ry="8" fill="#c8d5e8" opacity=".22"/><g transform="translate(16 52)">${flameSvg()}</g><path d="M120 77c13-48 69-72 76-18 5 40-34 69-75 59 27-6 43-17 50-36-17 10-34 14-52 10 27-13 39-29 42-48-15 13-27 23-41 33Z" fill="url(#tailStage2)" stroke="#285a91" stroke-width="2.2"/><path d="M54 57 50 15l31 30Zm50-14 31-30-5 46Z" fill="url(#furStage2)" stroke="#173a70" stroke-width="3" stroke-linejoin="round"/><path d="M60 51 56 28l17 18Zm50-6 18-17-4 23Z" fill="#ffd6df" opacity=".65"/><path d="M51 61c22-30 65-24 77 9 10 28-8 58-45 61-37 3-58-18-49-45 3-11 8-18 17-25Z" fill="url(#furStage2)" stroke="#315580" stroke-width="2.3"/><path d="M86 74c33-8 54 10 62 38 7 25 0 31-22 22-16 9-44 8-67 0-18 7-25 0-18-20 7-21 18-34 45-40Z" fill="url(#furStage2)" stroke="#315580" stroke-width="2.3"/><path d="M75 28c8 11 17 11 25 0-1 18-7 25-13 33-7-8-12-15-12-33Z" fill="#5fd2ff" opacity=".88"/><path d="M78 45c6 6 13 6 19 0" fill="none" stroke="#5fd2ff" stroke-width="3" stroke-linecap="round"/><path d="M67 75c7 5 15 5 22 0" fill="none" stroke="#183a70" stroke-width="3" stroke-linecap="round"/><ellipse cx="99" cy="73" rx="7" ry="10" fill="url(#eyeBlue)" transform="rotate(12 99 73)"/><path d="M88 84c3 2 7 2 10-1" fill="none" stroke="#34395c" stroke-width="2" stroke-linecap="round"/><path d="M64 113c-3 14 8 20 22 14M124 130c14 4 26-5 22-21" fill="none" stroke="#315580" stroke-width="3.5" stroke-linecap="round"/><path d="M110 92c12 6 23 8 35 5M128 111c14 2 26-1 38-8" fill="none" stroke="#8ce7ff" stroke-width="4" opacity=".75" stroke-linecap="round"/></svg>`;
    return `<svg class="typetchi-stage-svg" viewBox="0 0 220 170" aria-hidden="true"><defs><linearGradient id="spiritTail" x1="116" x2="214" y1="18" y2="146" gradientUnits="userSpaceOnUse"><stop stop-color="#fbf7ff"/><stop offset=".46" stop-color="#cfefff"/><stop offset="1" stop-color="#2fc2f6"/></linearGradient><linearGradient id="robe" x1="83" x2="132" y1="65" y2="156" gradientUnits="userSpaceOnUse"><stop stop-color="#fff"/><stop offset=".58" stop-color="#eaf8ff"/><stop offset="1" stop-color="#52c8f2"/></linearGradient><linearGradient id="hair" x1="78" x2="138" y1="25" y2="145" gradientUnits="userSpaceOnUse"><stop stop-color="#ebfdff"/><stop offset=".45" stop-color="#62cde8"/><stop offset="1" stop-color="#098fca"/></linearGradient><linearGradient id="flameFill" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#74f7ff"/><stop offset=".48" stop-color="#00b8ff"/><stop offset="1" stop-color="#075ee7"/></linearGradient></defs><ellipse cx="116" cy="159" rx="72" ry="8" fill="#c8d5e8" opacity=".2"/><path class="typetchi-ribbon" d="M38 105c-31 2-25-47 10-34 28 11 8 50-26 66 37-4 67-20 83-48" fill="none" stroke="#d9c5ff" stroke-width="10" stroke-linecap="round" opacity=".28"/><path class="typetchi-ribbon" d="M132 65c35-48 91-6 55 44-19 26-51 30-82 20 35 20 67 19 95-2" fill="none" stroke="#b7eaff" stroke-width="11" stroke-linecap="round" opacity=".34"/><path d="M133 81c25-62 78-72 80-18 2 48-42 76-88 65 34-10 50-24 56-45-16 9-33 12-52 7 22-10 39-27 48-50-16 13-29 27-44 41Z" fill="url(#spiritTail)" stroke="#5ca4d4" stroke-width="1.8" opacity=".82"/><path d="M80 60 74 24l24 24Zm31-12 24-26-3 38Z" fill="#f7fdff" stroke="#214574" stroke-width="2.5" stroke-linejoin="round"/><path d="M80 61c-3 29 8 59 27 91 20-34 27-65 19-92-14-11-31-12-46 1Z" fill="url(#robe)" stroke="#315580" stroke-width="2"/><path d="M92 27c-25 27-22 74-9 118 24-9 42-47 35-89-3-16-12-25-26-29Z" fill="url(#hair)" opacity=".9"/><path d="M73 94c-19 16-27 33-35 58 19-10 34-20 51-38Zm58-4c19 16 27 35 34 61-19-10-34-23-48-40Z" fill="url(#robe)" opacity=".92" stroke="#4aa7d2" stroke-width="1.4"/><ellipse cx="101" cy="54" rx="18" ry="20" fill="#fff6f2" stroke="#315580" stroke-width="1.6"/><path d="M85 43c7-21 32-18 40 2-13-7-26-6-40-2Z" fill="url(#hair)"/><path d="M76 74c-11 11-19 20-26 31" stroke="#fff6f2" stroke-width="8" stroke-linecap="round"/><path d="M58 94c-8-5-8-17 4-22" stroke="#fff6f2" stroke-width="7" stroke-linecap="round"/><g transform="translate(40 52)">${flameSvg()}</g><path d="M95 57c3 3 7 3 10 0M110 56c4 2 8 2 11-1" fill="none" stroke="#173a70" stroke-width="2" stroke-linecap="round"/><path d="M101 66c4 3 9 3 13 0" fill="none" stroke="#7d5260" stroke-width="1.8" stroke-linecap="round"/><path d="M98 45c7 8 14 8 20 0" fill="none" stroke="#48d1ff" stroke-width="3" stroke-linecap="round"/><path d="M91 94c12 8 27 8 39 0" fill="none" stroke="#48d1ff" stroke-width="4" stroke-linecap="round" opacity=".75"/><path d="M96 151c-3 11 13 11 11 0M119 151c-3 11 13 11 10 0" fill="none" stroke="#315580" stroke-width="3" stroke-linecap="round"/></svg>`;
  }
  function createPetElement(stageId, compact = false) {
    const pet = document.createElement('div');
    pet.className = `typetchi-pet ${stageId} ${animationState}${compact ? ' compact' : ''}`;
    pet.setAttribute('role', 'img');
    pet.setAttribute('aria-label', 'Typetchi 冰藍狐靈');
    pet.innerHTML = stageSvgMarkup(stageId);
    return pet;
  }
  function render() {
    if (!appRoot) return;
    appRoot.replaceChildren();
    if (widgetState.closed) return;
    const stage = getStage(petState.totalExp);
    const nextStage = getNextStage(petState.totalExp);
    const progress = calculateStageProgress(petState.totalExp);
    const percent = progress.percentage;

    const widget = document.createElement('section');
    widget.className = 'typetchi-widget' + (widgetState.collapsed ? ' typetchi-collapsed' : '');
    widget.style.left = widgetState.x + 'px';
    widget.style.top = widgetState.y + 'px';
    widget.style.width = widgetState.width + 'px';
    widget.style.height = widgetState.height + 'px';

    const handle = document.createElement('button');
    handle.type = 'button';
    handle.className = 'typetchi-handle';
    handle.title = '展開 Typetchi';
    handle.setAttribute('aria-label', '展開 Typetchi');
    handle.addEventListener('pointerdown', startCollapsedHandleDrag);
    handle.addEventListener('click', (event) => {
      if (collapsedHandleMoved) {
        event.preventDefault();
        event.stopPropagation();
        collapsedHandleMoved = false;
        return;
      }
      toggleCollapse();
    });
    handle.append(createPetElement(stage.id, true));

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
      createButton('關閉', closeWidget),
    );
    header.append(title, controls);

    const body = document.createElement('div');
    body.className = 'typetchi-body';
    const bubble = document.createElement('div');
    bubble.className = 'typetchi-bubble' + (speechBubble.visible && speechBubble.message ? ' visible' : '');
    bubble.textContent = speechBubble.message ?? '';
    const stageArea = document.createElement('div');
    stageArea.className = 'typetchi-stage';
    const stageWrap = document.createElement('div');
    const pet = createPetElement(stage.id);
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
    const statsPanel = document.createElement('div');
    statsPanel.className = 'typetchi-stats-panel';
    statsPanel.append(
      makeRow('今日輸入', petState.todayTypedCount + ' 字', true),
      makeRow('目前速度', typingSpeedState.recentCpm + ' CPM / ' + typingSpeedState.recentWpm + ' WPM', true),
      makeRow('今日最高', typingSpeedState.todayMaxCpm + ' CPM', true),
    );
    const missionsPanel = document.createElement('div');
    missionsPanel.className = 'typetchi-missions';
    const missionHeading = document.createElement('div');
    missionHeading.className = 'typetchi-mission-heading';
    missionHeading.textContent = '今日任務';
    missionsPanel.append(missionHeading);
    ensureDailyMissionsForToday();
    dailyMissionsState.missions.forEach((mission) => {
      const item = document.createElement('div');
      item.className = 'typetchi-mission' + (mission.completed ? ' completed' : '');
      const top = document.createElement('div');
      top.className = 'typetchi-mission-line';
      const title = document.createElement('span');
      title.className = 'typetchi-mission-title';
      title.textContent = (mission.completed ? '✓ ' : '') + mission.title;
      const reward = document.createElement('span');
      reward.textContent = '+' + mission.rewardExp + ' EXP';
      top.append(title, reward);
      const bottom = document.createElement('div');
      bottom.className = 'typetchi-mission-line';
      bottom.append(document.createTextNode(mission.completed ? '已完成' : mission.progress + ' / ' + mission.targetValue), document.createTextNode(mission.rewardClaimed ? '已領取' : '未完成'));
      const track = document.createElement('div');
      track.className = 'typetchi-mission-track';
      const fill = document.createElement('span');
      fill.className = 'typetchi-mission-fill';
      fill.style.width = Math.min(100, Math.round((mission.progress / mission.targetValue) * 100)) + '%';
      track.append(fill);
      item.append(top, bottom, track);
      missionsPanel.append(item);
    });
    stats.append(
      makeRow(`Lv. ${petState.level}`, stage.name, false, true),
      makeRow('EXP', progress.isMaxStage ? '最高階段' : progress.current + ' / ' + progress.required),
      bar,
      statsPanel,
      missionsPanel,
      makeRow('下一階段', nextStage?.name ?? '已成熟', true),
    );
    body.append(bubble, stageArea, stats);
    const footer = document.createElement('footer');
    footer.className = 'typetchi-footer';
    const footerLabel = document.createElement('div');
    footerLabel.className = 'typetchi-footer-label';
    footerLabel.textContent = 'Advanced';
    const resetPetButton = createButton('重置角色進度', resetPetProgress);
    resetPetButton.className = 'subtle-danger';
    footer.append(footerLabel, resetPetButton);
    if (devToolsEnabled) {
      const devWrap = document.createElement('div');
      devWrap.className = 'typetchi-dev-tools';
      const devLabel = document.createElement('div');
      devLabel.className = 'typetchi-footer-label';
      devLabel.textContent = 'Dev only';
      const devButtons = document.createElement('div');
      devButtons.className = 'typetchi-dev-buttons';
      devButtons.append(
        createButton('+100 EXP', () => addDevExp(100)),
        createButton('Stage 2', () => addDevExp(500)),
        createButton('Stage 3', () => addDevExp(2000)),
        createButton('關閉 Dev', () => setDevToolsEnabled(false)),
      );
      devWrap.append(devLabel, devButtons);
      footer.append(devWrap);
    }
    const resize = document.createElement('span');
    resize.className = 'typetchi-resize';
    header.addEventListener('pointerdown', startDrag);
    resize.addEventListener('pointerdown', startResize);
    const toast = document.createElement('span');
    toast.className = 'typetchi-toast' + (expToast.visible ? ' visible' : '');
    toast.textContent = '+' + expToast.amount + ' EXP';
    widget.append(handle, header, body, footer, toast, resize);
    appRoot.append(widget);
  }
  function setWidget(next) {
    widgetState = normalizeWidgetState(next);
    scheduleWidgetFlush(widgetState);
    render();
  }
  function closeWidget() {
    console.log('[Typetchi] widget closed');
    setWidget({ ...widgetState, collapsed: false, closed: true });
  }

  function toggleCollapse() {
    const collapsed = !widgetState.collapsed;
    console.log(collapsed ? '[Typetchi] widget collapsed' : '[Typetchi] widget expanded');
    setWidget({ ...widgetState, collapsed, closed: false });
  }
  function addTypingExp(addedChars) {
    const today = dateKey();
    const isSameDay = petState.lastActiveDate === today;
    const todayTypedCount = isSameDay ? petState.todayTypedCount : 0;
    if (!isSameDay) typingSpeedState = { recentCpm: 0, recentWpm: 0, todayMaxCpm: 0, todayMaxWpm: 0, sessionChars: 0, sessionStartedAt: null, lastTypedAt: null };
    const previous = petState;
    const totalExp = petState.totalExp + addedChars;
    petState = { ...petState, totalExp, level: calculateLevel(totalExp), currentStage: calculateStage(totalExp, { todayMaxCpm: petState.todayMaxCpm }), todayTypedCount: todayTypedCount + addedChars, todayMaxCpm: isSameDay ? (petState.todayMaxCpm ?? 0) : 0, todayMaxWpm: isSameDay ? (petState.todayMaxWpm ?? 0) : 0, lastActiveDate: today };
    const evolved = previous.currentStage !== petState.currentStage;
    const leveledUp = previous.level < petState.level;
    playAnimation(evolved ? 'evolve' : leveledUp ? 'level_up' : 'happy');
    showExpToast(addedChars);
    if (evolved) showSpeech('evolve', true); else if (leveledUp) showSpeech('levelUp', true); else showSpeech('typing');
    schedulePetFlush(petState);
    render();
  }
  function startDrag(event) {
    if (widgetState.pinned || event.target.closest('.typetchi-controls')) return;
    const start = { x: event.clientX, y: event.clientY, left: widgetState.x, top: widgetState.y };
    const onMove = (moveEvent) => {
      const boundsWidth = widgetState.collapsed ? COLLAPSED_HANDLE_BOUNDS.width : widgetState.width;
      const boundsHeight = widgetState.collapsed ? COLLAPSED_HANDLE_BOUNDS.height : widgetState.height;
      widgetState = { ...widgetState, x: clamp(start.left + moveEvent.clientX - start.x, 8, window.innerWidth - boundsWidth - 8), y: clamp(start.top + moveEvent.clientY - start.y, 8, window.innerHeight - boundsHeight - 8) };
      scheduleWidgetFlush(widgetState);
      render();
    };
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); flushWidgetState(); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  }

  function startCollapsedHandleDrag(event) {
    const start = { x: event.clientX, y: event.clientY };
    collapsedHandleMoved = false;
    const onMove = (moveEvent) => {
      if (Math.abs(moveEvent.clientX - start.x) > 4 || Math.abs(moveEvent.clientY - start.y) > 4) collapsedHandleMoved = true;
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
    startDrag(event);
  }
  function startResize(event) {
    if (widgetState.pinned) return;
    const start = { x: event.clientX, y: event.clientY, width: widgetState.width, height: widgetState.height };
    const onMove = (moveEvent) => {
      widgetState = { ...widgetState, width: clamp(start.width + moveEvent.clientX - start.x, 240, Math.min(420, window.innerWidth - 32)), height: clamp(start.height + moveEvent.clientY - start.y, 280, Math.min(560, window.innerHeight - 32)) };
      scheduleWidgetFlush(widgetState);
      render();
    };
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); flushWidgetState(); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  }
  function handlePaste(event) {
    if (!isTrackableInput(event.target)) return;
    markPaste(event.target, Date.now());
    showPasteHint();
  }
  function handleInput(event) {
    if (!isTrackableInput(event.target)) return;
    const element = event.target;
    const addedChars = calculateAddedChars(element);
    const timestamp = Date.now();
    if (shouldIgnoreInputForExp(element, addedChars, timestamp)) {
      if (addedChars > 0) console.log('[Typetchi] typing ignored for EXP', { addedChars });
      return;
    }
    console.log('[Typetchi] typing tracked', { addedChars });
    addTypingExp(addedChars);
    updateTypingStats(addedChars, timestamp);
    updateDailyMissionProgress({ addedChars, todayTypedCount: petState.todayTypedCount, todayMaxCpm: typingSpeedState.todayMaxCpm, todaySessionCount, timestamp });
  }

  function applyRemoteState(callback) {
    isApplyingRemoteUpdate = true;
    callback();
    queueMicrotask(() => { isApplyingRemoteUpdate = false; });
  }
  function attachStorageSyncListener() {
    if (!globalThis.chrome?.storage?.onChanged) return;
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local') return;
      const petChange = changes[PET_KEY];
      if (petChange?.newValue && (petChange.newValue.updatedAt ?? 0) >= (petState.updatedAt ?? 0)) {
        applyRemoteState(() => {
          const today = dateKey();
          const remotePet = petChange.newValue;
          petState = { ...remotePet, level: calculateLevel(remotePet.totalExp), currentStage: calculateStage(remotePet.totalExp, { todayMaxCpm: remotePet.todayMaxCpm }), todayTypedCount: remotePet.lastActiveDate === today ? remotePet.todayTypedCount : 0, todayMaxCpm: remotePet.lastActiveDate === today ? (remotePet.todayMaxCpm ?? 0) : 0, todayMaxWpm: remotePet.lastActiveDate === today ? (remotePet.todayMaxWpm ?? 0) : 0, lastActiveDate: today };
          typingSpeedState = { ...typingSpeedState, todayMaxCpm: petState.todayMaxCpm, todayMaxWpm: petState.todayMaxWpm };
          render();
        });
      }
      const missionChange = changes[DAILY_MISSIONS_KEY];
      if (missionChange?.newValue && (missionChange.newValue.updatedAt ?? 0) >= (dailyMissionsState.updatedAt ?? 0)) {
        applyRemoteState(() => { dailyMissionsState = missionChange.newValue.dateKey === dateKey() ? missionChange.newValue : defaultDailyMissionsState(); render(); });
      }
      const widgetChange = changes[WIDGET_KEY];
      if (widgetChange?.newValue && (widgetChange.newValue.updatedAt ?? 0) >= (widgetState.updatedAt ?? 0)) {
        applyRemoteState(() => { widgetState = normalizeWidgetState(widgetChange.newValue); render(); });
      }
    });
  }
  function attachGlobalListeners() {
    document.addEventListener('compositionstart', () => { isComposing = true; }, true);
    document.addEventListener('compositionend', () => { isComposing = false; }, true);
    document.addEventListener('paste', handlePaste, true);
    document.addEventListener('input', handleInput, true);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushAllStorage(); });
    window.addEventListener('beforeunload', flushAllStorage);
    window.addEventListener('keydown', (event) => {
      if (!event.altKey || !event.shiftKey || event.code !== 'KeyT') return;
      setDevToolsEnabled(!devToolsEnabled);
    });
  }
  function loadStorageAndRender() {
    Promise.all([storageGet(PET_KEY, defaultPetState()), storageGet(WIDGET_KEY, defaultWidgetState()), storageGet(DAILY_MISSIONS_KEY, defaultDailyMissionsState())]).then(([storedPet, storedWidget, storedMissions]) => {
      const today = dateKey();
      petState = { ...storedPet, level: calculateLevel(storedPet.totalExp), currentStage: calculateStage(storedPet.totalExp, { todayMaxCpm: storedPet.todayMaxCpm }), todayTypedCount: storedPet.lastActiveDate === today ? storedPet.todayTypedCount : 0, todayMaxCpm: storedPet.lastActiveDate === today ? (storedPet.todayMaxCpm ?? 0) : 0, todayMaxWpm: storedPet.lastActiveDate === today ? (storedPet.todayMaxWpm ?? 0) : 0, lastActiveDate: today };
      typingSpeedState = { ...typingSpeedState, todayMaxCpm: petState.todayMaxCpm, todayMaxWpm: petState.todayMaxWpm };
      widgetState = normalizeWidgetState(storedWidget);
      dailyMissionsState = storedMissions.dateKey === today ? storedMissions : defaultDailyMissionsState(today);
      if (storedMissions.dateKey !== today) scheduleDailyMissionsFlush(dailyMissionsState);
      console.log('[Typetchi] storage loaded');
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
    attachStorageSyncListener();
    loadStorageAndRender();
    window.setTimeout(() => { console.log('[Typetchi] delayed ensure root 1000ms'); ensureTypetchiRoot(); }, 1000);
    window.setTimeout(() => { console.log('[Typetchi] delayed ensure root 3000ms'); ensureTypetchiRoot(); }, 3000);
    window.setTimeout(() => { console.log('[Typetchi] delayed ensure root 5000ms'); ensureTypetchiRoot(); }, 5000);
    window.addEventListener('load', () => { console.log('[Typetchi] window loaded, ensure root'); ensureTypetchiRoot(); }, { once: true });
  }

  if (document.body) startTypetchi();
  else window.addEventListener('DOMContentLoaded', startTypetchi, { once: true });
})();

