import db from './db.js'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

// ──────────────────────────────────────────────
// GENERATE MEMBER ID  (MB-1001, MB-1002, dst.)
// ──────────────────────────────────────────────
function generateMemberId() {
  return new Promise((resolve, reject) => {
    db.get(`SELECT MAX(id) as maxId FROM members`, [], (err, row) => {
      if (err) return reject(err)
      const nextNum = (row?.maxId || 0) + 1001
      resolve(`MB-${nextNum}`)
    })
  })
}

// ──────────────────────────────────────────────
// MEMBERS CRUD
// ──────────────────────────────────────────────

/** Ambil semua member, urut terbaru dulu */
export function getMembers() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM members ORDER BY created_at DESC`,
      [],
      (err, rows) => (err ? reject(err) : resolve(rows || []))
    )
  })
}

/** Cari member berdasarkan member_id (untuk scan barcode / input manual) */
export function getMemberById(_event, member_id) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM members WHERE member_id = ?`,
      [member_id],
      (err, row) => (err ? reject(err) : resolve(row || null))
    )
  })
}

/** Buat member baru — member_id di-generate otomatis, pastikan unik */
export function createMember(_event, data) {
  return new Promise((resolve, reject) => {
    const { nama = null, telepon = null, alamat = null, keterangan = null } = data || {}

    const tryInsert = async (attempt = 0) => {
      if (attempt > 10) return reject(new Error('Gagal generate member_id unik setelah 10 percobaan'))
      try {
        const member_id = await generateMemberId()
        db.run(
          `INSERT INTO members (member_id, nama, telepon, alamat, keterangan)
           VALUES (?, ?, ?, ?, ?)`,
          [member_id, nama, telepon, alamat, keterangan],
          function (err) {
            if (err && err.code === 'SQLITE_CONSTRAINT') {
              return tryInsert(attempt + 1)
            }
            if (err) return reject(err)
            resolve({ id: this.lastID, member_id })
          }
        )
      } catch (err) {
        reject(err)
      }
    }

    tryInsert()
  })
}

/** Update data identitas member (nama, telepon, alamat, keterangan, is_active) */
export function updateMember(_event, { member_id, data }) {
  return new Promise((resolve, reject) => {
    const { nama, telepon, alamat, keterangan, is_active } = data || {}
    db.run(
      `UPDATE members
       SET nama = ?, telepon = ?, alamat = ?, keterangan = ?,
           is_active = ?, updated_at = datetime('now', 'localtime')
       WHERE member_id = ?`,
      [
        nama ?? null,
        telepon ?? null,
        alamat ?? null,
        keterangan ?? null,
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        member_id
      ],
      function (err) {
        if (err) return reject(err)
        resolve({ changes: this.changes })
      }
    )
  })
}

/** Nonaktifkan member (soft delete via is_active = 0) */
export function deactivateMember(_event, member_id) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE members SET is_active = 0, updated_at = datetime('now', 'localtime')
       WHERE member_id = ?`,
      [member_id],
      function (err) {
        if (err) return reject(err)
        resolve({ changes: this.changes })
      }
    )
  })
}

/** Aktifkan kembali member (is_active = 1) */
export function reactivateMember(_event, member_id) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE members SET is_active = 1, updated_at = datetime('now', 'localtime')
       WHERE member_id = ?`,
      [member_id],
      function (err) {
        if (err) return reject(err)
        resolve({ changes: this.changes })
      }
    )
  })
}

/** Hapus permanen member beserta riwayat poinnya (set transaksi.member_id = NULL agar data transaksi tetap aman) */
export function deleteMember(_event, member_id) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION')
      db.run(`UPDATE transaksi SET member_id = NULL WHERE member_id = ?`, [member_id])
      db.run(`DELETE FROM member_poin_log WHERE member_id = ?`, [member_id])
      db.run(`DELETE FROM members WHERE member_id = ?`, [member_id], function (err) {
        if (err) {
          db.run('ROLLBACK')
          return reject(err)
        }
        db.run('COMMIT', (commitErr) => {
          if (commitErr) {
            db.run('ROLLBACK')
            return reject(commitErr)
          }
          resolve({ success: true, changes: this.changes })
        })
      })
    })
  })
}

