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

  // saldo awal
  getSaldoAwal: () => ipcRenderer.invoke('get-saldo-awal'),
  createSaldoAwal: (data) => ipcRenderer.invoke('create-saldo-awal', data),
  updateSaldoAwal: (data) => ipcRenderer.invoke('update-saldo-awal', data),
  deleteSaldoAwal: (id) => ipcRenderer.invoke('delete-saldo-awal', id),

  // pindah saldo
  getPindahSaldo: () => ipcRenderer.invoke('get-pindah-saldo'),
  createPindahSaldo: (data) => ipcRenderer.invoke('create-pindah-saldo', data),
  updatePindahSaldo: (data) => ipcRenderer.invoke('update-pindah-saldo', data),
  deletePindahSaldo: (id) => ipcRenderer.invoke('delete-pindah-saldo', id),

  // ambil saldo - make sure these are correctly defined
  getAmbilSaldo: () => ipcRenderer.invoke('get-ambil-saldo'),
  createAmbilSaldo: (data) => ipcRenderer.invoke('create-ambil-saldo', data),
  updateAmbilSaldo: (data) => ipcRenderer.invoke('update-ambil-saldo', data),
  deleteAmbilSaldo: (id) => ipcRenderer.invoke('delete-ambil-saldo', id),

  // kelola toko
  getToko: () => ipcRenderer.invoke('get-toko'),
  createToko: (data) => ipcRenderer.invoke('create-toko', data),
  updateToko: (data) => ipcRenderer.invoke('update-toko', data),
  deleteToko: (id) => ipcRenderer.invoke('delete-toko', id),
  getTokoById: (id) => ipcRenderer.invoke('get-toko-by-id', id),
  getTokoWithEmployeeCount: () => ipcRenderer.invoke('get-toko-with-employee-count'),

  // kelola karyawan
  getKaryawan: (toko_id) => ipcRenderer.invoke('get-karyawan', toko_id),
  createKaryawan: (data) => ipcRenderer.invoke('create-karyawan', data),
  updateKaryawan: (data) => ipcRenderer.invoke('update-karyawan', data),
  deleteKaryawan: (id) => ipcRenderer.invoke('delete-karyawan', id)
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
