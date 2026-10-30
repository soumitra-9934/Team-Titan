// ================================================================
// HabitFlow — Habit Tracker & Consistency Dashboard
// Hack Day Haldia'26 | Team Titan
// Stack: Vanilla HTML + CSS + JS | Persistence: localStorage
// Strict Icon System: Lucide Outline Icons (No Emojis)
// ================================================================

'use strict';

// ----------------------------------------------------------------
// CONSTANTS & LUCIDE SVG ICON DEFINITIONS
// ----------------------------------------------------------------
const STORAGE_KEY = 'hackday-haldia-team-titan';
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const CATEGORIES = ['health', 'learning', 'mindfulness', 'fitness', 'productivity', 'other'];

const CATEGORY_LABEL = {
  health: 'Health',
  learning: 'Learning',
  mindfulness: 'Mindfulness',
  fitness: 'Fitness',
  productivity: 'Productivity',
  other: 'Other'
};

// Lucide icon names corresponding to categories
const CATEGORY_ICON_NAME = {
  health: 'heart-pulse',
  learning: 'book-open',
  mindfulness: 'brain',
  fitness: 'dumbbell',
  productivity: 'zap',
  other: 'compass'
};

const HABIT_COLORS = [
  '#6554F0', '#8B5CF6', '#EC4899', '#F43F5E', '#F97316',
  '#EAB308', '#16A675', '#0284C7', '#06B6D4', '#64748B'
];

const DAY_NAMES_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DAY_NAMES_FULL  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Lucide Outline SVG Icon Library (SVG strings without emojis)
 */
function lucideIcon(name, className = 'icon') {
  const icons = {
    // Nav & System
    'layout-dashboard': '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
    'list-checks':      '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
    'chart-combined':   '<path d="M12 16v5"/><path d="M16 14v7"/><path d="M20 10v11"/><path d="m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15"/><path d="M4 18v3"/><path d="M8 14v7"/>',
    'calendar-days':    '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>',
    'timer':            '<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="12" y1="14" y2="8"/><circle cx="12" cy="14" r="8"/>',
    'settings':         '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    'archive':          '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
    'layers':           '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    'flame':            '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    'trophy':           '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>',
    'circle-check':     '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    'check':            '<polyline points="20 6 9 17 4 12"/>',
    'plus':             '<path d="M5 12h14"/><path d="M12 5v14"/>',
    'pencil':           '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
    'trash-2':          '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
    'bell':             '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    'sparkles':         '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>',
    'target':           '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    'rotate-ccw':       '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    'trending-up':      '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
    'clock':            '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    'download':         '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    'upload':           '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
    'chevron-right':    '<path d="m9 18 6-6-6-6"/>',
    'calendar':         '<rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>',
    'search':           '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',

    // Category Specific Lucide Icons
    'heart-pulse':      '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>',
    'book-open':        '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    'brain':            '<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04z"/>',
    'dumbbell':         '<path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/>',
    'zap':              '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    'compass':          '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>'
  };

  const body = icons[name] || icons['target'];
  return `<svg class="${className}" viewBox="0 0 24 24">${body}</svg>`;
}

// ----------------------------------------------------------------
// STATE MANAGEMENT & PERSISTENCE
// ----------------------------------------------------------------
let state = {
  habits: [],
  checkins: {},
  theme: 'light'
};

// UI ephemeral state
let ui = {
  currentPage: 'dashboard',
  habitsFilter: 'all',
  selectedColor: HABIT_COLORS[0],
  selectedReminderDays: [0, 1, 2, 3, 4, 5, 6],
  backdateSelectedHabitId: null,
  searchQuery: '',

  // Focus Timer state
  timerMode: 'pomodoro', // 'pomodoro' (25m), 'shortBreak' (5m), 'longBreak' (15m)
  timerSecondsLeft: 25 * 60,
  timerInterval: null,
  timerRunning: false,
};

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('HabitFlow: Storage full or disabled.', e);
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.habits)) {
        state.habits = parsed.habits.map(migrateHabit);
      }
      if (parsed.checkins && typeof parsed.checkins === 'object') {
        const clean = {};
        for (const [k, v] of Object.entries(parsed.checkins)) {
          clean[k] = Array.isArray(v) ? v.filter(d => typeof d === 'string') : [];
        }
        state.checkins = clean;
      }
      if (parsed.theme === 'dark' || parsed.theme === 'light') {
        state.theme = parsed.theme;
      }
    }
  } catch (e) {
    console.warn('HabitFlow: Error parsing stored data. Starting fresh.', e);
  }
}

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
      days:    Array.isArray(h.reminder?.days) ? h.reminder.days : [0, 1, 2, 3, 4, 5, 6]
    }
  };
}

// ----------------------------------------------------------------
// UTILITIES
// ----------------------------------------------------------------
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function unesc(str) {
  const div = document.createElement('div');
  div.innerHTML = str;
  return div.textContent;
}

function todayStr() {
  return localDateStr(new Date());
}

