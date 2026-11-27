// 우클릭 메뉴 창이 쓸 수 있는 통로만 좁게 연다.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('menuApi', {
  get: () => ipcRenderer.invoke('menu:get'),
  // 그려진 높이를 알리면 메인이 창을 알맞게 놓고 보여 준다.
  ready: (height) => ipcRenderer.send('menu:ready', height),
  resize: (height) => ipcRenderer.send('menu:resize', height),
  tab: (id) => ipcRenderer.send('menu:tab', id),
  // 눌린 항목의 id 만 보낸다. 무슨 동작인지는 메인이 정한다.
  click: (id) => ipcRenderer.send('menu:click', id),
  close: () => ipcRenderer.send('menu:close'),
});
