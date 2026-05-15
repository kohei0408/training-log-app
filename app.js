const muscles = ["胸", "背中", "肩", "二頭", "三頭", "腹筋", "脚", "その他"];
const exerciseCatalog = {
  胸: ["ベンチプレス", "インクラインベンチプレス", "ダンベルプレス", "ダンベルフライ", "チェストプレス", "ケーブルクロスオーバー", "腕立て伏せ"],
  背中: ["ラットプルダウン", "懸垂", "シーテッドロー", "ベントオーバーロー", "ワンハンドロー", "デッドリフト", "バックエクステンション"],
  肩: ["ショルダープレス", "サイドレイズ", "フロントレイズ", "リアレイズ", "アップライトロー", "フェイスプル", "アーノルドプレス"],
  二頭: ["バーベルカール", "ダンベルカール", "ハンマーカール", "インクラインカール", "プリーチャーカール", "ケーブルカール"],
  三頭: ["トライセプスプレスダウン", "スカルクラッシャー", "フレンチプレス", "ナローベンチプレス", "ディップス", "キックバック"],
  腹筋: ["クランチ", "レッグレイズ", "アブローラー", "プランク", "ケーブルクランチ", "ロシアンツイスト", "サイドプランク"],
  脚: ["スクワット", "レッグプレス", "ルーマニアンデッドリフト", "レッグエクステンション", "レッグカール", "カーフレイズ", "ランジ"],
  その他: ["有酸素", "ストレッチ", "HIIT", "ファーマーズウォーク", "ケトルベルスイング", "自重トレーニング"],
};

const storageKey = "training-log-records-v2";
const legacyStorageKey = "training-log-records-v1";
const bookmarkKey = "training-log-bookmarks-v1";
const today = new Date();

let records = normalizeRecords(loadRecords());
let bookmarks = loadBookmarks();
let calendarDate = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDate = toDateKey(today);
let activeMuscle = "";
let draftSets = [];
let editingDate = "";
let editingMode = false;

const elements = {
  homeView: document.querySelector("#homeView"),
  analysisView: document.querySelector("#analysisView"),
  calendarGrid: document.querySelector("#calendarGrid"),
  calendarMonth: document.querySelector("#calendarMonth"),
  selectedDateLabel: document.querySelector("#selectedDateLabel"),
  dailyTitle: document.querySelector("#dailyTitle"),
  dailySummary: document.querySelector("#dailySummary"),
  dailyLogList: document.querySelector("#dailyLogList"),
  editDailyButton: document.querySelector("#editDailyButton"),
  streakCount: document.querySelector("#streakCount"),
  dialog: document.querySelector("#workoutDialog"),
  dialogTitle: document.querySelector("#dialogTitle"),
  startStep: document.querySelector("#startStep"),
  muscleStep: document.querySelector("#muscleStep"),
  exerciseStep: document.querySelector("#exerciseStep"),
  entryStep: document.querySelector("#entryStep"),
  copyList: document.querySelector("#copyList"),
  muscleGrid: document.querySelector("#muscleGrid"),
  exerciseMuscleTitle: document.querySelector("#exerciseMuscleTitle"),
  exerciseSearchInput: document.querySelector("#exerciseSearchInput"),
  bookmarkExerciseList: document.querySelector("#bookmarkExerciseList"),
  bookmarkCount: document.querySelector("#bookmarkCount"),
  exerciseList: document.querySelector("#exerciseList"),
  exerciseListTitle: document.querySelector("#exerciseListTitle"),
  sessionTitle: document.querySelector("#sessionTitle"),
  sessionSummary: document.querySelector("#sessionSummary"),
  currentWorkoutList: document.querySelector("#currentWorkoutList"),
  finishWorkoutButton: document.querySelector("#finishWorkoutButton"),
  totalSessions: document.querySelector("#totalSessions"),
  totalSets: document.querySelector("#totalSets"),
  totalVolume: document.querySelector("#totalVolume"),
  volumeChart: document.querySelector("#volumeChart"),
  muscleChart: document.querySelector("#muscleChart"),
};