function localDateStr(d) {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dy}`;
}

function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function daysDiff(a, b) {
  return Math.round((parseDate(b) - parseDate(a)) / 86400000);
}

function formatDate(str) {
  const d = parseDate(str);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localDateStr(d);
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16) || 101;
  const g = parseInt(hex.slice(3, 5), 16) || 84;
  const b = parseInt(hex.slice(5, 7), 16) || 240;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function setEl(sel, text) {
  const el = $(sel);
  if (el) el.textContent = text;
}

function later(fn, ms = 0) {
  setTimeout(fn, ms);
}

// ----------------------------------------------------------------
// DATA OPERATIONS — HABITS & CHECK-INS
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
    reminder: { enabled: false, time: '08:00', days: [0, 1, 2, 3, 4, 5, 6] }
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
  state.habits = state.habits.filter(h => h.id !== id);
  delete state.checkins[id];
  save();
}

function getCheckins(habitId) {
  return state.checkins[habitId] || [];
}

function isCheckedIn(habitId, dateStr) {
  return getCheckins(habitId).includes(dateStr);
}

function toggleCheckin(habitId, dateStr) {
  if (!state.checkins[habitId]) state.checkins[habitId] = [];
  const idx = state.checkins[habitId].indexOf(dateStr);
  if (idx === -1) {
    state.checkins[habitId].push(dateStr);
    state.checkins[habitId].sort();
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
function calcStreaks(habitId) {
  const checkins = getCheckins(habitId);
  if (!checkins.length) return { current: 0, longest: 0 };

  const dateSet   = new Set(checkins);
  const today     = todayStr();
  const yesterday = daysAgo(1);
  const sorted    = [...dateSet].sort();

  // Longest streak
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

  // Current streak
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
// STATISTICS & WEEKLY DATA
// ----------------------------------------------------------------
function getWeekStart(dateStr) {
  const d   = parseDate(dateStr);
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - ((day + 6) % 7)); // Monday start
  return localDateStr(d);
}

function getCheckinsByWeek(habitId, weekStartStr) {
  return getCheckins(habitId).filter(d => {
    const diff = daysDiff(weekStartStr, d);
    return diff >= 0 && diff < 7;
  }).length;
}

function isoWeekNum(dateStr) {
  const d = parseDate(dateStr);
  const tmp = new Date(d);
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const w1 = new Date(tmp.getFullYear(), 0, 4);
  return 1 + Math.round(((tmp - w1) / 86400000 - 3 + ((w1.getDay() + 6) % 7)) / 7);
}

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

function weeklyCompletionRate(habitId) {
  const habit = getHabitById(habitId);
  if (!habit) return 0;
  const done = getCheckinsByWeek(habitId, getWeekStart(todayStr()));
  return Math.min(1, done / habit.weeklyTarget);
}

function consistencyScore() {
  const active = getActiveHabits();
  if (!active.length) return 0;
  const avg = active.reduce((s, h) => s + weeklyCompletionRate(h.id), 0) / active.length;
  return Math.round(avg * 100);
}

/**
 * Returns total count of unique days where ANY habit was checked in
 */
function getTotalActiveDays() {
  const allDates = new Set();
  Object.values(state.checkins).forEach(arr => {
    if (Array.isArray(arr)) arr.forEach(d => allDates.add(d));
  });
  return allDates.size;
}

// ----------------------------------------------------------------
// HEATMAP BUILDER & RENDERER
// ----------------------------------------------------------------
function buildHeatmapData(habitId, weeks = 12) {
  const totalDays = weeks * 7;
  const endDate   = new Date();
  const dow       = endDate.getDay();
  endDate.setDate(endDate.getDate() + (6 - dow)); // align to upcoming Saturday

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

function renderHeatmap(cells, container, habitId = null) {
  if (!container) return;
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
    lbl.style.width = '15px';
    const mo = parseDate(col[0].date).getMonth();
    if (mo !== lastMonth) {
      lbl.textContent = MONTH_NAMES_SHORT[mo];
      lastMonth = mo;
    }
    monthRow.appendChild(lbl);
  });

  // Weekday labels
  const dayLabels = document.createElement('div');
  dayLabels.className = 'heatmap-labels-left';
  for (let r = 0; r < 7; r++) {
    const lbl       = document.createElement('div');
    lbl.className   = 'heatmap-day-label';
    lbl.textContent = [1, 3, 5].includes(r) ? DAY_NAMES_SHORT[r] : '';
    dayLabels.appendChild(lbl);
  }

  // Grid columns
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
    ${[0, 1, 2, 3, 4].map(l => `<div class="heatmap-legend-cell" style="background:var(--heat-${l})"></div>`).join('')}
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
  const el    = e.currentTarget;
  const date  = el.getAttribute('data-date');
  const count = parseInt(el.getAttribute('data-count'), 10);
  const hid   = el.getAttribute('data-heatmap-habit-id') || null;

  let text;
  if (count === 0)  text = `${formatDate(date)} — No activity`;
  else if (hid)     text = `${formatDate(date)} — Completed`;
  else              text = `${formatDate(date)} — ${count} habit${count !== 1 ? 's' : ''} done`;

  const tip = $('#heatmap-tooltip');
  if (!tip) return;
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
  $('#heatmap-tooltip')?.classList.remove('visible');
}

// ----------------------------------------------------------------
// RENDER HELPERS: Empty States & Charts (NO EMOJIS)
// ----------------------------------------------------------------
function renderEmptyState(title, desc, iconName = 'sparkles', btnLabel = '', btnId = '') {
  return `
    <div class="empty-state">
      <div class="empty-state-icon" aria-hidden="true">
        ${lucideIcon(iconName, 'icon icon-lg')}
      </div>
      <div class="empty-state-title">${esc(title)}</div>
      <p class="empty-state-desc">${esc(desc)}</p>
      ${btnLabel ? `<button class="btn btn-primary btn-sm" id="${btnId}">${lucideIcon('plus', 'icon icon-sm')} <span>${esc(btnLabel)}</span></button>` : ''}
    </div>
  `;
}

function renderBarChart(container, data) {
  if (!container) return;
  if (!data.length || data.every(d => d.total === 0)) {
    container.innerHTML = `
      <div class="empty-state" style="padding:2rem 1rem">
        <div class="empty-state-icon" style="width:50px;height:50px;margin-bottom:0.75rem;">
          ${lucideIcon('chart-combined', 'icon')}
        </div>
        <div class="empty-state-title">No activity recorded</div>
        <p class="empty-state-desc">Complete habits to visualize your progress over time.</p>
      </div>`;
    return;
  }
  const max = Math.max(...data.map(d => d.total), 1);
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
// D. FOUR SUMMARY CARDS (Calculated from actual data)
// ----------------------------------------------------------------
function renderSummaryCards() {
  const statGrid = $('#dash-stat-grid');
  if (!statGrid) return;

  const today        = todayStr();
  const activeHabits = getActiveHabits();
  const totalActive  = activeHabits.length;
  const completedToday = activeHabits.filter(h => isCheckedIn(h.id, today)).length;

  // Best & current streaks
  let maxCurrentStreak = 0;
  activeHabits.forEach(h => {
    const s = calcStreaks(h.id);
    if (s.current > maxCurrentStreak) maxCurrentStreak = s.current;
  });

  // Completion rate today
  const completionRatePct = totalActive > 0 ? Math.round((completedToday / totalActive) * 100) : 0;

  // Days active (total distinct check-in dates in history)
  const totalActiveDays = getTotalActiveDays();

  statGrid.innerHTML = `
    <!-- Card 1: Total Habits -->
    <div class="stat-card">
      <div class="stat-top">
        <div class="stat-icon" style="background:#ECE9FE;color:#6554F0;">
          ${lucideIcon('layers', 'icon')}
        </div>
      </div>
      <div class="stat-value">${totalActive}</div>
      <div class="stat-label">Total Habits</div>
      <div class="stat-sub">${totalActive === 1 ? '1 active goal' : `${totalActive} active goals`}</div>
    </div>

    <!-- Card 2: Current Streak -->
    <div class="stat-card">
      <div class="stat-top">
        <div class="stat-icon" style="background:#FFF4ED;color:#F97316;">
          ${lucideIcon('flame', 'icon')}
        </div>
      </div>
      <div class="stat-value">${maxCurrentStreak} <span style="font-size:0.9375rem;font-weight:600;color:var(--text-secondary);">days</span></div>
      <div class="stat-label">Current Streak</div>
      <div class="stat-sub">Keep the momentum</div>
    </div>

    <!-- Card 3: Completion Rate -->
    <div class="stat-card">
      <div class="stat-top">
        <div class="stat-icon" style="background:#E8F8F2;color:#16A675;">
          ${lucideIcon('circle-check', 'icon')}
        </div>
      </div>
      <div class="stat-value">${completionRatePct}%</div>
      <div class="stat-label">Completion Rate</div>
      <div class="stat-sub">${completedToday} of ${totalActive} done today</div>
    </div>

    <!-- Card 4: Days Active -->
    <div class="stat-card">
      <div class="stat-top">
        <div class="stat-icon" style="background:#E0F2FE;color:#0284C7;">
          ${lucideIcon('calendar', 'icon')}
        </div>
      </div>
      <div class="stat-value">${totalActiveDays}</div>
      <div class="stat-label">Days Active</div>
      <div class="stat-sub">All-time consistency</div>
    </div>
  `;
}

// ----------------------------------------------------------------
// WEEKLY PROGRESS BARS (Right Column Widget)
// ----------------------------------------------------------------
function renderWeeklyProgressBars() {
  const container = $('#weekly-bars-container');
  if (!container) return;

  const todayStrVal = todayStr();
  const ws = getWeekStart(todayStrVal);
  const activeHabits = getActiveHabits();
  const totalActive  = activeHabits.length || 1;

  // Calculate checkins for Mon -> Sun of current week
  const daysInfo = [
    { name: 'Mo', offset: 0 },
    { name: 'Tu', offset: 1 },
    { name: 'We', offset: 2 },
    { name: 'Th', offset: 3 },
    { name: 'Fr', offset: 4 },
    { name: 'Sa', offset: 5 },
    { name: 'Su', offset: 6 }
  ];

  let completedDaysCount = 0;
  const barsHTML = daysInfo.map(item => {
    const d = new Date(parseDate(ws));
    d.setDate(d.getDate() + item.offset);
    const dStr = localDateStr(d);
    const isToday = (dStr === todayStrVal);

    // Count completions on this date
    let doneCount = 0;
    activeHabits.forEach(h => {
      if (isCheckedIn(h.id, dStr)) doneCount++;
    });

    const pct = Math.min(100, Math.round((doneCount / totalActive) * 100));
    if (pct > 0) completedDaysCount++;

    return `
      <div class="weekday-bar-col ${isToday ? 'today' : ''}" title="${item.name}: ${doneCount}/${totalActive} habits done">
        <div class="weekday-bar-track">
          <div class="weekday-bar-fill" style="height:${pct > 0 ? pct : 8}%;"></div>
        </div>
        <div class="weekday-bar-label">${item.name}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="weekday-bars-grid">
      ${barsHTML}
    </div>
  `;

  // Update header badge
  const badge = $('#weekly-progress-badge');
  if (badge) {
    const score = consistencyScore();
    badge.innerHTML = `
      <span class="habit-tag" style="background:var(--primary-light);color:var(--primary);font-weight:700;">
        ${lucideIcon('trending-up', 'icon icon-sm')} ${score}% Consistency
      </span>
    `;
  }
}

// ----------------------------------------------------------------
// RENDER — DASHBOARD
// ----------------------------------------------------------------
function renderDashboard() {
  const todayDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  });
  setEl('#header-today-date', todayDateStr);

  const fullTodayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric'
  });
  setEl('#today-checklist-sub', `Schedule for ${fullTodayStr}`);

  // Summary Cards
  renderSummaryCards();

  // Today's Checklist
  renderTodayChecklist();

  // Weekly Progress Bars
  renderWeeklyProgressBars();

  // Overall Heatmap
  const heatmapCont = $('#overall-heatmap-container');
  if (heatmapCont) {
    const active = getActiveHabits();
    if (!active.length) {
      heatmapCont.innerHTML = renderEmptyState(
        'No activity yet', 'Add your first habit to start logging your streaks.', 'sparkles', 'Add Habit', 'dash-empty-add-btn');
      later(() => $('#dash-empty-add-btn')?.addEventListener('click', openAddHabitModal));
    } else {
      renderHeatmap(buildHeatmapData(null, 12), heatmapCont);
    }
  }
}

// ----------------------------------------------------------------
// RENDER — TODAY'S HABITS CHECKLIST
// ----------------------------------------------------------------
function renderTodayChecklist() {
  const container = $('#today-checklist');
  if (!container) return;
  const today  = todayStr();
  let active = getActiveHabits();

  // Apply search query filter if typed
  if (ui.searchQuery) {
    const q = ui.searchQuery.toLowerCase();
    active = active.filter(h =>
      unesc(h.name).toLowerCase().includes(q) ||
      unesc(h.description).toLowerCase().includes(q) ||
      h.category.toLowerCase().includes(q)
    );
  }

  if (!active.length) {
    if (ui.searchQuery) {
      container.innerHTML = `
        <div class="empty-state" style="padding:2rem 1rem">
          <div class="empty-state-title">No habits match "${esc(ui.searchQuery)}"</div>
          <p class="empty-state-desc">Try clearing your search input.</p>
        </div>`;
    } else {
      container.innerHTML = renderEmptyState(
        'No habits tracked yet', 'Start by adding your first daily habit.', 'sparkles', 'Create Habit', 'checklist-add-btn');
      later(() => $('#checklist-add-btn')?.addEventListener('click', openAddHabitModal));
    }
    return;
  }

  container.innerHTML = '';
  active.forEach(habit => {
    const checked  = isCheckedIn(habit.id, today);
    const streaks  = calcStreaks(habit.id);
    const iconName = CATEGORY_ICON_NAME[habit.category] || 'compass';
    const item     = document.createElement('div');
    item.className = `checklist-item${checked ? ' completed' : ''}`;
    item.innerHTML = `
      <div class="cat-tile cat-${habit.category}" style="background:${hexToRgba(habit.color, 0.12)};color:${habit.color};">
        ${lucideIcon(iconName, 'icon')}
      </div>
      <div class="checklist-info">
        <div class="checklist-name">${habit.name}</div>
        <div class="checklist-meta">
          <span>${CATEGORY_LABEL[habit.category] || habit.category}</span>
          ${streaks.current > 0 ? `
            <span class="streak-badge">
              ${lucideIcon('flame', 'icon')}
              ${streaks.current}
            </span>
          ` : ''}
        </div>
      </div>
      <button class="check-btn${checked ? ' checked' : ''}"
        aria-label="${checked ? 'Undo' : 'Complete'} ${unesc(habit.name)}"
        data-habit-id="${habit.id}">
        ${lucideIcon('check', 'icon')}
      </button>
    `;

    item.querySelector('.check-btn').addEventListener('click', e => {
      e.stopPropagation();
      const hid    = e.currentTarget.dataset.habitId;
      const result = toggleCheckin(hid, today);
      showToast(
        result === 'added' ? `Completed: ${unesc(habit.name)}` : `Marked incomplete: ${unesc(habit.name)}`,
        result === 'added' ? 'success' : 'info'
      );
      render();
    });

    container.appendChild(item);
  });
}

// ----------------------------------------------------------------
// RENDER — MY HABITS PAGE
// ----------------------------------------------------------------
function renderHabitsPage() {
  const grid = $('#habits-grid');
  if (!grid) return;

  const filter = ui.habitsFilter;
  let habits   = getActiveHabits();
  if (filter !== 'all') habits = habits.filter(h => h.category === filter);

  if (ui.searchQuery) {
    const q = ui.searchQuery.toLowerCase();
    habits = habits.filter(h =>
      unesc(h.name).toLowerCase().includes(q) ||
      unesc(h.description).toLowerCase().includes(q) ||
      h.category.toLowerCase().includes(q)
    );
  }

  // Sync category filter tabs
  $$('[data-filter]').forEach(btn => {
    const isActive = btn.dataset.filter === filter;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive);
  });

  if (!habits.length) {
    const msg = filter === 'all'
      ? 'Add your first habit to begin tracking consistency.'
      : `No active habits in the "${CATEGORY_LABEL[filter] || filter}" category.`;
    grid.innerHTML = renderEmptyState('No habits found', msg, 'sparkles',
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
    const iconName = CATEGORY_ICON_NAME[habit.category] || 'compass';

    const card = document.createElement('div');
    card.className = 'habit-card';
    card.innerHTML = `
      <div class="habit-card-accent" style="background:${habit.color}"></div>
      <div class="habit-card-body">
        <div class="habit-card-header">
          <div class="cat-tile cat-${habit.category}" style="background:${hexToRgba(habit.color, 0.12)};color:${habit.color};">
            ${lucideIcon(iconName, 'icon')}
          </div>
          <div style="flex:1;min-width:0;">
            <div class="habit-card-name">${habit.name}</div>
            <div style="display:flex;gap:0.375rem;margin-top:0.25rem;flex-wrap:wrap;">
              <span class="habit-tag">${CATEGORY_LABEL[habit.category] || habit.category}</span>
              <span class="habit-tag">${lucideIcon('target', 'icon icon-sm')} ${habit.weeklyTarget}x / week</span>
            </div>
          </div>
          <div style="display:flex;gap:0.25rem;flex-shrink:0;">
            <button class="btn btn-ghost btn-icon-sm" data-action="edit" aria-label="Edit ${unesc(habit.name)}" title="Edit habit">
              ${lucideIcon('pencil', 'icon icon-sm')}
            </button>
            <button class="btn btn-ghost btn-icon-sm" data-action="reminder" aria-label="Reminder for ${unesc(habit.name)}" title="Reminder settings">
              ${lucideIcon('bell', 'icon icon-sm')}
            </button>
          </div>
        </div>

        ${habit.description ? `<div class="habit-card-desc">${habit.description}</div>` : ''}

        <div class="habit-card-stats">
          <div class="habit-card-stat">
            <span class="habit-card-stat-value">${streaks.current}</span>
            <span class="habit-card-stat-label">${lucideIcon('flame', 'icon icon-sm')} Streak</span>
          </div>
          <div class="habit-card-stat">
            <span class="habit-card-stat-value">${streaks.longest}</span>
            <span class="habit-card-stat-label">${lucideIcon('trophy', 'icon icon-sm')} Best</span>
          </div>
          <div class="habit-card-stat">
            <span class="habit-card-stat-value">${wrPct}%</span>
            <span class="habit-card-stat-label">${lucideIcon('calendar', 'icon icon-sm')} Week</span>
          </div>
          <div class="habit-card-stat">
            <span class="habit-card-stat-value">${total}</span>
            <span class="habit-card-stat-label">${lucideIcon('circle-check', 'icon icon-sm')} Total</span>
          </div>
        </div>

        <div class="habit-mini-heatmap" id="mini-hm-${habit.id}" data-heatmap-habit-id="${habit.id}"></div>

        <div class="habit-card-actions">
          <button class="btn ${checked ? 'btn-secondary' : 'btn-primary'} btn-sm" data-action="checkin">
            ${checked ? `${lucideIcon('check', 'icon icon-sm')} <span>Done Today</span>` : `${lucideIcon('plus', 'icon icon-sm')} <span>Check In</span>`}
          </button>
          <button class="btn btn-ghost btn-sm" data-action="archive" style="margin-left:auto;">
            ${lucideIcon('archive', 'icon icon-sm')} <span>Archive</span>
          </button>
        </div>
      </div>
    `;

    card.querySelector('[data-action="edit"]').addEventListener('click',     () => openEditHabitModal(habit.id));
    card.querySelector('[data-action="reminder"]').addEventListener('click', () => openReminderModal(habit.id));
    card.querySelector('[data-action="checkin"]').addEventListener('click',  () => {
      const result = toggleCheckin(habit.id, todayStr());
      showToast(result === 'added' ? `✓ Completed: ${unesc(habit.name)}` : `Marked incomplete: ${unesc(habit.name)}`,
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

    // Mini heatmap (4 weeks)
    const miniCont = card.querySelector(`#mini-hm-${habit.id}`);
    if (miniCont) renderMiniHeatmap(miniCells, miniCont, habit.id);
  });
}

