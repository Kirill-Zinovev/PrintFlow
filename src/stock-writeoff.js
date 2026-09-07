import { createNavIcon } from './nav-icons.js';

const STOCK_API = window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:4174'
  : `${window.location.protocol}//${window.location.hostname}:4174`;

const style = document.createElement('style');
style.textContent = `
.stock-writeoff-panel{display:none}.stock-writeoff-panel.is-visible{display:block}.stock-writeoff-panel .panel-head{margin-bottom:18px}
.stock-writeoff-intro{max-width:850px;color:#758097;font:13px/1.6 'DM Sans',sans-serif;margin:-8px 0 22px}
.stock-writeoff-filecheck{margin-top:10px;padding:9px 11px;border-radius:8px;color:#c7644c;background:#fff5f1;border:1px solid #f2c9bb;font:11px/1.45 'DM Sans',sans-serif}.stock-writeoff-filecheck.ok{color:#319c6b;background:#effaf4;border-color:#bde5ce}
.stock-writeoff-toolbar{display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap;padding:14px;border:1px solid #dfe6f0;border-radius:11px;background:#f8fafc}
.stock-writeoff-field{display:grid;gap:5px;min-width:210px;flex:1;color:#8994a8;font:10px 'DM Sans',sans-serif}.stock-writeoff-field input,.stock-writeoff-field select{height:36px;border:1px solid #dfe6f0;border-radius:8px;background:#fff;color:#33415a;padding:0 10px;font:500 12px 'DM Sans',sans-serif;outline:none}.stock-writeoff-field input:focus,.stock-writeoff-field select:focus{border-color:#ed6a46;box-shadow:0 0 0 3px #ed6a4618}
.stock-writeoff-toolbar button,.stock-writeoff-actions button{height:36px;border:1px solid #dfe6f0;border-radius:8px;background:#fff;color:#53617a;padding:0 12px;font:700 11px 'DM Sans',sans-serif;cursor:pointer}.stock-writeoff-toolbar button:hover{border-color:#edb39f;color:#d85f3e;background:#fff8f5}
.stock-writeoff-status{min-height:18px;margin-top:10px;color:#8994a8;font:11px/1.45 'DM Sans',sans-serif}.stock-writeoff-status.ok{color:#319c6b}.stock-writeoff-status.error{color:#c7644c}
.stock-writeoff-summary{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:20px;padding:13px 14px;border-bottom:1px solid #eef1f5;color:#53617a;font:11px 'DM Sans',sans-serif}.stock-writeoff-summary strong{color:#152034;font:700 15px 'Space Grotesk',sans-serif}.stock-writeoff-actions{display:flex;align-items:center;gap:8px}.stock-writeoff-actions .primary{width:auto;height:36px;margin:0;padding:0 14px}.stock-writeoff-actions button:disabled{opacity:.45;cursor:not-allowed}
.stock-writeoff-table-wrap{margin-top:12px;overflow:auto;border:1px solid #e5e9f0;border-radius:11px}.stock-writeoff-table{width:100%;min-width:760px;border-collapse:collapse;font:12px 'DM Sans',sans-serif}.stock-writeoff-table th{height:38px;padding:0 10px;background:#f8fafc;color:#8994a8;font-size:10px;font-weight:700;text-align:left;text-transform:uppercase;letter-spacing:.35px;white-space:nowrap}.stock-writeoff-table td{padding:10px;border-top:1px solid #eef1f5;color:#53617a;vertical-align:middle}.stock-writeoff-table td:first-child,.stock-writeoff-table th:first-child{width:44px;text-align:center}.stock-writeoff-table td:nth-child(2){color:#253149;font-weight:700}.stock-writeoff-table td small{display:block;margin-top:3px;color:#9aa5b6;font-size:10px;font-weight:400}.stock-writeoff-table .market{display:inline-flex;padding:4px 7px;border-radius:6px;background:#edf8f2;color:#319c6b;font-size:10px;font-weight:700}.stock-writeoff-table .market.ozon{background:#f0edff;color:#7864d8}.stock-writeoff-table .box{color:#253149;font-weight:600}.stock-writeoff-table .box small{font-weight:400}.stock-writeoff-table input[type=number]{width:92px;height:32px;border:1px solid #dfe6f0;border-radius:7px;padding:0 8px;color:#253149;font:600 12px 'DM Sans',sans-serif}.stock-writeoff-table input[type=number]:focus{border-color:#ed6a46;outline:0;box-shadow:0 0 0 3px #ed6a4618}.stock-writeoff-empty{padding:42px 18px;text-align:center;color:#a0a9b8;font:11px/1.5 'DM Sans',sans-serif}.stock-writeoff-note{margin-top:12px;color:#8994a8;font:10px/1.5 'DM Sans',sans-serif}
@media(max-width:700px){.stock-writeoff-field{min-width:100%}.stock-writeoff-toolbar button{width:100%}.stock-writeoff-actions{width:100%}.stock-writeoff-actions .primary{flex:1}.stock-writeoff-table-wrap{overflow:visible}.stock-writeoff-table{display:block;min-width:0}.stock-writeoff-table thead{display:none}.stock-writeoff-table tbody{display:grid;gap:8px;padding:8px}.stock-writeoff-table tr{display:grid;grid-template-columns:26px minmax(0,1fr) auto;gap:5px 9px;padding:10px;border:1px solid #e5e9f0;border-radius:9px}.stock-writeoff-table td{padding:0;border:0;min-width:0}.stock-writeoff-table td:first-child{grid-column:1;grid-row:1 / span 4;width:auto;text-align:center}.stock-writeoff-table td:nth-child(2){grid-column:2 / -1;grid-row:1;overflow-wrap:anywhere}.stock-writeoff-table td:nth-child(3){grid-column:2;grid-row:2}.stock-writeoff-table td:nth-child(4){grid-column:2;grid-row:3;font-size:11px}.stock-writeoff-table td:nth-child(4)::before{content:'Короб: ';color:#8994a8;font-weight:400}.stock-writeoff-table td:nth-child(5){grid-column:2;grid-row:4;font-size:11px}.stock-writeoff-table td:nth-child(5)::before{content:'Остаток: ';color:#8994a8;font-weight:400}.stock-writeoff-table td:nth-child(6){grid-column:3;grid-row:2 / span 3;align-self:center}.stock-writeoff-table .stock-writeoff-empty{display:block;grid-column:1 / -1;padding:28px 10px}}
`;
document.head.append(style);

