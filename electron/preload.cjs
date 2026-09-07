const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('printflowDesktop', {
  selectStockFile: () => ipcRenderer.invoke('select-stock-file')
});
