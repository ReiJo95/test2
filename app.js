'use strict';

/* ==========================================================
   Familien-Zentrale – Logik
   Alle Daten liegen im localStorage dieses Browsers.
   ========================================================== */

const STORAGE_KEY = 'familienZentrale.v1';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_CHIPS = 2;

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const WEEKDAYS_LONG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const WEEKDAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const PEOPLE = ['mama', 'papa', 'beide'];

/* ---------- Hilfsfunktionen ---------- */

const $ = (id) => document.getElementById(id);

function emptyData() {
  return { events: [], notes: [], tasks: [], meals: {}, shopping: [] };
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw);
    const data = Object.assign(emptyData(), parsed);
    // Falls etwas kaputt gespeichert wurde, mit leeren Werten weitermachen
    for (const key of ['events', 'notes', 'tasks', 'shopping']) {
      if (!Array.isArray(data[key])) data[key] = [];
    }
    if (typeof data.meals !== 'object' || data.meals === null || Array.isArray(data.meals)) data.meals = {};
    return data;
  } catch (e) {
    return emptyData();
  }
}

let storageWarned = false;
function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    if (!storageWarned) {
      storageWarned = true;
      showToast('Achtung: Speichern klappt in diesem Browser nicht!');
    }
  }
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Datum -> "2026-11-13" (lokale Zeit) */
function toKey(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** "2026-11-13" -> Datum (lokale Zeit) */
function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(d, n) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

/** Montag = 0 … Sonntag = 6 */
function weekdayIndex(d) {
  return (d.getDay() + 6) % 7;
}

function mondayOf(d) {
  return addDays(d, -weekdayIndex(d));
}

/** Kalenderwoche nach ISO 8601 */
function isoWeek(d) {
  const thursday = addDays(d, 3 - weekdayIndex(d));
  const firstThursday = new Date(thursday.getFullYear(), 0, 4);
  const diffDays = Math.round((thursday - mondayOf(firstThursday)) / 86400000);
  return 1 + Math.floor(diffDays / 7);
}

function shortDate(d) {
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}

function longDate(d) {
  return `${WEEKDAYS_LONG[weekdayIndex(d)]}, ${d.getDate()}. ${MONTHS[d.getMonth()]}`;
}

/** Kleines Helferlein zum Bauen von HTML-Elementen (sicher, ohne innerHTML) */
function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value);
  }
  for (const child of children) {
    if (child != null) node.append(child);
  }
  return node;
}

/* ---------- Zustand ---------- */

let data = loadData();
let todayKey = toKey(new Date());

const calState = {
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  selected: todayKey,
};

let weekOffset = 0;

/* ---------- Hinweis-Blase mit "Rückgängig" ---------- */

let toastTimer = null;
let toastUndo = null;

function showToast(message, undoFn) {
  const toast = $('toast');
  $('toast-text').textContent = message;
  toastUndo = undoFn || null;
  $('toast-undo').hidden = !undoFn;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 6000);
}

function hideToast() {
  $('toast').hidden = true;
  toastUndo = null;
}

$('toast-undo').addEventListener('click', () => {
  if (toastUndo) toastUndo();
  hideToast();
});

/* ---------- Kopfbereich ---------- */

function renderHeader() {
  $('today-text').textContent = `Heute ist ${longDate(new Date())}!`;
}

/** Comic-Stern hinter dem Titel ausrechnen */
function drawBurst() {
  const spikes = 16;
  const wobble = [0, 3, -2, 4, -3, 1, 2, -4, 3, -1, 4, -2, 1, -3, 2, -1];
  const points = [];
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (Math.PI * 2 * i) / (spikes * 2) - Math.PI / 2;
    const r = i % 2 === 0 ? 48 + wobble[(i / 2) % spikes] * 0.5 : 35;
    const x = 50 + r * Math.cos(angle);
    const y = 50 + r * Math.sin(angle);
    points.push(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
  }
  document.querySelector('.burst').style.clipPath = `polygon(${points.join(', ')})`;
}

/* ---------- Kalender ---------- */

function eventsByDate() {
  const map = new Map();
  for (const ev of data.events) {
    if (!map.has(ev.date)) map.set(ev.date, []);
    map.get(ev.date).push(ev);
  }
  // Ganztägige Termine zuerst, dann nach Uhrzeit
  for (const list of map.values()) {
    list.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }
  return map;
}

