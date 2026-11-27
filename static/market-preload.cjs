// 경매장 창이 쓸 수 있는 통로만 좁게 연다.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('marketApi', {
  get: () => ipcRenderer.invoke('market:get'),
  buy: (listingId) => ipcRenderer.invoke('market:buy', listingId),
  sell: (petId, price) => ipcRenderer.invoke('market:sell', petId, price),
  cancel: (listingId) => ipcRenderer.invoke('market:cancel', listingId),
  close: () => ipcRenderer.send('market:close'),
});
