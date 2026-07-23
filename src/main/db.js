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

// 🔧 Buat tabel jika belum ada
function createTableIfNotExists(tableName, createQuery) {
  return new Promise((resolve, reject) => {
    db.run(createQuery, (err) => {
      if (err) return reject(err)
      resolve(`✅ Tabel '${tableName}' berhasil dibuat/diverifikasi`)
    })
  })
}

// 🔄 Jalankan semua alter schema di sini
export async function updateSchema() {
  try {
    // Buat tabel asset_snapshots untuk riwayat total aset
    await createTableIfNotExists('asset_snapshots', `
      CREATE TABLE IF NOT EXISTS asset_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tanggal DATE NOT NULL,
        waktu_transaksi DATETIME NOT NULL,
        total_aset DECIMAL(15,2) NOT NULL,
        transaksi_id INTEGER,
        keterangan TEXT,
        user_role TEXT DEFAULT 'kasir',
        user_name TEXT DEFAULT 'System',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (transaksi_id) REFERENCES transaksi(id)
      )
    `)

    // Tambahkan kolom user_role dan user_name jika belum ada
    await addColumnIfNotExists('asset_snapshots', 'user_role', 'TEXT DEFAULT "kasir"')
    await addColumnIfNotExists('asset_snapshots', 'user_name', 'TEXT DEFAULT "System"')

    const results = await Promise.all([
      addColumnIfNotExists('transaksi', 'nama_pelanggan', 'TEXT'),
      addColumnIfNotExists('transaksi', 'nomor_tujuan', 'TEXT'),
      
      // Kolom untuk tracking edit transaksi
      addColumnIfNotExists('transaksi', 'is_edited', 'BOOLEAN DEFAULT 0'),
      addColumnIfNotExists('transaksi', 'edited_at', 'DATETIME'),

      // Tambahan kolom tanggal di tabel yang kamu minta
      addColumnIfNotExists('pindah_saldo', 'tanggal', 'DATETIME DEFAULT CURRENT_TIMESTAMP'),
      addColumnIfNotExists('ambil_saldo', 'tanggal_pengambilan', 'DATETIME DEFAULT CURRENT_TIMESTAMP'),
      addColumnIfNotExists('hutang', 'tanggal_transaksi', 'DATETIME DEFAULT CURRENT_TIMESTAMP'),
      addColumnIfNotExists('hutang', 'status_bayar', 'BOOLEAN DEFAULT 0'),
      addColumnIfNotExists('hutang', 'tanggal_bayar_hutang', 'DATETIME '),
    ])

    results.forEach(msg => console.log(msg))
  } catch (err) {
    console.error('❌ Gagal update schema:', err)
  }
}

// 📊 FUNGSI UNTUK ASSET SNAPSHOTS

// Mengambil semua snapshot aset
export function getAssetSnapshots() {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        id,
        tanggal,
        waktu_transaksi,
        total_aset,
        transaksi_id,
        keterangan,
        user_role,
        user_name,
        created_at
      FROM asset_snapshots 
      ORDER BY waktu_transaksi DESC
    `, [], (err, rows) => {
      if (err) {
        console.error('❌ Error getAssetSnapshots:', err)
        reject(err)
      } else {
        resolve(rows || [])
      }
    })
  })
}

// Menyimpan snapshot aset baru
export function saveAssetSnapshot(data) {
  return new Promise((resolve, reject) => {
    const { tanggal, waktu_transaksi, total_aset, transaksi_id, keterangan, user_role, user_name } = data
    
    db.run(`
      INSERT INTO asset_snapshots (tanggal, waktu_transaksi, total_aset, transaksi_id, keterangan, user_role, user_name)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [tanggal, waktu_transaksi, total_aset, transaksi_id || null, keterangan || null, user_role || 'kasir', user_name || 'System'], function(err) {
      if (err) {
        console.error('❌ Error saveAssetSnapshot:', err)
        reject(err)
      } else {
        console.log('✅ Asset snapshot saved, ID:', this.lastID)
        resolve({ 
          id: this.lastID,
          success: true,
          message: 'Snapshot aset berhasil disimpan'
        })
      }
    })
  })
}

// Menghapus snapshot aset
export function deleteAssetSnapshot(id) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM asset_snapshots WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('❌ Error deleteAssetSnapshot:', err)
        reject(err)
      } else {
        console.log('✅ Asset snapshot deleted, changes:', this.changes)
        resolve({
          success: true,
          changes: this.changes,
          message: 'Snapshot berhasil dihapus'
        })
      }
    })
  })
}

// Menghapus semua snapshot aset
export function deleteAllAssetSnapshots() {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM asset_snapshots', [], function(err) {
      if (err) {
        console.error('❌ Error deleteAllAssetSnapshots:', err)
        reject(err)
      } else {
        console.log('✅ All asset snapshots deleted, changes:', this.changes)
        resolve({
          success: true,
          changes: this.changes,
          message: `${this.changes} snapshot berhasil dihapus`
        })
      }
    })
  })
}
export function getLastTotalAssetNoEdit() {
  return new Promise((resolve, reject) => {
    db.get(`
      SELECT total_aset FROM asset_snapshots 
      WHERE is_edited = 0 
      ORDER BY waktu_transaksi DESC 
      LIMIT 1
    `, [], (err, row) => {
      if (err) {
        console.error('❌ Error getLastTotalAssetNoEdit:', err)
        reject(err)
      } else {
        resolve(Number(row?.total_aset || 0))
      }
    })
  })
}

// Menghitung total aset keseluruhan dari semua sumber dana
export function calculateTotalAssets() {
  return new Promise((resolve, reject) => {
    // Cek dulu struktur tabel saldo_awal
    db.all("PRAGMA table_info(saldo_awal)", [], (err, columns) => {
      if (err) {
        console.error('❌ Error checking saldo_awal structure:', err)
        return reject(err)
      }
      
      console.log('🔍 Columns in saldo_awal:', columns.map(col => col.name))
      
      // Query tanpa WHERE status jika kolom status tidak ada
      const hasStatusColumn = columns.some(col => col.name === 'status')
      const query = hasStatusColumn ? 
        `SELECT COALESCE(SUM(saldo), 0) as total_aset FROM saldo_awal WHERE status = 'aktif'` :
        `SELECT COALESCE(SUM(saldo), 0) as total_aset FROM saldo_awal`
      
      db.get(query, [], (err, row) => {
        if (err) {
          console.error('❌ Error calculateTotalAssets:', err)
          reject(err)
        } else {
          const total = Number(row?.total_aset || 0)
          console.log('💰 Total assets calculated:', total)
          resolve(total)
        }
      })
    })
  })
}

export default db