const state = { rows: [], query: '', box: '', status: '', statusKind: '', fileCheck: null, loading: false, selected: new Map() };
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const locationLabel = row => row.level ? `${row.box || 'Коробка'} · ${row.level}` : (row.box || 'Коробка не указана');

function selectedRows() {
  return [...state.selected.values()].filter(item => Number.isInteger(item.qty) && item.qty > 0);
}

function render() {
  const panel = document.querySelector('.stock-writeoff-panel');
  if (!panel) return;
  const selected = selectedRows();
  const total = selected.reduce((sum, item) => sum + item.qty, 0);
  const rows = state.rows.length ? state.rows.map(row => {
    const item = state.selected.get(row.rowNumber);
    const marketClass = row.market === 'OZON' ? ' ozon' : '';
    return `<tr data-writeoff-row="${row.rowNumber}"><td><input type="checkbox" data-writeoff-select="${row.rowNumber}" ${item ? 'checked' : ''} aria-label="Выбрать строку ${row.rowNumber}"></td><td>${escapeHtml(row.article)}<small>Строка Excel: ${row.rowNumber}</small></td><td>${row.market ? `<span class="market${marketClass}">${escapeHtml(row.market)}</span>` : '—'}</td><td class="box">${escapeHtml(locationLabel(row))}</td><td><b>${row.qty} шт.</b></td><td><input type="number" min="1" max="${row.qty}" step="1" value="${item?.qty || ''}" placeholder="шт." data-writeoff-qty="${row.rowNumber}" aria-label="Количество к списанию для ${escapeHtml(row.article)}"></td></tr>`;
  }).join('') : `<tr><td colspan="6" class="stock-writeoff-empty">${state.loading ? 'Загружаю строки…' : 'По заданным фильтрам строки не найдены'}</td></tr>`;
  const status = state.status ? `<div class="stock-writeoff-status ${state.statusKind}">${escapeHtml(state.status)}</div>` : '';
  const fileCheck = state.fileCheck && !state.fileCheck.ok ? `<div class="stock-writeoff-filecheck">${escapeHtml(state.fileCheck.message || 'Файл остатков недоступен для записи')}</div>` : '';
  panel.innerHTML = `<div class="panel-head"><div><h2>Списание остатков</h2><p>Уменьшите количество в выбранных строках таблицы склада</p></div><div class="step">06</div></div><p class="stock-writeoff-intro">Найдите нужный артикул или короб и укажите, сколько фактически собрано. Списание изменит основной Excel-файл. Перед изменением будет создана резервная копия.</p>${fileCheck}<form class="stock-writeoff-toolbar" id="stock-writeoff-filter"><label class="stock-writeoff-field"><span>Артикул</span><input name="q" value="${escapeHtml(state.query)}" placeholder="Поиск по артикулу"></label><label class="stock-writeoff-field"><span>Короб или этаж</span><input name="box" value="${escapeHtml(state.box)}" placeholder="Например, 2а442"></label><button type="submit">Найти</button><button type="button" id="stock-writeoff-refresh">Обновить</button></form>${status}<div class="stock-writeoff-summary"><div>Строк найдено: <strong>${state.rows.length}</strong></div><div>Выбрано: <strong data-writeoff-total>${selected.length} строк · ${total} шт.</strong></div><div class="stock-writeoff-actions"><button class="primary" type="button" id="stock-writeoff-submit" ${selected.length ? '' : 'disabled'}>Списать выбранное</button></div></div><div class="stock-writeoff-table-wrap"><table class="stock-writeoff-table"><thead><tr><th></th><th>Артикул</th><th>Куда</th><th>Короб / этаж</th><th>Остаток</th><th>Списать</th></tr></thead><tbody>${rows}</tbody></table></div><p class="stock-writeoff-note">Если после списания останется 0 шт., строка будет удалена из Excel. Если останется количество, изменится только ячейка «Количество».</p>`;
  bindEvents();
}

