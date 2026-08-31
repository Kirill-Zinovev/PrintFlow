import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import * as XLSX from 'xlsx';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString();

const STOCK_API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:4174'
  : `${window.location.protocol}//${window.location.hostname}:4174`;

const style = document.createElement('style');
style.textContent = `
.stock-panel{display:none}.stock-panel.is-visible{display:block}.stock-panel .panel-head{margin-bottom:18px}
.stock-intro{max-width:760px;color:#758097;font:13px/1.6 'DM Sans',sans-serif;margin:-8px 0 22px}
.stock-upload{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:16px;border:1px dashed #d8e0eb;border-radius:10px;background:#fbfcfe}
.stock-upload input{display:none}.stock-upload-button{display:inline-flex;align-items:center;min-height:34px;border:1px solid #e1e6ee;border-radius:7px;background:#fff;color:#53617a;padding:0 12px;font:600 11px 'DM Sans',sans-serif;cursor:pointer}
.stock-upload-button:hover{border-color:#edb39f;color:#d85f3e}.stock-upload-hint{color:#8994a8;font:11px 'DM Sans',sans-serif}
.stock-files{display:grid;gap:9px;margin-top:14px}.stock-file{display:grid;grid-template-columns:minmax(180px,1fr) 82px 82px auto auto;gap:8px;align-items:end;border:1px solid #e5e9f0;border-radius:9px;padding:10px 12px;background:#fff}
.stock-file-main{display:flex;align-items:center;gap:9px;min-width:0;align-self:center}.stock-pdf-icon{display:grid;place-items:center;flex:0 0 28px;height:32px;border-radius:7px;background:#fff0eb;color:#e76443;font:700 9px 'DM Sans',sans-serif}.stock-file-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#33415a;font:600 12px 'DM Sans',sans-serif}
.stock-field{display:grid;gap:4px;color:#8994a8;font:10px 'DM Sans',sans-serif}.stock-file input{height:32px;width:100%;border:1px solid #dfe5ee;border-radius:7px;padding:0 8px;color:#33415a;font:500 12px 'DM Sans',sans-serif}
.stock-file button,.stock-mode button,.stock-export{height:34px;border:1px solid #e1e6ee;border-radius:7px;background:#fff;color:#53617a;padding:0 11px;font:600 11px 'DM Sans',sans-serif;cursor:pointer}.stock-file button:hover,.stock-mode button:hover{border-color:#edb39f;color:#d85f3e}
.stock-remove{color:#c7644c!important}.stock-remove:hover{background:#fff5f2;border-color:#f2b7a6!important}.stock-file-status{grid-column:1/-1;color:#8994a8;font:11px 'DM Sans',sans-serif}.stock-file-status.ok{color:#319c6b}.stock-file-status.error{color:#c7644c}
.stock-results{margin-top:24px}.stock-results-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;border-bottom:1px solid #eef1f5;padding-bottom:13px}.stock-results h3{margin:0;color:#152034;font:700 16px 'Space Grotesk',sans-serif}.stock-results-count{color:#8994a8;font:11px 'DM Sans',sans-serif;margin-left:auto}.stock-mode{display:flex;gap:6px}.stock-mode button.active{background:#fff1eb;border-color:#ffd1c2;color:#d85f3e}
.stock-result{display:grid;grid-template-columns:64px minmax(0,1fr) auto;gap:12px;align-items:start;padding:14px 0;border-bottom:1px solid #f0f2f5}.stock-photo{width:64px;height:64px;object-fit:cover;border:1px solid #e3e8ef;border-radius:8px;background:#f7f8fa}.stock-result-main{display:flex;align-items:center;gap:10px;flex-wrap:wrap;color:#253149;font:600 13px 'DM Sans',sans-serif}.stock-result-main small{width:100%;color:#8994a8;font:11px 'DM Sans',sans-serif}.stock-tag{border-radius:5px;padding:4px 7px;background:#edf8f2;color:#319c6b;font:700 10px 'DM Sans',sans-serif}.stock-boxes{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.stock-box{border:1px solid #e2e8ef;border-radius:6px;padding:6px 8px;color:#53617a;background:#fafbfc;font:11px 'DM Sans',sans-serif}.stock-empty{color:#c7644c;font:11px 'DM Sans',sans-serif}.stock-result-remove{height:30px!important;padding:0 9px!important}.stock-footer{display:flex;justify-content:flex-end;margin-top:18px}.stock-export{height:38px;background:#ed6a46;color:#fff;border:0;padding:0 16px}.stock-export:hover{background:#d95c3b}.stock-export:disabled{opacity:.5;cursor:not-allowed}
@media(max-width:800px){.stock-file{grid-template-columns:minmax(150px,1fr) 76px 76px auto}.stock-file .stock-remove{grid-column:4}.stock-result{grid-template-columns:52px minmax(0,1fr)}.stock-photo{width:52px;height:52px}.stock-result-remove{grid-column:2;justify-self:start}}@media(max-width:560px){.stock-file{grid-template-columns:1fr 1fr}.stock-file-main{grid-column:1/-1}.stock-file button{grid-column:auto}.stock-file .stock-remove{grid-column:auto}.stock-file-status{grid-column:1/-1}}
`;
document.head.append(style);

