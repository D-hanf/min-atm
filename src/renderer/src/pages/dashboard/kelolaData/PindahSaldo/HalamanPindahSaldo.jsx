import React, { useState } from 'react'

import ButtonInput from '../../../../components/ButtonInput'
import ConfirmDialog from '../../../../components/ConfirmDialog'
import Dropdown from '../../../../components/Dropdown'
import FormLayout from './FormLayout'
import InputField from '../../../../components/InputField'
import ModalEdit from '../../../../shared/ui/Modal'
import SearchField from '../../../../components/SearchField'
import TableContent from '../../../../components/TableContent'

const HalamanPindahSaldo = () => {
  const [stores] = useState([
    {
      id: 123,
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

  // Updated state for saldo transfers
  const [transfers, setTransfers] = useState([
    {
      id: 1,
      user: 'Ahmad Rizki',
      platform: 'DANA',
      senderBalance: 'DANA Pusat',
      receiverBalance: 'DANA Cabang',
      amount: 500000,
      operational: 15000,
      description: 'Transfer dana operasional cabang',
      date: '2023-10-01'
    },
    {
      id: 2,
      user: 'Budi Santoso',
      platform: 'BRI',
      senderBalance: 'BRI Pusat',
      receiverBalance: 'CASH Pusat',
      amount: 1000000,
      operational: 10000,
      description: 'Penarikan kas untuk operasional',
      date: '2023-10-02'
    },
    {
      id: 3,
      user: 'Cindy Permata',
      platform: 'MANDIRI',
      senderBalance: 'MANDIRI Surabaya',
      receiverBalance: 'MANDIRI Jakarta',
      amount: 2500000,
      operational: 5000,
      description: 'Transfer antar cabang',
      date: '2023-10-03'
    }
  ])

  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    user: '',
    platform: '',
    senderBalance: '',
    receiverBalance: '',
    amount: '',
    operational: '',
    description: ''
  })
  const [filterText, setFilterText] = useState('')

  // Updated columns definition
  const columns = [
    { key: 'user', label: 'User Pemindah' },
    { key: 'platform', label: 'Platform' },
    { key: 'senderBalance', label: 'Saldo Pengirim' },
    { key: 'receiverBalance', label: 'Saldo Penerima' },
    { key: 'formattedAmount', label: 'Nominal' }, // Ubah key
    { key: 'formattedOperational', label: 'Operasional' }, // Ubah key
    { key: 'description', label: 'Keterangan' }
  ]

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  const handleAddTransfer = (formData) => {
    const cleanedAmount = parseInt(String(formData.amount).replace(/[^0-9]/g, ''), 10)

    const cleanedOperational = parseInt(String(formData.operational).replace(/[^0-9]/g, ''), 10)

    const newTransfer = {
      id: Date.now(),
      user: formData.user,
      platform: formData.platform,
      senderBalance: formData.senderBalance,
      receiverBalance: formData.receiverBalance,
      amount: cleanedAmount,
      operational: cleanedOperational,
      description: formData.description,
      date: new Date().toISOString().split('T')[0]
    }

    setTransfers([...transfers, newTransfer])
  }

  const handleDelete = (id) => {
    setDeleteId(id)
    setShowConfirmDialog(true)
  }

  const confirmDelete = () => {
    setTransfers((prev) => prev.filter((item) => item.id !== deleteId))
    setShowConfirmDialog(false)
    setDeleteId(null)
  }

  const handleEdit = (id) => {
    const itemToEdit = transfers.find((item) => item.id === id)
    if (itemToEdit) {
      setFormData({
        id: itemToEdit.id,
        user: itemToEdit.user,
        platform: itemToEdit.platform,
        senderBalance: itemToEdit.senderBalance,
        receiverBalance: itemToEdit.receiverBalance,
        amount: String(itemToEdit.amount), // ← ubah ke string angka biasa
        operational: String(itemToEdit.operational), // ← ini juga
        description: itemToEdit.description
      })
      setModalOpen(true)
    }
  }

  const filteredData = transfers
    .filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(filterText.toLowerCase())
      )
    )
    .map((item, index) => ({
      ...item,
      no: index + 1,
      formattedAmount: formatRupiah(item.amount),
      formattedOperational: formatRupiah(item.operational)
    }))

  const formatInputRupiah = (value) => {
    const cleaned = value.replace(/[^0-9]/g, '')
    const number = parseInt(cleaned, 10)
    if (isNaN(number)) return ''
    return 'Rp' + number.toLocaleString('id-ID')
  }

  return (
    <>
      <div className="flex w-full gap-4 items-center mb-6">
        <div className="flex w-full gap-4 items-center p-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-800 ">Pindah Saldo</h1>
          </div>
          <div className="flex-1 max-w-xs">
            <Dropdown
              className="w-full"
              color={'gray'}
              label="Pilih Toko"
              items={stores.map((store) => store.name)}
            />
          </div>
        </div>
      </div>
      <div>
        <TableContent
          searchValue={filterText}
          onSearchChange={setFilterText}
          btnSize={'xs'}
          data={filteredData}
          title={'Pindah Saldo'}
          columns={columns}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onAdd={
            <FormLayout
              onSubmit={handleAddTransfer}
              buttonText="Tambah Pemindahan Saldo"
            ></FormLayout>
          }
        />
      </div>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmDelete}
        title="Konfirmasi Hapus"
        message="Apakah Anda yakin ingin menghapus data pemindahan saldo ini?"
      />

      <ModalEdit
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(updatedData) => {
          const cleanedAmount = parseInt(String(updatedData.amount).replace(/[^0-9]/g, ''), 10)

          const cleanedOperational = parseInt(
            String(updatedData.operational).replace(/[^0-9]/g, ''),
            10
          )

          const updatedTransfer = {
            ...updatedData,
            amount: cleanedAmount,
            operational: cleanedOperational,
            date: new Date().toISOString().split('T')[0]
          }

          setTransfers((prev) =>
            prev.map((item) => (item.id === updatedTransfer.id ? updatedTransfer : item))
          )
          setModalOpen(false)
        }}
      >
        <InputField
          name="user"
          value={formData.user || ''}
          onChange={(e) => setFormData({ ...formData, user: e.target.value })}
        >
          User Pemindah
        </InputField>
        <InputField
          name="platform"
          value={formData.platform || ''}
          onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
        >
          Platform
        </InputField>
        <InputField
          name="senderBalance"
          value={formData.senderBalance || ''}
          onChange={(e) => setFormData({ ...formData, senderBalance: e.target.value })}
        >
          Saldo Pengirim
        </InputField>
        <InputField
          name="receiverBalance"
          value={formData.receiverBalance || ''}
          onChange={(e) => setFormData({ ...formData, receiverBalance: e.target.value })}
        >
          Saldo Penerima
        </InputField>
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
    </>
  )
}

export default HalamanPindahSaldo
