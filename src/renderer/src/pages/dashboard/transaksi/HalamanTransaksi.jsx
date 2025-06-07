import React, { useState } from 'react'
import { HiArrowRight, HiPlus, HiChevronLeft, HiChevronRight, HiCalendar } from 'react-icons/hi'

import ConfirmDialog from '../../../components/ConfirmDialog'
import Dropdown from '../../../components/Dropdown'
import FinancialSummaryCards from '../../../components/FinancialSummaryCards'
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
  const [formData, setFormData] = useState({
    source: '',
    saldo: '',
    dateCreated: '',
    dateUpdated: '',
    description: ''
  })
  const [filterText, setFilterText] = useState('')

  const [currentStore, setCurrentStore] = useState('ERDIUS DIGITAL')
  const [selectedDate, setSelectedDate] = useState('26/12/2024')
  const [transactions, setTransactions] = useState([])
  const [showTransactionModal, setShowTransactionModal] = useState(false)
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
    { key: 'no', label: 'No' },
    { key: 'date', label: 'Tanggal' },
    { key: 'transactionNumber', label: 'No Transaksi' },
    { key: 'fundSource', label: 'Sumber Dana' },
    { key: 'type', label: 'Jenis' },
    { key: 'transactionType', label: 'Tipe Transaksi' },
    { key: 'initialBalance', label: 'Saldo Awal' },
    { key: 'amount', label: 'Nominal' },
    { key: 'internalAdmin', label: 'Admin Dalam' },
    { key: 'externalAdmin', label: 'Admin Luar' },
    { key: 'bankAdmin', label: 'Adm Bank' },
    { key: 'finalBalance', label: 'Saldo Akhir' },
    { key: 'description', label: 'Keterangan' }
  ]

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

  const handleAddSaldo = (formData) => {
    const cleanedSaldo = parseInt(
      formData.saldo.replace(/[^0-9]/g, ''), // hapus semua selain angka
      10
    )

    const newSaldo = {
      id: Date.now(),
      source: formData.source,
      saldo: cleanedSaldo,
      dateCreated: new Date().toISOString().split('T')[0],
      description: formData.description
    }

    setSaldo([...saldo, newSaldo])
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

  const handleStoreChange = (storeName) => {
    setCurrentStore(storeName)
    // Here you would load data specific to the selected store
  }

  const handleDateChange = (date) => {
    setSelectedDate(date)
    // Filter transactions based on selected date
    const filteredTransactions = transactions.filter(transaction => 
      transaction.date === date
    )
    // You can add additional logic here to update the display
  }

  const handlePrevDate = () => {
    const currentDate = new Date(selectedDate.split('/').reverse().join('-'))
    currentDate.setDate(currentDate.getDate() - 1)
    const newDate = currentDate.toLocaleDateString('id-ID')
    setSelectedDate(newDate)
  }

  const handleNextDate = () => {
    const currentDate = new Date(selectedDate.split('/').reverse().join('-'))
    currentDate.setDate(currentDate.getDate() + 1)
    const newDate = currentDate.toLocaleDateString('id-ID')
    setSelectedDate(newDate)
  }

  const submitTransaction = (data) => {
    // Process and save transaction data
    const newTransaction = {
      id: Date.now(),
      no: transactions.length + 1,
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

  return (
    <div className="flex flex-col h-full">
      {/* Header/Navigation */}
      <div className="flex w-full gap-4 items-center mb-6">
        <div className="flex w-full gap-4 items-center p-4">
          <div className="flex-1 max-w-xs">
            <SearchField
              placeholder="Cari saldo atau sumber..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
          <div className="flex-1 max-w-xs">
            <Dropdown
              className="w-full"
              label="Pindah Toko"
              items={stores.map((store) => store.name)}
            />
          </div>
        </div>
      </div>

      {/* Financial Summary Cards - Replaced with component */}
      <FinancialSummaryCards financialSummary={financialSummary} formatRupiah={formatRupiah} />

      {/* Total Assets and Fund Sources */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="font-bold text-xl mb-3">
          TOTAL ASET: {formatRupiah(financialSummary.totalAssets)}
        </div>
        <div className="flex flex-wrap gap-2">
          {fundSources.map((source, index) => (
            <div
              key={index}
              className={`px-4 py-2 rounded-md bg-gray-100 hover:bg-blue-100 cursor-pointer`}
            >
              {source.name} {formatRupiah(source.balance)}
            </div>
          ))}
        </div>
      </div>

      {/* Transaction Data Table */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="font-bold text-lg">DATA TRANSAKSI</div>
          <div className="text-sm">Total Trx: {transactions.length}</div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrevDate} className="p-1">
              <HiChevronLeft />
            </button>
            <div className="relative">
              <input
                type="text"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="border rounded-md px-3 py-1 pr-8"
              />
              <HiCalendar className="absolute right-2 top-2 text-gray-500" />
            </div>
            <button onClick={handleNextDate} className="p-1">
              <HiChevronRight />
            </button>
            {/* Replace the ButtonInput with FormLayout */}
            <FormLayout
              onSubmit={submitTransaction}
              buttonText="Tambah"
              formType="transaction"
              initialData={transactionFormData}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {transactionColumns.map((column) => (
                  <th
                    key={column.key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.label}
                  </th>
                ))}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length > 0 ? (
                transactions.map((transaction, index) => (
                  <tr key={transaction.id}>
                    {transactionColumns.map((column) => (
                      <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                        {column.key.includes('balance') ||
                        column.key.includes('amount') ||
                        column.key.includes('admin')
                          ? formatRupiah(transaction[column.key])
                          : transaction[column.key]}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(transaction.id)}
                        className="text-indigo-600 hover:text-indigo-900 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={transactionColumns.length + 1}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    Data Kosong
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
      >
        {/* ...existing modal content... */}
      </ModalEdit>
    </div>
  )
}

export default HalamanTransaksi
