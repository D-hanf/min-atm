import { useState, useEffect } from 'react'

// Default column configurations for each page
const defaultColumns = {
  transaksi: {
    tanggal: { label: 'Tanggal', visible: true },
    user_name: { label: 'Dibuat Oleh', visible: true },
    nama_pelanggan: { label: 'Nama Pelanggan', visible: true },
    nomor_tujuan: { label: 'Nomor Tujuan', visible: true },
    no_transaksi: { label: 'No Transaksi', visible: true },
    sumber_dana: { label: 'Sumber Dana', visible: true },
    jenis_transaksi: { label: 'Jenis', visible: true },
    tipe_transaksi: { label: 'Tipe Transaksi', visible: true },
    saldo_awal: { label: 'Saldo Awal', visible: true },
    nominal_transaksi: { label: 'Nominal', visible: true },
    fee: { label: 'Fee', visible: true },
    biaya_admin: { label: 'Adm Bank', visible: true },
    saldo_akhir: { label: 'Saldo Akhir', visible: true },
    terima_dana_nama: { label: 'Terima Dana', visible: true },
    metode_pembayaran_nama: { label: 'Pembayaran Fee', visible: true },
    keterangan: { label: 'Keterangan', visible: true }
  },
  pindahSaldo: {
    user: { label: 'User Pemindah', visible: true },
    date: { label: 'Tanggal', visible: true },
    senderBalanceName: { label: 'Sumber Dana', visible: true },
    receiverBalanceName: { label: 'Tujuan Dana', visible: true },
    formattedSenderBalance: { label: 'Saldo Pengirim', visible: true },
    formattedReceiverBalance: { label: 'Saldo Penerima', visible: true },
    formattedAmount: { label: 'Nominal', visible: true },
    formattedOperational: { label: 'Operasional', visible: true },
    description: { label: 'Keterangan', visible: true }
  },
  hutang: {
    tanggal: { label: 'Tanggal ambil hutang', visible: true },
    tanggal_bayar_hutang: { label: 'Tanggal Bayar', visible: true },
    petugas_id: { label: 'Petugas', visible: true },
    platform_name: { label: 'Platform', visible: true },
    saldo_platform: { label: 'Saldo Platform', visible: true },
    jenis_transaksi: { label: 'Transaksi', visible: true },
    nominal_transaksi: { label: 'Nominal Hutang', visible: true },
    biaya_admin: { label: 'Biaya Admin', visible: true },
    keterangan: { label: 'Keterangan', visible: true }
  },
  ambilSaldo: {
    petugas_pengambil_id: { label: 'Petugas Pengambil', visible: true },
    tanggal_pengambilan: { label: 'Tanggal Pengambilan', visible: true },
    platform: { label: 'Platform', visible: true },
    saldo_platform: { label: 'Saldo Platform', visible: true },
    nominal_pengambilan: { label: 'Nominal Pengambilan', visible: true },
    biaya_admin: { label: 'Biaya Admin', visible: true },
    metode_pengambilan: { label: 'Metode Pengambilan', visible: true },
    tujuan_pengambilan: { label: 'Tujuan Pengambilan', visible: true },
    keterangan: { label: 'Keterangan', visible: true }
  }
}

export const useColumnSettings = (pageName) => {
  const [columnSettings, setColumnSettings] = useState(defaultColumns[pageName] || {})

  // Load settings from localStorage
  useEffect(() => {
    const loadSettings = () => {
      const savedSettings = localStorage.getItem('tableColumnSettings')
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings)
          if (parsed[pageName]) {
            setColumnSettings(parsed[pageName])
          }
        } catch (error) {
          console.error('Error parsing column settings:', error)
        }
      }
    }

    loadSettings()

    // Listen for settings changes
    const handleSettingsChange = (event) => {
      if (event.detail[pageName]) {
        setColumnSettings(event.detail[pageName])
      }
    }

    window.addEventListener('columnSettingsChanged', handleSettingsChange)
    
    return () => {
      window.removeEventListener('columnSettingsChanged', handleSettingsChange)
    }
  }, [pageName])

  // Get visible columns
  const getVisibleColumns = () => {
    return Object.entries(columnSettings)
      .filter(([_, columnData]) => columnData.visible)
      .map(([columnKey, columnData]) => ({
        key: columnKey,
        label: columnData.label
      }))
  }

  // Check if a column is visible
  const isColumnVisible = (columnKey) => {
    return columnSettings[columnKey]?.visible ?? true
  }

  return {
    columnSettings,
    getVisibleColumns,
    isColumnVisible
  }
}