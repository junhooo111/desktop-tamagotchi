// 검사 결과 창이 쓸 수 있는 통로만 좁게 열어 준다.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('resultsApi', {
  // 지금 쓸 언어('ko' | 'en'). 메인이 설정과 PC 언어·지역으로 정한다.
  lang: () => ipcRenderer.invoke('lang:get'),
  get: () => ipcRenderer.invoke('results:get'),
  // key 는 메인 프로세스가 다시 검증한다.
  ignore: (key) => ipcRenderer.invoke('results:ignore', key),
  unignore: (key) => ipcRenderer.invoke('results:unignore', key),
  onRefresh: (callback) => ipcRenderer.on('results:refresh', () => callback()),
  close: () => ipcRenderer.send('results:close'),
});
