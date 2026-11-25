// 배움 카드 창이 쓸 수 있는 통로만 좁게 열어 준다.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cardApi', {
  getCard: () => ipcRenderer.invoke('card:get'),
  // choice: 퀴즈에서 고른 보기 번호(퀴즈가 없는 카드는 null). 채점은 메인 프로세스가 한다.
  confirm: (choice) => ipcRenderer.send('card:confirm', choice),
  later: () => ipcRenderer.send('card:later'),
  ignore: () => ipcRenderer.send('card:ignore'),
});
