import React, { useState } from 'react'

import ButtonInput from '../../../../components/ButtonInput'
import ConfirmDialog from '../../../../components/ConfirmDialog'
import Dropdown from '../../../../components/Dropdown'
import FormLayout from './FormLayout'
import InputField from '../../../../components/InputField'
import ModalEdit from '../../../../shared/ui/Modal'
import SearchField from '../../../../components/SearchField'
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
  const [saldo, setSaldo] = useState([
    {
      id: 1,
      source: 'DANA',
      saldo: 1000000,
      dateCreated: '2023-10-01',
      dateUpdated: '2023-10-01',
      description: 'Saldo di Dana'
    },
    {
      id: 2,
      source: 'CASH',
      saldo: 5000000,
      dateCreated: '2023-10-02',
      dateUpdated: '2023-10-02',
      description: 'Saldo awal yang tersedia di kasir'
    },
    {
      id: 3,
      source: 'BTN',
      saldo: 7500000,
      dateCreated: '2023-10-03',
      dateUpdated: '2023-10-03',
      description: 'Saldo awal di Bank BTN'
    }
  ])
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    source: '',
    saldo: '',
    dateCreated: '',
    dateUpdated: '',
    description: ''
  })
  const [filterText, setFilterText] = useState('')

  const columns = [
    { key: 'source', label: 'Sumber' },
    { key: 'saldo', label: 'Saldo' },
    { key: 'dateCreated', label: 'Tanggal Dibuat' },
    { key: 'dateUpdated', label: 'Tanggal Diubah' },
    { key: 'description', label: 'Deskripsi' }
  ]

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  const formattedSaldo = saldo.map((item) => ({
    ...item,
    saldo: formatRupiah(item.saldo)
  }))

  // const handleAddSaldo = (formData) => {
  //   const cleanedSaldo = parseInt(
  //     formData.saldo.replace(/[^0-9]/g, ''), // hapus semua selain angka
  //     10
  //   )

  //   const newSaldo = {
  //     id: Date.now(),
  //     source: formData.source,
  //     saldo: cleanedSaldo,
  //     dateCreated: new Date().toISOString().split('T')[0],
  //     description: formData.description
  //   }

  //   setSaldo([...saldo, newSaldo])
  // }

  const handleDelete = (id) => {
    setDeleteId(id)
    setShowConfirmDialog(true)
  }

  const confirmDelete = () => {
    setSaldo((prev) => prev.filter((item) => item.id !== deleteId))
    setShowConfirmDialog(false)
    setDeleteId(null)
  }

  const handleEdit = (id) => {
    const itemToEdit = saldo.find((item) => item.id === id)
    if (itemToEdit) {
      setFormData(itemToEdit)
      setModalOpen(true)
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
      saldo: new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(item.saldo)
    }))

  // pake db

  useEffect(() => {
    const fetchSaldo = async () => {
      try {
        const result = await window.api.getSaldoAwal()
        setSaldo(result)
      } catch (error) {
        console.error('❌ Gagal ambil data saldo:', error)
      }
    }

    fetchSaldo()
  }, [])

  const handleAddSaldo = async (formData) => {
    const cleanedSaldo = parseInt(formData.saldo.replace(/[^0-9]/g, ''), 10)

    const newSaldo = {
      source: formData.source,
      saldo: cleanedSaldo,
      dateCreated: new Date().toISOString().split('T')[0],
      dateUpdated: new Date().toISOString().split('T')[0],
      description: formData.description
    }

    try {
      await window.api.createSaldoAwal(newSaldo)
      const updated = await window.api.getSaldo()
      setSaldo(updated)
    } catch (err) {
      console.error('Gagal tambah saldo:', err)
    }
  }

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
          onAdd={<FormLayout onSubmit={handleAddSaldo}></FormLayout>}
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
        onSubmit={(updatedData) => {
          const updatedEntry = {
            ...updatedData,
            dateUpdated: new Date().toISOString().split('T')[0] // set ke hari ini
          }

          setSaldo((prevData) =>
            prevData.map((item) => (item.id === formData.id ? { ...item, ...updatedEntry } : item))
          )
          setModalOpen(false)
          setFormData({ source: '', saldo: '', dateCreated: '', dateUpdated: '', description: '' })
        }}
      >
        <InputField
          name="source"
          type="text"
          value={formData.source}
          onChange={(e) => setFormData({ ...formData, source: e.target.value })}
        >
          Sumber Dana
        </InputField>
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
          className={'col-span-2'}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        >
          Keterangan
        </InputField>
        <InputField
          name="dateUpdated"
          type="hidden"
          value={Date.now()}
          onChange={(e) => setFormData({ ...formData, dateCreated: Date.now() })}
          required={false}
        ></InputField>
      </ModalEdit>
    </>
  )
}
export default HalamanAwalSaldo
