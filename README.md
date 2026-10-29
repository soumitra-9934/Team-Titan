# Habit Tracker

> Build habits with streaks and a GitHub-style heatmap.

Hack Day Haldia x GRID community - 6-hour build challenge

**Repo:** `team-titan` | **Stack:** HTML + vanilla JavaScript | **Difficulty:** Medium-Hard | **Time:** 6 hours

## Brief
Good habits stick when progress is visible. Build a tracker that rewards consistency with streaks, heatmaps and weekly stats.

## Core tasks (must-do)
- [ ] Add / edit / archive habits with a weekly target and a colour
- [ ] Daily check-in, including backfilling past days
- [ ] Current and longest streak per habit
- [ ] 12-week heatmap per habit and an overall heatmap
- [ ] Weekly and monthly stats chart
- [ ] Everything persists in localStorage
- [ ] Reminder settings screen (time and days per habit)

## Bonus tasks (only after the core works)
- [ ] Browser notification reminders (Notification API)
- [ ] Installable PWA with offline support
- [ ] Export / import data
- [ ] Share progress as a PNG card (canvas)

## What is already here
- `index.html` - base page
- `script.js` - state, `save()` / `load()` (localStorage), `render()` and TODO function stubs
- `package.json` - `npm start` serves this folder

## Run locally
```bash
npm start   # or simply open index.html in your browser
```

## Deploy
Any static host works (for example GitHub Pages, Netlify or Vercel). There is no build step.

## Suggested pacing
- Hour 1: read this README, agree on a plan and split the work
- Hours 2-4: build the core tasks
- Hour 5: integrate, polish, then bonus tasks if time allows
- Hour 6: deploy, open the Pull Request, submit on the MLH platform (OrganizerHQ)

## Submission checklist
- [ ] All core tasks work end to end
- [ ] Project is deployed and the live link opens
- [ ] Pull Request created on the Voyage GitHub repository assigned to your team
- [ ] Project submitted on the MLH platform (OrganizerHQ) - instructions are shared at the start of the event

## Rules
- Build new features on top of this starter project and integrate them.
- Teams of 3-4; every member must be present.
- AI tools and open-source / open-weight models are fully allowed.