// ──────────────────────────────────────────────
// LINK TRANSAKSI → MEMBER + AUTO POIN
// ──────────────────────────────────────────────

/**
 * Kaitkan transaksi ke member + hitung + tambahkan poin otomatis.
 * Bisa dipanggil:
 *  - Langsung saat submit transaksi (kasir sepi, langsung isi member ID)
 *  - Belakangan setelah semua pelanggan dilayani (linkMemberToTransaksi)
 */
export function linkMemberToTransaksi(_event, { transaksi_id, member_id }) {
  return new Promise((resolve, reject) => {
    // 1. Ambil data transaksi
    db.get(
      `SELECT id, jenis_transaksi, nominal_transaksi, member_id AS existing_member FROM transaksi WHERE id = ?`,
      [transaksi_id],
      (err, trx) => {
        if (err || !trx) return reject(err || new Error('Transaksi tidak ditemukan'))

        // 2. Cek apakah poin transaksi ini sudah pernah diproses
        db.get(
          `SELECT id FROM member_poin_log WHERE transaksi_id = ?`,
          [transaksi_id],
          (logErr, existingLog) => {
            if (logErr) return reject(logErr)
            if (existingLog) {
              return reject(new Error(`Poin untuk transaksi #${transaksi_id} sudah pernah diproses`))
            }

            // Jika transaksi sudah terkait member LAIN yang berbeda
            if (trx.existing_member && trx.existing_member !== member_id) {
              return reject(new Error(`Transaksi #${transaksi_id} sudah terkait dengan member lain (${trx.existing_member})`))
            }

            // 3. Pastikan member ada & aktif
            db.get(`SELECT member_id, total_poin FROM members WHERE member_id = ? AND is_active = 1`, [member_id], (err2, member) => {
              if (err2 || !member) return reject(err2 || new Error('Member tidak ditemukan atau tidak aktif'))

              // 4. Hitung poin dari poin_rules
              hitungPoin(trx.jenis_transaksi, parseFloat(trx.nominal_transaksi) || 0)
                .then((poin) => {
                  const waktu = dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss')

                  db.serialize(() => {
                    db.run('BEGIN TRANSACTION')

                    // 5. Update transaksi.member_id jika belum terisi
                    db.run(
                      `UPDATE transaksi SET member_id = ? WHERE id = ?`,
                      [member_id, transaksi_id]
                    )

                    // 6. Tambah poin ke member (jika poin > 0)
                    if (poin > 0) {
                      db.run(
                        `UPDATE members SET total_poin = total_poin + ?, updated_at = ? WHERE member_id = ?`,
                        [poin, waktu, member_id]
                      )
                      // 7. Catat log poin
                      db.run(
                        `INSERT INTO member_poin_log (member_id, transaksi_id, poin_masuk, keterangan, created_at)
                         VALUES (?, ?, ?, ?, ?)`,
                        [member_id, transaksi_id, poin, `${trx.jenis_transaksi} - auto`, waktu]
                      )
                    }

                    db.run('COMMIT', (commitErr) => {
                      if (commitErr) {
                        db.run('ROLLBACK')
                        return reject(commitErr)
                      }
                      console.log(`✅ Success adding ${poin} poin to member ${member_id} for transaction #${transaksi_id}`)
                      resolve({ success: true, poin_ditambahkan: poin })
                    })
                  })
                })
                .catch(reject)
            })
          }
        )
      }
    )
  })
}

