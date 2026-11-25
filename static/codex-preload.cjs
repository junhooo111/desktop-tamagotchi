// 도감·기록 창이 쓸 수 있는 통로만 좁게 열어 준다(읽기 전용).
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('codexApi', {
  get: () => ipcRenderer.invoke('codex:get'),
  onRefresh: (callback) => ipcRenderer.on('codex:refresh', () => callback()),
  close: () => ipcRenderer.send('codex:close'),
});