function renderCalendar() {
  const { year, month } = calState;
  $('cal-title').textContent = `${MONTHS[month]} ${year}`;

  const byDate = eventsByDate();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = weekdayIndex(first);
  const cellCount = Math.ceil((offset + daysInMonth) / 7) * 7;
  const start = addDays(first, -offset);

  const grid = $('cal-grid');
  grid.replaceChildren();

  for (let i = 0; i < cellCount; i++) {
    const day = addDays(start, i);
    const key = toKey(day);
    const events = byDate.get(key) || [];

    const classes = ['cal-day'];
    if (day.getMonth() !== month) classes.push('other-month');
    if (weekdayIndex(day) >= 5) classes.push('weekend');
    if (key === todayKey) classes.push('today');
    if (key === calState.selected) classes.push('selected');

    const label = `${longDate(day)}, ${events.length === 0 ? 'keine Termine' : events.length === 1 ? '1 Termin' : events.length + ' Termine'}`;

    const cell = el('button', {
      type: 'button',
      class: classes.join(' '),
      'aria-label': label,
      'aria-pressed': key === calState.selected ? 'true' : 'false',
      onclick: () => selectDay(key),
    }, el('span', { class: 'day-num', text: String(day.getDate()) }));

    events.slice(0, MAX_CHIPS).forEach((ev) => {
      cell.append(el('span', {
        class: 'chip',
        title: (ev.time ? ev.time + ' ' : '') + ev.title,
        text: (ev.time ? ev.time + ' ' : '') + ev.title,
      }));
    });
    if (events.length > MAX_CHIPS) {
      cell.append(el('span', { class: 'chip-more', text: `+${events.length - MAX_CHIPS} mehr` }));
    }

    grid.append(cell);
  }

  renderDayList(byDate);
}

function renderDayList(byDate = eventsByDate()) {
  const day = fromKey(calState.selected);
  $('cal-day-title').textContent = calState.selected === todayKey
    ? `Heute, ${day.getDate()}. ${MONTHS[day.getMonth()]}`
    : longDate(day);

  const list = $('cal-day-list');
  list.replaceChildren();
  const events = byDate.get(calState.selected) || [];

  if (events.length === 0) {
    list.append(el('li', { class: 'empty', text: 'Keine Termine an diesem Tag.' }));
    return;
  }
  for (const ev of events) {
    list.append(el('li', {},
      el('span', { class: 'time', text: ev.time || 'ganztags' }),
      el('span', { text: ev.title }),
    ));
  }
}

function selectDay(key) {
  calState.selected = key;
  const d = fromKey(key);
  calState.year = d.getFullYear();
  calState.month = d.getMonth();
  $('cal-date').value = key;
  renderCalendar();
}

function changeMonth(step) {
  const d = new Date(calState.year, calState.month + step, 1);
  calState.year = d.getFullYear();
  calState.month = d.getMonth();
  renderCalendar();
}

$('cal-prev').addEventListener('click', () => changeMonth(-1));
$('cal-next').addEventListener('click', () => changeMonth(1));
$('cal-today').addEventListener('click', () => selectDay(todayKey));
$('cal-date').addEventListener('change', (e) => {
  if (e.target.value) selectDay(e.target.value);
});

$('cal-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const date = $('cal-date').value;
  const title = $('cal-text').value.trim();
  if (!date || !title) return;
  data.events.push({ id: newId(), date, time: $('cal-time').value, title });
  saveData();
  $('cal-text').value = '';
  $('cal-time').value = '';
  selectDay(date);
  showToast('Termin eingetragen!');
});

/* ---------- Notizen ---------- */

function renderNotes() {
  const list = $('note-list');
  list.replaceChildren();
  if (data.notes.length === 0) {
    list.append(el('li', { class: 'empty-msg', text: 'Alles im Kopf! Keine Notizen.' }));
    return;
  }
  data.notes.forEach((note, index) => {
    list.append(el('li', { class: 'note' },
      el('span', { class: 'note-text', text: note.text }),
      el('button', {
        type: 'button',
        class: 'check',
        'aria-label': `Erledigt: ${note.text}`,
        title: 'Erledigt',
        onclick: () => {
          const [removed] = data.notes.splice(index, 1);
          saveData();
          renderNotes();
          showToast('Notiz erledigt!', () => {
            data.notes.splice(Math.min(index, data.notes.length), 0, removed);
            saveData();
            renderNotes();
          });
        },
      }),
    ));
  });
}

$('note-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const text = $('note-text').value.trim();
  if (!text) return;
  data.notes.push({ id: newId(), text });
  saveData();
  $('note-text').value = '';
  renderNotes();
});

/* ---------- Aufgaben ---------- */

function renderTasks() {
  for (const who of PEOPLE) {
    const list = $(`task-list-${who}`);
    list.replaceChildren();
    const tasks = data.tasks.filter((t) => t.who === who);
    if (tasks.length === 0) {
      list.append(el('li', { class: 'empty-msg', text: 'Nichts zu tun!' }));
      continue;
    }
    for (const task of tasks) {
      list.append(el('li', { class: 'task' },
        el('button', {
          type: 'button',
          class: 'check',
          'aria-label': `Erledigt: ${task.text}`,
          title: 'Erledigt',
          onclick: () => {
            const index = data.tasks.indexOf(task);
            if (index === -1) return;
            data.tasks.splice(index, 1);
            saveData();
            renderTasks();
            showToast('Aufgabe erledigt!', () => {
              data.tasks.splice(Math.min(index, data.tasks.length), 0, task);
              saveData();
              renderTasks();
            });
          },
        }),
        el('span', { class: 'task-text', text: task.text }),
      ));
    }
  }
}

