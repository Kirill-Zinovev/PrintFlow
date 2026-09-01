---
version: alpha
name: "PrintFlow"
description: "Рабочий центр управления печатью с быстрым вводом заданий, видимой очередью и понятной историей."
colors:
  primary: "#F26B47"
  background: "#F4F6FA"
  surface: "#FFFFFF"
  ink: "#142139"
  muted: "#73819A"
  sidebar: "#101827"
  sidebar-active: "#26344C"
  success: "#35A875"
  warning: "#C3893E"
  border: "#DFE6F0"
typography:
  display:
    fontFamily: "Space Grotesk, Arial, sans-serif"
  sans:
    fontFamily: "DM Sans, Arial, sans-serif"
  utility:
    fontFamily: "DM Sans, Arial, sans-serif"
rounded:
  DEFAULT: "0.75rem"
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
spacing:
  page-x: "2.75rem"
  section-gap: "1.25rem"
  card-padding: "1.5rem"
  page-max: "90rem"
components:
  button:
    rounded: "0.625rem"
    height: "2.75rem"
  card:
    rounded: "0.875rem"
  input:
    rounded: "0.625rem"
    height: "2.75rem"
  table:
    height: "4rem"
---

# PrintFlow Design System

## Overview

### Creative North Star

PrintFlow should feel like a small, calm dispatch desk: the dark sidebar is the control rail, the pale workspace is the paper stack, and orange is reserved for the moment a job is sent to print. The interface is operational rather than decorative, but it has one memorable signature: a warm orange action line that anchors every primary workflow.

### Product context and register

- **Audience and primary job:** Managers and print-floor staff who find layouts, send copies to WB/Ozon folders, and reconcile missing stock items.
- **Target market(s) and evidence:** Russian internal operations; the existing Russian labels, network paths, marketplaces, and local Windows workflow are the product evidence.
- **Locale(s) and language policy:** Russian UI, Russian dates and statuses, with marketplace and file-extension abbreviations preserved exactly.
- **Usage scene:** Windows desktop on the print floor, frequent repeated actions, mixed keyboard and mouse use, high information density.
- **Register:** Product/tooling. Familiarity and speed outrank visual novelty.
- **Memorable signature:** One warm orange action signal: primary print actions, active accent line, and focus ring share the same family.
- **Restraint:** Tables, filters, statuses, and destructive actions remain quiet and predictable.
- **Anti-references:** Avoid a generic SaaS gradient dashboard, oversized marketing hero, neon gaming palette, and decorative cards that hide operational data.
- **Token ownership/runtime mapping:** This file documents the runtime tokens implemented by `src/theme.css`, with existing base styles in `src/styles.css`, `src/queue.css`, and `src/stock-check.js` treated as the compatibility layer.

## Colors

The canvas uses `#F4F6FA` and white surfaces so long tables stay readable. `#142139` is the primary ink, `#73819A` is supporting text, and `#DFE6F0` is the quiet structural border. `#F26B47` is reserved for print actions and focus, `#35A875` for successful discovery, and `#C3893E` for waiting/taken states. The sidebar uses `#101827` with `#26344C` for the active route.

## Typography

`Space Grotesk` carries page and section headings; `DM Sans` carries controls, instructions, and dense data. Numeric totals use the display face with tabular-looking emphasis. Russian text uses Arial as a resilient fallback. Sentence case is preferred; uppercase is limited to small utility labels.

## Layout

The persistent 230px control rail gives frequent destinations a stable home. The content uses a centered max width of 90rem, with compact 20px section gaps and 24px card padding. The new-task and Excel panels share one row on desktop and stack below 900px. Tables keep their column relationships and scroll horizontally on narrow screens.

## Elevation & Depth

Hierarchy comes from tonal layers and one restrained shadow, not floating decoration. Cards have a 1px border and a soft shadow only when they are the active work surface. Inputs use a warm orange focus ring. No blur or animated background is used behind operational data.

## Shapes

Cards use 14px corners, controls 10px, and compact badges use 8px. The interface uses rounded rectangles with crisp dividers because they echo folders, labels, and paper trays. Destructive actions use outlined treatment and never share the primary orange fill.

## Components

### Foundational visual states

Controls have quiet default, pale hover, visible orange focus-visible, pressed translate feedback, and muted disabled states. Success and warning messages use tinted banners with text, not color alone.

### Buttons and actions

Orange filled buttons are reserved for putting work in print or exporting a deliberate result. Secondary actions are white with a border. Destructive delete/clear actions are outlined coral and use explicit verbs.

### Navigation and data display

The sidebar is persistent on desktop and collapses to an icon rail on narrow screens while preserving accessible labels. Tables preserve comparison columns, use a calm header band, and expose status through text plus tinted chips.

### Forms and overlays

Inputs remain native and keyboard friendly. Search stays debounced and gets an explicit clear affordance when non-empty. Existing app-owned dialog feedback is retained for report/settings actions.

### Iconography

Lucide icons are used at 16–18px with a 1.8px visual stroke. Icons support text rather than replacing it; navigation labels and primary actions remain visible.

### Motion

Motion is short and functional: 150ms hover/focus transitions and a small pressed shift. Respect `prefers-reduced-motion` by disabling transforms and transitions.

### Content and data visualization

Use direct Russian action language: «Поставить в печать», «Скачать Excel», «Удалить». Quantities always include «шт.» and dates remain explicit in filters. Marketplace and print status are separate signals.

## Do's and Don'ts

- **Do:** Keep the next operational action visually obvious.
- **Do:** Use the same tokens across the web view and Electron renderer.
- **Don't:** Turn status colors into the only way to understand a row.
- **Don't:** Add large decorative gradients or hide important controls behind hover-only UI.
