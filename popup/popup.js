const WIDGET_KEY = 'typetchi.widgetState';
const PET_KEY = 'typetchi.petState';
const MISSIONS_KEY = 'typetchi.dailyMissions';
const statusEl = document.getElementById('status');
const showButton = document.getElementById('showTypetchi');
const levelStageEl = document.getElementById('levelStage');
const todayTypedEl = document.getElementById('todayTyped');
const missionsEl = document.getElementById('missions');

const STAGES = [
  { name: '幼年期', requiredExp: 0 },
  { name: '成長期', requiredExp: 500 },
  { name: '成熟期', requiredExp: 2000 },
];

async function readState() {
  const result = await chrome.storage.local.get([WIDGET_KEY, PET_KEY, MISSIONS_KEY]);
  return {
    widget: result[WIDGET_KEY] && typeof result[WIDGET_KEY] === 'object' ? result[WIDGET_KEY] : {},
    pet: result[PET_KEY] && typeof result[PET_KEY] === 'object' ? result[PET_KEY] : {},
    missions: result[MISSIONS_KEY] && typeof result[MISSIONS_KEY] === 'object' ? result[MISSIONS_KEY] : {},
  };
}

function stageNameFor(pet) {
  const totalExp = Number(pet.totalExp ?? 0);
  return [...STAGES].reverse().find((stage) => totalExp >= stage.requiredExp)?.name ?? STAGES[0].name;
}

async function refreshStatus() {
  const { widget, pet, missions } = await readState();
  const visibleText = widget.closed ? 'Typetchi 目前已關閉，可從這裡重新顯示。' : widget.collapsed ? 'Typetchi 目前已收合，頁面上會保留 handle。' : 'Typetchi 目前顯示中。';
  statusEl.textContent = visibleText;
  levelStageEl.textContent = `Lv. ${pet.level ?? 1} / ${stageNameFor(pet)}`;
  todayTypedEl.textContent = `${pet.todayTypedCount ?? 0} 字`;
  const list = Array.isArray(missions.missions) ? missions.missions : [];
  const completed = list.filter((mission) => mission.completed).length;
  missionsEl.textContent = list.length ? `${completed} / ${list.length} 完成` : '準備中';
}

async function showTypetchi() {
  showButton.disabled = true;
  statusEl.textContent = '正在顯示 Typetchi...';
  const { widget } = await readState();
  await chrome.storage.local.set({
    [WIDGET_KEY]: {
      ...widget,
      closed: false,
      collapsed: false,
      updatedAt: Date.now(),
    },
  });
  showButton.disabled = false;
  await refreshStatus();
}

showButton.addEventListener('click', () => {
  void showTypetchi();
});

void refreshStatus();
