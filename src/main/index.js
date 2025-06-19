import { BrowserWindow, app, screen } from 'electron'
import { createTransaksi, deleteTransaksi, getTransaksi } from './transactionHandler.js'

import db from './db.js'
import icon from '../../resources/iconNew.jpg?asset'
import { ipcMain } from 'electron'
import { is } from '@electron-toolkit/utils'
import { join } from 'path'

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const mainWindow = new BrowserWindow({
    width,
    height,
    frame: true, // <- biar tombol exit tetap ada
    autoHideMenuBar: true, // <- hilangkan menu bar atas
    title: 'Mini  by Jaya Mart',
    show: false,
    ...(process.platform === 'linux' ? { icon } : {icon}),
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

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  db.serialize(() => {
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
    db.run(`
      CREATE TABLE IF NOT EXISTS transaksi (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tanggal DATETIME DEFAULT CURRENT_TIMESTAMP,
          no_transaksi TEXT UNIQUE NOT NULL,
          sumber_dana_id INTEGER ,
          jenis_transaksi TEXT NOT NULL,
          tipe_transaksi TEXT, 
          nominal_transaksi REAL,
          terima_dana_id INTEGER,
          biaya_admin_bank REAL DEFAULT 0, 
          fee REAL DEFAULT 0,
          metode_pembayaran TEXT, 
          keterangan TEXT,
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

     // ============================= pindah saldo handler =============================

    ipcMain.handle('get-pindah-saldo', () => {
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM pindah_saldo', [], (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
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

    // ipcMain.handle('update-pindah-saldo', (event, id) => {
    //   return new Promise((resolve, reject) => {
    //     // First get the record to be deleted so we can reverse the transfer
    //     db.get(
    //       'SELECT sumber_dana_id, tujuan_dana_id, nominal, biaya_admin FROM pindah_saldo WHERE id = ?',
    //       [id],
    //       async (err, record) => {
    //         if (err) {
    //           console.error('❌ Error getting pindah_saldo record for deletion:', err)
    //           return reject(err)
    //         }

    //         if (record) {
    //           try {
    //             // Correctly handle the balance reversal
    //             db.serialize(() => {
    //               // Start transaction
    //               db.run('BEGIN TRANSACTION')

    //               // STEP 1: Add both nominal amount AND admin fee back to source account
    //               console.log(
    //                 `Adding back to source: nominal ${record.nominal} + admin fee ${record.biaya_admin}`
    //               )
    //               db.run(
    //                 'UPDATE saldo_awal SET saldo = saldo + ?, tanggal_update = CURRENT_TIMESTAMP WHERE id = ?',
    //                 [record.nominal + record.biaya_admin, record.sumber_dana_id],
    //                 function (err) {
    //                   if (err) {
    //                     db.run('ROLLBACK')
    //                     console.error('❌ Error returning funds to source account:', err)
    //                     return resolve({ changes: this.changes }) // Still resolve to prevent UI hang
    //                   }

    //                   // STEP 2: Remove only the nominal amount from destination account
    //                   console.log(`Removing from destination: only nominal ${record.nominal}`)
    //                   db.run(
    //                     'UPDATE saldo_awal SET saldo = saldo - ?, tanggal_update = CURRENT_TIMESTAMP WHERE id = ?',
    //                     [record.nominal, record.tujuan_dana_id],
    //                     function (err) {
    //                       if (err) {
    //                         db.run('ROLLBACK')
    //                         console.error(
    //                           '❌ Error subtracting funds from destination account:',
    //                           err
    //                         )
    //                         return resolve({ changes: this.changes }) // Still resolve to prevent UI hang
    //                       }

    //                       // Commit transaction
    //                       db.run('COMMIT', (err) => {
    //                         if (err) {
    //                           console.error('❌ Error committing transaction:', err)
    //                           return resolve({ changes: this.changes }) // Still resolve to prevent UI hang
    //                         }

    //                         console.log(
    //                           '✅ Transfer reversed correctly: Source received nominal + admin, destination returned nominal'
    //                         )
    //                         resolve({ changes: this.changes })
    //                       })
    //                     }
    //                   )
    //                 }
    //               )
    //             })
    //           } catch (updateErr) {
    //             console.error('❌ Error reversing transfer after deletion:', updateErr)
    //             // Still return success for the deletion
    //             resolve({ changes: this.changes })
    //           }

    //           // STEP 3: Update the pindah_saldo record with new data
    //           db.run(
    //             'UPDATE pindah_saldo SET sumber_dana_id = ?, tujuan_dana_id = ?, nominal = ?, biaya_admin = ?, tanggal = ?, keterangan = ? WHERE id = ?',
    //             [
    //               updatedData.sumber_dana_id,
    //               updatedData.tujuan_dana_id,
    //               updatedData.nominal,
    //               updatedData.biaya_admin,
    //               updatedData.tanggal,
    //               updatedData.keterangan,
    //               updatedData.id
    //             ],
    //             function (err) {
    //               if (err) {
    //                 db.run('ROLLBACK')
    //                 console.error('❌ Error updating pindah_saldo record:', err)
    //                 return resolve({ changes: this.changes })
    //               }

    //               // Commit transaction
    //               db.run('COMMIT', (err) => {
    //                 if (err) {
    //                   console.error('❌ Error committing transaction:', err)
    //                   return resolve({ changes: this.changes })
    //                 }

    //                 console.log('✅ Transfer updated correctly: Balances adjusted, record updated')
    //                 resolve({
    //                   changes: this.changes,
    //                   message: 'Transfer updated successfully'
    //                 })
    //               })
    //             }
    //           )
    //         } else {
    //           resolve({ changes: this.changes })
    //         }
    //       }
    //     )
    //   })
    // })

    ipcMain.handle('update-pindah-saldo', (event, updatedData) => {
      return new Promise((resolve, reject) => {
        // First get the existing record to compare and adjust balances
        db.get(
          'SELECT sumber_dana_id, tujuan_dana_id, nominal, biaya_admin FROM pindah_saldo WHERE id = ?',
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

            try {
              db.serialize(() => {
                // Start transaction
                db.run('BEGIN TRANSACTION')

                // STEP 1: Adjust source account balance
                // Subtract old amounts from source, then add new amounts
                const sourceDiff =
                  -(oldRecord.nominal + oldRecord.biaya_admin) +
                  (updatedData.nominal + updatedData.biaya_admin)

                db.run(
                  'UPDATE saldo_awal SET saldo = saldo + ?, tanggal_update = CURRENT_TIMESTAMP WHERE id = ?',
                  [sourceDiff, oldRecord.sumber_dana_id],
                  function (err) {
                    if (err) {
                      db.run('ROLLBACK')
                      console.error('❌ Error adjusting source account balance:', err)
                      return resolve({ changes: this.changes })
                    }

                    // STEP 2: Adjust destination account balance
                    // Subtract old nominal, then add new nominal
                    const destinationDiff = -oldRecord.nominal + updatedData.nominal

                    db.run(
                      'UPDATE saldo_awal SET saldo = saldo + ?, tanggal_update = CURRENT_TIMESTAMP WHERE id = ?',
                      [destinationDiff, oldRecord.tujuan_dana_id],
                      function (err) {
                        if (err) {
                          db.run('ROLLBACK')
                          console.error('❌ Error adjusting destination account balance:', err)
                          return resolve({ changes: this.changes })
                        }

                        // STEP 3: Update the pindah_saldo record with new data
                        db.run(
                          'UPDATE pindah_saldo SET sumber_dana_id = ?, tujuan_dana_id = ?, nominal = ?, biaya_admin = ?, tanggal = ?, keterangan = ? WHERE id = ?',
                          [
                            updatedData.sumber_dana_id,
                            updatedData.tujuan_dana_id,
                            updatedData.nominal,
                            updatedData.biaya_admin,
                            updatedData.tanggal,
                            updatedData.keterangan,
                            updatedData.id
                          ],
                          function (err) {
                            if (err) {
                              db.run('ROLLBACK')
                              console.error('❌ Error updating pindah_saldo record:', err)
                              return resolve({ changes: this.changes })
                            }

                            // Commit transaction
                            db.run('COMMIT', (err) => {
                              if (err) {
                                console.error('❌ Error committing transaction:', err)
                                return resolve({ changes: this.changes })
                              }

                              console.log(
                                '✅ Transfer updated correctly: Balances adjusted, record updated'
                              )
                              resolve({
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
              })
            } catch (updateErr) {
              console.error('❌ Error updating transfer:', updateErr)
              resolve({ changes: 0, error: updateErr.message })
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
    ipcMain.handle('get-transaksi', async () => {
      return await getTransaksi()
    })

    // CREATE TRANSAKSI
    ipcMain.handle('create-transaksi', async (_event, data) => {
      return await createTransaksi(_event, data)
    })

    // DELETE TRANSAKSI + ROLLBACK SALDO
    ipcMain.handle('delete-transaksi', async (_event, id) => {
      return await deleteTransaksi(_event, id)
    })

    // EDIT TRANSAKSI (Rollback + Update baru)
    // EDIT TRANSAKSI (Rollback + Update baru)
    ipcMain.handle('edit-transaksi', async (_event, { id, data }) => {
      try {
        // Hapus transaksi lama + rollback saldo
        await deleteTransaksi(_event, id)

        // Tambahkan transaksi baru (dengan ID berbeda dan saldo baru)
        const result = await createTransaksi(_event, data)

        return result // Berisi id & no_transaksi baru
      } catch (error) {
        console.error('❌ Gagal edit transaksi:', error)
        throw error
      }
    })
  })
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
