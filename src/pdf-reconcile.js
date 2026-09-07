import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { PDFDocument } from 'pdf-lib';
import { createNavIcon } from './nav-icons.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString();

const STOCK_API = window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:4174'
  : `${window.location.protocol}//${window.location.hostname}:4174`;

const style = document.createElement('style');
style.textContent = `
.pdf-reconcile-panel{display:none}.pdf-reconcile-panel.is-visible{display:block}.pdf-reconcile-active> *:not(.pdf-reconcile-panel){display:none!important}.pdf-reconcile-intro{max-width:850px;color:#758097;font:13px/1.6 'DM Sans',sans-serif;margin:-8px 0 22px}.pdf-reconcile-zones{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.pdf-reconcile-zone{min-height:150px;padding:16px;border:1px dashed #d8e0eb;border-radius:12px;background:#fbfcfe}.pdf-reconcile-zone-title{display:flex;align-items:center;gap:8px;color:#152034;font:700 14px 'Space Grotesk',sans-serif}.pdf-reconcile-zone-title .zone-dot{width:9px;height:9px;border-radius:50%;background:#ed6a46}.pdf-reconcile-zone.search .zone-dot{background:#7b6be8}.pdf-reconcile-zone-subtitle{margin:5px 0 13px;color:#8994a8;font:11px/1.45 'DM Sans',sans-serif}.pdf-reconcile-upload{display:inline-flex;align-items:center;min-height:36px;border:1px solid #dfe6f0;border-radius:9px;background:#fff;color:#53617a;padding:0 13px;font:700 11px 'DM Sans',sans-serif;cursor:pointer;transition:.15s}.pdf-reconcile-upload:hover{border-color:#edb39f;color:#d85f3e;background:#fff8f5}.pdf-reconcile-upload input{display:none}.pdf-reconcile-files{display:grid;gap:8px;margin-top:12px}.pdf-reconcile-file{display:flex;align-items:center;gap:8px;min-width:0;padding:9px 10px;border:1px solid #e2e8f0;border-radius:9px;background:#fff}.pdf-reconcile-file-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;color:#253149;font:600 11px 'DM Sans',sans-serif}.pdf-reconcile-file-pages{color:#8994a8;font:10px 'DM Sans',sans-serif;white-space:nowrap}.pdf-reconcile-file select{height:29px;border:1px solid #dfe6f0;border-radius:7px;color:#53617a;background:#fff;font:600 10px 'DM Sans',sans-serif;padding:0 6px}.pdf-reconcile-file-remove{height:28px;border:1px solid #f0c8bd;border-radius:7px;background:#fffaf8;color:#cf684f;padding:0 8px;font:600 10px 'DM Sans',sans-serif;cursor:pointer}.pdf-reconcile-file-remove:hover{background:#fff2ee;border-color:#e9a997}.pdf-reconcile-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:18px;padding-top:16px;border-top:1px solid #e7ecf2}.pdf-reconcile-build{height:38px;padding:0 16px;border:1px solid #ed6a46;border-radius:9px;background:#ed6a46;color:#fff;font:700 11px 'DM Sans',sans-serif;cursor:pointer;box-shadow:0 5px 12px rgba(237,106,70,.16);transition:.15s}.pdf-reconcile-build:hover{background:#d95c3b;border-color:#d95c3b;transform:translateY(-1px)}.pdf-reconcile-build:disabled{opacity:.45;cursor:not-allowed;transform:none}.pdf-reconcile-status{color:#8994a8;font:11px/1.45 'DM Sans',sans-serif;text-align:right}.pdf-reconcile-status.ok{color:#319c6b}.pdf-reconcile-status.error{color:#c7644c}.pdf-reconcile-progress{height:5px;margin-top:14px;border-radius:5px;background:#edf1f6;overflow:hidden}.pdf-reconcile-progress span{display:block;width:0;height:100%;border-radius:inherit;background:linear-gradient(90deg,#7b6be8,#ed6a46);transition:width .2s}.pdf-reconcile-note{margin-top:14px;padding:10px 12px;border-radius:8px;background:#f5f7fb;color:#8994a8;font:10px/1.5 'DM Sans',sans-serif}@media(max-width:800px){.pdf-reconcile-zones{grid-template-columns:1fr}.pdf-reconcile-actions{align-items:flex-start;flex-direction:column}.pdf-reconcile-status{text-align:left}}
`;
style.textContent += `.pdf-reconcile-active> *:not(.pdf-reconcile-panel){display:none!important}body.pdf-reconcile-open nav a.active:not(.pdf-reconcile-nav){background:transparent!important;color:#afbbd1!important;box-shadow:none!important}body.pdf-reconcile-open nav a.pdf-reconcile-nav.active{background:#22344f!important;color:#fff!important;box-shadow:inset 3px 0 #ed6a46!important}`;
style.textContent += `body.pdf-reconcile-open nav a.active:not(.pdf-reconcile-nav){border-left-color:transparent!important}body.pdf-reconcile-open nav a.active:not(.pdf-reconcile-nav) svg{color:#afbbd1!important;stroke:#afbbd1!important}body.pdf-reconcile-open nav a.active:not(.pdf-reconcile-nav) svg *{stroke:currentColor!important}body.pdf-reconcile-open nav a.pdf-reconcile-nav.active svg{color:#ed6a46!important;stroke:#ed6a46!important}`;
document.head.append(style);

