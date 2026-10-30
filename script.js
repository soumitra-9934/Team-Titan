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

const HABIT_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#6366f1'
];

const DAY_NAMES_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DAY_NAMES_FULL  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
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
 *       name: string,
 *       description: string,
 *       category: string,
 *       color: string,
 *       weeklyTarget: number (1-7),
 *       createdAt: string (ISO date YYYY-MM-DD),
 *       archived: boolean,
 *       reminder: {
 *         enabled: boolean,
 *         time: string (HH:MM),
 *         days: number[] (0=Sun…6=Sat)
 *       }
 *     }
 *   ],
 *   checkins: {
 *     [habitId]: string[]   // array of YYYY-MM-DD date strings
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
  selectedReminderDays: [0, 1, 2, 3, 4, 5, 6],
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
    // Merge safely — only adopt known top-level keys
    if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.habits)) state.habits = parsed.habits.map(migrateHabit);
      if (parsed.checkins && typeof parsed.checkins === 'object') state.checkins = parsed.checkins;
      if (parsed.theme === 'dark' || parsed.theme === 'light') state.theme = parsed.theme;
    }
  } catch (e) {
    console.warn('HabitFlow: Could not load saved data — starting fresh.', e);
  }
}

/** Ensure habit objects have all required fields (forward compat) */
function migrateHabit(h) {
  return {
    id: h.id || uid(),
    name: sanitize(h.name || 'Untitled'),
    description: sanitize(h.description || ''),
    category: CATEGORIES.includes(h.category) ? h.category : 'other',
    color: h.color || HABIT_COLORS[0],
    weeklyTarget: Number(h.weeklyTarget) || 7,
    createdAt: h.createdAt || todayStr(),
    archived: Boolean(h.archived),
    reminder: {
      enabled: h.reminder?.enabled ?? false,
      time: h.reminder?.time || '08:00',
      days: Array.isArray(h.reminder?.days) ? h.reminder.days : [0,1,2,3,4,5,6]
    }
  };
}

