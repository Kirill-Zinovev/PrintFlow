const ICON_PATHS = {
  boxes: '<path d="M4 7.5 12 3l8 4.5-8 4.5-8-4.5Z"/><path d="M4 7.5V16l8 5 8-5V7.5"/><path d="M12 12v9"/>',
  archive: '<path d="M4 7h16v12H4z"/><path d="M3 4h18v3H3zM9 11h6"/>',
  file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z"/><path d="M14 3v6h6M8 13h8M8 17h6"/>'
  ,merge: '<path d="M7 3v6a5 5 0 0 0 5 5h5"/><path d="m14 11 3 3-3 3"/><path d="M17 21v-6a5 5 0 0 0-5-5H7"/><path d="m10 7-3 3 3 3"/>'
};

export function createNavIcon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '17');
  svg.setAttribute('height', '17');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.8');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = ICON_PATHS[name] || ICON_PATHS.file;
  return svg;
}
