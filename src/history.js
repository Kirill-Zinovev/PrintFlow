function setupHistoryNavigation() {
  const main = document.querySelector('main');
  const nav = document.querySelector('nav');
  const queue = main?.querySelector('.queue:not(.current-queue)');
  const historyLink = [...(nav?.querySelectorAll('a') || [])].find(link => link.textContent.trim() === 'История');

  if (!main || !nav || !queue || !historyLink) return;
  if (!document.documentElement.dataset.historyNavigation) {
    document.documentElement.dataset.historyNavigation = '1';
    document.addEventListener('click', event => {
      const link = event.target.closest('nav a');
      if (!link || link.classList.contains('stock-nav') || link.classList.contains('stock-writeoff-nav') || link.classList.contains('pdf-batch-nav') || link.classList.contains('pdf-reconcile-nav') || link.classList.contains('users-nav')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (link === historyLink) showHistory();
      else showQueue();
    }, true);
  }

  const dashboard = main.querySelector('.dashboard-content');
  const regularChildren = () => {
    const container = dashboard?.contains(queue) ? dashboard : main;
    return [...container.children].filter(child => child !== queue && !child.classList.contains('stock-panel') && !child.classList.contains('stock-writeoff-panel') && !child.classList.contains('pdf-batch-panel') && !child.classList.contains('pdf-reconcile-panel'));
  };
  const setHeading = (title, subtitle) => {
    const titleNode = queue.querySelector('h2');
    const subtitleNode = queue.querySelector('p');
    if (titleNode) titleNode.textContent = title;
    if (subtitleNode) subtitleNode.textContent = subtitle;
  };
  const setActive = active => nav.querySelectorAll('a').forEach(item => item.classList.toggle('active', item === active));
  const showQueue = () => {
    dashboard?.style.removeProperty('display');
    document.body.classList.remove('pdf-reconcile-open');
    main.classList.remove('pdf-reconcile-active');
    regularChildren().forEach(child => { child.style.display = ''; });
    queue.style.display = 'none';
    const stockPanel = main.querySelector('.stock-panel');
    if (stockPanel) { stockPanel.classList.remove('is-visible'); stockPanel.style.display = ''; }
    const pdfPanel = main.querySelector('.pdf-batch-panel');
    if (pdfPanel) { pdfPanel.classList.remove('is-visible'); pdfPanel.style.display = ''; }
    const reconcilePanel = main.querySelector('.pdf-reconcile-panel');
    if (reconcilePanel) { reconcilePanel.classList.remove('is-visible'); reconcilePanel.style.display = ''; }
    const writeoffPanel = main.querySelector('.stock-writeoff-panel');
    if (writeoffPanel) { writeoffPanel.classList.remove('is-visible'); writeoffPanel.style.display = ''; }
    setHeading('Последние задания', 'Архив открывается во вкладке «История»');
    setActive(nav.querySelector('a:not(.stock-nav)'));
    window.dispatchEvent(new CustomEvent('printflow:navigation', { detail: { view: 'queue' } }));
  };
  const showHistory = () => {
    dashboard?.style.removeProperty('display');
    document.body.classList.remove('pdf-reconcile-open');
    main.classList.remove('pdf-reconcile-active');
    regularChildren().forEach(child => { child.style.display = 'none'; });
    queue.style.display = 'block';
    const stockPanel = main.querySelector('.stock-panel');
    if (stockPanel) { stockPanel.classList.remove('is-visible'); stockPanel.style.display = ''; }
    const pdfPanel = main.querySelector('.pdf-batch-panel');
    if (pdfPanel) { pdfPanel.classList.remove('is-visible'); pdfPanel.style.display = ''; }
    const reconcilePanel = main.querySelector('.pdf-reconcile-panel');
    if (reconcilePanel) { reconcilePanel.classList.remove('is-visible'); reconcilePanel.style.display = ''; }
    const writeoffPanel = main.querySelector('.stock-writeoff-panel');
    if (writeoffPanel) { writeoffPanel.classList.remove('is-visible'); writeoffPanel.style.display = ''; }
    queue.classList.add('history-view');
    setHeading('История', 'Задания, перенесённые из очереди после 20:00');
    setActive(historyLink);
    window.dispatchEvent(new CustomEvent('printflow:navigation', { detail: { view: 'history' } }));
  };

  historyLink.dataset.historyReady = '1';
  if (!queue.dataset.historyDefault) {
    queue.dataset.historyDefault = '1';
    showQueue();
  }
}

if (!document.documentElement.dataset.usersNavigation) {
  document.documentElement.dataset.usersNavigation = '1';
  document.addEventListener('click', event => {
    if (!event.target.closest?.('nav .users-nav')) return;
    const main = document.querySelector('main');
    document.body.classList.remove('pdf-reconcile-open');
    main?.classList.remove('pdf-reconcile-active');
    main?.querySelectorAll('.stock-panel, .stock-writeoff-panel, .pdf-batch-panel, .pdf-reconcile-panel').forEach(panel => {
      panel.classList.remove('is-visible');
      panel.style.display = 'none';
    });
  }, true);
}

new MutationObserver(setupHistoryNavigation).observe(document.body, { childList: true, subtree: true });
setTimeout(setupHistoryNavigation, 500);

const historyTimeStyle = document.createElement('style');
historyTimeStyle.textContent = '.time{display:flex;align-items:center;gap:5px;color:#a0a8b6;font-size:11px;white-space:nowrap}.time small{color:#b0b7c3;font-size:10px}';
document.head.append(historyTimeStyle);