const state = { baseFiles: [], searchFiles: [], status: '', statusKind: '', progress: 0, busy: false };
const makeId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const shortFileName = value => {
  const baseName = String(value || 'PDF').split(/[\\/]/).pop();
  const datedName = baseName.match(/(\d{2}-\d{2}-\d{4}_\d{2}-\d{2}(?:-\d{2})?\.pdf)$/i);
  return datedName ? datedName[1] : baseName.replace(/^Удал[её]нные_артикулы_БОКС[_ -]*/i, '');
};
const parseArticle = value => {
  const match = String(value || '').trim().match(/^([A-ZА-Я]{2,6}\d{3,5}\.A\d+)(?:\s*\(([^)]+)\))?/i);
  if (!match) return null;
  return { article: match[1].toUpperCase(), market: /^OZ(?:ON)?$/i.test(match[2] || '') ? 'OZON' : null };
};
const isMarket = value => /^(WB|OZON)$/i.test(String(value || '').trim());
const reconcileExtraWidth = 420;
const reconcileMaxPageWidth = 841.89;
const reconcilePageHeight = 595.28;
const reconcilePrintMargin = 12;
const reconcileRowsPerPage = 6;
const productMarkerPattern = /(?:^|[\s;])([ПТPT])\s*\.\s*(\d+(?:[.,]\d+)?)\s*[xх×]\s*(\d+(?:[.,]\d+)?)/iu;
const productKindRules = [
  [/наклейк/iu, 'Наклейка'],
  [/табличк/iu, 'Табличка'],
  [/стикербук/iu, 'Стикербук'],
  [/брелок/iu, 'Брелок'],
  [/закладк/iu, 'Закладки'],
  [/заплатк/iu, 'Заплатки'],
  [/значк/iu, 'Значки'],
  [/игруш/iu, 'Игрушки'],
  [/ключниц/iu, 'Ключница'],
  [/магнит/iu, 'Магнит'],
  [/награ/iu, 'Награда'],
  [/фигурк/iu, 'Фигурка'],
  [/плакат/iu, 'Плакаты']
];

