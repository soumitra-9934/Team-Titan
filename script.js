// Habit Tracker - Hack Day Haldia x GRID community starter. Build the core tasks from README.md.
const KEY = "hackday-haldia-team-titan";
const $ = (sel) => document.querySelector(sel);

// App state - reshape it to fit your project.
let state = { items: [] };

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage blocked */ }
}

function load() {
  try { state = JSON.parse(localStorage.getItem(KEY)) || state; } catch (e) { /* ignore */ }
}

function render() {
  // TODO: draw your UI into #app
}

// ---- TODO(core): fill these in -------------------------------------------
// TODO(core): create / edit a habit
function addHabit() {
}

// TODO(core): mark a habit done for a day
function toggleCheckin() {
}

// TODO(core): current and longest streak
function calcStreaks() {
}

// TODO(core): draw the 12-week heatmap
function renderHeatmap() {
}

// TODO(core): draw weekly / monthly charts
function renderStats() {
}


document.addEventListener("DOMContentLoaded", () => {
  load();
  $("#status").textContent = "script.js loaded.";
  render();
});
