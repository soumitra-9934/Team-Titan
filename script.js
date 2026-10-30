// ================================================================
// HabitFlow — Habit Tracker
// Hack Day Haldia'26 | Team Titan
// Stack: Vanilla HTML + CSS + JS | Data: localStorage
// ================================================================

'use strict';

// ----------------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------------
const STORAGE_KEY = 'hackday-haldia-team-titan';
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const CATEGORIES = ['health', 'learning', 'mindfulness', 'fitness', 'productivity', 'other'];
const CATEGORY_EMOJI = {
  health: '🏃', learning: '📚', mindfulness: '🧘',
  fitness: '💪', productivity: '⚡', other: '✨'
};
const CATEGORY_LABEL = {
  health: 'Health', learning: 'Learning', mindfulness: 'Mindfulness',
  fitness: 'Fitness', productivity: 'Productivity', other: 'Other'
};

const HABIT_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#6366f1'
];

const DAY_NAMES_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DAY_NAMES_FULL  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTH_NAMES_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ----------------------------------------------------------------
// STATE
// ----------------------------------------------------------------
/**
 * App state schema:
 * {
 *   habits: [
 *     {
 *       id: string,
 *       name: string,          -- HTML-escaped
 *       description: string,   -- HTML-escaped
 *       category: string,
 *       color: string,
 *       weeklyTarget: number (1-7),
 *       createdAt: string (YYYY-MM-DD),
 *       archived: boolean,
 *       reminder: {
 *         enabled: boolean,
 *         time: string (HH:MM),
 *         days: number[]  (0=Sun … 6=Sat)
 *       }
 *     }
 *   ],
 *   checkins: {
 *     [habitId]: string[]   // sorted YYYY-MM-DD strings, unique
 *   },
 *   theme: 'light' | 'dark'
 * }
 */
let state = {
  habits: [],
  checkins: {},
  theme: 'light'
};

// UI ephemeral state (not persisted)
let ui = {
  currentPage: 'dashboard',
  habitsFilter: 'all',
  selectedColor: HABIT_COLORS[0],
  selectedReminderDays: [0,1,2,3,4,5,6],
  backdateSelectedHabitId: null,
};

// ----------------------------------------------------------------
// PERSISTENCE
// ----------------------------------------------------------------
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('HabitFlow: Could not save to localStorage.', e);
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.habits)) state.habits = parsed.habits.map(migrateHabit);
      if (parsed.checkins && typeof parsed.checkins === 'object') {
        // Sanitise: ensure each value is an array of strings
        const clean = {};
        for (const [k, v] of Object.entries(parsed.checkins)) {
          clean[k] = Array.isArray(v) ? v.filter(d => typeof d === 'string') : [];
        }
        state.checkins = clean;
      }
      if (parsed.theme === 'dark' || parsed.theme === 'light') state.theme = parsed.theme;
    }
  } catch (e) {
    console.warn('HabitFlow: Could not load saved data — starting fresh.', e);
  }
}

/** Ensure habit objects have all required fields (forward-compat migration) */
function migrateHabit(h) {
  return {
    id:           h.id            || uid(),
    name:         esc(h.name      || 'Untitled'),
    description:  esc(h.description || ''),
    category:     CATEGORIES.includes(h.category) ? h.category : 'other',
    color:        h.color         || HABIT_COLORS[0],
    weeklyTarget: Math.min(7, Math.max(1, Number(h.weeklyTarget) || 7)),
    createdAt:    h.createdAt     || todayStr(),
    archived:     Boolean(h.archived),
    reminder: {
      enabled: h.reminder?.enabled  ?? false,
      time:    h.reminder?.time     || '08:00',
      days:    Array.isArray(h.reminder?.days) ? h.reminder.days : [0,1,2,3,4,5,6]
    }
  };
}

// ----------------------------------------------------------------
// UTILITY
// ----------------------------------------------------------------
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** HTML-escape user content before storing/rendering */
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Decode HTML-escaped string back to plain text (for form pre-fill) */
function unesc(str) {
  const div = document.createElement('div');
  div.innerHTML = str;
  return div.textContent;
}

/** Today as YYYY-MM-DD in local time */
function todayStr() {
  return localDateStr(new Date());
}

