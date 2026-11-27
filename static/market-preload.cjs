// 경매장 창이 쓸 수 있는 통로만 좁게 연다.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('marketApi', {
  // 지금 쓸 언어('ko' | 'en'). 메인이 설정과 PC 언어·지역으로 정한다.
  lang: () => ipcRenderer.invoke('lang:get'),
  get: () => ipcRenderer.invoke('market:get'),
  buy: (listingId) => ipcRenderer.invoke('market:buy', listingId),
  sell: (petId, price) => ipcRenderer.invoke('market:sell', petId, price),
  cancel: (listingId) => ipcRenderer.invoke('market:cancel', listingId),
  close: () => ipcRenderer.send('market:close'),
});
