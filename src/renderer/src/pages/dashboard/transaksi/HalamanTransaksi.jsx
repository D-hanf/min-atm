import { HiArrowRight, HiCalendar, HiChevronLeft, HiChevronRight, HiPlus } from 'react-icons/hi'
import React, { useState, useEffect } from 'react'

import ConfirmDialog from '../../../components/ConfirmDialog'
import Dropdown from '../../../components/Dropdown'
import FinancialSummaryCards from '../../../components/FinancialSummaryCards'
import FundSourcesCard from '../../../components/FundSourcesCard' // Import komponen baru
import FormLayout from './FormLayout'
import ModalEdit from '../../../shared/ui/Modal'
import SearchField from '../../../components/SearchField'
import TableContent from '../../../components/TableContent'

const HalamanTransaksi = () => {
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
  const [userRole, setUserRole] = useState('admin') // atau 'kasir'
  const [formData, setFormData] = useState({
    source: '',
    saldo: '',
    dateCreated: '',
    dateUpdated: '',
    description: ''
  })
  const [filterText, setFilterText] = useState('')
  const [selectedDate, setSelectedDate] = useState('26/12/2024')
  const [transactions, setTransactions] = useState([
    {
      id: 1,
      date: '2023-10-01',
      transactionNumber: 'TR001',
      fundSource: 'DANA',
      type: 'Withdrawal',
      transactionType: 'Cash Withdrawal',
      initialBalance: 1000000,
      amount: 500000,
      internalAdmin: 100000,
      externalAdmin: 200000,
      bankAdmin: 300000,
      finalBalance: 500000,
      description: 'Penarikan dana'
    }
  ])
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const filteredData = transactions.filter(
    (item) => item.nama?.toLowerCase().includes(filterText.toLowerCase()) // atau field lain
  )
  // const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [transactionFormData, setTransactionFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    transactionNumber: '',
    fundSource: '',
    type: '',
    transactionType: '',
    initialBalance: 0,
    amount: 0,
    internalAdmin: 0,
    externalAdmin: 0,
    bankAdmin: 0,
    finalBalance: 0,
    description: ''
  })

  // Financial summary data
  const financialSummary = {
    cashWithdrawal: 0,
    transfer: 0,
    bankAdmin: 0,
    profit: 0,
    totalAssets: 25500000
  }

  // Fund sources with detailed balances
  const fundSources = [
    { name: 'DANA', balance: 5000000 },
    { name: 'BRI', balance: 10000000 },
    { name: 'LACI', balance: 5000000 },
    { name: 'SEABANK', balance: 3000000 },
    { name: 'MANDIRI', balance: 2000000 },
    { name: 'EKGIPOS', balance: 500000 }
  ]

  // Transaction table columns
  const transactionColumns = [
    { key: 'date', label: 'Tanggal' },
    { key: 'transactionNumber', label: 'No Transaksi' },
    { key: 'fundSource', label: 'Sumber Dana' },
    { key: 'type', label: 'Jenis' },
    { key: 'transactionType', label: 'Tipe Transaksi' },
    { key: 'initialBalance', label: 'Saldo Awal' },
    { key: 'amount', label: 'Nominal' },
    { key: 'fee', label: 'Fee' },
    { key: 'bankAdmin', label: 'Adm Bank' },
    { key: 'finalBalance', label: 'Saldo Akhir' },
    { key: 'description', label: 'Keterangan' }
  ]

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

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

  const handleDateChange = (date) => {
    setSelectedDate(date)
    // Filter transactions based on selected date
    const filteredTransactions = transactions.filter((transaction) => transaction.date === date)
    // You can add additional logic here to update the display
  }

  const submitTransaction = (data) => {
    // Process and save transaction data
    const newTransaction = {
      id: Date.now(),
      // hapus no: transactions.length + 1, karena sudah otomatis di TableContent
      ...data,
      // Calculate final balance based on other values
      finalBalance:
        parseInt(data.initialBalance) +
        parseInt(data.amount) -
        parseInt(data.internalAdmin) -
        parseInt(data.externalAdmin) -
        parseInt(data.bankAdmin)
    }

    setTransactions([...transactions, newTransaction])
  }

  // Tambahkan ini di atas useEffect:
  const [users, setUsers] = useState([])

  const handleTransactionEdit = (id) => {
    console.log('Edit clicked for ID:', id) // Debug log
    const transactionToEdit = transactions.find((transaction) => transaction.id === id)
    console.log('Transaction to edit:', transactionToEdit) // Debug log
    if (transactionToEdit) {
      setEditingTransaction(transactionToEdit)
      setShowEditModal(true)
    }
  }

  const handleEditSubmit = (updatedData) => {
    console.log('Edit submit:', updatedData) // Debug log
    setTransactions((prevTransactions) =>
      prevTransactions.map((transaction) =>
        transaction.id === editingTransaction.id ? { ...transaction, ...updatedData } : transaction
      )
    )
    setShowEditModal(false)
    setEditingTransaction(null)
  }

  const handleEditClose = () => {
    console.log('Edit modal closed') // Debug log
    setShowEditModal(false)
    setEditingTransaction(null)
  }

  return (
    <div className="flex flex-col justify-end h-full">
      {/* Header/Navigation */}
      <div className="flex w-full gap-4 items-center mb-6">
        <div className="flex w-full gap-4 items-center  p-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-800 ">Transaksi</h1>
          </div>
          <div className="flex-1 max-w-xs">
            <Dropdown
              className="w-full"
              label="Pindah Toko"
              items={stores.map((store) => store.name)}
              color={'gray'}
            />
          </div>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <FinancialSummaryCards
        financialSummary={financialSummary}
        formatRupiah={formatRupiah}
        userRole={userRole}
      />

      {/* Fund Sources Card - Replace old section */}
      <FundSourcesCard
        totalAssets={financialSummary.totalAssets}
        fundSources={fundSources}
        formatRupiah={formatRupiah}
      />

      {/* Transaction Data Table */}
      <TableContent
        data={transactions}
        columns={transactionColumns}
        title={'Data Transaksi'}
        info={`Total Transaksi: ${transactions.length}`}
        btnSize={'xs'}
        userRole={userRole}
        onEdit={handleTransactionEdit} // Add this prop
        onAdd={
          <FormLayout
            onSubmit={submitTransaction}
            buttonText="Tambah Transaksi"
            formType="transaction"
            initialData={transactionFormData}
          />
        }
        searchValue={filterText}
        onSearchChange={setFilterText}
      />

      {/* Edit Transaction Modal */}
      {showEditModal && editingTransaction && (
        <div>
          {console.log('Rendering edit modal with:', editingTransaction)} {/* Debug log */}
          <FormLayout
            onSubmit={handleEditSubmit}
            onClose={handleEditClose}
            formType="transaction"
            isEdit={true}
            editData={editingTransaction}
          />
        </div>
      )}

      {/* Modals and Dialogs */}
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
            dateUpdated: new Date().toISOString().split('T')[0]
          }

          setSaldo((prevData) =>
            prevData.map((item) => (item.id === formData.id ? { ...item, ...updatedEntry } : item))
          )
          setModalOpen(false)
          setFormData({ source: '', saldo: '', dateCreated: '', dateUpdated: '', description: '' })
        }}
      ></ModalEdit>
    </div>
  )
}

export default HalamanTransaksi