/** Date → YYYY-MM-DD (local time) */
function localDateStr(d) {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dy}`;
}

/** YYYY-MM-DD string → local midnight Date */
function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Calendar-day difference b → a (positive if b is later) */
function daysDiff(a, b) {
  return Math.round((parseDate(b) - parseDate(a)) / 86400000);
}

/** YYYY-MM-DD → human-readable short date */
function formatDate(str) {
  const d = parseDate(str);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** Return YYYY-MM-DD for N days before today */
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localDateStr(d);
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

// ----------------------------------------------------------------
// DATA — Habits
// ----------------------------------------------------------------
function getActiveHabits()   { return state.habits.filter(h => !h.archived); }
function getArchivedHabits() { return state.habits.filter(h =>  h.archived); }
function getHabitById(id)    { return state.habits.find(h => h.id === id) || null; }

function createHabit(data) {
  const habit = {
    id:           uid(),
    name:         esc(data.name.trim()),
    description:  esc((data.description || '').trim()),
    category:     data.category,
    color:        data.color,
    weeklyTarget: Math.min(7, Math.max(1, Number(data.weeklyTarget))),
    createdAt:    todayStr(),
    archived:     false,
    reminder: { enabled: false, time: '08:00', days: [0,1,2,3,4,5,6] }
  };
  state.habits.push(habit);
  state.checkins[habit.id] = [];
  save();
  return habit;
}

function updateHabit(id, data) {
  const h = getHabitById(id);
  if (!h) return;
  h.name         = esc(data.name.trim());
  h.description  = esc((data.description || '').trim());
  h.category     = data.category;
  h.color        = data.color;
  h.weeklyTarget = Math.min(7, Math.max(1, Number(data.weeklyTarget)));
  save();
}

function archiveHabit(id) {
  const h = getHabitById(id);
  if (h) { h.archived = true; save(); }
}

function restoreHabit(id) {
  const h = getHabitById(id);
  if (h) { h.archived = false; save(); }
}

function deleteHabitPermanently(id) {
  state.habits  = state.habits.filter(h => h.id !== id);
  delete state.checkins[id];
  save();
}

// ----------------------------------------------------------------
// DATA — Check-ins
// ----------------------------------------------------------------
function getCheckins(habitId) {
  return state.checkins[habitId] || [];
}

function isCheckedIn(habitId, dateStr) {
  return getCheckins(habitId).includes(dateStr);
}

/**
 * Toggle a check-in for a habit on a given date.
 * Returns 'added' or 'removed'.
 */
function toggleCheckin(habitId, dateStr) {
  if (!state.checkins[habitId]) state.checkins[habitId] = [];
  const idx = state.checkins[habitId].indexOf(dateStr);
  if (idx === -1) {
    state.checkins[habitId].push(dateStr);
    state.checkins[habitId].sort(); // keep sorted for streak logic
    save();
    return 'added';
  } else {
    state.checkins[habitId].splice(idx, 1);
    save();
    return 'removed';
  }
}

// ----------------------------------------------------------------
// STREAK ENGINE
// ----------------------------------------------------------------
/**
 * Calculate current + longest streak for a habit.
 *
 * Rules:
 * - A streak is a run of consecutive calendar days with a check-in.
 * - "Current" streak: consecutive days ending on TODAY if today is done,
 *   or ending on YESTERDAY if today is not yet done (user still has today).
 * - "Longest" streak: the longest such consecutive run ever.
 */
function calcStreaks(habitId) {
  const checkins = getCheckins(habitId);
  if (!checkins.length) return { current: 0, longest: 0 };

  const dateSet = new Set(checkins);
  const today   = todayStr();
  const yesterday = daysAgo(1);

  // Sorted unique dates
  const sorted = [...dateSet].sort();

  // ---- LONGEST ----
  let longest = 1;
  let run     = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (daysDiff(sorted[i - 1], sorted[i]) === 1) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  // ---- CURRENT ----
  // Start anchor: today if done, else yesterday
  const anchor = dateSet.has(today) ? today : yesterday;
  let current  = 0;

  if (dateSet.has(anchor)) {
    current = 1;
    let prev = anchor;
    while (true) {
      const d = parseDate(prev);
      d.setDate(d.getDate() - 1);
      const prevStr = localDateStr(d);
      if (dateSet.has(prevStr)) {
        current++;
        prev = prevStr;
      } else {
        break;
      }
    }
  }

  return { current, longest };
}

// ----------------------------------------------------------------
// STATISTICS
// ----------------------------------------------------------------

/** Monday-anchored week start for a date string */
function getWeekStart(dateStr) {
  const d   = parseDate(dateStr);
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - ((day + 6) % 7));
  return localDateStr(d);
}

/** Count check-ins for a habit in the 7 days starting from weekStartStr */
function getCheckinsByWeek(habitId, weekStartStr) {
  return getCheckins(habitId).filter(d => {
    const diff = daysDiff(weekStartStr, d);
    return diff >= 0 && diff < 7;
  }).length;
}

/** ISO week number for a date string */
function isoWeekNum(dateStr) {
  const d = parseDate(dateStr);
  const tmp = new Date(d);
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const w1 = new Date(tmp.getFullYear(), 0, 4);
  return 1 + Math.round(((tmp - w1) / 86400000 - 3 + ((w1.getDay() + 6) % 7)) / 7);
}

/** Last N weeks of total completions (all active habits combined) */
function getWeeklyData(n = 8) {
  const active = getActiveHabits();
  const result = [];
  for (let w = n - 1; w >= 0; w--) {
    const d = new Date();
    d.setDate(d.getDate() - w * 7);
    const ws    = getWeekStart(localDateStr(d));
    const label = `W${isoWeekNum(ws)}`;
    let total   = 0;
    active.forEach(h => { total += getCheckinsByWeek(h.id, ws); });
    result.push({ label, total, weekStartStr: ws });
  }
  return result;
}

/** Last N months of total completions (all active habits combined) */
function getMonthlyData(n = 6) {
  const active = getActiveHabits();
  const result = [];
  const now    = new Date();
  for (let m = n - 1; m >= 0; m--) {
    const d   = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const y   = d.getFullYear();
    const mo  = d.getMonth();
    let total = 0;
    active.forEach(h => {
      getCheckins(h.id).forEach(dateStr => {
        const pd = parseDate(dateStr);
        if (pd.getFullYear() === y && pd.getMonth() === mo) total++;
      });
    });
    result.push({ label: MONTH_NAMES_SHORT[mo], total });
  }
  return result;
}

/** Completion rate for a habit in the current Monday-anchored week (0–1) */
function weeklyCompletionRate(habitId) {
  const habit = getHabitById(habitId);
  if (!habit) return 0;
  const done = getCheckinsByWeek(habitId, getWeekStart(todayStr()));
  return Math.min(1, done / habit.weeklyTarget);
}

/** Weekly consistency score across all active habits (0–100) */
function consistencyScore() {
  const active = getActiveHabits();
  if (!active.length) return 0;
  const avg = active.reduce((s, h) => s + weeklyCompletionRate(h.id), 0) / active.length;
  return Math.round(avg * 100);
}

// ----------------------------------------------------------------
// HEATMAP DATA
// ----------------------------------------------------------------
/**
 * Build heatmap cells for the last `weeks` weeks.
 * Cells are ordered oldest→newest, 7 cells per column (Sun→Sat).
 *
 * @param {string|null} habitId  — null = overall (all active habits)
 * @param {number}      weeks    — number of columns
 * @returns {{ date, count, level }[]}
 */
function buildHeatmapData(habitId, weeks = 12) {
  const totalDays = weeks * 7;

  // Align end to the nearest coming Saturday (inclusive of today)
  const endDate  = new Date();
  const dow      = endDate.getDay();
  endDate.setDate(endDate.getDate() + (6 - dow));

  const active = habitId ? null : getActiveHabits();
  const cells  = [];

  for (let i = totalDays - 1; i >= 0; i--) {
    const d       = new Date(endDate);
    d.setDate(endDate.getDate() - i);
    const dateStr = localDateStr(d);

    let count = 0;
    if (habitId) {
      count = isCheckedIn(habitId, dateStr) ? 1 : 0;
    } else {
      active.forEach(h => { if (isCheckedIn(h.id, dateStr)) count++; });
    }

    let level = 0;
    if (count > 0) {
      if (habitId) {
        level = 4;
      } else {
        const total = active.length || 1;
        const ratio = count / total;
        level = ratio <= 0.25 ? 1 : ratio <= 0.5 ? 2 : ratio <= 0.75 ? 3 : 4;
      }
    }

    cells.push({ date: dateStr, count, level });
  }
  return cells;
}

// ----------------------------------------------------------------
// RENDER HELPERS — Heatmap
// ----------------------------------------------------------------
function renderHeatmap(cells, container, habitId = null) {
  container.innerHTML = '';

  const weeks = Math.round(cells.length / 7);
  const cols  = [];
  for (let w = 0; w < weeks; w++) cols.push(cells.slice(w * 7, w * 7 + 7));

  // Month labels row
  const monthRow = document.createElement('div');
  monthRow.className = 'heatmap-month-labels';
  let lastMonth = -1;
  cols.forEach(col => {
    const lbl       = document.createElement('div');
    lbl.className   = 'heatmap-month-label';
    lbl.style.width = '14px';
    const mo = parseDate(col[0].date).getMonth();
    if (mo !== lastMonth) { lbl.textContent = MONTH_NAMES_SHORT[mo]; lastMonth = mo; }
    monthRow.appendChild(lbl);
  });

  // Weekday labels (left column)
  const dayLabels = document.createElement('div');
  dayLabels.className = 'heatmap-labels-left';
  for (let r = 0; r < 7; r++) {
    const lbl       = document.createElement('div');
    lbl.className   = 'heatmap-day-label';
    // Show only Mon, Wed, Fri to avoid crowding
    lbl.textContent = [1, 3, 5].includes(r) ? DAY_NAMES_SHORT[r] : '';
    dayLabels.appendChild(lbl);
  }

  // Grid
  const gridArea = document.createElement('div');
  gridArea.className = 'heatmap-grid-area';
  gridArea.appendChild(monthRow);

  const grid = document.createElement('div');
  grid.className = 'heatmap-grid';

  cols.forEach(col => {
    const colEl = document.createElement('div');
    colEl.className = 'heatmap-col';
    col.forEach(cell => {
      const el = buildHeatCell(cell, habitId);
      colEl.appendChild(el);
    });
    grid.appendChild(colEl);
  });

  gridArea.appendChild(grid);

  const wrap = document.createElement('div');
  wrap.className = 'heatmap-container';
  const scrollWrap = document.createElement('div');
  scrollWrap.className = 'heatmap-wrap';
  wrap.appendChild(dayLabels);
  wrap.appendChild(gridArea);
  scrollWrap.appendChild(wrap);
  container.appendChild(scrollWrap);

  // Legend
  const legend = document.createElement('div');
  legend.className = 'heatmap-legend';
  legend.innerHTML = `
    <span>Less</span>
    ${[0,1,2,3,4].map(l => `<div class="heatmap-legend-cell" style="background:var(--heat-${l})"></div>`).join('')}
    <span>More</span>
  `;
  container.appendChild(legend);
}

function buildHeatCell(cell, habitId) {
  const el = document.createElement('div');
  el.className = 'heatmap-cell';
  el.setAttribute('data-level', cell.level);
  el.setAttribute('data-date',  cell.date);
  el.setAttribute('data-count', cell.count);
  if (habitId) el.setAttribute('data-heatmap-habit-id', habitId);
  el.setAttribute('role',       'img');
  el.setAttribute('aria-label', buildCellLabel(cell, habitId));
  el.setAttribute('tabindex',   '0');
  el.addEventListener('mouseenter', onCellHover);
  el.addEventListener('mouseleave', hideTooltip);
  el.addEventListener('focus',      onCellHover);
  el.addEventListener('blur',       hideTooltip);
  return el;
}

function buildCellLabel(cell, habitId) {
  const ds = formatDate(cell.date);
  if (cell.count === 0) return `${ds}: No activity`;
  if (habitId) return `${ds}: Completed`;
  return `${ds}: ${cell.count} habit${cell.count !== 1 ? 's' : ''} completed`;
}

function onCellHover(e) {
  const el      = e.currentTarget;
  const date    = el.getAttribute('data-date');
  const count   = parseInt(el.getAttribute('data-count'), 10);
  const hid     = el.getAttribute('data-heatmap-habit-id') ||
                  el.closest('[data-heatmap-habit-id]')?.getAttribute('data-heatmap-habit-id') || null;

  let text;
  if (count === 0)  text = `${formatDate(date)} — No activity`;
  else if (hid)     text = `${formatDate(date)} — ✓ Completed`;
  else              text = `${formatDate(date)} — ${count} habit${count !== 1 ? 's' : ''} done`;

  const tip = $('#heatmap-tooltip');
  tip.textContent = text;
  tip.classList.add('visible');

  requestAnimationFrame(() => {
    const tr   = tip.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    let left   = rect.left + rect.width / 2 - tr.width / 2;
    let top    = rect.top - tr.height - 8;
    left = clamp(left, 8, window.innerWidth - tr.width - 8);
    if (top < 8) top = rect.bottom + 8;
    tip.style.left = `${left + window.scrollX}px`;
    tip.style.top  = `${top  + window.scrollY}px`;
  });
}

function hideTooltip() {
  $('#heatmap-tooltip').classList.remove('visible');
}

// ----------------------------------------------------------------
// RENDER HELPERS — Bar Chart
// ----------------------------------------------------------------
function renderBarChart(container, data) {
  if (!data.length || data.every(d => d.total === 0)) {
    container.innerHTML = `
      <div class="empty-state" style="padding:2rem 1rem">
        <div style="font-size:2rem;margin-bottom:0.5rem">📊</div>
        <div class="empty-state-title">No data yet</div>
        <p class="empty-state-desc">Complete some habits to see your chart.</p>
      </div>`;
    return;
  }
  const max  = Math.max(...data.map(d => d.total), 1);
  container.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'chart-bar-wrap';
  data.forEach(item => {
    const pct = Math.round((item.total / max) * 100);
    const row = document.createElement('div');
    row.className = 'chart-bar-row';
    row.innerHTML = `
      <div class="chart-bar-label">${esc(item.label)}</div>
      <div class="chart-bar-track" role="progressbar" aria-valuenow="${item.total}" aria-valuemax="${max}">
        <div class="chart-bar-fill" style="width:${pct}%"></div>
      </div>
      <div class="chart-bar-value">${item.total}</div>
    `;
    wrap.appendChild(row);
  });
  container.appendChild(wrap);
}

// ----------------------------------------------------------------
// RENDER HELPERS — Empty State
// ----------------------------------------------------------------
function renderEmptyState(title, desc, emoji = '🌱', btnLabel = '', btnId = '') {
  return `
    <div class="empty-state">
      <div class="empty-state-icon" aria-hidden="true" style="font-size:1.75rem">${emoji}</div>
      <div class="empty-state-title">${esc(title)}</div>
      <p class="empty-state-desc">${esc(desc)}</p>
      ${btnLabel ? `<button class="btn btn-primary btn-sm" id="${btnId}">${esc(btnLabel)}</button>` : ''}
    </div>
  `;
}

// ----------------------------------------------------------------
// RENDER — Helpers
// ----------------------------------------------------------------
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function svgIcon(name) {
  const icons = {
    layers:        '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    'check-circle':'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    zap:           '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    trophy:        '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>',
    bell:          '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    edit:          '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    calendar:      '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  };
  return icons[name] || '';
}

function statCardHTML(label, value, sub, color, iconName) {
  const bg = hexToRgba(color, 0.1);
  return `
    <div class="stat-card">
      <div class="stat-icon" style="background:${bg}">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          ${svgIcon(iconName)}
        </svg>
      </div>
      <div class="stat-value">${esc(String(value))}</div>
      <div class="stat-label">${esc(label)}</div>
      <div class="stat-sub">${esc(sub)}</div>
    </div>
  `;
}

function getMotivationMessage(habits) {
  const today = todayStr();
  const done  = habits.filter(h => isCheckedIn(h.id, today)).length;
  const total = habits.length;
  if (total === 0) return { emoji: '🚀', title: 'Ready to build great habits?',  body: 'Add your first habit to start your journey.' };
  if (done === total) return { emoji: '🔥', title: "You've crushed it today!",    body: 'All habits completed. Keep the streak alive!' };
  if (done === 0)   return { emoji: '💪', title: "Let's get started!",            body: `You have ${total} habit${total !== 1 ? 's' : ''} to complete today.` };
  const pct = Math.round((done / total) * 100);
  if (pct >= 50)    return { emoji: '⚡', title: "You're halfway there!",          body: `${total - done} more to go — keep it up!` };
  return              { emoji: '🌱', title: 'Build momentum!',                    body: `${done} of ${total} done — every check-in counts.` };
}

// ----------------------------------------------------------------
// RENDER — Dashboard
// ----------------------------------------------------------------
function renderDashboard() {
  const today        = todayStr();
  const activeHabits = getActiveHabits();

  // Greeting
  const hour    = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  setEl('#greeting-text', `${greeting}! 👋`);
  setEl('#today-date-text', new Date().toLocaleDateString('en-US',
    { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));

  // Motivation banner
  const motivDiv = $('#dash-motivation');
  if (motivDiv) {
    const msg = getMotivationMessage(activeHabits);
    motivDiv.innerHTML = msg ? `
      <div class="motivation-banner">
        <div class="motivation-banner-emoji">${msg.emoji}</div>
        <div class="motivation-banner-text">
          <strong>${esc(msg.title)}</strong>
          ${esc(msg.body)}
        </div>
      </div>` : '';
  }

  // Stats
  const completedToday = activeHabits.filter(h => isCheckedIn(h.id, today)).length;
  const totalActive    = activeHabits.length;

  let bestStreak = 0, curStreak = 0;
  activeHabits.forEach(h => {
    const s = calcStreaks(h.id);
    bestStreak = Math.max(bestStreak, s.longest);
    curStreak  = Math.max(curStreak,  s.current);
  });

  const ws = getWeekStart(today);
  let weekTotal = 0, weekTarget = 0;
  activeHabits.forEach(h => {
    weekTotal  += getCheckinsByWeek(h.id, ws);
    weekTarget += h.weeklyTarget;
  });
  const weekPct = weekTarget > 0 ? Math.round((weekTotal / weekTarget) * 100) : 0;

  const statGrid = $('#dash-stat-grid');
  if (statGrid) {
    statGrid.innerHTML =
      statCardHTML('Active Habits',    totalActive,             'habits tracked',                    '#3b82f6', 'layers')       +
      statCardHTML('Completed Today',  `${completedToday}/${totalActive}`, 'check-ins today',         '#22c55e', 'check-circle') +
      statCardHTML('Current Streak',   curStreak,               `day${curStreak  !== 1 ? 's' : ''} in a row`, '#f59e0b', 'zap') +
      statCardHTML('Best Streak',      bestStreak,              `day${bestStreak !== 1 ? 's' : ''} record`,    '#8b5cf6', 'trophy');
  }

  // Progress ring
  const pct          = totalActive > 0 ? Math.round((completedToday / totalActive) * 100) : 0;
  const circumference = 2 * Math.PI * 40;
  const offset        = circumference - (pct / 100) * circumference;
  const ringFill = $('#ring-fill');
  if (ringFill) {
    ringFill.style.strokeDasharray  = circumference;
    ringFill.style.strokeDashoffset = offset;
    ringFill.style.stroke = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#3b82f6';
  }
  setEl('#ring-pct',   `${pct}%`);
  setEl('#ring-label', `${completedToday} of ${totalActive} done`);
  setEl('#today-checklist-sub', weekPct >= 100
    ? '🎉 Weekly target hit!' : `${weekPct}% of weekly target done`);

  renderTodayChecklist();

  // Overall heatmap
  const heatmapCont = $('#overall-heatmap-container');
  if (heatmapCont) {
    if (!activeHabits.length) {
      heatmapCont.innerHTML = renderEmptyState(
        'No habits yet', 'Add your first habit to start tracking.', '🌱', 'Add Habit', 'dash-empty-add-btn');
      later(() => $('#dash-empty-add-btn')?.addEventListener('click', openAddHabitModal));
    } else {
      renderHeatmap(buildHeatmapData(null, 12), heatmapCont);
    }
  }
}

// ----------------------------------------------------------------
// RENDER — Today's Checklist
// ----------------------------------------------------------------
function renderTodayChecklist() {
  const container = $('#today-checklist');
  if (!container) return;
  const today  = todayStr();
  const active = getActiveHabits();

  if (!active.length) {
    container.innerHTML = renderEmptyState(
      'No habits yet', 'Create your first habit to start tracking.', '🌱', 'Add Habit', 'checklist-add-btn');
    later(() => $('#checklist-add-btn')?.addEventListener('click', openAddHabitModal));
    return;
  }

  container.innerHTML = '';
  active.forEach(habit => {
    const checked  = isCheckedIn(habit.id, today);
    const streaks  = calcStreaks(habit.id);
    const item     = document.createElement('div');
    item.className = `checklist-item${checked ? ' completed' : ''}`;
    item.innerHTML = `
      <button class="check-btn${checked ? ' checked' : ''}"
        aria-label="${checked ? 'Undo' : 'Complete'} ${unesc(habit.name)}"
        data-habit-id="${habit.id}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </button>
      <div class="checklist-info">
        <div class="checklist-name">${habit.name}</div>
        <div class="checklist-meta">
          <div class="habit-color-dot" style="background:${habit.color}"></div>
          <span>${CATEGORY_EMOJI[habit.category] || ''} ${CATEGORY_LABEL[habit.category] || habit.category}</span>
          ${streaks.current > 0 ? `<span class="streak-badge">🔥 ${streaks.current}</span>` : ''}
        </div>
      </div>
    `;
    item.querySelector('.check-btn').addEventListener('click', e => {
      e.stopPropagation();
      const hid    = e.currentTarget.dataset.habitId;
      const result = toggleCheckin(hid, today);
      showToast(
        result === 'added' ? `✓ ${unesc(habit.name)} done!` : `Undone: ${unesc(habit.name)}`,
        result === 'added' ? 'success' : 'info'
      );
      render();
    });
    container.appendChild(item);
  });
}

// ----------------------------------------------------------------
// RENDER — Habits Page
// ----------------------------------------------------------------
function renderHabitsPage() {
  const grid = $('#habits-grid');
  if (!grid) return;

  const filter = ui.habitsFilter;
  let habits   = getActiveHabits();
  if (filter !== 'all') habits = habits.filter(h => h.category === filter);

  // Sync tab state
  $$('[data-filter]').forEach(btn => {
    const isActive = btn.dataset.filter === filter;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive);
  });

  if (!habits.length) {
    const msg = filter === 'all'
      ? 'Add your first habit to start building consistency.'
      : `No habits in the "${filter}" category yet.`;
    grid.innerHTML = renderEmptyState('No habits found', msg, '🌱',
      filter === 'all' ? 'Add Habit' : '', filter === 'all' ? 'habits-empty-add-btn' : '');
    if (filter === 'all') {
      later(() => $('#habits-empty-add-btn')?.addEventListener('click', openAddHabitModal));
    }
    return;
  }

  grid.innerHTML = '';
  habits.forEach(habit => {
    const today    = todayStr();
    const checked  = isCheckedIn(habit.id, today);
    const streaks  = calcStreaks(habit.id);
    const wrPct    = Math.round(weeklyCompletionRate(habit.id) * 100);
    const total    = getCheckins(habit.id).length;
    const miniCells = buildHeatmapData(habit.id, 4);

    const card = document.createElement('div');
    card.className = 'habit-card';
    card.innerHTML = `
      <div class="habit-card-accent" style="background:${habit.color}"></div>
      <div class="habit-card-body">
        <div class="habit-card-header">
          <div>
            <div class="habit-card-name">${habit.name}</div>
            <div style="display:flex;gap:0.375rem;margin-top:0.25rem;flex-wrap:wrap">
              <span class="habit-tag">${CATEGORY_EMOJI[habit.category]||''} ${CATEGORY_LABEL[habit.category]||habit.category}</span>
              <span class="habit-tag">🎯 ${habit.weeklyTarget}×/week</span>
            </div>
          </div>
          <div style="display:flex;gap:0.25rem;flex-shrink:0">
            <button class="btn btn-ghost btn-icon-sm" data-action="edit" aria-label="Edit ${unesc(habit.name)}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svgIcon('edit')}</svg>
            </button>
            <button class="btn btn-ghost btn-icon-sm" data-action="reminder" aria-label="Reminder for ${unesc(habit.name)}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svgIcon('bell')}</svg>
            </button>
          </div>
        </div>
        ${habit.description ? `<div class="habit-card-desc">${habit.description}</div>` : ''}
        <div class="habit-card-stats">
          <div class="habit-card-stat">
            <span class="habit-card-stat-value">${streaks.current}</span>
            <span class="habit-card-stat-label">🔥 Current</span>
          </div>
          <div class="habit-card-stat">
            <span class="habit-card-stat-value">${streaks.longest}</span>
            <span class="habit-card-stat-label">🏆 Longest</span>
          </div>
          <div class="habit-card-stat">
            <span class="habit-card-stat-value">${wrPct}%</span>
            <span class="habit-card-stat-label">📅 This week</span>
          </div>
          <div class="habit-card-stat">
            <span class="habit-card-stat-value">${total}</span>
            <span class="habit-card-stat-label">✓ Total</span>
          </div>
        </div>
        <div class="habit-mini-heatmap" id="mini-hm-${habit.id}" data-heatmap-habit-id="${habit.id}"></div>
        <div class="habit-card-actions">
          <button class="btn ${checked ? 'btn-secondary' : 'btn-primary'} btn-sm" data-action="checkin">
            ${checked
              ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> Done Today`
              : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Check In`}
          </button>
          <button class="btn btn-ghost btn-sm" data-action="archive" style="margin-left:auto">Archive</button>
        </div>
      </div>
    `;

    card.querySelector('[data-action="edit"]').addEventListener('click',     () => openEditHabitModal(habit.id));
    card.querySelector('[data-action="reminder"]').addEventListener('click', () => openReminderModal(habit.id));
    card.querySelector('[data-action="checkin"]').addEventListener('click',  () => {
      const result = toggleCheckin(habit.id, todayStr());
      showToast(result === 'added' ? `✓ ${unesc(habit.name)} done!` : `Undone: ${unesc(habit.name)}`,
        result === 'added' ? 'success' : 'info');
      render();
    });
    card.querySelector('[data-action="archive"]').addEventListener('click',  () => {
      if (confirm(`Archive "${unesc(habit.name)}"? Your history will be preserved.`)) {
        archiveHabit(habit.id);
        showToast(`"${unesc(habit.name)}" archived.`, 'info');
        render();
      }
    });

    grid.appendChild(card);

    // Mini heatmap
    const miniCont = card.querySelector(`#mini-hm-${habit.id}`);
    if (miniCont) renderMiniHeatmap(miniCells, miniCont, habit.id);
  });
}

