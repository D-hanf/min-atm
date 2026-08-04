import { BrowserWindow, app, screen } from 'electron'
import {
  createAlat,
  createAlatBonusJenisRule,
  createAlatBonusRule,
  createFeeRule,
  deleteAlat,
  deleteAlatBonusJenisRule,
  deleteAlatBonusRule,
  deleteFeeRule,
  getAlat,
  getAlatBonusJenisRules,
  getAlatBonusRules,
  getFeeRules,
  updateAlat,
  updateAlatBonusJenisRule,
  updateAlatBonusRule,
  updateFeeRule
} from './feeAlatHandler.js'
import {
  createTransaksi,
  deleteTransaksi,
  editTransaksi,
  getTransaksi,
  getTransaksiSummary
} from './transactionHandler.js'
import { markBenar, markSalah, unmarkBenar, unmarkSalah, updateSchema } from './db.js'

import { Menu } from 'electron'
import dayjs from 'dayjs'
import db from './db.js'
import { getLaporanKeuangan } from './laporanHandler.js'
import icon from '../../resources/iconNew.jpg?asset'
import { ipcMain } from 'electron'
import { is } from '@electron-toolkit/utils'
import { join } from 'path'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

// sesuaikan path relatif ke lokasi file feeAlatHandler.js kamu

