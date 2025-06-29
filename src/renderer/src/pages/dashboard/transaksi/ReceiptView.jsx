import React, { useEffect, useState } from 'react'

import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

const ReceiptView = ({ financialSummary, fundSources, formatRupiah }) => {
  const [currentTime, setCurrentTime] = useState(dayjs().tz('Asia/Jakarta'))

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs().tz('Asia/Jakarta'))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const dayName = currentTime.format('dddd') // Nama hari dalam bahasa Inggris
  const date = currentTime.format('D MMMM YYYY') // Contoh: 29 Juni 2025
  const time = currentTime.format('HH:mm:ss') // 24 jam

  const hariID = {
    Sunday: 'Minggu',
    Monday: 'Senin',
    Tuesday: 'Selasa',
    Wednesday: 'Rabu',
    Thursday: 'Kamis',
    Friday: 'Jumat',
    Saturday: 'Sabtu'
  }

  return (
    <div className="print-only p-6">
      <div className="mb-4 text-sm text-gray-700 italic">
        Dicetak pada: <strong>{hariID[dayName] || dayName}, {date}</strong> pukul <strong>{time}</strong>
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
