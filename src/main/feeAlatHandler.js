import db from './db.js'

// 5 menu transaksi yang ada di TransactionMenu.jsx
export const JENIS_TRANSAKSI_VALID = [
  'Tarik Tunai',
  'Transfer',
  'Jasa Transfer',
  'Mode Pulsa',
  'Cek Saldo'
]

const normalizeRange = ({ nominal_min, nominal_max }) => {
  const min = Number(nominal_min) || 0
  const max =
    nominal_max === '' || nominal_max === null || nominal_max === undefined
      ? null // null = "tak terbatas / ke atas"
      : Number(nominal_max)
  return { min, max }
}

// =====================================================================
// VALIDASI RENTANG — dipakai bareng oleh fee_rules & alat_bonus_rules
// Tujuan:
//  1. Cegah rentang baru/diubah bertabrakan (overlap) dengan rentang lain
//     di grup yang sama (jenis_transaksi untuk fee, alat_id untuk bonus)
//  2. Cegah "gap" di ujung atas: hanya boleh ada SATU rentang "ke atas"
//     (nominal_max kosong) per grup, dan rentang itu tidak boleh dihapus
//     atau diubah jadi tertutup selama masih ada rentang lain di grup itu
// =====================================================================

// Ambil semua rules dalam satu grup, opsional exclude 1 id (dipakai saat update)
function getGroupRules(table, groupColumn, groupValue, excludeId) {
  return new Promise((resolve, reject) => {
    const query = excludeId
      ? `SELECT * FROM ${table} WHERE ${groupColumn} = ? AND id != ?`
      : `SELECT * FROM ${table} WHERE ${groupColumn} = ?`
    const params = excludeId ? [groupValue, excludeId] : [groupValue]

    db.all(query, params, (err, rows) => {
      if (err) return reject(err)
      resolve(rows || [])
    })
  })
}

// Cari rentang existing yang bertabrakan dengan rentang [min, max] baru
// (max null = "ke atas" = dianggap tak terhingga). Batas dianggap inklusif
// di kedua sisi, sama seperti cara findFeeForNominal/findBonusForNominal mencocokkan nominal.
function findOverlap(existingRules, min, max) {
  const newMax = max === null ? Infinity : max
  return existingRules.find((rule) => {
    const ruleMax = rule.nominal_max === null ? Infinity : rule.nominal_max
    return min <= ruleMax && rule.nominal_min <= newMax
  })
}

function formatRange(rule) {
  return rule.nominal_max === null
    ? `${rule.nominal_min} ke atas`
    : `${rule.nominal_min} - ${rule.nominal_max}`
}

// Validasi sebelum INSERT rentang baru, atau sebelum UPDATE (excludeId = id rentang yang diedit)
async function validateRangeRule({ table, groupColumn, groupValue, min, max, excludeId }) {
  const existingRules = await getGroupRules(table, groupColumn, groupValue, excludeId)

  const overlapping = findOverlap(existingRules, min, max)
  if (overlapping) {
    throw new Error(`Rentang bertabrakan dengan aturan yang sudah ada (${formatRange(overlapping)})`)
  }

  if (max === null) {
    const existingOpenRule = existingRules.find((rule) => rule.nominal_max === null)
    if (existingOpenRule) {
      throw new Error('Sudah ada rentang "ke atas" untuk data ini. Ubah atau hapus dulu rentang tersebut sebelum menambah yang baru.')
    }
  }
}

// =====================================================================
// FEE RULES — aturan fee berjenjang per jenis transaksi
// =====================================================================

// jenisTransaksi opsional; kalau kosong, ambil semua (dikelompokkan di sisi renderer)
export function getFeeRules(_event, jenisTransaksi) {
  return new Promise((resolve, reject) => {
    const query = jenisTransaksi
      ? `SELECT * FROM fee_rules WHERE jenis_transaksi = ? ORDER BY nominal_min ASC`
      : `SELECT * FROM fee_rules ORDER BY jenis_transaksi ASC, nominal_min ASC`
    const params = jenisTransaksi ? [jenisTransaksi] : []

    db.all(query, params, (err, rows) => {
      if (err) return reject(err)
      resolve(rows || [])
    })
  })
}

