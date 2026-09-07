import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createNavIcon } from './nav-icons.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString();

const STOCK_API = window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:4174'
  : `${window.location.protocol}//${window.location.hostname}:4174`;

const style = document.createElement('style');
style.textContent = `
.pdf-batch-panel{display:none}.pdf-batch-panel.is-visible{display:block}
.pdf-batch-panel .panel-head{margin-bottom:18px}.pdf-batch-intro{max-width:800px;color:#758097;font:13px/1.6 'DM Sans',sans-serif;margin:-8px 0 22px}
.pdf-batch-upload{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:16px;border:1px dashed #d8e0eb;border-radius:12px;background:#fbfcfe}
.pdf-batch-upload input{display:none}.pdf-batch-upload-button{display:inline-flex;align-items:center;min-height:36px;border:1px solid #dfe6f0;border-radius:9px;background:#fff;color:#53617a;padding:0 13px;font:700 11px 'DM Sans',sans-serif;cursor:pointer;transition:.15s}
.pdf-batch-upload-button:hover{border-color:#edb39f;color:#d85f3e;background:#fff8f5}.pdf-batch-hint{color:#8994a8;font:11px 'DM Sans',sans-serif}
.pdf-batch-files{display:grid;gap:10px;margin-top:14px}.pdf-batch-file{border:1px solid #e2e8f0;border-radius:12px;padding:14px;background:#fff;box-shadow:0 2px 8px rgba(28,42,68,.025)}
.pdf-batch-file-head{display:flex;align-items:center;gap:10px}.pdf-batch-file-main{display:flex;align-items:center;gap:9px;min-width:0;flex:1}.pdf-batch-file-icon{display:grid;place-items:center;flex:0 0 32px;height:34px;border-radius:8px;background:#fff0eb;color:#e76443;font:800 9px 'DM Sans',sans-serif}.pdf-batch-file-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#253149;font:700 12px 'DM Sans',sans-serif}.pdf-batch-file-tools{display:flex;align-items:flex-end;gap:9px;flex-wrap:wrap;margin-top:13px}
.pdf-batch-field{display:grid;gap:5px;color:#8994a8;font:10px 'DM Sans',sans-serif}.pdf-batch-field select,.pdf-batch-field input{height:34px;border:1px solid #dfe6f0;border-radius:8px;background:#fff;color:#33415a;padding:0 9px;font:600 11px 'DM Sans',sans-serif;outline:0}.pdf-batch-field select:focus,.pdf-batch-field input:focus{border-color:#a99cf1;box-shadow:0 0 0 3px rgba(121,105,226,.12)}.pdf-batch-field input{width:90px}
.pdf-batch-file-tools button,.pdf-batch-result-actions button,.pdf-batch-export{height:34px;border:1px solid #dfe6f0;border-radius:8px;background:#fff;color:#53617a;padding:0 11px;font:700 11px 'DM Sans',sans-serif;cursor:pointer;transition:.15s}.pdf-batch-file-tools button:hover,.pdf-batch-result-actions button:hover{border-color:#c8d2e0;background:#f8fafc;color:#33415a}.pdf-batch-file-remove{color:#cf684f!important;border-color:#f0c8bd!important;background:#fffaf8!important}.pdf-batch-file-remove:hover{background:#fff2ee!important;border-color:#e9a997!important}
.pdf-batch-file-status{margin-top:11px;color:#8994a8;font:11px 'DM Sans',sans-serif}.pdf-batch-file-status.ok{color:#319c6b}.pdf-batch-file-status.error{color:#c7644c}.pdf-batch-file-preview{margin-top:10px;padding-top:10px;border-top:1px solid #eef1f5;color:#8994a8;font:11px/1.5 'DM Sans',sans-serif}.pdf-batch-file-preview strong{color:#253149}.pdf-batch-page-cards{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.pdf-batch-page-card{padding:5px 7px;border:1px solid #e2e8ef;border-radius:7px;background:#fafbfc;color:#53617a;font:10px 'DM Sans',sans-serif}.pdf-batch-page-card b{color:#253149}
.pdf-batch-results{margin-top:24px}.pdf-batch-summary{display:flex;align-items:center;gap:8px;flex-wrap:wrap;color:#53617a;font:11px 'DM Sans',sans-serif;margin-bottom:14px}.pdf-batch-summary strong{color:#152034;font:700 14px 'Space Grotesk',sans-serif}
.pdf-batch-buckets{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.pdf-batch-bucket{min-width:0;min-height:260px;border:1px solid #e4e9f0;border-radius:13px;padding:14px;background:#fbfcfe;transition:border-color .15s,background .15s}.pdf-batch-bucket.assembly{border-top:3px solid #55bf88}.pdf-batch-bucket.print{border-top:3px solid #ed6a46}.pdf-batch-bucket.is-drag-over{border-color:#9d91f5;background:#f8f7ff}
.pdf-batch-bucket-head{display:flex;align-items:flex-start;gap:9px;margin-bottom:10px}.pdf-batch-bucket-head>div:first-child{flex:1}.pdf-batch-bucket-title{display:flex;align-items:center;gap:7px;color:#152034;font:700 15px 'Space Grotesk',sans-serif}.pdf-batch-bucket-title .dot{width:8px;height:8px;border-radius:50%;background:#55bf88}.pdf-batch-bucket.print .dot{background:#ed6a46}.pdf-batch-bucket-subtitle{margin-top:4px;color:#8994a8;font:11px 'DM Sans',sans-serif}.pdf-batch-bucket-count{display:inline-flex;align-items:center;justify-content:center;min-width:28px;height:25px;padding:0 8px;border-radius:7px;background:#eef8f2;color:#319c6b;font:700 11px 'DM Sans',sans-serif;white-space:nowrap}.pdf-batch-bucket.print .pdf-batch-bucket-count{background:#fff1eb;color:#d85f3e}.pdf-batch-export{height:30px;padding:0 10px;background:#ed6a46;border-color:#ed6a46;color:#fff}.pdf-batch-export:hover{background:#d95c3b;border-color:#d95c3b;color:#fff}.pdf-batch-export:disabled{opacity:.45;cursor:not-allowed}
.pdf-batch-list{display:grid;gap:8px}.pdf-batch-empty{display:grid;place-items:center;min-height:150px;border:1px dashed #dfe5ee;border-radius:9px;color:#a0a9b8;text-align:center;font:11px/1.5 'DM Sans',sans-serif}.pdf-batch-card{display:grid;grid-template-columns:64px minmax(0,1fr) auto;gap:10px;align-items:start;padding:11px;border:1px solid #e5e9f0;border-radius:10px;background:#fff;cursor:grab;box-shadow:0 2px 8px rgba(28,42,68,.025);transition:.15s}.pdf-batch-card:hover{border-color:#cfd9e7;box-shadow:0 5px 14px rgba(28,42,68,.06)}.pdf-batch-card.is-dragging{opacity:.45}.pdf-batch-card-photo{width:64px;height:64px;object-fit:cover;border:1px solid #e3e8ef;border-radius:8px;background:#f7f8fa}.pdf-batch-card-photo-empty{display:grid;place-items:center;color:#a0a9b8;font:700 9px 'DM Sans',sans-serif}.pdf-batch-card-main{min-width:0;color:#53617a;font:11px/1.45 'DM Sans',sans-serif}.pdf-batch-card-title{display:flex;align-items:center;gap:8px;flex-wrap:wrap;color:#22304a;font-weight:700}.pdf-batch-card-market{padding:4px 7px;border-radius:6px;background:#edf8f2;color:#319c6b;font:700 10px 'DM Sans',sans-serif}.pdf-batch-card-qty{color:#53617a;font-weight:500}.pdf-batch-card-source{display:block;margin-top:4px;color:#8994a8;font-size:10px}.pdf-batch-card-note{display:block;width:100%;min-height:34px;margin-top:8px;padding:7px 8px;border:1px solid #e2e8ef;border-radius:7px;background:#fbfcfe;color:#53617a;font:11px/1.35 'DM Sans',sans-serif;resize:vertical}.pdf-batch-card-note::placeholder{color:#a0a9b8}.pdf-batch-card-note:focus{outline:0;border-color:#ed6a46;box-shadow:0 0 0 3px #ed6a4618;background:#fff}.pdf-batch-card-locations{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.pdf-batch-location{display:inline-flex;align-items:center;gap:4px;padding:5px 7px;border:1px solid #e2e8ef;border-radius:7px;background:#fafbfc;color:#53617a}.pdf-batch-location b{color:#22304a}.pdf-batch-missing{display:block;margin-top:8px;color:#c7644c}.pdf-batch-result-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end}.pdf-batch-result-actions button{min-height:32px;height:32px;padding:0 10px}.pdf-batch-move{color:#6c5bce!important;border-color:#dcd7ff!important;background:#faf9ff!important}.pdf-batch-delete{color:#cf684f!important;border-color:#f0c8bd!important;background:#fffaf8!important}.pdf-batch-drag-hint{margin:11px 0 0;color:#a0a9b8;text-align:center;font:10px 'DM Sans',sans-serif}
@media(max-width:800px){.pdf-batch-buckets{grid-template-columns:1fr}.pdf-batch-card{grid-template-columns:56px minmax(0,1fr) auto}.pdf-batch-card-photo{width:56px;height:56px}}@media(max-width:560px){.pdf-batch-file-head{align-items:flex-start}.pdf-batch-file-tools{display:grid;grid-template-columns:1fr 1fr}.pdf-batch-file-tools button{width:100%}.pdf-batch-card{grid-template-columns:56px minmax(0,1fr)}.pdf-batch-result-actions{grid-column:2;justify-content:flex-start}}
`;
document.head.append(style);

