import React, { useEffect, useState } from 'react'

import { useTheme } from '../context/ThemeContext'

const CumulativeAssetCard = ({ refreshTrigger }) => {
  const [snapshotAssetTotal, setSnapshotAssetTotal] = useState(0)
  const [totalAssetNoEdit, setTotalAssetNoEdit] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [lastSnapshotTime, setLastSnapshotTime] = useState('')
  const { isDark } = useTheme()

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const fetchLatestSnapshot = async () => {
    try {
      setIsLoading(true)
      
      // Ambil snapshot terbaru dari tabel asset_snapshots
      const snapshots = await window.api.getAssetSnapshots()
      
      if (snapshots && snapshots.length > 0) {
        // Urutkan berdasarkan waktu terbaru dan ambil yang pertama
        const sortedSnapshots = snapshots.sort((a, b) => 
          new Date(b.waktu_transaksi || b.created_at) - new Date(a.waktu_transaksi || a.created_at)
        )
        
        const latestSnapshot = sortedSnapshots[0]
        setSnapshotAssetTotal(latestSnapshot.total_aset || 0)
        setTotalAssetNoEdit(latestSnapshot.total_aset_no_edit || 0)
        setLastSnapshotTime(latestSnapshot.waktu_transaksi || latestSnapshot.created_at)
      } else {
        // Jika tidak ada snapshot, ambil dari total aset saat ini
        const currentTotal = await window.api.calculateTotalAssets()
        setSnapshotAssetTotal(currentTotal || 0)
        setTotalAssetNoEdit(0)
        setLastSnapshotTime(new Date().toISOString())
      }
    } catch (error) {
      console.error('❌ Error fetching latest snapshot:', error)
      setSnapshotAssetTotal(0)
      setTotalAssetNoEdit(0)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLatestSnapshot()
    
    // Auto refresh setiap 30 detik untuk mendeteksi snapshot baru
    const interval = setInterval(fetchLatestSnapshot, 30000)
    
    return () => clearInterval(interval)
  }, [refreshTrigger])

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 rounded-lg shadow-lg p-6 mb-6 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-white bg-opacity-20 rounded-full p-3">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
            </svg>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-white">Total Aset Keseluruhan</h3>
            <p className="text-blue-100 text-sm">Nilai dari snapshot terakhir</p>
          </div>
        </div>
        
        <div className="text-right">
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-white bg-opacity-20 rounded w-32 mb-2"></div>
              <div className="h-6 bg-white bg-opacity-20 rounded w-28 mb-2"></div>
              <div className="h-4 bg-white bg-opacity-20 rounded w-24"></div>
            </div>
          ) : (
            <>
              <div className="text-3xl font-bold text-white mb-2">
                {formatRupiah(totalAssetNoEdit)}
              </div>
              <div className="text-lg font-medium text-blue-100 mb-1">
                Dengan Edit: {formatRupiah(snapshotAssetTotal)}
              </div>
              {lastSnapshotTime && (
                <p className="text-blue-100 text-xs">
                  Snapshot: {formatDateTime(lastSnapshotTime)}
                </p>
              )}
            </>
          )}
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-white border-opacity-20">
        <div className="text-blue-100 text-sm">
          <svg className="w-4 h-4 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
          </svg>
          <strong>Nilai Utama (Tanpa Edit):</strong> tidak berubah saat edit transaksi. <strong>Dengan Edit:</strong> update setiap ada transaksi.
        </div>
      </div>
    </div>
  )
}

export default CumulativeAssetCard