export function createFeeRule(_event, data) {
  return new Promise((resolve, reject) => {
    const { jenis_transaksi, fee } = data

    if (!JENIS_TRANSAKSI_VALID.includes(jenis_transaksi)) {
      return reject(new Error('Jenis transaksi tidak valid'))
    }
    if (fee === '' || fee === null || fee === undefined) {
      return reject(new Error('Fee wajib diisi'))
    }

    const { min, max } = normalizeRange(data)
    if (max !== null && max <= min) {
      return reject(new Error('Nominal maksimum harus lebih besar dari nominal minimum'))
    }

    validateRangeRule({
      table: 'fee_rules',
      groupColumn: 'jenis_transaksi',
      groupValue: jenis_transaksi,
      min,
      max
    })
      .then(() => {
        db.run(
          `INSERT INTO fee_rules (jenis_transaksi, nominal_min, nominal_max, fee, updated_at)
           VALUES (?, ?, ?, ?, datetime('now', 'localtime'))`,
          [jenis_transaksi, min, max, Number(fee)],
          function (err) {
            if (err) return reject(err)
            resolve({ id: this.lastID, success: true })
          }
        )
      })
      .catch(reject)
  })
}

export function updateFeeRule(_event, data) {
  return new Promise((resolve, reject) => {
    const { id, jenis_transaksi, fee } = data
    if (!id) return reject(new Error('ID aturan fee tidak valid'))
    if (!JENIS_TRANSAKSI_VALID.includes(jenis_transaksi)) {
      return reject(new Error('Jenis transaksi tidak valid'))
    }

    const { min, max } = normalizeRange(data)
    if (max !== null && max <= min) {
      return reject(new Error('Nominal maksimum harus lebih besar dari nominal minimum'))
    }

    db.get(`SELECT * FROM fee_rules WHERE id = ?`, [id], (err, currentRule) => {
      if (err) return reject(err)
      if (!currentRule) return reject(new Error('Aturan fee tidak ditemukan'))

      const runUpdate = () => {
        db.run(
          `UPDATE fee_rules
           SET jenis_transaksi = ?, nominal_min = ?, nominal_max = ?, fee = ?, updated_at = datetime('now', 'localtime')
           WHERE id = ?`,
          [jenis_transaksi, min, max, Number(fee), id],
          function (err2) {
            if (err2) return reject(err2)
            resolve({ success: true, changes: this.changes })
          }
        )
      }

      const runValidationThenUpdate = () => {
        validateRangeRule({
          table: 'fee_rules',
          groupColumn: 'jenis_transaksi',
          groupValue: jenis_transaksi,
          min,
          max,
          excludeId: id
        })
          .then(runUpdate)
          .catch(reject)
      }

      // Rentang ini sedang "ke atas" tapi mau diubah jadi tertutup —
      // hanya boleh kalau tidak ada rentang lain lagi di jenis transaksi ini
      const isDowngradingFromOpen = currentRule.nominal_max === null && max !== null
      if (isDowngradingFromOpen) {
        getGroupRules('fee_rules', 'jenis_transaksi', jenis_transaksi, id)
          .then((otherRules) => {
            if (otherRules.length > 0) {
              return reject(new Error('Rentang ini adalah rentang "ke atas". Tidak bisa diubah jadi rentang tertutup selama masih ada rentang lain untuk jenis transaksi ini. Jadikan rentang lain sebagai "ke atas" terlebih dahulu.'))
            }
            runValidationThenUpdate()
          })
          .catch(reject)
      } else {
        runValidationThenUpdate()
      }
    })
  })
}

export function deleteFeeRule(_event, id) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM fee_rules WHERE id = ?`, [id], (err, rule) => {
      if (err) return reject(err)
      if (!rule) return reject(new Error('Aturan fee tidak ditemukan'))

      const proceed = () => {
        db.run(`DELETE FROM fee_rules WHERE id = ?`, [id], function (err2) {
          if (err2) return reject(err2)
          resolve({ success: true, changes: this.changes })
        })
      }

      if (rule.nominal_max === null) {
        getGroupRules('fee_rules', 'jenis_transaksi', rule.jenis_transaksi, id).then((otherRules) => {
          if (otherRules.length > 0) {
            return reject(new Error('Tidak bisa menghapus rentang "ke atas" selama masih ada rentang lain untuk jenis transaksi ini. Jadikan salah satu rentang lain sebagai "ke atas" terlebih dahulu.'))
          }
          proceed()
        }).catch(reject)
      } else {
        proceed()
      }
    })
  })
}

// =====================================================================
// ALAT — master alat (EDC dll)
// =====================================================================

export function getAlat() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM alat ORDER BY nama_alat ASC`, [], (err, rows) => {
      if (err) return reject(err)
      resolve(rows || [])
    })
  })
}