const state = { items: [], results: [], dragId: null };
const makeId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const inferMarket = name => /озон|ozon/i.test(name) ? 'OZON' : 'WB';
const shortPdfFileName = value => {
  const baseName = String(value || 'PDF').split(/[\\/]/).pop();
  const datedName = baseName.match(/(\d{2}-\d{2}-\d{4}_\d{2}-\d{2}(?:-\d{2})?\.pdf)$/i);
  if (datedName) return datedName[1];
  return baseName.replace(/^Удал[её]нные_артикулы_БОКС[_ -]*/i, '');
};
const formatPdfSource = result => {
  const fileName = shortPdfFileName(result.source);
  const page = Number(result.page) || 0;
  const totalPages = Number(result.pages) || 0;
  return `${fileName} · стр. ${page}${totalPages ? ` из ${totalPages}` : ''} · строка ${Number(result.row) || 0}`;
};

function normalizePdfArticle(text) {
  return String(text || '').trim().match(/^([A-ZА-Я]{2,6}\d{3,5}\.A\d+)/i)?.[1]?.toUpperCase() || '';
}

function articleFromText(text) {
  return Boolean(normalizePdfArticle(text));
}

function parsePdfCards(textContent) {
  const items = textContent.items.map(item => ({
    text: String(item.str || '').trim(),
    x: Number(item.transform?.[4] || 0),
    y: Number(item.transform?.[5] || 0),
  })).filter(item => item.text);
  const articleItems = items.filter(item => articleFromText(item.text)).sort((a, b) => b.y - a.y);
  return articleItems.map((articleItem, index) => {
    const next = articleItems[index + 1];
    const top = articleItem.y + 16;
    // In these label PDFs the quantity line of one card may share the same Y
    // coordinate as the next card's article (different table columns). Leave
    // a small overlap below the next article so the current quantity is kept.
    const bottom = next ? next.y - 6 : 30;
    const region = items.filter(item => item.y <= top && item.y >= bottom).sort((a, b) => b.y - a.y || a.x - b.x);
    const text = region.map(item => item.text).join(' ').replace(/\s+/g, ' ').trim();
    return { article: normalizePdfArticle(articleItem.text), qty: 1, inferredQty: true, y: articleItem.y, text };
  }).filter(item => item.article);
}

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
    .map(line => ({ y: line.y, text: line.parts.sort((a, b) => a.x - b.x).map(part => part.text).join(' ').replace(/\s+/g, ' ').trim() }))
    .filter(line => line.text);
}