document.querySelector("#startWorkoutButton").addEventListener("click", openWorkoutDialog);
document.querySelector("#closeDialogButton").addEventListener("click", closeWorkoutDialog);
document.querySelector("#chooseWorkoutButton").addEventListener("click", () => showStep("muscleStep"));
document.querySelector("#copyWorkoutButton").addEventListener("click", renderCopyList);
document.querySelector("#backToStartButton").addEventListener("click", () => showStep("startStep"));
document.querySelector("#backToMuscleButton").addEventListener("click", () => showStep("muscleStep"));
document.querySelector("#addAnotherButton").addEventListener("click", () => showStep("muscleStep"));
document.querySelector("#finishWorkoutButton").addEventListener("click", finishWorkout);
document.querySelector("#prevMonthButton").addEventListener("click", () => changeMonth(-1));
document.querySelector("#nextMonthButton").addEventListener("click", () => changeMonth(1));
elements.editDailyButton.addEventListener("click", openEditDialog);
elements.exerciseSearchInput.addEventListener("input", renderExerciseLists);

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab-button").forEach((tab) => tab.classList.remove("active"));
    document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
    button.classList.add("active");
    document.querySelector(`#${button.dataset.view}`).classList.add("active");
    renderAnalysis();
  });
});

elements.muscleGrid.innerHTML = muscles
  .map((muscle) => `<button class="muscle-button" type="button" data-muscle="${muscle}">${muscle}</button>`)
  .join("");

elements.muscleGrid.querySelectorAll("button").forEach((button) => {
  button.addEventListener("click", () => {
    activeMuscle = button.dataset.muscle;
    elements.exerciseSearchInput.value = "";
    elements.exerciseMuscleTitle.textContent = `${activeMuscle}の種目選択`;
    elements.exerciseListTitle.textContent = `${activeMuscle}の種目`;
    renderExerciseLists();
    showStep("exerciseStep");
    elements.exerciseSearchInput.focus();
  });
});

renderAll();
registerServiceWorker();

function loadRecords() {
  const saved = localStorage.getItem(storageKey);
  if (saved) return JSON.parse(saved);
  const legacySaved = localStorage.getItem(legacyStorageKey);
  if (legacySaved) return JSON.parse(legacySaved);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(today.getDate() - 3);

  return {
    [toDateKey(yesterday)]: [
      { muscle: "胸", exercise: "ベンチプレス", weight: 60, reps: 10, done: true },
      { muscle: "胸", exercise: "ベンチプレス", weight: 62.5, reps: 8, done: true },
      { muscle: "三頭", exercise: "トライセプスプレスダウン", weight: 25, reps: 12, done: true },
    ],
    [toDateKey(threeDaysAgo)]: [
      { muscle: "背中", exercise: "ラットプルダウン", weight: 55, reps: 10, done: true },
      { muscle: "二頭", exercise: "ダンベルカール", weight: 18, reps: 12, done: true },
    ],
  };
}

function normalizeRecords(source) {
  return Object.fromEntries(
    Object.entries(source || {}).map(([dateKey, sets]) => [
      dateKey,
      (sets || []).map((set) => normalizeSet(set)),
    ]),
  );
}

function normalizeSet(set) {
  return {
    muscle: set.muscle || "その他",
    exercise: set.exercise || set.muscle || "未設定",
    weight: set.weight ?? "",
    reps: set.reps ?? "",
    done: set.done ?? true,
  };
}

function loadBookmarks() {
  const saved = localStorage.getItem(bookmarkKey);
  if (saved) return JSON.parse(saved);
  return {
    胸: ["ベンチプレス"],
    背中: ["ラットプルダウン"],
    肩: [],
    二頭: [],
    三頭: [],
    腹筋: [],
    脚: ["スクワット"],
    その他: [],
  };
}

function saveRecords() {
  localStorage.setItem(storageKey, JSON.stringify(records));
}