/** Putuskan kaitan transaksi dari member (batalkan poin) */
export function unlinkMemberFromTransaksi(_event, { transaksi_id }) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT member_id FROM transaksi WHERE id = ?`, [transaksi_id], (err, trx) => {
      if (err || !trx) return reject(err || new Error('Transaksi tidak ditemukan'))
      if (!trx.member_id) return resolve({ success: true, poin_dibatalkan: 0 })

      // Ambil log poin yang terkait transaksi ini
      db.get(
        `SELECT poin_masuk FROM member_poin_log WHERE transaksi_id = ?`,
        [transaksi_id],
        (err2, log) => {
          if (err2) return reject(err2)
          const poin = log ? log.poin_masuk : 0

          db.serialize(() => {
            db.run('BEGIN TRANSACTION')
            db.run(`UPDATE transaksi SET member_id = NULL WHERE id = ?`, [transaksi_id])
            if (poin > 0) {
              db.run(
                `UPDATE members SET total_poin = MAX(0, total_poin - ?) WHERE member_id = ?`,
                [poin, trx.member_id]
              )
              db.run(`DELETE FROM member_poin_log WHERE transaksi_id = ?`, [transaksi_id])
            }
            db.run('COMMIT', (err3) => {
              if (err3) { db.run('ROLLBACK'); return reject(err3) }
              resolve({ success: true, poin_dibatalkan: poin })
            })
          })
        }
      )
    })
  })
}

/** Riwayat poin seorang member */
export function getMemberPoinLog(_event, member_id) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT mpl.*, t.jenis_transaksi, t.nominal_transaksi, t.tanggal
       FROM member_poin_log mpl
       LEFT JOIN transaksi t ON mpl.transaksi_id = t.id
       WHERE mpl.member_id = ?
       ORDER BY mpl.created_at DESC`,
      [member_id],
      (err, rows) => (err ? reject(err) : resolve(rows || []))
    )
  })
}

// ──────────────────────────────────────────────
// POIN RULES (admin-configurable)
// ──────────────────────────────────────────────

export function getPoinRules() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM poin_rules ORDER BY jenis_transaksi, nominal_min`, [], (err, rows) =>
      err ? reject(err) : resolve(rows || [])
    )
  })
}

export function createPoinRule(_event, data) {
  const { jenis_transaksi, nominal_min = 0, nominal_max = null, poin = 1 } = data || {}
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO poin_rules (jenis_transaksi, nominal_min, nominal_max, poin) VALUES (?, ?, ?, ?)`,
      [jenis_transaksi, nominal_min, nominal_max, poin],
      function (err) {
        if (err) return reject(err)
        resolve({ id: this.lastID })
      }
    )
  })
}

export function updatePoinRule(_event, { id, data }) {
  const { jenis_transaksi, nominal_min, nominal_max, poin } = data || {}
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE poin_rules SET jenis_transaksi = ?, nominal_min = ?, nominal_max = ?, poin = ?,
       updated_at = datetime('now','localtime') WHERE id = ?`,
      [jenis_transaksi, nominal_min ?? 0, nominal_max ?? null, poin ?? 1, id],
      function (err) {
        if (err) return reject(err)
        resolve({ changes: this.changes })
      }
    )
  })
}

export function deletePoinRule(_event, id) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM poin_rules WHERE id = ?`, [id], function (err) {
      if (err) return reject(err)
      resolve({ changes: this.changes })
    })
  })
}

// ──────────────────────────────────────────────
// POIN SETTINGS & MASA BERLAKU (admin-only)
// ──────────────────────────────────────────────

export function getPoinSettings() {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM poin_settings WHERE id = 1`, [], (err, row) => {
      if (err) return reject(err)
      resolve(row || { id: 1, masa_berlaku_bulan: 0, terakhir_reset: null })
    })
  })
}

export function updatePoinSettings(_event, { masa_berlaku_bulan }) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE poin_settings SET masa_berlaku_bulan = ?, updated_at = datetime('now', 'localtime') WHERE id = 1`,
      [Number(masa_berlaku_bulan) || 0],
      function (err) {
        if (err) return reject(err)
        resolve({ changes: this.changes })
      }
    )
  })
}