function normalizedProductText(value) {
  return String(value || '')
    .replace(/[\u00a0\u202f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function productFormat(value) {
  const text = normalizedProductText(value);
  const match = text.match(productMarkerPattern);
  if (!match) return '';
  const letter = /^П|P$/iu.test(match[1]) ? 'П' : 'Т';
  return `${letter}.${match[2].replace(',', '.')}×${match[3].replace(',', '.')}`;
}

function lastProductKind(value, beforeMarker = false) {
  const text = normalizedProductText(value);
  const marker = text.match(productMarkerPattern);
  const source = beforeMarker && marker ? text.slice(0, marker.index + marker[0].length) : text;
  const candidates = [];
  for (const [pattern, label] of productKindRules) {
    const expression = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
    let match;
    while ((match = expression.exec(source))) candidates.push({ index: match.index, label });
  }
  return candidates.sort((a, b) => b.index - a.index)[0]?.label || '';
}

function productLabels(value) {
  const text = normalizedProductText(value);
  if (!text) return [];
  const format = productFormat(text);
  const tubeMatches = [...text.matchAll(/(?:^|[^\p{L}])туб(?:ус|с)?(?:\s*[-–:]?\s*(\d+(?:[.,]\d+)?)\s*(?:см)?)?(?=$|[^\p{L}])/giu)];
  const tubeLabels = [...new Set(tubeMatches.filter(match => match[1]).map(match => `Тубус ${match[1].replace(',', '.')} см`))];
  if (tubeLabels.length) return tubeLabels;
  if (/(?:^|[^\p{L}])туб(?:ус|с)?(?=$|[^\p{L}])/iu.test(text)) return ['Тубус'];
  const kind = lastProductKind(text, true) || lastProductKind(text);
  if (!kind) return format ? [format] : [];
  return [format ? `${kind} ${format}` : kind];
}

function labelsForMatches(matches) {
  return [...new Set((matches || []).flatMap(match => Array.isArray(match.labels) ? match.labels : []))]
    .sort((first, second) => {
      const a = productSortValue([first]);
      const b = productSortValue([second]);
      return a.rank - b.rank || a.value - b.value || a.text.localeCompare(b.text, 'ru');
    });
}

function productLabelText(labels) {
  return labels.length ? { text: labels.join('\n'), color: '#253149' } : { text: 'Не найдено', color: '#c7644c' };
}

function productSortValue(labels) {
  const values = labels.length ? labels : [''];
  return values.map(label => {
    const text = String(label).toLowerCase();
    const tube = text.match(/тубус\s*(\d+(?:[.,]\d+)?)/i);
    if (tube) return { rank: 0, value: Number(tube[1].replace(',', '.')) || 0, text };
    if (text.startsWith('наклейка')) return { rank: 1, value: 0, text };
    if (text.startsWith('табличка')) return { rank: 2, value: 0, text };
    return { rank: 3, value: 0, text };
  }).sort((a, b) => a.rank - b.rank || a.value - b.value || a.text.localeCompare(b.text, 'ru'))[0];
}

async function openPdf(file) {
  return pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
}

async function pageItems(page) {
  const content = await page.getTextContent();
  return content.items.map(item => ({
    text: String(item.str || '').trim(),
    x: Number(item.transform?.[4] || 0),
    y: Number(item.transform?.[5] || 0)
  })).filter(item => item.text);
}

function lineItems(items, articleItem) {
  return items.filter(item => Math.abs(item.y - articleItem.y) < 3).sort((a, b) => a.x - b.x);
}

function rowText(items, articleItem, nextArticle) {
  const top = articleItem.y + 40;
  const bottom = nextArticle ? nextArticle.y + 20 : 30;
  return items.filter(item => item.y <= top && item.y >= bottom)
    .sort((a, b) => b.y - a.y || a.x - b.x)
    .map(item => item.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function quantityFromRow(items, articleItem, text) {
  const sameLine = lineItems(items, articleItem);
  const marketItem = sameLine.find(item => isMarket(item.text));
  const numeric = sameLine.filter(item => /^\d+(?:[.,]\d+)?$/.test(item.text) && item.x > articleItem.x && (!marketItem || item.x < marketItem.x));
  const direct = numeric.at(-1)?.text;
  const described = [...String(text).matchAll(/кол(?:ичество|\s*-?\s*во)\s*[:\-]?\s*(\d+(?:[.,]\d+)?)/gi)].at(-1)?.[1];
  const value = Number(String(direct || described || '').replace(',', '.'));
  return Number.isInteger(value) && value > 0 ? value : null;
}

function marketFromRow(items, articleItem, fallback) {
  return lineItems(items, articleItem).find(item => isMarket(item.text))?.text.toUpperCase() || fallback;
}

function boxFromRow(items, articleItem, market) {
  const sameLine = lineItems(items, articleItem);
  const marketItem = sameLine.find(item => item.text.toUpperCase() === market);
  if (!marketItem) return '';
  const candidates = items
    .filter(item => item.x > marketItem.x
      && !isMarket(item.text)
      && !/^Другие коробки:?$/iu.test(item.text)
      && Math.abs(item.y - articleItem.y) <= 24)
    .sort((first, second) => Math.abs(first.y - articleItem.y) - Math.abs(second.y - articleItem.y));
  const primary = candidates.find(item => item.y >= articleItem.y - 1);
  return (primary || candidates[0])?.text || '';
}

async function extractRows(page, fallbackMarket) {
  const items = await pageItems(page);
  const articleItems = items.filter(item => parseArticle(item.text)).sort((a, b) => b.y - a.y);
  return articleItems.map((articleItem, index) => {
    const parsed = parseArticle(articleItem.text);
    const nextArticle = articleItems[index + 1];
    const text = rowText(items, articleItem, nextArticle);
    const market = parsed.market || marketFromRow(items, articleItem, fallbackMarket);
    const sameLine = lineItems(items, articleItem);
    const marketItem = sameLine.find(item => isMarket(item.text));
    const numeric = sameLine.filter(item => /^\d+(?:[.,]\d+)?$/.test(item.text) && item.x > articleItem.x && (!marketItem || item.x < marketItem.x));
    const numberItem = sameLine.filter(item => /^\d+$/.test(item.text) && item.x < articleItem.x).at(-1);
    const boxItem = sameLine.find(item => marketItem && item.x > marketItem.x && !isMarket(item.text));
    return {
      ...parsed,
      market,
      qty: quantityFromRow(items, articleItem, text),
      box: boxFromRow(items, articleItem, market),
      number: numberItem?.text || '',
      numberX: numberItem?.x ?? null,
      articleX: articleItem.x,
      quantityX: numeric.at(-1)?.x ?? null,
      marketX: marketItem?.x ?? null,
      boxX: boxItem?.x ?? null,
      text,
      y: articleItem.y,
      row: index + 1
    };
  }).filter(row => row.article && row.market);
}

function updateProgress(value, status) {
  state.progress = Math.max(0, Math.min(100, value));
  if (status) state.status = status;
  const bar = document.querySelector('.pdf-reconcile-progress span');
  const label = document.querySelector('.pdf-reconcile-status');
  if (bar) bar.style.width = `${state.progress}%`;
  if (label) { label.textContent = state.status; label.className = `pdf-reconcile-status ${state.statusKind || ''}`; }
}

async function buildSearchIndex() {
  const index = new Map();
  for (let fileIndex = 0; fileIndex < state.searchFiles.length; fileIndex += 1) {
    const fileItem = state.searchFiles[fileIndex];
    const pdf = await openPdf(fileItem.file);
    fileItem.pages = pdf.numPages;
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const rows = await extractRows(await pdf.getPage(pageNumber), fileItem.market);
      for (const row of rows) {
        const market = row.market || fileItem.market;
        const key = `${row.article}|${market}`;
        const matches = index.get(key) || [];
        matches.push({ file: shortFileName(fileItem.file.name), page: pageNumber, row: row.row, labels: productLabels(row.text) });
        index.set(key, matches);
      }
      updateProgress(15 + ((fileIndex + pageNumber / pdf.numPages) / state.searchFiles.length) * 45, `Поиск артикулов в PDF: страница ${pageNumber} из ${pdf.numPages}`);
    }
    if (typeof pdf.cleanup === 'function') pdf.cleanup();
  }
  return index;
}

async function readBaseFiles() {
  const pages = [];
  for (let fileIndex = 0; fileIndex < state.baseFiles.length; fileIndex += 1) {
    const fileItem = state.baseFiles[fileIndex];
    const pdf = await openPdf(fileItem.file);
    fileItem.pages = pdf.numPages;
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const rows = await extractRows(page, '');
      const pageInfo = { fileItem, file: fileItem.file, pageNumber, rows, width: page.view[2] - page.view[0], height: page.view[3] - page.view[1] };
      try {
        await captureBaseRowColors(page, pageInfo);
      } catch {
        // The source page remains usable even if a background sample is unavailable.
      }
      pages.push(pageInfo);
      updateProgress(60 + ((fileIndex + pageNumber / pdf.numPages) / state.baseFiles.length) * 15, `Подготовка основного PDF: страница ${pageNumber} из ${pdf.numPages}`);
    }
    if (typeof pdf.cleanup === 'function') pdf.cleanup();
  }
  return pages;
}

async function readJsonResponse(response, fallbackMessage) {
  const body = await response.text();
  let data;
  try {
    data = JSON.parse(body);
  } catch {
    throw new Error(response.status === 404
      ? 'Маршрут проверки остатков недоступен. Полностью закройте PrintFlow и запустите новую версию.'
      : `Сервер вернул неожиданный ответ (${response.status})`);
  }
  if (!response.ok) throw new Error(data.error || fallbackMessage);
  return data;
}

async function readStockLegacy(articles) {
  const entries = await Promise.all(articles.map(async article => {
    const response = await fetch(`${STOCK_API}/api/stock-search?article=${encodeURIComponent(article)}`);
    const data = await readJsonResponse(response, 'Не удалось открыть таблицу остатков');
    return [article, Array.isArray(data) ? data : []];
  }));
  return Object.fromEntries(entries);
}

async function readStock(articles) {
  const response = await fetch(`${STOCK_API}/api/stock-search-batch`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ articles }) });
  if (response.status === 404) return readStockLegacy(articles);
  return readJsonResponse(response, 'Не удалось открыть таблицу остатков');
}

