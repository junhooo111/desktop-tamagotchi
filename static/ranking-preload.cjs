// 랭킹 창이 쓸 수 있는 통로만 좁게 연다.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('rankingApi', {
  get: (metric) => ipcRenderer.invoke('ranking:get', metric),
  setVisible: (visible) => ipcRenderer.invoke('ranking:set-visible', visible),
  close: () => ipcRenderer.send('ranking:close'),
});