function renderMiniHeatmap(cells, container, habitId) {
  container.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:2px';
  const weeks = Math.round(cells.length / 7);
  for (let w = 0; w < weeks; w++) {
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;gap:2px';
    cells.slice(w * 7, w * 7 + 7).forEach(cell => {
      col.appendChild(buildHeatCell(cell, habitId));
    });
    wrap.appendChild(col);
  }
  container.appendChild(wrap);
}

// ----------------------------------------------------------------
// RENDER — Heatmap Page
// ----------------------------------------------------------------
function renderHeatmapPage() {
  const container = $('#heatmap-page-container');
  if (!container) return;
  container.innerHTML = '';

  const active = getActiveHabits();
  if (!active.length) {
    container.innerHTML = renderEmptyState('No habits yet', 'Add habits to see their heatmaps.', '🗓️');
    return;
  }

  // Overall
  const overallCard = document.createElement('div');
  overallCard.className = 'card mb-4';
  overallCard.innerHTML = `
    <div class="card-header">
      <div><div class="card-title">Overall Activity</div>
      <div class="card-subtitle">All active habits combined — 12 weeks</div></div>
    </div>
    <div class="card-body"><div id="hmap-overall"></div></div>
  `;
  container.appendChild(overallCard);
  renderHeatmap(buildHeatmapData(null, 12), overallCard.querySelector('#hmap-overall'));

  // Per-habit
  active.forEach(habit => {
    const { current, longest } = calcStreaks(habit.id);
    const totalDone = getCheckins(habit.id).length;

    const card = document.createElement('div');
    card.className = 'card mb-4';
    card.innerHTML = `
      <div class="card-header">
        <div style="display:flex;align-items:center;gap:0.625rem">
          <div style="width:12px;height:12px;border-radius:50%;background:${habit.color};flex-shrink:0"></div>
          <div>
            <div class="card-title">${habit.name}</div>
            <div class="card-subtitle">
              ${CATEGORY_EMOJI[habit.category]||''} ${CATEGORY_LABEL[habit.category]||habit.category} &nbsp;·&nbsp;
              🔥 ${current} streak &nbsp;·&nbsp; 🏆 ${longest} best &nbsp;·&nbsp; ✓ ${totalDone} total
            </div>
          </div>
        </div>
      </div>
      <div class="card-body">
        <div id="hmap-${habit.id}" data-heatmap-habit-id="${habit.id}"></div>
      </div>
    `;
    container.appendChild(card);
    renderHeatmap(buildHeatmapData(habit.id, 12),
      card.querySelector(`#hmap-${habit.id}`), habit.id);
  });
}

