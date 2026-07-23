import React, { useEffect, useState } from 'react'

import { useAuth } from '../../../context/AuthContext'

const LaporanKeuntungan = () => {
  const [laporan, setLaporan] = useState([])
  const [filteredKeuntungan, setFilteredKeuntungan] = useState([])
  const [tanggalDari, setTanggalDari] = useState('')
  const [tanggalSampai, setTanggalSampai] = useState('')
  const [totalKeuntungan, setTotalKeuntungan] = useState(0)
  const { user } = useAuth()
  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value || 0)
  }

  // Ambil semua data keuntungan
  const fetchLaporanKeuangan = async () => {
    try {
      const role = user?.role?.toLowerCase() || 'kasir'
      const data = await window.api.getLaporanKeuangan(role)
      setLaporan(data)
    } catch (err) {
      console.error('Gagal ambil laporan:', err)
    }
  }

  useEffect(() => {
  if (user) {
    fetchLaporanKeuangan()
  }
}, [user])

  // Filter saat tanggal berubah
  useEffect(() => {
    if (!tanggalDari || !tanggalSampai) {
      setFilteredKeuntungan([])
      setTotalKeuntungan(0)
      return
    }

    const hasil = laporan.filter((item) => {
      if (!item.tanggal) return false
      return item.tanggal >= tanggalDari && item.tanggal <= tanggalSampai
    })

    const total = hasil.reduce((sum, item) => sum + Number(item.keuntungan || 0), 0)

    setFilteredKeuntungan(hasil)
    setTotalKeuntungan(total)
  }, [tanggalDari, tanggalSampai, laporan])

  return (
    <div className="w-full min-h-screen bg-gray-50 p-0 m-0">
      <div className="w-full px-0 py-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 px-6">Laporan Keuntungan</h2>

        <div className="flex gap-4 mb-4 flex-wrap px-6 w-full">
          <div>
            <label className="font-medium mr-2">Dari:</label>
            <input
              type="date"
              value={tanggalDari}
              onChange={(e) => setTanggalDari(e.target.value)}
              className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 w-full min-w-[160px]"
            />
          </div>
          <div>
            <label className="font-medium mr-2">Sampai:</label>
            <input
              type="date"
              value={tanggalSampai}
              onChange={(e) => setTanggalSampai(e.target.value)}
              className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 w-full min-w-[160px]"
            />
          </div>
        </div>

        <div className="mb-6 px-6">
          <div className="w-full bg-green-100 rounded-lg text-green-800 font-bold text-lg py-4 px-6 flex items-center justify-between">
            <span>Total Keuntungan:</span>
            <span>{formatRupiah(totalKeuntungan)}</span>
          </div>
        </div>

        <div className="overflow-x-auto w-full px-0">
          <table className="w-full bg-white rounded-2xl shadow-lg border border-gray-100">
            <thead className="bg-gradient-to-r from-green-50 to-white sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide rounded-tl-2xl">Tanggal</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide">Keuntungan</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wide rounded-tr-2xl">Catatan / Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {filteredKeuntungan.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-10 text-gray-400 text-base rounded-b-2xl">
                    Tidak ada data keuntungan dalam periode ini.
                  </td>
                </tr>
              ) : (
                filteredKeuntungan.map((item, idx) => (
                  <tr
                    key={idx}
                    className="transition-all duration-200 ease-in-out hover:bg-green-100/60 group"
                    style={{ boxShadow: '0 1px 0 #e5e7eb' }}
                  >
                    <td className="px-6 py-4 text-gray-700 whitespace-nowrap group-hover:text-green-700 rounded-l-xl">{item.tanggal}</td>
                    <td className="px-6 py-4 text-green-700 font-semibold whitespace-nowrap group-hover:bg-green-50">{formatRupiah(item.keuntungan)}</td>
                    <td className="px-6 py-4 text-gray-600 rounded-r-xl">{item.keterangan || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default LaporanKeuntungan