function wrapText(ctx, value, maxWidth) {
  const words = String(value || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    if (!current && ctx.measureText(word).width > maxWidth) {
      let chunk = '';
      for (const character of word) {
        const candidate = chunk + character;
        if (chunk && ctx.measureText(candidate).width > maxWidth) { lines.push(chunk); chunk = character; } else chunk = candidate;
      }
      current = chunk;
      continue;
    }
    const candidate = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(candidate).width > maxWidth) { lines.push(current); current = word; } else current = candidate;
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

function drawCellText(ctx, value, x, y, width, height, scale, color = '#253149', fontSize = 10, lineHeightSize = 14, align = 'left', fontWeight = '400', horizontalPaddingSize = 9) {
  ctx.save();
  ctx.fillStyle = color;
  const availableWidth = Math.max(1, width - horizontalPaddingSize * 2 * scale);
  const availableHeight = Math.max(1, height - 8 * scale);
  const sourceLines = String(value || '').split('\n');
  let fittedFontSize = fontSize;
  let fittedLineHeightSize = lineHeightSize;
  let lines = [];
  let lineHeight = fittedLineHeightSize * scale;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    ctx.font = `${fontWeight} ${fittedFontSize * scale}px Arial, sans-serif`;
    lines = sourceLines.flatMap(line => wrapText(ctx, line, availableWidth));
    lineHeight = fittedLineHeightSize * scale;
    if (lines.length * lineHeight <= availableHeight || fittedFontSize <= 7.2) break;
    const fitRatio = Math.max(0.72, Math.min(0.94, availableHeight / (lines.length * lineHeight)));
    fittedFontSize = Math.max(7.2, fittedFontSize * fitRatio);
    fittedLineHeightSize = Math.max(10.2, fittedLineHeightSize * fitRatio);
  }
  if (lines.length && lines.length * lineHeight > availableHeight) lineHeight = Math.max(7 * scale, availableHeight / lines.length);
  const visible = lines;
  const blockHeight = visible.length * lineHeight;
  const startY = y + Math.max(lineHeight / 2, (height - blockHeight) / 2 + lineHeight / 2);
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  const textX = align === 'center' ? x + width / 2 : x + horizontalPaddingSize * scale;
  visible.forEach((line, index) => ctx.fillText(line, textX, startY + index * lineHeight));
  ctx.restore();
}

function locationText(locations, requiredQty) {
  if (!locations?.length) return { text: 'Не найдено', color: '#c7644c' };
  const available = locations.reduce((sum, location) => sum + (Number(location.stock) || 0), 0);
  const lines = locations.map(location => `${location.box || 'Коробка'}${location.level ? ` (${location.level})` : ''} — ${Number(location.stock) || 0} шт.`);
  if (available < requiredQty) lines.unshift(`Недостаточно: доступно ${available} из ${requiredQty} шт.`);
  return { text: lines.join('\n'), color: available < requiredQty ? '#c7644c' : '#253149' };
}

function searchText(matches) {
  if (!matches?.length) return { text: 'Не найдено', color: '#c7644c' };
  const grouped = new Map();
  matches.forEach(match => {
    const key = `${match.file}|${match.page}`;
    const current = grouped.get(key) || { file: match.file, page: match.page, rows: [] };
    current.rows.push(Number(match.row));
    grouped.set(key, current);
  });
  const text = [...grouped.values()].map(group => {
    const rows = [...new Set(group.rows)].sort((a, b) => a - b);
    const label = rows.length === 1 ? `строка ${rows[0]}` : `строки ${rows.join(', ')}`;
    return `${group.file} · стр. ${group.page} · ${label}`;
  }).join('\n');
  return { text, color: '#253149' };
}

function rowBounds(rows, index) {
  const row = rows[index];
  const top = index === 0 ? rows[0].y + 42 : (rows[index - 1].y + row.y) / 2;
  const bottom = index === rows.length - 1 ? row.y - 42 : (row.y + rows[index + 1].y) / 2;
  return { top, bottom, height: Math.max(32, top - bottom) };
}

function sourceColumnGeometry(pageInfo) {
  const row = pageInfo.rows.find(item => [item.numberX, item.articleX, item.quantityX, item.marketX, item.boxX].every(Number.isFinite));
  if (!row) return null;
  const articleLeft = Math.max(0, row.articleX - 5);
  const articleRight = Math.max(articleLeft + 1, row.quantityX - 5);
  const quantityRight = Math.max(articleRight + 1, row.marketX - 5);
  const marketRight = Math.max(quantityRight + 1, row.boxX - 5);
  const tableRight = Math.max(marketRight + 1, (pageInfo.width || 595) - 29);
  const numberLeft = Number.isFinite(row.numberX) ? Math.max(0, row.numberX - 5) : Math.max(0, articleLeft - 187);
  const numberRight = Math.min(articleLeft - 1, numberLeft + 27);
  return {
    tableRight,
    cells: {
      number: { left: numberLeft, right: Math.max(numberLeft + 1, numberRight) },
      photo: { left: Math.max(numberLeft + 1, numberRight), right: articleLeft },
      article: { left: articleLeft, right: articleRight },
      quantity: { left: articleRight, right: quantityRight },
      market: { left: quantityRight, right: marketRight },
      box: { left: marketRight, right: tableRight }
    }
  };
}

function colorAt(context, x, y) {
  const px = Math.round(x);
  const py = Math.round(y);
  if (px < 0 || py < 0 || px >= context.canvas.width || py >= context.canvas.height) return null;
  const [red, green, blue, alpha] = context.getImageData(px, py, 1, 1).data;
  if (alpha < 200 || red + green + blue < 520 || red > 248 && green > 248 && blue > 248) return null;
  return `#${[red, green, blue].map(value => value.toString(16).padStart(2, '0')).join('')}`;
}

function sampleBaseRowColor(context, viewport, geometry, bounds) {
  const centerY = (bounds.top + bounds.bottom) / 2;
  const xCandidates = [
    geometry.cells.article.right - 10,
    geometry.cells.article.left + (geometry.cells.article.right - geometry.cells.article.left) * 0.82,
    geometry.cells.market.right - 8,
    geometry.cells.box.left + 12
  ];
  const yCandidates = [centerY - 8, centerY, centerY + 8];
  const counts = new Map();
  for (const x of xCandidates) {
    for (const y of yCandidates) {
      const point = typeof viewport.convertToViewportPoint === 'function'
        ? viewport.convertToViewportPoint(x, y)
        : [x, viewport.height - y];
      const color = colorAt(context, point[0], point[1]);
      if (color) counts.set(color, (counts.get(color) || 0) + 1);
    }
  }
  return [...counts.entries()].sort((first, second) => second[1] - first[1])[0]?.[0] || '#e8f1fb';
}

