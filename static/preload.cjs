// 렌더러(펫 화면)가 쓸 수 있는 통로만 좁게 열어 준다. Node 기능은 노출하지 않는다.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petApi', {
  getView: () => ipcRenderer.invoke('pet:get-view'),
  act: (type) => ipcRenderer.invoke('pet:act', type),
  setInteractive: (value) => ipcRenderer.send('pet:interactive', value),
  drag: (phase) => ipcRenderer.send('pet:drag', phase),
  contextMenu: () => ipcRenderer.send('pet:context-menu'),
  tipConfirm: () => ipcRenderer.send('tip:confirm'),
  onView: (callback) => ipcRenderer.on('pet:view', (_event, view) => callback(view)),
  onSay: (callback) => ipcRenderer.on('pet:say', (_event, text) => callback(text)),
  onTip: (callback) => ipcRenderer.on('pet:tip', (_event, tip) => callback(tip)),
});