const state = { items: [], results: [], mode: 'assembly' };
const makeId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

function getPdfRows(textContent) {
  const lines = [];
  for (const item of textContent.items) {
    const text = String(item.str || '').trim();
    if (!text) continue;
    const y = item.transform?.[5] || 0;
    let line = lines.find(candidate => Math.abs(candidate.y - y) < 3);
    if (!line) { line = { y, parts: [] }; lines.push(line); }
    line.parts.push({ x: item.transform?.[4] || 0, text });
  }
  return lines
    .sort((a, b) => b.y - a.y)
    .map(line => ({
      y: line.y,
      text: line.parts.sort((a, b) => a.x - b.x).map(part => part.text).join(' ').replace(/\s+/g, ' ').trim()
    }))
    .filter(line => line.text);
}

async function renderPdfPhoto(page, rowY) {
  const scale = 1.5;
  const viewport = page.getViewport({ scale });
  const pageCanvas = document.createElement('canvas');
  pageCanvas.width = Math.ceil(viewport.width);
  pageCanvas.height = Math.ceil(viewport.height);
  await page.render({ canvasContext: pageCanvas.getContext('2d'), viewport }).promise;
  const left = Math.max(0, Math.round(52 * scale));
  const top = Math.max(0, Math.round(viewport.height - (rowY + 73) * scale));
  const width = Math.min(Math.round(145 * scale), pageCanvas.width - left);
  const height = Math.min(Math.round(76 * scale), pageCanvas.height - top);
  if (width <= 0 || height <= 0) return '';
  const photoCanvas = document.createElement('canvas');
  photoCanvas.width = width;
  photoCanvas.height = height;
  photoCanvas.getContext('2d').drawImage(pageCanvas, left, top, width, height, 0, 0, width, height);
  return photoCanvas.toDataURL('image/jpeg', 0.82);
}

async function extractPdfRow(file, pageNumber, rowNumber) {
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  if (pageNumber < 1 || pageNumber > pdf.numPages) throw new Error(`В файле ${file.name} только ${pdf.numPages} страниц`);
  const page = await pdf.getPage(pageNumber);
  const rows = getPdfRows(await page.getTextContent());
  const rowPattern = /^\d+\s+([A-ZА-Я0-9]{2,12}[._-][A-ZА-Я0-9-]+)\s+(\d+(?:[.,]\d+)?)\s+(WB|OZON)\s+(.+)$/i;
  const prefix = new RegExp(`^${Number(rowNumber)}\\b`);
  const exactRow = rows.find(row => prefix.test(row.text));
  const dataRows = rows.filter(row => rowPattern.test(row.text));
  const row = exactRow || dataRows[Number(rowNumber) - 1];
  if (!row) throw new Error(`Строка ${rowNumber} на странице ${pageNumber} не найдена`);
  const match = row.text.match(rowPattern);
  if (!match) throw new Error(`Не удалось распознать строку: ${row.text}`);
  const photo = await renderPdfPhoto(page, row.y);
  return { article: match[1].toUpperCase(), qty: Number(match[2].replace(',', '.')), market: match[3].toUpperCase(), box: match[4].trim(), photo, pdfRow: Number(row.text.match(/^\d+/)?.[0] || rowNumber) };
}