// ----------------------------------------------------------------
// RENDER — Statistics
// ----------------------------------------------------------------
function renderStatsPage() {
  const active = getActiveHabits();
  const today  = todayStr();

  // Summary cards
  const summaryGrid = $('#stats-summary-grid');
  if (summaryGrid) {
    const totalCheckins  = active.reduce((s, h) => s + getCheckins(h.id).length, 0);
    const completedToday = active.filter(h => isCheckedIn(h.id, today)).length;
    const ws = getWeekStart(today);
    let weekDone = 0, weekTarget = 0;
    active.forEach(h => { weekDone += getCheckinsByWeek(h.id, ws); weekTarget += h.weeklyTarget; });
    const weekRate = weekTarget > 0 ? Math.round((weekDone / weekTarget) * 100) : 0;
    const score    = consistencyScore();

    summaryGrid.innerHTML =
      statCardHTML('Total Check-ins',  totalCheckins,             'all time',              '#3b82f6', 'check-circle') +
      statCardHTML('Today',            `${completedToday}/${active.length}`, 'completed',  '#22c55e', 'zap')          +
      statCardHTML('This Week',        `${weekDone}/${weekTarget}`,  `${weekRate}% of targets`, '#f59e0b', 'layers')  +
      statCardHTML('Consistency',      `${score}%`,               'weekly score',          '#8b5cf6', 'trophy');
  }

  renderBarChart($('#weekly-chart')  || document.createElement('div'), getWeeklyData(8));
  renderBarChart($('#monthly-chart') || document.createElement('div'), getMonthlyData(6));

  // Re-render directly into the real containers
  const wc = $('#weekly-chart');
  if (wc) renderBarChart(wc, getWeeklyData(8));
  const mc = $('#monthly-chart');
  if (mc) renderBarChart(mc, getMonthlyData(6));

  // Habit progress
  const progressList = $('#habit-progress-list');
  if (progressList) {
    if (!active.length) {
      progressList.innerHTML = renderEmptyState('No habits yet', 'Add habits to see progress.', '📊');
    } else {
      progressList.innerHTML = '';
      const ws2 = getWeekStart(today);
      active.forEach(habit => {
        const done = getCheckinsByWeek(habit.id, ws2);
        const pct  = Math.round(Math.min(1, done / habit.weeklyTarget) * 100);
        const row  = document.createElement('div');
        row.className = 'habit-progress-row';
        row.innerHTML = `
          <div class="habit-progress-header">
            <div class="habit-progress-name">
              <div class="habit-color-dot" style="background:${habit.color}"></div>
              ${habit.name}
            </div>
            <div class="habit-progress-pct">${done}/${habit.weeklyTarget} (${pct}%)</div>
          </div>
          <div class="habit-progress-track">
            <div class="habit-progress-fill" style="width:${pct}%;background:${habit.color}"
              role="progressbar" aria-valuenow="${pct}" aria-valuemax="100" aria-label="${unesc(habit.name)} ${pct}%"></div>
          </div>
        `;
        progressList.appendChild(row);
      });
    }
  }

  // Consistency score
  const consistencyDiv = $('#consistency-display');
  if (consistencyDiv) {
    const score = consistencyScore();
    const emoji = score >= 80 ? '🔥' : score >= 50 ? '⚡' : score >= 20 ? '🌱' : '💤';
    const msg   = score >= 80 ? 'Excellent consistency!'
                : score >= 50 ? 'Good progress this week'
                : score >= 20 ? 'Building momentum'
                : "Let's get started!";
    consistencyDiv.innerHTML = `
      <div class="consistency-score">${emoji} ${score}%</div>
      <div class="consistency-label">${esc(msg)}</div>
    `;
  }
}

