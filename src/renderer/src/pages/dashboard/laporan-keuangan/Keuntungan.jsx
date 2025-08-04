import React, { useEffect, useState } from 'react'

const LaporanKeuntungan = () => {
  const [laporan, setLaporan] = useState([])
  const [filteredKeuntungan, setFilteredKeuntungan] = useState([])
  const [tanggalDari, setTanggalDari] = useState('')
  const [tanggalSampai, setTanggalSampai] = useState('')
  const [totalKeuntungan, setTotalKeuntungan] = useState(0)

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
      const user = JSON.parse(localStorage.getItem('user'))
      const role = user?.role?.toLowerCase() || 'kasir'
      const data = await window.api.getLaporanKeuangan(role)
      setLaporan(data)
    } catch (err) {
      console.error('Gagal ambil laporan:', err)
    }
  }

  useEffect(() => {
    fetchLaporanKeuangan()
  }, [])

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
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Laporan Keuntungan</h2>

      <div className="flex gap-4 mb-4 flex-wrap">
        <div>
          <label className="font-medium mr-2">Dari:</label>
          <input
            type="date"
            value={tanggalDari}
            onChange={(e) => setTanggalDari(e.target.value)}
            className="border px-2 py-1 rounded"
          />
        </div>
        <div>
          <label className="font-medium mr-2">Sampai:</label>
          <input
            type="date"
            value={tanggalSampai}
            onChange={(e) => setTanggalSampai(e.target.value)}
            className="border px-2 py-1 rounded"
          />
        </div>
      </div>

      <div className="mb-6 p-4 bg-green-100 rounded text-green-800 font-bold text-lg">
        Total Keuntungan: {formatRupiah(totalKeuntungan)}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border divide-y divide-gray-200 bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Tanggal</th>
              <th className="px-4 py-2 text-left">Keuntungan</th>
              <th className="px-4 py-2 text-left">Catatan / Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {filteredKeuntungan.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center py-4 text-gray-500">
                  Tidak ada data keuntungan dalam periode ini.
                </td>
              </tr>
            ) : (
              filteredKeuntungan.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{item.tanggal}</td>
                  <td className="px-4 py-2">{formatRupiah(item.keuntungan)}</td>
                  <td className="px-4 py-2">{item.keterangan || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default LaporanKeuntungan
