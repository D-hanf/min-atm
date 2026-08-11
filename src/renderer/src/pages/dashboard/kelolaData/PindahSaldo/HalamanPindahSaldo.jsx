import React, { useEffect, useMemo, useState } from 'react'

import AdminRangeFilterBar from '../../../../components/AdminRangeFilterBar'
import AlertDialog from '../../../../components/AlertDialog'
import ButtonInput from '../../../../components/ButtonInput'
import ConfirmDialog from '../../../../components/ConfirmDialog'
import DataVisibilitySettings from '../../../../components/DataVisibilitySettings'
import Dropdown from '../../../../components/Dropdown'
import FormLayout from './FormLayout'
import InputField from '../../../../components/InputField'
import ModalEdit from '../../../../shared/ui/Modal'
import SearchField from '../../../../components/SearchField'
import SelectItems from '../../../../components/SelectItems'
import TableContent from '../../../../components/TableContent'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import { useAdminDateRange } from '../../../../hooks/useAdminDateRange'
import { useAuth } from '../../../../context/AuthContext'
import { useColumnSettings } from '../../../../hooks/useColumnSettings'
import { useLock } from '../../../../context/LockContext'
import { useTheme } from '../../../../context/ThemeContext'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)
const HalamanPindahSaldo = () => {
  const [stores, setStores] = useState([])
  const { isDark } = useTheme()
  const { isGloballyLocked } = useLock()
  const { isColumnVisible } = useColumnSettings('pindahSaldo')
  const [selectedStore, setSelectedStore] = useState(null)
  const [transfers, setTransfers] = useState([])
  const [saldoData, setSaldoData] = useState([])
  const [users, setUsers] = useState([])
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const getTodayWIB = () => dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD')
  const toDateOnly = (val) =>
    dayjs(val).isValid() ? dayjs(val).tz('Asia/Jakarta').format('YYYY-MM-DD') : ''
  const toDisplayDateTime = (val) =>
    dayjs(val).isValid() ? dayjs(val).tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm') : val || ''
  const [formData, setFormData] = useState({
    user: '',
    platformSource: '',
    platformDestination: '',
    senderBalance: '',
    receiverBalance: '',
    amount: '',
    operational: '',
    description: ''
  })
  const [filterText, setFilterText] = useState('')
  const [selectedSumberDana, setSelectedSumberDana] = useState('')
  const [platformSourceOptions, setPlatformSourceOptions] = useState('')
  const [platformDestinationOptions, setPlatformDestinationOptions] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [confirmMessage, setConfirmMessage] = useState('')
  const { user: loggedInUser } = useAuth()
  const userRole = loggedInUser?.role?.toLowerCase() || 'kasir'
  const isAdmin = userRole === 'admin'
  const [visibilitySetting, setVisibilitySetting] = useState({ days: 1 })
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  // Filter tanggal & sumber dana di tabel dilacak MURNI buat notice informatif
  // di AdminRangeFilterBar — TIDAK memicu perluasan rentang. Filter bekerja di
  // dalam data yang sudah ke-load sesuai chip yang aktif.
  const [activeDateFilter, setActiveDateFilter] = useState('')
  const [activeSumberDanaFilter, setActiveSumberDanaFilter] = useState('')
  const isSearchingActive = isAdmin && filterText.trim().length > 0
  const isFilteringActive = isAdmin && Boolean(activeDateFilter || activeSumberDanaFilter)

  const {
    rangePreset,
    setRangePreset,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    isReady: isRangeReady,
    range
  } = useAdminDateRange()

  // Add new states for logged in user and alert dialog
  const [showAlertDialog, setShowAlertDialog] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [showInfoDialog, setShowInfoDialog] = useState(false)
  const [infoMessage, setInfoMessage] = useState('')
  // Add state for selected saldo objects
  const [selectedSourceSaldo, setSelectedSourceSaldo] = useState(null)
  const [selectedDestSaldo, setSelectedDestSaldo] = useState(null)

  // Ambil setting visibilitas ('N hari ke belakang') dan update state sekaligus
  // return angkanya, supaya dipakai langsung buat manggil getPindahSaldo(role, days).
  const fetchVisibilityDays = async () => {
    try {
      const result = await window.api?.getDataVisibilitySetting?.('pindah-saldo')
      const days = Number(result?.days) > 0 ? Number(result.days) : 1
      setVisibilitySetting({ days })
      return days
    } catch (error) {
      console.error('❌ Gagal ambil setting visibilitas data pindah saldo:', error)
      return 1
    }
  }

  // Transform 1 baris mentah pindah_saldo jadi bentuk siap-tampil. Dipakai oleh
  // fetchTransfers() SATU-SATUNYA tempat fetch — sebelumnya logic ini
  // terduplikasi di 4 tempat (initial load, tambah, hapus, edit), yang bikin
  // gampang "lupa update" salah satu saat mengubah scope rentang tanggal.
  const buildTransferRow = (transfer, saldoList, userList) => {
    const sourceSaldo = saldoList.find((s) => s.id === transfer.sumber_dana_id)
    const destSaldo = saldoList.find((s) => s.id === transfer.tujuan_dana_id)
    const user = userList.find((u) => u.id === transfer.user_pemindah_id)

    return {
      id: transfer.id,
      user: user?.nama || 'Unknown',
      userId: transfer.user_pemindah_id,
      platformSource: transfer.platform ? transfer.platform.split('>')[0]?.trim() : '',
      platformDestination: transfer.platform ? transfer.platform.split('>')[1]?.trim() : '',
      senderBalanceName: sourceSaldo?.nama_sumber_dana || 'Unknown',
      senderBalance: transfer.saldo_sumber || 0, // Saldo historis saat pemindahan
      senderBalanceId: transfer.sumber_dana_id,
      receiverBalanceName: destSaldo?.nama_sumber_dana || 'Unknown',
      receiverBalance: transfer.saldo_tujuan || 0, // Saldo historis saat pemindahan
      receiverBalanceId: transfer.tujuan_dana_id,
      sumber_dana: sourceSaldo?.nama_sumber_dana || 'Unknown', // For filter compatibility
      amount: transfer.nominal,
      operational: transfer.biaya_admin || 0,
      description: transfer.keterangan || '',
      date: transfer.tanggal
    }
  }

  // Satu-satunya tempat yang menarik data pindah saldo + saldo terbaru dari
  // backend. Dipanggil saat mount, saat rentang/filter admin berubah, dan
  // setelah tambah/edit/hapus — supaya scope rentang tanggal SELALU konsisten
  // di semua alur, tidak ada lagi jalur yang "lupa" ikut dibatasi/diperlebar.
  const fetchTransfers = async (userListOverride) => {
    try {
      setIsLoading(true)

      // 🔒 Ambil setting visibilitas dulu, baru minta data pindah saldo ke
      // backend dengan role asli + jumlah hari itu (backend yang filter di SQL).
      const days = await fetchVisibilityDays()

      // Admin: rentang sesuai chip yang dipilih ('all' → from/to undefined,
      // artinya seluruh histori — pilihan sadar admin lewat chip). Filter tabel
      // (tanggal/sumber dana/pencarian) TIDAK mengubah rentang ini. Kasir:
      // tidak terpengaruh sama sekali, tetap dibatasi `days`.
      const { from, to } = isAdmin ? range : {}

      const [transfersData, updatedSaldo] = await Promise.all([
        window.api.getPindahSaldo(userRole, days, from || undefined, to || undefined),
        window.api.getSaldoAwal()
      ])
      setSaldoData(updatedSaldo || [])

      const userList = userListOverride || users
      const transformedTransfers = (transfersData || []).map((transfer) =>
        buildTransferRow(transfer, updatedSaldo || [], userList)
      )

      setTransfers(transformedTransfers)
      return transformedTransfers
    } catch (error) {
      console.error('❌ Gagal memuat data pindah saldo:', error)
    } finally {
      setIsLoading(false)
      setHasLoadedOnce(true)
    }
  }

  // Fetch data statis sekali di awal (toko, users) — tidak perlu ikut
  // rentang tanggal.
  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        const storesData = await window.api.getTokoWithEmployeeCount()
        setStores(storesData || [])

        const usersData = await window.api.getUsers()
        setUsers(usersData || [])

        // Fetch transfer pertama kali dengan users yang baru saja didapat
        // (bukan state `users` yang belum ke-set saat render ini) supaya nama
        // user langsung benar tanpa perlu fetch ulang.
        await fetchTransfers(usersData || [])
      } catch (error) {
        console.error('❌ Gagal ambil data awal pindah saldo:', error)
      }
    }

    fetchStaticData()
  }, [])

  // Fetch ulang transfer setiap kali rentang tanggal chip admin berubah.
  // Dilewati saat mount (sudah ditangani effect di atas) dengan menunggu
  // `hasLoadedOnce`. Filter tabel (tanggal/sumber dana/pencarian) TIDAK
  // memicu effect ini — filter bekerja di dalam data yang sudah ke-load.
  useEffect(() => {
    if (!hasLoadedOnce) return
    if (isAdmin && !isRangeReady) return
    fetchTransfers()
  }, [rangePreset, customFrom, customTo])

  // Updated columns definition to match our database structure
  const allColumns = [
    { key: 'user', label: 'User Pemindah' },
    { key: 'date', label: 'Tanggal' },
    { key: 'senderBalanceName', label: 'Sumber Dana' },
    { key: 'receiverBalanceName', label: 'Tujuan Dana' },
    { key: 'formattedSenderBalance', label: 'Saldo Pengirim' },
    { key: 'formattedReceiverBalance', label: 'Saldo Penerima' },
    { key: 'formattedAmount', label: 'Nominal' },
    { key: 'formattedOperational', label: 'Operasional' },
    { key: 'description', label: 'Keterangan' }
  ]

  // Filter kolom berdasarkan setting
  const columns = allColumns.filter((col) => isColumnVisible(col.key))

  // Daftar nama sumber dana APA ADANYA dari master data — selalu ditarik penuh
  // (fetchTransfers menarik getSaldoAwal setiap kali, tidak ikut dibatasi
  // rentang tanggal), dipakai sebagai opsi dropdown filter supaya opsinya
  // tidak diam-diam hilang gara-gara transfer yang memakainya kebetulan di
  // luar rentang yang sedang aktif.
  const sumberDanaOptions = useMemo(
    () => [...new Set(saldoData.map((item) => item.nama_sumber_dana).filter(Boolean))],
    [saldoData]
  )

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  // New function for displaying account balances
  const formatBalanceDisplay = (value) => {
    if (value === null || value === undefined) return 'Tidak ada Saldo'
    const numericValue = Number(value)
    if (numericValue === 0) return 'Tidak ada Saldo'
    return formatRupiah(numericValue)
  }

  const formatInputRupiah = (value) => {
    const cleaned = value.replace(/[^0-9]/g, '')
    const number = parseInt(cleaned, 10)
    if (isNaN(number)) return 'Rp 0'
    return 'Rp' + number.toLocaleString('id-ID')
  }

  const handleAddTransfer = async (formData) => {
    try {
      const cleanedAmount = parseInt(String(formData.amount).replace(/[^0-9]/g, ''), 10)
      const cleanedOperational = parseInt(String(formData.operational).replace(/[^0-9]/g, ''), 10)
      const platformString = `${formData.platformSource} > ${formData.platformDestination}`
      const currentUserId = formData.user_id ?? loggedInUser?.id
      const sourceSaldo = saldoData.find(
        (s) => s.nama_sumber_dana?.toLowerCase() === formData.senderBalance?.toLowerCase()
      )
      const destSaldo = saldoData.find(
        (s) => s.nama_sumber_dana?.toLowerCase() === formData.receiverBalance?.toLowerCase()
      )

      if (!sourceSaldo || !destSaldo) {
        console.error('Saldo source or destination not found')
        return
      }

      const totalNeeded = cleanedAmount + cleanedOperational
      if (sourceSaldo.saldo < totalNeeded) {
        setAlertMessage(
          `Saldo ${sourceSaldo.nama_sumber_dana} tidak mencukupi untuk transfer sebesar ${formatRupiah(cleanedAmount)} + biaya admin ${formatRupiah(cleanedOperational)}.`
        )
        setShowAlertDialog(true)
        return
      }

      const transferData = {
        sumber_dana_id: sourceSaldo.id,
        tujuan_dana_id: destSaldo.id,
        user_pemindah_id: currentUserId,
        nominal: cleanedAmount,
        platform: platformString,
        biaya_admin: cleanedOperational || 0,
        saldo_sumber: sourceSaldo.saldo,
        saldo_tujuan: destSaldo.saldo,
        keterangan: formData.description,
        tanggal: formData.tanggal || getTodayWIB()
      }

      const result = await window.api.createPindahSaldo(transferData)

      if (result) {
        await fetchTransfers()
      }
    } catch (error) {
      console.error('Error creating transfer:', error)
      setAlertMessage(`Gagal melakukan pemindahan saldo: ${error.message || 'Unknown error'}`)
      setShowAlertDialog(true)
    }
  }

  const handleDelete = (id) => {
    // Check if user is admin first
    if (!loggedInUser || (loggedInUser.role || '').toLowerCase() !== 'admin') {
      setAlertMessage('Maaf, hanya admin yang dapat menghapus data pemindahan saldo.')
      setShowAlertDialog(true)
      return
    }

    const transferToDelete = transfers.find((item) => item.id === id)
    setDeleteId(id)
    const confirmMessage = 'Apakah Anda yakin ingin menghapus data pemindahan saldo ini?'
    setConfirmMessage(confirmMessage)
    setShowConfirmDialog(true)
  }

  const confirmDelete = async () => {
    try {
      await window.api.deletePindahSaldo(deleteId)
      await fetchTransfers()
    } catch (error) {
      console.error('Error deleting transfer:', error)
    } finally {
      setShowConfirmDialog(false)
      setDeleteId(null)
    }
  }

  const handleEdit = (id) => {
    const itemToEdit = transfers.find((item) => item.id === id)
    if (!itemToEdit) return

    const today = getTodayWIB()
    const currentUser = loggedInUser
    const currentUserId = currentUser?.id
    const currentUserRole = currentUser?.role?.toLowerCase() || 'kasir'

    // Debug logging untuk cek data user
    console.log('🔍 Debug Edit Check PindahSaldo:', {
      currentUser,
      currentUserId,
      currentUserRole,
      itemUserId: itemToEdit.userId,
      itemUser: itemToEdit.user,
      itemDate: itemToEdit.date
    })

    // Pengecekan role dan user ID
    if (currentUserRole === 'kasir') {
      // Cek tanggal - kasir hanya bisa edit transaksi hari ini
      if (toDateOnly(itemToEdit.date) !== today) {
        setInfoMessage(
          'Kasir hanya bisa mengedit pemindahan saldo hari ini. Hubungi admin untuk mengubah data lama.'
        )
        setShowInfoDialog(true)
        return
      }

      // Cek user ID atau nama - kasir hanya bisa edit data milik sendiri
      const currentUserName = (
        currentUser?.nama ||
        currentUser?.name ||
        currentUser?.username ||
        ''
      ).toLowerCase()
      const itemUserName = (itemToEdit.user || '').toLowerCase()

      // Cek apakah data dibuat oleh admin
      if (itemUserName.includes('admin')) {
        setInfoMessage(
          `Anda tidak dapat mengedit pemindahan saldo yang dibuat oleh Admin. (Dibuat oleh: ${itemToEdit.user || 'Admin'})`
        )
        setShowInfoDialog(true)
        return
      }

      // Cek apakah data milik user lain (ID ATAU nama harus cocok)
      const isOwner =
        (itemToEdit.userId && itemToEdit.userId === currentUserId) ||
        (itemUserName && itemUserName === currentUserName)

      if (!isOwner && (itemToEdit.userId || itemUserName)) {
        setInfoMessage(
          `Anda tidak dapat mengedit pemindahan saldo yang dibuat oleh karyawan lain. (Dibuat oleh: ${itemToEdit.user || 'Unknown'})`
        )
        setShowInfoDialog(true)
        return
      }
    }
    // Admin bisa edit semua transaksi tanpa batasan

    const sourceSaldo = saldoData.find((s) => s.id === itemToEdit.senderBalanceId)
    const destSaldo = saldoData.find((s) => s.id === itemToEdit.receiverBalanceId)

    const cleanedData = {
      id: itemToEdit.id,
      user: itemToEdit.user,
      tanggal: itemToEdit.date,
      userId: itemToEdit.userId,
      platformSource: itemToEdit.platformSource,
      platformDestination: itemToEdit.platformDestination,
      senderBalance: itemToEdit.senderBalanceName || itemToEdit.senderBalance,
      senderBalanceId: itemToEdit.senderBalanceId,
      receiverBalance: itemToEdit.receiverBalanceName || itemToEdit.receiverBalance,
      receiverBalanceId: itemToEdit.receiverBalanceId,
      amount: formatInputRupiah(itemToEdit.amount.toString()),
      operational: formatInputRupiah(itemToEdit.operational.toString()),
      description: itemToEdit.description
    }

    setFormData(cleanedData)
    setPlatformSourceOptions(itemToEdit.platformSource)
    setPlatformDestinationOptions(itemToEdit.platformDestination)
    setSelectedSourceSaldo(sourceSaldo)
    setSelectedDestSaldo(destSaldo)
    setModalOpen(true)
  }

  // Extract unique platforms from saldo data for select options
  const getPlatformOptions = () => {
    const platformGroups = {}
    saldoData.forEach((item) => {
      if (item.nama_sumber_dana) {
        const platformMatch = item.nama_sumber_dana.match(/^(\w+)/)
        if (platformMatch) {
          const platform = platformMatch[1]
          platformGroups[platform] = true
        }
      }
    })
    return [
      ...Object.keys(platformGroups).map((platform) => ({
        label: platform,
        value: platform
      }))
    ]
  }

  // Data dari backend sudah difilter sesuai role + setting visibilitas
  // (lihat fetchVisibilityDays), jadi tidak perlu dipotong ulang di sini.
  const filteredData = transfers
    .filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(filterText.toLowerCase())
      )
    )
    .map((item, index) => ({
      ...item,
      date: toDisplayDateTime(item.date),
      tanggal: toDisplayDateTime(item.date),
      no: index + 1,
      formattedAmount: formatRupiah(item.amount),
      formattedOperational: formatRupiah(item.operational),
      formattedSenderBalance: formatRupiah(item.senderBalance),
      formattedReceiverBalance: formatRupiah(item.receiverBalance)
    }))

  const handleSubmitEdit = async (updatedData) => {
    try {
      const cleanedAmount = parseInt(String(updatedData.amount).replace(/[^0-9]/g, ''), 10)
      const cleanedOperational = parseInt(
        String(updatedData.operational).replace(/[^0-9]/g, ''),
        10
      )

      const id = formData.id

      if (!id) {
        console.error('Error: Missing ID for update operation')
        setAlertMessage('Error: Tidak dapat mengupdate data - ID tidak ditemukan')
        setShowAlertDialog(true)
        return
      }

      const userId = formData.userId ?? loggedInUser?.id
      const platformString = `${platformSourceOptions} > ${platformDestinationOptions}`

      if (!selectedSourceSaldo || !selectedDestSaldo) {
        console.error('Source or destination saldo not selected')
        setAlertMessage('Sumber dana atau tujuan dana tidak dipilih')
        setShowAlertDialog(true)
        return
      }

      const latestSaldoData = await window.api.getSaldoAwal()
      const latestSourceSaldo = latestSaldoData.find((s) => s.id === selectedSourceSaldo.id)
      const latestDestSaldo = latestSaldoData.find((s) => s.id === selectedDestSaldo.id)

      if (!latestSourceSaldo || !latestDestSaldo) {
        console.error('Failed to get latest saldo data')
        setAlertMessage('Gagal mendapatkan data saldo terbaru')
        setShowAlertDialog(true)
        return
      }

      const originalTransfer = transfers.find((t) => t.id === id)
      if (originalTransfer) {
        const originalTotal = originalTransfer.amount + originalTransfer.operational
        const newTotal = cleanedAmount + cleanedOperational

        if (newTotal > originalTotal && latestSourceSaldo.saldo + originalTotal < newTotal) {
          setAlertMessage(
            `Saldo ${latestSourceSaldo.nama_sumber_dana} tidak mencukupi untuk menambah nominal transfer.`
          )
          setShowAlertDialog(true)
          return
        }
      } else if (latestSourceSaldo.saldo < cleanedAmount + cleanedOperational) {
        setAlertMessage(
          `Saldo ${latestSourceSaldo.nama_sumber_dana} tidak mencukupi untuk transfer.`
        )
        setShowAlertDialog(true)
        return
      }

      const transferData = {
        id: id,
        sumber_dana_id: selectedSourceSaldo.id,
        tujuan_dana_id: selectedDestSaldo.id,
        user_pemindah_id: userId,
        nominal: cleanedAmount,
        platform: platformString,
        biaya_admin: cleanedOperational || 0,
        saldo_sumber: latestSourceSaldo.saldo,
        saldo_tujuan: latestDestSaldo.saldo,
        keterangan: updatedData.description,
        tanggal: formData.tanggal || getTodayWIB(),
        role: userRole
      }

      const result = await window.api.updatePindahSaldo(transferData)

      if (result) {
        await fetchTransfers()
      }
    } catch (error) {
      console.error('Error updating transfer:', error)
      setAlertMessage(`Error updating transfer: ${error.message || 'Unknown error'}`)
      setShowAlertDialog(true)
    } finally {
      setSelectedSourceSaldo(null)
      setSelectedDestSaldo(null)
      setModalOpen(false)
    }
  }

  return (
    <>
      {isGloballyLocked && (
        <div
          className={`${isDark ? 'bg-red-900 border-red-800 text-red-200' : 'bg-red-100 border-red-300 text-red-800'} border px-4 py-3 rounded mb-4 mx-4`}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🔒</span>
            <div>
              <strong>Sistem Terkunci!</strong>
              <p className="text-sm mt-1">
                Kasir ID {localStorage.getItem('locked_kasir_id')} telah menyimpan data. Semua fitur
                terkunci kecuali logout dan ganti tema.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex w-full gap-4 items-center mb-6">
        <div className="flex w-full gap-4 items-center p-4">
          <div className="flex items-center">
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Pindah Saldo
            </h1>
          </div>
        </div>
      </div>

      <div className="px-4">
        {isAdmin && (
          <DataVisibilitySettings
            pageKey="pindah-saldo"
            pageLabel="Pindah Saldo"
            onSaved={(setting) => setVisibilitySetting(setting)}
          />
        )}

        {isAdmin && (
          <AdminRangeFilterBar
            rangePreset={rangePreset}
            setRangePreset={setRangePreset}
            customFrom={customFrom}
            setCustomFrom={setCustomFrom}
            customTo={customTo}
            setCustomTo={setCustomTo}
            filterNotice={
              isSearchingActive
                ? 'Mencari kata kunci — hasil dibatasi ke rentang di atas. Ganti rentang atau pilih "Semua Riwayat" kalau tidak ketemu.'
                : isFilteringActive
                  ? 'Filter tabel aktif — hasil dibatasi ke rentang di atas. Ganti rentang atau pilih "Semua Riwayat" kalau tidak ketemu.'
                  : null
            }
            isLoading={isLoading}
            hasLoadedOnce={hasLoadedOnce}
          />
        )}

        {!isAdmin && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-700">
            Menampilkan data {visibilitySetting.days} hari terakhir (diatur oleh admin).
          </div>
        )}
      </div>

      <div>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <p>Loading...</p>
          </div>
        ) : (
          <TableContent
            searchValue={filterText}
            showSumberDanaFilter={true}
            onSumberDanaChange={(value) => {
              setSelectedSumberDana(value)
              setActiveSumberDanaFilter(value)
            }}
            sumberDanaOptions={sumberDanaOptions}
            onSearchChange={setFilterText}
            btnSize={'xs'}
            data={filteredData}
            showDateFilter={true}
            onDateChange={setActiveDateFilter}
            userRole={userRole}
            title={'Pindah Saldo'}
            columns={columns}
            onDelete={isGloballyLocked ? null : handleDelete}
            onEdit={isGloballyLocked ? null : handleEdit}
            rowPerPage={10}
            onAdd={
              <FormLayout
                onSubmit={handleAddTransfer}
                buttonText="Tambah Pemindahan Saldo"
                saldoOptions={saldoData}
              ></FormLayout>
            }
          />
        )}
      </div>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmDelete}
        title="Konfirmasi Hapus"
        message={confirmMessage}
      />

      <ModalEdit
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitEdit}
        title="Edit Data Pemindahan Saldo"
      >
        {/* Replace input field with display of user name */}
        <div className="col-span-2 mb-4">
          <label
            className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
          >
            User Pemindah
          </label>
          <div
            className={`p-2 border rounded-md ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-gray-200'
                : 'bg-gray-100 border-gray-300 text-gray-700'
            }`}
          >
            {formData.user ||
              (loggedInUser
                ? loggedInUser.username || loggedInUser.nama || 'User ID: ' + loggedInUser.id
                : 'Loading...')}
          </div>
          <input
            type="hidden"
            name="userId"
            value={formData.userId ?? loggedInUser?.id ?? ''}
          />
        </div>
        <InputField
          name="tanggal"
          type="datetime-local"
          value={
            formData.tanggal?.includes('T')
              ? formData.tanggal
              : formData.tanggal
                ? dayjs(formData.tanggal).format('YYYY-MM-DDTHH:mm')
                : dayjs().tz('Asia/Jakarta').format('YYYY-MM-DDTHH:mm')
          }
          onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
        >
          Tanggal & Jam
        </InputField>

        {/* Platform section with flex layout */}
        <div className="col-span-2 flex gap-4 mb-4">
          <div className="flex-1">
            <SelectItems
              onChange={(e) => {
                setPlatformSourceOptions(e.target.value)
                if (e.target.value) {
                  const matchingSaldo = saldoData.find(
                    (s) =>
                      s.nama_sumber_dana &&
                      s.nama_sumber_dana.toLowerCase().includes(e.target.value.toLowerCase())
                  )
                  if (matchingSaldo) {
                    setSelectedSourceSaldo(matchingSaldo)
                    setFormData((prev) => ({
                      ...prev,
                      senderBalance: matchingSaldo.nama_sumber_dana,
                      senderBalanceId: matchingSaldo.id
                    }))
                  }
                } else {
                  setSelectedSourceSaldo(null)
                  setFormData((prev) => ({
                    ...prev,
                    senderBalance: '',
                    senderBalanceId: null
                  }))
                }
              }}
              name="platformSource"
              label="Platform Sumber"
              value={platformSourceOptions}
              options={getPlatformOptions()}
            ></SelectItems>
          </div>

          <div className="flex-1">
            <SelectItems
              onChange={(e) => {
                setPlatformDestinationOptions(e.target.value)
                if (e.target.value) {
                  const matchingSaldo = saldoData.find(
                    (s) =>
                      s.nama_sumber_dana &&
                      s.nama_sumber_dana.toLowerCase().includes(e.target.value.toLowerCase())
                  )
                  if (matchingSaldo) {
                    setSelectedDestSaldo(matchingSaldo)
                    setFormData((prev) => ({
                      ...prev,
                      receiverBalance: matchingSaldo.nama_sumber_dana,
                      receiverBalanceId: matchingSaldo.id
                    }))
                  }
                } else {
                  setSelectedDestSaldo(null)
                  setFormData((prev) => ({
                    ...prev,
                    receiverBalance: '',
                    receiverBalanceId: null
                  }))
                }
              }}
              name="platformDestination"
              label="Platform Penerima"
              value={platformDestinationOptions}
              options={getPlatformOptions()}
            ></SelectItems>
          </div>
        </div>

        {/* Balance section with flex layout */}
        <div className="col-span-2 flex gap-4 mb-4">
          <div className="flex-1">
            <InputField
              name="senderBalance"
              type="text"
              value={selectedSourceSaldo ? formatBalanceDisplay(selectedSourceSaldo.saldo) : '-'}
              onChange={() => {}}
              disabled={true}
              className={
                selectedSourceSaldo && selectedSourceSaldo.saldo === 0 ? 'text-red-500' : ''
              }
            >
              Saldo Pengirim
            </InputField>
          </div>

          <div className="flex-1">
            <InputField
              name="receiverBalance"
              type="text"
              value={selectedDestSaldo ? formatBalanceDisplay(selectedDestSaldo.saldo) : '-'}
              onChange={() => {}}
              disabled={true}
              className={selectedDestSaldo && selectedDestSaldo.saldo === 0 ? 'text-red-500' : ''}
            >
              Saldo Penerima
            </InputField>
          </div>
        </div>

        <InputField
          name="amount"
          value={formData.amount || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              amount: formatInputRupiah(e.target.value)
            })
          }
        >
          Nominal
        </InputField>

        <InputField
          name="operational"
          value={formData.operational || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              operational: formatInputRupiah(e.target.value)
            })
          }
        >
          Operasional
        </InputField>

        <InputField
          name="description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required={false}
          className="col-span-2"
        >
          Keterangan
        </InputField>
      </ModalEdit>

      <AlertDialog
        isOpen={showAlertDialog}
        onClose={() => setShowAlertDialog(false)}
        title="Akses Terbatas"
        message={alertMessage}
      />

      <AlertDialog
        isOpen={showInfoDialog}
        onClose={() => setShowInfoDialog(false)}
        title="Informasi"
        message={infoMessage}
      />
    </>
  )
}

export default HalamanPindahSaldo