function renderMiniHeatmap(cells, container, habitId) {
  container.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:3px;';
  const weeks = Math.round(cells.length / 7);
  for (let w = 0; w < weeks; w++) {
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;gap:3px;';
    cells.slice(w * 7, w * 7 + 7).forEach(cell => {
      col.appendChild(buildHeatCell(cell, habitId));
    });
    wrap.appendChild(col);
  }
  container.appendChild(wrap);
}

// ----------------------------------------------------------------
// RENDER — ANALYTICS (STATISTICS) PAGE
// ----------------------------------------------------------------
function renderStatsPage() {
  const active = getActiveHabits();
  const today  = todayStr();

  // 4 Summary cards matching design system
  const summaryGrid = $('#stats-summary-grid');
  if (summaryGrid) {
    const totalCheckins  = active.reduce((s, h) => s + getCheckins(h.id).length, 0);
    const completedToday = active.filter(h => isCheckedIn(h.id, today)).length;
    const ws = getWeekStart(today);
    let weekDone = 0, weekTarget = 0;
    active.forEach(h => { weekDone += getCheckinsByWeek(h.id, ws); weekTarget += h.weeklyTarget; });
    const weekRate = weekTarget > 0 ? Math.round((weekDone / weekTarget) * 100) : 0;
    const score    = consistencyScore();

    summaryGrid.innerHTML = `
      <div class="stat-card">
        <div class="stat-top">
          <div class="stat-icon" style="background:#ECE9FE;color:#6554F0;">
            ${lucideIcon('circle-check', 'icon')}
          </div>
        </div>
        <div class="stat-value">${totalCheckins}</div>
        <div class="stat-label">Total Check-ins</div>
        <div class="stat-sub">All-time completion count</div>
      </div>

      <div class="stat-card">
        <div class="stat-top">
          <div class="stat-icon" style="background:#E8F8F2;color:#16A675;">
            ${lucideIcon('zap', 'icon')}
          </div>
        </div>
        <div class="stat-value">${completedToday}/${active.length}</div>
        <div class="stat-label">Today's Completed</div>
        <div class="stat-sub">Target for current day</div>
      </div>

      <div class="stat-card">
        <div class="stat-top">
          <div class="stat-icon" style="background:#FFF4ED;color:#F97316;">
            ${lucideIcon('layers', 'icon')}
          </div>
        </div>
        <div class="stat-value">${weekDone}/${weekTarget}</div>
        <div class="stat-label">Weekly Goals Hit</div>
        <div class="stat-sub">${weekRate}% of target met</div>
      </div>

      <div class="stat-card">
        <div class="stat-top">
          <div class="stat-icon" style="background:#F3E8FF;color:#8B5CF6;">
            ${lucideIcon('trophy', 'icon')}
          </div>
        </div>
        <div class="stat-value">${score}%</div>
        <div class="stat-label">Consistency Rating</div>
        <div class="stat-sub">Weekly performance score</div>
      </div>
    `;
  }

  // Weekly & monthly charts
  const wc = $('#weekly-chart');
  if (wc) renderBarChart(wc, getWeeklyData(8));
  const mc = $('#monthly-chart');
  if (mc) renderBarChart(mc, getMonthlyData(6));

  // Habit progress list
  const progressList = $('#habit-progress-list');
  if (progressList) {
    if (!active.length) {
      progressList.innerHTML = renderEmptyState('No habits active', 'Add habits to monitor weekly targets.', 'sparkles');
    } else {
      progressList.innerHTML = '';
      const ws2 = getWeekStart(today);
      active.forEach(habit => {
        const done = getCheckinsByWeek(habit.id, ws2);
        const pct  = Math.round(Math.min(1, done / habit.weeklyTarget) * 100);
        const iconName = CATEGORY_ICON_NAME[habit.category] || 'compass';
        const row  = document.createElement('div');
        row.className = 'habit-progress-row';
        row.innerHTML = `
          <div class="habit-progress-header">
            <div class="habit-progress-name">
              <span style="color:${habit.color};display:inline-flex;">${lucideIcon(iconName, 'icon icon-sm')}</span>
              <span>${habit.name}</span>
            </div>
            <div class="habit-progress-pct">${done}/${habit.weeklyTarget} (${pct}%)</div>
          </div>
          <div class="habit-progress-track">
            <div class="habit-progress-fill" style="width:${pct}%;background:${habit.color}"
              role="progressbar" aria-valuenow="${pct}" aria-valuemax="100" aria-label="${unesc(habit.name)} progress"></div>
          </div>
        `;
        progressList.appendChild(row);
      });
    }
  }

  // Consistency score circular/number display
  const consistencyDiv = $('#consistency-display');
  if (consistencyDiv) {
    const score = consistencyScore();
    const msg   = score >= 80 ? 'Exceptional consistency — maintain your momentum!'
                : score >= 50 ? 'Steady progress — keep checking in daily!'
                : score >= 20 ? 'Building initial traction — stay dedicated.'
                : 'Get started by completing habits on your schedule.';
    consistencyDiv.innerHTML = `
      <div class="consistency-score">${score}%</div>
      <div class="consistency-label">${esc(msg)}</div>
    `;
  }
}