export function createAlat(_event, data) {
  return new Promise((resolve, reject) => {
    const {
      nama_alat,
      keterangan = '',
      bonus_cek_saldo = 0,
      bonus_tarik_tunai = 0,
      sumber_dana_bonus_id = null
    } = data
    if (!nama_alat || !nama_alat.trim()) return reject(new Error('Nama alat wajib diisi'))

    db.run(
      `INSERT INTO alat (nama_alat, keterangan, is_active, bonus_cek_saldo, bonus_tarik_tunai, sumber_dana_bonus_id)
       VALUES (?, ?, 1, ?, ?, ?)`,
      [
        nama_alat.trim(),
        keterangan,
        Number(bonus_cek_saldo) || 0,
        Number(bonus_tarik_tunai) || 0,
        sumber_dana_bonus_id || null
      ],
      function (err) {
        if (err) return reject(err)
        resolve({ id: this.lastID, success: true })
      }
    )
  })
}

export function updateAlat(_event, data) {
  return new Promise((resolve, reject) => {
    const {
      id,
      nama_alat,
      keterangan = '',
      is_active = 1,
      bonus_cek_saldo = 0,
      bonus_tarik_tunai = 0,
      sumber_dana_bonus_id = null
    } = data
    if (!id) return reject(new Error('ID alat tidak valid'))
    if (!nama_alat || !nama_alat.trim()) return reject(new Error('Nama alat wajib diisi'))

    db.run(
      `UPDATE alat
       SET nama_alat = ?, keterangan = ?, is_active = ?,
           bonus_cek_saldo = ?, bonus_tarik_tunai = ?, sumber_dana_bonus_id = ?
       WHERE id = ?`,
      [
        nama_alat.trim(),
        keterangan,
        is_active ? 1 : 0,
        Number(bonus_cek_saldo) || 0,
        Number(bonus_tarik_tunai) || 0,
        sumber_dana_bonus_id || null,
        id
      ],
      function (err) {
        if (err) return reject(err)
        resolve({ success: true, changes: this.changes })
      }
    )
  })
}

// Hapus alat sekaligus semua aturan bonusnya (biar tidak ada data bonus "nyantol")
export function deleteAlat(_event, id) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION', (beginErr) => {
        if (beginErr) return reject(beginErr)

        db.run(`DELETE FROM alat_bonus_rules WHERE alat_id = ?`, [id], (err1) => {
          if (err1) return db.run('ROLLBACK', () => reject(err1))

          db.run(`DELETE FROM alat_bonus_per_jenis WHERE alat_id = ?`, [id], (err2) => {
            if (err2) return db.run('ROLLBACK', () => reject(err2))

            db.run(`DELETE FROM alat_bonus_jenis_rules WHERE alat_id = ?`, [id], (err3) => {
              if (err3) return db.run('ROLLBACK', () => reject(err3))

              db.run(`DELETE FROM alat WHERE id = ?`, [id], function (err4) {
                if (err4) return db.run('ROLLBACK', () => reject(err4))

                db.run('COMMIT', (commitErr) => {
                  if (commitErr) return reject(commitErr)
                  resolve({ success: true, changes: this.changes })
                })
              })
            })
          })
        })
      })
    })
  })
}

// =====================================================================
// ALAT BONUS RULES — aturan bonus berjenjang per alat
// =====================================================================

export function getAlatBonusRules(_event, alatId) {
  return new Promise((resolve, reject) => {
    const query = alatId
      ? `SELECT * FROM alat_bonus_rules WHERE alat_id = ? ORDER BY nominal_min ASC`
      : `SELECT * FROM alat_bonus_rules ORDER BY alat_id ASC, nominal_min ASC`
    const params = alatId ? [alatId] : []

    db.all(query, params, (err, rows) => {
      if (err) return reject(err)
      resolve(rows || [])
    })
  })
}

