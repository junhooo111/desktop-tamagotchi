// 선물 상자 창이 쓸 수 있는 통로는 '열었어요' 신호 하나뿐이다.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('giftApi', {
  open: () => ipcRenderer.send('gift:open'),
});
