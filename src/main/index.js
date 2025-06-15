import { BrowserWindow, app, ipcMain, shell } from 'electron'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'

import icon from '../../resources/icon.png?asset'
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
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    title: 'Cashier App',
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
  console.log('✅ Loading preload from', join(__dirname, '../preload/index.js'))

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

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
          FOREIGN KEY (sumber_dana_id) REFERENCES saldo_awal(id)
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
        sumber_dana_id INTEGER NOT NULL,
        nominal REAL NOT NULL,
        biaya_admin REAL DEFAULT 0,
        keterangan TEXT,
        tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sumber_dana_id) REFERENCES saldo_awal(id)
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
  })
  createWindow()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
