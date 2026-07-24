import 'dayjs/locale/id'

import {
  HiArrowTrendingUp,
  HiBanknotes,
  HiCalendarDays,
  HiCreditCard,
  HiListBullet,
  HiTrophy
} from 'react-icons/hi2'
import React, { useEffect, useMemo, useState } from 'react'

import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { useAuth } from '../../../context/AuthContext'
import { useTheme } from '../../../context/ThemeContext'

dayjs.extend(isoWeek)
dayjs.locale('id')

const LaporanKeuntungan = () => {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const [laporan, setLaporan] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [tanggalDari, setTanggalDari] = useState(dayjs().startOf('month').format('YYYY-MM-DD'))
  const [tanggalSampai, setTanggalSampai] = useState(dayjs().format('YYYY-MM-DD'))
  const [viewMode, setViewMode] = useState('harian') // harian | mingguan | bulanan | detail
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value || 0)
  }

  // Field admin bank dari backend bernama 'admin_bank' (lihat handler get-laporan-keuangan).
  // Fallback nama lain tetap dijaga untuk keamanan kalau backend berubah nanti.
  const getAdminBank = (item) =>
    Number(item.admin_bank ?? item.biaya_admin_bank ?? item.biaya_admin ?? item.adminBank ?? 0)

  // PENTING: kolom `tanggal` dari backend berupa DATETIME (bisa mengandung jam:menit:detik),
  // bukan cuma 'YYYY-MM-DD'. Kalau dibandingkan sebagai string mentah, transaksi hari ini
  // yang punya jam (mis. "2026-07-24 14:30:00") akan dianggap "lebih besar" dari batas
  // tanggalSampai ("2026-07-24") dan malah ke-filter keluar. Makanya selalu dinormalisasi dulu.
  const toDateOnly = (val) => (val ? dayjs(val).format('YYYY-MM-DD') : '')

  // Ambil semua data keuntungan
  const fetchLaporanKeuangan = async () => {
    try {
      setIsLoading(true)
      const role = user?.role?.toLowerCase() || 'kasir'
      const data = await window.api.getLaporanKeuangan(role)
      setLaporan(data || [])
    } catch (err) {
      console.error('Gagal ambil laporan:', err)
      setLaporan([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchLaporanKeuangan()
    }
  }, [user])

  // Reset ke halaman 1 setiap kali tab atau filter tanggal berubah
  useEffect(() => {
    setCurrentPage(1)
  }, [viewMode, tanggalDari, tanggalSampai])

  // Set rentang tanggal cepat
  const setQuickRange = (mode) => {
    const today = dayjs()
    if (mode === 'today') {
      setTanggalDari(today.format('YYYY-MM-DD'))
      setTanggalSampai(today.format('YYYY-MM-DD'))
    } else if (mode === 'week') {
      setTanggalDari(today.startOf('isoWeek').format('YYYY-MM-DD'))
      setTanggalSampai(today.endOf('isoWeek').format('YYYY-MM-DD'))
    } else if (mode === 'month') {
      setTanggalDari(today.startOf('month').format('YYYY-MM-DD'))
      setTanggalSampai(today.format('YYYY-MM-DD'))
    } else if (mode === 'all') {
      setTanggalDari('')
      setTanggalSampai('')
    }
  }

  // Data yang sudah difilter berdasarkan rentang tanggal
  const filteredKeuntungan = useMemo(() => {
    return laporan.filter((item) => {
      if (!item.tanggal) return false
      const tglItem = toDateOnly(item.tanggal)
      if (tanggalDari && tglItem < tanggalDari) return false
      if (tanggalSampai && tglItem > tanggalSampai) return false
      return true
    })
  }, [laporan, tanggalDari, tanggalSampai])

  // Ringkasan statistik
  const summary = useMemo(() => {
    const total = filteredKeuntungan.reduce((sum, item) => sum + Number(item.keuntungan || 0), 0)
    const totalAdminBank = filteredKeuntungan.reduce((sum, item) => sum + getAdminBank(item), 0)
    const perHari = {}
    filteredKeuntungan.forEach((item) => {
      const tglKey = toDateOnly(item.tanggal)
      perHari[tglKey] = (perHari[tglKey] || 0) + Number(item.keuntungan || 0)
    })
    const jumlahHari = Object.keys(perHari).length
    const rataRataHarian = jumlahHari > 0 ? total / jumlahHari : 0

    let hariTerbaikTanggal = null
    let hariTerbaikNilai = 0
    Object.entries(perHari).forEach(([tgl, nilai]) => {
      if (nilai > hariTerbaikNilai) {
        hariTerbaikNilai = nilai
        hariTerbaikTanggal = tgl
      }
    })

    return {
      total,
      totalAdminBank,
      jumlahHari,
      rataRataHarian,
      hariTerbaikTanggal,
      hariTerbaikNilai,
      jumlahTransaksi: filteredKeuntungan.length
    }
  }, [filteredKeuntungan])

  // Rekap harian
  const rekapHarian = useMemo(() => {
    const map = {}
    filteredKeuntungan.forEach((item) => {
      const key = toDateOnly(item.tanggal)
      if (!map[key]) {
        map[key] = {
          key,
          label: dayjs(item.tanggal).format('dddd, DD MMMM YYYY'),
          total: 0,
          totalAdminBank: 0,
          jumlahTransaksi: 0
        }
      }
      map[key].total += Number(item.keuntungan || 0)
      map[key].totalAdminBank += getAdminBank(item)
      map[key].jumlahTransaksi += 1
    })
    return Object.values(map).sort((a, b) => (a.key < b.key ? 1 : -1))
  }, [filteredKeuntungan])

  // Rekap mingguan (Senin - Minggu)
  const rekapMingguan = useMemo(() => {
    const map = {}
    filteredKeuntungan.forEach((item) => {
      const d = dayjs(item.tanggal)
      const startW = d.startOf('isoWeek')
      const endW = d.endOf('isoWeek')
      const key = startW.format('YYYY-MM-DD')
      if (!map[key]) {
        map[key] = {
          key,
          label: `${startW.format('DD MMM')} - ${endW.format('DD MMM YYYY')}`,
          total: 0,
          totalAdminBank: 0,
          jumlahTransaksi: 0,
          hariSet: new Set()
        }
      }
      map[key].total += Number(item.keuntungan || 0)
      map[key].totalAdminBank += getAdminBank(item)
      map[key].jumlahTransaksi += 1
      map[key].hariSet.add(toDateOnly(item.tanggal))
    })
    return Object.values(map)
      .map((w) => ({
        ...w,
        jumlahHari: w.hariSet.size,
        rataRata: w.total / (w.hariSet.size || 1)
      }))
      .sort((a, b) => (a.key < b.key ? 1 : -1))
  }, [filteredKeuntungan])

  // Rekap bulanan
  const rekapBulanan = useMemo(() => {
    const map = {}
    filteredKeuntungan.forEach((item) => {
      const d = dayjs(item.tanggal)
      const key = d.format('YYYY-MM')
      if (!map[key]) {
        map[key] = {
          key,
          label: d.format('MMMM YYYY'),
          total: 0,
          totalAdminBank: 0,
          jumlahTransaksi: 0,
          hariSet: new Set()
        }
      }
      map[key].total += Number(item.keuntungan || 0)
      map[key].totalAdminBank += getAdminBank(item)
      map[key].jumlahTransaksi += 1
      map[key].hariSet.add(toDateOnly(item.tanggal))
    })
    return Object.values(map)
      .map((m) => ({
        ...m,
        jumlahHari: m.hariSet.size,
        rataRata: m.total / (m.hariSet.size || 1)
      }))
      .sort((a, b) => (a.key < b.key ? 1 : -1))
  }, [filteredKeuntungan])

  const dataAktif =
    viewMode === 'harian'
      ? rekapHarian
      : viewMode === 'mingguan'
        ? rekapMingguan
        : viewMode === 'bulanan'
          ? rekapBulanan
          : null

  const detailSorted = useMemo(() => {
    return [...filteredKeuntungan].sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1))
  }, [filteredKeuntungan])

  // Sumber data yang sedang aktif untuk dipaginasi (tergantung tab)
  const sumberDataAktif = viewMode === 'detail' ? detailSorted : dataAktif || []
  const totalPages = Math.max(1, Math.ceil(sumberDataAktif.length / itemsPerPage))
  const safePage = Math.min(currentPage, totalPages)
  const indexOfLastItem = safePage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const dataHalamanIni = sumberDataAktif.slice(indexOfFirstItem, indexOfLastItem)

  const maxTotalAktif = useMemo(() => {
    if (!dataAktif || dataAktif.length === 0) return 1
    return Math.max(1, ...dataAktif.map((r) => r.total))
  }, [dataAktif])

  const tabs = [
    { key: 'harian', label: 'Harian' },
    { key: 'mingguan', label: 'Mingguan' },
    { key: 'bulanan', label: 'Bulanan' },
    { key: 'detail', label: 'Detail Transaksi' }
  ]

  const cardBase = `rounded-xl p-4 flex items-center gap-3 shadow-sm border ${
    isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
  }`
  const labelMuted = isDark ? 'text-gray-400' : 'text-gray-500'
  const textMain = isDark ? 'text-gray-100' : 'text-gray-800'

  return (
    <div className={`w-full min-h-screen p-0 m-0 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="w-full px-6 py-6">
        <h2 className={`text-2xl font-bold mb-1 ${textMain}`}>Laporan Keuntungan</h2>
        <p className={`text-sm mb-5 ${labelMuted}`}>
          Rekap keuntungan harian, mingguan, dan bulanan biar lebih mudah dipantau.
        </p>

        {/* Filter tanggal + quick range */}
        <div className="flex flex-wrap items-end gap-3 mb-5">
          <div>
            <label className={`block text-xs font-medium mb-1 ${labelMuted}`}>Dari</label>
            <input
              type="date"
              value={tanggalDari}
              onChange={(e) => setTanggalDari(e.target.value)}
              className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 ${
                isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${labelMuted}`}>Sampai</label>
            <input
              type="date"
              value={tanggalSampai}
              onChange={(e) => setTanggalSampai(e.target.value)}
              className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 ${
                isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'today', label: 'Hari Ini' },
              { key: 'week', label: 'Minggu Ini' },
              { key: 'month', label: 'Bulan Ini' },
              { key: 'all', label: 'Semua' }
            ].map((q) => (
              <button
                key={q.key}
                onClick={() => setQuickRange(q.key)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isDark
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Kartu Ringkasan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className={cardBase}>
            <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
              <HiBanknotes size={22} />
            </div>
            <div>
              <p className={`text-xs ${labelMuted}`}>Total Keuntungan</p>
              <p className={`text-lg font-bold ${textMain}`}>{formatRupiah(summary.total)}</p>
            </div>
          </div>

          <div className={cardBase}>
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <HiCreditCard size={22} />
            </div>
            <div>
              <p className={`text-xs ${labelMuted}`}>Total Admin Bank</p>
              <p className={`text-lg font-bold ${textMain}`}>
                {formatRupiah(summary.totalAdminBank)}
              </p>
            </div>
          </div>

          <div className={cardBase}>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <HiArrowTrendingUp size={22} />
            </div>
            <div>
              <p className={`text-xs ${labelMuted}`}>Rata-rata / Hari</p>
              <p className={`text-lg font-bold ${textMain}`}>
                {formatRupiah(summary.rataRataHarian)}
              </p>
            </div>
          </div>

          <div className={cardBase}>
            <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
              <HiTrophy size={22} />
            </div>
            <div>
              <p className={`text-xs ${labelMuted}`}>Hari Terbaik</p>
              <p className={`text-sm font-bold ${textMain}`}>
                {summary.hariTerbaikTanggal
                  ? dayjs(summary.hariTerbaikTanggal).format('DD MMM YYYY')
                  : '-'}
              </p>
              <p className="text-xs text-green-500 font-medium">
                {summary.hariTerbaikTanggal ? formatRupiah(summary.hariTerbaikNilai) : ''}
              </p>
            </div>
          </div>

          <div className={cardBase}>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <HiListBullet size={22} />
            </div>
            <div>
              <p className={`text-xs ${labelMuted}`}>Jumlah Transaksi</p>
              <p className={`text-lg font-bold ${textMain}`}>{summary.jumlahTransaksi}</p>
              <p className={`text-xs ${labelMuted}`}>{summary.jumlahHari} hari aktif</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex gap-1 mb-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setViewMode(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                viewMode === tab.key
                  ? 'border-green-500 text-green-500'
                  : `border-transparent ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`
              }`}
            >
              {tab.key !== 'detail' && <HiCalendarDays size={16} />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Konten */}
        <div
          className={`rounded-2xl shadow-lg border overflow-hidden ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
          }`}
        >
          {isLoading ? (
            <div className={`text-center py-14 ${labelMuted}`}>Memuat data laporan...</div>
          ) : viewMode === 'detail' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDark ? 'bg-gray-700' : 'bg-gradient-to-r from-green-50 to-white'}>
                  <tr>
                    <th className={`px-6 py-4 text-left text-sm font-bold uppercase tracking-wide ${textMain}`}>
                      Tanggal
                    </th>
                    <th className={`px-6 py-4 text-left text-sm font-bold uppercase tracking-wide ${textMain}`}>
                      Keuntungan
                    </th>
                    <th className={`px-6 py-4 text-left text-sm font-bold uppercase tracking-wide ${textMain}`}>
                      Admin Bank
                    </th>
                    <th className={`px-6 py-4 text-left text-sm font-bold uppercase tracking-wide ${textMain}`}>
                      Catatan / Keterangan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKeuntungan.length === 0 ? (
                    <tr>
                      <td colSpan="4" className={`text-center py-10 ${labelMuted}`}>
                        Tidak ada data keuntungan dalam periode ini.
                      </td>
                    </tr>
                  ) : (
                    dataHalamanIni.map((item, idx) => (
                      <tr
                        key={item.id ?? idx}
                        className={`border-t ${isDark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-100 hover:bg-green-50/60'}`}
                      >
                        <td className={`px-6 py-4 whitespace-nowrap ${textMain}`}>
                          {dayjs(item.tanggal).format('DD MMM YYYY')}
                        </td>
                        <td className="px-6 py-4 text-green-500 font-semibold whitespace-nowrap">
                          {formatRupiah(item.keuntungan)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap ${labelMuted}`}>
                          {formatRupiah(getAdminBank(item))}
                        </td>
                        <td className={`px-6 py-4 ${labelMuted}`}>{item.keterangan || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDark ? 'bg-gray-700' : 'bg-gradient-to-r from-green-50 to-white'}>
                  <tr>
                    <th className={`px-6 py-4 text-left text-sm font-bold uppercase tracking-wide ${textMain}`}>
                      {viewMode === 'harian' ? 'Tanggal' : viewMode === 'mingguan' ? 'Minggu' : 'Bulan'}
                    </th>
                    <th className={`px-6 py-4 text-left text-sm font-bold uppercase tracking-wide ${textMain}`}>
                      Transaksi
                    </th>
                    {viewMode !== 'harian' && (
                      <th className={`px-6 py-4 text-left text-sm font-bold uppercase tracking-wide ${textMain}`}>
                        Rata-rata / Hari
                      </th>
                    )}
                    <th className={`px-6 py-4 text-left text-sm font-bold uppercase tracking-wide ${textMain}`}>
                      Admin Bank
                    </th>
                    <th className={`px-6 py-4 text-left text-sm font-bold uppercase tracking-wide ${textMain} w-1/3`}>
                      Total Keuntungan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dataAktif.length === 0 ? (
                    <tr>
                      <td colSpan={viewMode === 'harian' ? 4 : 5} className={`text-center py-10 ${labelMuted}`}>
                        Tidak ada data pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    dataHalamanIni.map((row) => {
                      const barWidth = Math.max(4, (row.total / maxTotalAktif) * 100)
                      return (
                        <tr
                          key={row.key}
                          className={`border-t ${isDark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-100 hover:bg-green-50/60'}`}
                        >
                          <td className={`px-6 py-4 whitespace-nowrap font-medium ${textMain}`}>
                            {row.label}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap ${labelMuted}`}>
                            {row.jumlahTransaksi}
                          </td>
                          {viewMode !== 'harian' && (
                            <td className={`px-6 py-4 whitespace-nowrap ${labelMuted}`}>
                              {formatRupiah(row.rataRata)}
                            </td>
                          )}
                          <td className={`px-6 py-4 whitespace-nowrap ${labelMuted}`}>
                            {formatRupiah(row.totalAdminBank)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="text-green-500 font-bold whitespace-nowrap">
                                {formatRupiah(row.total)}
                              </span>
                              <div
                                className={`flex-1 h-2 rounded-full overflow-hidden ${
                                  isDark ? 'bg-gray-700' : 'bg-gray-100'
                                }`}
                              >
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-500"
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
                {dataAktif.length > 0 && (
                  <tfoot>
                    <tr className={`border-t-2 font-bold ${isDark ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
                      <td className={`px-6 py-3 ${textMain}`}>Total</td>
                      <td className={`px-6 py-3 ${textMain}`}>
                        {dataAktif.reduce((sum, r) => sum + r.jumlahTransaksi, 0)}
                      </td>
                      {viewMode !== 'harian' && <td />}
                      <td className={`px-6 py-3 ${textMain}`}>
                        {formatRupiah(dataAktif.reduce((sum, r) => sum + r.totalAdminBank, 0))}
                      </td>
                      <td className="px-6 py-3 text-green-500">
                        {formatRupiah(dataAktif.reduce((sum, r) => sum + r.total, 0))}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {sumberDataAktif.length > itemsPerPage && (
          <div
            className={`flex flex-wrap justify-between items-center gap-3 px-4 py-3 mt-3 rounded-xl border ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
            }`}
          >
            <p className={`text-sm ${labelMuted}`}>
              Halaman {safePage} dari {totalPages} &middot; {sumberDataAktif.length} baris
            </p>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={safePage === 1}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  isDark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
                }`}
              >
                Sebelumnya
              </button>
              {(() => {
                const maxVisible = 5
                let start = Math.max(1, safePage - Math.floor(maxVisible / 2))
                let end = Math.min(totalPages, start + maxVisible - 1)
                if (end - start + 1 < maxVisible) {
                  start = Math.max(1, end - maxVisible + 1)
                }
                const pages = []
                for (let p = start; p <= end; p++) pages.push(p)
                return pages.map((num) => (
                  <button
                    key={num}
                    onClick={() => setCurrentPage(num)}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      num === safePage
                        ? 'bg-green-500 text-white'
                        : isDark
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {num}
                  </button>
                ))
              })()}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={safePage === totalPages}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  isDark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
                }`}
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LaporanKeuntungan