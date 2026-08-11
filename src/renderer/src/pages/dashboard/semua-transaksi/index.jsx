import React, { useEffect, useMemo, useRef, useState } from 'react'

import AdminRangeFilterBar from '../../../components/AdminRangeFilterBar'
import DataVisibilitySettings from '../../../components/DataVisibilitySettings'
import PageContainer from '../../../components/PageContainer'
import TableContent from '../../../components/TableContent'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import { useAdminDateRange } from '../../../hooks/useAdminDateRange'
import { useAuth } from '../../../context/AuthContext'
import { useColumnSettings } from '../../../hooks/useColumnSettings'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

const formatRupiah = (value) =>
	new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		minimumFractionDigits: 0
	}).format(Number(value || 0))

const toDisplayDate = (value) =>
	dayjs(value).isValid() ? dayjs(value).tz('Asia/Jakarta').format('YYYY-MM-DD') : value || '-'

const toDisplayDateTime = (value) =>
	dayjs(value).isValid() ? dayjs(value).tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm') : value || '-'

const asArray = (value) => (Array.isArray(value) ? value : [])

const normalizeJenisTransaksi = (value) => {
	const text = (value || '').toString().toLowerCase()
	if (!text) return '-'
	if (text.includes('jasa')) return 'jasa transfer'
	if (text.includes('tarik')) return 'tarik tunai'
	if (text.includes('mode pulsa')) return 'mode pulsa'
	if (text.includes('transfer')) return 'transfer'
	if (text.includes('hutang')) return 'hutang'
	if (text.includes('ambil saldo')) return 'ambil saldo'
	if (text.includes('pindah saldo')) return 'pindah saldo'
	return text
}

const parseMoney = (value) => Number(String(value || 0).replace(/[^0-9]/g, '')) || 0

// Daftar tetap, sesuai keluaran normalizeJenisTransaksi di atas — dipakai sebagai
// opsi dropdown filter jenis transaksi supaya TIDAK bergantung pada data yang
// sedang ter-load (lihat penjelasan sumberDanaOptions/dst di bawah).
const JENIS_TRANSAKSI_OPTIONS = [
	'tarik tunai',
	'transfer',
	'jasa transfer',
	'mode pulsa',
	'hutang',
	'ambil saldo',
	'pindah saldo'
]

const getNamaSumberDanaById = (id, saldoList) => {
	const numericId = Number(id)
	const found = saldoList.find((item) => item.id === numericId)
	return found ? found.nama_sumber_dana : '-'
}

