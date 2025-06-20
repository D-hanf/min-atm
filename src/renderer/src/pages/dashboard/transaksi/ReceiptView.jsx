import React, { useEffect, useState } from 'react'

const ReceiptView = ({ financialSummary, fundSources, formatRupiah }) => {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const dayName = days[currentTime.getDay()]
  const date = currentTime.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  const time = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  return (
    <div className="print-only p-6">
      <div className="mb-4 text-sm text-gray-700 italic">
        Dicetak pada: <strong>{dayName}, {date}</strong> pukul <strong>{time}</strong>
      </div>

      <h2 className="text-xl font-bold mb-4">Ringkasan Keuangan</h2>

      <div className="mb-4">
        <h3 className="font-semibold mb-2">Transaksi</h3>
        <ul className="space-y-1">
          <li>Tarik Tunai: {formatRupiah(financialSummary.cashWithdrawal)}</li>
          <li>Transfer: {formatRupiah(financialSummary.transfer)}</li>
          <li>Mode Pulsa: {formatRupiah(financialSummary.modePulsa)}</li>
          <li>Admin Bank: {formatRupiah(financialSummary.bankAdmin)}</li>
          <li>Keuntungan (Profit): {formatRupiah(financialSummary.profit)}</li>
        </ul>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold mb-2">Sumber Dana</h3>
        <ul className="space-y-1">
          {fundSources.map((source, index) => (
            <li key={index}>
              {source.nama_sumber_dana}: {formatRupiah(source.saldo)}
            </li>
          ))}
        </ul>
      </div>

      <div className="font-bold mt-4">
        Total Aset: {formatRupiah(financialSummary.totalAssets)}
      </div>
    </div>
  )
}

export default ReceiptView