async function loadRows(preserveStatus = false) {
  state.loading = true;
  if (!preserveStatus) { state.status = ''; state.statusKind = ''; }
  render();
  try {
    const params = new URLSearchParams({ q: state.query, box: state.box });
    const [response, lockResponse] = await Promise.all([fetch(`${STOCK_API}/api/stock-rows?${params}`), fetch(`${STOCK_API}/api/stock-lock`)]);
    const data = await response.json();
    const lockData = await lockResponse.json();
    state.fileCheck = lockResponse.ok ? lockData : { ok: false, message: 'Не удалось проверить доступ к файлу остатков' };
    if (!response.ok) throw new Error(data.error || 'Не удалось прочитать таблицу остатков');
    state.rows = Array.isArray(data.rows) ? data.rows : [];
    state.selected.clear();
  } catch (error) {
    state.rows = [];
    state.status = error.message || 'Не удалось загрузить строки';
    state.statusKind = 'error';
  } finally {
    state.loading = false;
    render();
  }
}

function updateSummary() {
  const selected = selectedRows();
  const total = selected.reduce((sum, item) => sum + item.qty, 0);
  const target = document.querySelector('[data-writeoff-total]');
  const button = document.querySelector('#stock-writeoff-submit');
  if (target) target.textContent = `${selected.length} строк · ${total} шт.`;
  if (button) button.disabled = !selected.length;
}

function updateSelected(rowNumber, quantity) {
  const row = state.rows.find(item => item.rowNumber === rowNumber);
  const qty = Number(quantity);
  if (!row || !Number.isInteger(qty) || qty < 1) state.selected.delete(rowNumber);
  else state.selected.set(rowNumber, { ...row, qty });
  updateSummary();
}

