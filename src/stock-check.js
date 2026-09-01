import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import * as XLSX from 'xlsx';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString();

const STOCK_API = window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
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

const boardStyle = document.createElement('style');
boardStyle.textContent = `
.stock-buckets{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:24px}.stock-bucket{min-width:0;min-height:260px;border:1px solid #e4e9f0;border-radius:12px;padding:14px;background:#fbfcfe;transition:border-color .15s,background .15s}.stock-bucket.assembly{border-top:3px solid #55bf88}.stock-bucket.print{border-top:3px solid #ed6a46}.stock-bucket.is-drag-over{border-color:#9d91f5;background:#f8f7ff}.stock-bucket-head{display:flex;align-items:flex-start;gap:10px;margin-bottom:10px}.stock-bucket-head>div:first-child{flex:1}.stock-bucket-title{display:flex;align-items:center;gap:7px;color:#152034;font:700 15px 'Space Grotesk',sans-serif}.stock-bucket-title .dot{width:8px;height:8px;border-radius:50%;background:#55bf88}.stock-bucket.print .stock-bucket-title .dot{background:#ed6a46}.stock-bucket-subtitle{margin-top:4px;color:#8994a8;font:11px 'DM Sans',sans-serif}.stock-bucket-count{display:inline-flex;align-items:center;justify-content:center;min-width:25px;height:24px;padding:0 7px;border-radius:6px;background:#eef8f2;color:#319c6b;font:700 11px 'DM Sans',sans-serif}.stock-bucket.print .stock-bucket-count{background:#fff1eb;color:#d85f3e}.stock-bucket-export{height:30px!important;padding:0 9px!important;font-size:10px!important}.stock-bucket-list{display:grid;gap:8px}.stock-bucket-empty{display:grid;place-items:center;min-height:150px;border:1px dashed #dfe5ee;border-radius:8px;color:#a0a9b8;text-align:center;font:11px/1.5 'DM Sans',sans-serif}.stock-bucket .stock-result{margin:0;padding:10px;border:1px solid #e5e9f0;border-radius:9px;background:#fff;cursor:grab}.stock-bucket .stock-result.is-dragging{opacity:.45}.stock-drag-hint{margin:11px 0 0;color:#a0a9b8;text-align:center;font:10px 'DM Sans',sans-serif}@media(max-width:800px){.stock-buckets{grid-template-columns:1fr}}
`;
document.head.append(boardStyle);

