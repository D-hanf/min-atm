import React, { useEffect, useState } from 'react'

import AlertDialog from '../../../../components/AlertDialog'
import ConfirmDialog from '../../../../components/ConfirmDialog'
import FormLayout from './FormLayout'
import { HiSearch } from 'react-icons/hi'
import InputField from '../../../../components/InputField'
import ModalEdit from '../../../../shared/ui/Modal'
import SearchField from '../../../../components/SearchField'
import TableContent from '../../../../components/TableContent'
import { useTheme } from '../../../../context/ThemeContext'

function HalamanHutang() {
  const { isDark } = useTheme()
  const [ambilSaldo, setAmbilSaldo] = useState([])
  const [saldoAwalOptions, setSaldoAwalOptions] = useState([])
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [users, setUsers] = useState([])
  const [loggedInUser, setLoggedInUser] = useState(null)
  const [filterText, setFilterText] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showAlertDialog, setShowAlertDialog] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [jenisTransaksiOptions] = useState(['Ambil Hutang', 'Bayar Hutang'])
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    id: null,
    petugas_id: 1,
    platform_id: '',
    platform_name: '',
    saldo_platform: '',
    nominal_transaksi: '',
    jenis_transaksi: 'Ambil Hutang', // Default to "Ambil Hutang"
    biaya_admin: '0',
    tanggal_transaksi: new Date().toISOString().split('T')[0],
    keterangan: ''
  })

  // Updated columns definition - remove the index/No column entirely
  const columns = [
    // Remove the index/No column since TableContent already adds one
    { key: 'petugas_id', label: 'Petugas' },
    { key: 'platform_name', label: 'Platform' },
    { key: 'saldo_platform', label: 'Saldo Platform' },
    { key: 'jenis_transaksi', label: 'Jenis Transaksi' },
    { key: 'nominal_transaksi', label: 'Nominal Transaksi' },
    { key: 'biaya_admin', label: 'Biaya Admin' },
    { key: 'tanggal_transaksi', label: 'Tanggal Transaksi' },
    { key: 'keterangan', label: 'Keterangan' }
  ]

  // Format currency
  const formatRupiah = (value) => {
    if (!value && value !== 0) return ''

    // Remove all non-numeric characters
    const numeric = String(value).replace(/[^0-9]/g, '')

    // Format as currency
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(numeric)
  }

  // Extract numeric value from formatted string
  const extractNumeric = (formattedValue) => {
    if (!formattedValue) return ''
    return formattedValue.toString().replace(/[^0-9]/g, '')
  }

  // Fetch ambil saldo data from database
  const fetchAmbilSaldo = async () => {
    try {
      const result = await window.api.getHutang()
      setAmbilSaldo(result)
      console.log('✅ Data hutang berhasil diambil:', result)
    } catch (error) {
      console.error('❌ Gagal ambil data hutang:', error)
    }
  }

  // Fetch saldo awal data from database
  const fetchSaldoAwal = async () => {
    try {
      setIsLoading(true)
      const result = await window.api.getSaldoAwal()
      setSaldoAwalOptions(result)
      console.log('✅ Data saldo awal berhasil diambil:', result)
    } catch (error) {
      console.error('❌ Gagal ambil data saldo awal:', error)
      setSaldoAwalOptions([])
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch users data
  const fetchUsers = async () => {
    try {
      const result = await window.api.getUsers()
      setUsers(result)
      console.log('✅ Data users berhasil diambil:', result)
    } catch (error) {
      console.error('❌ Gagal ambil data users:', error)
    }
  }

  useEffect(() => {
    // Fetch data when component mounts
    fetchAmbilSaldo()
    fetchSaldoAwal()
    fetchUsers()

    // Get logged in user from localStorage
    const userString = localStorage.getItem('user')
    if (userString) {
      setLoggedInUser(JSON.parse(userString))
    }
  }, [])

  // Handle add hutang
  const handleAddAmbilSaldo = async (formData) => {
    try {
      console.log('📝 Adding new hutang transaction:', formData)

      // Submit data directly to the hutang API
      await window.api.createHutang(formData)

      // Refresh both hutang and saldo awal data
      await Promise.all([fetchAmbilSaldo(), fetchSaldoAwal()])

      console.log('✅ Data hutang berhasil ditambahkan')
    } catch (error) {
      console.error('❌ Gagal menambahkan data hutang:', error)
    }
  }

  // Handle edit ambil saldo
  const handleEdit = (id) => {
    // Check if user is admin first
    if (!loggedInUser || loggedInUser.role !== 'admin') {
      setAlertMessage('Maaf, hanya admin yang dapat mengedit data hutang.')
      setShowAlertDialog(true)
      return
    }

    const itemToEdit = ambilSaldo.find((item) => item.id === id)
    if (itemToEdit) {
      // Better date handling with fallback
      let formattedDate
      try {
        // Try to parse the date from database
        if (itemToEdit.tanggal_transaksi) {
          // Handle different date formats
          formattedDate = itemToEdit.tanggal_transaksi.includes('T')
            ? itemToEdit.tanggal_transaksi.split('T')[0] // ISO format
            : new Date(itemToEdit.tanggal_transaksi).toISOString().split('T')[0] // Other formats
        } else {
          formattedDate = new Date().toISOString().split('T')[0]
        }
      } catch (error) {
        console.error('❌ Error formatting date:', error)
        formattedDate = new Date().toISOString().split('T')[0] // Fallback to today
      }

      console.log('📊 Original data from DB:', itemToEdit)
      console.log('📅 Original date value:', itemToEdit.tanggal_transaksi)
      console.log('📅 Formatted date for form:', formattedDate)

      // Update form data with all fields from database - format currency fields
      setFormData({
        id: itemToEdit.id,
        petugas_id: itemToEdit.petugas_id,
        platform_id: itemToEdit.platform_id,
        platform_name: itemToEdit.platform_name,
        saldo_platform: itemToEdit.saldo_platform.toString(),
        nominal_transaksi: formatRupiah(itemToEdit.nominal_transaksi),
        jenis_transaksi: itemToEdit.jenis_transaksi || 'Ambil Hutang', // Default to Ambil Hutang if not set
        biaya_admin: formatRupiah(itemToEdit.biaya_admin || 0),
        tanggal_transaksi: formattedDate,
        keterangan: itemToEdit.keterangan || ''
      })

      console.log('🔄 Setting form data for editing:', {
        id: itemToEdit.id,
        platform_id: itemToEdit.platform_id,
        tanggal_transaksi: formattedDate
      })

      // Find matching saldo_awal item if exists
      const matchingSaldoAwal = saldoAwalOptions.find((item) => item.id === itemToEdit.platform_id)
      setSelectedPlatform(matchingSaldoAwal || null)

      setModalOpen(true)
    }
  }

  // Handle delete ambil saldo
  const handleDelete = (id) => {
    // Check if user is admin first
    if (!loggedInUser || loggedInUser.role !== 'admin') {
      setAlertMessage('Maaf, hanya admin yang dapat menghapus data hutang.')
      setShowAlertDialog(true)
      return
    }

    setDeleteId(id)
    setShowConfirmDialog(true)
  }

  const confirmDelete = async () => {
    try {
      await window.api.deleteHutang(deleteId)
      await fetchAmbilSaldo()
      console.log('✅ Data hutang berhasil dihapus')
    } catch (error) {
      console.error('❌ Gagal menghapus data hutang:', error)
    } finally {
      setShowConfirmDialog(false)
      setDeleteId(null)
    }
  }

  // Process data for display - don't add the index field
  const filteredData = ambilSaldo
    .filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(filterText.toLowerCase())
      )
    )
    .map((item) => {
      // Look up the user's name from the users array
      let petugasName = 'ID: ' + item.petugas_id

      // Find the user in the users array
      const user = users.find((user) => user.id === item.petugas_id)
      if (user) {
        petugasName = user.nama || user.username || petugasName
      }
      // If it's the current user, we could use the data from loggedInUser as a fallback
      else if (loggedInUser && loggedInUser.id === item.petugas_id) {
        petugasName = loggedInUser.nama || loggedInUser.username || petugasName
      }

      return {
        ...item,
        // Replace ID with name for display but keep ID for backend
        petugas_id: petugasName,
        saldo_platform: formatRupiah(item.saldo_platform),
        nominal_transaksi: formatRupiah(item.nominal_transaksi),
        biaya_admin: formatRupiah(item.biaya_admin),
        // Add display field for jenis_transaksi if it exists, otherwise default to "Ambil Hutang"
        jenis_transaksi: item.jenis_transaksi || 'Ambil Hutang'
      }
    })

  // Handler for currency input change
  const handleCurrencyInputChange = (e, field) => {
    const value = e.target.value
    const numericValue = extractNumeric(value)

    setFormData({
      ...formData,
      [field]: formatRupiah(numericValue)
    })
  }

  const handleSubmitEdit = async () => {
    try {
      // Ensure the date is in the correct format
      let formattedDate
      try {
        // Make sure we have a valid date string
        formattedDate = formData.tanggal_transaksi
          ? new Date(formData.tanggal_transaksi).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      } catch (error) {
        console.error('❌ Error formatting date for submission:', error)
        formattedDate = new Date().toISOString().split('T')[0]
      }

      console.log('📅 Date before submission:', formData.tanggal_transaksi)
      console.log('📅 Formatted date for submission:', formattedDate)

      // Extract numeric values from formatted currency strings
      const numericNominalTransaksi = extractNumeric(formData.nominal_transaksi)

      // Ensure all data is properly formatted
      const updatedEntry = {
        id: formData.id,
        petugas_id: parseInt(formData.petugas_id) || 1,
        platform_id: formData.platform_id,
        saldo_platform: parseFloat(formData.saldo_platform) || 0,
        nominal_transaksi: parseFloat(numericNominalTransaksi) || 0,
        jenis_transaksi: formData.jenis_transaksi, // Add jenis_transaksi field
        biaya_admin: parseFloat(extractNumeric(formData.biaya_admin) || 0), // Parse biaya_admin properly
        tanggal_transaksi: formattedDate, // Use the properly formatted date
        keterangan: formData.keterangan
      }

      console.log('📝 Submitting updated data:', updatedEntry)

      await window.api.updateHutang(updatedEntry)

      // Refresh both ambil saldo and saldo awal data
      await Promise.all([fetchAmbilSaldo(), fetchSaldoAwal()])

      setModalOpen(false)
      console.log('✅ Data hutang berhasil diupdate')
    } catch (error) {
      console.error('❌ Gagal update data hutang:', error)
    }
  }

  return (
    <>
      <div className="flex w-full gap-4 items-center mb-6">
        <div className="flex w-full gap-4 items-center p-4">
          <div className="flex items-center">
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Kelola Hutang
            </h1>
          </div>
          {/* <div className="flex-1 max-w-xs">
            <Dropdown
              className="w-full"
              color={'gray'}
              label="Pilih Toko"
              items={stores.map((store) => store.nama_toko)}
              onSelect={(index) => setSelectedStore(stores[index])}
            />
          </div> */}
        </div>
      </div>

      <div>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <p>Loading...</p>
          </div>
        ) : (
          <TableContent
            title={'Hutang'}
            columns={columns}
            data={filteredData}
            onAdd={<FormLayout onSubmit={handleAddAmbilSaldo} buttonText="Transaksi Hutang" />}
            onEdit={handleEdit}
            onDelete={handleDelete}
            btnSize={'xs'}
            currentPage={1}
            totalPages={1}
            rowsPerPage={10}
            className={isDark ? 'dark' : ''}
          />
        )}
      </div>

      {/* Edit Modal */}
      <ModalEdit
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitEdit}
        title="Edit Data Hutang"
      >
        {/* Display the original user's name in edit mode */}
        <div className="col-span-2 mb-4">
          <label
            className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Petugas
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
              const user = users.find((user) => user.id === formData.petugas_id)
              if (user) {
                return user.nama || user.username || 'ID: ' + user.id
              }
              // Fallback to logged in user if it's the same ID
              else if (loggedInUser && loggedInUser.id === formData.petugas_id) {
                return loggedInUser.nama || loggedInUser.username || 'ID: ' + loggedInUser.id
              }
              // Last resort, just show the ID
              return 'ID: ' + formData.petugas_id
            })()}
          </div>
          {/* Keep the original ID for submission */}
          <input type="hidden" name="petugas_id" value={formData.petugas_id} />
        </div>

        {/* Platform display */}
        <div className="col-span-2 mb-4">
          <label
            className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Platform/Sumber Dana
          </label>
          <div
            className={`p-2 ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-gray-300'
                : 'bg-gray-100 border-gray-300 text-gray-700'
            } border rounded-md`}
          >
            {formData.platform_name}
          </div>
          {/* Keep the original platform ID for submission */}
          <input type="hidden" name="platform_id" value={formData.platform_id} />
        </div>

        {/* Show current balance */}
        <div className="col-span-2 mb-4">
          <label
            className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Saldo Platform Saat Ini
          </label>
          <div
            className={`p-2 ${
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'
            } border rounded-md ${
              parseFloat(formData.saldo_platform) === 0
                ? 'text-red-500'
                : isDark
                  ? 'text-gray-300'
                  : 'text-gray-700'
            }`}
          >
            {formatRupiah(formData.saldo_platform)}
          </div>
        </div>

        {/* Transaction Type Radio Buttons */}
        <div className="col-span-2 mb-4">
          <label
            className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Jenis Transaksi
          </label>
          <div className="flex gap-4">
            <label
              className={`inline-flex items-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            >
              <input
                type="radio"
                name="jenis_transaksi"
                value="Ambil Hutang"
                checked={formData.jenis_transaksi === 'Ambil Hutang'}
                onChange={(e) => setFormData({ ...formData, jenis_transaksi: e.target.value })}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2">Ambil Hutang</span>
            </label>
            <label
              className={`inline-flex items-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            >
              <input
                type="radio"
                name="jenis_transaksi"
                value="Bayar Hutang"
                checked={formData.jenis_transaksi === 'Bayar Hutang'}
                onChange={(e) => setFormData({ ...formData, jenis_transaksi: e.target.value })}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2">Bayar Hutang</span>
            </label>
          </div>
        </div>

        <InputField
          name="nominal_transaksi"
          type="text"
          value={formData.nominal_transaksi || ''}
          onChange={(e) => handleCurrencyInputChange(e, 'nominal_transaksi')}
          placeholder="Rp 0"
        >
          Nominal Transaksi
        </InputField>

        <InputField
          name="biaya_admin"
          type="text"
          value={formData.biaya_admin || ''}
          onChange={(e) => handleCurrencyInputChange(e, 'biaya_admin')}
          placeholder="Rp 0"
          required={false}
        >
          Biaya Admin
        </InputField>

        <InputField
          name="tanggal_transaksi"
          type="date"
          value={formData.tanggal_transaksi || new Date().toISOString().split('T')[0]}
          onChange={(e) => {
            console.log('📅 Date selected in form:', e.target.value)
            setFormData({ ...formData, tanggal_transaksi: e.target.value })
          }}
        >
          Tanggal Transaksi
        </InputField>

        <InputField
          name="keterangan"
          className="col-span-2"
          value={formData.keterangan || ''}
          onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
          placeholder="Tambahan informasi transaksi hutang"
          required={false}
        >
          Keterangan
        </InputField>
      </ModalEdit>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmDelete}
        title="Konfirmasi Hapus"
        message="Apakah Anda yakin ingin menghapus data hutang ini? Saldo platform akan disesuaikan."
      />

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={showAlertDialog}
        onClose={() => setShowAlertDialog(false)}
        title="Perhatian"
        message={alertMessage}
      />
    </>
  )
}

export default HalamanHutang
