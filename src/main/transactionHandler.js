import db from './db'

export function getTransaksi() {
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
      ORDER BY t.tanggal DESC
    `
    db.all(query, [], (err, rows) => {
      if (err) return reject(err)
      resolve(rows)
    })
  })
}

export function createTransaksi(_event, data) {
  return new Promise((resolve, reject) => {
    const {
      tanggal,
      sumber_dana_id,
      jenis_transaksi,
      tipe_transaksi,
      nominal_transaksi,
      terima_dana_id,
      biaya_admin_bank = 0,
      fee = 0,
      metode_pembayaran = '',
      keterangan = ''
    } = data

    // Konversi ke number (pastikan semua angka valid)
    const nominal = parseFloat(nominal_transaksi) || 0
    const biayaAdmin = parseFloat(biaya_admin_bank) || 0
    const feeTransaksi = parseFloat(fee) || 0

    const randomSuffix = Math.floor(10000 + Math.random() * 9000)
    const datetimePart = new Date()
      .toISOString()
      .replace(/[-:.TZ]/g, '')
      .slice(0, 14)

    const no_transaksi = `TRX-${datetimePart}${randomSuffix}`

    const stmt = `
      INSERT INTO transaksi (
        tanggal, no_transaksi, sumber_dana_id, jenis_transaksi, tipe_transaksi, 
        nominal_transaksi, terima_dana_id, biaya_admin_bank, fee, metode_pembayaran, keterangan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        biayaAdmin,
        feeTransaksi,
        metode_pembayaran,
        keterangan
      ],
      function (err) {
        if (err) {
          console.error('❌ Gagal insert transaksi:', err)
          return reject(err)
        }

        const transaksi_id = this.lastID
        console.log('✅ Transaksi berhasil, ID:', transaksi_id)

        db.get(`SELECT saldo FROM saldo_awal WHERE id = ?`, [sumber_dana_id], (err1, sumberRow) => {
          if (err1 || !sumberRow) {
            return reject(err1 || new Error('Sumber dana tidak ditemukan'))
          }

          const sumber_saldo = parseFloat(sumberRow.saldo) || 0

          if (terima_dana_id) {
            db.get(
              `SELECT saldo FROM saldo_awal WHERE id = ?`,
              [terima_dana_id],
              (err2, terimaRow) => {
                if (err2) return reject(err2)

                const terima_saldo = parseFloat(terimaRow?.saldo) || 0

                db.run(
                  `INSERT INTO history_transaksi (
                      transaksi_id, sumber_dana_id, sumber_dana_saldo_sebelum, terima_dana_id, terima_dana_saldo_sebelum
                    ) VALUES (?, ?, ?, ?, ?)`,
                  [transaksi_id, sumber_dana_id, sumber_saldo, terima_dana_id, terima_saldo],
                  (err3) => {
                    if (err3) return reject(err3)
                    updateSaldo()
                  }
                )
              }
            )
          } else {
            db.run(
              `INSERT INTO history_transaksi (
                  transaksi_id, sumber_dana_id, sumber_dana_saldo_sebelum
                ) VALUES (?, ?, ?)`,
              [transaksi_id, sumber_dana_id, sumber_saldo],
              (err4) => {
                if (err4) return reject(err4)
                updateSaldo()
              }
            )
          }

          function updateSaldo() {
            let perubahan_sumber = 0
            let perubahan_terima = 0

            switch (jenis_transaksi) {
              case 'Tarik Tunai':
                perubahan_sumber = -1 * nominal
                if (metode_pembayaran === 'cash') {
                  perubahan_sumber += feeTransaksi
                } else {
                  perubahan_terima = nominal + feeTransaksi
                }
                break

              case 'Transfer':
                perubahan_sumber = -1 * (nominal + biayaAdmin)
                perubahan_terima = nominal + feeTransaksi
                break

              case 'Jasa Transfer':
                perubahan_terima = feeTransaksi
                break

              case 'Mode Pulsa':
                perubahan_sumber = -1 * (nominal + biayaAdmin)
                perubahan_terima = nominal + feeTransaksi
                break
            }

            console.log('🧮 Perubahan Sumber:', perubahan_sumber)
            console.log('🧮 Perubahan Terima:', perubahan_terima)

            const updateQueries = []

            if (sumber_dana_id && perubahan_sumber !== 0) {
              updateQueries.push(
                new Promise((res, rej) => {
                  db.run(
                    `UPDATE saldo_awal SET saldo = saldo + ? WHERE id = ?`,
                    [perubahan_sumber, sumber_dana_id],
                    function (err) {
                      if (err) return rej(err)
                      res()
                    }
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
                    function (err) {
                      if (err) return rej(err)
                      res()
                    }
                  )
                })
              )
            }

            Promise.all(updateQueries)
              .then(() => {
                db.all(`SELECT * FROM saldo_awal`, (err, rows) => {
                  if (!err) console.log('📊 Saldo akhir:', rows)
                  resolve({ id: transaksi_id, no_transaksi })
                })
              })
              .catch(reject)
          }
        })
      }
    )
  })
}

export function deleteTransaksi(_event, id) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.get(`SELECT * FROM transaksi WHERE id = ?`, [id], (err, trx) => {
        if (err || !trx) return reject(err || new Error('Transaksi tidak ditemukan'))

        db.get(`SELECT * FROM history_transaksi WHERE transaksi_id = ?`, [id], (err2, history) => {
          if (err2 || !history) return reject(err2 || new Error('History tidak ditemukan'))

          // MULAI TRANSAKSI
          db.run('BEGIN TRANSACTION', (beginErr) => {
            if (beginErr) return reject(beginErr)

            // UPDATE saldo sumber
            db.run(
              `UPDATE saldo_awal SET saldo = ? WHERE id = ?`,
              [history.sumber_dana_saldo_sebelum, history.sumber_dana_id],
              (err3) => {
                if (err3) return rollback(err3)

                // Kalau ada saldo terima, update juga
                if (history.terima_dana_id) {
                  db.run(
                    `UPDATE saldo_awal SET saldo = ? WHERE id = ?`,
                    [history.terima_dana_saldo_sebelum, history.terima_dana_id],
                    (err4) => {
                      if (err4) return rollback(err4)
                      deleteTransaksi()
                    }
                  )
                } else {
                  deleteTransaksi()
                }
              }
            )

            function deleteTransaksi() {
              db.run(`DELETE FROM transaksi WHERE id = ?`, [id], (err5) => {
                if (err5) return rollback(err5)

                db.run(`DELETE FROM history_transaksi WHERE transaksi_id = ?`, [id], (err6) => {
                  if (err6) return rollback(err6)

                  db.run('COMMIT', (commitErr) => {
                    if (commitErr) return rollback(commitErr)
                    resolve({ success: true })
                  })
                })
              })
            }

            function rollback(error) {
              db.run('ROLLBACK', () => {
                reject(error)
              })
            }
          })
        })
      })
    })
  })
}