const analyzerStyle = document.createElement('style');
analyzerStyle.textContent = `
.stock-analyzer{margin-bottom:24px;padding:16px;border:1px solid #dfe6f0;border-radius:12px;background:#f8fafc}
.stock-analyzer-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:13px}
.stock-analyzer-title{color:#152034;font:700 16px 'Space Grotesk',sans-serif}.stock-analyzer-subtitle{margin-top:4px;color:#8994a8;font:11px 'DM Sans',sans-serif;line-height:1.45}
.stock-analyzer-upload{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:12px;border:1px dashed #cfd9e7;border-radius:9px;background:#fff}
.stock-analyzer-button{display:inline-flex;align-items:center;min-height:34px;border:1px solid #dfe6f0;border-radius:8px;background:#fff;color:#53617a;padding:0 11px;font:700 11px 'DM Sans',sans-serif;cursor:pointer}.stock-analyzer-button:hover{border-color:#edb39f;color:#d85f3e;background:#fff8f5}.stock-analyzer-button input{display:none}
.stock-analyzer-status{color:#8994a8;font:11px 'DM Sans',sans-serif}.stock-analyzer-status.error{color:#c7644c}.stock-analyzer-status.ok{color:#319c6b}
.stock-analysis-summary{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:14px;color:#53617a;font:11px 'DM Sans',sans-serif}.stock-analysis-summary strong{color:#152034;font:700 14px 'Space Grotesk',sans-serif}
.stock-analysis-buckets{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:14px}.stock-analysis-bucket{min-width:0;min-height:190px;border:1px solid #e4e9f0;border-radius:11px;padding:13px;background:#fbfcfe;transition:border-color .15s,background .15s}.stock-analysis-bucket.assembly{border-top:3px solid #55bf88}.stock-analysis-bucket.print{border-top:3px solid #ed6a46}.stock-analysis-bucket.is-drag-over{border-color:#9d91f5;background:#f8f7ff}.stock-analysis-bucket-head{display:flex;align-items:flex-start;gap:8px;margin-bottom:10px}.stock-analysis-bucket-head>div:first-child{flex:1}.stock-analysis-bucket-title{display:flex;align-items:center;gap:7px;color:#152034;font:700 14px 'Space Grotesk',sans-serif}.stock-analysis-bucket-title .dot{width:8px;height:8px;border-radius:50%;background:#55bf88}.stock-analysis-bucket.print .stock-analysis-bucket-title .dot{background:#ed6a46}.stock-analysis-bucket-subtitle{margin-top:4px;color:#8994a8;font:10px/1.4 'DM Sans',sans-serif}.stock-analysis-bucket-count{display:inline-flex;align-items:center;justify-content:center;min-width:25px;height:23px;padding:0 7px;border-radius:6px;background:#eef8f2;color:#319c6b;font:700 11px 'DM Sans',sans-serif}.stock-analysis-bucket.print .stock-analysis-bucket-count{background:#fff1eb;color:#d85f3e}.stock-analysis-bucket-export{height:30px!important;padding:0 9px!important;font-size:10px!important}.stock-analysis-bucket-list{display:grid;gap:8px}.stock-analysis-bucket-empty{display:grid;place-items:center;min-height:130px;border:1px dashed #dfe5ee;border-radius:8px;color:#a0a9b8;text-align:center;font:11px/1.5 'DM Sans',sans-serif}.stock-analysis-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:start;padding:11px;border:1px solid #e5e9f0;border-radius:9px;background:#fff;cursor:grab}.stock-analysis-card.is-dragging{opacity:.45}.stock-analysis-card-main{min-width:0;color:#53617a;font:11px/1.45 'DM Sans',sans-serif}.stock-analysis-card-title{display:flex;align-items:center;gap:8px;flex-wrap:wrap;color:#22304a;font-weight:700}.stock-analysis-card-qty{color:#53617a;font-weight:500}.stock-analysis-card-locations{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.stock-analysis-card-location{display:inline-flex;align-items:center;gap:4px;padding:5px 7px;border:1px solid #e2e8ef;border-radius:6px;background:#fafbfc;color:#53617a}.stock-analysis-card-location b{color:#22304a}.stock-analysis-card-missing{display:block;margin-top:8px;color:#c7644c}.stock-analysis-card-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end}.stock-analysis-move{height:28px!important;padding:0 8px!important;color:#7c6fe0!important;font-size:10px!important}.stock-analysis-delete{height:28px!important;padding:0 8px!important}.stock-analysis-drag-hint{margin:10px 0 0;color:#a0a9b8;text-align:center;font:10px 'DM Sans',sans-serif}
@media(max-width:800px){.stock-analysis-buckets{grid-template-columns:1fr}.stock-analysis-card{grid-template-columns:minmax(0,1fr) auto}}
@media(max-width:560px){.stock-analysis-card{grid-template-columns:1fr}.stock-analysis-card-actions{justify-content:flex-start}}
`;
document.head.append(analyzerStyle);

const state = { items: [], results: [], analysis: [], analysisStatus: '', analysisStatusKind: '', analysisFileName: '', dragId: null, analysisDragId: null };
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
    state.results.push({ ...parsed, resultId: makeId(), itemId: id, source: item.file.name, page: item.page, row: item.row, matches: data, bucket: data.length ? 'assembly' : 'print' });
    item.status = data.length ? `Найдено коробок: ${data.length}` : 'В остатках не найдено';
    item.ok = Boolean(data.length);
  } catch (error) {
    item.status = error.message;
    item.ok = false;
  }
  render();
}