async function captureBaseRowColors(page, pageInfo) {
  const geometry = sourceColumnGeometry(pageInfo);
  if (!geometry) return;
  const viewport = page.getViewport({ scale: 1 });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  await page.render({ canvasContext: context, viewport }).promise;
  pageInfo.rows.forEach((row, index) => {
    row.fillColor = sampleBaseRowColor(context, viewport, geometry, rowBounds(pageInfo.rows, index));
  });
  canvas.width = 0;
  canvas.height = 0;
}

function paintSourceCell(ctx, cell, topPx, heightPx, scale, fillColor, value, color, fontSize, lineHeightSize, fontWeight = '400', horizontalPaddingSize = 9) {
  const left = cell.left * scale;
  const width = (cell.right - cell.left) * scale;
  const inset = Math.min(1.2 * scale, Math.max(0.35 * scale, heightPx / 12));
  ctx.fillStyle = fillColor;
  ctx.fillRect(left + inset, topPx + inset, Math.max(1, width - inset * 2), Math.max(1, heightPx - inset * 2));
  drawCellText(ctx, value, left, topPx, width, heightPx, scale, color, fontSize, lineHeightSize, 'center', fontWeight, horizontalPaddingSize);
}

function makeSourceOverlay(pageInfo, entries, outputHeight, tableTop, tableRight, verticalScale = 1) {
  const scale = 2.2;
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(tableRight * scale);
  canvas.height = Math.ceil((outputHeight || pageInfo.height) * scale);
  const ctx = canvas.getContext('2d');
  const baseGeometry = sourceColumnGeometry(pageInfo);
  if (!baseGeometry) return { canvas };
  const headerHeight = 18 * verticalScale;
  const headerTop = (outputHeight || pageInfo.height) - tableTop - headerHeight;
  const headerFill = '#667be0';
  const headerText = '#ffffff';
  const headerCells = [
    ['number', '№'],
    ['photo', 'Фото'],
    ['article', 'Артикул'],
    ['quantity', 'Кол-во'],
    ['market', 'Маркетплейс'],
    ['box', 'Коробка']
  ];
  headerCells.forEach(([key, value]) => {
    const headerFontSize = key === 'box' ? 8.8 : 7.8;
    paintSourceCell(ctx, baseGeometry.cells[key], headerTop * scale, headerHeight * scale, scale, headerFill, value, headerText, headerFontSize, 10, '700', key === 'number' ? 2.5 : 9);
  });

  let packedTop = tableTop;
  entries.forEach(entry => {
    const bounds = entry.bounds;
    const top = packedTop;
    const rowHeight = bounds.height * verticalScale;
    const bottom = top - rowHeight;
    packedTop = bottom;
    const topPx = ((outputHeight || pageInfo.height) - top) * scale;
    const heightPx = rowHeight * scale;
    const geometry = sourceColumnGeometry(entry.pageInfo) || baseGeometry;
    const fillColor = entry.row.fillColor || '#e8f1fb';
    paintSourceCell(ctx, geometry.cells.number, topPx, heightPx, scale, fillColor, entry.row.number, '#253149', 9.5, 12, '400', 2.5);
    paintSourceCell(ctx, geometry.cells.article, topPx, heightPx, scale, fillColor, entry.row.article, '#172033', 9.5, 12, '700');
    paintSourceCell(ctx, geometry.cells.quantity, topPx, heightPx, scale, fillColor, String(entry.row.qty ?? ''), '#253149', 9.5, 12);
    paintSourceCell(ctx, geometry.cells.market, topPx, heightPx, scale, fillColor, entry.row.market, '#253149', 9.5, 12);
    paintSourceCell(ctx, geometry.cells.box, topPx, heightPx, scale, fillColor, entry.row.box, '#253149', 12.5, 15);
  });
  return { canvas };
}

function makeOverlay(pageInfo, stockMap, searchIndex, targetMarket, outputHeight, tableTop, visibleRowsOverride, verticalScale = 1) {
  const scale = 2.2;
  const extraWidth = reconcileExtraWidth;
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(extraWidth * scale);
  canvas.height = Math.ceil((outputHeight || pageInfo.height) * scale);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const rows = pageInfo.rows;
  const visibleRows = visibleRowsOverride || rows
    .map((row, index) => ({ row, index, bounds: rowBounds(rows, index), labels: labelsForMatches(searchIndex.get(`${row.article}|${row.market}`)) }))
    .filter(item => !targetMarket || item.row.market === targetMarket);
  if (!rows.length || !visibleRows.length) return { canvas, extraWidth };
  const topRowY = tableTop ?? rows[0].y + 42;
  const headerHeight = 18 * verticalScale;
  const boxColumn = 220;
  const pagesColumn = boxColumn;
  const headerTop = (outputHeight || pageInfo.height) - topRowY - headerHeight;
  ctx.fillStyle = '#667be0';
  ctx.fillRect(0, Math.max(0, headerTop * scale), canvas.width, headerHeight * scale);
  ctx.strokeStyle = '#b6c0d1';
  ctx.lineWidth = 0.8 * scale;
  ctx.strokeRect(0, Math.max(0, headerTop * scale), canvas.width, headerHeight * scale);
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${10.5 * scale}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const headerCenterY = Math.max(headerHeight * scale / 2, (headerTop + headerHeight / 2) * scale);
  ctx.fillText('Доп. короба и остаток', boxColumn * scale / 2, headerCenterY);
  ctx.fillText('Страницы и строки PDF', (pagesColumn + (extraWidth - pagesColumn) / 2) * scale, headerCenterY);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.beginPath();
  ctx.moveTo(pagesColumn * scale, Math.max(0, headerTop * scale));
  ctx.lineTo(pagesColumn * scale, canvas.height);
  ctx.stroke();
  let packedTop = topRowY;
  visibleRows.forEach(({ row, bounds, labels: labelsOverride }, visibleIndex) => {
    const top = packedTop;
    const rowHeight = bounds.height * verticalScale;
    const bottom = top - rowHeight;
    packedTop = bottom;
    const topPx = ((outputHeight || pageInfo.height) - top) * scale;
    const heightPx = rowHeight * scale;
    ctx.fillStyle = visibleIndex % 2 ? '#fbfcfe' : '#f1f6ff';
    ctx.fillRect(0, topPx, canvas.width, heightPx);
    ctx.strokeStyle = '#b6c0d1';
    ctx.strokeRect(0, topPx, canvas.width, heightPx);
    ctx.beginPath();
    ctx.moveTo(pagesColumn * scale, topPx);
    ctx.lineTo(pagesColumn * scale, topPx + heightPx);
    ctx.stroke();
    const key = `${row.article}|${row.market}`;
    const locations = locationText(stockMap[row.article] || [], row.qty);
    const matches = searchText(searchIndex.get(key));
    drawCellText(ctx, locations.text, 0, topPx, boxColumn * scale, heightPx, scale, locations.color, 11.5, 15, 'center');
    drawCellText(ctx, matches.text, pagesColumn * scale, topPx, (extraWidth - pagesColumn) * scale, heightPx, scale, matches.color, 11, 14.5, 'center');
  });
  return { canvas, extraWidth };
}