$('task-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const text = $('task-text').value.trim();
  const who = new FormData(e.target).get('who');
  if (!text || !PEOPLE.includes(who)) return;
  data.tasks.push({ id: newId(), text, who });
  saveData();
  $('task-text').value = '';
  renderTasks();
});

/* ---------- Wochenplan ---------- */

function renderMeals() {
  const monday = addDays(mondayOf(new Date()), weekOffset * 7);
  const sunday = addDays(monday, 6);
  const prefix = weekOffset === 0 ? 'Diese Woche' : weekOffset === 1 ? 'Nächste Woche' : `KW ${isoWeek(monday)}`;
  $('week-title').textContent = `${prefix} · ${shortDate(monday)}–${shortDate(sunday)}`;

  const list = $('meal-list');
  list.replaceChildren();
  for (let i = 0; i < 7; i++) {
    const day = addDays(monday, i);
    const key = toKey(day);
    const input = el('input', {
      type: 'text',
      maxlength: '60',
      placeholder: '…',
      'aria-label': `Essen am ${longDate(day)}`,
    });
    input.value = data.meals[key] || '';
    input.addEventListener('input', () => {
      const value = input.value.trim();
      if (value) data.meals[key] = value;
      else delete data.meals[key];
      saveData();
    });

    list.append(el('li', { class: key === todayKey ? 'meal today' : 'meal' },
      el('span', { class: 'meal-day' },
        WEEKDAYS_SHORT[i],
        el('small', { text: shortDate(day) }),
      ),
      input,
    ));
  }
}

$('week-prev').addEventListener('click', () => { weekOffset--; renderMeals(); });
$('week-next').addEventListener('click', () => { weekOffset++; renderMeals(); });

/* ---------- Einkaufsliste ---------- */

/** Abgehakte Artikel, die älter als 7 Tage sind, löschen */
function cleanupShopping() {
  const now = Date.now();
  const before = data.shopping.length;
  data.shopping = data.shopping.filter((item) => !item.checkedAt || now - item.checkedAt < SEVEN_DAYS_MS);
  if (data.shopping.length !== before) saveData();
}

function renderShopping() {
  cleanupShopping();
  const list = $('shop-list');
  list.replaceChildren();

  const open = data.shopping.filter((i) => !i.checkedAt);
  const done = data.shopping.filter((i) => i.checkedAt).sort((a, b) => b.checkedAt - a.checkedAt);

  if (data.shopping.length === 0) {
    list.append(el('li', { class: 'empty-msg', text: 'Der Kühlschrank ist voll!' }));
    return;
  }

  for (const item of [...open, ...done]) {
    const isDone = Boolean(item.checkedAt);
    const button = el('button', {
      type: 'button',
      class: isDone ? 'shop-item done' : 'shop-item',
      'aria-pressed': isDone ? 'true' : 'false',
      onclick: () => {
        item.checkedAt = item.checkedAt ? null : Date.now();
        saveData();
        renderShopping();
      },
    },
      el('span', { class: 'shop-box', 'aria-hidden': 'true', text: isDone ? '✓' : '' }),
      el('span', { class: 'shop-label', text: item.text }),
    );
    if (isDone) {
      const gone = new Date(item.checkedAt + SEVEN_DAYS_MS);
      button.append(el('span', { class: 'shop-until', text: `weg am ${shortDate(gone)}` }));
    }
    list.append(el('li', {}, button));
  }
}

$('shop-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const text = $('shop-text').value.trim();
  if (!text) return;
  data.shopping.push({ id: newId(), text, checkedAt: null });
  saveData();
  $('shop-text').value = '';
  renderShopping();
});

/* ---------- Start ---------- */

function renderAll() {
  renderHeader();
  renderCalendar();
  renderNotes();
  renderTasks();
  renderMeals();
  renderShopping();
}

drawBurst();
$('cal-date').value = todayKey;
renderAll();

// Das Dashboard läuft evtl. tagelang (z. B. Tablet in der Küche):
// Jede Minute prüfen, ob ein neuer Tag begonnen hat.
setInterval(() => {
  const nowKey = toKey(new Date());
  if (nowKey !== todayKey) {
    const followToday = calState.selected === todayKey;
    todayKey = nowKey;
    if (followToday) {
      calState.selected = nowKey;
      const d = fromKey(nowKey);
      calState.year = d.getFullYear();
      calState.month = d.getMonth();
      $('cal-date').value = nowKey;
    }
    renderAll();
  }
}, 60 * 1000);

// Einmal pro Stunde alte Einkaufs-Artikel aufräumen
setInterval(renderShopping, 60 * 60 * 1000);
