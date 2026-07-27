import db, { calculateTotalAssets, getLastTotalAssetNoEdit, saveAssetSnapshot } from './db'

import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

// Aktifkan plugin
dayjs.extend(utc)
dayjs.extend(timezone)

export function getTransaksi(role) {
  const today = dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD')
  const roleLower = (role || '').toLowerCase()

  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        t.*,
        h.sumber_dana_saldo_sebelum AS saldo_awal,
        h.terima_dana_saldo_sebelum AS terima_saldo_awal,
        s1.nama_sumber_dana AS sumber_dana,
        s2.nama_sumber_dana AS terima_dana_nama
      FROM transaksi t
      LEFT JOIN history_transaksi h ON t.id = h.transaksi_id
      LEFT JOIN saldo_awal s1 ON h.sumber_dana_id = s1.id
      LEFT JOIN saldo_awal s2 ON h.terima_dana_id = s2.id
      ${roleLower === 'kasir' ? 'WHERE DATE(t.tanggal) = ?' : ''}
      ORDER BY t.tanggal DESC, t.id DESC
    `

    const params = roleLower === 'kasir' ? [today] : []

    db.all(query, params, (err, rows) => {
      if (err) return reject(err)
      resolve(rows)
    })
  })
}



export function createTransaksi(_event, data) {
  return new Promise((resolve, reject) => {
    let {
      tanggal,
      sumber_dana_id,
      jenis_transaksi,
      tipe_transaksi,
      nominal_transaksi,
      terima_dana_id,
      fee = 0,
      metode_pembayaran = '',
      keterangan = '',
      biaya_admin,
      biaya_admin_bank,
      nama_pelanggan = '',
      nomor_tujuan = '',
      user_id = '',
      user_name = '',
      user_role = 'kasir',
      alat_id = null,
      alat_nama = '',
      bonus = 0,
      is_bonus_manual = false,
      is_fee_manual = false
    } = data
    metode_pembayaran = Number(metode_pembayaran) || null
    alat_id = alat_id ? Number(alat_id) : null

    const nominal = parseFloat(nominal_transaksi) || 0
    const feeTransaksi = parseFloat(fee) || 0
    const bonusTransaksi = parseFloat(bonus) || 0
    // Fallback: accept either biaya_admin (preferred) or biaya_admin_bank from payload
    const biayaAdminFinal = parseFloat(
      (biaya_admin ?? biaya_admin_bank ?? 0)
    ) || 0

    const randomSuffix = Math.floor(10000 + Math.random() * 9000)
    const datetimePart = new Date()
      .toISOString()
      .replace(/[-:.TZ]/g, '')
      .slice(0, 14)
    const no_transaksi = `TRX-${datetimePart}${randomSuffix}`

    // 🎁 Tentukan sumber dana tujuan bonus:
    // - Cek Saldo: pakai sumber_dana_id yang dipilih user di form (field itu memang berfungsi
    //   sebagai "bonus masuk ke" untuk jenis transaksi ini, karena tidak ada perpindahan dana lain)
    // - Jenis lain (Tarik Tunai, Transfer, Jasa Transfer, Mode Pulsa): pakai default yang sudah
    //   diatur admin di halaman Kelola Fee & Alat (kolom alat.sumber_dana_bonus_id)
    const resolveBonusTarget = () =>
      new Promise((res, rej) => {
        if (bonusTransaksi <= 0) return res(null)
        if (jenis_transaksi === 'Cek Saldo') return res(sumber_dana_id || null)
        if (!alat_id) return res(null)
        db.get(`SELECT sumber_dana_bonus_id FROM alat WHERE id = ?`, [alat_id], (errAlat, row) => {
          if (errAlat) return rej(errAlat)
          res(row?.sumber_dana_bonus_id || null)
        })
      })

    resolveBonusTarget()
      .then((bonusSumberDanaId) => {
        db.get(`SELECT saldo FROM saldo_awal WHERE id = ?`, [sumber_dana_id], (err1, sumberRow) => {
          if (err1 || !sumberRow) return reject(err1 || new Error('Sumber dana tidak ditemukan'))

          const sumber_saldo = parseFloat(sumberRow.saldo) || 0

          const stmt = `
            INSERT INTO transaksi (
              tanggal, no_transaksi, sumber_dana_id, jenis_transaksi, tipe_transaksi, 
              nominal_transaksi, terima_dana_id, biaya_admin_bank, fee, metode_pembayaran, 
              keterangan, nama_pelanggan, nomor_tujuan, user_id, user_name, user_role,
              alat_id, alat_nama, bonus, is_bonus_manual, is_fee_manual, bonus_sumber_dana_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `

          db.run(
            stmt,
            [
              tanggal,
              no_transaksi,
              sumber_dana_id,
              jenis_transaksi,
              tipe_transaksi,
              nominal,
              terima_dana_id,
              biayaAdminFinal,
              feeTransaksi,
              metode_pembayaran,
              keterangan,
              nama_pelanggan,
              nomor_tujuan,
              user_id,
              user_name,
              user_role,
              alat_id,
              alat_nama,
              bonusTransaksi,
              is_bonus_manual ? 1 : 0,
              is_fee_manual ? 1 : 0,
              bonusSumberDanaId
            ],
            function (err2) {
              if (err2) return reject(err2)

              const transaksi_id = this.lastID

              const simpanHistory = (terima_saldo = 0) => {
                db.run(
                  `INSERT INTO history_transaksi (
                    transaksi_id, sumber_dana_id, sumber_dana_saldo_sebelum, terima_dana_id, terima_dana_saldo_sebelum
                  ) VALUES (?, ?, ?, ?, ?)`,
                  [transaksi_id, sumber_dana_id, sumber_saldo, terima_dana_id, terima_saldo],
                  (err4) => {
                    if (err4) return reject(err4)
                    updateSaldo(biayaAdminFinal)
                  }
                )
              }

              if (terima_dana_id) {
                db.get(
                  `SELECT saldo FROM saldo_awal WHERE id = ?`,
                  [terima_dana_id],
                  (err3, terimaRow) => {
                    if (err3) return reject(err3)
                    const terima_saldo = parseFloat(terimaRow?.saldo) || 0
                    simpanHistory(terima_saldo)
                  }
                )
              } else {
                simpanHistory()
              }

              function updateSaldo(biaya_admin_fix) {
                let perubahan_sumber = 0
                let perubahan_terima = 0

                switch (jenis_transaksi) {
                  case 'Tarik Tunai':
                    perubahan_sumber = -nominal
                    perubahan_terima = nominal
                    break

                  case 'Transfer':
                    perubahan_sumber = -1 * (nominal + biaya_admin_fix)
                    perubahan_terima = nominal
                    break

                  case 'Jasa Transfer':
                    break

                  case 'Mode Pulsa':
                    perubahan_sumber = -1 * (nominal + biaya_admin_fix)
                    perubahan_terima = nominal
                    break
                }

                const updateQueries = []

                if (sumber_dana_id && perubahan_sumber !== 0) {
                  updateQueries.push(
                    new Promise((res, rej) => {
                      db.run(
                        `UPDATE saldo_awal SET saldo = saldo + ? WHERE id = ?`,
                        [perubahan_sumber, sumber_dana_id],
                        (err) => (err ? rej(err) : res())
                      )
                    })
                  )
                }

                if (terima_dana_id && perubahan_terima !== 0) {
                  updateQueries.push(
                    new Promise((res, rej) => {
                      db.run(
                        `UPDATE saldo_awal SET saldo = saldo + ? WHERE id = ?`,
                        [perubahan_terima, terima_dana_id],
                        (err) => (err ? rej(err) : res())
                      )
                    })
                  )
                }

                if (metode_pembayaran && feeTransaksi > 0) {
                  updateQueries.push(
                    new Promise((res, rej) => {
                      db.run(
                        `UPDATE saldo_awal SET saldo = saldo + ? WHERE id = ?`,
                        [feeTransaksi, metode_pembayaran],
                        (err) => (err ? rej(err) : res())
                      )
                    })
                  )
                }

                // 🎁 Tambahkan bonus alat ke sumber dana tujuannya (kalau ada)
                if (bonusSumberDanaId && bonusTransaksi > 0) {
                  updateQueries.push(
                    new Promise((res, rej) => {
                      db.run(
                        `UPDATE saldo_awal SET saldo = saldo + ? WHERE id = ?`,
                        [bonusTransaksi, bonusSumberDanaId],
                        (err) => (err ? rej(err) : res())
                      )
                    })
                  )
                }

                Promise.all(updateQueries)
                  .then(async () => {
                    // 📊 Otomatis simpan snapshot aset setelah transaksi berhasil
                    try {
                      const totalAsset = await calculateTotalAssets()
                      const lastTotalAssetNoEdit = await getLastTotalAssetNoEdit()
                      
                      let totalAssetNoEdit
                      
                      if (data._isEdit) {
                        // Jika edit, total_aset_no_edit tetap sama seperti sebelumnya
                        totalAssetNoEdit = lastTotalAssetNoEdit
                      } else {
                        // Jika transaksi baru
                        if (lastTotalAssetNoEdit === 0) {
                          // Jika belum ada data sebelumnya (table kosong), ambil nilai total aset saat ini
                          totalAssetNoEdit = totalAsset
                        } else {
                          // Jika sudah ada data, hitung keuntungan baru dari transaksi ini
                          // Keuntungan = fee yang didapat dari transaksi ini
                          const keuntungan = Number(fee || 0)
                          totalAssetNoEdit = lastTotalAssetNoEdit + keuntungan
                        }
                      }
                      
                      const keterangan = data._isEdit ? 
                        `Snapshot otomatis setelah EDIT ${jenis_transaksi} - ${no_transaksi}` :
                        `Snapshot otomatis setelah ${jenis_transaksi} - ${no_transaksi}`
                        
                      const snapshotData = {
                        tanggal: dayjs(tanggal).tz('Asia/Jakarta').format('YYYY-MM-DD'),
                        waktu_transaksi: dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss'),
                        total_aset: totalAsset,
                        total_aset_no_edit: totalAssetNoEdit,
                        transaksi_id: transaksi_id,
                        keterangan: keterangan,
                        user_role: data.user_role || 'kasir',
                        user_name: data.user_name || 'System'
                      }
                      
                      await saveAssetSnapshot(snapshotData)
                      
                      if (data._isEdit) {
                        console.log('✅ Asset snapshot saved for EDIT transaction:', no_transaksi, 'total_aset:', totalAsset, 'total_aset_no_edit:', totalAssetNoEdit)
                      } else {
                        console.log('✅ Asset snapshot saved for NEW transaction:', no_transaksi, 'total_aset:', totalAsset, 'total_aset_no_edit:', totalAssetNoEdit)
                      }
                    } catch (snapshotErr) {
                      console.error('⚠️ Gagal simpan asset snapshot:', snapshotErr)
                      // Tidak reject karena transaksi utama sudah berhasil
                    }
                    
                    resolve({ id: transaksi_id, no_transaksi })
                  })
                  .catch(reject)
              }
            }
          )
        })
      })
      .catch(reject)
  })
}

export function deleteTransaksi(_event, id) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.get(`SELECT * FROM transaksi WHERE id = ?`, [id], (err, trx) => {
        if (err || !trx) return reject(err || new Error('Transaksi tidak ditemukan'))

        db.run('BEGIN TRANSACTION', (beginErr) => {
          if (beginErr) return reject(beginErr)

          const nominal = parseFloat(trx.nominal_transaksi) || 0
          const fee = parseFloat(trx.fee) || 0
          const biaya_admin = parseFloat(trx.biaya_admin_bank) || 0

          let perubahan_sumber = 0
          let perubahan_terima = 0

          switch (trx.jenis_transaksi) {
            case 'Tarik Tunai':
              perubahan_sumber = nominal
              perubahan_terima = -nominal
              break

            case 'Transfer':
              perubahan_sumber = nominal + biaya_admin
              perubahan_terima = -nominal
              break

            case 'Jasa Transfer':
              break

            case 'Mode Pulsa':
              perubahan_sumber = nominal + biaya_admin
              perubahan_terima = -nominal
              break
          }

          const updateQueries = []

          if (trx.sumber_dana_id && perubahan_sumber !== 0) {
            updateQueries.push(
              new Promise((res, rej) => {
                db.run(
                  `UPDATE saldo_awal SET saldo = saldo + ? WHERE id = ?`,
                  [perubahan_sumber, trx.sumber_dana_id],
                  (err) => (err ? rej(err) : res())
                )
              })
            )
          }

          if (trx.terima_dana_id && perubahan_terima !== 0) {
            updateQueries.push(
              new Promise((res, rej) => {
                db.run(
                  `UPDATE saldo_awal SET saldo = saldo + ? WHERE id = ?`,
                  [perubahan_terima, trx.terima_dana_id],
                  (err) => (err ? rej(err) : res())
                )
              })
            )
          }

          if (trx.metode_pembayaran && fee > 0) {
            updateQueries.push(
              new Promise((res, rej) => {
                db.run(
                  `UPDATE saldo_awal SET saldo = saldo - ? WHERE id = ?`,
                  [fee, trx.metode_pembayaran],
                  (err) => (err ? rej(err) : res())
                )
              })
            )
          }

          // 🎁 Batalkan bonus alat yang sudah ditambahkan ke sumber dana tujuannya
          const bonusAmt = parseFloat(trx.bonus) || 0
          if (trx.bonus_sumber_dana_id && bonusAmt > 0) {
            updateQueries.push(
              new Promise((res, rej) => {
                db.run(
                  `UPDATE saldo_awal SET saldo = saldo - ? WHERE id = ?`,
                  [bonusAmt, trx.bonus_sumber_dana_id],
                  (err) => (err ? rej(err) : res())
                )
              })
            )
          }

          Promise.all(updateQueries)
            .then(() => {
              db.run(`DELETE FROM transaksi WHERE id = ?`, [id], (err4) => {
                if (err4) return rollback(err4)

                db.run(`DELETE FROM history_transaksi WHERE transaksi_id = ?`, [id], (err5) => {
                  if (err5) return rollback(err5)

                  db.run('COMMIT', (commitErr) => {
                    if (commitErr) return rollback(commitErr)
                    resolve({ success: true })
                  })
                })
              })
            })
            .catch(rollback)

          function rollback(error) {
            db.run('ROLLBACK', () => reject(error))
          }
        })
      })
    })
  })
}

export async function getTransaksiSummary(role) {
  const today = dayjs().format('YYYY-MM-DD')
  let query = `SELECT jenis_transaksi, nominal_transaksi, fee, biaya_admin_bank, tanggal FROM transaksi`
  const params = []

  if (role !== 'admin') {
    query += ` WHERE DATE(tanggal) = ?`
    params.push(today)
  }

  const rows = await new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) return reject(err)
      resolve(rows)
    })
  })

  let tarikTunai = 0
  let transfer = 0
  let pulsa = 0
  let biayaAdmin = 0
  let profit = 0

  for (const row of rows) {
    const jenis = row.jenis_transaksi?.toLowerCase()
    const nominal = Number(row.nominal_transaksi || 0)
    const admin = Number(row.biaya_admin_bank || 0)
    const fee = Number(row.fee || 0)

    if (jenis === 'tarik tunai') {
      tarikTunai += nominal
    } else if (jenis === 'transfer') {
      transfer += nominal
    } else if (jenis === 'mode pulsa') {
      pulsa += nominal
    }

    biayaAdmin += admin
    if (role === 'admin') profit += fee
  }

  return {
    cashWithdrawal: tarikTunai,
    transfer,
    modePulsa: pulsa,
    bankAdmin: biayaAdmin,
    ...(role === 'admin' && { profit }) // hanya dikembalikan jika admin
  }
}

// Edit transaksi dengan menandai sebagai edited
export function editTransaksi(_event, { id, data }) {
  return new Promise(async (resolve, reject) => {
    try {
      // Pertama, rollback transaksi lama
      await deleteTransaksi(_event, id)
      
      // Set flag untuk mencegah snapshot saat edit
      data._isEdit = true
      
      // Kemudian buat transaksi baru dengan data yang diupdate
      const result = await createTransaksi(_event, data)
      
      // Update transaksi baru untuk menandai bahwa ini adalah hasil edit
      const updateEditQuery = `
        UPDATE transaksi 
        SET is_edited = 1, edited_at = datetime('now', 'localtime')
        WHERE id = ?
      `
      
      db.run(updateEditQuery, [result.id], function(err) {
        if (err) {
          console.error('❌ Error marking transaction as edited:', err)
          reject(err)
        } else {
          console.log('✅ Transaction marked as edited:', result.id)
          resolve(result)
        }
      })
    } catch (error) {
      console.error('❌ Error in editTransaksi:', error)
      reject(error)
    }
  })
}