async function makeOutputPdf(basePages, stockMap, searchIndex, targetMarket, progressStart, progressEnd) {
  // Keep the combined table inside a standard printable width. The source
  // page is usually A4 portrait, and the appended columns can otherwise
  // extend beyond the printer's printable area and get clipped.
  const output = await PDFDocument.create();
  const marketPages = basePages.filter(pageInfo => pageInfo.rows.some(row => row.market === targetMarket));
  const sourceCache = new Map();
  const entries = [];
  for (const pageInfo of marketPages) {
    let sourceData = sourceCache.get(pageInfo.fileItem.id);
    if (!sourceData) {
      const bytes = new Uint8Array(await pageInfo.file.arrayBuffer());
      const source = await PDFDocument.load(bytes);
      sourceData = { bytes, source };
      sourceCache.set(pageInfo.fileItem.id, sourceData);
    }
    const { source } = sourceData;
    const sourcePage = source.getPage(pageInfo.pageNumber - 1);
    const width = sourcePage.getWidth();
    const height = sourcePage.getHeight();
    const tableRight = Math.max(0, width - 29);
    const topRowY = pageInfo.rows[0].y + 42;
    pageInfo.rows.forEach((row, rowIndex) => {
      if (row.market !== targetMarket) return;
      const key = `${row.article}|${row.market}`;
      entries.push({
        pageInfo,
        sourcePage,
        width,
        height,
        tableRight,
        topRowY,
        row,
        labels: labelsForMatches(searchIndex.get(key)),
        bounds: rowBounds(pageInfo.rows, rowIndex)
      });
    });
  }
  if (!entries.length) return { bytes: await output.save(), pages: 0 };

  // Keep rows with the same primary box together; preserve source order for ties.
  const boxOrder = new Intl.Collator('ru', { numeric: true, sensitivity: 'base' });
  entries.sort((a, b) => {
    const first = String(a.row.box || '').trim();
    const second = String(b.row.box || '').trim();
    if (!first || !second) return Number(!first) - Number(!second);
    return boxOrder.compare(first, second);
  });

  const groups = [];
  const groupCount = Math.ceil(entries.length / reconcileRowsPerPage);
  const baseGroupSize = Math.floor(entries.length / groupCount);
  const largerGroupCount = entries.length % groupCount;
  let entryOffset = 0;
  for (let groupIndex = 0; groupIndex < groupCount; groupIndex += 1) {
    const groupSize = baseGroupSize + (groupIndex < largerGroupCount ? 1 : 0);
    const groupEntries = entries.slice(entryOffset, entryOffset + groupSize);
    groups.push({
      entries: groupEntries,
      bodyHeight: groupEntries.reduce((total, entry) => total + entry.bounds.height, 0)
    });
    entryOffset += groupSize;
  }

  for (let index = 0; index < groups.length; index += 1) {
    const currentGroup = groups[index];
    const first = currentGroup.entries[0];
    const { pageInfo, sourcePage, height, tableRight, topRowY } = first;
    const fullWidth = tableRight + reconcileExtraWidth;
    const contentScale = Math.min(1, (reconcileMaxPageWidth - reconcilePrintMargin * 2) / fullWidth);
    const sourceHeaderHeight = Math.max(0, height - topRowY);
    const verticalScale = Math.min(1, (reconcilePageHeight - reconcilePrintMargin * 2) / (sourceHeaderHeight + currentGroup.bodyHeight));
    const tableTop = reconcilePageHeight - reconcilePrintMargin - sourceHeaderHeight * verticalScale;
    const overlay = makeOverlay(
      pageInfo,
      stockMap,
      searchIndex,
      targetMarket,
      reconcilePageHeight,
      tableTop,
      currentGroup.entries.map(entry => ({ row: entry.row, bounds: entry.bounds, labels: entry.labels })),
      verticalScale
    );
    const sourceOverlay = makeSourceOverlay(pageInfo, currentGroup.entries, reconcilePageHeight, tableTop, tableRight, verticalScale);
    const outputPage = output.addPage([reconcileMaxPageWidth, reconcilePageHeight]);
    const header = await output.embedPage(sourcePage, { left: 0, bottom: topRowY, right: tableRight, top: height });
    outputPage.drawPage(header, { x: reconcilePrintMargin, y: tableTop, width: tableRight * contentScale, height: sourceHeaderHeight * verticalScale });
    let packedTop = tableTop;
    for (const entry of currentGroup.entries) {
      const rowEmbed = await output.embedPage(entry.sourcePage, { left: 0, bottom: entry.bounds.bottom, right: tableRight, top: entry.bounds.top });
      const rowHeight = entry.bounds.height * verticalScale;
      const rowBottom = packedTop - rowHeight;
      outputPage.drawPage(rowEmbed, { x: reconcilePrintMargin, y: rowBottom, width: tableRight * contentScale, height: rowHeight });
      packedTop = rowBottom;
    }
    const sourceImage = await output.embedPng(sourceOverlay.canvas.toDataURL('image/png'));
    outputPage.drawImage(sourceImage, { x: reconcilePrintMargin, y: 0, width: tableRight * contentScale, height: reconcilePageHeight });
    const image = await output.embedPng(overlay.canvas.toDataURL('image/png'));
    outputPage.drawImage(image, { x: reconcilePrintMargin + tableRight * contentScale, y: 0, width: overlay.extraWidth * contentScale, height: reconcilePageHeight });
    updateProgress(progressStart + ((index + 1) / groups.length) * (progressEnd - progressStart), `Формирование PDF ${targetMarket}: страница ${index + 1} из ${groups.length}`);
  }
  return { bytes: await output.save(), pages: groups.length };
}