function removeItem(id) {
  state.items = state.items.filter(item => item.id !== id);
  state.results = state.results.filter(result => result.itemId !== id);
  render();
}

function removeResult(resultId) {
  state.results = state.results.filter(result => result.resultId !== resultId);
  render();
}

function exportResults(bucket) {
  const selected = state.results.filter(result => result.bucket === bucket);
  const rows = [];
  if (bucket === 'assembly') {
    const grouped = new Map();
    for (const result of selected) {
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
    for (const result of selected) {
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
  worksheet['!cols'] = bucket === 'assembly' ? [{ wch: 20 }, { wch: 14 }, { wch: 16 }, { wch: 44 }] : [{ wch: 20 }, { wch: 14 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(workbook, worksheet, bucket === 'assembly' ? 'На сборку' : 'На печать');
  XLSX.writeFile(workbook, `PrintFlow_${bucket === 'assembly' ? 'сборка' : 'печать'}.xlsx`);
}

function renderResult(result) {
  const boxes = result.matches.length
    ? result.matches.map(match => `<span class="stock-box">${escapeHtml(match.box || 'Коробка не указана')}${match.level ? ` · ${escapeHtml(match.level)}` : ''} · остаток ${Number(match.stock) || 0} шт.</span>`).join('')
    : '<span class="stock-empty">В таблице остатков не найдено</span>';
  return `<div class="stock-result" draggable="true" data-drag="${result.resultId}">${result.photo ? `<img class="stock-photo" src="${result.photo}" alt="Фото ${escapeHtml(result.article)}">` : '<div class="stock-photo" aria-hidden="true"></div>'}<div><div class="stock-result-main"><span>${escapeHtml(result.article)}</span><span class="stock-tag">${result.qty} шт. · ${escapeHtml(result.market)}</span><small>${escapeHtml(result.source)}, стр. ${result.page}, строка ${result.row}; PDF-коробка: ${escapeHtml(result.box)}</small></div><div class="stock-boxes">${boxes}</div></div><button class="stock-remove stock-result-remove" data-remove-result="${result.resultId}" type="button">Удалить</button></div>`;
}

function renderBucket(bucket, title, subtitle) {
  const results = state.results.filter(result => result.bucket === bucket);
  return `<section class="stock-bucket ${bucket}" data-bucket="${bucket}"><div class="stock-bucket-head"><div><div class="stock-bucket-title"><span class="dot"></span>${title}</div><div class="stock-bucket-subtitle">${subtitle}</div></div><span class="stock-bucket-count">${results.length}</span><button class="stock-export stock-bucket-export" data-export="${bucket}" type="button" ${results.length ? '' : 'disabled'}>Скачать Excel</button></div><div class="stock-bucket-list">${results.length ? results.map(renderResult).join('') : `<div class="stock-bucket-empty">Перетащите сюда позиции<br>или проверьте новый артикул</div>`}</div><div class="stock-drag-hint">Перетащите карточку в другую панель, если нужно изменить решение</div></section>`;
}

function sheetValue(row, names) {
  const entry = Object.entries(row).find(([key]) => names.includes(String(key).trim().toLowerCase()));
  return entry?.[1] ?? '';
}

function removeAnalysis(analysisId) {
  state.analysis = state.analysis.filter(item => item.analysisId !== analysisId);
  state.analysisStatus = state.analysis.length ? `Готово · ${state.analysis.length} позиций из Excel` : 'Все позиции удалены';
  state.analysisStatusKind = state.analysis.length ? 'ok' : '';
  render();
}

function exportAnalysis(bucket) {
  const selected = state.analysis.filter(item => item.bucket === bucket);
  if (!selected.length) return;
  const rows = selected.map(item => {
    const row = { Артикул: item.article, Количество: Number(item.requestedQty) || 0, Маркетплейс: item.market || '' };
    if (bucket === 'assembly') {
      row['Короба и остаток'] = (item.locations || []).map(location => {
        const label = location.level ? `${location.box} (${location.level})` : location.box;
        return `${label || 'Коробка не указана'} — ${Number(location.stock) || 0} шт.`;
      }).join(', ');
    }
    return row;
  });
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = bucket === 'assembly'
    ? [{ wch: 20 }, { wch: 14 }, { wch: 16 }, { wch: 48 }]
    : [{ wch: 20 }, { wch: 14 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(workbook, worksheet, bucket === 'assembly' ? 'На сборку' : 'На печать');
  XLSX.writeFile(workbook, `PrintFlow_анализ_${bucket === 'assembly' ? 'сборка' : 'печать'}.xlsx`);
}

function renderAnalysisCard(item) {
  const locations = item.locations?.length
    ? `<div class="stock-analysis-card-locations">${item.locations.map(location => `<span class="stock-analysis-card-location"><b>${escapeHtml(location.box || 'Коробка')}</b>${location.level ? ` · ${escapeHtml(location.level)}` : ''} · ${Number(location.stock) || 0} шт.</span>`).join('')}</div>`
    : '<span class="stock-analysis-card-missing">В таблице остатков не найдено</span>';
  const nextBucket = item.bucket === 'assembly' ? 'print' : 'assembly';
  const nextLabel = nextBucket === 'assembly' ? 'На сборку' : 'На печать';
  return `<div class="stock-analysis-card" draggable="true" data-analysis-drag="${item.analysisId}"><div class="stock-analysis-card-main"><div class="stock-analysis-card-title"><span class="stock-analysis-article">${escapeHtml(item.article)}</span><span class="stock-analysis-market">${escapeHtml(item.market || '—')}</span><span class="stock-analysis-card-qty">нужно ${Number(item.requestedQty) || 0} шт.</span></div>${locations}</div><div class="stock-analysis-card-actions"><button class="stock-analysis-move" data-analysis-move="${item.analysisId}" data-analysis-target="${nextBucket}" type="button">${nextLabel}</button><button class="stock-remove stock-analysis-delete" data-remove-analysis="${item.analysisId}" type="button">Удалить</button></div></div>`;
}

function renderAnalysisBucket(bucket, title, subtitle) {
  const items = state.analysis.filter(item => item.bucket === bucket);
  const total = items.reduce((sum, item) => sum + (Number(item.requestedQty) || 0), 0);
  return `<section class="stock-analysis-bucket ${bucket}" data-analysis-bucket="${bucket}"><div class="stock-analysis-bucket-head"><div><div class="stock-analysis-bucket-title"><span class="dot"></span>${title}</div><div class="stock-analysis-bucket-subtitle">${subtitle}</div></div><span class="stock-analysis-bucket-count" title="Количество позиций">${items.length} · ${total} шт.</span><button class="stock-export stock-analysis-bucket-export" data-export-analysis="${bucket}" type="button" ${items.length ? '' : 'disabled'}>Скачать Excel</button></div><div class="stock-analysis-bucket-list">${items.length ? items.map(renderAnalysisCard).join('') : `<div class="stock-analysis-bucket-empty">Перетащите сюда позицию<br>или измените решение кнопкой</div>`}</div><div class="stock-analysis-drag-hint">Перетащите карточку в соседнюю панель, если нужно изменить решение</div></section>`;
}

function renderAnalysis() {
  const requestedTotal = state.analysis.reduce((sum, item) => sum + Number(item.requestedQty || 0), 0);
  const assemblyCount = state.analysis.filter(item => item.bucket === 'assembly').length;
  const printCount = state.analysis.filter(item => item.bucket === 'print').length;
  const status = state.analysisStatus ? `<span class="stock-analyzer-status ${state.analysisStatusKind}">${escapeHtml(state.analysisStatus)}</span>` : '<span class="stock-analyzer-status">Файл ещё не загружен</span>';
  return `<section class="stock-analyzer"><div class="stock-analyzer-head"><div><div class="stock-analyzer-title">Анализ остатков из Excel</div><div class="stock-analyzer-subtitle">Загрузите список артикулов — система объединит повторы и сразу разделит позиции по наличию.</div></div>${status}</div><div class="stock-analyzer-upload"><label class="stock-analyzer-button">Выбрать Excel-файл<input id="stock-analysis-input" type="file" accept=".xlsx,.xls"></label><span class="stock-upload-hint">Колонки: Артикул, Количество, Маркетплейс</span></div>${state.analysis.length ? `<div class="stock-analysis-summary"><strong>${state.analysis.length}</strong> позиций · нужно всего <strong>${requestedTotal}</strong> шт. · на сборку <strong>${assemblyCount}</strong> · на печать <strong>${printCount}</strong></div><div class="stock-analysis-buckets">${renderAnalysisBucket('assembly', 'На сборку', 'Артикул найден в таблице остатков')}${renderAnalysisBucket('print', 'На печать', 'Артикул отсутствует в таблице остатков')}</div>` : ''}</section>`;
}

function render() {
  const panel = document.querySelector('.stock-panel');
  if (!panel) return;
  const files = state.items.map(item => `<div class="stock-file"><div class="stock-file-main"><span class="stock-pdf-icon">PDF</span><span class="stock-file-name" title="${escapeHtml(item.file.name)}">${escapeHtml(item.file.name)}</span></div><label class="stock-field"><span>Страница</span><input data-id="${item.id}" data-field="page" type="number" min="1" value="${item.page}" aria-label="Страница"></label><label class="stock-field"><span>Строка</span><input data-id="${item.id}" data-field="row" type="number" min="1" value="${item.row}" aria-label="Строка"></label><button data-check="${item.id}" type="button">Проверить</button><button class="stock-remove" data-remove="${item.id}" type="button">Удалить</button><span class="stock-file-status ${item.ok ? 'ok' : item.status && item.status !== 'Готово' ? 'error' : ''}">${escapeHtml(item.status || 'Укажите страницу и строку')}</span></div>`).join('');
  panel.innerHTML = `<div class="panel-head"><div><h2>Проверка остатков</h2><p>Найдите артикулы из PDF в актуальной таблице склада</p></div><div class="step">03</div></div><p class="stock-intro">Загрузите список из Excel или проверьте отдельные строки PDF. Найденные позиции попадут в сборку, отсутствующие — в печать.</p>${renderAnalysis()}<div class="stock-upload"><label class="stock-upload-button">Выбрать PDF-файлы<input id="stock-pdf-input" type="file" accept="application/pdf,.pdf" multiple></label><span class="stock-upload-hint">Можно выбрать несколько файлов</span></div><div class="stock-files">${files}</div><div class="stock-buckets">${renderBucket('assembly', 'На сборку', 'Артикул найден в таблице остатков')}${renderBucket('print', 'На печать', 'Артикул отсутствует в таблице остатков')}</div>`;
  bindPanelEvents();
}

async function analyzeStockFile(file) {
  state.analysis = [];
  state.analysisFileName = file.name;
  state.analysisStatus = `Читаю ${file.name}…`;
  state.analysisStatusKind = '';
  render();
  try {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    const rows = raw.map(row => ({
      article: String(sheetValue(row, ['артикул', 'article'])).trim().toUpperCase(),
      qty: Number(sheetValue(row, ['количество', 'qty', 'quantity'])),
      market: String(sheetValue(row, ['маркетплейс', 'market'])).trim().toUpperCase()
    })).filter(row => row.article && Number.isFinite(row.qty) && row.qty > 0);
    if (!rows.length) throw new Error('Не найдены строки с колонками «Артикул» и «Количество»');
    const response = await fetch(`${STOCK_API}/api/stock-analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Не удалось проанализировать остатки');
    state.analysis = data.map(item => ({ ...item, analysisId: makeId(), bucket: item.found ? 'assembly' : 'print' }));
    state.analysisStatus = `Готово · ${data.length} позиций из Excel`;
    state.analysisStatusKind = 'ok';
  } catch (error) {
    state.analysisStatus = error.message || 'Не удалось прочитать Excel';
    state.analysisStatusKind = 'error';
  }
  render();
}

function bindPanelEvents() {
  const analysisInput = document.querySelector('#stock-analysis-input');
  if (analysisInput) analysisInput.onchange = () => { const file = analysisInput.files?.[0]; if (!file) return; analysisInput.value = ''; analyzeStockFile(file); };
  const input = document.querySelector('#stock-pdf-input');
  if (input) input.onchange = () => { const files = [...input.files]; if (!files.length) return; state.items.push(...files.map(file => ({ id: makeId(), file, page: 1, row: 1, status: 'Готово' }))); input.value = ''; render(); };
  document.querySelectorAll('[data-check]').forEach(button => { button.onclick = () => checkItem(button.dataset.check); });
  document.querySelectorAll('[data-remove]').forEach(button => { button.onclick = () => removeItem(button.dataset.remove); });
  document.querySelectorAll('[data-remove-result]').forEach(button => { button.onclick = () => removeResult(button.dataset.removeResult); });
  document.querySelectorAll('[data-remove-analysis]').forEach(button => { button.onclick = () => removeAnalysis(button.dataset.removeAnalysis); });
  document.querySelectorAll('[data-field]').forEach(field => { field.onchange = () => { const item = state.items.find(candidate => candidate.id === field.dataset.id); if (item) item[field.dataset.field] = field.value; }; });
  document.querySelectorAll('[data-export]').forEach(button => { button.onclick = () => exportResults(button.dataset.export); });
  document.querySelectorAll('[data-export-analysis]').forEach(button => { button.onclick = () => exportAnalysis(button.dataset.exportAnalysis); });
  document.querySelectorAll('[data-drag]').forEach(card => {
    card.ondragstart = event => { state.dragId = card.dataset.drag; card.classList.add('is-dragging'); event.dataTransfer?.setData('text/plain', state.dragId); };
    card.ondragend = () => { state.dragId = null; card.classList.remove('is-dragging'); document.querySelectorAll('[data-bucket]').forEach(bucket => bucket.classList.remove('is-drag-over')); };
  });
  document.querySelectorAll('[data-bucket]').forEach(bucket => {
    bucket.ondragover = event => { event.preventDefault(); bucket.classList.add('is-drag-over'); };
    bucket.ondragleave = () => bucket.classList.remove('is-drag-over');
    bucket.ondrop = event => { event.preventDefault(); const resultId = state.dragId || event.dataTransfer?.getData('text/plain'); const result = state.results.find(item => item.resultId === resultId); if (result) { result.bucket = bucket.dataset.bucket; render(); } };
  });
  document.querySelectorAll('[data-analysis-drag]').forEach(card => {
    card.ondragstart = event => { state.analysisDragId = card.dataset.analysisDrag; card.classList.add('is-dragging'); event.dataTransfer?.setData('text/plain', state.analysisDragId); };
    card.ondragend = () => { state.analysisDragId = null; card.classList.remove('is-dragging'); document.querySelectorAll('[data-analysis-bucket]').forEach(bucket => bucket.classList.remove('is-drag-over')); };
  });
  document.querySelectorAll('[data-analysis-move]').forEach(button => {
    button.onclick = () => { const item = state.analysis.find(candidate => candidate.analysisId === button.dataset.analysisMove); if (item) { item.bucket = button.dataset.analysisTarget; render(); } };
  });
  document.querySelectorAll('[data-analysis-bucket]').forEach(bucket => {
    bucket.ondragover = event => { event.preventDefault(); bucket.classList.add('is-drag-over'); };
    bucket.ondragleave = () => bucket.classList.remove('is-drag-over');
    bucket.ondrop = event => { event.preventDefault(); const analysisId = state.analysisDragId || event.dataTransfer?.getData('text/plain'); const item = state.analysis.find(candidate => candidate.analysisId === analysisId); if (item) { item.bucket = bucket.dataset.analysisBucket; render(); } };
  });
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

}

new MutationObserver(setup).observe(document.body, { childList: true, subtree: true });
setTimeout(setup, 400);
