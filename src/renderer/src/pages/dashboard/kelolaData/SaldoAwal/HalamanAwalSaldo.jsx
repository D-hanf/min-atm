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
    dateCreated: '',
    dateUpdated: '',
    description: ''
  })
  const [filterText, setFilterText] = useState('')
   const sumberDanaOptions = [
    { value: 'DANA', label: 'DANA' },
    { value: 'CASH', label: 'Cash' },
    { value: 'BTN', label: 'Bank BTN' }
  ]

  const columns = [
    { key: 'nama_sumber_dana', label: 'Sumber' },
    { key: 'saldo', label: 'Saldo' },
    { key: 'tanggal_buat', label: 'Tanggal Dibuat' },
    { key: 'tanggal_update', label: 'Tanggal Diubah' },
    { key: 'keterangan', label: 'Deskripsi' } // ← ini yang benar kalau backend kirim 'keterangan'
  ]

  const formatRupiah = (value) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)

  useEffect(() => {
    fetchSaldo()
  }, [])

  const fetchSaldo = async () => {
    try {
      const result = await window.api.getSaldoAwal()
      setSaldo(result)
    } catch (error) {
      console.error('❌ Gagal ambil data saldo:', error)
    }
  }

  const handleAddSaldo = async (formData) => {
    const cleanedSaldo = parseInt(formData.saldo.replace(/[^0-9]/g, ''), 10)
    const newSaldo = {
      nama_sumber_dana: formData.source,
      saldo: cleanedSaldo,
      tanggal_buat: new Date().toISOString().split('T')[0],
      tanggal_update: new Date().toISOString().split('T')[0],
      keterangan: formData.description,
      biaya_admin: 0 // kalau kolom ini NULL, bisa kasih default
    }

    try {
      await window.api.createSaldoAwal(newSaldo)
      fetchSaldo()
      console.log('data =>', newSaldo)
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
      setFormData(itemToEdit)
      setModalOpen(true)
    }
  }

  const handleSubmitEdit = async (updatedData) => {
    const updatedEntry = {
      id: updatedData.id,
      nama_sumber_dana: updatedData.source,
      saldo: parseInt(updatedData.saldo),
      tanggal_dibuat: updatedData.dateCreated,
      tanggal_diubah: new Date().toISOString().split('T')[0],
      deskripsi: updatedData.description
    }

    try {
      await window.api.updateSaldoAwal(updatedEntry)
      fetchSaldo()
      setModalOpen(false)
      setFormData({
        id: itemToEdit.id,
        source: itemToEdit.nama_sumber_dana,
        saldo: itemToEdit.saldo,
        dateCreated: itemToEdit.tanggal_dibuat,
        dateUpdated: itemToEdit.tanggal_diubah,
        description: itemToEdit.deskripsi
      })
    } catch (err) {
      console.error('Gagal update saldo:', err)
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
      saldo: formatRupiah(item.saldo)
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

      <ModalEdit isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmitEdit}>
        <SelectItems
          options={sumberDanaOptions}
          name="source"
          label="Sumber Dana"
          value={formData.source}
          onChange={(e) => setFormData({ ...formData, source: e.target.value })}
        />
        <InputField
          name="saldo"
          type="number"
          value={formData.saldo}
          onChange={(e) => setFormData({ ...formData, saldo: e.target.value })}
        >
          Jumlah Saldo
        </InputField>
        <InputField
          name="description"
          className="col-span-2"
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