function downloadPdf(bytes, fileName) {
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function buildResult() {
  if (state.busy || !state.baseFiles.length || !state.searchFiles.length) return;
  state.busy = true;
  state.statusKind = '';
  state.progress = 1;
  state.status = 'Подготовка файлов…';
  render();
  try {
    const basePages = await readBaseFiles();
    const baseRowCount = basePages.reduce((total, page) => total + page.rows.length, 0);
    if (!baseRowCount) {
      throw new Error('Не удалось прочитать строки из основного PDF БОКС. Выберите исходный PDF с таблицей, а не пустой или уже сформированный файл.');
    }
    const missingQuantities = basePages.flatMap(page => page.rows
      .filter(row => !Number.isInteger(row.qty) || row.qty < 1)
      .map(row => `${row.article} · стр. ${page.pageNumber} · строка ${row.row}`));
    if (missingQuantities.length) {
      throw new Error(`Не удалось определить количество в основном PDF: ${missingQuantities.slice(0, 5).join('; ')}${missingQuantities.length > 5 ? ` и ещё ${missingQuantities.length - 5}` : ''}. Проверьте колонку «Кол-во».`);
    }
    const articles = [...new Set(basePages.flatMap(page => page.rows.map(row => row.article)))];
    updateProgress(76, 'Проверка коробов в таблице остатков…');
    const stockMap = await readStock(articles);
    const searchIndex = await buildSearchIndex();
    const outputs = [];
    const missingMarkets = [];
    for (const [index, targetMarket] of ['WB', 'OZON'].entries()) {
      const output = await makeOutputPdf(basePages, stockMap, searchIndex, targetMarket, 75 + index * 12, 87 + index * 12);
      if (output.pages > 0) {
        downloadPdf(output.bytes, `PrintFlow_Бокс_${targetMarket}.pdf`);
        outputs.push(`${targetMarket}: ${output.pages} стр.`);
      } else {
        missingMarkets.push(targetMarket);
      }
    }
    if (!outputs.length) {
      throw new Error('В основном PDF не найдены строки WB или OZON. Проверьте, что выбран исходный PDF БОКС.');
    }
    state.status = `Готово · ${outputs.join(', ')}${missingMarkets.length ? ` · нет строк: ${missingMarkets.join(', ')}` : ''}`;
    state.statusKind = missingMarkets.length ? 'error' : 'ok';
    state.progress = 100;
  } catch (error) {
    state.status = error.message || 'Не удалось сформировать PDF';
    state.statusKind = 'error';
    state.progress = 0;
  } finally {
    state.busy = false;
    render();
  }
}

function addFiles(kind, files) {
  const target = kind === 'base' ? state.baseFiles : state.searchFiles;
  const existing = new Set(target.map(item => `${item.file.name}|${item.file.size}|${item.file.lastModified}`));
  const additions = files.filter(file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')).flatMap(file => {
    const id = `${file.name}|${file.size}|${file.lastModified}`;
    if (existing.has(id)) return [];
    existing.add(id);
    return [{ id: makeId(), file, market: /озон|ozon/i.test(file.name) ? 'OZON' : 'WB' }];
  });
  target.unshift(...additions);
  render();
}

function renderFiles(kind) {
  const files = kind === 'base' ? state.baseFiles : state.searchFiles;
  return files.map(item => `<div class="pdf-reconcile-file"><span class="pdf-reconcile-file-name" title="${escapeHtml(item.file.name)}">${escapeHtml(item.file.name)}</span>${kind === 'search' ? `<select data-reconcile-market="${item.id}" aria-label="Маркетплейс файла"><option ${item.market === 'WB' ? 'selected' : ''}>WB</option><option ${item.market === 'OZON' ? 'selected' : ''}>OZON</option></select>` : ''}<span class="pdf-reconcile-file-pages">${item.pages ? `${item.pages} стр.` : 'PDF'}</span><button class="pdf-reconcile-file-remove" data-reconcile-remove="${kind}|${item.id}" type="button">Удалить</button></div>`).join('');
}