function saveBookmarks() {
  localStorage.setItem(bookmarkKey, JSON.stringify(bookmarks));
}

function renderAll() {
  renderCalendar();
  renderDailyLog();
  renderAnalysis();
  elements.streakCount.textContent = calculateStreak();
}

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());
  elements.calendarMonth.textContent = `${year}年 ${month + 1}月`;
  elements.calendarGrid.innerHTML = "";

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const dateKey = toDateKey(date);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "date-button";
    button.textContent = date.getDate();
    button.setAttribute("aria-label", formatDate(dateKey));

    if (date.getMonth() !== month) button.classList.add("outside");
    if (dateKey === toDateKey(today)) button.classList.add("today");
    if (dateKey === selectedDate) button.classList.add("selected");
    if (records[dateKey]?.length) {
      const stamp = document.createElement("span");
      stamp.className = "stamp";
      button.appendChild(stamp);
    }

    button.addEventListener("click", () => {
      selectedDate = dateKey;
      if (date.getMonth() !== calendarDate.getMonth()) {
        calendarDate = new Date(date.getFullYear(), date.getMonth(), 1);
      }
      renderCalendar();
      renderDailyLog();
    });

    elements.calendarGrid.appendChild(button);
  }
}

function renderDailyLog() {
  const sets = records[selectedDate] || [];
  elements.selectedDateLabel.textContent = `${formatDate(selectedDate)} の記録`;
  elements.dailyTitle.textContent = formatDate(selectedDate);

  if (!sets.length) {
    elements.dailySummary.textContent = "記録はまだありません";
    elements.editDailyButton.hidden = true;
    elements.dailyLogList.classList.add("empty-state");
    elements.dailyLogList.innerHTML = "この日のトレーニングは未記録です";
    return;
  }

  const completed = getCompletedSets(sets);
  const volume = completed.reduce((sum, set) => sum + Number(set.weight) * Number(set.reps), 0);
  elements.editDailyButton.hidden = false;
  elements.dailySummary.textContent = `${completed.length}/${sets.length}セット完了 / ${formatNumber(volume)}kg`;
  elements.dailyLogList.classList.remove("empty-state");
  elements.dailyLogList.innerHTML = renderExerciseGroups(sets, { editable: false });
}

function renderAnalysis() {
  const entries = Object.entries(records)
    .filter(([, sets]) => sets.length)
    .sort(([a], [b]) => a.localeCompare(b));
  const allSets = entries.flatMap(([, sets]) => getCompletedSets(sets));
  const totalVolume = allSets.reduce((sum, set) => sum + Number(set.weight) * Number(set.reps), 0);

  elements.totalSessions.textContent = entries.length;
  elements.totalSets.textContent = allSets.length;
  elements.totalVolume.textContent = `${formatNumber(totalVolume)}kg`;
  renderVolumeChart(entries.slice(-7));
  renderMuscleChart(allSets);
}

function renderExerciseLists() {
  const query = elements.exerciseSearchInput.value.trim().toLowerCase();
  const muscleBookmarks = bookmarks[activeMuscle] || [];
  const allExercises = exerciseCatalog[activeMuscle] || [];
  const filteredExercises = allExercises.filter((exercise) => exercise.toLowerCase().includes(query));
  const filteredBookmarks = muscleBookmarks.filter((exercise) => exercise.toLowerCase().includes(query));

  elements.bookmarkCount.textContent = `${muscleBookmarks.length}件`;
  elements.bookmarkExerciseList.innerHTML = filteredBookmarks.length
    ? filteredBookmarks.map(renderExerciseButton).join("")
    : `<div class="empty-state compact-empty">保存した種目はありません</div>`;
  elements.exerciseList.innerHTML = filteredExercises.length
    ? filteredExercises.map(renderExerciseButton).join("")
    : `<div class="empty-state compact-empty">該当する種目がありません</div>`;

  document.querySelectorAll(".exercise-select").forEach((button) => {
    button.addEventListener("click", () => selectExercise(button.dataset.exercise));
  });
  document.querySelectorAll(".bookmark-button").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleBookmark(button.dataset.exercise);
    });
  });
}

