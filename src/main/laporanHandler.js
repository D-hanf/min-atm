import db from './db.js'

// ===== saveSummaryData (dipindah dari index.js baris 358-373) =====
export async function saveSummaryData(event, summaryData) {
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
}

// ===== getSummaryLog (dipindah dari index.js baris 395-426) =====
export async function getSummaryLog() {
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
}

// ===== getLaporanKeuangan (dipindah dari index.js baris 481-636) =====
export async function getLaporanKeuangan(event, roleRaw) {
      // Fetch all data
      const getTransaksi = () =>
        new Promise((resolve, reject) => {
          db.all(
            `SELECT t.*, s.nama_sumber_dana as sumber_dana, s2.nama_sumber_dana as terima_dana_nama,
                    s3.nama_sumber_dana as bonus_sumber_dana_nama,
                    COALESCE(al.nama_alat, t.alat_nama) as alat_nama_live
             FROM transaksi t
             LEFT JOIN saldo_awal s ON t.sumber_dana_id = s.id
             LEFT JOIN saldo_awal s2 ON t.terima_dana_id = s2.id
             LEFT JOIN saldo_awal s3 ON t.bonus_sumber_dana_id = s3.id
             LEFT JOIN alat al ON t.alat_id = al.id`,
            [],
            (err, rows) => {
              if (err) reject(err)
              else resolve(rows)
            }
          )
        })
      const getHutang = () =>
        new Promise((resolve, reject) => {
          db.all(
            'SELECT h.*, s.nama_sumber_dana as sumber_dana FROM hutang h LEFT JOIN saldo_awal s ON h.platform_id = s.id',
            [],
            (err, rows) => {
              if (err) reject(err)
              else resolve(rows)
            }
          )
        })
      const getAmbilSaldo = () =>
        new Promise((resolve, reject) => {
          db.all(
            'SELECT a.*, s.nama_sumber_dana as sumber_dana FROM ambil_saldo a LEFT JOIN saldo_awal s ON a.platform = s.nama_sumber_dana',
            [],
            (err, rows) => {
              if (err) reject(err)
              else resolve(rows)
            }
          )
        })
      const getPindahSaldo = () =>
        new Promise((resolve, reject) => {
          db.all(
            'SELECT p.*, s1.nama_sumber_dana as sumber_dana, s2.nama_sumber_dana as terima_dana_nama FROM pindah_saldo p LEFT JOIN saldo_awal s1 ON p.sumber_dana_id = s1.id LEFT JOIN saldo_awal s2 ON p.tujuan_dana_id = s2.id',
            [],
            (err, rows) => {
              if (err) reject(err)
              else resolve(rows)
            }
          )
        })

      // Fetch all
      const [transaksi, hutang, ambilSaldo, pindahSaldo, totalHutangRows] = await Promise.all([
        getTransaksi(),
        getHutang(),
        getAmbilSaldo(),
        getPindahSaldo(),
        new Promise((resolve, reject) => {
          db.get(
            'SELECT SUM(nominal_transaksi) as total FROM hutang WHERE status_bayar = 0',
            [],
            (err, row) => {
              if (err) reject(err)
              else resolve(row)
            }
          )
        })
      ])

      const totalHutang = Number(totalHutangRows?.total || 0)

      // Format transaksi
      const formattedTransaksi = transaksi.map((item) => {
        // Nominal keluar = nominal_transaksi + biaya_admin_bank
        const nominalKeluar =
          Number(item.nominal_transaksi || 0) + Number(item.biaya_admin_bank || 0)
        const nominalMasuk = Number(item.nominal_transaksi || 0) + Number(item.fee || 0)
        const bonusAlat = Number(item.bonus || 0)
        // Bonus alat (dari bank penyedia EDC dll, misal transaksi Cek Saldo) ikut jadi keuntungan toko
        const keuntungan = nominalMasuk - nominalKeluar + bonusAlat
        return {
          tanggal: item.tanggal,
          sumber_dana: item.sumber_dana || '-',
          terima_dana_nama: item.terima_dana_nama || '-',
          jenis_transaksi: item.jenis_transaksi || '-',
          nominal_transaksi: nominalKeluar,
          nominal_masuk: nominalMasuk,
          keuntungan,
          bonus_alat: bonusAlat,
          alat_nama: bonusAlat > 0 ? (item.alat_nama_live || item.alat_nama || 'Tanpa Alat') : '-',
          bonus_sumber_dana_nama: bonusAlat > 0 ? (item.bonus_sumber_dana_nama || 'Belum diatur') : '-',
          admin_bank: Number(item.biaya_admin_bank || 0),
          total_hutang: totalHutang,
          keterangan: item.keterangan || '-'
        }
      })

      // Format hutang
      const formattedHutang = hutang.map((item) => {
        const isBayarHutang = (item.jenis_transaksi || '').toLowerCase() === 'bayar hutang'
        const nominal = Number(item.nominal_transaksi || 0)
        const biayaAdmin = Number(item.biaya_admin || 0)
        // Untuk Bayar Hutang, nominal keluar = nominal + admin
        return {
          tanggal: item.tanggal_transaksi,
          sumber_dana: item.sumber_dana || '-',
          terima_dana_nama: '-',
          jenis_transaksi: item.jenis_transaksi || 'Hutang',
          nominal_transaksi: isBayarHutang ? nominal + biayaAdmin : 0,
          nominal_masuk: isBayarHutang ? 0 : nominal,
          keuntungan: 0,
          bonus_alat: 0,
          admin_bank: isBayarHutang ? biayaAdmin : 0,
          total_hutang: totalHutang,
          keterangan: item.keterangan || '-'
        }
      })

      // Format ambil saldo
      const formattedAmbilSaldo = ambilSaldo.map((item) => {
        const nominal = Number(item.nominal_pengambilan || 0)
        return {
          tanggal: item.tanggal_pengambilan,
          sumber_dana: item.sumber_dana || '-',
          terima_dana_nama: '-',
          jenis_transaksi: 'Ambil Saldo',
          nominal_transaksi: nominal,
          nominal_masuk: 0,
          keuntungan: 0,
          bonus_alat: 0,
          admin_bank: Number(item.biaya_admin || 0),
          total_hutang: totalHutang,
          keterangan: item.keterangan || '-'
        }
      })

      // Format pindah saldo
      const formattedPindahSaldo = pindahSaldo.map((item) => {
        // Nominal keluar = nominal + biaya_admin
        const nominal = Number(item.nominal || 0)
        const biayaAdmin = Number(item.biaya_admin || 0)
        const nominalKeluar = nominal + biayaAdmin
        const nominalMasuk = nominal
        // Pastikan keuntungan selalu 0 untuk pindah saldo
        return {
          tanggal: item.tanggal,
          sumber_dana: item.sumber_dana || '-',
          terima_dana_nama: item.terima_dana_nama || '-',
          jenis_transaksi: 'Pindah Saldo',
          nominal_transaksi: nominalKeluar,
          nominal_masuk: nominalMasuk,
          keuntungan: 0,
          bonus_alat: 0,
          admin_bank: biayaAdmin,
          total_hutang: totalHutang,
          keterangan: item.keterangan || '-'
        }
      })

      // Gabungkan semua data
      const allData = [
        ...formattedTransaksi,
        ...formattedHutang,
        ...formattedAmbilSaldo,
        ...formattedPindahSaldo
      ]
      return allData
}