// ----------------------------------------------------------------
// RENDER — Reminders Page
// ----------------------------------------------------------------
function renderRemindersPage() {
  const container = $('#reminder-list');
  if (!container) return;

  // Notification permission banner
  const bannerWrap = $('#notif-banner-wrap');
  if (bannerWrap) {
    if (!('Notification' in window)) {
      bannerWrap.innerHTML = '';
    } else if (Notification.permission === 'default') {
      bannerWrap.innerHTML = `
        <div class="notif-banner" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>Enable browser notifications to receive habit reminders.</span>
          <button class="btn btn-sm btn-secondary" style="margin-left:auto;flex-shrink:0" id="request-notif-btn">Enable</button>
        </div>`;
      later(() => $('#request-notif-btn')?.addEventListener('click', requestNotificationPermission));
    } else if (Notification.permission === 'denied') {
      bannerWrap.innerHTML = `
        <div class="notif-banner" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0">
            <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
          <span>Notifications are blocked. Enable them in your browser settings to use reminders.</span>
        </div>`;
    } else {
      bannerWrap.innerHTML = '';
    }
  }

  const active = getActiveHabits();
  if (!active.length) {
    container.innerHTML = renderEmptyState('No active habits', 'Add habits first to set reminders.', '🔔');
    return;
  }

  container.innerHTML = '';
  active.forEach(habit => {
    const r = habit.reminder;
    const dayTags = r.days.length === 7
      ? '<span class="reminder-day-tag">Every day</span>'
      : r.days.map(d => `<span class="reminder-day-tag">${DAY_NAMES_FULL[d]}</span>`).join('');

    const item = document.createElement('div');
    item.className = 'reminder-item';
    item.innerHTML = `
      <div style="width:10px;height:10px;border-radius:50%;background:${habit.color};flex-shrink:0"></div>
      <div class="reminder-habit-info">
        <div class="reminder-habit-name">${habit.name}</div>
        <div class="reminder-time">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          ${r.enabled ? r.time : 'Not set'}
          ${!r.enabled ? '<span style="color:var(--text-muted)">(disabled)</span>' : ''}
        </div>
        <div class="reminder-days">${dayTags}</div>
      </div>
      <button class="btn btn-secondary btn-sm" data-action="edit-reminder">Edit</button>
    `;
    item.querySelector('[data-action="edit-reminder"]').addEventListener('click', () => openReminderModal(habit.id));
    container.appendChild(item);
  });
}

