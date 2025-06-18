import React, { useEffect, useState } from 'react'

import ButtonInput from '../../../../components/ButtonInput'
import ConfirmDialog from '../../../../components/ConfirmDialog'
import Dropdown from '../../../../components/Dropdown'
import FormLayout from './FormLayout'
import InputField from '../../../../components/InputField'
import ModalEdit from '../../../../shared/ui/Modal'
import SearchField from '../../../../components/SearchField'
import TableContent from '../../../../components/TableContent'

const HalamanAmbilSaldo = () => {
  const [stores] = useState([
    {
      id: 1,
      name: 'Toko Pusat',
      totalEmployees: 8,
      address: 'Jl. Raya Pusat No. 123',
      phone: '081234567890'
    },
    {
      id: 2,
      name: 'Cabang Malang',
      totalEmployees: 5,
      address: 'Jl. Soekarno Hatta No. 45, Malang',
      phone: '081234567891'
    },
    {
      id: 3,
      name: 'Cabang Surabaya',
      totalEmployees: 6,
      address: 'Jl. Pemuda No. 56, Surabaya',
      phone: '081234567892'
    },
    {
      id: 4,
      name: 'Cabang Jakarta',
      totalEmployees: 10,
      address: 'Jl. Sudirman No. 78, Jakarta',
      phone: '081234567893'
    }
  ])

  // Updated state for database
  const [ambilSaldo, setAmbilSaldo] = useState([])
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    id: null,
    petugas_pengambil_id: 1, // Default to first user for now
    platform: '',
    saldo_platform: '',
    nominal_pengambilan: '',
    biaya_admin: '',
    metode_pengambilan: '',
    tujuan_pengambilan: '',
    tanggal_pengambilan: new Date().toISOString().split('T')[0],
    keterangan: ''
  })
  const [filterText, setFilterText] = useState('')
  const [saldoAwalOptions, setSaldoAwalOptions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState(null)

  // Updated columns definition - remove the index/No column entirely
  const columns = [
    // Remove the index/No column since TableContent already adds one
    { key: 'petugas_pengambil_id', label: 'Petugas Pengambil' },
    { key: 'platform', label: 'Platform' },
    { key: 'saldo_platform', label: 'Saldo Platform' },
    { key: 'nominal_pengambilan', label: 'Nominal Pengambilan' },
    { key: 'biaya_admin', label: 'Biaya Admin' },
    { key: 'metode_pengambilan', label: 'Metode Pengambilan' },
    { key: 'tujuan_pengambilan', label: 'Tujuan Pengambilan' },
    { key: 'tanggal_pengambilan', label: 'Tanggal Pengambilan' },
    { key: 'keterangan', label: 'Keterangan' }
  ]

  // Format currency
  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  // Extract numeric value from formatted string
  const extractNumeric = (formattedValue) => {
    if (!formattedValue) return ''
    return formattedValue.toString().replace(/[^0-9]/g, '')
  }

  // Fetch saldo_awal data from database
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

  // Fetch ambil saldo data from database
  const fetchAmbilSaldo = async () => {
    try {
      const result = await window.api.getAmbilSaldo()
      setAmbilSaldo(result)
      console.log('✅ Data ambil saldo berhasil diambil:', result)
    } catch (error) {
      console.error('❌ Gagal ambil data ambil saldo:', error)
    }
  }

  useEffect(() => {
    fetchAmbilSaldo()
    fetchSaldoAwal() // Also fetch saldo_awal for dropdowns
  }, [])

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
        platform: selectedItem.nama_sumber_dana,
        saldo_platform: selectedItem.saldo.toString(),
        biaya_admin: selectedItem.biaya_admin.toString()
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
        tanggal_pengambilan: formData.withdrawalDate || new Date().toISOString().split('T')[0],
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
    const itemToEdit = ambilSaldo.find((item) => item.id === id)
    if (itemToEdit) {
      // Better date handling with fallback
      let formattedDate
      try {
        // Try to parse the date from database
        if (itemToEdit.tanggal_pengambilan) {
          // Handle different date formats
          formattedDate = itemToEdit.tanggal_pengambilan.includes('T')
            ? itemToEdit.tanggal_pengambilan.split('T')[0] // ISO format
            : new Date(itemToEdit.tanggal_pengambilan).toISOString().split('T')[0] // Other formats
        } else {
          formattedDate = new Date().toISOString().split('T')[0]
        }
      } catch (error) {
        console.error('❌ Error formatting date:', error)
        formattedDate = new Date().toISOString().split('T')[0] // Fallback to today
      }

      console.log('📊 Original data from DB:', itemToEdit)
      console.log('📅 Original date value:', itemToEdit.tanggal_pengambilan)
      console.log('📅 Formatted date for form:', formattedDate)

      // Update form data with all fields from database
      setFormData({
        id: itemToEdit.id,
        petugas_pengambil_id: itemToEdit.petugas_pengambil_id,
        platform: itemToEdit.platform,
        saldo_platform: itemToEdit.saldo_platform.toString(),
        nominal_pengambilan: itemToEdit.nominal_pengambilan.toString(),
        biaya_admin: itemToEdit.biaya_admin?.toString() || '0',
        metode_pengambilan: itemToEdit.metode_pengambilan || '',
        tujuan_pengambilan: itemToEdit.tujuan_pengambilan || '',
        tanggal_pengambilan: formattedDate,
        keterangan: itemToEdit.keterangan || ''
      })

      console.log('🔄 Setting form data for editing:', {
        id: itemToEdit.id,
        platform: itemToEdit.platform,
        tanggal_pengambilan: formattedDate
      })

      // Find matching saldo_awal item if exists
      const matchingSaldoAwal = saldoAwalOptions.find(
        (item) => item.nama_sumber_dana === itemToEdit.platform
      )
      setSelectedPlatform(matchingSaldoAwal || null)

      setModalOpen(true)
    }
  }

  const handleSubmitEdit = async () => {
    try {
      // Ensure the date is in the correct format
      let formattedDate
      try {
        // Make sure we have a valid date string
        formattedDate = formData.tanggal_pengambilan
          ? new Date(formData.tanggal_pengambilan).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      } catch (error) {
        console.error('❌ Error formatting date for submission:', error)
        formattedDate = new Date().toISOString().split('T')[0]
      }

      console.log('📅 Date before submission:', formData.tanggal_pengambilan)
      console.log('📅 Formatted date for submission:', formattedDate)

      // Ensure all data is properly formatted
      const updatedEntry = {
        id: formData.id,
        petugas_pengambil_id: parseInt(formData.petugas_pengambil_id) || 1,
        platform: formData.platform,
        saldo_platform: parseFloat(formData.saldo_platform) || 0,
        nominal_pengambilan: parseFloat(formData.nominal_pengambilan) || 0,
        biaya_admin: parseFloat(formData.biaya_admin) || 0,
        metode_pengambilan: formData.metode_pengambilan,
        tujuan_pengambilan: formData.tujuan_pengambilan,
        tanggal_pengambilan: formattedDate, // Use the properly formatted date
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
    .filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(filterText.toLowerCase())
      )
    )
    .map((item) => ({
      ...item,
      // Remove the index field
      saldo_platform: formatRupiah(item.saldo_platform),
      nominal_pengambilan: formatRupiah(item.nominal_pengambilan),
      biaya_admin: formatRupiah(item.biaya_admin)
    }))

  return (
    <>
      <div className="flex w-full gap-4 items-center mb-6">
        <div className="flex w-full gap-4 items-center p-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-800 ">Ambil Saldo </h1>
          </div>
          <div className="flex-1 max-w-xs">
            <Dropdown
              className="w-full"
              label="Pilih Toko"
              color={'gray'}
              items={stores.map((store) => store.name)}
            />
          </div>
        </div>
      </div>
      <div>
        <TableContent
          searchValue={filterText}
          onSearchChange={setFilterText}
          title="Data Pengambilan Saldo"
          btnSize={'xs'}
          onAdd={
            <FormLayout
              onSubmit={handleAddAmbilSaldo}
              buttonText="Tambah Pengambilan Saldo"
            ></FormLayout>
          }
          data={filteredData}
          columns={columns}
          onDelete={handleDelete}
          onEdit={handleEdit}
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
        <InputField
          name="petugas_pengambil_id"
          type="number"
          value={formData.petugas_pengambil_id || ''}
          onChange={(e) => setFormData({ ...formData, petugas_pengambil_id: e.target.value })}
        >
          ID Petugas Pengambil
        </InputField>

        {/* Platform dropdown */}
        <div className="col-span-2 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Platform/Sumber Dana
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Platform</label>
            <div className="p-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
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
          type="number"
          value={formData.nominal_pengambilan || ''}
          onChange={(e) => setFormData({ ...formData, nominal_pengambilan: e.target.value })}
        >
          Nominal Pengambilan
        </InputField>

        <InputField
          name="biaya_admin"
          type="number"
          value={formData.biaya_admin || ''}
          onChange={(e) => setFormData({ ...formData, biaya_admin: e.target.value })}
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
          name="tanggal_pengambilan"
          type="date"
          value={formData.tanggal_pengambilan || new Date().toISOString().split('T')[0]}
          onChange={(e) => {
            console.log('📅 Date selected in form:', e.target.value)
            setFormData({ ...formData, tanggal_pengambilan: e.target.value })
          }}
        >
          Tanggal Pengambilan
        </InputField>

        <InputField
          name="keterangan"
          value={formData.keterangan || ''}
          onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
        >
          Keterangan
        </InputField>
      </ModalEdit>
    </>
  )
}

export default HalamanAmbilSaldo