async function checkItem(id) {
  const item = state.items.find(candidate => candidate.id === id);
  if (!item) return;
  item.status = 'Проверяю…';
  render();
  try {
    const parsed = await extractPdfRow(item.file, Number(item.page), Number(item.row));
    const response = await fetch(`${STOCK_API}/api/stock-search?article=${encodeURIComponent(parsed.article)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Не удалось открыть таблицу остатков');
    state.results = state.results.filter(result => result.itemId !== id);
    state.results.push({ ...parsed, itemId: id, source: item.file.name, page: item.page, row: item.row, matches: data });
    item.status = data.length ? `Найдено коробок: ${data.length}` : 'В остатках не найдено';
    item.ok = Boolean(data.length);
  } catch (error) {
    item.status = error.message;
    item.ok = false;
    state.results = state.results.filter(result => result.itemId !== id);
  }
  render();
}

function removeItem(id) {
  state.items = state.items.filter(item => item.id !== id);
  state.results = state.results.filter(result => result.itemId !== id);
  render();
}

function exportResults() {
  const found = state.results.filter(result => result.matches.length);
  const rows = [];
  if (state.mode === 'assembly') {
    const grouped = new Map();
    for (const result of found) {
      const key = `${result.article}|${result.market}`;
      const previous = grouped.get(key) || { Артикул: result.article, Количество: 0, Маркетплейс: result.market, Короба: new Set() };
      previous.Количество += result.qty;
      for (const match of result.matches) {
        const label = match.level ? `${match.box} (${match.level})` : match.box;
        if (label) previous.Короба.add(label);
      }
      grouped.set(key, previous);
    }
    for (const row of grouped.values()) rows.push({ ...row, Короба: [...row.Короба].join(', ') });
  } else {
    const grouped = new Map();
    for (const result of found) {
      const key = `${result.article}|${result.market}`;
      const previous = grouped.get(key) || { Артикул: result.article, Количество: 0, Маркетплейс: result.market };
      previous.Количество += result.qty;
      grouped.set(key, previous);
    }
    rows.push(...grouped.values());
  }
  if (!rows.length) return;
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = state.mode === 'assembly' ? [{ wch: 20 }, { wch: 14 }, { wch: 16 }, { wch: 44 }] : [{ wch: 20 }, { wch: 14 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(workbook, worksheet, state.mode === 'assembly' ? 'На сборку' : 'На печать');
  XLSX.writeFile(workbook, `PrintFlow_${state.mode === 'assembly' ? 'сборка' : 'печать'}.xlsx`);
}

function render() {
  const panel = document.querySelector('.stock-panel');
  if (!panel) return;
  const files = state.items.map(item => `<div class="stock-file"><div class="stock-file-main"><span class="stock-pdf-icon">PDF</span><span class="stock-file-name" title="${escapeHtml(item.file.name)}">${escapeHtml(item.file.name)}</span></div><label class="stock-field"><span>Страница</span><input data-id="${item.id}" data-field="page" type="number" min="1" value="${item.page}" aria-label="Страница"></label><label class="stock-field"><span>Строка</span><input data-id="${item.id}" data-field="row" type="number" min="1" value="${item.row}" aria-label="Строка"></label><button data-check="${item.id}" type="button">Проверить</button><button class="stock-remove" data-remove="${item.id}" type="button">Удалить</button><span class="stock-file-status ${item.ok ? 'ok' : item.status && item.status !== 'Готово' ? 'error' : ''}">${escapeHtml(item.status || 'Укажите страницу и строку')}</span></div>`).join('');
  const results = state.results.length ? `<div class="stock-results"><div class="stock-results-head"><h3>Результаты поиска</h3><span class="stock-results-count">Позиций: ${state.results.length}</span><div class="stock-mode"><button type="button" class="${state.mode === 'assembly' ? 'active' : ''}" data-mode="assembly">На сборку</button><button type="button" class="${state.mode === 'print' ? 'active' : ''}" data-mode="print">На печать</button></div></div>${state.results.map(result => `<div class="stock-result">${result.photo ? `<img class="stock-photo" src="${result.photo}" alt="Фото ${escapeHtml(result.article)}">` : '<div class="stock-photo" aria-hidden="true"></div>'}<div><div class="stock-result-main"><span>${escapeHtml(result.article)}</span><span class="stock-tag">${result.qty} шт. · ${escapeHtml(result.market)}</span><small>${escapeHtml(result.source)}, стр. ${result.page}, строка ${result.row}; PDF-коробка: ${escapeHtml(result.box)}</small></div><div class="stock-boxes">${result.matches.length ? result.matches.map(match => `<span class="stock-box">${escapeHtml(match.box || 'Коробка не указана')}${match.level ? ` · ${escapeHtml(match.level)}` : ''} · остаток ${Number(match.stock) || 0} шт.</span>`).join('') : '<span class="stock-empty">В таблице остатков не найдено</span>'}</div></div><button class="stock-remove stock-result-remove" data-remove="${result.itemId}" type="button">Удалить</button></div>`).join('')}<div class="stock-footer"><button class="stock-export" type="button" ${state.results.some(result => result.matches.length) ? '' : 'disabled'}>Скачать Excel</button></div></div>` : '';
  panel.innerHTML = `<div class="panel-head"><div><h2>Проверка остатков</h2><p>Найдите артикулы из PDF в актуальной таблице склада</p></div><div class="step">03</div></div><p class="stock-intro">Загрузите несколько PDF-файлов. Для каждого укажите страницу и номер строки — система покажет фото, все найденные короба и подготовит Excel.</p><div class="stock-upload"><label class="stock-upload-button">Выбрать PDF-файлы<input id="stock-pdf-input" type="file" accept="application/pdf,.pdf" multiple></label><span class="stock-upload-hint">Можно выбрать несколько файлов</span></div><div class="stock-files">${files}</div>${results}`;
  bindPanelEvents();
}

function bindPanelEvents() {
  const input = document.querySelector('#stock-pdf-input');
  if (input) input.onchange = () => { state.items.push(...[...input.files].map(file => ({ id: makeId(), file, page: 1, row: 1, status: 'Готово' }))); render(); };
  document.querySelectorAll('[data-check]').forEach(button => { button.onclick = () => checkItem(button.dataset.check); });
  document.querySelectorAll('[data-remove]').forEach(button => { button.onclick = () => removeItem(button.dataset.remove); });
  document.querySelectorAll('[data-field]').forEach(field => { field.onchange = () => { const item = state.items.find(candidate => candidate.id === field.dataset.id); if (item) item[field.dataset.field] = field.value; }; });
  document.querySelectorAll('[data-mode]').forEach(button => { button.onclick = () => { state.mode = button.dataset.mode; render(); }; });
  const exportButton = document.querySelector('.stock-export');
  if (exportButton) exportButton.onclick = exportResults;
}

function setup() {
  const main = document.querySelector('main');
  const nav = document.querySelector('nav');
  if (!main || !nav || document.querySelector('.stock-nav')) return;
  const link = document.createElement('a');
  link.className = 'stock-nav';
  link.textContent = 'Проверка остатков';
  nav.append(link);
  const panel = document.createElement('section');
  panel.className = 'panel stock-panel';
  main.append(panel);
  const regular = [...main.children].filter(child => child !== panel);
  const showStock = () => { regular.forEach(child => { child.style.display = 'none'; }); panel.classList.add('is-visible'); nav.querySelectorAll('a').forEach(item => item.classList.remove('active')); link.classList.add('active'); render(); };
  const showMain = () => { regular.forEach(child => { child.style.display = ''; }); panel.classList.remove('is-visible'); link.classList.remove('active'); nav.querySelector('a')?.classList.add('active'); };
  link.onclick = showStock;
  nav.querySelectorAll('a:not(.stock-nav)').forEach(item => { item.onclick = showMain; });
}

new MutationObserver(setup).observe(document.body, { childList: true, subtree: true });
setTimeout(setup, 400);
