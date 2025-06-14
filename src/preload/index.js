import { contextBridge, ipcRenderer } from 'electron'

import { electronAPI } from '@electron-toolkit/preload'

console.log('✅ Preload file executed awaok') 

// Custom APIs for renderer
const api = {
  getUsers: () => ipcRenderer.invoke('get-users'),
  createUser: (user) => ipcRenderer.invoke('create-user', user),
  updateUser: (user) => ipcRenderer.invoke('update-user', user),
  deleteUser: (userId) => ipcRenderer.invoke('delete-user', userId),
  getUserRole: (username) => ipcRenderer.invoke('get-user-role', email),
  getSaldoAwal: () => ipcRenderer.invoke('get-saldo-awal'),
  createSaldoAwal: (data) => ipcRenderer.invoke('create-saldo-awal', data),
  updateSaldoAwal: (data) => ipcRenderer.invoke('update-saldo-awal', data),
  deleteSaldoAwal: (id) => ipcRenderer.invoke('delete-saldo-awal', id),
}


// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    console.log('✅ Preload is loaded')

  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