function renderExerciseButton(exercise) {
  const bookmarked = (bookmarks[activeMuscle] || []).includes(exercise);
  return `
    <div class="exercise-row">
      <button class="exercise-button exercise-select" type="button" data-exercise="${escapeAttribute(exercise)}">
        <strong>${escapeHtml(exercise)}</strong>
      </button>
      <button class="bookmark-button ${bookmarked ? "bookmarked" : ""}" type="button" data-exercise="${escapeAttribute(exercise)}" aria-label="${escapeAttribute(exercise)}のブックマークを切り替え">★</button>
    </div>
  `;
}

function selectExercise(exercise) {
  addExerciseToDraft(activeMuscle, exercise);
  renderDraftSets();
  showStep("entryStep");
}

function addExerciseToDraft(muscle, exercise) {
  const exists = draftSets.some((set) => set.muscle === muscle && set.exercise === exercise);
  if (!exists) {
    draftSets.push(createBlankSet(muscle, exercise));
  }
}

function createBlankSet(muscle, exercise, previousSet = {}) {
  return {
    muscle,
    exercise,
    weight: previousSet.weight ?? "",
    reps: previousSet.reps ?? "",
    done: false,
  };
}

function toggleBookmark(exercise) {
  const list = bookmarks[activeMuscle] || [];
  bookmarks[activeMuscle] = list.includes(exercise)
    ? list.filter((item) => item !== exercise)
    : [...list, exercise];
  saveBookmarks();
  renderExerciseLists();
}

function renderVolumeChart(entries) {
  if (!entries.length) {
    elements.volumeChart.innerHTML = `<div class="empty-state">記録後にグラフを表示します</div>`;
    return;
  }

  const volumes = entries.map(([dateKey, sets]) => ({
    dateKey,
    volume: getCompletedSets(sets).reduce((sum, set) => sum + Number(set.weight) * Number(set.reps), 0),
  }));
  const maxVolume = Math.max(...volumes.map((item) => item.volume), 1);

  elements.volumeChart.innerHTML = volumes
    .map((item) => {
      const height = Math.max((item.volume / maxVolume) * 130, 8);
      return `
        <div class="bar">
          <div class="bar-fill" style="height: ${height}px"></div>
          <small>${shortDate(item.dateKey)}</small>
          <small>${formatNumber(item.volume)}</small>
        </div>
      `;
    })
    .join("");
}

function renderMuscleChart(allSets) {
  if (!allSets.length) {
    elements.muscleChart.innerHTML = `<div class="empty-state">部位別セット数がここに入ります</div>`;
    return;
  }

  const counts = muscles.map((muscle) => ({
    muscle,
    count: allSets.filter((set) => set.muscle === muscle).length,
  }));
  const maxCount = Math.max(...counts.map((item) => item.count), 1);

  elements.muscleChart.innerHTML = counts
    .map((item) => `
      <div class="muscle-row">
        <small>${item.muscle}</small>
        <div class="track"><span style="width: ${(item.count / maxCount) * 100}%"></span></div>
        <small>${item.count}</small>
      </div>
    `)
    .join("");
}

function renderCopyList() {
  const pastEntries = Object.entries(records)
    .filter(([dateKey, sets]) => dateKey !== toDateKey(today) && sets.length)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 5);

  if (!pastEntries.length) {
    elements.copyList.innerHTML = `<div class="empty-state">コピーできる過去記録がありません</div>`;
    return;
  }

  elements.copyList.innerHTML = pastEntries
    .map(([dateKey, sets]) => `
      <button class="choice-button copy-entry" type="button" data-date="${dateKey}">
        <strong>${formatDate(dateKey)}</strong>
        <span>${sets.length}セットを今日にコピー</span>
      </button>
    `)
    .join("");

  elements.copyList.querySelectorAll(".copy-entry").forEach((button) => {
    button.addEventListener("click", () => {
      draftSets = cloneSets(records[button.dataset.date]);
      editingDate = toDateKey(today);
      editingMode = false;
      prepareEntryStep("コピーしたトレーニング", "内容を調整して今日の記録として保存");
      renderDraftSets();
      showStep("entryStep");
    });
  });
}