// ----------------------------------------------------------------
// RENDER — Archive Page
// ----------------------------------------------------------------
function renderArchivePage() {
  const grid = $('#archive-grid');
  if (!grid) return;

  const archived = getArchivedHabits();
  if (!archived.length) {
    grid.innerHTML = renderEmptyState(
      'No archived habits',
      'Archived habits will appear here. Their history is always preserved.',
      '📦');
    return;
  }

  grid.innerHTML = '';
  archived.forEach(habit => {
    const total     = getCheckins(habit.id).length;
    const { longest } = calcStreaks(habit.id);

    const card = document.createElement('div');
    card.className = 'habit-card archived';
    card.innerHTML = `
      <div class="habit-card-accent" style="background:${habit.color};opacity:0.5"></div>
      <div class="habit-card-body">
        <div class="habit-card-header">
          <div>
            <div class="habit-card-name" style="color:var(--text-secondary)">${habit.name}</div>
            <div style="display:flex;gap:0.375rem;margin-top:0.25rem">
              <span class="habit-tag">${CATEGORY_EMOJI[habit.category]||''} ${CATEGORY_LABEL[habit.category]||habit.category}</span>
              <span class="habit-tag">Archived</span>
            </div>
          </div>
        </div>
        ${habit.description ? `<div class="habit-card-desc">${habit.description}</div>` : ''}
        <div class="habit-card-stats">
          <div class="habit-card-stat">
            <span class="habit-card-stat-value">${longest}</span>
            <span class="habit-card-stat-label">🏆 Best streak</span>
          </div>
          <div class="habit-card-stat">
            <span class="habit-card-stat-value">${total}</span>
            <span class="habit-card-stat-label">✓ Total done</span>
          </div>
        </div>
        <div class="habit-card-actions">
          <button class="btn btn-secondary btn-sm" data-action="restore">Restore</button>
          <button class="btn btn-danger btn-sm" data-action="delete" style="margin-left:auto">Delete Permanently</button>
        </div>
      </div>
    `;

    card.querySelector('[data-action="restore"]').addEventListener('click', () => {
      restoreHabit(habit.id);
      showToast(`"${unesc(habit.name)}" restored.`, 'success');
      render();
    });
    card.querySelector('[data-action="delete"]').addEventListener('click', () => {
      if (confirm(`Permanently delete "${unesc(habit.name)}"? This cannot be undone.`)) {
        deleteHabitPermanently(habit.id);
        showToast(`"${unesc(habit.name)}" permanently deleted.`, 'error');
        render();
      }
    });

    grid.appendChild(card);
  });
}

// ----------------------------------------------------------------
// MAIN RENDER
// ----------------------------------------------------------------
function render() {
  // Update nav badges
  const activeCount  = getActiveHabits().length;
  const archiveCount = getArchivedHabits().length;
  setEl('#nav-active-count', activeCount);
  const archBadge = $('#nav-archive-count');
  if (archBadge) {
    archBadge.textContent  = archiveCount;
    archBadge.style.display = archiveCount > 0 ? '' : 'none';
  }

  switch (ui.currentPage) {
    case 'dashboard': renderDashboard();   break;
    case 'habits':    renderHabitsPage();  break;
    case 'heatmap':   renderHeatmapPage(); break;
    case 'stats':     renderStatsPage();   break;
    case 'reminders': renderRemindersPage(); break;
    case 'archive':   renderArchivePage(); break;
  }
}

// ----------------------------------------------------------------
// NAVIGATION
// ----------------------------------------------------------------
const PAGE_TITLES = {
  dashboard: 'Dashboard', habits: 'My Habits', heatmap: 'Heatmap',
  stats: 'Statistics',    reminders: 'Reminders', archive: 'Archive'
};

function navigateTo(page) {
  ui.currentPage = page;

  $$('.nav-item[data-page]').forEach(el => {
    const active = el.dataset.page === page;
    el.classList.toggle('active', active);
    el.setAttribute('aria-current', active ? 'page' : 'false');
  });

  $$('.page').forEach(el => el.classList.remove('active'));
  $(`#page-${page}`)?.classList.add('active');

  setEl('#topbar-title', PAGE_TITLES[page] || page);
  closeMobileSidebar();
  render();
}

// ----------------------------------------------------------------
// MODAL — Habit Form
// ----------------------------------------------------------------
function openAddHabitModal() {
  $('#habit-form').reset();
  $('#habit-id-input').value = '';
  $('#habit-modal-title').textContent = 'New Habit';
  $('#habit-archive-btn').style.display = 'none';
  ui.selectedColor = HABIT_COLORS[0];
  renderColorPicker(HABIT_COLORS[0]);
  clearFormErrors();
  openModal($('#habit-modal'));
  later(() => $('#habit-name-input')?.focus());
}

function openEditHabitModal(habitId) {
  const habit = getHabitById(habitId);
  if (!habit) return;
  $('#habit-id-input').value        = habitId;
  $('#habit-modal-title').textContent = 'Edit Habit';
  $('#habit-name-input').value      = unesc(habit.name);
  $('#habit-desc-input').value      = unesc(habit.description);
  $('#habit-category-input').value  = habit.category;
  $('#habit-target-input').value    = String(habit.weeklyTarget);
  ui.selectedColor = habit.color;
  renderColorPicker(habit.color);
  $('#habit-archive-btn').style.display = '';
  clearFormErrors();
  openModal($('#habit-modal'));
  later(() => $('#habit-name-input')?.focus());
}