async function getPdf(item) {
  if (!item.pdf) {
    item.pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await item.file.arrayBuffer()) }).promise;
  }
  return item.pdf;
}

async function extractPdfRow(item, pageNumber, rowNumber) {
  const pdf = await getPdf(item);
  if (pageNumber < 1 || pageNumber > pdf.numPages) throw new Error(`В файле ${item.file.name} только ${pdf.numPages} страниц`);
  const page = await pdf.getPage(pageNumber);
  const textContent = await page.getTextContent();
  const items = textContent.items.map(textItem => ({
    text: String(textItem.str || '').trim(),
    x: Number(textItem.transform?.[4] || 0),
    y: Number(textItem.transform?.[5] || 0),
  })).filter(textItem => textItem.text);
  const articleItems = items.filter(textItem => articleFromText(textItem.text)).sort((a, b) => b.y - a.y);
  const articleItem = articleItems[Number(rowNumber) - 1];
  if (!articleItem) throw new Error(`Строка ${rowNumber} на странице ${pageNumber} не найдена`);
  const photo = await renderPdfPhoto(page, articleItem.y);
  return { article: normalizePdfArticle(articleItem.text), qty: 1, market: item.market, box: '', photo };
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

async function checkItem(itemId) {
  const item = state.items.find(candidate => candidate.id === itemId);
  if (!item) return;
  item.status = 'Проверяю страницу и строку…';
  item.statusKind = '';
  render();
  try {
    const pdf = await getPdf(item);
    item.pages = pdf.numPages;
    const pageNumber = Math.max(1, Number(item.page) || 1);
    if (pageNumber > pdf.numPages) throw new Error(`В файле ${item.file.name} только ${pdf.numPages} страниц`);
    item.pages = pdf.numPages;
    const rowNumber = Math.max(1, Number(item.row) || 1);
    const parsed = await extractPdfRow(item, pageNumber, rowNumber);
    item.card = parsed;
    item.status = `Найдено: ${parsed.article}. Проверяю остатки…`;
    render();
    const response = await fetch(`${STOCK_API}/api/stock-search?article=${encodeURIComponent(parsed.article)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Не удалось проверить остатки');
    state.results.unshift({ ...parsed, resultId: makeId(), itemId: item.id, source: item.file.name, page: pageNumber, pages: item.pages, row: rowNumber, matches: data, comment: '', bucket: data.length ? 'assembly' : 'print' });
    item.status = `Готово · добавлена строка ${rowNumber} со страницы ${pageNumber}`;
    item.statusKind = 'ok';
  } catch (error) {
    item.status = error.message || 'Не удалось прочитать страницу';
    item.statusKind = 'error';
  }
  render();
}

function removeFile(id) {
  state.items = state.items.filter(item => item.id !== id);
  state.results = state.results.filter(result => result.itemId !== id);
  render();
}

function removeResult(id) {
  state.results = state.results.filter(result => result.resultId !== id);
  render();
}

async function exportPdfResults(bucket) {
  const selected = state.results.filter(result => result.bucket === bucket);
  if (!selected.length) return;
  const grouped = new Map();
  for (const result of selected) {
    const key = `${result.article}|${result.market}`;
    const previous = grouped.get(key) || { Артикул: result.article, Количество: 0, Маркетплейс: result.market };
    previous.Количество += Number(result.qty) || 0;
    if (bucket === 'assembly') {
      previous['Короба и остаток'] ||= new Set();
      previous['Страница и строка PDF'] ||= new Map();
      const sourceKey = `${result.source}|${result.page}|${result.row}`;
      previous['Страница и строка PDF'].set(sourceKey, formatPdfSource(result));
      for (const match of result.matches || []) {
        const label = match.level ? `${match.box} (${match.level})` : match.box;
        if (label) previous['Короба и остаток'].add(`${label} — ${Number(match.stock) || 0} шт.`);
      }
    }
    previous['Комментарий'] ||= new Set();
    if (String(result.comment || '').trim()) previous['Комментарий'].add(String(result.comment).trim());
    grouped.set(key, previous);
  }
  const rows = [...grouped.values()].map(row => ({ ...row, ...(bucket === 'assembly' ? {
    'Короба и остаток': [...row['Короба и остаток']].join('\n'),
    'Страница и строка PDF': [...row['Страница и строка PDF'].values()].join('\n')
  } : {}), 'Комментарий': [...row['Комментарий']].join('\n') }));
  const StyledXLSX = await import('xlsx-js-style');
  const workbook = StyledXLSX.utils.book_new();
  const worksheet = StyledXLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = bucket === 'assembly' ? [{ wch: 20 }, { wch: 14 }, { wch: 16 }, { wch: 48 }, { wch: 34 }, { wch: 42 }] : [{ wch: 20 }, { wch: 14 }, { wch: 16 }, { wch: 42 }];
  if (bucket === 'assembly') {
    worksheet['!rows'] = [{ hpt: 24 }, ...rows.map(row => ({ hpt: Math.max(22, Math.max(String(row['Короба и остаток'] || '').split('\n').length, String(row['Страница и строка PDF'] || '').split('\n').length, String(row['Комментарий'] || '').split('\n').length) * 18) }))];
    for (let index = 2; index <= rows.length + 1; index += 1) {
      if (worksheet[`D${index}`]) worksheet[`D${index}`].s = { alignment: { wrapText: true, vertical: 'top' } };
      if (worksheet[`E${index}`]) worksheet[`E${index}`].s = { alignment: { wrapText: true, vertical: 'top' } };
      if (worksheet[`F${index}`]) worksheet[`F${index}`].s = { font: { bold: true }, alignment: { wrapText: true, vertical: 'top' } };
    }
  } else {
    worksheet['!rows'] = [{ hpt: 24 }, ...rows.map(row => ({ hpt: Math.max(22, String(row['Комментарий'] || '').split('\n').length * 18) }))];
    for (let index = 2; index <= rows.length + 1; index += 1) {
      if (worksheet[`D${index}`]) worksheet[`D${index}`].s = { font: { bold: true }, alignment: { wrapText: true, vertical: 'top' } };
    }
  }
  StyledXLSX.utils.book_append_sheet(workbook, worksheet, bucket === 'assembly' ? 'На сборку' : 'На печать');
  StyledXLSX.writeFile(workbook, `PrintFlow_PDF_${bucket === 'assembly' ? 'сборка' : 'печать'}.xlsx`);
}

function renderFile(item) {
  const preview = item.card
    ? `<div class="pdf-batch-file-preview"><strong>Страница ${item.page}${item.pages ? ` из ${item.pages}` : ''}, строка ${item.row}:</strong> <span class="pdf-batch-page-card">${escapeHtml(item.card.article)} · ${item.card.qty} шт. · ${escapeHtml(item.market)}</span></div>`
    : '';
  return `<div class="pdf-batch-file"><div class="pdf-batch-file-head"><div class="pdf-batch-file-main"><span class="pdf-batch-file-icon">PDF</span><span class="pdf-batch-file-name" title="${escapeHtml(item.file.name)}">${escapeHtml(item.file.name)}</span></div><button class="pdf-batch-file-remove" data-pdf-remove="${item.id}" type="button">Удалить файл</button></div><div class="pdf-batch-file-tools"><label class="pdf-batch-field"><span>Маркетплейс</span><select data-pdf-field="market" data-pdf-id="${item.id}"><option ${item.market === 'WB' ? 'selected' : ''}>WB</option><option ${item.market === 'OZON' ? 'selected' : ''}>OZON</option></select></label><label class="pdf-batch-field"><span>Номер страницы</span><input data-pdf-field="page" data-pdf-id="${item.id}" type="number" min="1" ${item.pages ? `max="${item.pages}"` : ''} value="${item.page}" /></label><label class="pdf-batch-field"><span>Номер строки</span><input data-pdf-field="row" data-pdf-id="${item.id}" type="number" min="1" value="${item.row}" /></label><button data-pdf-check="${item.id}" type="button">Проверить</button></div><div class="pdf-batch-file-status ${item.statusKind || ''}">${escapeHtml(item.status || 'Укажите страницу и строку')}</div>${preview}</div>`;
}

function renderCard(result) {
  const locations = result.matches?.length
    ? `<div class="pdf-batch-card-locations">${result.matches.map(match => `<span class="pdf-batch-location"><b>${escapeHtml(match.box || 'Коробка')}</b>${match.level ? ` · ${escapeHtml(match.level)}` : ''} · ${Number(match.stock) || 0} шт.</span>`).join('')}</div>`
    : '<span class="pdf-batch-missing">В таблице остатков не найдено</span>';
  const target = result.bucket === 'assembly' ? 'print' : 'assembly';
  const label = target === 'assembly' ? 'На сборку' : 'На печать';
  const photo = result.photo
    ? `<img class="pdf-batch-card-photo" src="${result.photo}" alt="Фото ${escapeHtml(result.article)}">`
    : '<div class="pdf-batch-card-photo pdf-batch-card-photo-empty" aria-hidden="true">нет фото</div>';
  return `<div class="pdf-batch-card" draggable="true" data-pdf-drag="${result.resultId}">${photo}<div class="pdf-batch-card-main"><div class="pdf-batch-card-title"><span>${escapeHtml(result.article)}</span><span class="pdf-batch-card-market">${escapeHtml(result.market)}</span><span class="pdf-batch-card-qty">нужно 1 шт.</span></div><span class="pdf-batch-card-source">${escapeHtml(formatPdfSource(result))}</span><textarea class="pdf-batch-card-note" data-pdf-comment="${result.resultId}" aria-label="Комментарий или заметка" placeholder="Комментарий или заметка" rows="2">${escapeHtml(result.comment || '')}</textarea>${locations}</div><div class="pdf-batch-result-actions"><button class="pdf-batch-move" data-pdf-move="${result.resultId}" data-pdf-target="${target}" type="button">${label}</button><button class="pdf-batch-delete" data-pdf-result-remove="${result.resultId}" type="button">Удалить</button></div></div>`;
}

function renderBucket(bucket, title, subtitle) {
  const results = state.results.filter(result => result.bucket === bucket);
  const total = results.reduce((sum, result) => sum + (Number(result.qty) || 0), 0);
  return `<section class="pdf-batch-bucket ${bucket}" data-pdf-bucket="${bucket}"><div class="pdf-batch-bucket-head"><div><div class="pdf-batch-bucket-title"><span class="dot"></span>${title}</div><div class="pdf-batch-bucket-subtitle">${subtitle}</div></div><span class="pdf-batch-bucket-count">${results.length} · ${total} шт.</span><button class="pdf-batch-export" data-pdf-export="${bucket}" type="button" ${results.length ? '' : 'disabled'}>Скачать Excel</button></div><div class="pdf-batch-list">${results.length ? results.map(renderCard).join('') : '<div class="pdf-batch-empty">Проверьте страницу PDF<br>или перетащите позицию сюда</div>'}</div><div class="pdf-batch-drag-hint">Перетащите карточку в соседнюю панель, если нужно изменить решение</div></section>`;
}

function render() {
  const panel = document.querySelector('.pdf-batch-panel');
  if (!panel) return;
  const total = state.results.reduce((sum, result) => sum + (Number(result.qty) || 0), 0);
  const assembly = state.results.filter(result => result.bucket === 'assembly').length;
  const print = state.results.filter(result => result.bucket === 'print').length;
  panel.innerHTML = `<div class="panel-head"><div><h2>Разбор PDF WB / OZON</h2><p>Загрузите PDF и проверьте выбранную строку по остаткам</p></div><div class="step">04</div></div><p class="pdf-batch-intro">Выберите PDF-файл, укажите маркетплейс, страницу и строку. Система проверит только эту позицию и добавит результат ниже. Можно загрузить несколько файлов и постепенно дополнять список.</p><div class="pdf-batch-upload"><label class="pdf-batch-upload-button">Выбрать PDF-файлы<input id="pdf-batch-input" type="file" accept="application/pdf,.pdf" multiple /></label><span class="pdf-batch-hint">Для каждой позиции маркетплейс выбирается отдельно</span></div><div class="pdf-batch-files">${state.items.length ? state.items.map(renderFile).join('') : ''}</div><section class="pdf-batch-results">${state.results.length ? `<div class="pdf-batch-summary"><strong>${state.results.length}</strong> позиций · нужно всего <strong>${total}</strong> шт. · на сборку <strong>${assembly}</strong> · на печать <strong>${print}</strong></div>` : ''}<div class="pdf-batch-buckets">${renderBucket('assembly', 'На сборку', 'Артикул найден в таблице остатков')}${renderBucket('print', 'На печать', 'Артикул отсутствует в таблице остатков')}</div></section>`;
  bindEvents();
}

function bindEvents() {
  const input = document.querySelector('#pdf-batch-input');
  if (input) input.onchange = () => { const files = [...input.files]; if (!files.length) return; state.items.unshift(...files.map(file => ({ id: makeId(), file, market: 'WB', page: 1, row: 1, status: 'Файл готов к проверке', statusKind: '' }))); input.value = ''; render(); };
  document.querySelectorAll('[data-pdf-remove]').forEach(button => { button.onclick = () => removeFile(button.dataset.pdfRemove); });
  document.querySelectorAll('[data-pdf-check]').forEach(button => { button.onclick = () => checkItem(button.dataset.pdfCheck); });
  document.querySelectorAll('[data-pdf-field]').forEach(field => { const update = () => { const item = state.items.find(candidate => candidate.id === field.dataset.pdfId); if (item) item[field.dataset.pdfField] = field.dataset.pdfField === 'page' ? Math.max(1, Number(field.value) || 1) : field.value; }; field.oninput = update; field.onchange = update; });
  document.querySelectorAll('[data-pdf-result-remove]').forEach(button => { button.onclick = () => removeResult(button.dataset.pdfResultRemove); });
  document.querySelectorAll('[data-pdf-comment]').forEach(field => { field.oninput = () => { const result = state.results.find(candidate => candidate.resultId === field.dataset.pdfComment); if (result) result.comment = field.value; }; });
  document.querySelectorAll('[data-pdf-move]').forEach(button => { button.onclick = () => { const result = state.results.find(candidate => candidate.resultId === button.dataset.pdfMove); if (result) { result.bucket = button.dataset.pdfTarget; render(); } }; });
  document.querySelectorAll('[data-pdf-export]').forEach(button => { button.onclick = () => exportPdfResults(button.dataset.pdfExport); });
  document.querySelectorAll('[data-pdf-drag]').forEach(card => {
    card.ondragstart = event => { state.dragId = card.dataset.pdfDrag; card.classList.add('is-dragging'); event.dataTransfer?.setData('text/plain', state.dragId); };
    card.ondragend = () => { state.dragId = null; card.classList.remove('is-dragging'); document.querySelectorAll('[data-pdf-bucket]').forEach(bucket => bucket.classList.remove('is-drag-over')); };
  });
  document.querySelectorAll('[data-pdf-bucket]').forEach(bucket => {
    bucket.ondragover = event => { event.preventDefault(); bucket.classList.add('is-drag-over'); };
    bucket.ondragleave = () => bucket.classList.remove('is-drag-over');
    bucket.ondrop = event => { event.preventDefault(); const id = state.dragId || event.dataTransfer?.getData('text/plain'); const result = state.results.find(candidate => candidate.resultId === id); if (result) { result.bucket = bucket.dataset.pdfBucket; render(); } };
  });
}

function setup() {
  const main = document.querySelector('main');
  const nav = document.querySelector('nav');
  if (!main || !nav || document.querySelector('.pdf-batch-nav')) return;
  const link = document.createElement('a');
  link.className = 'pdf-batch-nav';
  link.append(createNavIcon('file'), document.createTextNode('PDF WB / OZON'));
  nav.append(link);
  const panel = document.createElement('section');
  panel.className = 'panel pdf-batch-panel';
  main.append(panel);
  const showPdf = () => {
    window.dispatchEvent(new CustomEvent('printflow:navigation', { detail: { view: 'pdf-batch' } }));
    document.body.classList.remove('pdf-reconcile-open');
    document.querySelector('main')?.classList.remove('pdf-reconcile-active');
    [...main.children].forEach(child => { if (child !== panel) child.style.display = 'none'; });
    document.querySelector('.stock-panel')?.classList.remove('is-visible');
    document.querySelector('.stock-panel')?.style.setProperty('display', 'none');
    document.querySelector('.stock-writeoff-panel')?.classList.remove('is-visible');
    document.querySelector('.stock-writeoff-panel')?.style.setProperty('display', 'none');
    panel.style.removeProperty('display');
    panel.classList.add('is-visible');
    nav.querySelectorAll('a').forEach(item => item.classList.toggle('active', item === link));
    render();
  };
  link.onclick = showPdf;
}

new MutationObserver(setup).observe(document.body, { childList: true, subtree: true });
setTimeout(setup, 500);