// ----------------------------------------------------------------
// UTILITY
// ----------------------------------------------------------------
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function sanitize(str) {
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

function unsanitize(str) {
  const div = document.createElement('div');
  div.innerHTML = str;
  return div.textContent;
}

/** Return today's date as YYYY-MM-DD (local time) */
function todayStr() {
  const d = new Date();
  return localDateStr(d);
}

/** Convert a Date object to YYYY-MM-DD (local time) */
function localDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse YYYY-MM-DD string into a local Date (midnight) */
function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Difference in calendar days between two YYYY-MM-DD strings */
function daysDiff(a, b) {
  return Math.round((parseDate(b) - parseDate(a)) / 86400000);
}

/** Format a YYYY-MM-DD string for display */
function formatDate(str) {
  const d = parseDate(str);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** Subtract N days from today, return YYYY-MM-DD */
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localDateStr(d);
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

// ----------------------------------------------------------------
// DATA OPERATIONS — Habits
// ----------------------------------------------------------------
function getActiveHabits() {
  return state.habits.filter(h => !h.archived);
}

function getArchivedHabits() {
  return state.habits.filter(h => h.archived);
}

function getHabitById(id) {
  return state.habits.find(h => h.id === id) || null;
}

function createHabit(data) {
  const habit = {
    id: uid(),
    name: sanitize(data.name.trim()),
    description: sanitize((data.description || '').trim()),
    category: data.category,
    color: data.color,
    weeklyTarget: Number(data.weeklyTarget),
    createdAt: todayStr(),
    archived: false,
    reminder: { enabled: false, time: '08:00', days: [0,1,2,3,4,5,6] }
  };
  state.habits.push(habit);
  state.checkins[habit.id] = [];
  save();
  return habit;
}

function updateHabit(id, data) {
  const habit = getHabitById(id);
  if (!habit) return;
  habit.name = sanitize(data.name.trim());
  habit.description = sanitize((data.description || '').trim());
  habit.category = data.category;
  habit.color = data.color;
  habit.weeklyTarget = Number(data.weeklyTarget);
  save();
}

function archiveHabit(id) {
  const habit = getHabitById(id);
  if (!habit) return;
  habit.archived = true;
  save();
}

function restoreHabit(id) {
  const habit = getHabitById(id);
  if (!habit) return;
  habit.archived = false;
  save();
}

function deleteHabitPermanently(id) {
  state.habits = state.habits.filter(h => h.id !== id);
  delete state.checkins[id];
  save();
}

// ----------------------------------------------------------------
// DATA OPERATIONS — Check-ins
// ----------------------------------------------------------------
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
// STREAK CALCULATION ENGINE
// ----------------------------------------------------------------
/**
 * Calculate current and longest streak for a habit.
 * A "day" counts as completed if the habit has a check-in on that date.
 * Streak = consecutive calendar days with check-ins up to today.
 * If today is not completed, the streak is the consecutive days
 * ending on yesterday (giving user the rest of today to complete it).
 */
function calcStreaks(habitId) {
  const checkins = getCheckins(habitId);
  if (checkins.length === 0) return { current: 0, longest: 0 };

  const dateSet = new Set(checkins);
  const today = todayStr();
  const todayDone = dateSet.has(today);

  // Build sorted unique date array
  const sorted = [...dateSet].sort();

  // Longest streak — iterate through sorted dates
  let longest = 0;
  let currentRun = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = daysDiff(sorted[i - 1], sorted[i]);
    if (diff === 1) {
      currentRun++;
      longest = Math.max(longest, currentRun);
    } else {
      currentRun = 1;
    }
  }
  if (sorted.length === 1) longest = 1;
  else longest = Math.max(longest, currentRun);

  // Current streak — walk backward from today (or yesterday if today not done)
  let cursor = todayDone ? today : daysAgo(1);
  let current = 0;

  // If cursor date has a check-in, count backward
  if (dateSet.has(cursor)) {
    current = 1;
    let prev = cursor;
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
/** Get completions for a habit in a given YYYY-MM week */
function getCheckinsByWeek(habitId, weekStart) {
  const checkins = getCheckins(habitId);
  return checkins.filter(d => {
    const diff = daysDiff(weekStart, d);
    return diff >= 0 && diff < 7;
  }).length;
}

/** Get start of week (Monday) for a date */
function weekStart(dateStr) {
  const d = parseDate(dateStr);
  const day = d.getDay(); // 0=Sun
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return localDateStr(monday);
}

/** Get ISO week number */
function isoWeek(dateStr) {
  const d = parseDate(dateStr);
  const tmp = new Date(d);
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const week1 = new Date(tmp.getFullYear(), 0, 4);
  return 1 + Math.round(((tmp - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

/** Weekly completion data for last N weeks */
function getWeeklyData(n = 8) {
  const result = [];
  const activeHabits = getActiveHabits();
  for (let w = n - 1; w >= 0; w--) {
    const d = new Date();
    d.setDate(d.getDate() - w * 7);
    const ws = weekStart(localDateStr(d));
    const label = `W${isoWeek(ws)}`;
    let total = 0;
    activeHabits.forEach(h => {
      total += getCheckinsByWeek(h.id, ws);
    });
    result.push({ label, total, weekStart: ws });
  }
  return result;
}

/** Monthly completion data for last N months */
function getMonthlyData(n = 6) {
  const result = [];
  const activeHabits = getActiveHabits();
  const now = new Date();
  for (let m = n - 1; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const y = d.getFullYear();
    const mo = d.getMonth();
    const label = MONTH_NAMES_SHORT[mo];
    let total = 0;
    activeHabits.forEach(h => {
      const cs = getCheckins(h.id);
      cs.forEach(dateStr => {
        const pd = parseDate(dateStr);
        if (pd.getFullYear() === y && pd.getMonth() === mo) total++;
      });
    });
    result.push({ label, total, year: y, month: mo });
  }
  return result;
}

/** Completion rate for a habit in the current week */
function weeklyCompletionRate(habitId) {
  const habit = getHabitById(habitId);
  if (!habit) return 0;
  const ws = weekStart(todayStr());
  const done = getCheckinsByWeek(habitId, ws);
  return Math.min(1, done / habit.weeklyTarget);
}

/** Overall weekly consistency score (0-100) */
function consistencyScore() {
  const active = getActiveHabits();
  if (active.length === 0) return 0;
  const rates = active.map(h => weeklyCompletionRate(h.id));
  const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
  return Math.round(avg * 100);
}

// ----------------------------------------------------------------
// HEATMAP DATA
// ----------------------------------------------------------------
/**
 * Build a 12-week heatmap grid (84 cells, Sun→Sat columns).
 * Returns array of {date, level, count} for each cell.
 */
function buildHeatmapData(habitId = null, weeks = 12) {
  const totalDays = weeks * 7;
  // Find the last Saturday (or today if today is Sat)
  const endDate = new Date();
  // align end to nearest Saturday
  const dayOfWeek = endDate.getDay(); // 0=Sun…6=Sat
  endDate.setDate(endDate.getDate() + (6 - dayOfWeek));

  const cells = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(endDate.getDate() - i);
    const dateStr = localDateStr(d);
    let count = 0;

    if (habitId) {
      count = isCheckedIn(habitId, dateStr) ? 1 : 0;
    } else {
      // Overall: count how many habits were completed that day
      const active = getActiveHabits();
      active.forEach(h => { if (isCheckedIn(h.id, dateStr)) count++; });
    }

    let level = 0;
    if (count > 0) {
      if (habitId) {
        level = 4; // binary for individual habit
      } else {
        const active = getActiveHabits();
        const total = active.length || 1;
        const ratio = count / total;
        if (ratio <= 0.25) level = 1;
        else if (ratio <= 0.5) level = 2;
        else if (ratio <= 0.75) level = 3;
        else level = 4;
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

  // cells is an array of 84 items, ordered oldest→newest, Sun-col first in each week
  // Group by column (each col = one week, 7 rows, Sun→Sat)
  const weeks = 12;
  const cols = [];
  for (let w = 0; w < weeks; w++) {
    cols.push(cells.slice(w * 7, w * 7 + 7));
  }

  // Month labels: figure out which col starts a new month
  const monthLabelRow = document.createElement('div');
  monthLabelRow.className = 'heatmap-month-labels';
  let lastMonth = -1;

  cols.forEach((col) => {
    const label = document.createElement('div');
    label.className = 'heatmap-month-label';
    const firstDay = parseDate(col[0].date);
    const mo = firstDay.getMonth();
    if (mo !== lastMonth) {
      label.textContent = MONTH_NAMES_SHORT[mo];
      lastMonth = mo;
    }
    // Each col is 14px wide (12px cell + 2px gap)
    label.style.width = '14px';
    monthLabelRow.appendChild(label);
  });

  // Container structure
  const wrap = document.createElement('div');
  wrap.className = 'heatmap-container';

  // Day labels (left)
  const dayLabels = document.createElement('div');
  dayLabels.className = 'heatmap-labels-left';
  const showDays = [0, 2, 4, 6]; // Sun, Tue, Thu, Sat
  for (let r = 0; r < 7; r++) {
    const lbl = document.createElement('div');
    lbl.className = 'heatmap-day-label';
    lbl.textContent = showDays.includes(r) ? DAY_NAMES_SHORT[r] : '';
    dayLabels.appendChild(lbl);
  }

  const gridArea = document.createElement('div');
  gridArea.className = 'heatmap-grid-area';
  gridArea.appendChild(monthLabelRow);

  const grid = document.createElement('div');
  grid.className = 'heatmap-grid';

  cols.forEach(col => {
    const colEl = document.createElement('div');
    colEl.className = 'heatmap-col';
    col.forEach(cell => {
      const el = document.createElement('div');
      el.className = 'heatmap-cell';
      el.setAttribute('data-level', cell.level);
      el.setAttribute('data-date', cell.date);
      el.setAttribute('data-count', cell.count);
      el.setAttribute('role', 'img');
      el.setAttribute('aria-label', buildCellAriaLabel(cell, habitId));
      el.addEventListener('mouseenter', handleCellHover);
      el.addEventListener('mouseleave', hideCellTooltip);
      el.addEventListener('focus', handleCellHover);
      el.setAttribute('tabindex', '0');
      colEl.appendChild(el);
    });
    grid.appendChild(colEl);
  });

  gridArea.appendChild(grid);
  wrap.appendChild(dayLabels);
  wrap.appendChild(gridArea);
  container.appendChild(wrap);

  // Legend
  const legend = document.createElement('div');
  legend.className = 'heatmap-legend';
  legend.innerHTML = `
    <span>Less</span>
    <div class="heatmap-legend-cell" style="background:var(--heat-0)"></div>
    <div class="heatmap-legend-cell" style="background:var(--heat-1)"></div>
    <div class="heatmap-legend-cell" style="background:var(--heat-2)"></div>
    <div class="heatmap-legend-cell" style="background:var(--heat-3)"></div>
    <div class="heatmap-legend-cell" style="background:var(--heat-4)"></div>
    <span>More</span>
  `;
  container.appendChild(legend);
}

function buildCellAriaLabel(cell, habitId) {
  const dateLabel = formatDate(cell.date);
  if (cell.count === 0) return `${dateLabel}: No activity`;
  if (habitId) return `${dateLabel}: Completed`;
  return `${dateLabel}: ${cell.count} habit${cell.count !== 1 ? 's' : ''} completed`;
}

function handleCellHover(e) {
  const el = e.currentTarget;
  const date = el.getAttribute('data-date');
  const count = parseInt(el.getAttribute('data-count'), 10);
  const habitId = el.closest('[data-heatmap-habit-id]')?.getAttribute('data-heatmap-habit-id') || null;

  let text;
  if (count === 0) {
    text = `${formatDate(date)} — No activity`;
  } else if (habitId) {
    text = `${formatDate(date)} — ✓ Completed`;
  } else {
    text = `${formatDate(date)} — ${count} habit${count !== 1 ? 's' : ''} done`;
  }

  const tooltip = $('#heatmap-tooltip');
  tooltip.textContent = text;
  tooltip.classList.add('visible');

  const rect = el.getBoundingClientRect();
  tooltip.style.left = `${rect.left + window.scrollX + rect.width / 2}px`;
  tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight - 8}px`;

  // Re-position after render if needed
  requestAnimationFrame(() => {
    const tr = tooltip.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - tr.width / 2;
    let top = rect.top - tr.height - 8;
    left = clamp(left, 8, window.innerWidth - tr.width - 8);
    if (top < 8) top = rect.bottom + 8;
    tooltip.style.left = `${left + window.scrollX}px`;
    tooltip.style.top = `${top + window.scrollY}px`;
  });
}

function hideCellTooltip() {
  $('#heatmap-tooltip').classList.remove('visible');
}

// ----------------------------------------------------------------
// RENDER HELPERS — Bar Chart
// ----------------------------------------------------------------
function renderBarChart(container, data, maxOverride = null) {
  if (!data.length) {
    container.innerHTML = renderEmptyState('No data yet', 'Complete some habits to see your chart.', '📊');
    return;
  }
  const max = maxOverride || Math.max(...data.map(d => d.total), 1);
  container.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'chart-bar-wrap';

  data.forEach(item => {
    const pct = max > 0 ? Math.round((item.total / max) * 100) : 0;
    const row = document.createElement('div');
    row.className = 'chart-bar-row';
    row.innerHTML = `
      <div class="chart-bar-label">${sanitize(item.label)}</div>
      <div class="chart-bar-track">
        <div class="chart-bar-fill" style="width:${pct}%" aria-valuenow="${item.total}" aria-valuemax="${max}" role="progressbar"></div>
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
      <div class="empty-state-icon" aria-hidden="true">${emoji}</div>
      <div class="empty-state-title">${sanitize(title)}</div>
      <p class="empty-state-desc">${sanitize(desc)}</p>
      ${btnLabel ? `<button class="btn btn-primary btn-sm" id="${btnId}">${sanitize(btnLabel)}</button>` : ''}
    </div>
  `;
}

// ----------------------------------------------------------------
// RENDER — Dashboard
// ----------------------------------------------------------------
function renderDashboard() {
  const today = todayStr();
  const activeHabits = getActiveHabits();

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const greetEl = $('#greeting-text');
  if (greetEl) greetEl.textContent = `${greeting}! 👋`;
  const dateEl = $('#today-date-text');
  if (dateEl) dateEl.textContent = dayName;

  // Motivation banner
  const motivDiv = $('#dash-motivation');
  if (motivDiv) {
    const msgs = getMotivationMessage(activeHabits);
    motivDiv.innerHTML = msgs ? `
      <div class="motivation-banner">
        <div class="motivation-banner-emoji">${msgs.emoji}</div>
        <div class="motivation-banner-text">
          <strong>${sanitize(msgs.title)}</strong>
          ${sanitize(msgs.body)}
        </div>
      </div>` : '';
  }

  // Stat cards
  const completedToday = activeHabits.filter(h => isCheckedIn(h.id, today)).length;
  const totalActive = activeHabits.length;

  // Best streak across all habits
  let bestStreak = 0;
  let curStreak = 0;
  activeHabits.forEach(h => {
    const s = calcStreaks(h.id);
    bestStreak = Math.max(bestStreak, s.longest);
    curStreak = Math.max(curStreak, s.current);
  });

  // Weekly target completion this week
  const ws = weekStart(today);
  let weekTotal = 0;
  let weekTarget = 0;
  activeHabits.forEach(h => {
    weekTotal += getCheckinsByWeek(h.id, ws);
    weekTarget += h.weeklyTarget;
  });
  const weekPct = weekTarget > 0 ? Math.round((weekTotal / weekTarget) * 100) : 0;

  const statGrid = $('#dash-stat-grid');
  if (statGrid) {
    statGrid.innerHTML = `
      ${statCard('Active Habits', totalActive, 'habits tracked', '#3b82f6', svgIcon('layers'))}
      ${statCard('Completed Today', `${completedToday}/${totalActive}`, 'check-ins today', '#22c55e', svgIcon('check-circle'))}
      ${statCard('Current Streak', curStreak, `day${curStreak !== 1 ? 's' : ''} in a row`, '#f59e0b', svgIcon('zap'))}
      ${statCard('Best Streak', bestStreak, `day${bestStreak !== 1 ? 's' : ''} record`, '#8b5cf6', svgIcon('trophy'))}
    `;
  }

  // Progress ring
  const pct = totalActive > 0 ? Math.round((completedToday / totalActive) * 100) : 0;
  const circumference = 2 * Math.PI * 40; // r=40
  const offset = circumference - (pct / 100) * circumference;
  const ringFill = $('#ring-fill');
  if (ringFill) {
    ringFill.style.strokeDasharray = circumference;
    ringFill.style.strokeDashoffset = offset;
    // Color based on progress
    const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#3b82f6';
    ringFill.style.stroke = color;
  }
  const ringPct = $('#ring-pct');
  if (ringPct) ringPct.textContent = `${pct}%`;
  const ringLabel = $('#ring-label');
  if (ringLabel) ringLabel.textContent = `${completedToday} of ${totalActive} done`;
  const checklistSub = $('#today-checklist-sub');
  if (checklistSub) checklistSub.textContent = weekPct >= 100
    ? '🎉 Weekly target hit!' : `${weekPct}% of weekly target done`;

  // Today's checklist
  renderTodayChecklist();

  // Overall heatmap
  const heatmapCont = $('#overall-heatmap-container');
  if (heatmapCont) {
    if (activeHabits.length === 0) {
      heatmapCont.innerHTML = renderEmptyState('No habits yet', 'Add your first habit to start tracking.', '🌱', 'Add Habit', 'dash-empty-add-btn');
      setTimeout(() => {
        const btn = $('#dash-empty-add-btn');
        if (btn) btn.addEventListener('click', openAddHabitModal);
      }, 0);
    } else {
      const cells = buildHeatmapData(null, 12);
      renderHeatmap(cells, heatmapCont);
    }
  }
}

function statCard(label, value, sub, color, icon) {
  return `
    <div class="stat-card">
      <div class="stat-icon" style="background:${color}18">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          ${icon}
        </svg>
      </div>
      <div class="stat-value">${sanitize(String(value))}</div>
      <div class="stat-label">${sanitize(label)}</div>
      <div class="stat-sub">${sanitize(sub)}</div>
    </div>
  `;
}

function svgIcon(name) {
  const icons = {
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    archive: '<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>',
  };
  return icons[name] || '';
}

function getMotivationMessage(habits) {
  const today = todayStr();
  const done = habits.filter(h => isCheckedIn(h.id, today)).length;
  const total = habits.length;
  if (total === 0) return { emoji: '🚀', title: 'Ready to build great habits?', body: 'Add your first habit to start your journey.' };
  if (done === total && total > 0) return { emoji: '🔥', title: "You've crushed it today!", body: 'All habits completed. Keep the streak alive!' };
  if (done === 0) return { emoji: '💪', title: "Let's get started!", body: `You have ${total} habit${total !== 1 ? 's' : ''} to complete today.` };
  const pct = Math.round((done / total) * 100);
  if (pct >= 50) return { emoji: '⚡', title: "You're halfway there!", body: `${total - done} more to go — keep it up!` };
  return { emoji: '🌱', title: 'Build momentum!', body: `${done} of ${total} done — every check-in counts.` };
}

// ----------------------------------------------------------------
// RENDER — Today's Checklist
// ----------------------------------------------------------------
function renderTodayChecklist() {
  const container = $('#today-checklist');
  if (!container) return;
  const today = todayStr();
  const active = getActiveHabits();

  if (active.length === 0) {
    container.innerHTML = renderEmptyState('No habits yet', 'Create your first habit to start tracking.', '🌱', 'Add Habit', 'checklist-add-btn');
    setTimeout(() => {
      const btn = $('#checklist-add-btn');
      if (btn) btn.addEventListener('click', openAddHabitModal);
    }, 0);
    return;
  }

  container.innerHTML = '';
  active.forEach(habit => {
    const checked = isCheckedIn(habit.id, today);
    const streaks = calcStreaks(habit.id);
    const item = document.createElement('div');
    item.className = `checklist-item${checked ? ' completed' : ''}`;
    item.dataset.habitId = habit.id;
    item.innerHTML = `
      <button class="check-btn${checked ? ' checked' : ''}"
        aria-label="${checked ? 'Undo' : 'Complete'} ${unsanitize(habit.name)}"
        data-habit-id="${habit.id}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </button>
      <div class="checklist-info">
        <div class="checklist-name">${habit.name}</div>
        <div class="checklist-meta">
          <div class="habit-color-dot" style="background:${habit.color}"></div>
          <span>${CATEGORY_EMOJI[habit.category] || ''} ${habit.category}</span>
          ${streaks.current > 0 ? `<span class="streak-badge">🔥 ${streaks.current}</span>` : ''}
        </div>
      </div>
    `;

    item.querySelector('.check-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const hid = e.currentTarget.dataset.habitId;
      const result = toggleCheckin(hid, today);
      showToast(result === 'added' ? `✓ ${unsanitize(habit.name)} done!` : `Undone: ${unsanitize(habit.name)}`,
        result === 'added' ? 'success' : 'info');
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
  let habits = getActiveHabits();
  if (filter !== 'all') habits = habits.filter(h => h.category === filter);

  // Update filter tab badges
  $$('[data-filter]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
    btn.setAttribute('aria-selected', btn.dataset.filter === filter);
  });

  if (habits.length === 0) {
    const msg = filter === 'all'
      ? 'Add your first habit to start building consistency.'
      : `No habits in the "${filter}" category.`;
    grid.innerHTML = renderEmptyState('No habits found', msg, '🌱',
      filter === 'all' ? 'Add Habit' : '', filter === 'all' ? 'habits-empty-add-btn' : '');
    if (filter === 'all') {
      setTimeout(() => {
        const btn = $('#habits-empty-add-btn');
        if (btn) btn.addEventListener('click', openAddHabitModal);
      }, 0);
    }
    return;
  }

  grid.innerHTML = '';
  habits.forEach(habit => {
    const today = todayStr();
    const checked = isCheckedIn(habit.id, today);
    const streaks = calcStreaks(habit.id);
    const wr = weeklyCompletionRate(habit.id);
    const wrPct = Math.round(wr * 100);

    // Mini heatmap (4 weeks)
    const miniCells = buildHeatmapData(habit.id, 4);

    const card = document.createElement('div');
    card.className = 'habit-card';
    card.dataset.habitId = habit.id;
    card.innerHTML = `
      <div class="habit-card-accent" style="background:${habit.color}"></div>
      <div class="habit-card-body">
        <div class="habit-card-header">
          <div>
            <div class="habit-card-name">${habit.name}</div>
            <div style="display:flex;gap:0.375rem;margin-top:0.25rem;flex-wrap:wrap">
              <span class="habit-tag">${CATEGORY_EMOJI[habit.category] || ''} ${habit.category}</span>
              <span class="habit-tag">🎯 ${habit.weeklyTarget}×/week</span>
            </div>
          </div>
          <div style="display:flex;gap:0.25rem">
            <button class="btn btn-ghost btn-icon-sm" data-action="edit" data-habit-id="${habit.id}" aria-label="Edit ${unsanitize(habit.name)}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svgIcon('edit')}</svg>
            </button>
            <button class="btn btn-ghost btn-icon-sm" data-action="reminder" data-habit-id="${habit.id}" aria-label="Reminder for ${unsanitize(habit.name)}">
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
            <span class="habit-card-stat-value">${getCheckins(habit.id).length}</span>
            <span class="habit-card-stat-label">✓ Total</span>
          </div>
        </div>
        <div class="habit-mini-heatmap" data-heatmap-habit-id="${habit.id}" id="mini-heatmap-${habit.id}"></div>
        <div class="habit-card-actions">
          <button class="btn ${checked ? 'btn-secondary' : 'btn-primary'} btn-sm" data-action="checkin" data-habit-id="${habit.id}">
            ${checked
              ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> Done Today`
              : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Check In`}
          </button>
          <button class="btn btn-ghost btn-sm" data-action="archive" data-habit-id="${habit.id}" style="margin-left:auto">
            Archive
          </button>
        </div>
      </div>
    `;

    // Attach event listeners
    card.querySelector('[data-action="edit"]').addEventListener('click', () => openEditHabitModal(habit.id));
    card.querySelector('[data-action="reminder"]').addEventListener('click', () => openReminderModal(habit.id));
    card.querySelector('[data-action="checkin"]').addEventListener('click', () => {
      const today2 = todayStr();
      const result = toggleCheckin(habit.id, today2);
      showToast(result === 'added' ? `✓ ${unsanitize(habit.name)} done!` : `Undone: ${unsanitize(habit.name)}`,
        result === 'added' ? 'success' : 'info');
      render();
    });
    card.querySelector('[data-action="archive"]').addEventListener('click', () => {
      if (confirm(`Archive "${unsanitize(habit.name)}"? Your history will be preserved.`)) {
        archiveHabit(habit.id);
        showToast(`"${unsanitize(habit.name)}" archived.`, 'info');
        render();
      }
    });

    grid.appendChild(card);

    // Render mini heatmap
    const miniContainer = card.querySelector(`#mini-heatmap-${habit.id}`);
    if (miniContainer) {
      miniContainer.setAttribute('data-heatmap-habit-id', habit.id);
      renderMiniHeatmap(miniCells, miniContainer, habit.id);
    }
  });
}

function renderMiniHeatmap(cells, container, habitId) {
  // 4 weeks × 7 days = 28 cells, render as compact row
  container.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:2px;flex-wrap:nowrap;overflow:hidden';

  // Group by week
  const weeks = 4;
  for (let w = 0; w < weeks; w++) {
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;gap:2px';
    const weekCells = cells.slice(w * 7, w * 7 + 7);
    weekCells.forEach(cell => {
      const el = document.createElement('div');
      el.className = 'heatmap-cell';
      el.setAttribute('data-level', cell.level);
      el.setAttribute('data-date', cell.date);
      el.setAttribute('data-count', cell.count);
      el.setAttribute('data-heatmap-habit-id', habitId);
      el.setAttribute('role', 'img');
      el.setAttribute('aria-label', buildCellAriaLabel(cell, habitId));
      el.addEventListener('mouseenter', handleCellHover);
      el.addEventListener('mouseleave', hideCellTooltip);
      col.appendChild(el);
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
  if (active.length === 0) {
    container.innerHTML = renderEmptyState('No habits yet', 'Add habits to see their heatmaps.', '🗓️');
    return;
  }

  // Overall first
  const overallCard = document.createElement('div');
  overallCard.className = 'card mb-4';
  overallCard.innerHTML = `
    <div class="card-header">
      <div>
        <div class="card-title">Overall Activity</div>
        <div class="card-subtitle">All habits combined — 12 weeks</div>
      </div>
    </div>
    <div class="card-body">
      <div id="heatmap-overall-page"></div>
    </div>
  `;
  container.appendChild(overallCard);
  const overallCells = buildHeatmapData(null, 12);
  renderHeatmap(overallCells, overallCard.querySelector('#heatmap-overall-page'));

  // Individual habits
  active.forEach(habit => {
    const streaks = calcStreaks(habit.id);
    const totalDone = getCheckins(habit.id).length;

    const card = document.createElement('div');
    card.className = 'card mb-4';
    card.innerHTML = `
      <div class="card-header">
        <div style="display:flex;align-items:center;gap:0.625rem">
          <div style="width:12px;height:12px;border-radius:50%;background:${habit.color};flex-shrink:0"></div>
          <div>
            <div class="card-title">${habit.name}</div>
            <div class="card-subtitle">${CATEGORY_EMOJI[habit.category] || ''} ${habit.category} · 🔥 ${streaks.current} streak · 🏆 ${streaks.longest} best · ✓ ${totalDone} total</div>
          </div>
        </div>
      </div>
      <div class="card-body">
        <div data-heatmap-habit-id="${habit.id}" id="heatmap-${habit.id}"></div>
      </div>
    `;
    container.appendChild(card);

    const cells = buildHeatmapData(habit.id, 12);
    const heatContainer = card.querySelector(`#heatmap-${habit.id}`);
    heatContainer.setAttribute('data-heatmap-habit-id', habit.id);
    renderHeatmap(cells, heatContainer, habit.id);
  });
}

// ----------------------------------------------------------------
// RENDER — Statistics
// ----------------------------------------------------------------
function renderStatsPage() {
  const activeHabits = getActiveHabits();
  const today = todayStr();

  // Summary cards
  const summaryGrid = $('#stats-summary-grid');
  if (summaryGrid) {
    const totalCheckins = activeHabits.reduce((sum, h) => sum + getCheckins(h.id).length, 0);
    const completedToday = activeHabits.filter(h => isCheckedIn(h.id, today)).length;
    const ws = weekStart(today);
    let weekDone = 0, weekTarget = 0;
    activeHabits.forEach(h => {
      weekDone += getCheckinsByWeek(h.id, ws);
      weekTarget += h.weeklyTarget;
    });
    const weekRate = weekTarget > 0 ? Math.round((weekDone / weekTarget) * 100) : 0;
    const score = consistencyScore();

    summaryGrid.innerHTML = `
      ${statCard('Total Check-ins', totalCheckins, 'all time', '#3b82f6', svgIcon('check-circle'))}
      ${statCard('Today', `${completedToday}/${activeHabits.length}`, 'completed', '#22c55e', svgIcon('zap'))}
      ${statCard('This Week', `${weekDone}/${weekTarget}`, `${weekRate}% of targets`, '#f59e0b', svgIcon('layers'))}
      ${statCard('Consistency', `${score}%`, 'weekly score', '#8b5cf6', svgIcon('trophy'))}
    `;
  }

  // Weekly chart
  const weeklyContainer = $('#weekly-chart');
  if (weeklyContainer) {
    const weeklyData = getWeeklyData(8);
    renderBarChart(weeklyContainer, weeklyData);
  }

  // Monthly chart
  const monthlyContainer = $('#monthly-chart');
  if (monthlyContainer) {
    const monthlyData = getMonthlyData(6);
    renderBarChart(monthlyContainer, monthlyData);
  }

  // Habit progress
  const progressList = $('#habit-progress-list');
  if (progressList) {
    if (activeHabits.length === 0) {
      progressList.innerHTML = renderEmptyState('No habits yet', 'Add habits to see progress.', '📊');
    } else {
      progressList.innerHTML = '';
      activeHabits.forEach(habit => {
        const rate = weeklyCompletionRate(habit.id);
        const pct = Math.round(rate * 100);
        const ws2 = weekStart(today);
        const done = getCheckinsByWeek(habit.id, ws2);
        const row = document.createElement('div');
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
            <div class="habit-progress-fill" style="width:${pct}%;background:${habit.color}" role="progressbar" aria-valuenow="${pct}" aria-valuemax="100"></div>
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
    const msg = score >= 80 ? 'Excellent consistency!' : score >= 50 ? 'Good progress this week' : score >= 20 ? 'Building momentum' : 'Let\'s get started!';
    consistencyDiv.innerHTML = `
      <div class="consistency-score" aria-label="Consistency score: ${score}%">${emoji} ${score}%</div>
      <div class="consistency-label">${sanitize(msg)}</div>
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
    if ('Notification' in window && Notification.permission === 'default') {
      bannerWrap.innerHTML = `
        <div class="notif-banner" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>Enable browser notifications to receive habit reminders.</span>
          <button class="btn btn-sm btn-secondary" style="margin-left:auto;flex-shrink:0" id="request-notif-btn">Enable</button>
        </div>
      `;
      setTimeout(() => {
        const btn = $('#request-notif-btn');
        if (btn) btn.addEventListener('click', requestNotificationPermission);
      }, 0);
    } else if ('Notification' in window && Notification.permission === 'denied') {
      bannerWrap.innerHTML = `
        <div class="notif-banner" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0">
            <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
          <span>Notifications are blocked. Enable them in your browser settings to use reminders.</span>
        </div>
      `;
    } else {
      bannerWrap.innerHTML = '';
    }
  }

  const active = getActiveHabits();
  if (active.length === 0) {
    container.innerHTML = renderEmptyState('No active habits', 'Add habits first to set reminders.', '🔔');
    return;
  }

  container.innerHTML = '';
  active.forEach(habit => {
    const r = habit.reminder;
    const item = document.createElement('div');
    item.className = 'reminder-item';
    const dayTags = r.days.length === 7
      ? '<span class="reminder-day-tag">Every day</span>'
      : r.days.map(d => `<span class="reminder-day-tag">${DAY_NAMES_FULL[d]}</span>`).join('');
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
      <button class="btn btn-secondary btn-sm" data-action="edit-reminder" data-habit-id="${habit.id}">
        Edit
      </button>
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
  if (archived.length === 0) {
    grid.innerHTML = renderEmptyState('No archived habits', 'Archived habits will appear here. Their history is always preserved.', '📦');
    return;
  }

  grid.innerHTML = '';
  archived.forEach(habit => {
    const totalDone = getCheckins(habit.id).length;
    const streaks = calcStreaks(habit.id);

    const card = document.createElement('div');
    card.className = 'habit-card archived';
    card.innerHTML = `
      <div class="habit-card-accent" style="background:${habit.color};opacity:0.5"></div>
      <div class="habit-card-body">
        <div class="habit-card-header">
          <div>
            <div class="habit-card-name" style="color:var(--text-secondary)">${habit.name}</div>
            <div style="display:flex;gap:0.375rem;margin-top:0.25rem">
              <span class="habit-tag">${CATEGORY_EMOJI[habit.category] || ''} ${habit.category}</span>
              <span class="habit-tag">Archived</span>
            </div>
          </div>
        </div>
        ${habit.description ? `<div class="habit-card-desc">${habit.description}</div>` : ''}
        <div class="habit-card-stats">
          <div class="habit-card-stat">
            <span class="habit-card-stat-value">${streaks.longest}</span>
            <span class="habit-card-stat-label">🏆 Best streak</span>
          </div>
          <div class="habit-card-stat">
            <span class="habit-card-stat-value">${totalDone}</span>
            <span class="habit-card-stat-label">✓ Total done</span>
          </div>
        </div>
        <div class="habit-card-actions">
          <button class="btn btn-secondary btn-sm" data-action="restore" data-habit-id="${habit.id}">
            Restore
          </button>
          <button class="btn btn-danger btn-sm" data-action="delete" data-habit-id="${habit.id}" style="margin-left:auto">
            Delete Permanently
          </button>
        </div>
      </div>
    `;

    card.querySelector('[data-action="restore"]').addEventListener('click', () => {
      restoreHabit(habit.id);
      showToast(`"${unsanitize(habit.name)}" restored.`, 'success');
      render();
    });

    card.querySelector('[data-action="delete"]').addEventListener('click', () => {
      if (confirm(`Permanently delete "${unsanitize(habit.name)}"? This cannot be undone.`)) {
        deleteHabitPermanently(habit.id);
        showToast(`"${unsanitize(habit.name)}" deleted permanently.`, 'error');
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
  const activeCount = getActiveHabits().length;
  const archiveCount = getArchivedHabits().length;
  const navActiveBadge = $('#nav-active-count');
  if (navActiveBadge) navActiveBadge.textContent = activeCount;
  const navArchiveBadge = $('#nav-archive-count');
  if (navArchiveBadge) {
    navArchiveBadge.textContent = archiveCount;
    navArchiveBadge.style.display = archiveCount > 0 ? '' : 'none';
  }

  // Render current page
  switch (ui.currentPage) {
    case 'dashboard': renderDashboard(); break;
    case 'habits':    renderHabitsPage(); break;
    case 'heatmap':   renderHeatmapPage(); break;
    case 'stats':     renderStatsPage(); break;
    case 'reminders': renderRemindersPage(); break;
    case 'archive':   renderArchivePage(); break;
  }
}

// ----------------------------------------------------------------
// NAVIGATION
// ----------------------------------------------------------------
const PAGE_TITLES = {
  dashboard: 'Dashboard',
  habits: 'My Habits',
  heatmap: 'Heatmap',
  stats: 'Statistics',
  reminders: 'Reminders',
  archive: 'Archive'
};

function navigateTo(page) {
  ui.currentPage = page;

  // Update active nav item
  $$('.nav-item[data-page]').forEach(el => {
    const isActive = el.dataset.page === page;
    el.classList.toggle('active', isActive);
    el.setAttribute('aria-current', isActive ? 'page' : 'false');
  });

  // Show/hide pages
  $$('.page').forEach(el => el.classList.remove('active'));
  const pageEl = $(`#page-${page}`);
  if (pageEl) pageEl.classList.add('active');

  // Topbar title
  const title = $('#topbar-title');
  if (title) title.textContent = PAGE_TITLES[page] || page;

  // Close mobile sidebar
  closeMobileSidebar();

  render();
}

// ----------------------------------------------------------------
// MODAL — Habit Form
// ----------------------------------------------------------------
function openAddHabitModal() {
  const modal = $('#habit-modal');
  const form = $('#habit-form');
  form.reset();
  $('#habit-id-input').value = '';
  $('#habit-modal-title').textContent = 'New Habit';
  $('#habit-archive-btn').style.display = 'none';
  ui.selectedColor = HABIT_COLORS[0];
  renderColorPicker(HABIT_COLORS[0]);
  clearFormErrors();
  openModal(modal);
  setTimeout(() => $('#habit-name-input').focus(), 100);
}

function openEditHabitModal(habitId) {
  const habit = getHabitById(habitId);
  if (!habit) return;

  const modal = $('#habit-modal');
  $('#habit-id-input').value = habitId;
  $('#habit-modal-title').textContent = 'Edit Habit';
  $('#habit-name-input').value = unsanitize(habit.name);
  $('#habit-desc-input').value = unsanitize(habit.description);
  $('#habit-category-input').value = habit.category;
  $('#habit-target-input').value = String(habit.weeklyTarget);
  ui.selectedColor = habit.color;
  renderColorPicker(habit.color);
  $('#habit-archive-btn').style.display = '';
  clearFormErrors();
  openModal(modal);
  setTimeout(() => $('#habit-name-input').focus(), 100);
}

function closeHabitModal() {
  closeModal($('#habit-modal'));
}

function saveHabitForm() {
  const name = $('#habit-name-input').value.trim();
  const category = $('#habit-category-input').value;

  // Validation
  let valid = true;
  clearFormErrors();

  if (!name) {
    showFieldError('err-name', 'habit-name-input');
    valid = false;
  }
  if (!category) {
    showFieldError('err-category', 'habit-category-input');
    valid = false;
  }

  if (!valid) return;

  const data = {
    name,
    description: $('#habit-desc-input').value,
    category,
    weeklyTarget: $('#habit-target-input').value,
    color: ui.selectedColor
  };

  const habitId = $('#habit-id-input').value;
  if (habitId) {
    updateHabit(habitId, data);
    showToast('Habit updated!', 'success');
  } else {
    createHabit(data);
    showToast('Habit created! 🎉', 'success');
  }

  closeHabitModal();
  render();
}

function renderColorPicker(selected) {
  const picker = $('#color-picker');
  if (!picker) return;
  picker.innerHTML = '';
  HABIT_COLORS.forEach(color => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `color-swatch${color === selected ? ' selected' : ''}`;
    btn.style.background = color;
    btn.setAttribute('aria-label', `Select colour ${color}`);
    btn.setAttribute('aria-pressed', color === selected);
    btn.setAttribute('role', 'radio');
    btn.addEventListener('click', () => {
      ui.selectedColor = color;
      $$('.color-swatch').forEach(s => { s.classList.remove('selected'); s.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('selected');
      btn.setAttribute('aria-pressed', 'true');
    });
    picker.appendChild(btn);
  });
}

// ----------------------------------------------------------------
// MODAL — Backdate
// ----------------------------------------------------------------
function openBackdateModal() {
  const modal = $('#backdate-modal');
  // Populate habit select
  const sel = $('#backdate-habit-select');
  sel.innerHTML = '<option value="">Choose a habit…</option>';
  getActiveHabits().forEach(h => {
    const opt = document.createElement('option');
    opt.value = h.id;
    opt.textContent = unsanitize(h.name);
    sel.appendChild(opt);
  });

  if (getActiveHabits().length === 0) {
    showToast('Add a habit first.', 'warning');
    return;
  }

  ui.backdateSelectedHabitId = getActiveHabits()[0]?.id || null;
  sel.value = ui.backdateSelectedHabitId || '';
  renderBackdateCalendar(ui.backdateSelectedHabitId);
  openModal(modal);
}

function renderBackdateCalendar(habitId) {
  const calGrid = $('#backdate-calendar');
  if (!calGrid) return;

  // Remove all existing day cells (keep the 7 day header cells)
  const headerCells = $$('.date-cell', calGrid).slice(0, 7);

  // Rebuild grid
  calGrid.innerHTML = '';
  // Headers
  ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach(d => {
    const el = document.createElement('div');
    el.className = 'date-cell';
    el.style.cssText = 'font-weight:700;background:transparent;border:none;color:var(--text-muted);font-size:0.625rem';
    el.textContent = d;
    calGrid.appendChild(el);
  });

  const today = todayStr();
  const todayDate = parseDate(today);

  // Show last 30 days calendar for the month containing those days
  // Find the first day (30 days ago) and today, build a proper monthly calendar
  const startDate = new Date(todayDate);
  startDate.setDate(startDate.getDate() - 29);

  // Start from the Sunday of the first week
  const firstSunday = new Date(startDate);
  firstSunday.setDate(startDate.getDate() - startDate.getDay());

  // Fill calendar until today's Saturday
  const lastSaturday = new Date(todayDate);
  lastSaturday.setDate(todayDate.getDate() + (6 - todayDate.getDay()));

  let cursor = new Date(firstSunday);
  while (cursor <= lastSaturday) {
    const dateStr = localDateStr(cursor);
    const isBefore30 = cursor < startDate;
    const isFuture = cursor > todayDate;
    const isToday = dateStr === today;
    const isComplete = habitId ? isCheckedIn(habitId, dateStr) : false;

    const el = document.createElement('div');
    el.className = 'date-cell';

    if (isBefore30 || isFuture) {
      el.classList.add(isFuture ? 'future' : 'empty');
      el.textContent = isFuture ? cursor.getDate() : '';
    } else {
      if (isToday) el.classList.add('today');
      if (isComplete) el.classList.add('completed');
      el.textContent = cursor.getDate();
      el.title = `${formatDate(dateStr)}${isComplete ? ' — ✓ Done' : ''}`;
      el.addEventListener('click', () => handleBackdateClick(dateStr, habitId));
    }

    calGrid.appendChild(el);
    cursor.setDate(cursor.getDate() + 1);
  }
}

function handleBackdateClick(dateStr, habitId) {
  if (!habitId) { showToast('Please select a habit.', 'warning'); return; }
  const result = toggleCheckin(habitId, dateStr);
  const info = $('#backdate-selected-info');
  if (info) {
    info.textContent = result === 'added'
      ? `✓ Marked complete: ${formatDate(dateStr)}`
      : `Unmarked: ${formatDate(dateStr)}`;
  }
  renderBackdateCalendar(habitId);
  render();
}

// ----------------------------------------------------------------
// MODAL — Reminder
// ----------------------------------------------------------------
function openReminderModal(habitId) {
  const habit = getHabitById(habitId);
  if (!habit) return;

  $('#reminder-habit-id').value = habitId;
  $('#reminder-habit-name-label').textContent = `Setting reminder for: ${unsanitize(habit.name)}`;
  $('#reminder-time-input').value = habit.reminder.time || '08:00';
  $('#reminder-enabled-chk').checked = habit.reminder.enabled;

  ui.selectedReminderDays = [...(habit.reminder.days || [0,1,2,3,4,5,6])];
  updateDayBtns();
  openModal($('#reminder-modal'));
}

function saveReminderForm() {
  const habitId = $('#reminder-habit-id').value;
  const habit = getHabitById(habitId);
  if (!habit) return;

  habit.reminder = {
    enabled: $('#reminder-enabled-chk').checked,
    time: $('#reminder-time-input').value || '08:00',
    days: [...ui.selectedReminderDays]
  };
  save();

  if (habit.reminder.enabled) {
    scheduleNotification(habit);
  }

  showToast('Reminder saved!', 'success');
  closeModal($('#reminder-modal'));
  render();
}

function updateDayBtns() {
  $$('.day-btn', $('#reminder-days-group')).forEach(btn => {
    const day = Number(btn.dataset.day);
    const sel = ui.selectedReminderDays.includes(day);
    btn.classList.toggle('selected', sel);
    btn.setAttribute('aria-pressed', sel);
  });
}

// ----------------------------------------------------------------
// BROWSER NOTIFICATIONS
// ----------------------------------------------------------------
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    showToast('Notifications not supported in this browser.', 'warning');
    return;
  }
  const result = await Notification.requestPermission();
  if (result === 'granted') {
    showToast('Notifications enabled! ✓', 'success');
    new Notification('HabitFlow', {
      body: "You'll now receive habit reminders.",
      icon: 'icon-192.png'
    });
  } else {
    showToast('Notifications permission denied.', 'warning');
  }
  renderRemindersPage();
}

function scheduleNotification(habit) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (!habit.reminder.enabled) return;

  const today = new Date();
  const dayOfWeek = today.getDay();
  if (!habit.reminder.days.includes(dayOfWeek)) return;

  const [h, m] = habit.reminder.time.split(':').map(Number);
  const reminderTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m, 0);
  const msUntil = reminderTime - Date.now();

  if (msUntil > 0) {
    setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification(`Time for: ${unsanitize(habit.name)}`, {
          body: `Keep your streak going! Check in now.`,
          icon: 'icon-192.png',
          tag: `habit-${habit.id}`
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
// MODAL UTILITIES
// ----------------------------------------------------------------
function openModal(modal) {
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  // Trap focus
  setTimeout(() => {
    const focusable = modal.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length) focusable[0].focus();
  }, 50);
}

function closeModal(modal) {
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

function closeAllModals() {
  $$('.modal-backdrop').forEach(m => closeModal(m));
}

// Close on backdrop click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-backdrop')) closeAllModals();
});

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeAllModals();
});

// ----------------------------------------------------------------
// FORM VALIDATION HELPERS
// ----------------------------------------------------------------
function showFieldError(errId, inputId) {
  const err = $(`#${errId}`);
  const input = $(`#${inputId}`);
  if (err) err.classList.add('visible');
  if (input) {
    input.classList.add('error');
    input.focus();
  }
}

function clearFormErrors() {
  $$('.form-error').forEach(el => el.classList.remove('visible'));
  $$('.form-control.error').forEach(el => el.classList.remove('error'));
}

// ----------------------------------------------------------------
// TOAST NOTIFICATIONS
// ----------------------------------------------------------------
function showToast(message, type = 'info') {
  const container = $('#toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = {
    success: '<polyline points="20 6 9 17 4 12"/>',
    error: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    warning: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
  };
  toast.innerHTML = `
    <svg class="toast-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      ${icons[type] || icons.info}
    </svg>
    ${sanitize(message)}
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ----------------------------------------------------------------
// THEME
// ----------------------------------------------------------------
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const moonIcon = $('#theme-icon-moon');
  const sunIcon = $('#theme-icon-sun');
  const label = $('#theme-label');
  if (moonIcon) moonIcon.style.display = theme === 'dark' ? 'none' : '';
  if (sunIcon) sunIcon.style.display = theme === 'dark' ? '' : 'none';
  if (label) label.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
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
  const menuBtn = $('#mobile-menu-btn');
  if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
}

function closeMobileSidebar() {
  $('#sidebar').classList.remove('mobile-open');
  $('#sidebar-overlay').classList.remove('visible');
  const menuBtn = $('#mobile-menu-btn');
  if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
}

// ----------------------------------------------------------------
// EXPORT / IMPORT
// ----------------------------------------------------------------
function exportData() {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `habitflow-backup-${todayStr()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Data exported successfully!', 'success');
}

function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!imported || !Array.isArray(imported.habits)) {
        showToast('Invalid file format. Please use a HabitFlow export.', 'error');
        return;
      }
      if (!confirm(`This will replace all current data with ${imported.habits.length} habits from the backup. Continue?`)) return;
      state.habits = imported.habits.map(migrateHabit);
      state.checkins = imported.checkins || {};
      if (imported.theme) state.theme = imported.theme;
      save();
      applyTheme(state.theme);
      showToast(`Imported ${state.habits.length} habits successfully!`, 'success');
      render();
    } catch {
      showToast('Could not parse the file. Make sure it is a valid JSON export.', 'error');
    }
  };
  reader.readAsText(file);
}

// ----------------------------------------------------------------
// PWA / SERVICE WORKER
// ----------------------------------------------------------------
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {
      // SW not critical — continue without it
    });
  }
}

// ----------------------------------------------------------------
// EVENT BINDING
// ----------------------------------------------------------------
function bindEvents() {
  // Navigation
  $$('.nav-item[data-page]').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });

  // Theme toggle
  const themeBtn = $('#theme-toggle-btn');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // Mobile sidebar
  const menuBtn = $('#mobile-menu-btn');
  if (menuBtn) menuBtn.addEventListener('click', openMobileSidebar);
  const overlay = $('#sidebar-overlay');
  if (overlay) overlay.addEventListener('click', closeMobileSidebar);

  // Add habit buttons
  const topbarAddBtn = $('#topbar-add-habit-btn');
  if (topbarAddBtn) topbarAddBtn.addEventListener('click', openAddHabitModal);
  const habitsAddBtn = $('#habits-add-btn');
  if (habitsAddBtn) habitsAddBtn.addEventListener('click', openAddHabitModal);

  // Backdate modal
  const backdateBtn = $('#backdate-btn');
  if (backdateBtn) backdateBtn.addEventListener('click', openBackdateModal);
  const backdateClose = $('#backdate-modal-close');
  if (backdateClose) backdateClose.addEventListener('click', () => closeModal($('#backdate-modal')));
  const backdateClose2 = $('#backdate-modal-close2');
  if (backdateClose2) backdateClose2.addEventListener('click', () => closeModal($('#backdate-modal')));

  // Backdate habit select change
  const backdateSelect = $('#backdate-habit-select');
  if (backdateSelect) {
    backdateSelect.addEventListener('change', () => {
      ui.backdateSelectedHabitId = backdateSelect.value;
      renderBackdateCalendar(backdateSelect.value);
    });
  }

  // Habit modal
  const habitModalClose = $('#habit-modal-close');
  if (habitModalClose) habitModalClose.addEventListener('click', closeHabitModal);
  const habitModalCancel = $('#habit-modal-cancel');
  if (habitModalCancel) habitModalCancel.addEventListener('click', closeHabitModal);
  const habitModalSave = $('#habit-modal-save');
  if (habitModalSave) habitModalSave.addEventListener('click', saveHabitForm);
  const habitArchiveBtn = $('#habit-archive-btn');
  if (habitArchiveBtn) {
    habitArchiveBtn.addEventListener('click', () => {
      const habitId = $('#habit-id-input').value;
      if (!habitId) return;
      const habit = getHabitById(habitId);
      if (!habit) return;
      if (confirm(`Archive "${unsanitize(habit.name)}"? Your history will be preserved.`)) {
        archiveHabit(habitId);
        closeHabitModal();
        showToast(`"${unsanitize(habit.name)}" archived.`, 'info');
        render();
      }
    });
  }

  // Habit form — clear errors on input
  $('#habit-name-input')?.addEventListener('input', () => {
    $('#err-name')?.classList.remove('visible');
    $('#habit-name-input')?.classList.remove('error');
  });
  $('#habit-category-input')?.addEventListener('change', () => {
    $('#err-category')?.classList.remove('visible');
    $('#habit-category-input')?.classList.remove('error');
  });

  // Reminder modal
  const reminderClose = $('#reminder-modal-close');
  if (reminderClose) reminderClose.addEventListener('click', () => closeModal($('#reminder-modal')));
  const reminderCancel = $('#reminder-modal-cancel');
  if (reminderCancel) reminderCancel.addEventListener('click', () => closeModal($('#reminder-modal')));
  const reminderSave = $('#reminder-modal-save');
  if (reminderSave) reminderSave.addEventListener('click', saveReminderForm);

  // Day selector buttons in reminder modal
  $$('.day-btn', $('#reminder-days-group')).forEach(btn => {
    btn.addEventListener('click', () => {
      const day = Number(btn.dataset.day);
      const idx = ui.selectedReminderDays.indexOf(day);
      if (idx === -1) ui.selectedReminderDays.push(day);
      else ui.selectedReminderDays.splice(idx, 1);
      updateDayBtns();
    });
  });

  // Habits page filter
  $$('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      ui.habitsFilter = btn.dataset.filter;
      renderHabitsPage();
    });
  });

  // Export
  const exportBtn = $('#export-btn');
  if (exportBtn) exportBtn.addEventListener('click', exportData);

  // Import
  const importFile = $('#import-file');
  if (importFile) {
    importFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) importData(file);
      importFile.value = ''; // reset so same file can be re-imported
    });
  }

  // Color picker — init
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