function openWorkoutDialog() {
  draftSets = [];
  activeMuscle = "";
  editingDate = toDateKey(today);
  editingMode = false;
  elements.copyList.innerHTML = "";
  elements.dialogTitle.textContent = "トレーニングを開始";
  prepareEntryStep("今日のトレーニング", "種目ごとにセットを記録");
  renderDraftSets();
  showStep("startStep");
  elements.dialog.showModal();
}

function openEditDialog() {
  const sets = records[selectedDate] || [];
  if (!sets.length) return;

  draftSets = cloneSets(sets);
  activeMuscle = "";
  editingDate = selectedDate;
  editingMode = true;
  elements.copyList.innerHTML = "";
  elements.dialogTitle.textContent = "記録を編集";
  prepareEntryStep(`${formatDate(selectedDate)}の記録`, "保存済みセットを編集");
  renderDraftSets();
  showStep("entryStep");
  elements.dialog.showModal();
}

function prepareEntryStep(title, summary) {
  elements.sessionTitle.textContent = title;
  elements.sessionSummary.textContent = summary;
  elements.finishWorkoutButton.textContent = editingMode ? "編集を保存" : "トレーニング完了";
}

function closeWorkoutDialog() {
  elements.dialog.close();
}

function showStep(stepId) {
  [elements.startStep, elements.muscleStep, elements.exerciseStep, elements.entryStep].forEach((step) => {
    step.classList.toggle("active", step.id === stepId);
  });
}

function renderDraftSets() {
  if (!draftSets.length) {
    elements.currentWorkoutList.classList.add("empty-state");
    elements.currentWorkoutList.innerHTML = "種目を追加するとセット表が表示されます";
    return;
  }

  elements.currentWorkoutList.classList.remove("empty-state");
  elements.currentWorkoutList.innerHTML = renderExerciseGroups(draftSets, { editable: true });
  bindWorkoutBuilderEvents();
}

function renderExerciseGroups(sets, { editable }) {
  return groupSets(sets)
    .map((group, groupIndex) => `
      <article class="exercise-card">
        <div class="exercise-card-header">
          <strong>${groupIndex + 1}｜${escapeHtml(group.muscle)}｜${escapeHtml(group.exercise)}</strong>
        </div>
        <div class="set-table" role="table" aria-label="${escapeAttribute(group.exercise)}のセット">
          <div class="set-row set-row-head" role="row">
            <span>セット</span>
            <span>重量(kg)</span>
            <span>レップ数</span>
            <span>完了</span>
          </div>
          ${group.items.map((item, setIndex) => renderSetRow(item, setIndex + 1, editable)).join("")}
        </div>
        ${editable ? `
          <div class="set-actions">
            <button class="secondary-action danger-action remove-set-button" type="button" data-group="${escapeAttribute(group.key)}">セット削除</button>
            <button class="secondary-action add-set-button" type="button" data-group="${escapeAttribute(group.key)}">セット追加</button>
          </div>
        ` : ""}
      </article>
    `)
    .join("");
}

