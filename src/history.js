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
      if (!link || link.classList.contains('stock-nav')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (link === historyLink) showHistory();
      else showQueue();
    }, true);
  }

  const regularChildren = () => [...main.children].filter(child => child !== queue && !child.classList.contains('stock-panel'));
  const setHeading = (title, subtitle) => {
    const titleNode = queue.querySelector('h2');
    const subtitleNode = queue.querySelector('p');
    if (titleNode) titleNode.textContent = title;
    if (subtitleNode) subtitleNode.textContent = subtitle;
  };
  const setActive = active => nav.querySelectorAll('a').forEach(item => item.classList.toggle('active', item === active));
  const showQueue = () => {
    regularChildren().forEach(child => { child.style.display = ''; });
    queue.style.display = 'none';
    const stockPanel = main.querySelector('.stock-panel');
    if (stockPanel) { stockPanel.classList.remove('is-visible'); stockPanel.style.display = ''; }
    setHeading('Последние задания', 'Архив открывается во вкладке «История»');
    setActive(nav.querySelector('a:not(.stock-nav)'));
  };
  const showHistory = () => {
    regularChildren().forEach(child => { child.style.display = 'none'; });
    queue.style.display = 'block';
    const stockPanel = main.querySelector('.stock-panel');
    if (stockPanel) { stockPanel.classList.remove('is-visible'); stockPanel.style.display = ''; }
    queue.classList.add('history-view');
    setHeading('История', 'Задания, перенесённые из очереди после 20:00');
    setActive(historyLink);
  };

  historyLink.dataset.historyReady = '1';
  if (!queue.dataset.historyDefault) {
    queue.dataset.historyDefault = '1';
    showQueue();
  }
}

new MutationObserver(setupHistoryNavigation).observe(document.body, { childList: true, subtree: true });
setTimeout(setupHistoryNavigation, 500);