// ----------------------------------------------------------------
// RENDER — CALENDAR / HEATMAP PAGE
// ----------------------------------------------------------------
function renderHeatmapPage() {
  const container = $('#heatmap-page-container');
  if (!container) return;
  container.innerHTML = '';

  const active = getActiveHabits();
  if (!active.length) {
    container.innerHTML = renderEmptyState('No habits found', 'Add habits to view activity heatmaps.', 'calendar-days');
    return;
  }

  // Combined overall heatmap card
  const overallCard = document.createElement('div');
  overallCard.className = 'card';
  overallCard.style.marginBottom = '1.75rem';
  overallCard.innerHTML = `
    <div class="card-header">
      <div>
        <div class="card-title">Combined Habit Activity</div>
        <div class="card-subtitle">Aggregated completion intensity across all active habits — past 12 weeks</div>
      </div>
    </div>
    <div class="card-body"><div id="hmap-overall-full"></div></div>
  `;
  container.appendChild(overallCard);
  renderHeatmap(buildHeatmapData(null, 12), overallCard.querySelector('#hmap-overall-full'));

  // Per-habit heatmaps
  active.forEach(habit => {
    const { current, longest } = calcStreaks(habit.id);
    const totalDone = getCheckins(habit.id).length;
    const iconName  = CATEGORY_ICON_NAME[habit.category] || 'compass';

    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = '1.25rem';
    card.innerHTML = `
      <div class="card-header">
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <div class="cat-tile cat-${habit.category}" style="width:34px;height:34px;background:${hexToRgba(habit.color, 0.12)};color:${habit.color};">
            ${lucideIcon(iconName, 'icon icon-sm')}
          </div>
          <div>
            <div class="card-title">${habit.name}</div>
            <div class="card-subtitle">
              ${CATEGORY_LABEL[habit.category] || habit.category} &nbsp;·&nbsp;
              ${streaks.current} streak &nbsp;·&nbsp; ${longest} best &nbsp;·&nbsp; ${totalDone} total check-ins
            </div>
          </div>
        </div>
      </div>
      <div class="card-body">
        <div id="hmap-${habit.id}" data-heatmap-habit-id="${habit.id}"></div>
      </div>
    `;
    container.appendChild(card);
    renderHeatmap(buildHeatmapData(habit.id, 12), card.querySelector(`#hmap-${habit.id}`), habit.id);
  });
}