export function createAlatBonusRule(_event, data) {
  return new Promise((resolve, reject) => {
    const { alat_id, bonus } = data
    if (!alat_id) return reject(new Error('Alat wajib dipilih'))
    if (bonus === '' || bonus === null || bonus === undefined) {
      return reject(new Error('Bonus wajib diisi'))
    }

    const { min, max } = normalizeRange(data)
    if (max !== null && max <= min) {
      return reject(new Error('Nominal maksimum harus lebih besar dari nominal minimum'))
    }

    validateRangeRule({
      table: 'alat_bonus_rules',
      groupColumn: 'alat_id',
      groupValue: alat_id,
      min,
      max
    })
      .then(() => {
        db.run(
          `INSERT INTO alat_bonus_rules (alat_id, nominal_min, nominal_max, bonus, updated_at)
           VALUES (?, ?, ?, ?, datetime('now', 'localtime'))`,
          [alat_id, min, max, Number(bonus)],
          function (err) {
            if (err) return reject(err)
            resolve({ id: this.lastID, success: true })
          }
        )
      })
      .catch(reject)
  })
}

export function updateAlatBonusRule(_event, data) {
  return new Promise((resolve, reject) => {
    const { id, bonus } = data
    if (!id) return reject(new Error('ID aturan bonus tidak valid'))

    const { min, max } = normalizeRange(data)
    if (max !== null && max <= min) {
      return reject(new Error('Nominal maksimum harus lebih besar dari nominal minimum'))
    }

    db.get(`SELECT * FROM alat_bonus_rules WHERE id = ?`, [id], (err, currentRule) => {
      if (err) return reject(err)
      if (!currentRule) return reject(new Error('Aturan bonus tidak ditemukan'))

      const runUpdate = () => {
        db.run(
          `UPDATE alat_bonus_rules
           SET nominal_min = ?, nominal_max = ?, bonus = ?, updated_at = datetime('now', 'localtime')
           WHERE id = ?`,
          [min, max, Number(bonus), id],
          function (err2) {
            if (err2) return reject(err2)
            resolve({ success: true, changes: this.changes })
          }
        )
      }

      const runValidationThenUpdate = () => {
        validateRangeRule({
          table: 'alat_bonus_rules',
          groupColumn: 'alat_id',
          groupValue: currentRule.alat_id,
          min,
          max,
          excludeId: id
        })
          .then(runUpdate)
          .catch(reject)
      }

      const isDowngradingFromOpen = currentRule.nominal_max === null && max !== null
      if (isDowngradingFromOpen) {
        getGroupRules('alat_bonus_rules', 'alat_id', currentRule.alat_id, id)
          .then((otherRules) => {
            if (otherRules.length > 0) {
              return reject(new Error('Rentang ini adalah rentang "ke atas". Tidak bisa diubah jadi rentang tertutup selama masih ada rentang lain untuk alat ini. Jadikan rentang lain sebagai "ke atas" terlebih dahulu.'))
            }
            runValidationThenUpdate()
          })
          .catch(reject)
      } else {
        runValidationThenUpdate()
      }
    })
  })
}

export function deleteAlatBonusRule(_event, id) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM alat_bonus_rules WHERE id = ?`, [id], (err, rule) => {
      if (err) return reject(err)
      if (!rule) return reject(new Error('Aturan bonus tidak ditemukan'))

      const proceed = () => {
        db.run(`DELETE FROM alat_bonus_rules WHERE id = ?`, [id], function (err2) {
          if (err2) return reject(err2)
          resolve({ success: true, changes: this.changes })
        })
      }

      if (rule.nominal_max === null) {
        getGroupRules('alat_bonus_rules', 'alat_id', rule.alat_id, id).then((otherRules) => {
          if (otherRules.length > 0) {
            return reject(new Error('Tidak bisa menghapus rentang "ke atas" selama masih ada rentang lain untuk alat ini. Jadikan salah satu rentang lain sebagai "ke atas" terlebih dahulu.'))
          }
          proceed()
        }).catch(reject)
      } else {
        proceed()
      }
    })
  })
}

// =====================================================================
// ALAT BONUS PER JENIS TRANSAKSI — berjenjang berdasarkan rentang nominal,
// SEKALIGUS per jenis transaksi. Beda dengan alat_bonus_rules (yang cuma per
// alat, sama untuk semua jenis transaksi): di sini alat_id + jenis_transaksi
// + rentang nominal semuanya menentukan bonus yang berlaku.
// =====================================================================

// Ambil rules, opsional filter alat_id dan/atau jenis_transaksi.
// { alat_id, jenis_transaksi } -> keduanya opsional
export function getAlatBonusJenisRules(_event, filter = {}) {
  return new Promise((resolve, reject) => {
    const { alat_id, jenis_transaksi } = filter || {}
    let query = `
      SELECT r.*, a.nama_alat
      FROM alat_bonus_jenis_rules r
      LEFT JOIN alat a ON r.alat_id = a.id
    `
    const conditions = []
    const params = []

    if (alat_id) {
      conditions.push('r.alat_id = ?')
      params.push(alat_id)
    }
    if (jenis_transaksi) {
      conditions.push('r.jenis_transaksi = ?')
      params.push(jenis_transaksi)
    }
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`
    }
    query += ` ORDER BY a.nama_alat ASC, r.nominal_min ASC`

    db.all(query, params, (err, rows) => {
      if (err) return reject(err)
      resolve(rows || [])
    })
  })
}