async function submitWriteoff() {
  const selected = selectedRows();
  if (!selected.length) return;
  const total = selected.reduce((sum, item) => sum + item.qty, 0);
  try {
    const guardResponse = await fetch(`${STOCK_API}/api/stock-lock`);
    const guard = await guardResponse.json();
    state.fileCheck = guardResponse.ok ? guard : { ok: false, message: 'Не удалось проверить доступ к файлу остатков' };
    if (!guardResponse.ok || !guard.ok) { state.status = state.fileCheck.message || 'Файл остатков недоступен для записи'; state.statusKind = 'error'; render(); return; }
  } catch (error) {
    state.status = error.message || 'Не удалось проверить доступ к файлу остатков';
    state.statusKind = 'error';
    render();
    return;
  }
  if (!window.confirm(`Списать ${total} шт. в ${selected.length} строках? Перед изменением будет создана резервная копия Excel.`)) return;
  const button = document.querySelector('#stock-writeoff-submit');
  if (button) { button.disabled = true; button.textContent = 'Списываю…'; }
  try {
    const response = await fetch(`${STOCK_API}/api/stock-writeoff`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: selected }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Не удалось списать остатки');
    state.status = `Готово: списано ${total} шт. Резервная копия создана.`;
    state.statusKind = 'ok';
    await loadRows(true);
  } catch (error) {
    state.status = error.message || 'Не удалось списать остатки';
    state.statusKind = 'error';
    render();
  }
}

function bindEvents() {
  const filter = document.querySelector('#stock-writeoff-filter');
  if (filter) filter.onsubmit = event => { event.preventDefault(); const form = new FormData(filter); state.query = String(form.get('q') || '').trim(); state.box = String(form.get('box') || '').trim(); loadRows(); };
  document.querySelector('#stock-writeoff-refresh')?.addEventListener('click', () => loadRows());
  document.querySelector('#stock-writeoff-submit')?.addEventListener('click', submitWriteoff);
  document.querySelectorAll('[data-writeoff-qty]').forEach(input => { input.addEventListener('input', () => updateSelected(Number(input.dataset.writeoffQty), input.value)); input.addEventListener('change', () => { const row = state.rows.find(item => item.rowNumber === Number(input.dataset.writeoffQty)); if (row) input.value = state.selected.get(row.rowNumber)?.qty || ''; }); });
  document.querySelectorAll('[data-writeoff-select]').forEach(input => input.addEventListener('change', () => { const rowNumber = Number(input.dataset.writeoffSelect); const row = state.rows.find(item => item.rowNumber === rowNumber); if (!row) return; const quantity = document.querySelector(`[data-writeoff-qty="${rowNumber}"]`); if (input.checked) { if (!Number(quantity.value)) quantity.value = '1'; updateSelected(rowNumber, quantity.value); } else { state.selected.delete(rowNumber); quantity.value = ''; updateSummary(); } }));
}

function hidePanel(panel, link) { panel.classList.remove('is-visible'); panel.style.display = 'none'; link.classList.remove('active'); }

function setup() {
  const main = document.querySelector('main');
  const nav = document.querySelector('nav');
  if (!main || !nav || document.querySelector('.stock-writeoff-nav')) return;
  const link = document.createElement('a');
  link.className = 'stock-writeoff-nav';
  link.append(createNavIcon('archive'), document.createTextNode('Списание остатков'));
  nav.append(link);
  const panel = document.createElement('section');
  panel.className = 'panel stock-writeoff-panel';
  main.append(panel);
  const show = () => {
    window.dispatchEvent(new CustomEvent('printflow:navigation', { detail: { view: 'stock-writeoff' } }));
    document.body.classList.remove('pdf-reconcile-open');
    main.classList.remove('pdf-reconcile-active');
    [...main.children].forEach(child => { if (child !== panel) child.style.display = 'none'; });
    panel.style.removeProperty('display');
    panel.classList.add('is-visible');
    nav.querySelectorAll('a').forEach(item => item.classList.toggle('active', item === link));
    render();
    loadRows();
  };
  link.onclick = show;
  window.addEventListener('printflow:navigation', event => { if (event.detail?.view !== 'stock-writeoff') hidePanel(panel, link); });
}

new MutationObserver(setup).observe(document.body, { childList: true, subtree: true });
setTimeout(setup, 650);
