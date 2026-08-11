import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import { useState } from 'react'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

// ─────────────────────────────────────────────────────────
// Rentang tanggal untuk halaman histori yang dilihat ADMIN (Transaksi, Hutang,
// Pindah Saldo, Ambil Saldo, Koreksi Transaksi, Semua Transaksi). Ini BUKAN
// pembatasan hak akses — admin tetap boleh lihat kapan saja. Ini murni default
// performa: default 30 hari terakhir memakai index tanggal yang sama dengan
// kasir, jauh lebih cepat daripada SELECT tanpa WHERE untuk toko yang
// riwayatnya sudah panjang. "Semua Riwayat" tetap salah satu pilihan (bukan
// tombol terpisah yang menakutkan), tapi bukan default halaman.
//
// Satu file ini jadi SATU SUMBER KEBENARAN untuk logika rentang di semua
// halaman — supaya tidak ada 5-6 salinan logika yang sama yang bisa saling
// berbeda seiring waktu.
// ─────────────────────────────────────────────────────────

export const ADMIN_RANGE_PRESETS = [
	{ key: '7d', label: '7 Hari' },
	{ key: '30d', label: '30 Hari' },
	{ key: 'month', label: 'Bulan Ini' },
	{ key: 'custom', label: 'Custom' },
	{ key: 'all', label: 'Semua Riwayat' }
]

// Mengembalikan { from, to } dalam format 'YYYY-MM-DD', atau null kalau rentang
// belum bisa ditentukan (mis. custom yang belum lengkap/valid). from/to null
// pada preset 'all' itu disengaja — artinya "jangan kirim rentang sama sekali"
// ke backend, beda dengan custom yang belum valid (yang harus menunda fetch).
export const getAdminPresetRange = (preset, customFrom, customTo) => {
	const today = dayjs().tz('Asia/Jakarta')
	switch (preset) {
		case '7d':
			return { from: today.subtract(6, 'day').format('YYYY-MM-DD'), to: today.format('YYYY-MM-DD') }
		case '30d':
			return { from: today.subtract(29, 'day').format('YYYY-MM-DD'), to: today.format('YYYY-MM-DD') }
		case 'month':
			return { from: today.startOf('month').format('YYYY-MM-DD'), to: today.format('YYYY-MM-DD') }
		case 'custom':
			return { from: customFrom || null, to: customTo || null }
		case 'all':
		default:
			return { from: null, to: null }
	}
}

export const isAdminCustomRangeReady = (preset, customFrom, customTo) =>
	preset !== 'custom' || Boolean(customFrom && customTo && customFrom <= customTo)

/**
 * Hook state rentang tanggal admin. Halaman yang memakai hook ini cukup:
 *  1. Panggil `useAdminDateRange()` untuk dapat state chip + `range` aktif.
 *  2. Kirim `range.from`/`range.to` (kalau ada) ke API sebagai dateFrom/dateTo.
 *  3. Render <AdminRangeFilterBar {...adminRange} .../> untuk UI-nya.
 *
 * PENTING: chip rentang ini SELALU independen dari filter tabel (jenis
 * transaksi, sumber dana, pencarian, dst). Filter tabel bekerja di dalam data
 * yang SUDAH ke-load sesuai rentang aktif — tidak memicu fetch ulang ke
 * seluruh riwayat. Ini keputusan sadar: auto-widen ke seluruh riwayat setiap
 * kali ada filter aktif ternyata sama beratnya dengan tidak ada pembatasan
 * sama sekali. Kalau data yang dicari tidak ketemu di rentang aktif, admin
 * tinggal ganti chip (termasuk ke "Semua Riwayat") — chip tetap bisa diklik
 * kapan saja, tidak pernah di-disable oleh state filter apa pun.
 */
export function useAdminDateRange({ defaultPreset = '30d' } = {}) {
	const [rangePreset, setRangePreset] = useState(defaultPreset)
	const [customFrom, setCustomFrom] = useState('')
	const [customTo, setCustomTo] = useState('')

	const isReady = isAdminCustomRangeReady(rangePreset, customFrom, customTo)
	const range = getAdminPresetRange(rangePreset, customFrom, customTo)

	return {
		rangePreset,
		setRangePreset,
		customFrom,
		setCustomFrom,
		customTo,
		setCustomTo,
		isReady,
		range
	}
}