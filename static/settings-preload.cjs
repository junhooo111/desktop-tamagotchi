// 설정 창이 쓸 수 있는 통로만 좁게 열어 준다.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('settingsApi', {
  get: () => ipcRenderer.invoke('settings:get'),
  // patch 의 값은 메인 프로세스가 다시 검증한다. 저장된 전체 설정을 돌려준다.
  set: (patch) => ipcRenderer.invoke('settings:set', patch),
  version: () => ipcRenderer.invoke('app:version'),
  checkUpdate: () => ipcRenderer.invoke('update:check'),
  onUpdateStatus: (callback) => ipcRenderer.on('update:status', (_event, text) => callback(text)),
  close: () => ipcRenderer.send('settings:close'),
});