function saveHabitForm() {
  const name     = $('#habit-name-input').value.trim();
  const category = $('#habit-category-input').value;
  clearFormErrors();

  let valid = true;
  if (!name) { showFieldError('err-name', 'habit-name-input'); valid = false; }
  if (!category) { showFieldError('err-category', 'habit-category-input'); valid = false; }
  if (!valid) return;

  const data = {
    name,
    description:  $('#habit-desc-input').value,
    category,
    weeklyTarget: $('#habit-target-input').value,
    color:        ui.selectedColor
  };

  const habitId = $('#habit-id-input').value;
  if (habitId) {
    updateHabit(habitId, data);
    showToast('Habit updated!', 'success');
  } else {
    createHabit(data);
    showToast('Habit created! 🎉', 'success');
  }
  closeModal($('#habit-modal'));
  render();
}

function renderColorPicker(selected) {
  const picker = $('#color-picker');
  if (!picker) return;
  picker.innerHTML = '';
  HABIT_COLORS.forEach(color => {
    const btn = document.createElement('button');
    btn.type  = 'button';
    btn.className = `color-swatch${color === selected ? ' selected' : ''}`;
    btn.style.background = color;
    btn.setAttribute('aria-label',   `Select colour ${color}`);
    btn.setAttribute('aria-pressed', String(color === selected));
    btn.addEventListener('click', () => {
      ui.selectedColor = color;
      $$('.color-swatch').forEach(s => {
        s.classList.remove('selected');
        s.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('selected');
      btn.setAttribute('aria-pressed', 'true');
    });
    picker.appendChild(btn);
  });
}

// ----------------------------------------------------------------
// MODAL — Backdate Check-in
// ----------------------------------------------------------------
function openBackdateModal() {
  const active = getActiveHabits();
  if (!active.length) { showToast('Add a habit first.', 'warning'); return; }

  const sel = $('#backdate-habit-select');
  sel.innerHTML = '<option value="">Choose a habit…</option>';
  active.forEach(h => {
    const opt = document.createElement('option');
    opt.value       = h.id;
    opt.textContent = unesc(h.name);
    sel.appendChild(opt);
  });

  ui.backdateSelectedHabitId = active[0].id;
  sel.value = ui.backdateSelectedHabitId;
  renderBackdateCalendar(ui.backdateSelectedHabitId);
  openModal($('#backdate-modal'));
}

function renderBackdateCalendar(habitId) {
  const calGrid = $('#backdate-calendar');
  if (!calGrid) return;

  calGrid.innerHTML = '';
  // Day headers
  ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d => {
    const el = document.createElement('div');
    el.className = 'date-cell';
    el.style.cssText = 'font-weight:700;background:transparent;border:none;color:var(--text-muted);font-size:0.625rem';
    el.textContent = d;
    calGrid.appendChild(el);
  });

  const today     = todayStr();
  const todayDate = parseDate(today);

  const startDate = new Date(todayDate);
  startDate.setDate(startDate.getDate() - 29);

  // Start from Sunday of that week
  const firstSunday = new Date(startDate);
  firstSunday.setDate(startDate.getDate() - startDate.getDay());

  // End on Saturday of today's week
  const lastSaturday = new Date(todayDate);
  lastSaturday.setDate(todayDate.getDate() + (6 - todayDate.getDay()));

  let cursor = new Date(firstSunday);
  while (cursor <= lastSaturday) {
    const dateStr  = localDateStr(cursor);
    const isBefore = cursor < startDate;
    const isFuture = cursor > todayDate;
    const isToday  = dateStr === today;
    const isDone   = habitId ? isCheckedIn(habitId, dateStr) : false;

    const el = document.createElement('div');
    el.className = 'date-cell';

    if (isBefore) {
      el.classList.add('empty');
    } else if (isFuture) {
      el.classList.add('future');
      el.textContent = cursor.getDate();
    } else {
      if (isToday) el.classList.add('today');
      if (isDone)  el.classList.add('completed');
      el.textContent = cursor.getDate();
      el.title = `${formatDate(dateStr)}${isDone ? ' — ✓ Done' : ''}`;
      el.addEventListener('click', () => handleBackdateClick(dateStr, habitId));
    }

    calGrid.appendChild(el);
    cursor.setDate(cursor.getDate() + 1);
  }
}

function handleBackdateClick(dateStr, habitId) {
  if (!habitId) { showToast('Please select a habit.', 'warning'); return; }
  const result = toggleCheckin(habitId, dateStr);
  const info   = $('#backdate-selected-info');
  if (info) info.textContent = result === 'added'
    ? `✓ Marked complete: ${formatDate(dateStr)}`
    : `Unmarked: ${formatDate(dateStr)}`;
  renderBackdateCalendar(habitId);
  render();
}

// ----------------------------------------------------------------
// MODAL — Reminder
// ----------------------------------------------------------------
function openReminderModal(habitId) {
  const habit = getHabitById(habitId);
  if (!habit) return;
  $('#reminder-habit-id').value          = habitId;
  $('#reminder-habit-name-label').textContent = `Reminder for: ${unesc(habit.name)}`;
  $('#reminder-time-input').value        = habit.reminder.time || '08:00';
  $('#reminder-enabled-chk').checked     = habit.reminder.enabled;
  ui.selectedReminderDays                = [...(habit.reminder.days || [0,1,2,3,4,5,6])];
  updateDayBtns();
  openModal($('#reminder-modal'));
}

function saveReminderForm() {
  const habitId = $('#reminder-habit-id').value;
  const habit   = getHabitById(habitId);
  if (!habit) return;
  habit.reminder = {
    enabled: $('#reminder-enabled-chk').checked,
    time:    $('#reminder-time-input').value || '08:00',
    days:    [...ui.selectedReminderDays]
  };
  save();
  if (habit.reminder.enabled) scheduleNotification(habit);
  showToast('Reminder saved!', 'success');
  closeModal($('#reminder-modal'));
  render();
}

function updateDayBtns() {
  const group = $('#reminder-days-group');
  if (!group) return;
  $$('.day-btn', group).forEach(btn => {
    const day = Number(btn.dataset.day);
    const sel = ui.selectedReminderDays.includes(day);
    btn.classList.toggle('selected', sel);
    btn.setAttribute('aria-pressed', String(sel));
  });
}

// ----------------------------------------------------------------
// BROWSER NOTIFICATIONS
// ----------------------------------------------------------------
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    showToast('Notifications not supported in this browser.', 'warning'); return;
  }
  const result = await Notification.requestPermission();
  if (result === 'granted') {
    showToast('Notifications enabled! ✓', 'success');
    new Notification('HabitFlow', { body: "You'll now receive habit reminders.", icon: 'icon-192.png' });
  } else {
    showToast('Notification permission denied.', 'warning');
  }
  renderRemindersPage();
}

function scheduleNotification(habit) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (!habit.reminder.enabled) return;
  const now = new Date();
  if (!habit.reminder.days.includes(now.getDay())) return;
  const [h, m]       = habit.reminder.time.split(':').map(Number);
  const reminderTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
  const msUntil      = reminderTime - Date.now();
  if (msUntil > 0) {
    setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification(`Time for: ${unesc(habit.name)}`, {
          body: 'Keep your streak going! Check in now.',
          icon: 'icon-192.png',
          tag:  `habit-${habit.id}`
        });
      }
    }, msUntil);
  }
}

function scheduleAllNotifications() {
  getActiveHabits().forEach(h => { if (h.reminder.enabled) scheduleNotification(h); });
}

