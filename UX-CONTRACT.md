# UX Contract

## Product context

- Audience: Russian-speaking PrintFlow managers and print-floor staff.
- Primary jobs: find a layout, copy the requested quantity to a marketplace folder, review history, and check stock from selected PDF rows.
- Target market(s): Internal Russian Windows workflow.
- Active locales: `ru-RU`.
- Language/content register and native-review policy: Direct Russian operational language; marketplace and file abbreviations remain unchanged.
- Timezone/calendar policy: Local Windows time; queue archives at 20:00 and date filters use local calendar dates.
- Accessibility target: WCAG 2.2 AA baseline.

## Business-context sources

| Domain / scope | Authoritative source | Source type | Reviewed date |
|---|---|---|---|
| Data lifecycle | `server.mjs` job lifecycle and archive rule | API / implementation contract | 2026-09-01 |
| Deletion / retention | `src/delete.js` and user requirement | Product decision | 2026-09-01 |
| Print destinations | `server.mjs` and user-provided network paths | Product decision | 2026-09-01 |

## Visual contract

- Project `DESIGN.md`: `DESIGN.md`
- Token ownership model: `DESIGN.md` documents the runtime CSS layer.
- Runtime design-system/token source: `src/theme.css` plus existing base CSS.
- Mapping/export/adapters: `src/main.jsx` imports `src/theme.css` after the base styles.
- Token drift gate: review changed values against `DESIGN.md` and run the browser smoke check.
- Supported themes: Light.
- Design-context owner/review policy: PrintFlow project owner.

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | Native select | `src/main.jsx` + browser platform | native | keyboard smoke check |
| Date | Native date input | `src/main.jsx` + local Windows date | typed/native | filter smoke check |
| Form | React component | `src/main.jsx` | create | create validation smoke check |
| Scrollbar | Global application CSS | `src/theme.css` | default | computed style |
| CRUD | `/api/jobs` + `src/delete.js` | `server.mjs` | delete/stay | full-flow smoke check |
| Stock Excel analysis | `src/stock-check.js` + `/api/stock-analyze` | `server.mjs` + stock workbook | aggregate duplicates | uploaded workbook smoke check |

## Component behavior

| Component | Default | Hover | Focus | Active | Disabled | Busy | Error |
|---|---|---|---|---|---|---|---|
| Button | outlined/filled by intent | tint | orange ring | 1px press | muted | preserve size | inline message |
| Input | white surface | border tint | orange ring | n/a | muted | preserve size | explanatory banner |
| Search | local filter with clear affordance | border tint | orange ring | n/a | muted | n/a | no-results state |
| Table/list | readable rows | warm tint | visible focus | n/a | n/a | refresh silently | empty state |

## Dataset navigation

- Admin tables: History owns searchable, date-filtered, marketplace-filtered, status-filtered rows.
- Exploratory lists: Stock-check results use separate «На сборку» and «На печать» buckets.
- Excel analysis: uploaded rows are aggregated by article and marketplace; each result shows requested quantity and every stock location with its quantity.
- URL state: transient local UI state; refresh reloads persisted jobs and recomputes queue/history classification.
- Page size: render-all for the current internal dataset.
- Empty/no-results/error/loading treatment: explicit empty message, inline error banner, and five-second refresh.
- Selection scope: no bulk selection yet; individual delete remains available.

## Flow ledger

| Operation | Trigger | Pending | Success destination | Success feedback | Failure recovery | Focus outcome | Source ref |
|---|---|---|---|---|---|---|---|
| Create | «Поставить в печать» | button request | queue | inline success | inline error | stays on form | `server.mjs` |
| Delete | row «Удалить» | confirmation | same list | row disappears and total refreshes | error dialog | same list | `src/delete.js` |
| Search | type in history search | local filter | same list | visible matching rows | no-results text | input retains focus | `src/admin.js` |
| Upload/background job | choose Excel/PDF | processing message | preview/results | inline completion | inline error | uploader remains | `src/main.jsx`, `src/stock-check.js` |
| Analyze stock workbook | choose Excel in stock check | reading and lookup message | same stock-check panel | article rows with boxes and quantities | inline error | keep uploaded source unchanged | `src/stock-check.js`, `server.mjs` |

## Navigation and responsive behavior

- Route document title policy: `PrintFlow` remains the app title; in-page headings identify the active view.
- Breadcrumb/tab/route-state policy: persistent sidebar navigation with one active item.
- Sidebar/drawer/bottom-sheet transformation: persistent rail on desktop, compact rail below 900px.
- Responsive table strategy: horizontal overflow preserves comparison columns.
- Truncation/full-value access: wrapping for operational values; native title where file names need it.
- Focus restoration: navigation preserves the active page and does not trap focus.

## Overlays and feedback

- Dialog primitive: existing app-owned `.app-dialog` from `src/admin.js`.
- Destructive confirmation: explicit confirmation before deleting a row or clearing history.
- Alert/banner scope: inline success and error notices for form operations.

## Async and resilience

- Mutation default: server-confirmed mutations with refresh event.
- Idempotency and duplicate-submit policy: existing server job creation behavior; preserve button dimensions during requests.
- Offline/read-stale/write behavior: refresh failures leave the last visible state intact.
- Stale-request cancellation: article lookup uses cleanup/stale guard.

## Validation

- Schema/validation layer: existing server validation plus React guards.
- Trigger timing: on submit and debounced article lookup.
- Error summary/inline policy: visible Russian correction text near the action.
- `noValidate`: no native validation-only forms are introduced by the redesign.

## Verification

- Required static commands: `npm.cmd run build`, `git diff --check`.
- Browser/device/locale/theme matrix: Chromium in-app browser, desktop and narrow viewport, Russian UI.
- Accessibility checks: semantic buttons/links, visible focus, text labels retained beside icons.
- Canonical sibling flow used for comparison: New task and Stock check screens.