// ----------------------------------------------------------------
// RENDER — FOCUS TIMER (POMODORO) PAGE
// ----------------------------------------------------------------
function renderTimerPage() {
  const select = $('#timer-habit-select');
  if (select) {
    const currentVal = select.value;
    select.innerHTML = '<option value="">General Focus (No habit)</option>';
    getActiveHabits().forEach(h => {
      const opt = document.createElement('option');
      opt.value = h.id;
      opt.textContent = unesc(h.name);
      select.appendChild(opt);
    });
    select.value = currentVal;
  }
}

function updateTimerDisplay() {
  const m = Math.floor(ui.timerSecondsLeft / 60);
  const s = ui.timerSecondsLeft % 60;
  const timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  setEl('#timer-time', timeStr);
}

function setTimerMode(mode) {
  ui.timerMode = mode;
  if (ui.timerInterval) {
    clearInterval(ui.timerInterval);
    ui.timerInterval = null;
  }
  ui.timerRunning = false;
  $('#timer-play-icon').style.display  = '';
  $('#timer-pause-icon').style.display = 'none';
  setEl('#timer-toggle-text', 'Start Focus');

  if (mode === 'pomodoro') {
    ui.timerSecondsLeft = 25 * 60;
    setEl('#timer-mode-label', 'Focus Session');
  } else if (mode === 'shortBreak') {
    ui.timerSecondsLeft = 5 * 60;
    setEl('#timer-mode-label', 'Short Break');
  } else if (mode === 'longBreak') {
    ui.timerSecondsLeft = 15 * 60;
    setEl('#timer-mode-label', 'Long Break');
  }

  $$('.timer-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
  updateTimerDisplay();
}

function toggleTimer() {
  if (ui.timerRunning) {
    clearInterval(ui.timerInterval);
    ui.timerInterval = null;
    ui.timerRunning = false;
    $('#timer-play-icon').style.display  = '';
    $('#timer-pause-icon').style.display = 'none';
    setEl('#timer-toggle-text', 'Resume');
  } else {
    ui.timerRunning = true;
    $('#timer-play-icon').style.display  = 'none';
    $('#timer-pause-icon').style.display = '';
    setEl('#timer-toggle-text', 'Pause');

    ui.timerInterval = setInterval(() => {
      if (ui.timerSecondsLeft > 0) {
        ui.timerSecondsLeft--;
        updateTimerDisplay();
      } else {
        clearInterval(ui.timerInterval);
        ui.timerInterval = null;
        ui.timerRunning = false;
        $('#timer-play-icon').style.display  = '';
        $('#timer-pause-icon').style.display = 'none';
        setEl('#timer-toggle-text', 'Start Focus');

        // Play gentle audio tone via Web Audio API
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(587.33, ctx.currentTime);
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          osc.start();
          osc.stop(ctx.currentTime + 0.6);
        } catch (_) {}

        // Check in habit if selected
        const habitId = $('#timer-habit-select')?.value;
        if (habitId && ui.timerMode === 'pomodoro') {
          toggleCheckin(habitId, todayStr());
          showToast(`Completed focus session! Marked habit complete.`, 'success');
        } else {
          showToast(`Timer finished! Take a well-deserved break.`, 'info');
        }
        render();
      }
    }, 1000);
  }
}

