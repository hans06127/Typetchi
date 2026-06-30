const WIDGET_KEY = 'typetchi.widgetState';
const statusEl = document.getElementById('status');
const showButton = document.getElementById('showTypetchi');

async function readWidgetState() {
  const result = await chrome.storage.local.get(WIDGET_KEY);
  return result[WIDGET_KEY] && typeof result[WIDGET_KEY] === 'object' ? result[WIDGET_KEY] : {};
}

async function refreshStatus() {
  const state = await readWidgetState();
  statusEl.textContent = state.closed ? 'Typetchi 目前已關閉。' : 'Typetchi 目前可見或已收合。';
}

async function showTypetchi() {
  showButton.disabled = true;
  statusEl.textContent = '正在顯示 Typetchi...';
  const state = await readWidgetState();
  await chrome.storage.local.set({
    [WIDGET_KEY]: {
      ...state,
      closed: false,
      collapsed: false,
      updatedAt: Date.now(),
    },
  });
  statusEl.textContent = 'Typetchi 已顯示。';
  showButton.disabled = false;
}

showButton.addEventListener('click', () => {
  void showTypetchi();
});

void refreshStatus();