// Grup rentang existing untuk kombinasi (alat_id, jenis_transaksi) tertentu — dipakai validasi overlap
function getAlatJenisGroupRules(alatId, jenisTransaksi, excludeId) {
  return new Promise((resolve, reject) => {
    const query = excludeId
      ? `SELECT * FROM alat_bonus_jenis_rules WHERE alat_id = ? AND jenis_transaksi = ? AND id != ?`
      : `SELECT * FROM alat_bonus_jenis_rules WHERE alat_id = ? AND jenis_transaksi = ?`
    const params = excludeId ? [alatId, jenisTransaksi, excludeId] : [alatId, jenisTransaksi]

    db.all(query, params, (err, rows) => {
      if (err) return reject(err)
      resolve(rows || [])
    })
  })
}

async function validateAlatJenisRangeRule({ alatId, jenisTransaksi, min, max, excludeId }) {
  const existingRules = await getAlatJenisGroupRules(alatId, jenisTransaksi, excludeId)

  const overlapping = findOverlap(existingRules, min, max)
  if (overlapping) {
    throw new Error(`Rentang bertabrakan dengan aturan yang sudah ada untuk alat ini (${formatRange(overlapping)})`)
  }

  if (max === null) {
    const existingOpenRule = existingRules.find((rule) => rule.nominal_max === null)
    if (existingOpenRule) {
      throw new Error('Sudah ada rentang "ke atas" untuk alat & jenis transaksi ini. Ubah atau hapus dulu rentang tersebut sebelum menambah yang baru.')
    }
  }
}

export function createAlatBonusJenisRule(_event, data) {
  return new Promise((resolve, reject) => {
    const { alat_id, jenis_transaksi, bonus } = data

    if (!alat_id) return reject(new Error('Alat wajib dipilih'))
    if (!JENIS_TRANSAKSI_VALID.includes(jenis_transaksi)) {
      return reject(new Error('Jenis transaksi tidak valid'))
    }
    if (bonus === '' || bonus === null || bonus === undefined) {
      return reject(new Error('Bonus wajib diisi'))
    }

    const { min, max } = normalizeRange(data)
    if (max !== null && max <= min) {
      return reject(new Error('Nominal maksimum harus lebih besar dari nominal minimum'))
    }

    validateAlatJenisRangeRule({ alatId: alat_id, jenisTransaksi: jenis_transaksi, min, max })
      .then(() => {
        db.run(
          `INSERT INTO alat_bonus_jenis_rules (alat_id, jenis_transaksi, nominal_min, nominal_max, bonus, updated_at)
           VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))`,
          [alat_id, jenis_transaksi, min, max, Number(bonus)],
          function (err) {
            if (err) return reject(err)
            resolve({ id: this.lastID, success: true })
          }
        )
      })
      .catch(reject)
  })
}