function resetTimer() {
  setTimerMode(ui.timerMode);
}

// ----------------------------------------------------------------
// RENDER — REMINDERS PAGE
// ----------------------------------------------------------------
function renderRemindersPage() {
  const container = $('#reminder-list');
  if (!container) return;

  const bannerWrap = $('#notif-banner-wrap');
  if (bannerWrap) {
    if (!('Notification' in window)) {
      bannerWrap.innerHTML = '';
    } else if (Notification.permission === 'default') {
      bannerWrap.innerHTML = `
        <div class="card" style="padding:1rem 1.25rem;margin-bottom:1.25rem;background:#FEF3C7;border-color:#FDE68A;color:#92400E;display:flex;align-items:center;gap:0.75rem;">
          ${lucideIcon('bell', 'icon')}
          <span style="font-size:0.875rem;font-weight:500;">Enable browser alerts to receive habit reminders directly on your desktop.</span>
          <button class="btn btn-primary btn-sm" style="margin-left:auto;" id="request-notif-btn">Enable Alerts</button>
        </div>`;
      later(() => $('#request-notif-btn')?.addEventListener('click', requestNotificationPermission));
    } else if (Notification.permission === 'denied') {
      bannerWrap.innerHTML = `
        <div class="card" style="padding:1rem 1.25rem;margin-bottom:1.25rem;background:var(--danger-light);border-color:rgba(239,68,68,0.3);color:var(--danger);display:flex;align-items:center;gap:0.75rem;">
          ${lucideIcon('bell', 'icon')}
          <span style="font-size:0.875rem;font-weight:500;">Notifications are blocked by browser settings. Please allow notifications in site permissions.</span>
        </div>`;
    } else {
      bannerWrap.innerHTML = '';
    }
  }

  const active = getActiveHabits();
  if (!active.length) {
    container.innerHTML = renderEmptyState('No habits to configure', 'Add habits first to set up personalized reminders.', 'bell');
    return;
  }

  container.innerHTML = '';
  active.forEach(habit => {
    const r = habit.reminder;
    const dayTags = r.days.length === 7
      ? '<span class="reminder-day-tag">Every day</span>'
      : r.days.map(d => `<span class="reminder-day-tag">${DAY_NAMES_FULL[d]}</span>`).join('');
    const iconName = CATEGORY_ICON_NAME[habit.category] || 'compass';

    const item = document.createElement('div');
    item.className = 'reminder-item';
    item.innerHTML = `
      <div class="cat-tile cat-${habit.category}" style="width:38px;height:38px;background:${hexToRgba(habit.color, 0.12)};color:${habit.color};">
        ${lucideIcon(iconName, 'icon icon-sm')}
      </div>
      <div class="reminder-habit-info">
        <div class="reminder-habit-name">${habit.name}</div>
        <div class="reminder-time">
          ${lucideIcon('clock', 'icon icon-sm')}
          <span>${r.enabled ? r.time : 'No schedule set'}</span>
          ${!r.enabled ? '<span style="color:var(--text-muted);">(disabled)</span>' : ''}
        </div>
        <div class="reminder-days">${dayTags}</div>
      </div>
      <button class="btn btn-secondary btn-sm" data-action="edit-reminder">
        ${lucideIcon('pencil', 'icon icon-sm')} <span>Edit</span>
      </button>
    `;
    item.querySelector('[data-action="edit-reminder"]').addEventListener('click', () => openReminderModal(habit.id));
    container.appendChild(item);
  });
}

