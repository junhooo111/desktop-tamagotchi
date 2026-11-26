// 뽑기·컬렉션 창이 쓸 수 있는 통로만 좁게 열어 준다.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('collectionApi', {
  get: () => ipcRenderer.invoke('collection:get'),
  pullSpecies: () => ipcRenderer.invoke('collection:pull-species'),
  pullCosmetic: () => ipcRenderer.invoke('collection:pull-cosmetic'),
  // 어떤 동물이든 메인 프로세스가 가진 동물인지 다시 검증한다.
  switchTo: (id) => ipcRenderer.invoke('collection:switch', id),
  onRefresh: (callback) => ipcRenderer.on('collection:refresh', () => callback()),
  close: () => ipcRenderer.send('collection:close'),
});
