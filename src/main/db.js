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
      if (exists) return resolve(`⚠️ Kolom '${columnName}' sudah ada di ${tableName}`)

      db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`, (err2) => {
        if (err2) return reject(err2)
        resolve(`✅ Kolom '${columnName}' ditambahkan ke ${tableName}`)
      })
    })
  })
}

// 🔄 Jalankan semua alter schema di sini
export async function updateSchema() {
  try {
    const results = await Promise.all([
      addColumnIfNotExists('transaksi', 'nama_pelanggan', 'TEXT'),
      addColumnIfNotExists('transaksi', 'nomor_tujuan', 'TEXT'),

      // Tambahan kolom tanggal di tabel yang kamu minta
      addColumnIfNotExists('pindah_saldo', 'tanggal', 'DATETIME DEFAULT CURRENT_TIMESTAMP'),
      addColumnIfNotExists('ambil_saldo', 'tanggal_pengambilan', 'DATETIME DEFAULT CURRENT_TIMESTAMP'),
      addColumnIfNotExists('hutang', 'tanggal_transaksi', 'DATETIME DEFAULT CURRENT_TIMESTAMP')
    ])

    results.forEach(msg => console.log(msg))
  } catch (err) {
    console.error('❌ Gagal update schema:', err)
  }
}

export default db
