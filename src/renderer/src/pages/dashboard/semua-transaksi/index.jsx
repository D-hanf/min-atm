import React, { useEffect, useMemo, useState } from 'react'

import PageContainer from '../../../components/PageContainer'
import TableContent from '../../../components/TableContent'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
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

const SemuaTransaksi = () => {
	const [userRole] = useState(() => {
		const storedUser = JSON.parse(localStorage.getItem('user'))
		return storedUser?.role ? storedUser.role.toLowerCase() : 'kasir'
	})
	const [isLoading, setIsLoading] = useState(true)
	const [loadError, setLoadError] = useState('')
	const [searchValue, setSearchValue] = useState('')
	const [rows, setRows] = useState([])

	useEffect(() => {
		const fetchAll = async () => {
			try {
				setIsLoading(true)
				setLoadError('')

				const [transaksiRes, hutangRes, pindahRes, ambilRes, saldoRes, usersRes] = await Promise.allSettled([
					window.api?.getTransaksi?.(userRole),
					window.api?.getHutang?.(userRole),
					window.api?.getPindahSaldo?.(userRole),
					window.api?.getAmbilSaldo?.(userRole),
					window.api?.getSaldoAwal?.(),
					window.api?.getUsers?.()
				])

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
						sumber_dana: item.sumber_dana || '-',
						tujuan_dana: item.terima_dana_nama || '-',
						deskripsi: item.keterangan || '-'
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
						sumber_dana: item.platform_name || item.platform || '-',
						tujuan_dana: '-',
						deskripsi: item.keterangan || '-'
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
						sumber_dana: saldoById.get(Number(item.sumber_dana_id)) || item.sumber_dana || '-',
						tujuan_dana: saldoById.get(Number(item.tujuan_dana_id)) || item.tujuan_dana || '-',
						deskripsi: item.keterangan || '-'
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
						sumber_dana: item.platform || item.platform_name || '-',
						tujuan_dana: '-',
						deskripsi: item.keterangan || '-'
					}))
				].sort((a, b) => dayjs(b.sortDate).valueOf() - dayjs(a.sortDate).valueOf())

				setRows(mergedRows)
			} catch (error) {
				console.error('❌ Gagal memuat data:', error)
				setLoadError('Gagal memuat data.')
			} finally {
				setIsLoading(false)
			}
		}

		fetchAll()
	}, [userRole])

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

				{loadError && (
					<div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
						{loadError}
					</div>
				)}

				{isLoading ? (
					<div className="rounded-lg border bg-white px-4 py-10 text-center text-gray-600">
						Memuat data...
					</div>
				) : (
					<TableContent
						data={rows}
						columns={[
							{ key: 'tanggal', label: 'Tanggal' },
							{ key: 'tgl_bayar', label: 'Tgl Bayar' },
							{ key: 'oleh', label: 'Oleh' },
							{ key: 'jenis', label: 'Jenis' },
							{ key: 'nominal', label: 'Nominal' },
							{ key: 'sumber_dana', label: 'Sumber Dana' },
							{ key: 'tujuan_dana', label: 'Tujuan Dana' }
						]}
						
						info={`Total data: ${totalRows}`}
						btnSize="xs"
						userRole={userRole}
						searchValue={searchValue}
						onSearchChange={setSearchValue}
						editDelete={false}
						showDateFilter
						showSumberDanaFilter
						showJenisTransaksiFilter
					/>
				)}
			</div>
		</PageContainer>
	)
}

export default SemuaTransaksi