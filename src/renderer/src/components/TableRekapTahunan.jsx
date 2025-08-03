import React from 'react'

const bulanIndo = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

function TableRekapTahunan({ data }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden w-full mb-4">
      {/* Header */}
      <div className="p-4 border-b flex flex-wrap items-center justify-between gap-4 border-gray-200 bg-gray-50">
        <div className="flex flex-col w-full sm:w-auto">
          <h2 className="text-lg font-medium text-gray-700">Rekap Laporan Tahunan</h2>
          <p className="text-sm text-gray-500">Total Data: {data.length}</p>
        </div>
      </div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bulan</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Nominal Keluar</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Nominal Masuk</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Selisih Masuk/Keluar</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-500">Tidak ada data rekap tahunan.</td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={row.bulan} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{bulanIndo[row.bulan - 1]}</td>
                  <td className="px-6 py-4 text-right text-sm font-semibold text-black">{row.nominal_keluar}</td>
                  <td className="px-6 py-4 text-right text-sm font-semibold text-black">{row.nominal_masuk}</td>
                  <td className="px-6 py-4 text-right text-sm font-semibold text-black">{row.keuntungan}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TableRekapTahunan
