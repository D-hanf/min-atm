import { HiArrowRight, HiCalendar, HiChevronLeft, HiChevronRight, HiPlus, HiSwitchHorizontal, HiTrash } from 'react-icons/hi'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import ConfirmDialog from '../../../../components/ConfirmDialog'
import { CumulativeAssetCard } from '../../../../components'
import PageContainer from '../../../../components/PageContainer'
import TableContent from '../../../../components/TableContent'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import { useAuth } from '../../../../context/AuthContext'
import { useTheme } from '../../../../context/ThemeContext'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

const LaporanAset = () => {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const [assetSnapshots, setAssetSnapshots] = useState([])
  const [filterText, setFilterText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentTotalAsset, setCurrentTotalAsset] = useState(0)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedSnapshot, setSelectedSnapshot] = useState(null)
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false)
  const [cardRefreshTrigger, setCardRefreshTrigger] = useState(0)
  const [isFeatureEnabled, setIsFeatureEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('laporanAset_featureEnabled')
      return saved === null ? true : saved === 'true'
    } catch (error) {
      return true
    }
  })
  const userRole = user?.role?.toLowerCase() || 'kasir'

  const toggleFeature = () => {
    setIsFeatureEnabled(prev => {
      const next = !prev
      try {
        localStorage.setItem('laporanAset_featureEnabled', String(next))
      } catch (error) {
        console.error('❌ Gagal menyimpan status fitur:', error)
      }
      return next
    })
  }

  const getTodayWIB = () => dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD')
  const toDisplayDateTime = (val) => (dayjs(val).isValid() ? dayjs(val).tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm') : val || '')

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  const fetchAssetSnapshots = async () => {
    if (!isFeatureEnabled) return
    try {
      setIsLoading(true)
      const snapshots = await window.api.getAssetSnapshots()
      
      if (snapshots && snapshots.length > 0) {
        // Urutkan berdasarkan waktu terbaru
        const sortedSnapshots = snapshots.sort((a, b) => 
          new Date(b.waktu_transaksi || b.tanggal) - new Date(a.waktu_transaksi || a.tanggal)
        )
        setAssetSnapshots(sortedSnapshots)
      } else {
        setAssetSnapshots([])
      }
    } catch (error) {
      console.error('❌ Gagal mengambil snapshot aset:', error)
      setAssetSnapshots([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCurrentTotalAsset = async () => {
    if (!isFeatureEnabled) return
    try {
      const total = await window.api.calculateTotalAssets()
      setCurrentTotalAsset(total || 0)
    } catch (error) {
      console.error('❌ Gagal mengambil total aset:', error)
      setCurrentTotalAsset(0)
    }
  }


  
  const handleDeleteSnapshot = async (snapshotId) => {
    if (!isFeatureEnabled) return
    try {
      console.log('🔄 Menghapus snapshot dengan ID:', snapshotId)
      setIsLoading(true)
      
      const result = await window.api.deleteAssetSnapshot(snapshotId)
      console.log('✅ Result hapus snapshot:', result)
      
      // Refresh data setelah hapus
      console.log('🔄 Refresh data setelah hapus...')
      await fetchAssetSnapshots()
      
      // Trigger refresh cards
      setCardRefreshTrigger(prev => prev + 1)
      
      setShowDeleteDialog(false)
      setSelectedSnapshot(null)
    } catch (error) {
      console.error('❌ Gagal menghapus snapshot:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = (snapshotId) => {
    if (!isFeatureEnabled) return
    console.log('🔍 ID snapshot yang akan dihapus:', snapshotId)
    // Cari data snapshot berdasarkan ID
    const snapshot = assetSnapshots.find(s => s.id === snapshotId)
    console.log('🔍 Data snapshot ditemukan:', snapshot)
    setSelectedSnapshot(snapshot)
    setShowDeleteDialog(true)
  }
  
  const confirmDelete = (snapshot) => {
    if (!isFeatureEnabled) return
    setSelectedSnapshot(snapshot)
    setShowDeleteDialog(true)
  }

  const handleDeleteAll = async () => {
    if (!isFeatureEnabled) return
    try {
      console.log('🔄 Menghapus semua snapshot...')
      setIsLoading(true)
      
      const result = await window.api.deleteAllAssetSnapshots()
      console.log('✅ Result hapus semua snapshot:', result)
      
      // Refresh data setelah hapus
      console.log('🔄 Refresh data setelah hapus semua...')
      await fetchAssetSnapshots()
      
      // Trigger refresh cards
      setCardRefreshTrigger(prev => prev + 1)
      
      setShowDeleteAllDialog(false)
    } catch (error) {
      console.error('❌ Gagal menghapus semua snapshot:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isFeatureEnabled) {
      // Fitur nonaktif: jangan lakukan apa-apa, hemat pemanggilan DB
      setAssetSnapshots([])
      setCurrentTotalAsset(0)
      setIsLoading(false)
      return
    }
    const loadData = async () => {
      await fetchCurrentTotalAsset()
      await fetchAssetSnapshots()
    }
    loadData()
  }, [isFeatureEnabled])
  // Format data untuk tampilan tabel
  const formattedSnapshots = assetSnapshots.map(snapshot => ({
    ...snapshot,
    tanggalFormatted: toDisplayDateTime(snapshot.waktu_transaksi || snapshot.tanggal),
    totalAsetFormatted: formatRupiah(snapshot.total_aset || snapshot.totalAset || 0),
    transaksiInfo: snapshot.no_transaksi || 'Manual',
    keteranganInfo: snapshot.keterangan || '-',
    userInfo: `${snapshot.user_name || 'System'} (${snapshot.user_role || 'kasir'})`,
    roleOnly: snapshot.user_role || 'kasir',
    actions: (
      <div className="flex justify-center">
        <button
          onClick={() => confirmDelete(snapshot)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
            isDark 
              ? 'bg-red-600 hover:bg-red-700 text-white border border-red-500 hover:border-red-600' 
              : 'bg-red-500 hover:bg-red-600 text-white border border-red-400 hover:border-red-500'
          } hover:scale-105 active:scale-95 shadow-sm hover:shadow-md`}
          disabled={isLoading}
          title="Hapus snapshot ini"
        >
          <HiTrash className="w-4 h-4" />
          <span>Hapus</span>
        </button>
      </div>
    )
  }))

  const columns = [
    { key: 'tanggalFormatted', label: 'Tanggal & Waktu' },
    { key: 'totalAsetFormatted', label: 'Total Aset Keseluruhan' },
    { key: 'transaksiInfo', label: 'Sumber Transaksi' },
    { key: 'keteranganInfo', label: 'Keterangan' }, 
    { key: 'userInfo', label: 'Pengguna' },
    { key: 'actions', label: 'Aksi' }
  ]
  return (
    <PageContainer title="Laporan Aset" subtitle="Daftar snapshot total aset">

      {/* Tombol Aktif/Nonaktif Fitur */}
      <div className="flex items-center justify-between mb-4 px-4">
        <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          <HiSwitchHorizontal className="w-4 h-4" />
          <span>
            Status Fitur: {isFeatureEnabled ? (
              <span className="font-semibold text-green-500">Aktif</span>
            ) : (
              <span className="font-semibold text-red-500">Nonaktif</span>
            )}
          </span>
        </div>
        <button
          onClick={toggleFeature}
          className={`relative inline-flex items-center h-7 w-14 rounded-full transition-colors duration-200 ${
            isFeatureEnabled ? 'bg-green-500' : (isDark ? 'bg-gray-600' : 'bg-gray-300')
          }`}
          title={isFeatureEnabled ? 'Klik untuk menonaktifkan fitur' : 'Klik untuk mengaktifkan fitur'}
        >
          <span
            className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ${
              isFeatureEnabled ? 'translate-x-8' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {!isFeatureEnabled ? (
        <div className={`text-center py-16 px-4 rounded-lg mx-4 border-2 border-dashed ${
          isDark ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'
        }`}>
          <HiSwitchHorizontal className="w-10 h-10 mx-auto mb-3 opacity-60" />
          <p className="font-medium mb-1">Fitur Laporan Aset sedang nonaktif</p>
          <p className="text-sm">Tidak ada data yang dimuat dari database. Aktifkan tombol di atas untuk menggunakan fitur ini kembali.</p>
        </div>
      ) : (
      <>
      {/* Card Total Aset Laporan */}
      <CumulativeAssetCard refreshTrigger={cardRefreshTrigger} />
      
      {/* Tombol Delete All */}
      {assetSnapshots.length > 0 && (
        <div className="flex justify-end mb-4 px-4">
          <button
            onClick={() => setShowDeleteAllDialog(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isDark 
                ? 'bg-red-600 hover:bg-red-700 text-white border border-red-500 hover:border-red-600' 
                : 'bg-red-500 hover:bg-red-600 text-white border border-red-400 hover:border-red-500'
            } hover:scale-105 active:scale-95 shadow-sm hover:shadow-md`}
            disabled={isLoading}
            title="Hapus semua data laporan aset"
          >
            <HiTrash className="w-4 h-4" />
            <span>Delete All ({assetSnapshots.length})</span>
          </button>
        </div>
      )}

      {isLoading ? (
        <div className={`text-center py-8 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          <p>Memuat data snapshot aset...</p>
        </div>
      ) : (
        <TableContent 
          data={formattedSnapshots}
          columns={columns}
          title={'Riwayat Snapshot Total Aset'}
          info={`Total Snapshot: ${assetSnapshots.length} records`}
          btnSize={'xs'}
          userRole={userRole}
          showDateFilter={true}
          searchValue={filterText}
          onSearchChange={setFilterText}
          onDelete={handleDelete}
          hidden={false}
        />
      )}
      </>
      )}

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setSelectedSnapshot(null)
        }}
        onConfirm={() => handleDeleteSnapshot(selectedSnapshot?.id)}
        title="Hapus Snapshot Aset"
        message={`Apakah Anda yakin ingin menghapus snapshot tanggal ${selectedSnapshot?.tanggalFormatted || selectedSnapshot?.tanggal || ''} dengan total aset ${selectedSnapshot ? formatRupiah(selectedSnapshot.total_aset || selectedSnapshot.totalAset || 0) : ''}?`}
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
      />

      {/* Dialog Konfirmasi Delete All */}
      <ConfirmDialog
        isOpen={showDeleteAllDialog}
        onClose={() => setShowDeleteAllDialog(false)}
        onConfirm={handleDeleteAll}
        title="Hapus Semua Data Laporan Aset"
        message={`Apakah Anda yakin ingin menghapus SEMUA data laporan aset? Total ${assetSnapshots.length} snapshot akan dihapus secara permanen dan tidak dapat dikembalikan.`}
        confirmText="Hapus Semua"
        cancelText="Batal"
        type="danger"
      />
    </PageContainer>
  )
}
export default LaporanAset