export function updateAlatBonusJenisRule(_event, data) {
  return new Promise((resolve, reject) => {
    const { id, bonus } = data
    if (!id) return reject(new Error('ID aturan bonus tidak valid'))

    const { min, max } = normalizeRange(data)
    if (max !== null && max <= min) {
      return reject(new Error('Nominal maksimum harus lebih besar dari nominal minimum'))
    }

    db.get(`SELECT * FROM alat_bonus_jenis_rules WHERE id = ?`, [id], (err, currentRule) => {
      if (err) return reject(err)
      if (!currentRule) return reject(new Error('Aturan bonus tidak ditemukan'))

      const runUpdate = () => {
        db.run(
          `UPDATE alat_bonus_jenis_rules
           SET nominal_min = ?, nominal_max = ?, bonus = ?, updated_at = datetime('now', 'localtime')
           WHERE id = ?`,
          [min, max, Number(bonus), id],
          function (err2) {
            if (err2) return reject(err2)
            resolve({ success: true, changes: this.changes })
          }
        )
      }

      const runValidationThenUpdate = () => {
        validateAlatJenisRangeRule({
          alatId: currentRule.alat_id,
          jenisTransaksi: currentRule.jenis_transaksi,
          min,
          max,
          excludeId: id
        })
          .then(runUpdate)
          .catch(reject)
      }

      const isDowngradingFromOpen = currentRule.nominal_max === null && max !== null
      if (isDowngradingFromOpen) {
        getAlatJenisGroupRules(currentRule.alat_id, currentRule.jenis_transaksi, id)
          .then((otherRules) => {
            if (otherRules.length > 0) {
              return reject(new Error('Rentang ini adalah rentang "ke atas". Tidak bisa diubah jadi rentang tertutup selama masih ada rentang lain untuk alat & jenis transaksi ini. Jadikan rentang lain sebagai "ke atas" terlebih dahulu.'))
            }
            runValidationThenUpdate()
          })
          .catch(reject)
      } else {
        runValidationThenUpdate()
      }
    })
  })
}

export function deleteAlatBonusJenisRule(_event, id) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM alat_bonus_jenis_rules WHERE id = ?`, [id], (err, rule) => {
      if (err) return reject(err)
      if (!rule) return reject(new Error('Aturan bonus tidak ditemukan'))

      const proceed = () => {
        db.run(`DELETE FROM alat_bonus_jenis_rules WHERE id = ?`, [id], function (err2) {
          if (err2) return reject(err2)
          resolve({ success: true, changes: this.changes })
        })
      }

      if (rule.nominal_max === null) {
        getAlatJenisGroupRules(rule.alat_id, rule.jenis_transaksi, id).then((otherRules) => {
          if (otherRules.length > 0) {
            return reject(new Error('Tidak bisa menghapus rentang "ke atas" selama masih ada rentang lain untuk alat & jenis transaksi ini. Jadikan salah satu rentang lain sebagai "ke atas" terlebih dahulu.'))
          }
          proceed()
        }).catch(reject)
      } else {
        proceed()
      }
    })
  })
}

// Helper — dipakai saat wiring form transaksi untuk auto-fill bonus berdasarkan
// alat + jenis transaksi + nominal yang dipilih/diisi kasir.
export function findBonusForAlatJenis(alatId, jenisTransaksi, nominal) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM alat_bonus_jenis_rules
       WHERE alat_id = ?
         AND jenis_transaksi = ?
         AND nominal_min <= ?
         AND (nominal_max IS NULL OR nominal_max >= ?)
       ORDER BY nominal_min DESC
       LIMIT 1`,
      [alatId, jenisTransaksi, nominal, nominal],
      (err, row) => {
        if (err) return reject(err)
        resolve(row || null)
      }
    )
  })
}

// =====================================================================
// HELPER — dipakai nanti waktu wiring form transaksi (Tarik Tunai, Cek Saldo, dll)
// Mencari fee/bonus yang cocok berdasarkan nominal transaksi.
// =====================================================================

export function findFeeForNominal(jenisTransaksi, nominal) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM fee_rules
       WHERE jenis_transaksi = ?
         AND nominal_min <= ?
         AND (nominal_max IS NULL OR nominal_max >= ?)
       ORDER BY nominal_min DESC
       LIMIT 1`,
      [jenisTransaksi, nominal, nominal],
      (err, row) => {
        if (err) return reject(err)
        resolve(row || null)
      }
    )
  })
}

export function findBonusForNominal(alatId, nominal) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM alat_bonus_rules
       WHERE alat_id = ?
         AND nominal_min <= ?
         AND (nominal_max IS NULL OR nominal_max >= ?)
       ORDER BY nominal_min DESC
       LIMIT 1`,
      [alatId, nominal, nominal],
      (err, row) => {
        if (err) return reject(err)
        resolve(row || null)
      }
    )
  })
}