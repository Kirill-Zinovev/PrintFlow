const { app, BrowserWindow, dialog } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

let windowRef;

function appFile(...parts) {
  return path.join(app.getAppPath(), ...parts);
}

async function startApi() {
  const userDataRoot = path.join(app.getPath('userData'), 'data');
  const mapPath = path.join(userDataRoot, 'Расширения.xlsx');
  fs.mkdirSync(userDataRoot, { recursive: true });
  if (!fs.existsSync(mapPath)) fs.copyFileSync(appFile('Расширения.xlsx'), mapPath);

  process.env.PRINTFLOW_APP_ROOT = app.getAppPath();
  process.env.PRINTFLOW_DATA_DIR = userDataRoot;
  process.env.PRINTFLOW_MAP = mapPath;
  await import(pathToFileURL(appFile('server.mjs')).href);

  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch('http://127.0.0.1:4174/api/health');
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('PrintFlow API не запустился на порту 4174');
}

function createWindow() {
  windowRef = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'PrintFlow',
    icon: appFile('printflow.ico'),
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
    },
  });
  windowRef.loadFile(appFile('dist', 'index.html'));
}

app.whenReady().then(async () => {
  try {
    await startApi();
    createWindow();
  } catch (error) {
    dialog.showErrorBox('PrintFlow', error.message);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
