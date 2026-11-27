// 랭킹 창이 쓸 수 있는 통로만 좁게 연다.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('rankingApi', {
  // 지금 쓸 언어('ko' | 'en'). 메인이 설정과 PC 언어·지역으로 정한다.
  lang: () => ipcRenderer.invoke('lang:get'),
  get: (metric) => ipcRenderer.invoke('ranking:get', metric),
  setVisible: (visible) => ipcRenderer.invoke('ranking:set-visible', visible),
  close: () => ipcRenderer.send('ranking:close'),
});
