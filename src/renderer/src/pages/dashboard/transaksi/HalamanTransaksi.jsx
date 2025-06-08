import { HiArrowRight, HiCalendar, HiChevronLeft, HiChevronRight, HiPlus } from 'react-icons/hi'
import React, { useState } from 'react'

import ConfirmDialog from '../../../components/ConfirmDialog'
import Dropdown from '../../../components/Dropdown'
import FinancialSummaryCards from '../../../components/FinancialSummaryCards'
import FormLayout from './FormLayout'
import ModalEdit from '../../../shared/ui/Modal'
import SearchField from '../../../components/SearchField'
import TableContent from '../../../components/TableContent'

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Halaman transaksi yang menampilkan data transaksi dan saldo.
 * Komponen ini terdiri dari tiga bagian utama: header, financial summary cards, dan tabel transaksi.
 * Header berisi fungsi pencarian dan dropdown untuk memilih toko.
 * Financial summary cards menampilkan ringkasan keuangan.
 * Tabel transaksi menampilkan data transaksi yang dapat difilter berdasarkan tanggal dan sumber dana.
 * Modals dan dialogs digunakan untuk mengedit dan menghapus data transaksi.
 * @returns {JSX.Element} Komponen Halaman Transaksi
 */
/*******  3f798daa-87b2-4987-88d5-6362c1076dc0  *******/ const HalamanTransaksi = () => {
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

  // const [currentStore, setCurrentStore] = useState('ERDIUS DIGITAL')
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

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  // const formattedSaldo = saldo.map((item) => ({
  //   ...item,
  //   saldo: formatRupiah(item.saldo)
  // }))

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

  // const filteredData = saldo
  //   .filter((item) =>
  //     Object.values(item).some((val) =>
  //       String(val).toLowerCase().includes(filterText.toLowerCase())
  //     )
  //   )
  //   .map((item) => ({
  //     ...item,
  //     saldo: new Intl.NumberFormat('id-ID', {
  //       style: 'currency',
  //       currency: 'IDR',
  //       minimumFractionDigits: 0
  //     }).format(item.saldo)
  //   }))

  // const handleStoreChange = (storeName) => {
  //   setCurrentStore(storeName)
  //   // Here you would load data specific to the selected store
  // }

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
    <div className="flex flex-col justify-end h-full">
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
      <div className="bg-white shadow rounded-lg p-4 mb-6 ">
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

      <TableContent
        data={transactions}
        columns={transactionColumns}
        title={'Data Transaksi'}
        info={`Total Transaksi: ${transactions.length}`}
        btnSize={'xs'}
        onAdd={() => setShowTransactionModal(true)}
      >
        <FormLayout
          onSubmit={submitTransaction}
          buttonText="Tambah"
          formType="transaction"
          initialData={transactionFormData}
        />
      </TableContent>

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