function render() {
  const panel = document.querySelector('.pdf-reconcile-panel');
  if (!panel) return;
  const canBuild = state.baseFiles.length > 0 && state.searchFiles.length > 0 && !state.busy;
  panel.innerHTML = `<div class="panel-head"><div><h2>Дополнение PDF БОКС</h2><p>Обогатите основной PDF данными из других PDF и таблицы остатков</p></div><div class="step">05</div></div><p class="pdf-reconcile-intro">Загрузите основной PDF в раздел «БОКС», а PDF для поиска — во второй раздел. Программа объединит основные PDF, сохранит фото и исходные строки, добавит все короба из таблицы остатков и страницы со строками найденных артикулов.</p><div class="pdf-reconcile-zones"><section class="pdf-reconcile-zone base"><div class="pdf-reconcile-zone-title"><span class="zone-dot"></span>Основной PDF — БОКС</div><div class="pdf-reconcile-zone-subtitle">Этот PDF берём за основу итогового файла. Можно выбрать несколько файлов.</div><label class="pdf-reconcile-upload">Выбрать PDF БОКС<input id="reconcile-base-input" type="file" accept="application/pdf,.pdf" multiple></label><div class="pdf-reconcile-files">${renderFiles('base')}</div></section><section class="pdf-reconcile-zone search"><div class="pdf-reconcile-zone-title"><span class="zone-dot"></span>PDF для поиска</div><div class="pdf-reconcile-zone-subtitle">Здесь ищем артикулы, страницы и строки. Для каждого PDF укажите маркетплейс, если он не указан в артикуле.</div><label class="pdf-reconcile-upload">Выбрать PDF для поиска<input id="reconcile-search-input" type="file" accept="application/pdf,.pdf" multiple></label><div class="pdf-reconcile-files">${renderFiles('search')}</div></section></div><div class="pdf-reconcile-actions"><button class="pdf-reconcile-build" id="reconcile-build" type="button" ${canBuild ? '' : 'disabled'}>${state.busy ? 'Формирую PDF…' : 'Сформировать дополненный PDF'}</button><div class="pdf-reconcile-status ${state.statusKind || ''}">${escapeHtml(state.status || 'Загрузите оба типа PDF')}</div></div><div class="pdf-reconcile-progress"><span style="width:${state.progress}%"></span></div><div class="pdf-reconcile-note">Таблица остатков используется только для чтения: ${escapeHtml('\\\\Zzz\\проекты\\менеджеры\\FBS\\!!!Остатки Калейдоскоп (Актуальный).xlsx')}.</div>`;
  const buildButtonLabel = panel.querySelector('#reconcile-build');
  if (buildButtonLabel) buildButtonLabel.textContent = state.busy ? 'Формирую 2 PDF…' : 'Сформировать 2 PDF';
  bindEvents();
}

function bindEvents() {
  const baseInput = document.querySelector('#reconcile-base-input');
  const searchInput = document.querySelector('#reconcile-search-input');
  if (baseInput) baseInput.onchange = () => { addFiles('base', [...baseInput.files]); baseInput.value = ''; };
  if (searchInput) searchInput.onchange = () => { addFiles('search', [...searchInput.files]); searchInput.value = ''; };
  document.querySelectorAll('[data-reconcile-remove]').forEach(button => { button.onclick = () => { const [kind, id] = button.dataset.reconcileRemove.split('|'); const target = kind === 'base' ? state.baseFiles : state.searchFiles; if (kind === 'base') state.baseFiles = target.filter(item => item.id !== id); else state.searchFiles = target.filter(item => item.id !== id); render(); }; });
  document.querySelectorAll('[data-reconcile-market]').forEach(field => { field.onchange = () => { const item = state.searchFiles.find(candidate => candidate.id === field.dataset.reconcileMarket); if (item) item.market = field.value; }; });
  const buildButton = document.querySelector('#reconcile-build');
  if (buildButton) buildButton.onclick = buildResult;
}

function setup() {
  const main = document.querySelector('main');
  const nav = document.querySelector('nav');
  if (!main || !nav || document.querySelector('.pdf-reconcile-nav')) return;
  const link = document.createElement('a');
  link.className = 'pdf-reconcile-nav';
  link.append(createNavIcon('merge'), document.createTextNode('Дополнение PDF БОКС'));
  const panel = document.createElement('section');
  panel.className = 'panel pdf-reconcile-panel';
  const show = () => {
    window.dispatchEvent(new CustomEvent('printflow:navigation', { detail: { view: 'pdf-reconcile' } }));
    document.body.classList.add('pdf-reconcile-open');
    main.classList.add('pdf-reconcile-active');
    [...main.children].forEach(child => { if (child !== panel) child.style.display = 'none'; });
    document.querySelector('.stock-panel')?.classList.remove('is-visible');
    document.querySelector('.stock-panel')?.style.setProperty('display', 'none');
    document.querySelector('.stock-writeoff-panel')?.classList.remove('is-visible');
    document.querySelector('.stock-writeoff-panel')?.style.setProperty('display', 'none');
    document.querySelector('.pdf-batch-panel')?.classList.remove('is-visible');
    document.querySelector('.pdf-batch-panel')?.style.setProperty('display', 'none');
    panel.style.removeProperty('display');
    panel.classList.add('is-visible');
    nav.querySelectorAll('a').forEach(item => item.classList.toggle('active', item === link));
    render();
  };
  link.onclick = show;
  nav.append(link);
  main.append(panel);
}

function showReconcilePanel() {
  const main = document.querySelector('main');
  const panel = document.querySelector('.pdf-reconcile-panel');
  const link = document.querySelector('.pdf-reconcile-nav');
  if (!main || !panel || !link) return;
  window.dispatchEvent(new CustomEvent('printflow:navigation', { detail: { view: 'pdf-reconcile' } }));
  document.body.classList.add('pdf-reconcile-open');
  [...main.children].forEach(child => { if (child !== panel) child.style.display = 'none'; });
  main.classList.add('pdf-reconcile-active');
  document.querySelector('.stock-panel')?.classList.remove('is-visible');
  document.querySelector('.stock-panel')?.style.setProperty('display', 'none');
  document.querySelector('.stock-writeoff-panel')?.classList.remove('is-visible');
  document.querySelector('.stock-writeoff-panel')?.style.setProperty('display', 'none');
  document.querySelector('.pdf-batch-panel')?.classList.remove('is-visible');
  document.querySelector('.pdf-batch-panel')?.style.setProperty('display', 'none');
  panel.style.removeProperty('display');
  panel.classList.add('is-visible');
  document.querySelectorAll('nav a').forEach(item => item.classList.toggle('active', item === link));
  render();
}

document.addEventListener('click', event => {
  if (event.target.closest?.('.pdf-reconcile-nav')) {
    event.preventDefault();
    showReconcilePanel();
  }
}, true);

new MutationObserver(setup).observe(document.body, { childList: true, subtree: true });
setTimeout(setup, 600);
