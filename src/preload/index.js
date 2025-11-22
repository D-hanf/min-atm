import { contextBridge, ipcRenderer } from 'electron'

import { electronAPI } from '@electron-toolkit/preload'

console.log('✅ Preload file executed awaok')

// Custom APIs for renderer
const api = {
  getUsers: () => ipcRenderer.invoke('get-users'),
  createUser: (user) => ipcRenderer.invoke('create-user', user),
  updateUser: (user) => ipcRenderer.invoke('update-user', user),
  deleteUser: (userId) => ipcRenderer.invoke('delete-user', userId),
  getUserRole: (username) => ipcRenderer.invoke('get-user-role', username),

  // saldo awal
  getSaldoAwal: () => ipcRenderer.invoke('get-saldo-awal'),
  createSaldoAwal: (data) => ipcRenderer.invoke('create-saldo-awal', data),
  updateSaldoAwal: (data) => ipcRenderer.invoke('update-saldo-awal', data),
  deleteSaldoAwal: (id) => ipcRenderer.invoke('delete-saldo-awal', id),

  // hutang
  getHutang: (params) => ipcRenderer.invoke('get-hutang', params),
  createHutang: (data) => ipcRenderer.invoke('create-hutang', data),
  updateHutang: (data) => ipcRenderer.invoke('update-hutang', data),
  deleteHutang: (id) => ipcRenderer.invoke('delete-hutang', id),
  toggleStatusHutang: (data) => ipcRenderer.invoke('toggle-status-hutang', data ),
  
  // save summary data
  saveSummaryData: (data) => ipcRenderer.invoke('saveSummaryData', data),
  // ambil summary_log
  getSummaryLog: () => ipcRenderer.invoke('getSummaryLog'),
  
  // pindah saldo
  getPindahSaldo: (params) => ipcRenderer.invoke('get-pindah-saldo', params),
  createPindahSaldo: (data) => ipcRenderer.invoke('create-pindah-saldo', data),
  updatePindahSaldo: (data) => ipcRenderer.invoke('update-pindah-saldo', data),
  deletePindahSaldo: (id) => ipcRenderer.invoke('delete-pindah-saldo', id),

  // laporan keuangan
  getLaporanKeuangan: (role) => ipcRenderer.invoke('get-laporan-keuangan', role),

  // snapshot saldo awal
  getSnapshotSaldoAwal: (params) => ipcRenderer.invoke('get-snapshot-saldo-awal', params),
  saveSnapshotSaldoAwal: (periodeManual) => ipcRenderer.invoke('save-snapshot-saldo-awal', periodeManual),

  // ambil saldo - make sure these are correctly defined
  getAmbilSaldo: (params) => ipcRenderer.invoke('get-ambil-saldo', params),
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
  deleteKaryawan: (id) => ipcRenderer.invoke('delete-karyawan', id),
  countKaryawan: () => ipcRenderer.invoke('count-karyawan'),

  // login
  loginUser: (credentials) => ipcRenderer.invoke('login-user', credentials),

  // transaksi
  getTransaksi: (role) => ipcRenderer.invoke('get-transaksi', role),
  createTransaksi: (data) => ipcRenderer.invoke('create-transaksi', data),
  editTransaksi: (data) => ipcRenderer.invoke('edit-transaksi', data),
  deleteTransaksi: (id) => ipcRenderer.invoke('delete-transaksi', id),
  getTransaksiSummary: (role) => ipcRenderer.invoke('get-transaksi-summary', role),

  // asset snapshots
  getAssetSnapshots: () => ipcRenderer.invoke('get-asset-snapshots'),
  saveAssetSnapshot: (data) => ipcRenderer.invoke('save-asset-snapshot', data),
  deleteAssetSnapshot: (id) => ipcRenderer.invoke('delete-asset-snapshot', id),
  calculateTotalAssets: () => ipcRenderer.invoke('calculate-total-assets')
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