// ----------------------------------------------------------------
// RENDER — ARCHIVE PAGE
// ----------------------------------------------------------------
function renderArchivePage() {
  const grid = $('#archive-grid');
  if (!grid) return;

  const archived = getArchivedHabits();
  if (!archived.length) {
    grid.innerHTML = renderEmptyState(
      'Archive is empty',
      'Archived habits will be safely kept here with their entire historical streak data intact.',
      'archive'
    );
    return;
  }

  grid.innerHTML = '';
  archived.forEach(habit => {
    const total     = getCheckins(habit.id).length;
    const { longest } = calcStreaks(habit.id);
    const iconName  = CATEGORY_ICON_NAME[habit.category] || 'compass';

    const card = document.createElement('div');
    card.className = 'habit-card archived';
    card.innerHTML = `
      <div class="habit-card-accent" style="background:${habit.color};opacity:0.4;"></div>
      <div class="habit-card-body">
        <div class="habit-card-header">
          <div class="cat-tile cat-${habit.category}" style="background:${hexToRgba(habit.color, 0.12)};color:${habit.color};">
            ${lucideIcon(iconName, 'icon')}
          </div>
          <div>
            <div class="habit-card-name" style="color:var(--text-secondary);">${habit.name}</div>
            <div style="display:flex;gap:0.375rem;margin-top:0.25rem;">
              <span class="habit-tag">${CATEGORY_LABEL[habit.category] || habit.category}</span>
              <span class="habit-tag">Archived</span>
            </div>
          </div>
        </div>
        ${habit.description ? `<div class="habit-card-desc">${habit.description}</div>` : ''}
        <div class="habit-card-stats">
          <div class="habit-card-stat">
            <span class="habit-card-stat-value">${longest}</span>
            <span class="habit-card-stat-label">${lucideIcon('trophy', 'icon icon-sm')} Best</span>
          </div>
          <div class="habit-card-stat">
            <span class="habit-card-stat-value">${total}</span>
            <span class="habit-card-stat-label">${lucideIcon('circle-check', 'icon icon-sm')} Done</span>
          </div>
        </div>
        <div class="habit-card-actions">
          <button class="btn btn-secondary btn-sm" data-action="restore">
            ${lucideIcon('rotate-ccw', 'icon icon-sm')} <span>Restore</span>
          </button>
          <button class="btn btn-danger btn-sm" data-action="delete" style="margin-left:auto;">
            ${lucideIcon('trash-2', 'icon icon-sm')} <span>Delete Permanently</span>
          </button>
        </div>
      </div>
    `;

    card.querySelector('[data-action="restore"]').addEventListener('click', () => {
      restoreHabit(habit.id);
      showToast(`Restored: "${unesc(habit.name)}"`, 'success');
      render();
    });

    card.querySelector('[data-action="delete"]').addEventListener('click', () => {
      if (confirm(`Permanently delete "${unesc(habit.name)}"? All check-in history will be removed.`)) {
        deleteHabitPermanently(habit.id);
        showToast(`Permanently deleted "${unesc(habit.name)}"`, 'error');
        render();
      }
    });

    grid.appendChild(card);
  });
}

// ----------------------------------------------------------------
// MASTER RENDER DISPATCHER
// ----------------------------------------------------------------
function render() {
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
    case 'timer':     renderTimerPage();   break;
    case 'reminders': renderRemindersPage(); break;
    case 'archive':   renderArchivePage(); break;
    case 'settings':  break;
  }
}

// ----------------------------------------------------------------
// NAVIGATION & PAGE ROUTING
// ----------------------------------------------------------------
const PAGE_TITLES = {
  dashboard: 'Dashboard',
  habits:    'My Habits',
  stats:     'Analytics',
  heatmap:   'Calendar',
  timer:     'Focus Timer',
  settings:  'Settings',
  reminders: 'Reminders',
  archive:   'Archive'
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

  setEl('#topbar-title', PAGE_TITLES[page] || 'HabitFlow');
  closeMobileSidebar();
  render();
}

// ----------------------------------------------------------------
// MODALS: HABIT CRUD
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
  $('#habit-id-input').value          = habitId;
  $('#habit-modal-title').textContent = 'Edit Habit';
  $('#habit-name-input').value        = unesc(habit.name);
  $('#habit-desc-input').value        = unesc(habit.description);
  $('#habit-category-input').value    = habit.category;
  $('#habit-target-input').value      = String(habit.weeklyTarget);
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
  if (!name)     { showFieldError('err-name', 'habit-name-input'); valid = false; }
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
    showToast('Habit created!', 'success');
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
    btn.setAttribute('aria-label',   `Select color ${color}`);
    btn.setAttribute('aria-pressed', String(color === selected));
    btn.addEventListener('click', () => {
      ui.selectedColor = color;
      $$('.color-swatch', picker).forEach(s => {
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
// MODALS: BACKDATE CHECK-IN
// ----------------------------------------------------------------
function openBackdateModal() {
  const active = getActiveHabits();
  if (!active.length) { showToast('Add a habit first to log check-ins.', 'warning'); return; }

  const sel = $('#backdate-habit-select');
  sel.innerHTML = '<option value="">Choose a habit...</option>';
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
  ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach(d => {
    const el = document.createElement('div');
    el.className = 'date-cell';
    el.style.cssText = 'font-weight:700;background:transparent;border:none;color:var(--text-muted);font-size:0.6875rem;';
    el.textContent = d;
    calGrid.appendChild(el);
  });

  const todayStrVal = todayStr();
  const todayDate   = parseDate(todayStrVal);

  const startDate = new Date(todayDate);
  startDate.setDate(startDate.getDate() - 29);

  const firstSunday = new Date(startDate);
  firstSunday.setDate(startDate.getDate() - startDate.getDay());

  const lastSaturday = new Date(todayDate);
  lastSaturday.setDate(todayDate.getDate() + (6 - todayDate.getDay()));

  let cursor = new Date(firstSunday);
  while (cursor <= lastSaturday) {
    const dateStr  = localDateStr(cursor);
    const isBefore = cursor < startDate;
    const isFuture = cursor > todayDate;
    const isToday  = (dateStr === todayStrVal);
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
      el.title = `${formatDate(dateStr)}${isDone ? ' — Completed' : ''}`;
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
  if (info) {
    info.textContent = result === 'added'
      ? `Completed on ${formatDate(dateStr)}`
      : `Marked incomplete on ${formatDate(dateStr)}`;
  }
  renderBackdateCalendar(habitId);
  render();
}

// ----------------------------------------------------------------
// MODALS: REMINDER SETTINGS
// ----------------------------------------------------------------
function openReminderModal(habitId) {
  const habit = getHabitById(habitId);
  if (!habit) return;
  $('#reminder-habit-id').value               = habitId;
  $('#reminder-habit-name-label').textContent = `Configuring alerts for: ${unesc(habit.name)}`;
  $('#reminder-time-input').value             = habit.reminder.time || '08:00';
  $('#reminder-enabled-chk').checked          = habit.reminder.enabled;
  ui.selectedReminderDays                     = [...(habit.reminder.days || [0, 1, 2, 3, 4, 5, 6])];
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
  showToast('Reminder saved successfully!', 'success');
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
    showToast('Notifications are not supported in this browser.', 'warning');
    return;
  }
  const result = await Notification.requestPermission();
  if (result === 'granted') {
    showToast('Notifications enabled successfully!', 'success');
    try {
      new Notification('HabitFlow', {
        body: 'Alerts are configured. You will receive reminders for scheduled habits.',
        icon: 'icon-192.png'
      });
    } catch (_) {}
  } else {
    showToast('Notification permission was not granted.', 'warning');
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
          body: 'Keep your streak alive — log your progress in HabitFlow!',
          icon: 'icon-192.png',
          tag:  `habit-${habit.id}`
        });
      }
    }, msUntil);
  }
}

function scheduleAllNotifications() {
  getActiveHabits().forEach(h => {
    if (h.reminder.enabled) scheduleNotification(h);
  });
}

