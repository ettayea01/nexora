# NEXORA — Premium Offline-First Personal Productivity Ecosystem

Live (GitHub Pages, subpath): **https://ettayea01.github.io/nexora/**

Zero-build vanilla stack: HTML + CSS + native ES modules. **No npm, no CDN, no build step** — every dependency is vendored locally, so the app works fully offline after the first visit. Requested equivalents: native IndexedDB wrapper (Dexie-equivalent), hand-rolled SVG/CSS charts (Recharts-equivalent), CSS design system in the exact specified palette, inline SVG Lucide-style stroke icons, vendored PDF.js 3.11.174 + qrcode-generator 1.4.4.

## Project structure
```
nexora/
  index.html  offline.html  sw.js  manifest.webmanifest  README.md
  icons/ (icon.svg, icon-192.png, icon-512.png — maskable)
  src/styles/main.css
  src/js/db.js (IndexedDB 'nexora-db': notes, tasks, events, docs, transactions, budgets, files, focusSessions, meta)
  src/js/utils.js  i18n.js (EN/FR/AR + RTL)  ui.js  sync.js (local adapter stub)  app.js (shell, router, Ctrl+K palette)
  src/js/modules/{dashboard,notes,tasks,calendar,library,focus,finance,toolbox,files,settings}.js
  src/js/vendor/{qrcode.min.js, pdf.min.js, pdf.worker.min.js}
```

## Run locally
```
cd nexora && python3 -m http.server 8000        # or: npx serve .
# open http://localhost:8000/
```
Subpath check (mirrors GitHub Pages): serve the PARENT folder and open `http://localhost:8000/nexora/` — all references are relative (`src/...`, `./sw.js`, manifest `start_url`/`scope` = `./`), so any subpath works.

## Production deployment
Copy the folder to any static HTTPS host. GitHub Pages: push the folder as `/nexora/` in the Pages repo → live at https://ettayea01.github.io/nexora/ . HTTPS is required for Service Workers (localhost also qualifies).

## PWA installation
- Chrome/Edge desktop: open the site → "Install App" button in the top bar (or the install icon in the address bar).
- Android Chrome: menu → "Install app / Add to Home screen".
- After install, NEXORA launches standalone and works with no connection.

## Offline testing (15-step QA)
1. Open online. 2. Wait ~2s for the "ready to work offline" toast (SW installed). 3. Reload. 4. Disconnect internet (DevTools → Network → Offline). 5. Reload again — app shell loads. 6. Navigate all 10 modules. 7. Create a note. 8. Create a task. 9. Add a transaction. 10. Import a PDF into Library and page through it. 11. Close the browser. 12. Reopen offline. 13. Verify note/task/transaction/PDF are all still there. 14. Reconnect. 15. Verify everything still works.

## Completed features
Dashboard (real-data greeting/clock, productivity score, weekly SVG chart, upcoming events, recent notes/files, finance summary, focus widget, persisted widget toggles) · Notes (contenteditable rich text, auto-save, tags/folders, pin/favorite/archive/trash+restore, search/sort, word count, MD/TXT export, MD import) · Tasks (priorities, due dates, recurring daily/weekly/monthly, List + Kanban with move controls + mini calendar, real stats) · Calendar (month/week/day, colors, reminders) · Library (IndexedDB blobs, 25 MB limit, PDF.js viewer with paging + page bookmarks, image/text preview, categories, favorites, reading progress, recently opened) · Focus (end-timestamp Pomodoro — safe across sleep/suspension, stopwatch, daily goal, persisted sessions/history, SVG ring, WebAudio beep, Notifications) · Finance (income/expense CRUD, per-category monthly budgets with progress, SVG charts, monthly report, CSV export, configurable currency) · Toolbox (all 17 tools, fully local: JSON format/validate, Base64, URL, UUID, password via crypto.getRandomValues, QR via vendored lib, word/character counters, case converter, color HEX/RGB/HSL, timestamp, unit converter, Markdown previewer with HTML escaped first, regex tester, SHA-1/256/384/512 via WebCrypto) · Files (IndexedDB import, folders create/rename/delete, rename/move, previews, storage estimate) · Settings (profile, dark/light/system theme, EN/FR/AR with RTL, currency, PIN app lock stored as SHA-256 hash, backup export/import with blobs as base64, double-confirmed clear-all, storage info, About v1.0.0) · Shell (collapsible sidebar, mobile bottom nav, online/offline indicator, install prompt, Ctrl+K command palette searching notes/tasks/events, toasts, confirm modals, empty states, skeletons) · Seed: exactly one deletable welcome note on first run; no other fake data.

## Known limitations (honest)
- EPUB files are genuinely stored with metadata but have no built-in reader preview (download link offered).
- MD5 is not available in WebCrypto, so the hash tool offers SHA family only.
- Notes rich text uses execCommand (deprecated but universally supported); stored note HTML is the user's own editor content, rendered back only into their own editor.
- Drag-and-drop on Kanban is via move buttons (reliable on touch), not HTML5 drag.
- Offline behavior was verified by HTTP/precache/logic tests in the build VM; no headless browser was available there for a full DevTools-offline run — use the 15-step QA above on your device.
