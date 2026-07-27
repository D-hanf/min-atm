// Util bersama dipakai oleh form-form transaksi (TarikTunai, Transfer, JasaTransfer, ModePulsa)
// untuk mencocokkan nominal transaksi ke rentang fee (fee_rules) atau bonus (alat_bonus_rules)
// yang sudah diatur admin di halaman Kelola Fee & Alat.

// Cari rentang yang cocok untuk sebuah nominal. `rules` adalah array hasil
// window.api.getFeeRules(jenis) atau window.api.getAlatBonusRules(alatId),
// masing-masing punya bentuk { nominal_min, nominal_max, fee } atau { ..., bonus }.
// nominal_max === null berarti "ke atas" / tak terbatas.
export function findMatchingRule(rules, nominal) {
  const n = Number(nominal) || 0
  if (!rules || rules.length === 0) return null

  const sorted = [...rules].sort((a, b) => Number(b.nominal_min) - Number(a.nominal_min))

  const exactMatch = sorted.find(
    (r) =>
      n >= Number(r.nominal_min) &&
      (r.nominal_max === null || r.nominal_max === undefined || n <= Number(r.nominal_max))
  )
  if (exactMatch) return exactMatch

  // Nominal di atas semua rentang yang sudah dibuat admin (misal admin cuma bikin
  // sampai 5jt tapi transaksi 10jt) -> pakai rentang tertinggi yang ada, jangan 0
  const highest = sorted[0]
  if (highest && n > Number(highest.nominal_min)) return highest

  return null
}

// Format angka ke tampilan "Rp 25.000" untuk ditampilkan di input teks
export const formatRupiahDisplay = (value) =>
  value || value === 0
    ? new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value)
    : ''

// Balikin input teks yang sudah diformat Rupiah jadi angka murni
export const parseRupiahInput = (value) => parseInt(String(value ?? '').replace(/[^\d]/g, ''), 10) || 0