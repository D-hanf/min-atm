import React, { useState } from 'react'

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

  // Updated state for balance withdrawals
  const [transfers, setTransfers] = useState([
    {
      id: 1,
      user: 'Ahmad Rizki',
      platform: 'DANA',
      currentBalance: 1500000,
      amount: 500000,
      fee: 15000,
      withdrawalMethod: 'Transfer Bank',
      withdrawalAccount: 'BCA - 1234567890',
      withdrawalDate: '2023-10-01',
      description: 'Pengambilan dana operasional'
    },
    {
      id: 2,
      user: 'Budi Santoso',
      platform: 'BRI',
      currentBalance: 3000000,
      amount: 1000000,
      fee: 10000,
      withdrawalMethod: 'Tunai',
      withdrawalAccount: 'Kas Toko',
      withdrawalDate: '2023-10-02',
      description: 'Penarikan kas untuk operasional'
    },
    {
      id: 3,
      user: 'Cindy Permata',
      platform: 'MANDIRI',
      currentBalance: 5000000,
      amount: 2500000,
      fee: 5000,
      withdrawalMethod: 'Transfer Bank',
      withdrawalAccount: 'Mandiri - 9876543210',
      withdrawalDate: '2023-10-03',
      description: 'Pengambilan dana bulanan'
    }
  ])

  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    user: '',
    platform: '',
    currentBalance: '',
    amount: '',
    fee: '',
    withdrawalMethod: '',
    withdrawalAccount: '',
    withdrawalDate: new Date().toISOString().split('T')[0],
    description: ''
  })
  const [filterText, setFilterText] = useState('')

  // Updated columns definition to match form fields
  const columns = [
    { key: 'no', label: 'No' },
    { key: 'user', label: 'Petugas Pengambil' },
    { key: 'platform', label: 'Platform' },
    { key: 'currentBalance', label: 'Saldo Platform' },
    { key: 'amount', label: 'Nominal Pengambilan' },
    { key: 'fee', label: 'Biaya Admin' },
    { key: 'withdrawalMethod', label: 'Metode Pengambilan' },
    { key: 'withdrawalAccount', label: 'Tujuan Pengambilan' },
    { key: 'withdrawalDate', label: 'Tanggal Pengambilan' },
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
    const newTransfer = {
      id: Date.now(),
      user: formData.user,
      platform: formData.platform,
      currentBalance: parseInt(formData.currentBalance, 10) || 0,
      amount: parseInt(formData.amount, 10) || 0,
      fee: parseInt(formData.fee, 10) || 0,
      withdrawalMethod: formData.withdrawalMethod,
      withdrawalAccount: formData.withdrawalAccount,
      withdrawalDate: formData.withdrawalDate,
      description: formData.description
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
      setFormData(itemToEdit)
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
      no: index + 1, // Add row number
      currentBalance: formatRupiah(item.currentBalance),
      amount: formatRupiah(item.amount),
      fee: formatRupiah(item.fee)
    }))

  return (
    <>
      <div className="flex w-full gap-4 items-center mb-6">
        <div className="flex w-full gap-4 items-center p-4">
             <div className='flex items-center'>
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
              onSubmit={handleAddTransfer}
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
        onSubmit={(updatedData) => {
          const updatedTransfer = {
            ...updatedData,
            currentBalance: parseInt(updatedData.currentBalance, 10) || 0,
            amount: parseInt(updatedData.amount, 10) || 0,
            fee: parseInt(updatedData.fee, 10) || 0
          }

          setTransfers((prev) =>
            prev.map((item) => (item.id === updatedData.id ? updatedTransfer : item))
          )
          setModalOpen(false)
        }}
      >
        <InputField
          name="user"
          value={formData.user || ''}
          onChange={(e) => setFormData({ ...formData, user: e.target.value })}
        >
          Petugas Pengambil
        </InputField>

        <InputField
          name="platform"
          value={formData.platform || ''}
          onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
        >
          Platform
        </InputField>

        <InputField
          name="currentBalance"
          type="text"
          value={formData.currentBalance || ''}
          onChange={(e) => {
            const numericValue = e.target.value.replace(/[^0-9]/g, '')
            setFormData({ ...formData, currentBalance: numericValue })
          }}
        >
          Saldo Platform Saat Ini
        </InputField>

        <InputField
          name="amount"
          type="text"
          value={formData.amount || ''}
          onChange={(e) => {
            const numericValue = e.target.value.replace(/[^0-9]/g, '')
            setFormData({ ...formData, amount: numericValue })
          }}
        >
          Nominal Pengambilan
        </InputField>

        <InputField
          name="fee"
          type="text"
          value={formData.fee || ''}
          onChange={(e) => {
            const numericValue = e.target.value.replace(/[^0-9]/g, '')
            setFormData({ ...formData, fee: numericValue })
          }}
        >
          Biaya Admin
        </InputField>

        <InputField
          name="withdrawalMethod"
          value={formData.withdrawalMethod || ''}
          onChange={(e) => setFormData({ ...formData, withdrawalMethod: e.target.value })}
        >
          Metode Pengambilan
        </InputField>

        <InputField
          name="withdrawalAccount"
          value={formData.withdrawalAccount || ''}
          onChange={(e) => setFormData({ ...formData, withdrawalAccount: e.target.value })}
        >
          Tujuan Pengambilan
        </InputField>

        <InputField
          name="withdrawalDate"
          type="date"
          value={formData.withdrawalDate || new Date().toISOString().split('T')[0]}
          onChange={(e) => setFormData({ ...formData, withdrawalDate: e.target.value })}
        >
          Tanggal Pengambilan
        </InputField>

        <InputField
          name="description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required={false}
        >
          Keterangan
        </InputField>
      </ModalEdit>
    </>
  )
}

export default HalamanAmbilSaldo