function renderSetRow(item, setNumber, editable) {
  const set = item.set;
  if (!editable) {
    return `
      <div class="set-row" role="row">
        <span>${setNumber}</span>
        <span>${escapeHtml(String(set.weight))}</span>
        <span>${escapeHtml(String(set.reps))}</span>
        <span class="done-state ${set.done ? "done" : ""}">${set.done ? "✓" : "未"}</span>
      </div>
    `;
  }

  return `
    <div class="set-row" role="row">
      <span>${setNumber}</span>
      <input class="set-input" data-index="${item.index}" data-field="weight" min="0" step="0.5" type="number" inputmode="decimal" value="${escapeAttribute(set.weight)}" aria-label="${setNumber}セット目の重量" />
      <input class="set-input" data-index="${item.index}" data-field="reps" min="1" step="1" type="number" inputmode="numeric" value="${escapeAttribute(set.reps)}" aria-label="${setNumber}セット目のレップ数" />
      <button class="done-toggle ${set.done ? "done" : ""}" type="button" data-index="${item.index}" aria-pressed="${set.done}">${set.done ? "✓" : ""}</button>
    </div>
  `;
}

function bindWorkoutBuilderEvents() {
  elements.currentWorkoutList.querySelectorAll(".set-input").forEach((input) => {
    input.addEventListener("input", () => {
      const set = draftSets[Number(input.dataset.index)];
      if (set) set[input.dataset.field] = input.value;
    });
  });

  elements.currentWorkoutList.querySelectorAll(".done-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const set = draftSets[Number(button.dataset.index)];
      if (!set) return;
      set.done = !set.done;
      button.classList.toggle("done", set.done);
      button.textContent = set.done ? "✓" : "";
      button.setAttribute("aria-pressed", String(set.done));
    });
  });

  elements.currentWorkoutList.querySelectorAll(".add-set-button").forEach((button) => {
    button.addEventListener("click", () => {
      const group = findGroupByKey(button.dataset.group);
      if (!group) return;
      const lastSet = group.items[group.items.length - 1]?.set;
      draftSets.push(createBlankSet(group.muscle, group.exercise, lastSet));
      renderDraftSets();
    });
  });

  elements.currentWorkoutList.querySelectorAll(".remove-set-button").forEach((button) => {
    button.addEventListener("click", () => {
      const group = findGroupByKey(button.dataset.group);
      if (!group) return;
      const lastItem = group.items[group.items.length - 1];
      draftSets.splice(lastItem.index, 1);
      renderDraftSets();
    });
  });
}

function finishWorkout() {
  const savedSets = draftSets
    .filter((set) => set.weight !== "" && set.reps !== "")
    .map((set) => ({
      muscle: set.muscle,
      exercise: set.exercise,
      weight: Number(set.weight),
      reps: Number(set.reps),
      done: Boolean(set.done),
    }));

  if (!savedSets.length) {
    if (!editingMode) return;
    delete records[editingDate];
    saveRecords();
    closeWorkoutDialog();
    draftSets = [];
    renderAll();
    return;
  }

  records[editingDate] = editingMode ? savedSets : [...(records[editingDate] || []), ...savedSets];
  selectedDate = editingDate;
  const [year, month] = editingDate.split("-").map(Number);
  calendarDate = new Date(year, month - 1, 1);
  saveRecords();
  closeWorkoutDialog();
  draftSets = [];
  renderAll();
}

function groupSets(sets) {
  const map = new Map();
  sets.forEach((set, index) => {
    const key = `${set.muscle}::${set.exercise}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        muscle: set.muscle,
        exercise: set.exercise,
        items: [],
      });
    }
    map.get(key).items.push({ set, index });
  });
  return [...map.values()];
}

function findGroupByKey(key) {
  return groupSets(draftSets).find((group) => group.key === key);
}

function getCompletedSets(sets) {
  return (sets || []).filter((set) => set.done !== false && set.weight !== "" && set.reps !== "");
}

function cloneSets(sets) {
  return (sets || []).map((set) => ({ ...normalizeSet(set) }));
}

function changeMonth(direction) {
  calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + direction, 1);
  renderCalendar();
}

function calculateStreak() {
  let streak = 0;
  const cursor = new Date(today);

  while (records[toDateKey(cursor)]?.length) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(dateKey) {
  const [, month, day] = dateKey.split("-");
  return `${Number(month)}月${Number(day)}日`;
}

function shortDate(dateKey) {
  const [, month, day] = dateKey.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 1 }).format(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}
