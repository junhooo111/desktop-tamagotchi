// 배움 카드 창이 쓸 수 있는 통로만 좁게 열어 준다.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cardApi', {
  getCard: () => ipcRenderer.invoke('card:get'),
  confirm: () => ipcRenderer.send('card:confirm'),
  later: () => ipcRenderer.send('card:later'),
});
