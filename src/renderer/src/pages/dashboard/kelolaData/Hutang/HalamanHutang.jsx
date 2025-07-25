import React, { use, useEffect, useState } from 'react'

import AlertDialog from '../../../../components/AlertDialog'
import ConfirmDialog from '../../../../components/ConfirmDialog'
import FormLayout from './FormLayout'
import { HiSearch } from 'react-icons/hi'
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
function HalamanHutang() {
  const { isDark } = useTheme()
  const [hutang, setHutang] = useState([])
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
  const [confirmMessage, setConfirmMessage] = useState('')

  const [userRole, setUserRole] = useState(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'))
    return storedUser?.role ? storedUser.role.toLowerCase() : 'kasir'
  })

  const getTodayWIB = () => {
    return dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD')
  }
  const [formData, setFormData] = useState({
    id: null,
    petugas_id: 1,
    platform_id: '',
    platform_name: '',
    saldo_platform: '',
    nominal_transaksi: '',
    jenis_transaksi: 'Ambil Hutang',
    biaya_admin: '0',
    tanggal_transaksi: getTodayWIB(), // Default to today's date in WIB
    keterangan: ''
  })

  const columns = [
    { key: 'tanggal', label: 'Tanggal' },
    { key: 'petugas_id', label: 'Petugas' },
    { key: 'platform_name', label: 'Platform' },
    { key: 'saldo_platform', label: 'Saldo Platform' },
    { key: 'jenis_transaksi', label: 'Jenis Transaksi' },
    { key: 'nominal_transaksi', label: 'Nominal Transaksi' },
    { key: 'biaya_admin', label: 'Biaya Admin' },
    { key: 'keterangan', label: 'Keterangan' }
  ]

  const formatRupiah = (value) => {
    if (!value && value !== 0) return ''
    const numeric = String(value).replace(/[^0-9]/g, '')
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(numeric)
  }

  const extractNumeric = (formattedValue) => {
    if (!formattedValue) return ''
    return formattedValue.toString().replace(/[^0-9]/g, '')
  }

  const fetchHutang = async () => {
    try {
      const result = await window.api.getHutang(userRole)
      setHutang(result)
    } catch (error) {
      console.error('❌ Gagal ambil data hutang:', error)
    }
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
      setUsers(result)
    } catch (error) {
      console.error('❌ Gagal ambil data users:', error)
    }
  }

  useEffect(() => {
    fetchHutang()
    fetchSaldoAwal()
    fetchUsers()
    const userString = localStorage.getItem('user')
    if (userString) {
      setLoggedInUser(JSON.parse(userString))
    }
  }, [])

  const handleAddhutang = async (formData) => {
    try {
      await window.api.createHutang(formData)
      await Promise.all([fetchHutang(), fetchSaldoAwal()])
    } catch (error) {
      console.error('❌ Gagal menambahkan data hutang:', error)
    }
  }

  const handleEdit = (id) => {
    console.log('🟡 handleEdit dipanggil dengan id:', id)
    const itemToEdit = hutang.find((item) => item.id === id)
    if (!itemToEdit) return

    const today = getTodayWIB() // Get today's date in WIB format
    const tanggalTransaksi = dayjs(itemToEdit.tanggal_transaksi)
      .tz('Asia/Jakarta')
      .format('YYYY-MM-DD')

    // Role kasir hanya bisa edit transaksi hari ini
    if (userRole.toLowerCase() === 'kasir' && tanggalTransaksi !== today) {
      setAlertMessage(
        'Kasir hanya bisa mengedit transaksi hutang hari ini. Hubungi admin untuk mengubah data lama.'
      )
      setShowAlertDialog(true)
      return
    }

    // Format tanggal untuk input
    let formattedDate
    try {
      formattedDate = itemToEdit.tanggal_transaksi.includes('T')
        ? itemToEdit.tanggal_transaksi.split('T')[0]
        : dayjs(itemToEdit.tanggal_transaksi).tz('Asia/Jakarta').format('YYYY-MM-DD')
    } catch {
      formattedDate = today
    }

    setFormData({
      id: itemToEdit.id,
      petugas_id: itemToEdit.petugas_id,
      platform_id: itemToEdit.platform_id,
      platform_name: itemToEdit.platform_name,
      saldo_platform: itemToEdit.saldo_platform.toString(),
      nominal_transaksi: formatRupiah(itemToEdit.nominal_transaksi),
      jenis_transaksi: itemToEdit.jenis_transaksi || 'Ambil Hutang',
      biaya_admin: formatRupiah(itemToEdit.biaya_admin || 0),
      tanggal_transaksi: formattedDate,
      keterangan: itemToEdit.keterangan || ''
    })

    const match = saldoAwalOptions.find((item) => item.id === itemToEdit.platform_id)
    setSelectedPlatform(match || null)
    setModalOpen(true)
  }

  const handleDelete = (id) => {
    if (!loggedInUser || loggedInUser.role !== 'admin') {
      setAlertMessage('Maaf, hanya admin yang dapat menghapus data hutang.')
      setShowAlertDialog(true)
      return
    }

    setDeleteId(id)
    setConfirmMessage('Apakah Anda yakin ingin menghapus transaksi hutang ini?') // ✅ ini penting
    setShowConfirmDialog(true)
  }

  const confirmDelete = async () => {
    try {
      await window.api.deleteHutang(deleteId)
      await fetchHutang()
    } catch (error) {
      console.error('❌ Gagal menghapus data hutang:', error)
    } finally {
      setShowConfirmDialog(false)
      setDeleteId(null)
    }
  }

  const filteredData = hutang
    .filter((item) =>
      Object.values(item).some((val) =>
        String(val || '') 
          .toLowerCase()
          .includes(filterText.toLowerCase())
      )
    )
    .map((item) => {
      let petugasName = 'ID: ' + item.petugas_id
      const user = users.find((user) => user.id === item.petugas_id)
      if (user) petugasName = user.nama || user.username || petugasName
      else if (loggedInUser && loggedInUser.id === item.petugas_id) {
        petugasName = loggedInUser.nama || loggedInUser.username || petugasName
      }

      return {
        ...item,
        tanggal: dayjs(item.tanggal_transaksi).tz('Asia/Jakarta').format('YYYY-MM-DD'),
        petugas_id: petugasName,
        saldo_platform: formatRupiah(item.saldo_platform),
        nominal_transaksi: formatRupiah(item.nominal_transaksi),
        biaya_admin: formatRupiah(item.biaya_admin),
        jenis_transaksi: item.jenis_transaksi || 'Ambil Hutang'
      }
    })
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
      const formattedDate = dayjs(formData.tanggal_transaksi).format('YYYY-MM-DD')

      const updatedEntry = {
        id: formData.id,
        petugas_id: parseInt(formData.petugas_id) || 1,
        platform_id: formData.platform_id,
        saldo_platform: parseFloat(formData.saldo_platform) || 0,
        nominal_transaksi: parseFloat(extractNumeric(formData.nominal_transaksi)) || 0,
        jenis_transaksi: formData.jenis_transaksi,
        biaya_admin: parseFloat(extractNumeric(formData.biaya_admin) || 0),
        tanggal_transaksi: formattedDate,
        keterangan: formData.keterangan,
        role: userRole
      }

      await window.api.updateHutang(updatedEntry)
      await Promise.all([fetchHutang(), fetchSaldoAwal()])
      setModalOpen(false)
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
            userRole={userRole}
            columns={columns}
            showDateFilter={true}
            data={filteredData}
            onAdd={<FormLayout onSubmit={handleAddhutang} buttonText="Transaksi Hutang" />}
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
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmDelete}
        title="Konfirmasi Hapus"
        message={confirmMessage}
      />
      <ModalEdit isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmitEdit}>
        {/* Petugas */}
        <div className="col-span-2 mb-4">
          <label
            className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Petugas
          </label>
          <div
            className={`p-2 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-700'} border rounded-md`}
          >
            {loggedInUser ? loggedInUser.nama || `User ID: ${loggedInUser.id}` : 'Loading...'}
          </div>
        </div>
        <InputField
          name="tanggal_transaksi"
          type="date"
          value={formData.tanggal_transaksi}
          onChange={(e) => setFormData({ ...formData, tanggal_transaksi: e.target.value })}
        >
          Tanggal Transaksi
        </InputField>
        {/* Platform/Sumber Dana */}
        <div className="col-span-2 mb-4">
          <label
            className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Platform/Sumber Dana
          </label>
          <input
            type="text"
            value={formData.platform_name}
            disabled
            className={`w-full p-2 border rounded-md ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-gray-100 text-gray-800'}`}
          />
        </div>

        {/* Saldo Platform */}
        <div className="col-span-2 mb-4">
          <label
            className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Saldo Platform Saat Ini
          </label>
          <div
            className={`p-2 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-700'} border rounded-md`}
          >
            {formatRupiah(formData.saldo_platform)}
          </div>
        </div>

        {/* Jenis Transaksi */}
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
          value={formData.nominal_transaksi}
          onChange={(e) => handleCurrencyInputChange(e, 'nominal_transaksi')}
          placeholder="Rp 0"
        >
          Nominal Transaksi
        </InputField>

        <InputField
          name="biaya_admin"
          type="text"
          value={formData.biaya_admin}
          onChange={(e) => handleCurrencyInputChange(e, 'biaya_admin')}
          placeholder="Rp 0"
          required={false}
        >
          Biaya Admin
        </InputField>

        <InputField
          name="keterangan"
          type="text"
          className="col-span-2"
          value={formData.keterangan}
          onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
          placeholder="Tambahan informasi transaksi hutang"
          required={false}
        >
          Keterangan
        </InputField>
      </ModalEdit>
    </>
  )
}

export default HalamanHutang
