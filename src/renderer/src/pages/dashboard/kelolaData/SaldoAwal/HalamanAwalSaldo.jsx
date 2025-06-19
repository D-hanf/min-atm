import React, { useState } from 'react'

import ButtonInput from '../../../../components/ButtonInput'
import ConfirmDialog from '../../../../components/ConfirmDialog'
import Dropdown from '../../../../components/Dropdown'
import FormLayout from './FormLayout'
import InputField from '../../../../components/InputField'
import ModalEdit from '../../../../shared/ui/Modal'
import SearchField from '../../../../components/SearchField'
import SelectItems from '../../../../components/SelectItems'
import TableContent from '../../../../components/TableContent'
import { useEffect } from 'react'

const HalamanAwalSaldo = () => {
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

  const [saldo, setSaldo] = useState([])
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    id: null,
    source: '',
    saldo: '',
    biaya_admin: '',
    dateCreated: '',
    dateUpdated: '',
    description: ''
  })
  const [filterText, setFilterText] = useState('')

  const columns = [
    { key: 'nama_sumber_dana', label: 'Sumber' },
    { key: 'saldo', label: 'Saldo' },
    { key: 'biaya_admin', label: 'Biaya Admin' },
    { key: 'tanggal_buat', label: 'Tanggal Dibuat' },
    { key: 'tanggal_update', label: 'Tanggal Diubah' },
    { key: 'keterangan', label: 'Deskripsi' }
  ]

  const formatRupiah = (value) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)

  const fetchSaldo = async () => {
    try {
      const result = await window.api.getSaldoAwal()
      setSaldo(result)
    } catch (error) {
      console.error('❌ Gagal ambil data saldo:', error)
    }
  }

  useEffect(() => {
    fetchSaldo()
  }, [])

  const handleAddSaldo = async (formData) => {
    const cleanedSaldo = parseFloat(formData.saldo.replace(/[^0-9]/g, ''), 10)
    const newSaldo = {
      nama_sumber_dana: formData.source,
      saldo: cleanedSaldo,
      tanggal_buat: new Date().toISOString().split('T')[0],
      tanggal_update: new Date().toISOString().split('T')[0],
      keterangan: formData.description,
      biaya_admin: parseFloat(formData.biaya_admin) ? parseFloat(formData.biaya_admin) : 0
    }

    try {
      await window.api.createSaldoAwal(newSaldo)
      fetchSaldo()
    } catch (err) {
      console.error('Gagal tambah saldo:', err)
    }
  }

  const handleDelete = (id) => {
    setDeleteId(id)
    setShowConfirmDialog(true)
  }

  const confirmDelete = async () => {
    try {
      await window.api.deleteSaldoAwal(deleteId)
      fetchSaldo()
    } catch (err) {
      console.error('Gagal hapus saldo:', err)
    } finally {
      setShowConfirmDialog(false)
      setDeleteId(null)
    }
  }

  const handleEdit = (id) => {
    const itemToEdit = saldo.find((item) => item.id === id)
    if (itemToEdit) {
      setFormData({
        id: itemToEdit.id,
        source: itemToEdit.nama_sumber_dana,
        saldo: formatRupiah(itemToEdit.saldo || 0), // Format as Rupiah
        biaya_admin: formatRupiah(itemToEdit.biaya_admin || 0), // Format as Rupiah
        description: itemToEdit.keterangan,
        dateCreated: itemToEdit.tanggal_buat,
        dateUpdated: itemToEdit.tanggal_update
      })
      setModalOpen(true)
    }
  }

  const handleSubmitEdit = async (updatedData) => {
    // Clean biaya_admin and saldo by removing non-numeric characters
    const cleanedBiayaAdmin = updatedData.biaya_admin
      ? parseInt(updatedData.biaya_admin.replace(/[^0-9]/g, ''))
      : 0

    const cleanedSaldo = updatedData.saldo ? parseInt(updatedData.saldo.replace(/[^0-9]/g, '')) : 0

    const updatedEntry = {
      id: updatedData.id,
      nama_sumber_dana: updatedData.source,
      saldo: cleanedSaldo,
      biaya_admin: cleanedBiayaAdmin,
      tanggal_buat: updatedData.dateCreated,
      tanggal_update: new Date().toISOString().split('T')[0],
      keterangan: updatedData.description
    }

    try {
      await window.api.updateSaldoAwal(updatedEntry)
      await fetchSaldo()
      setModalOpen(false)
    } catch (err) {
      console.error('Gagal update saldo:', err)
    }
  }

  // Generalized function to handle numeric inputs with Rupiah formatting
  const handleRupiahInput = (e) => {
    const { name, value } = e.target

    // Remove non-numeric characters for processing
    const numericValue = value.replace(/[^0-9]/g, '')

    if (numericValue === '') {
      setFormData((prev) => ({
        ...prev,
        [name]: ''
      }))
    } else {
      // Format as Rupiah for display
      const formattedValue = formatRupiah(numericValue)
      setFormData((prev) => ({
        ...prev,
        [name]: formattedValue
      }))
    }
  }

  const filteredData = saldo
    .filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(filterText.toLowerCase())
      )
    )
    .map((item) => ({
      ...item,
      saldo: formatRupiah(item.saldo),
      biaya_admin: formatRupiah(item.biaya_admin)
    }))

  return (
    <>
      <div className="flex w-full gap-4 items-center mb-6">
        <div className="flex w-full gap-4 items-center p-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-800 ">Saldo Awal</h1>
          </div>
          <div className="flex-1 max-w-xs">
            <Dropdown
              className="w-full"
              color={'gray'}
              label="Pindah Toko"
              items={stores.map((store) => store.name)}
            />
          </div>
        </div>
      </div>

      <div>
        <TableContent
          searchValue={filterText}
          onSearchChange={setFilterText}
          data={filteredData}
          btnSize={'xs'}
          title="Data Saldo Awal"
          columns={columns}
          onAdd={<FormLayout onSubmit={handleAddSaldo} />}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      </div>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmDelete}
      />

      <ModalEdit
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={() => handleSubmitEdit(formData)}
      >
        <InputField
          name="source"
          value={formData.source}
          onChange={(e) => setFormData({ ...formData, source: e.target.value })}
        >
          Sumber Dana
        </InputField>
        <InputField
          name="saldo"
          type="text" // Changed from number to text
          value={formData.saldo}
          onChange={handleRupiahInput}
          required
        >
          Jumlah Saldo
        </InputField>
        <InputField
          name="biaya_admin"
          type="text"
          value={formData.biaya_admin}
          onChange={handleRupiahInput}
        >
          Biaya Admin
        </InputField>
        <InputField
          name="description"
          className="col-span-2"
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        >
          Keterangan
        </InputField>
      </ModalEdit>
    </>
  )
}
export default HalamanAwalSaldo