// ----------------------------------------------------------------
// MODAL UTILITIES
// ----------------------------------------------------------------
function openModal(modal) {
  if (!modal) return;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  later(() => {
    const first = modal.querySelector('button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])');
    first?.focus();
  }, 60);
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

function closeAllModals() {
  $$('.modal-backdrop').forEach(m => closeModal(m));
}

document.addEventListener('click',   e => { if (e.target.classList.contains('modal-backdrop')) closeAllModals(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAllModals(); });

// ----------------------------------------------------------------
// FORM HELPERS
// ----------------------------------------------------------------
function showFieldError(errId, inputId) {
  $(`#${errId}`)?.classList.add('visible');
  const input = $(`#${inputId}`);
  if (input) { input.classList.add('error'); input.focus(); }
}

function clearFormErrors() {
  $$('.form-error').forEach(el   => el.classList.remove('visible'));
  $$('.form-control.error').forEach(el => el.classList.remove('error'));
}

// ----------------------------------------------------------------
// TOAST
// ----------------------------------------------------------------
function showToast(message, type = 'info') {
  const container = $('#toast-container');
  if (!container) return;

  const icons = {
    success: '<polyline points="20 6 9 17 4 12"/>',
    error:   '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    warning: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    info:    '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
  };

  const toast       = document.createElement('div');
  toast.className   = `toast ${type}`;
  toast.innerHTML   = `
    <svg class="toast-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      ${icons[type] || icons.info}
    </svg>${esc(message)}`;
  container.appendChild(toast);

  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3200);
}

// ----------------------------------------------------------------
// THEME
// ----------------------------------------------------------------
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  $('#theme-icon-moon').style.display = theme === 'dark' ? 'none' : '';
  $('#theme-icon-sun').style.display  = theme === 'dark' ? '' : 'none';
  setEl('#theme-label', theme === 'dark' ? 'Light mode' : 'Dark mode');
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(state.theme);
  save();
}

// ----------------------------------------------------------------
// MOBILE SIDEBAR
// ----------------------------------------------------------------
function openMobileSidebar() {
  $('#sidebar').classList.add('mobile-open');
  $('#sidebar-overlay').classList.add('visible');
  $('#mobile-menu-btn')?.setAttribute('aria-expanded', 'true');
}

function closeMobileSidebar() {
  $('#sidebar').classList.remove('mobile-open');
  $('#sidebar-overlay').classList.remove('visible');
  $('#mobile-menu-btn')?.setAttribute('aria-expanded', 'false');
}

// ----------------------------------------------------------------
// EXPORT / IMPORT
// ----------------------------------------------------------------
function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href: url, download: `habitflow-backup-${todayStr()}.json`
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Data exported successfully!', 'success');
}

function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!imported || !Array.isArray(imported.habits)) {
        showToast('Invalid file — please use a HabitFlow export.', 'error'); return;
      }
      if (!confirm(`Replace all data with ${imported.habits.length} habits from backup?`)) return;
      state.habits   = imported.habits.map(migrateHabit);
      state.checkins = imported.checkins || {};
      if (imported.theme === 'dark' || imported.theme === 'light') state.theme = imported.theme;
      save();
      applyTheme(state.theme);
      showToast(`Imported ${state.habits.length} habits!`, 'success');
      render();
    } catch {
      showToast('Could not parse the file. Is it a valid JSON export?', 'error');
    }
  };
  reader.readAsText(file);
}

// ----------------------------------------------------------------
// PWA
// ----------------------------------------------------------------
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {/* not critical */});
  }
}

// ----------------------------------------------------------------
// MICRO UTILITIES
// ----------------------------------------------------------------
function setEl(sel, text) {
  const el = $(sel);
  if (el) el.textContent = text;
}

function later(fn, ms = 0) {
  setTimeout(fn, ms);
}

// ----------------------------------------------------------------
// EVENT BINDING
// ----------------------------------------------------------------
function bindEvents() {
  // Navigation
  $$('.nav-item[data-page]').forEach(btn =>
    btn.addEventListener('click', () => navigateTo(btn.dataset.page))
  );

  // Theme
  $('#theme-toggle-btn')?.addEventListener('click', toggleTheme);

  // Mobile sidebar
  $('#mobile-menu-btn')?.addEventListener('click', openMobileSidebar);
  $('#sidebar-overlay')?.addEventListener('click', closeMobileSidebar);

  // New Habit buttons
  $('#topbar-add-habit-btn')?.addEventListener('click', openAddHabitModal);
  $('#habits-add-btn')?.addEventListener('click',       openAddHabitModal);

  // Habit modal
  $('#habit-modal-close')?.addEventListener('click',  () => closeModal($('#habit-modal')));
  $('#habit-modal-cancel')?.addEventListener('click', () => closeModal($('#habit-modal')));
  $('#habit-modal-save')?.addEventListener('click',   saveHabitForm);
  $('#habit-archive-btn')?.addEventListener('click',  () => {
    const habitId = $('#habit-id-input').value;
    if (!habitId) return;
    const habit = getHabitById(habitId);
    if (!habit) return;
    if (confirm(`Archive "${unesc(habit.name)}"? Your history will be preserved.`)) {
      archiveHabit(habitId);
      closeModal($('#habit-modal'));
      showToast(`"${unesc(habit.name)}" archived.`, 'info');
      render();
    }
  });

  // Clear errors on input
  $('#habit-name-input')?.addEventListener('input', () => {
    $('#err-name')?.classList.remove('visible');
    $('#habit-name-input')?.classList.remove('error');
  });
  $('#habit-category-input')?.addEventListener('change', () => {
    $('#err-category')?.classList.remove('visible');
    $('#habit-category-input')?.classList.remove('error');
  });

  // Backdate modal
  $('#backdate-btn')?.addEventListener('click', openBackdateModal);
  $('#backdate-modal-close')?.addEventListener('click',  () => closeModal($('#backdate-modal')));
  $('#backdate-modal-close2')?.addEventListener('click', () => closeModal($('#backdate-modal')));
  $('#backdate-habit-select')?.addEventListener('change', e => {
    ui.backdateSelectedHabitId = e.target.value;
    renderBackdateCalendar(e.target.value);
  });

  // Reminder modal
  $('#reminder-modal-close')?.addEventListener('click',  () => closeModal($('#reminder-modal')));
  $('#reminder-modal-cancel')?.addEventListener('click', () => closeModal($('#reminder-modal')));
  $('#reminder-modal-save')?.addEventListener('click',   saveReminderForm);

  // Day buttons
  $$('.day-btn', $('#reminder-days-group') || document).forEach(btn =>
    btn.addEventListener('click', () => {
      const day = Number(btn.dataset.day);
      const idx = ui.selectedReminderDays.indexOf(day);
      if (idx === -1) ui.selectedReminderDays.push(day);
      else            ui.selectedReminderDays.splice(idx, 1);
      updateDayBtns();
    })
  );

  // Category filter tabs
  $$('[data-filter]').forEach(btn =>
    btn.addEventListener('click', () => {
      ui.habitsFilter = btn.dataset.filter;
      renderHabitsPage();
    })
  );

  // Export
  $('#export-btn')?.addEventListener('click', exportData);

  // Import
  const importFile = $('#import-file');
  importFile?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) importData(file);
    importFile.value = '';
  });

  // Colour picker init
  renderColorPicker(ui.selectedColor);
}

// ----------------------------------------------------------------
// INIT
// ----------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  load();
  applyTheme(state.theme);
  bindEvents();
  scheduleAllNotifications();
  registerServiceWorker();
  navigateTo('dashboard');
});