const SemuaTransaksi = () => {
	const { user } = useAuth()
	const userRole = user?.role?.toLowerCase() || 'kasir'
	const isAdmin = userRole === 'admin'
	const { isColumnVisible } = useColumnSettings('semuaTransaksi')
	const [isLoading, setIsLoading] = useState(true)
	const [loadError, setLoadError] = useState('')
	const [searchValue, setSearchValue] = useState('')
	const [rows, setRows] = useState([])
	const [visibilitySetting, setVisibilitySetting] = useState({ days: 1 })
	const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

	// Daftar nama sumber dana APA ADANYA dari master data (saldo_awal) — selalu
	// ditarik penuh setiap fetch (getSaldoAwal tidak ikut dibatasi rentang
	// tanggal). Dipakai sebagai opsi dropdown "Sumber Dana"/"Terima Dana"/
	// "Pembayar Fee" di TableContent, supaya opsinya tidak diam-diam hilang
	// hanya karena transaksi yang memakainya kebetulan di luar rentang aktif.
	const [saldoOptions, setSaldoOptions] = useState([])

	// Rentang tanggal khusus ADMIN — state & logikanya terpusat di
	// useAdminDateRange.js (satu sumber kebenaran buat semua halaman histori).
	const {
		rangePreset,
		setRangePreset,
		customFrom,
		setCustomFrom,
		customTo,
		setCustomTo,
		isReady: isRangeReady,
		range
	} = useAdminDateRange()

	// Menandai request fetch yang paling baru, supaya kalau admin ganti-ganti
	// rentang dengan cepat, respon yang datang belakangan (stale) tidak menimpa
	// respon dari rentang yang sudah ditinggalkan.
	const requestIdRef = useRef(0)

	// TableContent MENYIMPAN filternya sendiri secara internal (untuk menyaring
	// `rows` yang sudah ada), tapi juga MEMANGGIL callback ini tiap filter
	// berubah. Kita pakai itu MURNI buat notice informatif di AdminRangeFilterBar
	// — filter TIDAK memicu fetch ulang atau mengubah rentang yang ditarik dari
	// server. Filter bekerja di dalam data yang sudah ke-load sesuai chip yang
	// aktif; kalau data yang dicari ada di luar rentang itu, admin yang memilih
	// ganti chip sendiri (chip selalu bisa diklik kapan saja).
	const [activeSubFilters, setActiveSubFilters] = useState({
		date: '',
		jenisTransaksi: '',
		sumberDana: '',
		terimaDana: '',
		pembayarFee: '',
		edited: '',
		koreksi: '',
		manualOverride: ''
	})
	const makeSubFilterHandler = (key) => (value) =>
		setActiveSubFilters((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }))

	const isSearchingActive = isAdmin && searchValue.trim().length > 0
	const isFilteringActive = isAdmin && Object.values(activeSubFilters).some(Boolean)

	useEffect(() => {
		if (!user?.role) return
		// Untuk preset custom, tunda fetch sampai admin selesai memilih tanggal
		// awal & akhir yang valid — daripada diam-diam fetch semua data di antaranya.
		if (isAdmin && !isRangeReady) return

		const requestId = ++requestIdRef.current
		const fetchAll = async () => {
			try {
				setIsLoading(true)
				setLoadError('')

				// 🔒 Ambil setting visibilitas DULU, sebelum narik data lain. Backend sekarang
				// menerima (role, days) dan memfilter di level SQL (pakai index) — jadi kasir
				// betulan cuma menarik data sejumlah hari yang diizinkan, bukan menarik SEMUA
				// data sebagai 'admin' lalu dibuang lagi di client (itu penyebab utama lemot/
				// freeze-nya halaman ini setelah data numpuk setahun).
				const visibilityRes = await window.api?.getDataVisibilitySetting?.('semua-transaksi')
				const currentVisibility = {
					days: Number(visibilityRes?.days) > 0 ? Number(visibilityRes.days) : 1
				}
				setVisibilitySetting(currentVisibility)

				const dataFetchRole = isAdmin ? 'admin' : 'kasir'
				const fetchDays = currentVisibility.days

				// Kasir tidak terpengaruh sama sekali (from/to selalu undefined → backend
				// jalan seperti sebelumnya, dibatasi `fetchDays`). Admin mengirim rentang
				// tanggal sesuai preset yang dipilih ('all' → from/to undefined juga, artinya
				// seluruh histori — pilihan sadar admin lewat chip). Filter tabel & pencarian
				// TIDAK mengubah rentang ini — lihat komentar activeSubFilters di atas.
				const { from, to } = isAdmin ? range : {}

				const [transaksiRes, hutangRes, pindahRes, ambilRes, saldoRes, usersRes] =
					await Promise.allSettled([
						window.api?.getTransaksi?.(dataFetchRole, fetchDays, from || undefined, to || undefined),
						window.api?.getHutang?.(dataFetchRole, fetchDays, from || undefined, to || undefined),
						window.api?.getPindahSaldo?.(dataFetchRole, fetchDays, from || undefined, to || undefined),
						window.api?.getAmbilSaldo?.(dataFetchRole, fetchDays, from || undefined, to || undefined),
						window.api?.getSaldoAwal?.(),
						window.api?.getUsers?.()
					])

				// Kalau admin sudah ganti preset lagi sebelum request ini selesai, respon ini
				// basi — abaikan supaya tidak menimpa data dari rentang yang sedang aktif.
				if (requestId !== requestIdRef.current) return

				const transaksiList = asArray(transaksiRes.status === 'fulfilled' ? transaksiRes.value : [])
				const hutangList = asArray(hutangRes.status === 'fulfilled' ? hutangRes.value : [])
				const pindahList = asArray(pindahRes.status === 'fulfilled' ? pindahRes.value : [])
				const ambilList = asArray(ambilRes.status === 'fulfilled' ? ambilRes.value : [])
				const saldoList = asArray(saldoRes.status === 'fulfilled' ? saldoRes.value : [])
				const userList = asArray(usersRes.status === 'fulfilled' ? usersRes.value : [])

				const saldoById = new Map(saldoList.map((item) => [Number(item.id), item.nama_sumber_dana]))
				const userById = new Map(
					userList.map((item) => [Number(item.id), item.nama || item.name || item.username || '-'])
				)

				const mergedRows = [
					...transaksiList.map((item) => ({
						id: `transaksi-${item.id}`,
						sortDate: item.tanggal,
						tanggal: toDisplayDateTime(item.tanggal),
						tgl_bayar: '-',
						oleh: item.user_name || '-',
						jenis: normalizeJenisTransaksi(item.jenis_transaksi),
						jenis_transaksi: normalizeJenisTransaksi(item.jenis_transaksi),
						nominal: formatRupiah(item.nominal_transaksi),
						fee: formatRupiah(item.fee || 0),
						alat_nama: item.alat_nama || '-',
						bonus: formatRupiah(Number(item.bonus || 0)),
						biaya_admin: formatRupiah(Number(item.biaya_admin_bank || item.biaya_admin || 0)),
						sumber_dana: item.sumber_dana || '-',
						tujuan_dana: item.terima_dana_nama || '-',
						metode_pembayaran_nama: getNamaSumberDanaById(item.metode_pembayaran, saldoList) || '-',
						deskripsi: item.keterangan || '-',
						// Field status ini dibutuhkan TableContent untuk filter
						// "diedit" / "salah" / "benar" — cuma tabel transaksi yang
						// punya is_edited/is_fee_manual/is_bonus_manual.
						is_edited: Boolean(item.is_edited),
						is_marked_wrong: Boolean(item.is_marked_wrong),
						is_verified: Boolean(item.is_verified),
						is_fee_manual: Boolean(item.is_fee_manual),
						is_bonus_manual: Boolean(item.is_bonus_manual)
					})),
					...hutangList.map((item) => ({
						id: `hutang-${item.id}`,
						sortDate: item.tanggal_transaksi || item.tanggal,
						tanggal: toDisplayDateTime(item.tanggal_transaksi || item.tanggal),
						tgl_bayar: item.tanggal_bayar_hutang ? toDisplayDate(item.tanggal_bayar_hutang) : '-',
						oleh: userById.get(Number(item.petugas_id)) || item.user_name || item.petugas_name || '-',
						jenis: 'hutang',
						jenis_transaksi: 'hutang',
						nominal: formatRupiah(item.nominal_transaksi),
						fee: '-',
						alat_nama: '-',
						bonus: '-',
						biaya_admin: formatRupiah(Number(item.biaya_admin || 0)),
						sumber_dana: item.platform_name || item.platform || '-',
						tujuan_dana: '-',
						metode_pembayaran_nama: '-',
						deskripsi: item.keterangan || '-',
						// Hutang tidak punya kolom is_edited/manual — cuma salah/benar.
						is_marked_wrong: Boolean(item.is_marked_wrong),
						is_verified: Boolean(item.is_verified)
					})),
					...pindahList.map((item) => ({
						id: `pindah-${item.id}`,
						sortDate: item.tanggal,
						tanggal: toDisplayDateTime(item.tanggal),
						tgl_bayar: '-',
						oleh: userById.get(Number(item.user_pemindah_id)) || item.user || '-',
						jenis: 'pindah saldo',
						jenis_transaksi: 'pindah saldo',
						nominal: formatRupiah(item.nominal),
						fee: '-',
						alat_nama: '-',
						bonus: '-',
						biaya_admin: formatRupiah(Number(item.biaya_admin || 0)),
						sumber_dana: saldoById.get(Number(item.sumber_dana_id)) || item.sumber_dana || '-',
						tujuan_dana: saldoById.get(Number(item.tujuan_dana_id)) || item.tujuan_dana || '-',
						metode_pembayaran_nama: '-',
						deskripsi: item.keterangan || '-',
						is_marked_wrong: Boolean(item.is_marked_wrong),
						is_verified: Boolean(item.is_verified)
					})),
					...ambilList.map((item) => ({
						id: `ambil-${item.id}`,
						sortDate: item.tanggal_pengambilan,
						tanggal: toDisplayDateTime(item.tanggal_pengambilan),
						tgl_bayar: '-',
						oleh: userById.get(Number(item.petugas_pengambil_id)) || item.user_name || item.petugas_name || '-',
						jenis: 'ambil saldo',
						jenis_transaksi: 'ambil saldo',
						nominal: formatRupiah(item.nominal_pengambilan),
						fee: '-',
						alat_nama: '-',
						bonus: '-',
						biaya_admin: formatRupiah(Number(item.biaya_admin || 0)),
						sumber_dana: item.platform || item.platform_name || '-',
						tujuan_dana: '-',
						metode_pembayaran_nama: '-',
						deskripsi: item.keterangan || '-',
						is_marked_wrong: Boolean(item.is_marked_wrong),
						is_verified: Boolean(item.is_verified)
					}))
				].sort((a, b) => dayjs(b.sortDate).valueOf() - dayjs(a.sortDate).valueOf())

				// Data untuk kasir sudah difilter di level SQL (WHERE tanggal >= cutoff),
				// jadi tidak perlu filter ulang di sini.
				setRows(mergedRows)
				setSaldoOptions([...new Set(saldoList.map((item) => item.nama_sumber_dana).filter(Boolean))])
			} catch (error) {
				if (requestId !== requestIdRef.current) return
				console.error('❌ Gagal memuat data:', error)
				setLoadError('Gagal memuat data.')
			} finally {
				if (requestId === requestIdRef.current) {
					setIsLoading(false)
					setHasLoadedOnce(true)
				}
			}
		}

		fetchAll()
	}, [user?.role, isAdmin, rangePreset, customFrom, customTo])

	const totalRows = useMemo(() => rows.length, [rows.length])
	const summaryCards = useMemo(() => {
		const isTransaksi = (jenis) => ['tarik tunai', 'transfer', 'jasa transfer', 'mode pulsa'].includes(jenis)
		const transaksiRows = rows.filter((row) => isTransaksi((row.jenis_transaksi || row.jenis || '').toLowerCase()))
		const hutangRows = rows.filter((row) => (row.jenis_transaksi || row.jenis) === 'hutang')
		const mutasiSaldoRows = rows.filter((row) => ['pindah saldo', 'ambil saldo'].includes((row.jenis_transaksi || row.jenis || '').toLowerCase()))

		return [
			{
				label: 'Total Data',
				value: rows.length,
				subtitle: 'Semua pencatatan gabungan',
				tone: 'from-slate-900 via-slate-800 to-slate-700'
			},
			{
				label: 'Transaksi',
				value: transaksiRows.length,
				subtitle: `Nominal ${formatRupiah(transaksiRows.reduce((sum, row) => sum + parseMoney(row.nominal), 0))}`,
				tone: 'from-blue-700 via-blue-600 to-cyan-500'
			},
			{
				label: 'Hutang',
				value: hutangRows.length,
				subtitle: `Nominal ${formatRupiah(hutangRows.reduce((sum, row) => sum + parseMoney(row.nominal), 0))}`,
				tone: 'from-amber-700 via-amber-600 to-orange-500'
			},
			{
				label: 'Mutasi Saldo',
				value: mutasiSaldoRows.length,
				subtitle: `Nominal ${formatRupiah(mutasiSaldoRows.reduce((sum, row) => sum + parseMoney(row.nominal), 0))}`,
				tone: 'from-emerald-700 via-emerald-600 to-teal-500'
			}
		]
	}, [rows])

	return (
		<PageContainer title="Semua Transaksi">
			<div className="px-4 pb-6">
				<div className="mb-4">
					<p className="text-sm text-gray-500">
						Semua informasi transaksi, hutang, pindah saldo, dan ambil saldo.
					</p>
				</div>

				{isAdmin && (
					<DataVisibilitySettings
						pageKey="semua-transaksi"
						pageLabel="Semua Transaksi"
						onSaved={(setting) => setVisibilitySetting(setting)}
					/>
				)}

				{isAdmin && (
					<AdminRangeFilterBar
						rangePreset={rangePreset}
						setRangePreset={setRangePreset}
						customFrom={customFrom}
						setCustomFrom={setCustomFrom}
						customTo={customTo}
						setCustomTo={setCustomTo}
						filterNotice={
							isSearchingActive
								? 'Mencari kata kunci — hasil dibatasi ke rentang di atas. Ganti rentang atau pilih "Semua Riwayat" kalau tidak ketemu.'
								: isFilteringActive
									? 'Filter tabel aktif — hasil dibatasi ke rentang di atas. Ganti rentang atau pilih "Semua Riwayat" kalau tidak ketemu.'
									: null
						}
						isLoading={isLoading}
						hasLoadedOnce={hasLoadedOnce}
					/>
				)}

				<div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
					{summaryCards.map((card) => (
						<div
							key={card.label}
							className={`rounded-2xl bg-gradient-to-br ${card.tone} p-4 text-white shadow-md`}
						>
							<div className="text-sm/5 opacity-80">{card.label}</div>
							<div className="mt-2 text-2xl font-semibold">{card.value}</div>
							<div className="mt-1 text-xs opacity-80">{card.subtitle}</div>
						</div>
					))}
				</div>

				{!isAdmin && (
					<div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-700">
						Menampilkan data {visibilitySetting.days} hari terakhir (diatur oleh admin).
					</div>
				)}

				{loadError && (
					<div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
						{loadError}
					</div>
				)}

				{isLoading && !hasLoadedOnce ? (
					<div className="rounded-lg border bg-white px-4 py-10 text-center text-gray-600">
						Memuat data...
					</div>
				) : (
					<div className={isLoading ? 'pointer-events-none opacity-60 transition-opacity' : 'transition-opacity'}>
						<TableContent
							data={rows}
							columns={[
								{ key: 'tanggal', label: 'Tanggal' },
								{ key: 'tgl_bayar', label: 'Tgl Bayar' },
								{ key: 'oleh', label: 'Oleh' },
								{ key: 'jenis', label: 'Jenis' },
								{ key: 'nominal', label: 'Nominal' },
								{ key: 'fee', label: 'Fee' },
								{ key: 'alat_nama', label: 'Alat' },
								{ key: 'bonus', label: 'Bonus Alat' },
								{ key: 'biaya_admin', label: 'Adm Bank' },
								{ key: 'sumber_dana', label: 'Sumber Dana' },
								{ key: 'tujuan_dana', label: 'Terima Dana' },
								{ key: 'metode_pembayaran_nama', label: 'Pembayaran Fee' }
							].filter((col) => isColumnVisible(col.key))}

							info={`Total data: ${totalRows}`}
							btnSize="xs"
							searchValue={searchValue}
							onSearchChange={setSearchValue}
							editDelete={false}
							showDateFilter
							onDateChange={makeSubFilterHandler('date')}
							showSumberDanaFilter
							onSumberDanaChange={makeSubFilterHandler('sumberDana')}
							sumberDanaOptions={saldoOptions}
							showJenisTransaksiFilter
							onJenisTransaksiChange={makeSubFilterHandler('jenisTransaksi')}
							jenisTransaksiOptions={JENIS_TRANSAKSI_OPTIONS}
							showTerimaDanaFilter
							onTerimaDanaChange={makeSubFilterHandler('terimaDana')}
							terimaDanaOptions={saldoOptions}
							showPembayarFeeFilter
							onPembayarFeeChange={makeSubFilterHandler('pembayarFee')}
							pembayarFeeOptions={saldoOptions}
							showEditedFilter
							onEditedFilterChange={makeSubFilterHandler('edited')}
							showKoreksiFilter
							onKoreksiFilterChange={makeSubFilterHandler('koreksi')}
							showManualOverrideFilter
							onManualOverrideFilterChange={makeSubFilterHandler('manualOverride')}
						/>
					</div>
				)}
			</div>
		</PageContainer>
	)
}

export default SemuaTransaksi