// 렌더러(펫 화면)가 쓸 수 있는 통로만 좁게 열어 준다. Node 기능은 노출하지 않는다.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petApi', {
  // 지금 쓸 언어('ko' | 'en'). 메인이 설정과 PC 언어·지역으로 정한다.
  lang: () => ipcRenderer.invoke('lang:get'),
  onLang: (callback) => ipcRenderer.on('pet:lang', (_event, lang) => callback(lang)),
  getView: () => ipcRenderer.invoke('pet:get-view'),
  act: (type) => ipcRenderer.invoke('pet:act', type),
  setInteractive: (value) => ipcRenderer.send('pet:interactive', value),
  drag: (phase) => ipcRenderer.send('pet:drag', phase),
  contextMenu: () => ipcRenderer.send('pet:context-menu'),
  tipConfirm: () => ipcRenderer.send('tip:confirm'),
  onView: (callback) => ipcRenderer.on('pet:view', (_event, view) => callback(view)),
  onStatus: (callback) => ipcRenderer.on('pet:status', (_event, status) => callback(status)),
  onSay: (callback) => ipcRenderer.on('pet:say', (_event, text) => callback(text)),
  openNotice: () => ipcRenderer.send('notice:open'),
  onNotice: (callback) => ipcRenderer.on('pet:notice', (_event, message) => callback(message)),
  onTip: (callback) => ipcRenderer.on('pet:tip', (_event, tip) => callback(tip)),
});
