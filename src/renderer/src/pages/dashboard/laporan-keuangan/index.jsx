import React, { useEffect, useState } from 'react'

import TableContent from '../../../components/TableContent'

const LaporanKeuangan = () => {
  const [transactions, setTransactions] = useState([])
  const [filterText, setFilterText] = useState('')
  const [userRole, setUserRole] = useState(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'))
    return storedUser?.role ? storedUser.role.toLowerCase() : 'kasir'
  })
  const [fundSources, setFundSources] = useState([])

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value || 0)
  }
  const getNamaSumberDanaById = (id) => {
    const numericId = Number(id)
    const found = fundSources.find((item) => item.id === numericId)
    // console.log('🔍 Mencari sumber dana:', id, '→ Casted:', numericId, '→ Ditemukan:', found)
    return found ? found.nama_sumber_dana : '-'
  }
  const fetchTransaksi = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'))
      const data = await window.api.getTransaksi(user.role) // ⬅️ kirim role ke IPC

      const formatted = data.map((item) => {
        const nominal = Number(item.nominal_transaksi || 0)
        const fee = Number(item.fee || 0)
        const adminBank = Number(item.biaya_admin_bank || 0)
        const saldoAwal = Number(item.saldo_awal || 0)
        const jenis = item.jenis_transaksi?.toLowerCase() || ''
        const metode = item.tipe_transaksi?.toLowerCase() || ''

        let final = saldoAwal
        const sumberSamaDenganTerima = Number(item.sumber_dana_id) === Number(item.terima_dana_id)

        switch (jenis) {
          case 'tarik tunai':
            final -= nominal
            break
          case 'transfer':
          case 'mode pulsa':
            final -= nominal + adminBank
            if (sumberSamaDenganTerima) {
              final += nominal
            }
            break
          case 'jasa transfer':
            break
        }

        if (Number(item.sumber_dana_id) === Number(item.metode_pembayaran)) {
          final += fee
        }

        return {
          id: item.id,
          tanggal: item.tanggal,
          no_transaksi: item.no_transaksi,
          sumber_dana: item.sumber_dana,
          terima_dana_nama: item.terima_dana_nama || '-',
          jenis_transaksi: item.jenis_transaksi || '-',
          tipe_transaksi: item.tipe_transaksi || '-',
          saldo_awal: formatRupiah(saldoAwal),
          terima_dana_id: item.terima_dana_id || '-',
          nama_pelanggan: item.nama_pelanggan || '-',
          nomor_tujuan: item.nomor_tujuan || '-',
          nominal_transaksi: formatRupiah(nominal),
          fee: formatRupiah(fee),
          metode_pembayaran: Number(item.metode_pembayaran) || null,
          metode_pembayaran_nama: getNamaSumberDanaById(item.metode_pembayaran) || '-',
          biaya_admin_bank: formatRupiah(adminBank),
          saldo_akhir: formatRupiah(final),
          keterangan: item.keterangan || '-'
        }
      })

      setTransactions(formatted)
    } catch (error) {
      console.error('❌ Gagal ambil data transaksi:', error)
    }
  }

  useEffect(() => {
    fetchTransaksi()
  }, [userRole])

  const transactionColumns = [
    { key: 'tanggal', label: 'Tanggal' },
    { key: 'sumber_dana', label: 'Sumber Dana' },
    { key: 'terima_dana_nama', label: 'Terima Dana' },
    { key: 'jenis_transaksi', label: 'Jenis' },
    { key: 'saldo_awal', label: 'Saldo Awal' },
    { key: 'nominal_transaksi', label: 'Nominal keluar' },
    { key: 'nominal_masuk', label: 'Nominal masuk' }
  ]

  const filteredData = transactions.filter((item) =>
    Object.values(item).some((val) => String(val).toLowerCase().includes(filterText.toLowerCase()))
  )

  return (
    <div>
      <TableContent
        data={filteredData}
        columns={transactionColumns}
        title="Laporan Keuangan"
        info={`Total Transaksi: ${transactions.length}`}
        btnSize="xs"
        userRole={userRole}
        editDelete={false}
        showDateFilter={true}
        onFilterChange={(text) => setFilterText(text)}
      />
    </div>
  )
}

export default LaporanKeuangan