// ----------------------------------------------------------------
// MODAL CONTROLS & TRAP FOCUS
// ----------------------------------------------------------------
function openModal(modal) {
  if (!modal) return;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  later(() => {
    const first = modal.querySelector('button:not([disabled]), input, select, textarea');
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
// TOAST NOTIFICATIONS (Lucide Outline Icons)
// ----------------------------------------------------------------
function showToast(message, type = 'info') {
  const container = $('#toast-container');
  if (!container) return;

  const iconName = type === 'success' ? 'circle-check'
                 : type === 'error'   ? 'trash-2'
                 : type === 'warning' ? 'bell'
                 : 'sparkles';

  const toast     = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${lucideIcon(iconName, 'icon icon-sm')}</span>
    <span>${esc(message)}</span>
  `;
  container.appendChild(toast);

  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3200);
}

// ----------------------------------------------------------------
// THEME SWITCHER
// ----------------------------------------------------------------
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const moonIcon = $('#theme-icon-moon');
  const sunIcon  = $('#theme-icon-sun');
  if (moonIcon) moonIcon.style.display = theme === 'dark' ? 'none' : '';
  if (sunIcon)  sunIcon.style.display  = theme === 'dark' ? '' : 'none';
  setEl('#theme-label', theme === 'dark' ? 'Light mode' : 'Dark mode');
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(state.theme);
  save();
  showToast(state.theme === 'dark' ? 'Dark theme enabled' : 'Light theme enabled', 'info');
}

// ----------------------------------------------------------------
// MOBILE SIDEBAR
// ----------------------------------------------------------------
function openMobileSidebar() {
  $('#sidebar')?.classList.add('mobile-open');
  $('#sidebar-overlay')?.classList.add('visible');
  $('#mobile-menu-btn')?.setAttribute('aria-expanded', 'true');
}

function closeMobileSidebar() {
  $('#sidebar')?.classList.remove('mobile-open');
  $('#sidebar-overlay')?.classList.remove('visible');
  $('#mobile-menu-btn')?.setAttribute('aria-expanded', 'false');
}

// ----------------------------------------------------------------
// DATA EXPORT & IMPORT
// ----------------------------------------------------------------
function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href: url,
    download: `habitflow-backup-${todayStr()}.json`
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('HabitFlow backup exported successfully!', 'success');
}

function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!imported || !Array.isArray(imported.habits)) {
        showToast('Invalid file format. Please supply a valid HabitFlow backup.', 'error');
        return;
      }
      if (!confirm(`Restore ${imported.habits.length} habits from backup? This will replace current records.`)) return;

      state.habits   = imported.habits.map(migrateHabit);
      state.checkins = imported.checkins || {};
      if (imported.theme === 'dark' || imported.theme === 'light') state.theme = imported.theme;
      save();
      applyTheme(state.theme);
      showToast(`Successfully restored ${state.habits.length} habits!`, 'success');
      render();
    } catch {
      showToast('Could not parse the backup file. Verify valid JSON.', 'error');
    }
  };
  reader.readAsText(file);
}

// ----------------------------------------------------------------
// PWA SERVICE WORKER
// ----------------------------------------------------------------
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

// ----------------------------------------------------------------
// EVENT BINDINGS
// ----------------------------------------------------------------
function bindEvents() {
  // Navigation tabs
  $$('.nav-item[data-page]').forEach(btn =>
    btn.addEventListener('click', () => navigateTo(btn.dataset.page))
  );

  // Theme Toggles
  $('#theme-toggle-btn')?.addEventListener('click', toggleTheme);
  $('#settings-theme-btn')?.addEventListener('click', toggleTheme);

  // Mobile sidebar
  $('#mobile-menu-btn')?.addEventListener('click', openMobileSidebar);
  $('#sidebar-overlay')?.addEventListener('click', closeMobileSidebar);

  // New Habit buttons
  $('#hero-add-habit-btn')?.addEventListener('click',   openAddHabitModal);
  $('#topbar-add-habit-btn')?.addEventListener('click', openAddHabitModal);
  $('#habits-add-btn')?.addEventListener('click',       openAddHabitModal);

  // Header quick links
  $('#header-notif-btn')?.addEventListener('click', () => navigateTo('reminders'));
  $('#view-all-habits-btn')?.addEventListener('click', () => navigateTo('habits'));
  $('#view-calendar-btn')?.addEventListener('click', () => navigateTo('heatmap'));
  $('#settings-reminders-link-btn')?.addEventListener('click', () => navigateTo('reminders'));

  // Global search input
  $('#global-search')?.addEventListener('input', e => {
    ui.searchQuery = e.target.value.trim();
    if (ui.currentPage === 'dashboard') {
      renderTodayChecklist();
    } else if (ui.currentPage === 'habits') {
      renderHabitsPage();
    }
  });

  // Habit CRUD modal
  $('#habit-modal-close')?.addEventListener('click',  () => closeModal($('#habit-modal')));
  $('#habit-modal-cancel')?.addEventListener('click', () => closeModal($('#habit-modal')));
  $('#habit-modal-save')?.addEventListener('click',   saveHabitForm);
  $('#habit-archive-btn')?.addEventListener('click',  () => {
    const habitId = $('#habit-id-input').value;
    if (!habitId) return;
    const habit = getHabitById(habitId);
    if (!habit) return;
    if (confirm(`Archive "${unesc(habit.name)}"? Check-in history is preserved.`)) {
      archiveHabit(habitId);
      closeModal($('#habit-modal'));
      showToast(`"${unesc(habit.name)}" archived.`, 'info');
      render();
    }
  });

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

  // Reminder settings modal
  $('#reminder-modal-close')?.addEventListener('click',  () => closeModal($('#reminder-modal')));
  $('#reminder-modal-cancel')?.addEventListener('click', () => closeModal($('#reminder-modal')));
  $('#reminder-modal-save')?.addEventListener('click',   saveReminderForm);

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

  // Focus Timer controls
  $$('.timer-tab').forEach(tab =>
    tab.addEventListener('click', () => setTimerMode(tab.dataset.mode))
  );
  $('#timer-toggle-btn')?.addEventListener('click', toggleTimer);
  $('#timer-reset-btn')?.addEventListener('click',  resetTimer);

  // Export / Import
  $('#export-btn')?.addEventListener('click',          exportData);
  $('#settings-export-btn')?.addEventListener('click', exportData);

  $('#import-file')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) importData(file);
    e.target.value = '';
  });
  $('#settings-import-file')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) importData(file);
    e.target.value = '';
  });

  // Init color picker
  renderColorPicker(ui.selectedColor);
}

// ----------------------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  load();
  applyTheme(state.theme);
  bindEvents();
  scheduleAllNotifications();
  registerServiceWorker();
  navigateTo('dashboard');
});
