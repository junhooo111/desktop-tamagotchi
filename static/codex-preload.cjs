// 도감·기록 창이 쓸 수 있는 통로만 좁게 열어 준다(읽기 전용).
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('codexApi', {
  // 지금 쓸 언어('ko' | 'en'). 메인이 설정과 PC 언어·지역으로 정한다.
  lang: () => ipcRenderer.invoke('lang:get'),
  get: () => ipcRenderer.invoke('codex:get'),
  onRefresh: (callback) => ipcRenderer.on('codex:refresh', () => callback()),
  close: () => ipcRenderer.send('codex:close'),
});