dayjs.extend(utc)
dayjs.extend(timezone)

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const mainWindow = new BrowserWindow({
    width,
    height,
    frame: true, // <- biar tombol exit tetap ada
    autoHideMenuBar: true, // <- hilangkan menu bar atas
    title: 'Mini  by Jaya Mart',
    show: false,
    ...(process.platform === 'linux' ? { icon } : { icon }),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })
  mainWindow.maximize()
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })
  mainWindow.webContents.on('context-menu', (event, params) => {
    const menu = Menu.buildFromTemplate([
      {
        label: 'Cut',
        role: 'cut',
        enabled: params.editFlags.canCut
      },
      {
        label: 'Copy',
        role: 'copy',
        enabled: params.editFlags.canCopy
      },
      {
        label: 'Paste',
        role: 'paste',
        enabled: params.editFlags.canPaste
      },
      {
        type: 'separator'
      },
      {
        label: 'Select All',
        role: 'selectAll'
      }
    ])
    menu.popup({
      window: mainWindow
    })
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}
const getTodayWIB = () => {
  return dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD')
}
app.whenReady().then(async () => {
  db.serialize(() => {
    // Tabel snapshot saldo awal
    db.run(`
      CREATE TABLE IF NOT EXISTS saldo_snapshot (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sumber_dana_id INTEGER,
        nama_sumber_dana TEXT,
        saldo_awal REAL,
        periode TEXT, -- format 'YYYY-MM'
        tanggal_snapshot DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Tabel toko
    db.run(`
      CREATE TABLE IF NOT EXISTS toko (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_toko TEXT NOT NULL,
        no_telepon TEXT,
        alamat TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
`)

    // Tabel users
    db.run(`
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    no_telepon TEXT,
    role TEXT NOT NULL,
    toko_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (toko_id) REFERENCES toko(id) 
  )
`)

    // Tabel karyawan
    db.run(`
      CREATE TABLE IF NOT EXISTS karyawan (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        toko_id INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (toko_id) REFERENCES toko(id)
      )
    `)
    db.run(`
      CREATE TABLE IF NOT EXISTS saldo_awal (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_sumber_dana TEXT NOT NULL,
        saldo REAL NOT NULL,
        biaya_admin REAL DEFAULT 0,
        keterangan TEXT,
        tanggal_buat DATETIME DEFAULT CURRENT_TIMESTAMP,
        tanggal_update DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Tabel untuk log summary keuangan dan saldo awal
    db.run(`
      CREATE TABLE IF NOT EXISTS summary_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        waktu TEXT NOT NULL,
        summary_json TEXT NOT NULL
      )
    `)
    db.run(`
      CREATE TABLE IF NOT EXISTS transaksi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
        no_transaksi TEXT UNIQUE NOT NULL,
        sumber_dana_id INTEGER,
        jenis_transaksi TEXT NOT NULL,
        tipe_transaksi TEXT,
        nominal_transaksi REAL,
        terima_dana_id INTEGER,
        biaya_admin_bank REAL DEFAULT 0,
        fee REAL DEFAULT 0,
        metode_pembayaran TEXT,
        keterangan TEXT,
        nama_pelanggan TEXT,
        nomor_tujuan TEXT,
        FOREIGN KEY (sumber_dana_id) REFERENCES saldo_awal(id),
        FOREIGN KEY (terima_dana_id) REFERENCES saldo_awal(id)
      )
    `)
    db.run(`
      CREATE TABLE IF NOT EXISTS pindah_saldo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sumber_dana_id INTEGER NOT NULL,
      tujuan_dana_id INTEGER NOT NULL,
      user_pemindah_id INTEGER NOT NULL,
      nominal REAL NOT NULL,
      platform TEXT,
      biaya_admin REAL DEFAULT 0,
      saldo_sumber REAL NOT NULL,
      saldo_tujuan REAL NOT NULL,
      keterangan TEXT,
      tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sumber_dana_id) REFERENCES saldo_awal(id),
      FOREIGN KEY (tujuan_dana_id) REFERENCES saldo_awal(id),
      FOREIGN KEY (user_pemindah_id) REFERENCES users(id)
      )
    `)
    db.run(`
      CREATE TABLE IF NOT EXISTS ambil_saldo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      petugas_pengambil_id INTEGER NOT NULL,
      platform TEXT NOT NULL,
      saldo_platform REAL NOT NULL,
      nominal_pengambilan REAL NOT NULL,
      biaya_admin REAL DEFAULT 0,
      metode_pengambilan TEXT,
      tujuan_pengambilan TEXT,
      tanggal_pengambilan DATETIME DEFAULT CURRENT_TIMESTAMP,
      keterangan TEXT,
      FOREIGN KEY (petugas_pengambil_id) REFERENCES users(id)
      )
    `)
    db.run(`CREATE TABLE IF NOT EXISTS history_transaksi (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaksi_id INTEGER NOT NULL,
      sumber_dana_id INTEGER NOT NULL,
      sumber_dana_saldo_sebelum REAL NOT NULL,
      terima_dana_id INTEGER,
      terima_dana_saldo_sebelum REAL,
      FOREIGN KEY (transaksi_id) REFERENCES transaksi(id),
      FOREIGN KEY (sumber_dana_id) REFERENCES saldo_awal(id),
      FOREIGN KEY (terima_dana_id) REFERENCES saldo_awal(id)
    )
  `)

    // Tabel laporan_keuangan
    db.run(`CREATE TABLE IF NOT EXISTS laporan_keuangan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tanggal DATETIME,
      sumber_dana TEXT,
      terima_dana_nama TEXT,
      jenis_transaksi TEXT,
      nominal_transaksi REAL,
      nominal_masuk REAL,
      keuntungan REAL,
      total_hutang REAL DEFAULT 0,
      sumber_id INTEGER,
      terima_id INTEGER,
      keterangan TEXT
    )`)
    db.run(`CREATE TABLE IF NOT EXISTS hutang (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    petugas_id INTEGER NOT NULL,
    platform_id TEXT NOT NULL,
    saldo_platform REAL NOT NULL,
    jenis_transaksi TEXT NOT NULL, -- 'Ambil Hutang' or 'Bayar Hutang'
    nominal_transaksi REAL NOT NULL,
    biaya_admin REAL DEFAULT 0,
    tanggal_transaksi DATETIME DEFAULT CURRENT_TIMESTAMP,
    keterangan TEXT,
    FOREIGN KEY (petugas_id) REFERENCES users(id),
    FOREIGN KEY (platform_id) REFERENCES saldo_awal(id)
  )`)
    // Tabel riwayat hutang (audit trail)
    db.run(`
      CREATE TABLE IF NOT EXISTS hutang_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hutang_id INTEGER,
        action TEXT NOT NULL, -- create|update|toggle|delete
        actor_role TEXT,
        actor_id INTEGER,
        platform_id INTEGER,
        saldo_platform REAL,
        nominal_transaksi REAL,
        biaya_admin REAL,
        status_bayar INTEGER,
        jenis_transaksi TEXT,
        tanggal_transaksi DATETIME,
        tanggal_bayar_hutang DATETIME,
        keterangan TEXT,
        amount_effect REAL DEFAULT 0, -- efek ke saldo_awal (positif menambah, negatif mengurangi)
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    // db.run(`ALTER TABLE users ADD COLUMN toko_id INTEGER`) =>  untuk menambahkan kolom toko_id&no_telepon di table users
    // Insert toko

    // Cek dulu apakah toko "Toko Alpha" sudah ada
    db.get(`SELECT id FROM toko WHERE nama_toko = ?`, ['Toko Alpha'], (err, tokoRow) => {
      if (err) {
        console.error('❌ Gagal cek toko:', err)
        return
      }

      if (tokoRow) {
        console.log('ℹ️ Toko Alpha sudah ada. Tidak perlu insert ulang.')
        return
      }

      // Insert Toko Alpha
      db.run(
        `INSERT INTO toko (nama_toko, no_telepon, alamat) VALUES (?, ?, ?)`,
        ['Toko Alpha', '081234567890', 'Jl. Contoh No.1'],
        function (err) {
          if (err) {
            console.error('❌ Gagal insert toko:', err)
            return
          }

          const tokoId = this.lastID

          // Insert user admin hanya jika username belum ada
          db.get(`SELECT id FROM users WHERE username = ?`, ['admin'], (err, userRow) => {
            if (err) {
              console.error('❌ Gagal cek user admin:', err)
              return
            }

            if (userRow) {
              console.log('ℹ️ User admin sudah ada. Tidak perlu insert ulang.')
              return
            }

            db.run(
              `INSERT INTO users (nama, username, password, no_telepon, role, toko_id)
           VALUES (?, ?, ?, ?, ?, ?)`,
              ['Admin Satu', 'admin', 'admin123', '081234567890', 'admin', tokoId],
              function (err) {
                if (err) {
                  console.error('❌ Gagal insert user admin:', err)
                  return
                }

                const userId = this.lastID

                // Insert ke tabel karyawan (jika perlu)
                db.run(
                  `INSERT INTO karyawan (user_id, toko_id) VALUES (?, ?)`,
                  [userId, tokoId],
                  function (err) {
                    if (err) {
                      console.error('❌ Gagal insert ke tabel karyawan:', err)
                    } else {
                      console.log('✅ Dummy data berhasil dimasukkan.')
                    }
                  }
                )
              }
            )
          })
        }
      )
    })

    // REGISTER IPC HANDLERS

    // Handler untuk simpan summary keuangan dan saldo awal
    ipcMain.handle('saveSummaryData', async (event, summaryData) => {
      return new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO summary_log (waktu, summary_json) VALUES (?, ?)',
          [summaryData.waktu, JSON.stringify(summaryData)],
          function (err) {
            if (err) {
              console.error('❌ Gagal simpan summary_log:', err)
              reject(err)
            } else {
              resolve({ success: true, id: this.lastID })
            }
          }
        )
      })
    })

    // IPC handlers untuk fee dari admin
    ipcMain.handle('getFeeRules', getFeeRules)
    ipcMain.handle('createFeeRule', createFeeRule)
    ipcMain.handle('updateFeeRule', updateFeeRule)
    ipcMain.handle('deleteFeeRule', deleteFeeRule)



    // IPC handlers untuk alat cek saldo
    ipcMain.handle('getAlat', getAlat)
    ipcMain.handle('createAlat', createAlat)
    ipcMain.handle('updateAlat', updateAlat)
    ipcMain.handle('deleteAlat', deleteAlat)

    ipcMain.handle('getAlatBonusRules', getAlatBonusRules)
    ipcMain.handle('createAlatBonusRule', createAlatBonusRule)
    ipcMain.handle('updateAlatBonusRule', updateAlatBonusRule)
    ipcMain.handle('deleteAlatBonusRule', deleteAlatBonusRule)

    // IPC handlers untuk bonus berjenjang per alat + per jenis transaksi
    ipcMain.handle('getAlatBonusJenisRules', getAlatBonusJenisRules)
    ipcMain.handle('createAlatBonusJenisRule', createAlatBonusJenisRule)
    ipcMain.handle('updateAlatBonusJenisRule', updateAlatBonusJenisRule)
    ipcMain.handle('deleteAlatBonusJenisRule', deleteAlatBonusJenisRule)

    // Handler untuk ambil data summary_log
    ipcMain.handle('getSummaryLog', async () => {
      return new Promise((resolve, reject) => {
        db.all(
          'SELECT id, waktu, summary_json FROM summary_log ORDER BY id DESC',
          [],
          (err, rows) => {
            if (err) {
              console.error('❌ Gagal ambil summary_log:', err)
              reject(err)
            } else {
              console.log('[DEBUG] summary_log rows:', rows)
              // Parse summary_json agar langsung bisa dipakai di frontend
              const parsedRows = rows.map((row) => {
                let parsed = {}
                try {
                  parsed = JSON.parse(row.summary_json)
                } catch (e) {
                  console.warn('[DEBUG] Gagal parse summary_json:', row.summary_json, e)
                }
                return {
                  id: row.id,
                  waktu_simpan: row.waktu,
                  ...parsed
                }
              })
              console.log('[DEBUG] parsedRows:', parsedRows)
              resolve(parsedRows)
            }
          }
        )
      })
    })

    ipcMain.handle('get-users', () => {
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM users', [], (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
          console.log(rows)
        })
      })
    })

    ipcMain.handle('create-user', (event, user) => {
      return new Promise((resolve, reject) => {
        const query = `INSERT INTO users (nama, username, password, role) VALUES (?, ?, ?, ?)`
        db.run(query, [user.nama, user.username, user.password, user.role], function (err) {
          if (err) reject(err)
          else resolve({ id: this.lastID })
        })
      })
    })

    ipcMain.handle('update-user', (event, user) => {
      return new Promise((resolve, reject) => {
        const query = `UPDATE users SET nama = ?, username = ?, password = ?, role = ? WHERE id = ?`
        db.run(
          query,
          [user.nama, user.username, user.password, user.role, user.id],
          function (err) {
            if (err) reject(err)
            else resolve({ changes: this.changes })
          }
        )
      })
    })

    ipcMain.handle('delete-user', (event, id) => {
      return new Promise((resolve, reject) => {
        db.run(`DELETE FROM users WHERE id = ?`, [id], function (err) {
          if (err) reject(err)
          else resolve({ changes: this.changes })
        })
      })
    })

    ipcMain.handle('get-user-role', (event, username) => {
      return new Promise((resolve, reject) => {
        db.get(`SELECT role FROM users WHERE username = ?`, [username], (err, row) => {
          if (err) reject(err)
          else resolve(row ? row.role : null)
        })
      })
    })

    // ============================= laporan keuangan handler =============================
    // Logic-nya sudah dipindah ke laporanHandler.js (getLaporanKeuangan) — di-import di atas.
    // JANGAN taruh logic query/format laporan di sini lagi, biar nggak ada 2 versi yang beda.
    ipcMain.handle('get-laporan-keuangan', getLaporanKeuangan)
    // // Fungsi untuk simpan snapshot saldo awal tiap awal bulan
    function saveMonthlySnapshotIfNeeded() {
      const periode = dayjs().tz('Asia/Jakarta').format('YYYY-MM')
      db.get(
        'SELECT COUNT(*) as count FROM saldo_snapshot WHERE periode = ?',
        [periode],
        (err, row) => {
          if (err) return console.error('❌ Error cek snapshot:', err)
          if (row.count > 0) return // Sudah ada snapshot bulan ini

          // Ambil semua saldo_awal
          db.all('SELECT id, nama_sumber_dana, saldo FROM saldo_awal', [], (err, rows) => {
            if (err) return console.error('❌ Error ambil saldo_awal:', err)
            rows.forEach((item) => {
              db.run(
                `INSERT INTO saldo_snapshot (sumber_dana_id, nama_sumber_dana, saldo_awal, periode) VALUES (?, ?, ?, ?)`,
                [item.id, item.nama_sumber_dana, item.saldo, periode],
                function (err) {
                  if (err) console.error('❌ Error insert snapshot:', err)
                }
              )
            })
            console.log('✅ Snapshot saldo awal bulan', periode, 'tersimpan')
          })
        }
      )
    }

    // Panggil fungsi ini saat startup
    saveMonthlySnapshotIfNeeded()
    // Handler IPC untuk ambil snapshot saldo awal
    ipcMain.handle('get-snapshot-saldo-awal', (event, params) => {
      // params: { periode, tipe }
      const { periode, tipe } =
        typeof params === 'object' ? params : { periode: params, tipe: 'bulanan' }
      return new Promise((resolve, reject) => {
        if (tipe === 'tahunan') {
          // Query semua snapshot saldo awal untuk tahun tersebut
          db.all(
            'SELECT * FROM saldo_snapshot WHERE substr(periode, 1, 4) = ?',
            [periode],
            (err, rows) => {
              if (err) reject(err)
              else resolve(rows)
            }
          )
        } else {
          // Query snapshot saldo awal untuk bulan tertentu
          db.all('SELECT * FROM saldo_snapshot WHERE periode = ?', [periode], (err, rows) => {
            if (err) reject(err)
            else resolve(rows)
          })
        }
      })
    })

    // Handler IPC untuk simpan snapshot manual (jika perlu)
    ipcMain.handle('save-snapshot-saldo-awal', (event, periodeManual) => {
      const periode = periodeManual || dayjs().tz('Asia/Jakarta').format('YYYY-MM')
      return new Promise((resolve, reject) => {
        db.get(
          'SELECT COUNT(*) as count FROM saldo_snapshot WHERE periode = ?',
          [periode],
          (err, row) => {
            if (err) return reject(err)
            if (row.count > 0)
              return resolve({ success: false, message: 'Snapshot sudah ada untuk periode ini.' })
            db.all('SELECT id, nama_sumber_dana, saldo FROM saldo_awal', [], (err, rows) => {
              if (err) return reject(err)
              let inserted = 0
              rows.forEach((item) => {
                db.run(
                  `INSERT INTO saldo_snapshot (sumber_dana_id, nama_sumber_dana, saldo_awal, periode) VALUES (?, ?, ?, ?)`,
                  [item.id, item.nama_sumber_dana, item.saldo, periode],
                  function (err) {
                    if (!err) inserted++
                  }
                )
              })
              resolve({ success: true, inserted })
            })
          }
        )
      })
    })
    // ============================= saldo awal handler =============================

    ipcMain.handle('get-saldo-awal', () => {
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM saldo_awal', [], (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        })
      })
    })

    ipcMain.handle('create-saldo-awal', (event, data) => {
      const { nama_sumber_dana, saldo, biaya_admin, keterangan, tanggal_buat, tanggal_update } =
        data
      const query = `
    INSERT INTO saldo_awal (nama_sumber_dana, saldo, biaya_admin, keterangan, tanggal_buat, tanggal_update)
    VALUES (?, ?, ?, ?, ?, ?)
  `
      return new Promise((resolve, reject) => {
        db.run(
          query,
          [nama_sumber_dana, saldo, biaya_admin, keterangan, tanggal_buat, tanggal_update],
          function (err) {
            if (err) reject(err)
            else resolve({ id: this.lastID })
          }
        )
      })
    })

    ipcMain.handle('update-saldo-awal', (event, data) => {
      const { id, nama_sumber_dana, saldo, biaya_admin, keterangan, tanggal_update } = data
      const query = `
          UPDATE saldo_awal
          SET nama_sumber_dana = ?, saldo = ?, biaya_admin = ?, keterangan = ?, tanggal_update = ?
          WHERE id = ?
        `
      return new Promise((resolve, reject) => {
        db.run(
          query,
          [nama_sumber_dana, saldo, biaya_admin, keterangan, tanggal_update, id],
          function (err) {
            if (err) reject(err)
            else resolve({ changes: this.changes })
          }
        )
      })
    })

    ipcMain.handle('delete-saldo-awal', (event, id) => {
      return new Promise((resolve, reject) => {
        db.run('DELETE FROM saldo_awal WHERE id = ?', [id], function (err) {
          if (err) reject(err)
          else resolve({ changes: this.changes })
        })
      })
    })

    // ============================= end saldo awal handler =============================

    // ============================= Hutang handler =============================

    ipcMain.handle('get-hutang', async (event, role) => {
      const roleLower = (role || '').toLowerCase()
      const today = dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD')

      return new Promise((resolve, reject) => {
        const baseQuery = `
      SELECT h.*, s.nama_sumber_dana as platform_name, s.saldo as saldo_platform
      FROM hutang h
      LEFT JOIN saldo_awal s ON h.platform_id = s.id
    `
        const whereClause = roleLower === 'kasir' ? 'WHERE DATE(h.tanggal_transaksi) = ?' : ''
        const query = `${baseQuery} ${whereClause} ORDER BY h.status_bayar ASC, h.tanggal_transaksi DESC, h.id DESC`
        const params = roleLower === 'kasir' ? [today] : []

        db.all(query, params, (err, rows) => {
          if (err) {
            console.error('❌ Error fetching hutang:', err)
            return reject(err)
          }
          console.log(`✅ Retrieved ${rows.length} hutang for role ${roleLower}`)
          resolve(rows)
        })
      })
    })

    ipcMain.handle('toggle-status-hutang', async (event, updatedData) => {
      return new Promise((resolve) => {
        const { id: hutang_id, platform_id, jenis_transaksi } = updatedData
        const role = String(updatedData.role || 'kasir').toLowerCase()
        const today = dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD')

        db.serialize(() => {
          db.get(`SELECT * FROM hutang WHERE id = ?`, [hutang_id], (err, latestRecord) => {
            if (err || !latestRecord) {
              console.error('❌ Gagal ambil hutang:', err)
              return resolve({ success: false, error: 'Data hutang tidak ditemukan' })
            }

            const isBayarNow = latestRecord.status_bayar === 0
            const tanggalLama = String(latestRecord.tanggal_transaksi || '').slice(0, 10)
            if (role === 'kasir' && tanggalLama !== today) {
              return resolve({ success: false, error: 'Kasir hanya bisa mengedit hutang hari ini' })
            }

            db.run('BEGIN TRANSACTION')

            const nominal = parseFloat(latestRecord.nominal_transaksi) || 0
            const biayaAdmin = parseFloat(latestRecord.biaya_admin || 0)
            // Saat toggle bayar/tidak bayar, gunakan selalu nominal + admin sebagai efek pembayaran
            const amountToUpdate = nominal + biayaAdmin

            const saldoQuery = isBayarNow
              ? `UPDATE saldo_awal 
      SET saldo = saldo - ?, tanggal_update = CURRENT_TIMESTAMP 
      WHERE id = ?`
              : `UPDATE saldo_awal 
      SET saldo = saldo + ?, tanggal_update = CURRENT_TIMESTAMP 
      WHERE id = ?`

            const targetPlatformId = platform_id || latestRecord.platform_id
            db.run(saldoQuery, [amountToUpdate, targetPlatformId], function (err) {
              if (err) {
                db.run('ROLLBACK')
                console.error('❌ Gagal update saldo:', err)
                return resolve({ success: false, error: err.message })
              }

              updateHutangStatus()
            })

            function updateHutangStatus() {
              const newStatus = isBayarNow ? 1 : 0
              const updateQuery = isBayarNow
                ? `UPDATE hutang
               SET status_bayar = 1,
                   tanggal_bayar_hutang = ?,
                   jenis_transaksi = 'Bayar Hutang',
                   platform_id = ?,
                   saldo_platform = (SELECT saldo FROM saldo_awal WHERE id = ?)
             WHERE id = ?`
                : `UPDATE hutang
               SET status_bayar = 0,
                   tanggal_bayar_hutang = NULL,
                   jenis_transaksi = 'Ambil Hutang',
                   platform_id = ?,
                   saldo_platform = (SELECT saldo FROM saldo_awal WHERE id = ?)
             WHERE id = ?`

              const bayarAt =
                updatedData.tanggal_bayar_hutang && String(updatedData.tanggal_bayar_hutang).trim()
                  ? updatedData.tanggal_bayar_hutang
                  : dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss')

              const effectivePlatformId = platform_id || latestRecord.platform_id
              const params = isBayarNow
                ? [bayarAt, effectivePlatformId, effectivePlatformId, hutang_id]
                : [effectivePlatformId, effectivePlatformId, hutang_id]

              db.run(updateQuery, params, function (err) {
                if (err) {
                  db.run('ROLLBACK')
                  console.error('❌ Gagal update status bayar:', err)
                  return resolve({ success: false, error: err.message })
                }

                // Insert history log for toggle
                const amountEffectLog = isBayarNow ? -amountToUpdate : amountToUpdate
                db.run(
                  `INSERT INTO hutang_history (
                    hutang_id, action, actor_role, actor_id, platform_id, saldo_platform, nominal_transaksi,
                    biaya_admin, status_bayar, jenis_transaksi, tanggal_transaksi, tanggal_bayar_hutang,
                    keterangan, amount_effect
                  ) SELECT id, 'toggle', ?, petugas_id, platform_id, saldo_platform, nominal_transaksi,
                           biaya_admin, status_bayar, jenis_transaksi, tanggal_transaksi, tanggal_bayar_hutang,
                           keterangan, ? FROM hutang WHERE id = ?`,
                  [role, amountEffectLog, hutang_id],
                  (logErr) => {
                    if (logErr) console.warn('⚠️ Gagal insert hutang_history (toggle):', logErr)
                  }
                )

                db.run('COMMIT', (err) => {
                  if (err) {
                    console.error('❌ Commit gagal:', err)
                    return resolve({ success: false, error: err.message })
                  }

                  console.log('✅ Status hutang & saldo berhasil diperbarui')
                  resolve({ success: true, status_bayar: newStatus })
                })
              })
            }
          })
        })
      })
    })

    ipcMain.handle('create-hutang', (event, data) => {
      return new Promise((resolve, reject) => {
        // First get the platform to validate and get current saldo
        db.get(
          'SELECT id, saldo FROM saldo_awal WHERE id = ?',
          [data.platform_id],
          (err, platform) => {
            if (err) {
              console.error('❌ Error finding platform in create-hutang:', err)
              return reject(err)
            }

            if (!platform) {
              return reject(new Error(`Platform with ID ${data.platform_id} not found`))
            }

            try {
              db.serialize(() => {
                // Start transaction
                db.run('BEGIN TRANSACTION')

                // Determine if we should add or subtract based on jenis_transaksi
                const isAddingToSaldo = data.jenis_transaksi === 'Ambil Hutang'
                const operation = isAddingToSaldo ? '+' : '-'

                // Calculate total amount including admin fee
                const totalAmount = isAddingToSaldo
                  ? parseFloat(data.nominal_transaksi)
                  : parseFloat(data.nominal_transaksi) + parseFloat(data.biaya_admin || 0)

                // STEP 1: Update the saldo_awal table - add or subtract the total amount (transaction + admin fee)
                db.run(
                  `UPDATE saldo_awal SET saldo = saldo ${operation} ?, tanggal_update = CURRENT_TIMESTAMP WHERE id = ?`,
                  [totalAmount, data.platform_id],
                  function (err) {
                    if (err) {
                      db.run('ROLLBACK')
                      console.error(`❌ Error updating saldo_awal in create-hutang:`, err)
                      return reject(err)
                    }

                    // STEP 2: Insert the record into hutang table
                    const newSaldo = isAddingToSaldo
                      ? platform.saldo + totalAmount
                      : platform.saldo - totalAmount

                    const statusBayar = isAddingToSaldo ? 0 : 1
                    const bayarAt = !isAddingToSaldo
                      ? data.tanggal_bayar_hutang && String(data.tanggal_bayar_hutang).trim()
                        ? data.tanggal_bayar_hutang
                        : data.tanggal_transaksi ||
                          dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss')
                      : null

                    db.run(
                      `INSERT INTO hutang (
                      petugas_id, 
                      platform_id, 
                      saldo_platform, 
                      jenis_transaksi,
                      nominal_transaksi, 
                      biaya_admin, 
                      tanggal_transaksi, 
                      keterangan,
                      status_bayar,
                      tanggal_bayar_hutang
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                      [
                        data.petugas_id,
                        data.platform_id,
                        newSaldo,
                        data.jenis_transaksi,
                        data.nominal_transaksi,
                        data.biaya_admin || 0,
                        data.tanggal_transaksi || new Date().toISOString(),
                        data.keterangan || '',
                        statusBayar,
                        bayarAt
                      ],
                      function (err) {
                        if (err) {
                          db.run('ROLLBACK')
                          console.error('❌ Error inserting into hutang:', err)
                          return reject(err)
                        }

                        // Insert history log
                        const amountEffect = isAddingToSaldo ? totalAmount : -totalAmount
                        db.run(
                          `INSERT INTO hutang_history (
                            hutang_id, action, actor_role, actor_id, platform_id, saldo_platform, nominal_transaksi,
                            biaya_admin, status_bayar, jenis_transaksi, tanggal_transaksi, tanggal_bayar_hutang,
                            keterangan, amount_effect
                          ) VALUES (?, 'create', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                          [
                            this.lastID,
                            String(data.role || '').toLowerCase() || null,
                            data.petugas_id || null,
                            data.platform_id,
                            newSaldo,
                            data.nominal_transaksi,
                            data.biaya_admin || 0,
                            statusBayar,
                            data.jenis_transaksi,
                            data.tanggal_transaksi || null,
                            bayarAt,
                            data.keterangan || '',
                            amountEffect
                          ],
                          (logErr) => {
                            if (logErr)
                              console.warn('⚠️ Gagal insert hutang_history (create):', logErr)
                          }
                        )

                        // Commit transaction
                        db.run('COMMIT', (err) => {
                          if (err) {
                            console.error('❌ Error committing transaction:', err)
                            return reject(err)
                          }

                          console.log('✅ Hutang created successfully')
                          resolve({ id: this.lastID })
                        })
                      }
                    )
                  }
                )
              })
            } catch (error) {
              console.error('❌ Transaction error in create-hutang:', error)
              reject(error)
            }
          }
        )
      })
    })

    ipcMain.handle('update-hutang', (event, updatedData) => {
      return new Promise((resolve, reject) => {
        const role = String(updatedData.role || 'kasir').toLowerCase()
        const today = dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD')

        db.get('SELECT * FROM hutang WHERE id = ?', [updatedData.id], (err, oldRecord) => {
          if (err) {
            console.error('❌ Error fetching existing hutang record:', err)
            return reject(err)
          }

          if (!oldRecord) {
            console.error('❌ Hutang record not found')
            return reject(new Error('Record not found'))
          }

          const tanggalLama = String(oldRecord.tanggal_transaksi || '').slice(0, 10)
          if (role === 'kasir' && tanggalLama !== today) {
            console.warn('⛔ Kasir hanya bisa mengedit hutang hari ini')
            return reject(new Error('Kasir hanya bisa mengedit hutang hari ini'))
          }

          try {
            db.serialize(() => {
              db.run('BEGIN TRANSACTION')

              const oldPaid = Number(oldRecord.status_bayar) === 1

              if (!oldPaid) {
                // Unpaid: rollback old effect, then apply new
                const rollbackIsAddition = oldRecord.jenis_transaksi === 'Ambil Hutang'
                const rollbackAmount = rollbackIsAddition
                  ? parseFloat(oldRecord.nominal_transaksi)
                  : parseFloat(oldRecord.nominal_transaksi) + parseFloat(oldRecord.biaya_admin || 0)
                const rollbackOperator = rollbackIsAddition ? '-' : '+'

                db.run(
                  `UPDATE saldo_awal SET saldo = saldo ${rollbackOperator} ?, tanggal_update = CURRENT_TIMESTAMP WHERE id = ?`,
                  [rollbackAmount, oldRecord.platform_id],
                  function (err) {
                    if (err) {
                      db.run('ROLLBACK')
                      console.error('❌ Gagal rollback saldo dari transaksi lama:', err)
                      return reject(err)
                    }
                    applyNewForUnpaid()
                  }
                )
              } else {
                // Paid: delta-based update, no double-deduct
                applyDeltaForPaid()
              }

              function applyNewForUnpaid() {
                const applyIsAddition = updatedData.jenis_transaksi === 'Ambil Hutang'
                const applyAmount = applyIsAddition
                  ? parseFloat(updatedData.nominal_transaksi)
                  : parseFloat(updatedData.nominal_transaksi) +
                    parseFloat(updatedData.biaya_admin || 0)
                const applyOperator = applyIsAddition ? '+' : '-'

                db.run(
                  `UPDATE saldo_awal SET saldo = saldo ${applyOperator} ?, tanggal_update = CURRENT_TIMESTAMP WHERE id = ?`,
                  [applyAmount, updatedData.platform_id],
                  function (err) {
                    if (err) {
                      db.run('ROLLBACK')
                      console.error('❌ Gagal update saldo dengan transaksi baru:', err)
                      return reject(err)
                    }
                    finalizeUpdate(applyIsAddition ? applyAmount : -applyAmount)
                  }
                )
              }

              function applyDeltaForPaid() {
                const oldPlatformId = oldRecord.platform_id
                const newPlatformId = updatedData.platform_id || oldPlatformId
                const oldEffective =
                  (parseFloat(oldRecord.nominal_transaksi) || 0) +
                  (parseFloat(oldRecord.biaya_admin || 0) || 0)
                const newEffective =
                  (parseFloat(updatedData.nominal_transaksi) || 0) +
                  (parseFloat(updatedData.biaya_admin || 0) || 0)
                const platformChanged = Number(newPlatformId) !== Number(oldPlatformId)
                const delta = newEffective - oldEffective // positive means need extra deduction

                const proceedToFinalize = () => finalizeUpdate(-delta)

                if (platformChanged) {
                  // Revert old from old platform, apply new to new platform
                  db.run(
                    `UPDATE saldo_awal SET saldo = saldo + ?, tanggal_update = CURRENT_TIMESTAMP WHERE id = ?`,
                    [oldEffective, oldPlatformId],
                    function (err) {
                      if (err) {
                        db.run('ROLLBACK')
                        console.error('❌ Gagal mengembalikan saldo di platform lama:', err)
                        return reject(err)
                      }
                      db.run(
                        `UPDATE saldo_awal SET saldo = saldo - ?, tanggal_update = CURRENT_TIMESTAMP WHERE id = ?`,
                        [newEffective, newPlatformId],
                        function (err2) {
                          if (err2) {
                            db.run('ROLLBACK')
                            console.error('❌ Gagal menerapkan saldo di platform baru:', err2)
                            return reject(err2)
                          }
                          proceedToFinalize()
                        }
                      )
                    }
                  )
                } else if (Math.abs(delta) > 0) {
                  // Same platform, adjust by -delta (because paid reduces saldo)
                  db.run(
                    `UPDATE saldo_awal SET saldo = saldo - ?, tanggal_update = CURRENT_TIMESTAMP WHERE id = ?`,
                    [delta, newPlatformId],
                    function (err) {
                      if (err) {
                        db.run('ROLLBACK')
                        console.error('❌ Gagal menerapkan delta saldo:', err)
                        return reject(err)
                      }
                      proceedToFinalize()
                    }
                  )
                } else {
                  // No saldo change needed
                  proceedToFinalize()
                }
              }

              function finalizeUpdate(amountEffectLog) {
                const forcedJenis =
                  oldRecord.status_bayar === 1 ? 'Bayar Hutang' : updatedData.jenis_transaksi
                const targetPlatformId = updatedData.platform_id || oldRecord.platform_id
                db.run(
                  `UPDATE hutang SET
          platform_id = ?,
          jenis_transaksi = ?,
          nominal_transaksi = ?,
          biaya_admin = ?,
          saldo_platform = (SELECT saldo FROM saldo_awal WHERE id = ?),
          keterangan = ?,
          tanggal_transaksi = ?
        WHERE id = ?`,
                  [
                    targetPlatformId,
                    forcedJenis,
                    updatedData.nominal_transaksi,
                    updatedData.biaya_admin,
                    targetPlatformId,
                    updatedData.keterangan,
                    updatedData.tanggal_transaksi,
                    updatedData.id
                  ],
                  function (err) {
                    if (err) {
                      db.run('ROLLBACK')
                      console.error('❌ Gagal update hutang:', err)
                      return reject(err)
                    }

                    db.run('COMMIT', (err) => {
                      if (err) {
                        console.error('❌ Gagal commit transaksi update hutang:', err)
                        return reject(err)
                      }

                      // History log for update with computed amount_effect
                      const effect = Number(amountEffectLog) || 0
                      db.run(
                        `INSERT INTO hutang_history (
                          hutang_id, action, actor_role, actor_id, platform_id, saldo_platform, nominal_transaksi,
                          biaya_admin, status_bayar, jenis_transaksi, tanggal_transaksi, tanggal_bayar_hutang,
                          keterangan, amount_effect
                        ) SELECT id, 'update', ?, petugas_id, platform_id, saldo_platform, nominal_transaksi,
                                 biaya_admin, status_bayar, jenis_transaksi, tanggal_transaksi, tanggal_bayar_hutang,
                                 keterangan, ? FROM hutang WHERE id = ?`,
                        [role, effect, updatedData.id],
                        (logErr) => {
                          if (logErr)
                            console.warn('⚠️ Gagal insert hutang_history (update):', logErr)
                        }
                      )

                      console.log('✅ Hutang berhasil diupdate dan saldo disesuaikan (delta-safe)')
                      resolve({ success: true, changes: this.changes })
                    })
                  }
                )
              }
            })
          } catch (updateErr) {
            console.error('❌ Error in hutang update logic:', updateErr)
            reject(updateErr)
          }
        })
      })
    })

    ipcMain.handle('delete-hutang', (event, id) => {
      return new Promise((resolve, reject) => {
        // First get the record to be deleted so we can adjust the saldo
        db.get(
          'SELECT platform_id, nominal_transaksi, biaya_admin, jenis_transaksi, status_bayar, keterangan FROM hutang WHERE id = ?',
          [id],
          (err, record) => {
            if (err) {
              console.error('❌ Error getting hutang record for deletion:', err)
              return reject(err)
            }

            if (!record) {
              return reject(new Error(`Hutang record with ID ${id} not found`))
            }

            try {
              db.serialize(() => {
                // Start transaction
                db.run('BEGIN TRANSACTION')

                const isPaid = Number(record.status_bayar) === 1

                const proceedDeleteOnly = (overrideAmountEffect = null) => {
                  // Delete the hutang record without changing saldo
                  db.run('DELETE FROM hutang WHERE id = ?', [id], function (err) {
                    if (err) {
                      db.run('ROLLBACK')
                      console.error('❌ Error deleting hutang record:', err)
                      return reject(err)
                    }

                    // Log history for delete
                    const defaultEffect = isPaid
                      ? 0
                      : record.jenis_transaksi === 'Ambil Hutang'
                        ? -parseFloat(record.nominal_transaksi)
                        : +(
                            parseFloat(record.nominal_transaksi) +
                            parseFloat(record.biaya_admin || 0)
                          )
                    const amountEffectLog =
                      overrideAmountEffect === null || overrideAmountEffect === undefined
                        ? defaultEffect
                        : overrideAmountEffect
                    db.run(
                      `INSERT INTO hutang_history (
                        hutang_id, action, actor_role, actor_id, platform_id, saldo_platform, nominal_transaksi,
                        biaya_admin, status_bayar, jenis_transaksi, tanggal_transaksi, tanggal_bayar_hutang,
                        keterangan, amount_effect
                      ) VALUES (?, 'delete', NULL, NULL, ?, NULL, ?, ?, ?, ?, NULL, ?, ?, ?)`,
                      [
                        id,
                        record.platform_id,
                        record.nominal_transaksi,
                        record.biaya_admin || 0,
                        record.status_bayar,
                        record.jenis_transaksi,
                        null,
                        record.keterangan || '',
                        amountEffectLog
                      ],
                      (logErr) => {
                        if (logErr) console.warn('⚠️ Gagal insert hutang_history (delete):', logErr)
                      }
                    )

                    // Commit transaction
                    db.run('COMMIT', (err) => {
                      if (err) {
                        console.error('❌ Error committing transaction:', err)
                        return reject(err)
                      }

                      console.log(
                        isPaid
                          ? '✅ Hutang deleted successfully (paid record, no saldo change)'
                          : '✅ Hutang deleted successfully and saldo adjusted'
                      )
                      resolve({ changes: this.changes })
                    })
                  })
                }

                if (isPaid) {
                  // Already settled: net effect is zero; don't touch saldo
                  proceedDeleteOnly()
                } else {
                  // Reverse the effect on saldo based on the transaction type
                  const wasAddition = record.jenis_transaksi === 'Ambil Hutang'

                  if (wasAddition) {
                    // Check if there's an offsetting paid payment for the same platform and nominal
                    db.get(
                      `SELECT id FROM hutang
                         WHERE jenis_transaksi = 'Bayar Hutang'
                           AND status_bayar = 1
                           AND platform_id = ?
                           AND nominal_transaksi = ?
                         LIMIT 1`,
                      [record.platform_id, record.nominal_transaksi],
                      (checkErr, paidMatch) => {
                        if (checkErr) {
                          db.run('ROLLBACK')
                          console.error('❌ Error checking matched payment:', checkErr)
                          return reject(checkErr)
                        }

                        if (paidMatch) {
                          // There is a matching paid payment, so net effect is offset; delete only and log zero effect
                          return proceedDeleteOnly(0)
                        }

                        // No matching payment, rollback the addition (subtract nominal)
                        const totalAmount = parseFloat(record.nominal_transaksi)
                        db.run(
                          `UPDATE saldo_awal SET saldo = saldo - ?, tanggal_update = CURRENT_TIMESTAMP WHERE id = ?`,
                          [totalAmount, record.platform_id],
                          function (err) {
                            if (err) {
                              db.run('ROLLBACK')
                              console.error('❌ Error reversing saldo effect:', err)
                              return reject(err)
                            }
                            proceedDeleteOnly()
                          }
                        )
                      }
                    )
                  } else {
                    // Deleting a payment → restore saldo (add nominal + admin)
                    const totalAmount =
                      (parseFloat(record.nominal_transaksi) || 0) +
                      (parseFloat(record.biaya_admin || 0) || 0)
                    db.run(
                      `UPDATE saldo_awal SET saldo = saldo + ?, tanggal_update = CURRENT_TIMESTAMP WHERE id = ?`,
                      [totalAmount, record.platform_id],
                      function (err) {
                        if (err) {
                          db.run('ROLLBACK')
                          console.error('❌ Error reversing saldo effect:', err)
                          return reject(err)
                        }
                        proceedDeleteOnly()
                      }
                    )
                  }
                }
              })
            } catch (error) {
              console.error('❌ Transaction error in delete-hutang:', error)
              reject(error)
            }
          }
        )
      })
    })

    // ============================= end Hutang handler =============================

    // ============================= pindah saldo handler =============================

    ipcMain.handle('get-pindah-saldo', (event, roleRaw) => {
      return new Promise((resolve, reject) => {
        const role = String(roleRaw).toLowerCase()
        const today = dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD')

        const query = `
      SELECT ps.*, s1.nama_sumber_dana AS sumber_nama, s2.nama_sumber_dana AS tujuan_nama
      FROM pindah_saldo ps
      LEFT JOIN saldo_awal s1 ON ps.sumber_dana_id = s1.id
      LEFT JOIN saldo_awal s2 ON ps.tujuan_dana_id = s2.id
      ${role === 'kasir' ? 'WHERE DATE(ps.tanggal) = ?' : ''}
      ORDER BY ps.tanggal DESC, ps.id DESC
    `
        const params = role === 'kasir' ? [today] : []

        db.all(query, params, (err, rows) => {
          if (err) return reject(err)
          resolve(rows)
        })
      })
    })

    // Helper function to update saldo_awal after transfer
    const updateSaldoAfterTransfer = async (
      sumberDanaId,
      tujuanDanaId,
      nominal,
      biayaAdmin = 0
    ) => {
      return new Promise((resolve, reject) => {
        db.serialize(() => {
          // Start transaction
          db.run('BEGIN TRANSACTION')

          // Update sumber dana (deduct amount + admin fee)
          db.run(
            'UPDATE saldo_awal SET saldo = saldo - ?, tanggal_update = CURRENT_TIMESTAMP WHERE id = ?',
            [nominal + biayaAdmin, sumberDanaId],
            function (err) {
              if (err) {
                db.run('ROLLBACK')
                console.error('❌ Error updating sumber dana saldo:', err)
                return reject(err)
              }

              // Update tujuan dana (add amount)
              db.run(
                'UPDATE saldo_awal SET saldo = saldo + ?, tanggal_update = CURRENT_TIMESTAMP WHERE id = ?',
                [nominal, tujuanDanaId],
                function (err) {
                  if (err) {
                    db.run('ROLLBACK')
                    console.error('❌ Error updating tujuan dana saldo:', err)
                    return reject(err)
                  }

                  // Commit transaction
                  db.run('COMMIT', (err) => {
                    if (err) {
                      console.error('❌ Error committing transaction:', err)
                      return reject(err)
                    }

                    console.log('✅ Successfully updated both saldo after transfer')
                    resolve({ success: true })
                  })
                }
              )
            }
          )
        })
      })
    }

    ipcMain.handle('create-pindah-saldo', (event, data) => {
      const {
        sumber_dana_id,
        tujuan_dana_id,
        user_pemindah_id,
        nominal,
        platform,
        biaya_admin,
        saldo_sumber,
        saldo_tujuan,
        keterangan,
        tanggal
      } = data

      const query = `
        INSERT INTO pindah_saldo (
          sumber_dana_id, 
          tujuan_dana_id, 
          user_pemindah_id, 
          nominal, 
          platform, 
          biaya_admin, 
          saldo_sumber, 
          saldo_tujuan, 
          keterangan, 
          tanggal
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `

      return new Promise((resolve, reject) => {
        db.run(
          query,
          [
            sumber_dana_id,
            tujuan_dana_id,
            user_pemindah_id,
            nominal,
            platform,
            biaya_admin || 0,
            saldo_sumber,
            saldo_tujuan,
            keterangan,
            tanggal || new Date().toISOString()
          ],
          async function (err) {
            if (err) {
              console.error('❌ Error creating pindah_saldo:', err)
              return reject(err)
            }

            console.log('✅ pindah_saldo created successfully with ID:', this.lastID)

            try {
              // Update saldo_awal after successful transfer
              await updateSaldoAfterTransfer(
                sumber_dana_id,
                tujuan_dana_id,
                nominal,
                biaya_admin || 0
              )
              resolve({ id: this.lastID })
            } catch (updateErr) {
              console.error('❌ Error updating saldo after transfer:', updateErr)
              // Still return success for the pindah_saldo creation
              resolve({
                id: this.lastID,
                warningMessage: 'Transfer created but saldo not updated'
              })
            }
          }
        )
      })
    })

    ipcMain.handle('update-pindah-saldo', (event, updatedData) => {
      return new Promise((resolve, reject) => {
        const role = String(updatedData.role || 'kasir').toLowerCase()
        const today = getTodayWIB()

        // Ambil data lama dari database
        db.get(
          'SELECT sumber_dana_id, tujuan_dana_id, nominal, biaya_admin, tanggal FROM pindah_saldo WHERE id = ?',
          [updatedData.id],
          async (err, oldRecord) => {
            if (err) {
              console.error('❌ Error getting existing pindah_saldo record:', err)
              return reject(err)
            }

            if (!oldRecord) {
              console.error('❌ Record not found')
              return reject(new Error('Record not found'))
            }

            // Normalize to date-only to support 'YYYY-MM-DD HH:mm:ss' or 'YYYY-MM-DDTHH:mm:ss'
            const tanggalLama = String(oldRecord.tanggal || '').slice(0, 10)
            if (role === 'kasir' && tanggalLama !== today) {
              console.warn('⛔ Kasir hanya bisa mengedit transaksi yang dibuat hari ini')
              return reject(new Error('Kasir hanya bisa mengedit transaksi yang dibuat hari ini'))
            }

            try {
              db.serialize(() => {
                db.run('BEGIN TRANSACTION')

                // 1️⃣ Reversing original transaction
                db.run(
                  'UPDATE saldo_awal SET saldo = saldo + ?, tanggal_update = CURRENT_TIMESTAMP WHERE id = ?',
                  [oldRecord.nominal + oldRecord.biaya_admin, oldRecord.sumber_dana_id],
                  function (err) {
                    if (err) {
                      db.run('ROLLBACK')
                      console.error('❌ Error returning funds to original source account:', err)
                      return resolve({ success: false, error: err.message })
                    }

                    db.run(
                      'UPDATE saldo_awal SET saldo = saldo - ?, tanggal_update = CURRENT_TIMESTAMP WHERE id = ?',
                      [oldRecord.nominal, oldRecord.tujuan_dana_id],
                      function (err) {
                        if (err) {
                          db.run('ROLLBACK')
                          console.error(
                            '❌ Error removing funds from original destination account:',
                            err
                          )
                          return resolve({ success: false, error: err.message })
                        }

                        // 2️⃣ Executing new transaction
                        db.run(
                          'UPDATE saldo_awal SET saldo = saldo - ?, tanggal_update = CURRENT_TIMESTAMP WHERE id = ?',
                          [
                            updatedData.nominal + updatedData.biaya_admin,
                            updatedData.sumber_dana_id
                          ],
                          function (err) {
                            if (err) {
                              db.run('ROLLBACK')
                              console.error(
                                '❌ Error deducting funds from new source account:',
                                err
                              )
                              return resolve({ success: false, error: err.message })
                            }

                            db.run(
                              'UPDATE saldo_awal SET saldo = saldo + ?, tanggal_update = CURRENT_TIMESTAMP WHERE id = ?',
                              [updatedData.nominal, updatedData.tujuan_dana_id],
                              function (err) {
                                if (err) {
                                  db.run('ROLLBACK')
                                  console.error(
                                    '❌ Error adding funds to new destination account:',
                                    err
                                  )
                                  return resolve({ success: false, error: err.message })
                                }

                                // 3️⃣ Update pindah_saldo record
                                db.run(
                                  `UPDATE pindah_saldo
                               SET sumber_dana_id = ?, tujuan_dana_id = ?, nominal = ?, platform = ?, biaya_admin = ?,
                                   saldo_sumber = (SELECT saldo FROM saldo_awal WHERE id = ?),
                                   saldo_tujuan = (SELECT saldo FROM saldo_awal WHERE id = ?),
                                   keterangan = ?, tanggal = ?
                               WHERE id = ?`,
                                  [
                                    updatedData.sumber_dana_id,
                                    updatedData.tujuan_dana_id,
                                    updatedData.nominal,
                                    updatedData.platform,
                                    updatedData.biaya_admin,
                                    updatedData.sumber_dana_id,
                                    updatedData.tujuan_dana_id,
                                    updatedData.keterangan,
                                    updatedData.tanggal,
                                    updatedData.id
                                  ],
                                  function (err) {
                                    if (err) {
                                      db.run('ROLLBACK')
                                      console.error('❌ Error updating pindah_saldo record:', err)
                                      return resolve({ success: false, error: err.message })
                                    }

                                    db.run('COMMIT', (err) => {
                                      if (err) {
                                        console.error('❌ Error committing transaction:', err)
                                        return resolve({ success: false, error: err.message })
                                      }

                                      console.log('✅ Transfer updated successfully')
                                      resolve({
                                        success: true,
                                        changes: this.changes,
                                        message: 'Transfer updated successfully'
                                      })
                                    })
                                  }
                                )
                              }
                            )
                          }
                        )
                      }
                    )
                  }
                )
              })
            } catch (updateErr) {
              console.error('❌ Error updating transfer:', updateErr)
              resolve({ success: false, error: updateErr.message })
            }
          }
        )
      })
    })

    ipcMain.handle('delete-pindah-saldo', (event, id) => {
      return new Promise((resolve, reject) => {
        // First get the record to be deleted so we can reverse the transfer
        db.get(
          'SELECT sumber_dana_id, tujuan_dana_id, nominal, biaya_admin FROM pindah_saldo WHERE id = ?',
          [id],
          async (err, record) => {
            if (err) {
              console.error('❌ Error getting pindah_saldo record for deletion:', err)
              return reject(err)
            }

            // Now delete the record
            db.run('DELETE FROM pindah_saldo WHERE id = ?', [id], async function (err) {
              if (err) {
                console.error('❌ Error deleting pindah_saldo:', err)
                return reject(err)
              }

              // Record successfully deleted
              console.log('✅ pindah_saldo deleted successfully. Changes:', this.changes)

              if (record) {
                try {
                  // Correctly handle the balance reversal
                  db.serialize(() => {
                    // Start transaction
                    db.run('BEGIN TRANSACTION')

                    // STEP 1: Add both nominal amount AND admin fee back to source account
                    console.log(
                      `Adding back to source: nominal ${record.nominal} + admin fee ${record.biaya_admin}`
                    )
                    db.run(
                      'UPDATE saldo_awal SET saldo = saldo + ?, tanggal_update = CURRENT_TIMESTAMP WHERE id = ?',
                      [record.nominal + record.biaya_admin, record.sumber_dana_id],
                      function (err) {
                        if (err) {
                          db.run('ROLLBACK')
                          console.error('❌ Error returning funds to source account:', err)
                          return resolve({ changes: this.changes }) // Still resolve to prevent UI hang
                        }

                        // STEP 2: Remove only the nominal amount from destination account
                        console.log(`Removing from destination: only nominal ${record.nominal}`)
                        db.run(
                          'UPDATE saldo_awal SET saldo = saldo - ?, tanggal_update = CURRENT_TIMESTAMP WHERE id = ?',
                          [record.nominal, record.tujuan_dana_id],
                          function (err) {
                            if (err) {
                              db.run('ROLLBACK')
                              console.error(
                                '❌ Error subtracting funds from destination account:',
                                err
                              )
                              return resolve({ changes: this.changes }) // Still resolve to prevent UI hang
                            }

                            // Commit transaction
                            db.run('COMMIT', (err) => {
                              if (err) {
                                console.error('❌ Error committing transaction:', err)
                                return resolve({ changes: this.changes }) // Still resolve to prevent UI hang
                              }

                              console.log(
                                '✅ Transfer reversed correctly: Source received nominal + admin, destination returned nominal'
                              )
                              resolve({ changes: this.changes })
                            })
                          }
                        )
                      }
                    )
                  })
                } catch (updateErr) {
                  console.error('❌ Error reversing transfer after deletion:', updateErr)
                  // Still return success for the deletion
                  resolve({ changes: this.changes })
                }
              } else {
                resolve({ changes: this.changes })
              }
            })
          }
        )
      })
    })

    // ============================= end pindah saldo handler =============================

    // ============================= ambil saldo handler =============================

    // Make sure this handler exists and is properly registered
    ipcMain.handle('get-ambil-saldo', (event, userRole) => {
      const today = getTodayWIB()
      const role = (userRole || '').toLowerCase()

      const query =
        role === 'kasir'
          ? 'SELECT * FROM ambil_saldo WHERE DATE(tanggal_pengambilan) = ? ORDER BY tanggal_pengambilan DESC, id DESC'
          : 'SELECT * FROM ambil_saldo ORDER BY tanggal_pengambilan DESC, id DESC'

      const params = role === 'kasir' ? [today] : []

      return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
          if (err) {
            console.error('❌ Error getting ambil_saldo data:', err)
            reject(err)
          } else {
            console.log('✅ Retrieved ambil_saldo data:', rows.length)
            resolve(rows)
          }
        })
      })
    })

    const updateSaldoAfterWithdrawal = async (platform, withdrawalAmount, adminFee = 0) => {
      return new Promise((resolve, reject) => {
        // First, get the current saldo_awal record for this platform
        db.get(
          'SELECT id, saldo FROM saldo_awal WHERE nama_sumber_dana = ?',
          [platform],
          (err, row) => {
            if (err) {
              console.error('❌ Error getting saldo_awal for update:', err)
              return reject(err)
            }

            if (!row) {
              console.error('❌ Platform not found in saldo_awal:', platform)
              return reject(new Error('Platform not found'))
            }

            // Calculate total deduction (withdrawal amount + admin fee)
            const totalDeduction = withdrawalAmount + adminFee

            // Calculate new balance
            const newBalance = Math.max(0, row.saldo - totalDeduction) // Prevent negative balance
            console.log(
              `💰 Updating saldo for ${platform}: ${row.saldo} - ${withdrawalAmount} - ${adminFee} (admin) = ${newBalance}`
            )

            // Update the saldo_awal with new balance
            db.run(
              'UPDATE saldo_awal SET saldo = ?, tanggal_update = CURRENT_TIMESTAMP WHERE id = ?',
              [newBalance, row.id],
              function (err) {
                if (err) {
                  console.error('❌ Error updating saldo_awal balance:', err)
                  return reject(err)
                }

                console.log(`✅ Successfully updated saldo for ${platform} to ${newBalance}`)
                resolve({ success: true, changes: this.changes })
              }
            )
          }
        )
      })
    }

    ipcMain.handle('create-ambil-saldo', (event, data) => {
      const {
        petugas_pengambil_id,
        platform,
        saldo_platform,
        nominal_pengambilan,
        biaya_admin,
        metode_pengambilan,
        tujuan_pengambilan,
        tanggal_pengambilan,
        keterangan
      } = data

      // Log the date being received to debug
      console.log('📅 Create date received:', tanggal_pengambilan)

      const query = `
        INSERT INTO ambil_saldo (
          petugas_pengambil_id, 
          platform, 
          saldo_platform, 
          nominal_pengambilan, 
          biaya_admin, 
          metode_pengambilan, 
          tujuan_pengambilan, 
          tanggal_pengambilan, 
          keterangan
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `

      return new Promise((resolve, reject) => {
        db.run(
          query,
          [
            petugas_pengambil_id,
            platform,
            saldo_platform,
            nominal_pengambilan,
            biaya_admin,
            metode_pengambilan,
            tujuan_pengambilan,
            tanggal_pengambilan || getTodayWIB(),
            keterangan
          ],
          async function (err) {
            if (err) {
              console.error('❌ Error creating ambil_saldo:', err)
              return reject(err)
            }

            console.log('✅ ambil_saldo created successfully with ID:', this.lastID)

            try {
              // Update saldo_awal after successful withdrawal, including admin fee
              await updateSaldoAfterWithdrawal(platform, nominal_pengambilan, biaya_admin)
              resolve({ id: this.lastID })
            } catch (updateErr) {
              console.error('❌ Error updating saldo after withdrawal:', updateErr)
              // Still return success for the ambil_saldo creation
              resolve({
                id: this.lastID,
                warningMessage: 'Withdrawal created but saldo not updated'
              })
            }
          }
        )
      })
    })

    ipcMain.handle('update-ambil-saldo', (event, data) => {
      const {
        id,
        petugas_pengambil_id,
        platform,
        saldo_platform,
        nominal_pengambilan,
        biaya_admin,
        metode_pengambilan,
        tujuan_pengambilan,
        tanggal_pengambilan,
        keterangan
      } = data

      console.log('🔄 Updating ambil_saldo:', { id, platform, tanggal_pengambilan })

      const query = `
        UPDATE ambil_saldo
        SET 
          petugas_pengambil_id = ?, 
          platform = ?, 
          saldo_platform = ?, 
          nominal_pengambilan = ?, 
          biaya_admin = ?, 
          metode_pengambilan = ?, 
          tujuan_pengambilan = ?, 
          tanggal_pengambilan = ?, 
          keterangan = ?
        WHERE id = ?
      `

      return new Promise((resolve, reject) => {
        // First get the original record to calculate the difference
        db.get(
          'SELECT platform, nominal_pengambilan, biaya_admin FROM ambil_saldo WHERE id = ?',
          [id],
          (err, originalRecord) => {
            if (err) {
              console.error('❌ Error getting original ambil_saldo record:', err)
              return reject(err)
            }

            db.run(
              query,
              [
                petugas_pengambil_id,
                platform,
                saldo_platform,
                nominal_pengambilan,
                biaya_admin,
                metode_pengambilan,
                tujuan_pengambilan,
                tanggal_pengambilan || getTodayWIB(),
                keterangan,
                id
              ],
              async function (err) {
                if (err) {
                  console.error('❌ Error updating ambil_saldo:', err)
                  return reject(err)
                }

                console.log('✅ ambil_saldo updated successfully. Changes:', this.changes)

                // Only update saldo if platform, amount, or admin fee changed
                if (
                  originalRecord &&
                  (originalRecord.platform !== platform ||
                    originalRecord.nominal_pengambilan !== nominal_pengambilan ||
                    originalRecord.biaya_admin !== biaya_admin)
                ) {
                  try {
                    // If platform changed, we need to adjust both platforms
                    if (originalRecord.platform !== platform) {
                      // Return the money to the original platform (including admin fee)
                      await updateSaldoAfterWithdrawal(
                        originalRecord.platform,
                        -originalRecord.nominal_pengambilan, // Negative to add it back
                        -originalRecord.biaya_admin // Negative to add it back
                      )

                      // Take from the new platform (including admin fee)
                      await updateSaldoAfterWithdrawal(platform, nominal_pengambilan, biaya_admin)
                    } else {
                      // Just adjust the amount and admin fee differences
                      const amountDifference =
                        nominal_pengambilan - originalRecord.nominal_pengambilan
                      const feeDifference = biaya_admin - originalRecord.biaya_admin

                      // Use the combined differences to adjust the saldo
                      await updateSaldoAfterWithdrawal(platform, amountDifference, feeDifference)
                    }
                  } catch (updateErr) {
                    console.error('❌ Error adjusting saldo after update:', updateErr)
                    // Still return success for the update
                  }
                }

                resolve({ changes: this.changes })
              }
            )
          }
        )
      })
    })

    // Also update the delete handler to refund the saldo
    ipcMain.handle('delete-ambil-saldo', (event, id) => {
      return new Promise((resolve, reject) => {
        // First get the record to be deleted so we can refund the balance
        db.get(
          'SELECT platform, nominal_pengambilan, biaya_admin FROM ambil_saldo WHERE id = ?',
          [id],
          async (err, record) => {
            if (err) {
              console.error('❌ Error getting ambil_saldo record for deletion:', err)
              return reject(err)
            }

            // Now delete the record
            db.run('DELETE FROM ambil_saldo WHERE id = ?', [id], async function (err) {
              if (err) {
                console.error('❌ Error deleting ambil_saldo:', err)
                return reject(err)
              }

              // Record successfully deleted
              console.log('✅ ambil_saldo deleted successfully. Changes:', this.changes)

              if (record) {
                try {
                  // Refund the platform (use negative amounts to add the money back)
                  await updateSaldoAfterWithdrawal(
                    record.platform,
                    -record.nominal_pengambilan, // Negative to add it back
                    -record.biaya_admin // Negative to add it back
                  )
                  console.log('✅ Balance refunded after deletion')
                } catch (updateErr) {
                  console.error('❌ Error refunding balance after deletion:', updateErr)
                  // Still return success for the deletion
                }
              }

              resolve({ changes: this.changes })
            })
          }
        )
      })
    })

    // ============================== kelola toko handler ===============================
    ipcMain.handle('create-toko', (event, data) => {
      const { nama_toko, no_telepon, alamat } = data

      const query = `
    INSERT INTO toko (nama_toko, no_telepon, alamat)
    VALUES (?, ?, ?)
  `

      return new Promise((resolve, reject) => {
        db.run(query, [nama_toko, no_telepon, alamat], function (err) {
          if (err) reject(err)
          else resolve({ success: true, id: this.lastID })
        })
      })
    })

    ipcMain.handle('get-toko', () => {
      const query = `SELECT * FROM toko ORDER BY id DESC`
      return new Promise((resolve, reject) => {
        db.all(query, [], (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        })
      })
    })

    ipcMain.handle('update-toko', (event, data) => {
      const { id, nama_toko, no_telepon, alamat } = data

      const query = `
    UPDATE toko
    SET nama_toko = ?, no_telepon = ?, alamat = ?
    WHERE id = ?
  `

      return new Promise((resolve, reject) => {
        db.run(query, [nama_toko, no_telepon, alamat, id], function (err) {
          if (err) reject(err)
          else resolve({ success: true, changes: this.changes })
        })
      })
    })

    ipcMain.handle('delete-toko', (event, id) => {
      const query = `DELETE FROM toko WHERE id = ?`
      return new Promise((resolve, reject) => {
        db.run(query, [id], function (err) {
          if (err) reject(err)
          else resolve({ success: true, changes: this.changes })
        })
      })
    })

    ipcMain.handle('get-toko-by-id', async (event, tokoId) => {
      return new Promise((resolve, reject) => {
        const query = `SELECT * FROM toko WHERE id = ?`
        db.get(query, [tokoId], (err, row) => {
          if (err) {
            console.error('❌ Gagal ambil data toko:', err)
            reject(err)
          } else {
            console.log('✅ Data toko ditemukan:', row)
            resolve(row)
          }
        })
      })
    })

    ipcMain.handle('get-toko-with-employee-count', () => {
      const query = `
          SELECT t.*, 
        SUM(CASE WHEN u.role != 'admin' THEN 1 ELSE 0 END) as totalEmployees
        FROM toko t
        LEFT JOIN users u ON t.id = u.toko_id
        GROUP BY t.id
        ORDER BY t.id DESC

      `
      return new Promise((resolve, reject) => {
        db.all(query, [], (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        })
      })
    })
    // ============================== end kelola toko handler ===============================

    // ============================== karyawan handler ======================================

    // Tambah karyawan (langsung ke tabel users)
    ipcMain.handle('create-karyawan', async (event, data) => {
      return new Promise((resolve, reject) => {
        const check = db
          .prepare(`SELECT COUNT(*) AS count FROM users WHERE username = ?`)
          .get(data.username)

        if (check.count > 0) {
          return reject(new Error('Username sudah digunakan'))
        }

        const stmt = db.prepare(`
      INSERT INTO users (nama, username, password, role, no_telepon, toko_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

        stmt.run(
          data.nama,
          data.username,
          data.password,
          data.role,
          data.no_telepon,
          data.toko_id,
          function (err) {
            if (err) return reject(err)
            resolve({ success: true, id: this.lastID })
          }
        )
      })
    })

    // Ambil semua user berdasarkan toko_id
    ipcMain.handle('get-karyawan', async (event, toko_id) => {
      return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM users WHERE toko_id = ?`, [toko_id], (err, rows) => {
          if (err) {
            console.error('❌ Query error:', err)
            reject([])
          } else {
            console.log('✅ Data karyawan:', rows)
            resolve(rows)
          }
        })
      })
    })

    // Update user
    ipcMain.handle('update-karyawan', (event, data) => {
      // Cek apakah username sudah dipakai oleh user lain
      const check = db
        .prepare(
          `
    SELECT COUNT(*) AS count FROM users 
    WHERE username = ? AND id != ?
  `
        )
        .get(data.username, data.user_id)

      if (check.count > 0) {
        throw new Error('Username sudah digunakan oleh user lain')
      }

      const stmt = db.prepare(`
    UPDATE users
    SET nama = ?, username = ?, password = ?, role = ?, no_telepon = ?
    WHERE id = ?
  `)

      return stmt.run(
        data.nama,
        data.username,
        data.password,
        data.role,
        data.no_telepon,
        data.user_id
      )
    })

    // Hapus user
    ipcMain.handle('delete-karyawan', (event, user_id) => {
      const stmt = db.prepare(`DELETE FROM users WHERE id = ?`)
      return stmt.run(user_id)
    })

    ipcMain.handle('count-karyawan', () => {
      return new Promise((resolve, reject) => {
        db.get(`SELECT COUNT(*) AS count FROM users WHERE role != 'admin'`, [], (err, row) => {
          if (err) {
            console.error('Error count-karyawan:', err)
            reject(err)
          } else {
            resolve(row.count)
          }
        })
      })
    })

    // ============================== end karyawan handler ===============================

    // ============================== login handler ===============================
    ipcMain.handle('login-user', async (event, { username, password }) => {
      return new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM users WHERE username = ? AND password = ?',
          [username, password],
          (err, row) => {
            if (!username || !password) {
              return { success: false, message: 'Username dan password wajib diisi.' }
            }
            if (err) {
              console.error('Database error:', err)
              resolve({ success: false, message: 'Terjadi kesalahan' })
            } else if (row) {
              resolve({ success: true, user: row })
            } else {
              resolve({ success: false, message: 'Username atau password salah' })
            }
          }
        )
      })
    })

    // ============================== transaksi handler ======================================
    ipcMain.handle('get-transaksi', async (event, role) => {
      try {
        const data = await getTransaksi(role)
        return data
      } catch (err) {
        console.error('❌ Error get-transaksi:', err)
        return []
      }
    })

    // CREATE TRANSAKSI
    ipcMain.handle('create-transaksi', async (_event, data) => {
      return await createTransaksi(_event, data)
    })

    // DELETE TRANSAKSI + ROLLBACK SALDO
    ipcMain.handle('delete-transaksi', async (_event, id) => {
      return await deleteTransaksi(_event, id)
    })

    // EDIT TRANSAKSI (Rollback + Update baru + Mark as edited)
    ipcMain.handle('edit-transaksi', async (_event, { id, data }) => {
      try {
        console.log('📦 metode_pembayaran dikirim ke editTransaksi:', data.metode_pembayaran)
        const result = await editTransaksi(_event, { id, data })
        return result // Berisi id & no_transaksi baru
      } catch (error) {
        console.error('❌ Gagal edit transaksi:', error)
        throw error
      }
    })

    ipcMain.handle('get-transaksi-summary', async (event, role) => {
      try {
        const summary = await getTransaksiSummary(role)
        return { success: true, data: summary }
      } catch (error) {
        console.error('❌ Error get-transaksi-summary:', error)
        return { success: false, error: error.message }
      }
    })

    // 🚩 TANDAI SALAH (koreksi transaksi) — berlaku untuk transaksi, hutang, pindah_saldo, ambil_saldo
    ipcMain.handle('mark-salah', async (_event, payload) => {
      try {
        return await markSalah(payload)
      } catch (error) {
        console.error('❌ Error mark-salah:', error)
        throw error
      }
    })

    ipcMain.handle('unmark-salah', async (_event, payload) => {
      try {
        return await unmarkSalah(payload)
      } catch (error) {
        console.error('❌ Error unmark-salah:', error)
        throw error
      }
    })

    // ✅ TANDAI BENAR/SESUAI (koreksi transaksi) — berlaku untuk transaksi, hutang, pindah_saldo, ambil_saldo
    ipcMain.handle('mark-benar', async (_event, payload) => {
      try {
        return await markBenar(payload)
      } catch (error) {
        console.error('❌ Error mark-benar:', error)
        throw error
      }
    })

    ipcMain.handle('unmark-benar', async (_event, payload) => {
      try {
        return await unmarkBenar(payload)
      } catch (error) {
        console.error('❌ Error unmark-benar:', error)
        throw error
      }
    })

    // 📊 ASSET SNAPSHOTS IPC HANDLERS
    ipcMain.handle('get-asset-snapshots', async () => {
      try {
        const { getAssetSnapshots } = await import('./db.js')
        const snapshots = await getAssetSnapshots()
        console.log('📊 Fetched asset snapshots:', snapshots.length)
        return snapshots
      } catch (error) {
        console.error('❌ Error get-asset-snapshots:', error)
        return []
      }
    })

    ipcMain.handle('get-last-total-asset-no-edit', async () => {
      try {
        const { getLastTotalAssetNoEdit } = await import('./db.js')
        const lastValue = await getLastTotalAssetNoEdit()
        console.log('📊 Fetched last total_aset_no_edit:', lastValue)
        return lastValue
      } catch (error) {
        console.error('❌ Error get-last-total-asset-no-edit:', error)
        return 0
      }
    })

    ipcMain.handle('save-asset-snapshot', async (event, data) => {
      try {
        const { saveAssetSnapshot } = await import('./db.js')
        const result = await saveAssetSnapshot(data)
        return result
      } catch (error) {
        console.error('❌ Error save-asset-snapshot:', error)
        throw error
      }
    })

    ipcMain.handle('delete-asset-snapshot', async (event, id) => {
      try {
        const { deleteAssetSnapshot } = await import('./db.js')
        const result = await deleteAssetSnapshot(id)
        return result
      } catch (error) {
        console.error('❌ Error delete-asset-snapshot:', error)
        throw error
      }
    })

    ipcMain.handle('delete-all-asset-snapshots', async () => {
      try {
        const { deleteAllAssetSnapshots } = await import('./db.js')
        const result = await deleteAllAssetSnapshots()
        return result
      } catch (error) {
        console.error('❌ Error delete-all-asset-snapshots:', error)
        throw error
      }
    })

    ipcMain.handle('calculate-total-assets', async () => {
      try {
        const { calculateTotalAssets } = await import('./db.js')
        const total = await calculateTotalAssets()
        return total
      } catch (error) {
        console.error('❌ Error calculate-total-assets:', error)
        return 0
      }
    })
  })
  await updateSchema()

  // Perbaiki inkonsistensi data hutang lama: samakan status_bayar dengan jenis_transaksi
  function repairHutangStatuses() {
    db.serialize(() => {
      // 1) Tandai Bayar Hutang sebagai sudah dibayar
      db.run(
        `UPDATE hutang
         SET status_bayar = 1
         WHERE LOWER(COALESCE(jenis_transaksi, '')) = 'bayar hutang'
           AND COALESCE(status_bayar, 0) = 0`,
        function (err) {
          if (err) console.error('❌ Repair: gagal set status_bayar=1 untuk Bayar Hutang:', err)
          else if (this.changes)
            console.log(`🔧 Repair: set paid untuk ${this.changes} baris Bayar Hutang`)
        }
      )

      // 2) Set tanggal_bayar_hutang jika kosong (gunakan tanggal_transaksi)
      db.run(
        `UPDATE hutang
         SET tanggal_bayar_hutang = COALESCE(NULLIF(tanggal_bayar_hutang, ''), tanggal_transaksi)
         WHERE LOWER(COALESCE(jenis_transaksi, '')) = 'bayar hutang'
           AND (tanggal_bayar_hutang IS NULL OR tanggal_bayar_hutang = '')`,
        function (err) {
          if (err) console.error('❌ Repair: gagal set tanggal_bayar_hutang:', err)
          else if (this.changes)
            console.log(`🔧 Repair: isi tanggal_bayar_hutang pada ${this.changes} baris`)
        }
      )

      // 3) Pastikan Ambil Hutang berstatus belum dibayar
      db.run(
        `UPDATE hutang
         SET status_bayar = 0, tanggal_bayar_hutang = NULL
         WHERE LOWER(COALESCE(jenis_transaksi, '')) = 'ambil hutang'
           AND COALESCE(status_bayar, 0) <> 0`,
        function (err) {
          if (err) console.error('❌ Repair: gagal reset status_bayar untuk Ambil Hutang:', err)
          else if (this.changes)
            console.log(`🔧 Repair: reset unpaid untuk ${this.changes} baris Ambil Hutang`)
        }
      )
    })
  }

  repairHutangStatuses()

  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})