import { contextBridge, ipcRenderer } from 'electron'

import { electronAPI } from '@electron-toolkit/preload'

console.log('✅ Preload file executed awaok') 

// Custom APIs for renderer
const api = {
  getUsers: () => ipcRenderer.invoke('get-users'),
  createUser: (user) => ipcRenderer.invoke('create-user', user),
  updateUser: (user) => ipcRenderer.invoke('update-user', user),
  deleteUser: (userId) => ipcRenderer.invoke('delete-user', userId),
  getUserRole: (email) => ipcRenderer.invoke('get-user-role', email)
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
