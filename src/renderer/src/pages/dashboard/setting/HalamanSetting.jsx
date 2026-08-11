import { HiCog, HiEye, HiEyeOff, HiLockClosed, HiLockOpen } from 'react-icons/hi'
import React, { useEffect, useState } from 'react'

import AlertDialog from '../../../components/AlertDialog'
import ButtonInput from '../../../components/ButtonInput'
import PageContainer from '../../../components/PageContainer'
import { useAuth } from '../../../context/AuthContext'
import { useTheme } from '../../../context/ThemeContext'

const HalamanSetting = () => {
  const { isDark } = useTheme()

  // Cek role user
  const { user } = useAuth()
  const isAdmin = user?.role?.toLowerCase() === 'admin'

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
    },
    semuaTransaksi: {
      tanggal: { label: 'Tanggal', visible: true },
      tgl_bayar: { label: 'Tgl Bayar', visible: true },
      oleh: { label: 'Oleh', visible: true },
      jenis: { label: 'Jenis', visible: true },
      nominal: { label: 'Nominal', visible: true },
      fee: { label: 'Fee', visible: true },
      alat_nama: { label: 'Alat', visible: true },
      bonus: { label: 'Bonus Alat', visible: true },
      biaya_admin: { label: 'Adm Bank', visible: true },
      sumber_dana: { label: 'Sumber Dana', visible: true },
      tujuan_dana: { label: 'Terima Dana', visible: true },
      metode_pembayaran_nama: { label: 'Pembayaran Fee', visible: true }
    },
    koreksiTransaksi: {
      tanggal: { label: 'Tanggal', visible: true },
      tgl_bayar: { label: 'Tgl Bayar', visible: true },
      oleh: { label: 'Oleh', visible: true },
      jenis: { label: 'Jenis', visible: true },
      nominal: { label: 'Nominal', visible: true },
      fee: { label: 'Fee', visible: true },
      alat_nama: { label: 'Alat', visible: true },
      bonus: { label: 'Bonus Alat', visible: true },
      biaya_admin: { label: 'Adm Bank', visible: true },
      sumber_dana: { label: 'Sumber Dana', visible: true },
      tujuan_dana: { label: 'Terima Dana', visible: true },
      metode_pembayaran_nama: { label: 'Pembayaran Fee', visible: true }
    }
  }

  const [columnSettings, setColumnSettings] = useState(defaultColumns)
  const [activeTab, setActiveTab] = useState('columns')
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('tableColumnSettings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        // Merge per-halaman: kalau ada halaman/kolom baru (mis. baru ditambahkan di update ini)
        // yang belum ada di localStorage lama, tetap dapat default 'visible: true' alih-alih
        // hilang begitu saja karena localStorage user belum punya entry untuk itu.
        const merged = { ...defaultColumns }
        Object.keys(defaultColumns).forEach((pageKey) => {
          merged[pageKey] = { ...defaultColumns[pageKey], ...(parsed[pageKey] || {}) }
        })
        setColumnSettings(merged)
      } catch (error) {
        console.error('Error parsing column settings:', error)
      }
    }
  }, [])

  // Save settings to localStorage
  const saveSettings = () => {
    console.log('💾 Saving column settings:', columnSettings)

    localStorage.setItem('tableColumnSettings', JSON.stringify(columnSettings))

    // Dispatch custom event to notify other components
    window.dispatchEvent(
      new CustomEvent('columnSettingsChanged', {
        detail: columnSettings
      })
    )

    console.log('✅ Column settings saved and event dispatched')
    setSuccessMessage('Pengaturan kolom berhasil disimpan! Perubahan akan langsung diterapkan.')
    setShowSuccessDialog(true)
  }

  // Toggle column visibility
  const toggleColumn = (page, columnKey) => {
    setColumnSettings((prev) => ({
      ...prev,
      [page]: {
        ...prev[page],
        [columnKey]: {
          ...prev[page][columnKey],
          visible: !prev[page][columnKey].visible
        }
      }
    }))
  }

  // Reset column settings to default
  const resetColumnsToDefault = () => {
    setColumnSettings(defaultColumns)
    localStorage.removeItem('tableColumnSettings')
    window.dispatchEvent(
      new CustomEvent('columnSettingsChanged', {
        detail: defaultColumns
      })
    )
    setSuccessMessage(
      'Pengaturan kolom berhasil direset ke default! Semua kolom sekarang ditampilkan.'
    )
    setShowSuccessDialog(true)
  }

  const tabs = [{ key: 'columns', label: 'Kolom Tabel' }]

  const pageOptions = [
    { key: 'transaksi', label: 'Transaksi' },
    { key: 'semuaTransaksi', label: 'Semua Transaksi' },
    { key: 'koreksiTransaksi', label: 'Koreksi Transaksi' },
    { key: 'pindahSaldo', label: 'Pindah Saldo' },
    { key: 'hutang', label: 'Hutang' },
    { key: 'ambilSaldo', label: 'Ambil Saldo' }
  ]

  const [selectedPage, setSelectedPage] = useState('transaksi')

  return (
    <PageContainer>
      <div
        className={`p-6 ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-lg shadow-md`}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <HiCog className="text-2xl text-blue-500" />
          <h1 className="text-2xl font-bold">Pengaturan Kolom Tabel</h1>
        </div>

        <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Atur kolom mana saja yang ingin ditampilkan di setiap halaman tabel
        </p>

        {/* Tabs */}
        <div className="flex border-b border-gray-300 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab.key
                  ? `border-b-2 border-blue-500 ${isDark ? 'text-blue-400' : 'text-blue-600'}`
                  : `${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'}`
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'columns' && (
          <div className="space-y-4 mb-8">
            {/* Page Selector for Columns */}
            <div className="flex gap-2 mb-4">
              {pageOptions.map((page) => (
                <button
                  key={page.key}
                  onClick={() => setSelectedPage(page.key)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    selectedPage === page.key
                      ? `${isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`
                      : `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                  }`}
                >
                  {page.label}
                </button>
              ))}
            </div>

            <h3 className="text-lg font-semibold mb-4">
              Kolom untuk Halaman {pageOptions.find((p) => p.key === selectedPage)?.label}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(columnSettings[selectedPage] || {}).map(([columnKey, columnData]) => (
                <div
                  key={columnKey}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <span className="font-medium">{columnData.label}</span>
                  <button
                    onClick={() => toggleColumn(selectedPage, columnKey)}
                    className={`p-1 rounded transition-colors ${
                      columnData.visible
                        ? 'text-green-500 hover:text-green-600'
                        : 'text-red-500 hover:text-red-600'
                    }`}
                  >
                    {columnData.visible ? (
                      <HiEye className="text-xl" />
                    ) : (
                      <HiEyeOff className="text-xl" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <ButtonInput
            onClick={saveSettings}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2"
          >
            Simpan Pengaturan
          </ButtonInput>

          <ButtonInput
            onClick={resetColumnsToDefault}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2"
          >
            Reset Kolom ke Default
          </ButtonInput>
        </div>

        {/* Info */}
        <div
          className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-blue-900/20 border-blue-500/30' : 'bg-blue-50 border-blue-200'} border`}
        >
          <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
            💡 <strong>Tips:</strong>
            {activeTab === 'columns'
              ? 'Kolom yang disembunyikan tidak akan muncul di tabel, namun data tetap tersimpan.'
              : 'Pengaturan lock akan membatasi akses karyawan sesuai dengan aturan yang ditetapkan admin.'}
          </p>
        </div>
      </div>

      <AlertDialog
        isOpen={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        title="Berhasil!"
        message={successMessage}
        variant="success"
      />
    </PageContainer>
  )
}

export default HalamanSetting