export function resetAllMemberPoin(_event, { reason = 'Reset periodik admin' } = {}) {
  return new Promise((resolve, reject) => {
    const waktu = dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss')
    db.serialize(() => {
      db.run('BEGIN TRANSACTION')
      db.run(`UPDATE members SET total_poin = 0, updated_at = ?`, [waktu])
      db.run(
        `INSERT INTO member_poin_log (member_id, transaksi_id, poin_masuk, keterangan, created_at)
         SELECT member_id, NULL, -total_poin, ?, ? FROM members WHERE total_poin > 0`,
        [reason, waktu]
      )
      db.run(`UPDATE poin_settings SET terakhir_reset = ? WHERE id = 1`, [waktu])
      db.run('COMMIT', (err) => {
        if (err) {
          db.run('ROLLBACK')
          return reject(err)
        }
        resolve({ success: true, reset_at: waktu })
      })
    })
  })
}

// ──────────────────────────────────────────────
// HELPER: Hitung poin berdasarkan aturan
// ──────────────────────────────────────────────

function hitungPoin(jenis_transaksi, nominal) {
  return new Promise((resolve, reject) => {
    // Cari aturan yang cocok: jenis_transaksi spesifik ATAU '*' (semua jenis)
    // Utamakan jenis_transaksi spesifik dulu, baru '*'
    db.all(
      `SELECT * FROM poin_rules
       WHERE (jenis_transaksi = ? OR jenis_transaksi = '*')
         AND nominal_min <= ?
         AND (nominal_max IS NULL OR nominal_max >= ?)
       ORDER BY CASE WHEN jenis_transaksi = '*' THEN 1 ELSE 0 END ASC, nominal_min DESC
       LIMIT 1`,
      [jenis_transaksi, nominal, nominal],
      (err, rows) => {
        if (err) return reject(err)
        const rule = rows?.[0]
        if (rule) {
          resolve(Number(rule.poin))
        } else {
          // Jika belum ada aturan khusus yang cocok, berikan default 1 poin per transaksi
          resolve(1)
        }
      }
    )
  })
}

// ──────────────────────────────────────────────
// HELPER: Ambil jenis transaksi yang bisa dapat poin
// ──────────────────────────────────────────────

export function getJenisTransaksiDenganPoin() {
  return new Promise((resolve, reject) => {
    db.all('SELECT DISTINCT jenis_transaksi FROM poin_rules ORDER BY jenis_transaksi', [], (err, rows) => {
      if (err) return reject(err)
      const SEMUA_JENIS = ['Tarik Tunai', 'Transfer', 'Mode Pulsa']
      const hasStar = rows.some(r => r.jenis_transaksi === '*')
      if (hasStar) return resolve(SEMUA_JENIS)
      const hasil = rows.map(r => r.jenis_transaksi).filter(j => j !== '*')
      resolve(hasil.length > 0 ? hasil : SEMUA_JENIS)
    })
  })
}

// ──────────────────────────────────────────────
// TRANSAKSI DRAFT (member quick-input)
// ──────────────────────────────────────────────

export function getTransaksiDraft() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT d.*, m.nama as member_nama, m.telepon as member_telepon
       FROM transaksi_draft d
       LEFT JOIN members m ON m.member_id = d.member_id
       WHERE d.status = 'pending'
       ORDER BY d.created_at DESC`,
      [],
      (err, rows) => (err ? reject(err) : resolve(rows || []))
    )
  })
}

export function createTransaksiDraft(_event, data) {
  const { member_id = null, jenis_transaksi, nominal, tanggal, user_id = null, user_name = null } = data || {}
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO transaksi_draft (member_id, jenis_transaksi, nominal, tanggal, user_id, user_name, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [member_id, jenis_transaksi, Number(nominal) || 0, tanggal, user_id, user_name],
      function(err) { if (err) return reject(err); resolve({ id: this.lastID, success: true }) }
    )
  })
}

export function selesaikanTransaksiDraft(_event, { draft_id, transaksi_id }) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE transaksi_draft SET status = \'done\', transaksi_id = ? WHERE id = ?',
      [transaksi_id ?? null, draft_id],
      function(err) { if (err) return reject(err); resolve({ changes: this.changes, success: true }) }
    )
  })
}

export function deleteTransaksiDraft(_event, draft_id) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM transaksi_draft WHERE id = ?', [draft_id], function(err) {
      if (err) return reject(err); resolve({ changes: this.changes, success: true })
    })
  })
}
