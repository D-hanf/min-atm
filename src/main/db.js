// src/main/db.js

import { app } from 'electron'
import path from 'path'
import sqlite3 from 'sqlite3'

const dbPath = path.join(app.getPath('userData'), 'miniAtm.db')
console.log('📁 Lokasi fix database:', dbPath)

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message)
  } else {
    console.log('✅ Connected to the SQLite database.')
  }
})

// 🔧 Cek dan tambah kolom kalau belum ada
function addColumnIfNotExists(tableName, columnName, columnDef) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName});`, [], (err, columns) => {
      if (err) return reject(err)

      const exists = columns.some(col => col.name === columnName)
      if (exists) return resolve(`⚠️ Kolom '${columnName}' sudah ada`)

      db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`, (err2) => {
        if (err2) return reject(err2)
        resolve(`✅ Kolom '${columnName}' ditambahkan`)
      })
    })
  })
}

// 🔄 Jalankan semua alter schema di sini
export async function updateSchema() {
  try {
    const msg1 = await addColumnIfNotExists('transaksi', 'nama_pelanggan', 'TEXT')
    const msg2 = await addColumnIfNotExists('transaksi', 'nomor_tujuan', 'TEXT')
    console.log(msg1)
    console.log(msg2)
  } catch (err) {
    console.error('❌ Gagal update schema:', err)
  }
}

export default db
