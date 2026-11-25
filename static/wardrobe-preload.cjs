// 꾸미기 창이 쓸 수 있는 통로만 좁게 열어 준다.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('wardrobeApi', {
  get: () => ipcRenderer.invoke('wardrobe:get'),
  // patch 는 메인 프로세스가 다시 검증한다(잠긴 것은 적용되지 않는다). 바뀐 전체 상태를 돌려준다.
  set: (patch) => ipcRenderer.invoke('wardrobe:set', patch),
  onRefresh: (callback) => ipcRenderer.on('wardrobe:refresh', () => callback()),
  close: () => ipcRenderer.send('wardrobe:close'),
});
