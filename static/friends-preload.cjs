// 친구 창이 쓸 수 있는 통로만 좁게 연다.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('friendsApi', {
  lang: () => ipcRenderer.invoke('lang:get'),
  get: () => ipcRenderer.invoke('friends:get'),
  request: (login) => ipcRenderer.invoke('friends:request', login),
  respond: (id, accept) => ipcRenderer.invoke('friends:respond', id, accept),
  remove: (id) => ipcRenderer.invoke('friends:remove', id),
  companion: (id) => ipcRenderer.invoke('friends:companion', id),
  wave: (id) => ipcRenderer.invoke('friends:wave', id),
  gift: (id) => ipcRenderer.invoke('friends:gift', id),
  cosmetics: () => ipcRenderer.invoke('friends:cosmetics'),
  giftCosmetic: (id, kind, item) => ipcRenderer.invoke('friends:gift-cosmetic', id, kind, item),
  close: () => ipcRenderer.send('friends:close'),
});
