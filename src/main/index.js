import { BrowserWindow, app, ipcMain, shell } from 'electron'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'

import icon from '../../resources/icon.png?asset'
import { join } from 'path'

const path = require('path')
const sqlite3 = require('sqlite3').verbose()

const db = new sqlite3.Database(path.join(__dirname, 'cashier.db'), (err) => {
  if (err) {
    console.error('Error opening database:', err.message)
  } else {
    console.log('Connected to the SQLite database.')
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
  db.run(
    `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'pegawai'
)

`,
    (err) => {
      if (err) {
        console.error('Gagal buat tabel:', err.message)
      } else {
        console.log('Tabel users siap.')

        const dummyUsers = [
          ['Alice', 'alice@example.com', 'admin'],
          ['Bob', 'bob@example.com', 'pegawai'],
          ['Charlie', 'charlie@example.com', 'pegawai']
        ]

        const insertStmt = `INSERT OR IGNORE INTO users (name, email, role) VALUES (?, ?, ?)`
        dummyUsers.forEach((user) => {
          db.run(insertStmt, user)
        })
        console.log('✅ Dummy data inserted')

        ipcMain.handle('get-users', (event) => {
          return new Promise((resolve, reject) => {
            db.all('SELECT * FROM users', [], (err, rows) => {
              if (err) {
                console.error('Gagal ambil data:', err.message)
                reject(err)
              } else {
                resolve(rows)
              }
            })
          })
        })
        
        // CREATE - Tambah user
        ipcMain.handle('create-user', (event, user) => {
          return new Promise((resolve, reject) => {
            const query = `INSERT INTO users (name, email, role) VALUES (?, ?, ?)`
            db.run(query, [user.name, user.email, user.role || 'pegawai'], function (err) {
              if (err) {
                console.error('Gagal tambah user:', err.message)
                reject(err)
              } else {
                resolve({ id: this.lastID })
              }
            })
          })
        })

        // READ - (Sudah ada: get-users)

        // UPDATE - Edit user
        ipcMain.handle('update-user', (event, user) => {
          return new Promise((resolve, reject) => {
            const query = `UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?`
            db.run(query, [user.name, user.email, user.role, user.id], function (err) {
              if (err) {
                console.error('Gagal update user:', err.message)
                reject(err)
              } else {
                resolve({ changes: this.changes })
              }
            })
          })
        })

        // DELETE - Hapus user
        ipcMain.handle('delete-user', (event, userId) => {
          return new Promise((resolve, reject) => {
            const query = `DELETE FROM users WHERE id = ?`
            db.run(query, [userId], function (err) {
              if (err) {
                console.error('Gagal hapus user:', err.message)
                reject(err)
              } else {
                resolve({ changes: this.changes })
              }
            })
          })
        })

        // CEK ROLE - Ambil role berdasarkan email
        ipcMain.handle('get-user-role', (event, email) => {
          return new Promise((resolve, reject) => {
            db.get(`SELECT role FROM users WHERE email = ?`, [email], (err, row) => {
              if (err) {
                console.error('Gagal ambil role:', err.message)
                reject(err)
              } else {
                resolve(row ? row.role : null)
              }
            })
          })
        })
      }
    }
  )

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
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
