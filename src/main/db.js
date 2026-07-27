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

// 🌱 Seed 3 alat default (hanya kalau tabel alat masih kosong, tidak akan menimpa data yang sudah diubah admin)
function seedDefaultAlat() {
  return new Promise((resolve, reject) => {
    db.get(`SELECT COUNT(*) as count FROM alat`, [], (err, row) => {
      if (err) return reject(err)
      if (row.count > 0) return resolve('⚠️ Data alat sudah ada, skip seeding')

      const defaultAlat = ['EDC BNI', 'EDC BTN', 'EDC BUKU WARUNG']
      const stmt = db.prepare(`INSERT INTO alat (nama_alat, is_active) VALUES (?, 1)`)
      defaultAlat.forEach((nama) => stmt.run(nama))
      stmt.finalize((err2) => {
        if (err2) return reject(err2)
        resolve('✅ Seed default alat berhasil (EDC BNI, EDC BTN, EDC BUKU WARUNG)')
      })
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

    // 💸 Tabel aturan fee berjenjang per jenis transaksi
    // (mis. Tarik Tunai 0 - 1jt = fee 2000, 1jt - 5jt = fee 5000, dst)
    await createTableIfNotExists('fee_rules', `
      CREATE TABLE IF NOT EXISTS fee_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        jenis_transaksi TEXT NOT NULL,
        nominal_min DECIMAL(15,2) NOT NULL DEFAULT 0,
        nominal_max DECIMAL(15,2),
        fee DECIMAL(15,2) NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 🖥️ Tabel master alat (EDC dll) yang dipakai untuk transaksi Cek Saldo (dan alat lain ke depannya)
    await createTableIfNotExists('alat', `
      CREATE TABLE IF NOT EXISTS alat (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_alat TEXT NOT NULL,
        keterangan TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 🎁 Tabel aturan bonus berjenjang per alat (bonus dari bank penyedia alat, makin besar nominal makin besar bonus)
    await createTableIfNotExists('alat_bonus_rules', `
      CREATE TABLE IF NOT EXISTS alat_bonus_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alat_id INTEGER NOT NULL,
        nominal_min DECIMAL(15,2) NOT NULL DEFAULT 0,
        nominal_max DECIMAL(15,2),
        bonus DECIMAL(15,2) NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (alat_id) REFERENCES alat(id)
      )
    `)

    // Seed 3 alat default (EDC BNI, EDC BTN, EDC BUKU WARUNG) kalau tabel alat masih kosong
    await seedDefaultAlat()

    // Kolom bonus per alat: bonus_cek_saldo & bonus_tarik_tunai dipakai untuk auto-fill
    // nominal bonus di form transaksi, sumber_dana_bonus_id adalah default tujuan sumber
    // dana tempat bonus itu masuk (bisa diubah manual per transaksi)
    await addColumnIfNotExists('alat', 'bonus_cek_saldo', 'DECIMAL(15,2) DEFAULT 0')
    await addColumnIfNotExists('alat', 'bonus_tarik_tunai', 'DECIMAL(15,2) DEFAULT 0')
    await addColumnIfNotExists('alat', 'sumber_dana_bonus_id', 'INTEGER REFERENCES saldo_awal(id)')

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

      // 🚩 Kolom untuk fitur "Tandai Salah" (koreksi transaksi)
      addColumnIfNotExists('transaksi', 'is_marked_wrong', 'BOOLEAN DEFAULT 0'),
      addColumnIfNotExists('transaksi', 'marked_note', 'TEXT'),
      addColumnIfNotExists('transaksi', 'marked_by', 'TEXT'),
      addColumnIfNotExists('transaksi', 'marked_by_id', 'INTEGER'),
      addColumnIfNotExists('transaksi', 'marked_at', 'DATETIME'),

      addColumnIfNotExists('hutang', 'is_marked_wrong', 'BOOLEAN DEFAULT 0'),
      addColumnIfNotExists('hutang', 'marked_note', 'TEXT'),
      addColumnIfNotExists('hutang', 'marked_by', 'TEXT'),
      addColumnIfNotExists('hutang', 'marked_by_id', 'INTEGER'),
      addColumnIfNotExists('hutang', 'marked_at', 'DATETIME'),

      addColumnIfNotExists('pindah_saldo', 'is_marked_wrong', 'BOOLEAN DEFAULT 0'),
      addColumnIfNotExists('pindah_saldo', 'marked_note', 'TEXT'),
      addColumnIfNotExists('pindah_saldo', 'marked_by', 'TEXT'),
      addColumnIfNotExists('pindah_saldo', 'marked_by_id', 'INTEGER'),
      addColumnIfNotExists('pindah_saldo', 'marked_at', 'DATETIME'),

      addColumnIfNotExists('ambil_saldo', 'is_marked_wrong', 'BOOLEAN DEFAULT 0'),
      addColumnIfNotExists('ambil_saldo', 'marked_note', 'TEXT'),
      addColumnIfNotExists('ambil_saldo', 'marked_by', 'TEXT'),
      addColumnIfNotExists('ambil_saldo', 'marked_by_id', 'INTEGER'),
      addColumnIfNotExists('ambil_saldo', 'marked_at', 'DATETIME'),

      // 🎁 Kolom bonus dari alat (dipakai Cek Saldo, Tarik Tunai, Transfer, Jasa Transfer, Mode Pulsa)
      addColumnIfNotExists('transaksi', 'bonus', 'DECIMAL(15,2) DEFAULT 0'),
      addColumnIfNotExists('transaksi', 'is_bonus_manual', 'BOOLEAN DEFAULT 0'),
      addColumnIfNotExists('transaksi', 'alat_id', 'INTEGER REFERENCES alat(id)'),
      addColumnIfNotExists('transaksi', 'alat_nama', 'TEXT'),
      addColumnIfNotExists('transaksi', 'is_fee_manual', 'BOOLEAN DEFAULT 0'),
      // Sumber dana tujuan bonus yang BENAR-BENAR dipakai saat transaksi dibuat
      // (disimpan terpisah dari alat.sumber_dana_bonus_id supaya kalau default alat
      // diubah admin di kemudian hari, pembatalan/edit transaksi lama tetap akurat)
      addColumnIfNotExists('transaksi', 'bonus_sumber_dana_id', 'INTEGER REFERENCES saldo_awal(id)')
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

// 🚩 FUNGSI UNTUK FITUR "TANDAI SALAH" (koreksi transaksi)

// Whitelist tabel yang boleh ditandai — mencegah SQL injection lewat nama tabel,
// karena nama tabel/kolom tidak bisa diparameterisasi lewat placeholder '?'
const MARKABLE_TABLES = {
  transaksi: 'transaksi',
  hutang: 'hutang',
  pindah_saldo: 'pindah_saldo',
  ambil_saldo: 'ambil_saldo'
}

// Menandai satu baris data sebagai salah, lengkap dengan keterangan,
// siapa yang menandai (nama & id user), dan kapan waktunya (WIB, waktu lokal server).
export function markSalah({ table, id, keterangan, user_name, user_id }) {
  return new Promise((resolve, reject) => {
    const tableName = MARKABLE_TABLES[table]
    if (!tableName) return reject(new Error('Tabel tidak valid untuk ditandai'))
    if (!id) return reject(new Error('ID data tidak valid'))
    if (!keterangan || !keterangan.trim()) {
      return reject(new Error('Keterangan kesalahan wajib diisi'))
    }

    db.run(
      `UPDATE ${tableName}
       SET is_marked_wrong = 1,
           marked_note = ?,
           marked_by = ?,
           marked_by_id = ?,
           marked_at = datetime('now', 'localtime')
       WHERE id = ?`,
      [keterangan.trim(), user_name || '-', user_id ?? null, id],
      function (err) {
        if (err) {
          console.error('❌ Error markSalah:', err)
          return reject(err)
        }
        console.log(`✅ Data ${tableName}#${id} ditandai salah oleh ${user_name || '-'}`)
        resolve({ success: true, changes: this.changes })
      }
    )
  })
}

// Membatalkan penandaan salah pada satu baris data.
export function unmarkSalah({ table, id }) {
  return new Promise((resolve, reject) => {
    const tableName = MARKABLE_TABLES[table]
    if (!tableName) return reject(new Error('Tabel tidak valid'))
    if (!id) return reject(new Error('ID data tidak valid'))

    db.run(
      `UPDATE ${tableName}
       SET is_marked_wrong = 0,
           marked_note = NULL,
           marked_by = NULL,
           marked_by_id = NULL,
           marked_at = NULL
       WHERE id = ?`,
      [id],
      function (err) {
        if (err) {
          console.error('❌ Error unmarkSalah:', err)
          return reject(err)
        }
        console.log(`✅ Penandaan salah pada ${tableName}#${id} dibatalkan`)
        resolve({ success: true, changes: this.changes })
      }
    )
  })
}

export default db