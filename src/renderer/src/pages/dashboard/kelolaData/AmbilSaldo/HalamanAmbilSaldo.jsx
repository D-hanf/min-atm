import React, { useEffect, useState } from 'react'

import AlertDialog from '../../../../components/AlertDialog'
import ButtonInput from '../../../../components/ButtonInput'
import ConfirmDialog from '../../../../components/ConfirmDialog'
import Dropdown from '../../../../components/Dropdown'
import FormLayout from './FormLayout'
import InputField from '../../../../components/InputField'
import ModalEdit from '../../../../shared/ui/Modal'
import SearchField from '../../../../components/SearchField'
import TableContent from '../../../../components/TableContent'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import { useTheme } from '../../../../context/ThemeContext'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

const HalamanAmbilSaldo = () => {
  const { isDark } = useTheme()
  const [stores] = useState([])

  const [ambilSaldo, setAmbilSaldo] = useState([])
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  const [users, setUsers] = useState([])
  const [loggedInUser, setLoggedInUser] = useState(null)
  const [userRole, setUserRole] = useState(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'))
    return storedUser?.role ? storedUser.role.toLowerCase() : 'kasir'
  })

  const [showAlertDialog, setShowAlertDialog] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  const getTodayWIB = () => dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD')
  const getNowDateTimeLocalWIB = () => dayjs().tz('Asia/Jakarta').format('YYYY-MM-DDTHH:mm')
  const toDateOnly = (val) =>
    dayjs(val).isValid()
      ? dayjs(val).tz('Asia/Jakarta').format('YYYY-MM-DD')
      : ''
  const toInputDateTimeLocal = (val) => {
    if (!val) return getNowDateTimeLocalWIB()
    return dayjs(val).isValid()
      ? dayjs(val).tz('Asia/Jakarta').format('YYYY-MM-DDTHH:mm')
      : getNowDateTimeLocalWIB()
  }
  const toDbDateTime = (val) => {
    if (!val) return dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss')
    if (val.includes(' ')) {
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(val)) return `${val}:00`
      return val
    }
    if (val.includes('T')) {
      const base = val.replace('T', ' ')
      return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(base) ? `${base}:00` : base
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return `${val} 00:00:00`
    return val
  }

  const [formData, setFormData] = useState({
    id: null,
    petugas_pengambil_id: 1,
    platform: '',
    saldo_platform: '',
    nominal_pengambilan: '',
    biaya_admin: '',
    metode_pengambilan: '',
    tujuan_pengambilan: '',
    tanggal_pengambilan: getTodayWIB(),
    keterangan: ''
  })
  const [filterText, setFilterText] = useState('')
  const [saldoAwalOptions, setSaldoAwalOptions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState(null)

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  const extractNumeric = (formattedValue) => {
    if (!formattedValue) return ''
    return formattedValue.toString().replace(/[^0-9]/g, '')
  }

  const fetchSaldoAwal = async () => {
    try {
      setIsLoading(true)
      const result = await window.api.getSaldoAwal()
      setSaldoAwalOptions(result)
    } catch (error) {
      setSaldoAwalOptions([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const result = await window.api.getUsers()
      setUsers(result || [])
    } catch (error) {
      setUsers([])
    }
  }

  const fetchAmbilSaldo = async () => {
    try {
      const result = await window.api?.getAmbilSaldo(userRole)

      let filtered = result
      console.log('📊 Data ambil saldo:', result)
      if (userRole.toLowerCase() === 'kasir') {
        const today = getTodayWIB()
        filtered = result.filter((item) => toDateOnly(item.tanggal_pengambilan) === today)
      }

      setAmbilSaldo(filtered)
    } catch (error) {
      console.error('❌ Gagal ambil data ambil saldo:', error)
    }
  }

  useEffect(() => {
    const userString = localStorage.getItem('user')
    if (userString) {
      const user = JSON.parse(userString)
      setLoggedInUser(user)
      setUserRole(user.role.toLowerCase())
    }
    fetchSaldoAwal()
    fetchUsers()
  }, [])

  useEffect(() => {
    if (userRole) {
      console.log('🧪 Role terdeteksi:', userRole)
      fetchAmbilSaldo()
    }
  }, [userRole])

  // Handle platform selection in edit mode
  const handlePlatformChange = (selectedPlatformName) => {
    // Find the selected saldo_awal item
    const selectedItem = saldoAwalOptions.find(
      (item) => item.nama_sumber_dana === selectedPlatformName
    )

    if (selectedItem) {
      setSelectedPlatform(selectedItem)

      // Update form data with selected platform, its current saldo, and biaya_admin
      setFormData({
        ...formData,
        // Keep existing datetime; do not reset to date-only
        platform: selectedItem.nama_sumber_dana,
        saldo_platform: selectedItem.saldo.toString(),
        biaya_admin: formatRupiah(selectedItem.biaya_admin) // Format biaya_admin as Rupiah
      })
    } else {
      setSelectedPlatform(null)
    }
  }

  // Handle add ambil saldo
  const handleAddAmbilSaldo = async (formData) => {
    try {
      // Process form data for database
      const newAmbilSaldo = {
        petugas_pengambil_id: parseInt(formData.user_id || 1), // Default to 1 if not provided
        platform: formData.platform,
        saldo_platform: parseFloat(formData.currentBalance?.replace(/[^0-9]/g, '') || 0),
        nominal_pengambilan: parseFloat(formData.amount?.replace(/[^0-9]/g, '') || 0),
        biaya_admin: parseFloat(formData.fee?.replace(/[^0-9]/g, '') || 0),
        metode_pengambilan: formData.withdrawalMethod,
        tujuan_pengambilan: formData.withdrawalAccount,
        tanggal_pengambilan: formData.withdrawalDate || getTodayWIB(), // Use the current date in WIB timezone
        keterangan: formData.description
      }

      await window.api.createAmbilSaldo(newAmbilSaldo)

      // Refresh both ambil saldo and saldo awal data
      await Promise.all([fetchAmbilSaldo(), fetchSaldoAwal()])

      console.log('✅ Data ambil saldo berhasil ditambahkan')
    } catch (error) {
      console.error('❌ Gagal menambahkan data ambil saldo:', error)
    }
  }

  // Handle delete ambil saldo
  const handleDelete = (id) => {
    // Check if user is admin first
    if (!loggedInUser || loggedInUser.role !== 'admin') {
      setAlertMessage('Maaf, hanya admin yang dapat menghapus data pengambilan saldo.')
      setShowAlertDialog(true)
      return
    }

    setDeleteId(id)
    setShowConfirmDialog(true)
  }

  const confirmDelete = async () => {
    try {
      await window.api.deleteAmbilSaldo(deleteId)
      await fetchAmbilSaldo()
      console.log('✅ Data ambil saldo berhasil dihapus')
    } catch (error) {
      console.error('❌ Gagal menghapus data ambil saldo:', error)
    } finally {
      setShowConfirmDialog(false)
      setDeleteId(null)
    }
  }

  // Handle edit ambil saldo
  const handleEdit = (id) => {
    if (!loggedInUser) {
      setAlertMessage('Pengguna tidak terdeteksi.')
      setShowAlertDialog(true)
      return
    }

    const itemToEdit = ambilSaldo.find((item) => item.id === id)
    if (!itemToEdit) return

    const itemDate = dayjs(itemToEdit.tanggal_pengambilan).format('YYYY-MM-DD')
    const today = getTodayWIB()

    if (loggedInUser.role !== 'admin' && itemDate !== today) {
      setAlertMessage('Kasir hanya dapat mengedit data tanggal hari ini.')
      setShowAlertDialog(true)
      return
    }

    let formattedDate
    try {
      formattedDate = toInputDateTimeLocal(itemToEdit.tanggal_pengambilan)
    } catch (error) {
      console.error('❌ Error formatting date:', error)
      formattedDate = getNowDateTimeLocalWIB()
    }

    setFormData({
      id: itemToEdit.id,
      petugas_pengambil_id: itemToEdit.petugas_pengambil_id,
      platform: itemToEdit.platform,
      saldo_platform: itemToEdit.saldo_platform.toString(),
      nominal_pengambilan: formatRupiah(itemToEdit.nominal_pengambilan),
      biaya_admin: formatRupiah(itemToEdit.biaya_admin || 0),
      metode_pengambilan: itemToEdit.metode_pengambilan || '',
      tujuan_pengambilan: itemToEdit.tujuan_pengambilan || '',
      tanggal_pengambilan: formattedDate,
      keterangan: itemToEdit.keterangan || ''
    })

    const matchingSaldoAwal = saldoAwalOptions.find(
      (item) => item.nama_sumber_dana === itemToEdit.platform
    )
    setSelectedPlatform(matchingSaldoAwal || null)

    setModalOpen(true)
  }

  // Handle input changes for currency fields
  const handleCurrencyInputChange = (e, fieldName) => {
    const value = e.target.value
    // Extract numeric value
    const numericValue = extractNumeric(value)
    // Format as currency
    const formattedValue = formatRupiah(numericValue)

    setFormData({
      ...formData,
      [fieldName]: formattedValue
    })
  }

  const handleSubmitEdit = async () => {
    try {
  // Normalize to full WIB timestamp for DB
  const formattedDate = toDbDateTime(formData.tanggal_pengambilan)

      console.log('📅 Date before submission:', formData.tanggal_pengambilan)
      console.log('📅 Formatted date for submission:', formattedDate)

      // Extract numeric values from formatted currency strings
      const numericNominalPengambilan = extractNumeric(formData.nominal_pengambilan)
      const numericBiayaAdmin = extractNumeric(formData.biaya_admin)

      // Ensure all data is properly formatted
      const updatedEntry = {
        id: formData.id,
        petugas_pengambil_id: parseInt(formData.petugas_pengambil_id) || 1,
        platform: formData.platform,
        saldo_platform: parseFloat(formData.saldo_platform) || 0,
        nominal_pengambilan: parseFloat(numericNominalPengambilan) || 0,
        biaya_admin: parseFloat(numericBiayaAdmin) || 0,
        metode_pengambilan: formData.metode_pengambilan,
        tujuan_pengambilan: formData.tujuan_pengambilan,
  tanggal_pengambilan: formattedDate, // Store full datetime
        keterangan: formData.keterangan
      }

      console.log('📝 Submitting updated data:', updatedEntry)

      await window.api.updateAmbilSaldo(updatedEntry)

      // Refresh both ambil saldo and saldo awal data
      await Promise.all([fetchAmbilSaldo(), fetchSaldoAwal()])

      setModalOpen(false)
      console.log('✅ Data ambil saldo berhasil diupdate')
    } catch (error) {
      console.error('❌ Gagal update data ambil saldo:', error)
    }
  }

  // Process data for display - don't add the index field
  const filteredData = ambilSaldo
    .filter((item) => {
      // (Redundant with fetchAmbilSaldo role filter, but keep safe normalization)
      if (userRole.toLowerCase() === 'kasir') {
        return toDateOnly(item.tanggal_pengambilan) === getTodayWIB()
      }
      return true
    })
    .filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(filterText.toLowerCase())
      )
    )
    .map((item) => {
      let petugasName = 'ID: ' + item.petugas_pengambil_id
      const user = users.find((user) => user.id === item.petugas_pengambil_id)
      if (user) {
        petugasName = user.nama || user.username || petugasName
      } else if (loggedInUser && loggedInUser.id === item.petugas_pengambil_id) {
        petugasName = loggedInUser.nama || loggedInUser.username || petugasName
      }
      return {
        ...item,
  tanggal_pengambilan: dayjs(item.tanggal_pengambilan).tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm'),
        petugas_pengambil_id: petugasName,
        saldo_platform: formatRupiah(item.saldo_platform),
        nominal_pengambilan: formatRupiah(item.nominal_pengambilan),
        biaya_admin: formatRupiah(item.biaya_admin),
        sumber_dana: item.platform // Add for filter compatibility
      }
    })
  const columns = [
    { key: 'petugas_pengambil_id', label: 'Petugas Pengambil' },
    { key: 'tanggal_pengambilan', label: 'Tanggal Pengambilan' },
    { key: 'platform', label: 'Platform' },
    { key: 'saldo_platform', label: 'Saldo Platform' },
    { key: 'nominal_pengambilan', label: 'Nominal Pengambilan' },
    { key: 'biaya_admin', label: 'Biaya Admin' },
    { key: 'metode_pengambilan', label: 'Metode Pengambilan' },
    { key: 'tujuan_pengambilan', label: 'Tujuan Pengambilan' },
    { key: 'keterangan', label: 'Keterangan' }
  ]
  return (
    <>
      <div className="flex w-full gap-4 items-center mb-6">
        <div className="flex w-full gap-4 items-center p-4">
          <div className="flex items-center">
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Ambil Saldo{' '}
            </h1>
          </div>
          {/* <div className="flex-1 max-w-xs">
            <Dropdown
              className="w-full"
              label="Pilih Toko"
              color={'gray'}
              items={stores.map((store) => store.name)}
            />
          </div> */}
        </div>
      </div>

      <div>
      
         <TableContent
              searchValue={filterText}
              showSumberDanaFilter={true}
              onSearchChange={setFilterText}
              btnSize={'xs'}
              data={filteredData}
              showDateFilter={true}
              userRole={userRole}
              title={'Data Ambil Saldo'}
              columns={columns}
              onDelete={handleDelete}
              onEdit={handleEdit}
              rowPerPage={10}
              onAdd={
                <FormLayout
                  onSubmit={handleAddAmbilSaldo}
                  buttonText="Tambah Ambil Saldo"
                ></FormLayout>
              }
            />
      </div>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmDelete}
        title="Konfirmasi Hapus"
        message="Apakah Anda yakin ingin menghapus data pengambilan saldo ini?"
      />

      <ModalEdit
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitEdit}
        title="Edit Data Pengambilan Saldo"
      >
        {/* Display the original user's name in edit mode */}
        <div className="col-span-2 mb-4">
          <label
            className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Petugas Pengambil
          </label>
          <div
            className={`p-2 ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-gray-300'
                : 'bg-gray-100 border-gray-300 text-gray-700'
            } border rounded-md`}
          >
            {(() => {
              // Find the user in the users array
              const user = users.find((user) => user.id === formData.petugas_pengambil_id)
              if (user) {
                return user.nama || user.username || 'ID: ' + user.id
              }
              // Fallback to logged in user if it's the same ID
              else if (loggedInUser && loggedInUser.id === formData.petugas_pengambil_id) {
                return loggedInUser.nama || loggedInUser.username || 'ID: ' + loggedInUser.id
              }
              // Last resort, just show the ID
              return 'ID: ' + formData.petugas_pengambil_id
            })()}
          </div>
          {/* Keep the original ID for submission */}
          <input type="hidden" name="petugas_pengambil_id" value={formData.petugas_pengambil_id} />
        </div>
        <InputField
          name="tanggal_pengambilan"
          type="datetime-local"
          value={formData.tanggal_pengambilan || getNowDateTimeLocalWIB()}
          onChange={(e) => {
            setFormData({ ...formData, tanggal_pengambilan: e.target.value })
          }}
        >
          Tanggal & Jam Pengambilan
        </InputField>
        {/* Platform dropdown */}
        <div className="col-span-2 mb-4">
          <label
            className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Platform/Sumber Dana
          </label>
          <select
            className={`w-full p-2 border rounded-md ${
              isDark
                ? 'border-gray-600 bg-gray-700 text-white'
                : 'border-gray-300 bg-white text-gray-800'
            } focus:ring-blue-500 focus:border-blue-500`}
            value={formData.platform}
            onChange={(e) => handlePlatformChange(e.target.value)}
            disabled={isLoading || saldoAwalOptions.length === 0}
          >
            <option value="">-- Pilih Sumber Dana --</option>
            {saldoAwalOptions.map((item) => (
              <option key={item.id} value={item.nama_sumber_dana}>
                {item.nama_sumber_dana}
              </option>
            ))}
          </select>
          {saldoAwalOptions.length === 0 && !isLoading && (
            <p className="text-red-500 text-xs mt-1">
              Tidak ada sumber dana tersedia. Silakan tambahkan sumber dana terlebih dahulu.
            </p>
          )}
        </div>

        {/* Show current balance field only when platform is selected */}
        {selectedPlatform ? (
          <div className="col-span-2 mb-4">
            <label
              className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Saldo Platform
            </label>
            <div
              className={`p-2 ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-gray-300'
                  : 'bg-gray-100 border-gray-300 text-gray-700'
              } border rounded-md`}
            >
              {formatRupiah(formData.saldo_platform)}
            </div>
          </div>
        ) : (
          <InputField
            name="saldo_platform"
            type="number"
            value={formData.saldo_platform || ''}
            onChange={(e) => setFormData({ ...formData, saldo_platform: e.target.value })}
          >
            Saldo Platform
          </InputField>
        )}

        <InputField
          name="nominal_pengambilan"
          type="text"
          value={formData.nominal_pengambilan || ''}
          onChange={(e) => handleCurrencyInputChange(e, 'nominal_pengambilan')}
          placeholder="Rp 0"
        >
          Nominal Pengambilan
        </InputField>

        <InputField
          name="biaya_admin"
          required={false}
          type="text"
          value={formData.biaya_admin || ''}
          onChange={(e) => handleCurrencyInputChange(e, 'biaya_admin')}
          placeholder="Rp 0"
          className={selectedPlatform ? 'border-yellow-500' : ''}
        >
          Biaya Admin{' '}
          {selectedPlatform && (
            <span className="text-xs text-yellow-600">(dari platform, dapat diedit)</span>
          )}
        </InputField>

        <InputField
          name="metode_pengambilan"
          value={formData.metode_pengambilan || ''}
          onChange={(e) => setFormData({ ...formData, metode_pengambilan: e.target.value })}
        >
          Metode Pengambilan
        </InputField>

        <InputField
          name="tujuan_pengambilan"
          value={formData.tujuan_pengambilan || ''}
          onChange={(e) => setFormData({ ...formData, tujuan_pengambilan: e.target.value })}
        >
          Tujuan Pengambilan
        </InputField>

        <InputField
          name="keterangan"
          value={formData.keterangan || ''}
          required={false}
          onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
        >
          Keterangan
        </InputField>
      </ModalEdit>

      {/* Add AlertDialog for non-admin users */}
      <AlertDialog
        isOpen={showAlertDialog}
        onClose={() => setShowAlertDialog(false)}
        title="Akses Terbatas"
        message={alertMessage}
      />
    </>
  )
}

export default HalamanAmbilSaldo
