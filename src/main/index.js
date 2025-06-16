import { BrowserWindow, app, shell } from 'electron'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'

import icon from '../../resources/icon.png?asset'
import { ipcMain } from 'electron'
import { join } from 'path'

const path = require('path')
const sqlite3 = require('sqlite3').verbose()

const dbPath = path.join(app.getPath('userData'), 'miniAtm.db')
console.log('📁 Lokasi fix database:', dbPath)

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message)
  } else {
    console.log('✅ Connected to the SQLite database.')
  }
})

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    title: 'Mini ATM',
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  db.serialize(() => {
    // CREATE TABLES
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        no_telepon TEXT,
        role TEXT NOT NULL,
        toko_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    db.run(`
      CREATE TABLE IF NOT EXISTS toko (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_toko TEXT NOT NULL,
        no_telepon TEXT,
        alamat TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
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
    db.run(`
      CREATE TABLE IF NOT EXISTS transaksi (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
          no_transaksi TEXT UNIQUE NOT NULL,
          sumber_dana_id INTEGER NOT NULL,
          jenis_transaksi TEXT NOT NULL,
          tipe_transaksi TEXT, 
          nominal_transaksi REAL NOT NULL,
          tujuan_dana_id INTEGER,
          biaya_admin_bank REAL DEFAULT 0, 
          fee REAL DEFAULT 0,
          metode_pembayaran TEXT, 
          keterangan TEXT,
          FOREIGN KEY (sumber_dana_id) REFERENCES saldo_awal(id),
          FOREIGN KEY (tujuan_dana_id) REFERENCES saldo_awal(id)
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
    // db.run(`ALTER TABLE users ADD COLUMN toko_id INTEGER`) =>  untuk menambahkan kolom toko_id&no_telepon di table users

    // INSERT DUMMY USERS
    const users = [
      ['Admin', 'iniadminsaya', 'adminsayaajaya', 'admin'],
      ['Budi', 'budi123', 'kasirpass', 'kasir'],
      ['Siti', 'siti321', 'supervisorpass', 'supervisor']
    ]
    const insertUser = db.prepare(
      `INSERT OR IGNORE INTO users (nama, username, password, role) VALUES (?, ?, ?, ?)`
    )
    users.forEach((user) => insertUser.run(user))
    insertUser.finalize()
    // REGISTER IPC HANDLERS
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

    // ============================= ambil saldo handler =============================

    // Make sure this handler exists and is properly registered
    ipcMain.handle('get-ambil-saldo', () => {
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM ambil_saldo', [], (err, rows) => {
          if (err) {
            console.error('❌ Error getting ambil_saldo data:', err)
            reject(err)
          } else {
            console.log('✅ Successfully retrieved ambil_saldo data, count:', rows.length)
            resolve(rows)
          }
        })
      })
    })

    // Helper function to update saldo_awal after withdrawal
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
            tanggal_pengambilan || new Date().toISOString().split('T')[0],
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
                tanggal_pengambilan || new Date().toISOString().split('T')[0],
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
    SELECT t.*, COUNT(u.id) as totalEmployees
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
  })
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
