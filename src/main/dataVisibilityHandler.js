import { app } from 'electron'
import fs from 'fs'
import { join } from 'path'

// ─────────────────────────────────────────────────────────
// Setting PER HALAMAN: "berapa hari ke belakang dari hari ini"
// data yang boleh dilihat role KASIR di halaman-halaman histori
// (Semua Transaksi, Koreksi Transaksi, Transaksi, Hutang, Ambil
// Saldo, Pindah Saldo). Role ADMIN selalu lihat semua data, tidak
// terpengaruh setting ini.
//
// TIDAK ADA opsi "tidak dibatasi" — kasir SELALU dibatasi. Default-nya
// 1 hari (hari ini saja), admin bisa naikkan jumlah harinya kapan saja,
// tapi tidak bisa menonaktifkan pembatasannya sama sekali.
//
// Tiap halaman punya setting SENDIRI-SENDIRI, dibedakan lewat
// `pageKey` (mis. 'semua-transaksi', 'koreksi-transaksi').
// Mengatur setting di satu halaman TIDAK mempengaruhi halaman lain.
//
// Disimpan sebagai file JSON terpisah di userData folder Electron
// (bukan di miniAtm.db) supaya tidak perlu migrasi skema DB.
// Struktur file:
// { "pages": { "semua-transaksi": { days }, "koreksi-transaksi": { days } } }
// ─────────────────────────────────────────────────────────

const DEFAULT_DAYS = 1

const getSettingsFilePath = () => join(app.getPath('userData'), 'data-visibility-settings.json')

function readAllSettings() {
  try {
    const raw = fs.readFileSync(getSettingsFilePath(), 'utf-8')
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null && typeof parsed.pages === 'object'
      ? parsed
      : { pages: {} }
  } catch (err) {
    // File belum ada / rusak / belum pernah disimpan → anggap belum ada setting sama sekali
    return { pages: {} }
  }
}

function writeAllSettings(allSettings) {
  fs.writeFileSync(getSettingsFilePath(), JSON.stringify(allSettings, null, 2), 'utf-8')
}

// Default (kalau admin belum pernah atur halaman ini): dibatasi 1 hari (hari ini saja)
export async function getDataVisibilitySetting(event, pageKey) {
  if (!pageKey) return { days: DEFAULT_DAYS }

  const allSettings = readAllSettings()
  const pageSetting = allSettings.pages?.[pageKey]

  if (!pageSetting) return { days: DEFAULT_DAYS }

  return {
    days: Number(pageSetting.days) > 0 ? Number(pageSetting.days) : DEFAULT_DAYS
  }
}

export async function saveDataVisibilitySetting(event, payload) {
  const pageKey = payload?.pageKey
  if (!pageKey) return { success: false, error: 'pageKey wajib diisi' }

  const days = Math.max(1, Number(payload?.days) || DEFAULT_DAYS)

  const allSettings = readAllSettings()
  allSettings.pages = allSettings.pages || {}
  allSettings.pages[pageKey] = { days }
  writeAllSettings(allSettings)

  return { success: true, pageKey, days }
}