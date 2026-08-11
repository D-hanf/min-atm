import { ADMIN_RANGE_PRESETS, getAdminPresetRange, isAdminCustomRangeReady } from '../hooks/useAdminDateRange'

import React from 'react'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

const toDisplayDate = (value) =>
	dayjs(value).isValid() ? dayjs(value).tz('Asia/Jakarta').format('YYYY-MM-DD') : value || '-'

/**
 * Bar chip rentang tanggal untuk halaman histori admin (Transaksi, Hutang,
 * Pindah Saldo, Ambil Saldo, Koreksi Transaksi, Semua Transaksi). Dipakai
 * bersama hook `useAdminDateRange`.
 *
 * `filterNotice`: kalau diisi (mis. "Filter tabel aktif — hasil dibatasi ke
 * rentang di atas."), teks di kanan bar diganti pesan ini. Ini MURNI informatif
 * — chip TETAP bisa diklik kapan saja, tidak pernah di-disable. Filter tabel
 * bekerja di dalam data yang sudah ke-load; kalau admin butuh data di luar
 * rentang itu, dia yang memilih ganti chip sendiri (termasuk ke "Semua Riwayat").
 */
const AdminRangeFilterBar = ({
	rangePreset,
	setRangePreset,
	customFrom,
	setCustomFrom,
	customTo,
	setCustomTo,
	filterNotice,
	isLoading = false,
	hasLoadedOnce = true
}) => {
	return (
		<div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
			<span className="text-xs font-medium text-gray-500">Rentang data:</span>

			{ADMIN_RANGE_PRESETS.map((preset) => (
				<button
					key={preset.key}
					type="button"
					onClick={() => setRangePreset(preset.key)}
					className={`rounded-full px-3 py-1 text-xs font-medium transition ${
						rangePreset === preset.key
							? preset.key === 'all'
								? 'bg-amber-500 text-white'
								: 'bg-slate-900 text-white'
							: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
					}`}
				>
					{preset.label}
				</button>
			))}

			{rangePreset === 'custom' && (
				<span className="flex items-center gap-1.5">
					<input
						type="date"
						value={customFrom}
						max={customTo || undefined}
						onChange={(e) => setCustomFrom(e.target.value)}
						className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700"
					/>
					<span className="text-xs text-gray-400">s/d</span>
					<input
						type="date"
						value={customTo}
						min={customFrom || undefined}
						onChange={(e) => setCustomTo(e.target.value)}
						className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700"
					/>
				</span>
			)}

			{isLoading && hasLoadedOnce && (
				<span className="text-xs text-gray-400 animate-pulse">Memuat…</span>
			)}

			<span className="ml-auto text-[11px] text-gray-400">
				{filterNotice
					? filterNotice
					: rangePreset === 'all'
						? 'Seluruh riwayat — bisa lebih lambat untuk data yang sudah sangat banyak.'
						: rangePreset === 'custom' && !isAdminCustomRangeReady(rangePreset, customFrom, customTo)
							? 'Pilih tanggal mulai dan akhir.'
							: (() => {
									const { from, to } = getAdminPresetRange(rangePreset, customFrom, customTo)
									return from && to ? `Menampilkan ${toDisplayDate(from)} – ${toDisplayDate(to)}` : ''
								})()}
			</span>
		</div>
	)
}

export default AdminRangeFilterBar