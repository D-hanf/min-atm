import { HiArrowRight, HiCalendar, HiChevronLeft, HiChevronRight, HiPlus } from 'react-icons/hi'
import React, { useEffect, useState } from 'react'

import ConfirmDialog from '../../../components/ConfirmDialog'
import Dropdown from '../../../components/Dropdown'
import FinancialSummaryCards from '../../../components/FinancialSummaryCards'
import FormLayout from './FormLayout'
import FundSourcesCard from '../../../components/FundSourcesCard'
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

  const [saldo, setSaldo] = useState([])
  const [transactions, setTransactions] = useState([]) // Awalnya kosong, akan diisi dari DB
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [userRole, setUserRole] = useState('admin')
  const [formData, setFormData] = useState({
    source: '',
    saldo: '',
    dateCreated: '',
    dateUpdated: '',
    description: ''
  })
  const [filterText, setFilterText] = useState('')
  const [selectedDate, setSelectedDate] = useState('26/12/2024')

  const [transactionFormData, setTransactionFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    no_transaksi: '',
    sumber_dana_id: '',
    terima_dana_id: '', // tambahkan jika diperlukan
    jenis_transaksi: '',
    metode_pembayaran: '',
    saldo_awal: 0,
    nominal_transaksi: 0,
    fee: 0,
    biaya_admin_internal: 0,
    biaya_admin_eksternal: 0,
    biaya_admin_bank: 0,
    saldo_akhir: 0,
    keterangan: ''
  })

  const [financialSummary, setFinancialSummary] = useState({
    cashWithdrawal: 0,
    transfer: 0,
    bankAdmin: 0,
    profit: 0,
    totalAssets: 0
  })

  const [fundSources, setFundSources] = useState([])

  const fetchFundSources = async () => {
    try {
      const result = await window.api.getSaldoAwal()
      console.log('🔥 Saldo Awal:', result)
      setFundSources(result)

      const total = result.reduce((sum, item) => sum + Number(item.saldo || 0), 0)
      setFinancialSummary((prev) => ({
        ...prev,
        totalAssets: total
      }))
    } catch (error) {
      console.error('❌ Gagal ambil data saldo:', error)
    }
  }
  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }
  // ✅ Tambahan ambil data transaksi dari DB
  const fetchTransaksi = async () => {
    try {
      const data = await window.api.getTransaksi()

      const formatted = data.map((item) => {
        const nominal = Number(item.nominal_transaksi || 0)
        const fee = Number(item.fee || 0)
        const adminBank = Number(item.biaya_admin_bank || 0)
        const jenis = item.jenis_transaksi?.toLowerCase() || ''
        let final = 0

        switch (jenis) {
          case 'tarik tunai':
            final = -nominal
            if (item.metode_pembayaran === 'digital') {
              final += nominal + fee
            } else if (item.metode_pembayaran === 'cash') {
              final += fee
            }
            break

          case 'transfer':
            final = -(nominal + adminBank) + (nominal + fee)
            break

          case 'jasa transfer':
            final = fee
            break

          case 'mode pulsa':
            final = -(nominal + adminBank) + (nominal + fee)
            break

          default:
            final = nominal - fee - adminBank
            break
        }

        return {
          id: item.id,
          tanggal: item.tanggal,
          no_transaksi: item.no_transaksi,
          sumber_dana_id: item.sumber_dana_id,
          jenis_transaksi: item.jenis_transaksi || "-",
          metode_pembayaran: item.metode_pembayaran,
          saldo_awal: formatRupiah(item.saldo_awal || 0),
          nominal_transaksi: formatRupiah(nominal),
          fee: formatRupiah(fee),
          biaya_admin_bank: formatRupiah(adminBank || 0) ,
          saldo_akhir: formatRupiah(final),
          keterangan: item.keterangan || '-'
        }
      })

      console.log('📥 Formatted Transaksi:', formatted)
      setTransactions(formatted)
    } catch (error) {
      console.error('❌ Gagal ambil data transaksi:', error)
    }
  }

  useEffect(() => {
    fetchFundSources()
    fetchTransaksi()
  }, [])
  const transactionColumns = [
    { key: 'tanggal', label: 'Tanggal' },
    { key: 'no_transaksi', label: 'No Transaksi' },
    { key: 'sumber_dana_id', label: 'Sumber Dana' },
    { key: 'jenis_transaksi', label: 'Jenis' },
    { key: 'metode_pembayaran', label: 'Tipe Transaksi' },
    { key: 'saldo_awal', label: 'Saldo Awal' },
    { key: 'nominal_transaksi', label: 'Nominal' },
    { key: 'fee', label: 'Fee' },
    { key: 'biaya_admin_bank', label: 'Adm Bank' },
    { key: 'saldo_akhir', label: 'Saldo Akhir' },
    { key: 'keterangan', label: 'Keterangan' }
  ]

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
    const filteredTransactions = transactions.filter((transaction) => transaction.date === date)
  }

  const submitTransaction = async (data) => {
    try {
      console.log('📥 Menambahkan transaksi:', data)
      const newTransaction = await window.api.createTransaksi(data)
      console.log('✅ Transaksi berhasil:', newTransaction)

      // Fetch ulang data setelah insert
      fetchTransaksi()
    } catch (err) {
      console.error('❌ Gagal menambahkan transaksi:', err)
    }
  }

  const [users, setUsers] = useState([])

  const [editingTransaction, setEditingTransaction] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const handleTransactionEdit = (id) => {
    const transactionToEdit = transactions.find((transaction) => transaction.id === id)
    if (transactionToEdit) {
      setEditingTransaction(transactionToEdit)
      setShowEditModal(true)
    }
  }

  const handleEditSubmit = (updatedData) => {
    setTransactions((prevTransactions) =>
      prevTransactions.map((transaction) =>
        transaction.id === editingTransaction.id ? { ...transaction, ...updatedData } : transaction
      )
    )
    setShowEditModal(false)
    setEditingTransaction(null)
  }

  const handleEditClose = () => {
    setShowEditModal(false)
    setEditingTransaction(null)
  }

  const filteredData = transactions.filter((item) =>
    item.nama?.toLowerCase().includes(filterText.toLowerCase())
  )

  return (
    <div className="flex flex-col justify-end h-full">
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

      <FinancialSummaryCards
        financialSummary={financialSummary}
        formatRupiah={formatRupiah}
        userRole={userRole}
      />

      <FundSourcesCard
        totalAssets={financialSummary.totalAssets}
        fundSources={fundSources}
        formatRupiah={formatRupiah}
      />

      <TableContent
        data={transactions}
        columns={transactionColumns}
        title={'Data Transaksi'}
        info={`Total Transaksi: ${transactions.length}`}
        btnSize={'xs'}
        userRole={userRole}
        onEdit={handleTransactionEdit}
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

      {showEditModal && editingTransaction && (
        <div>
          <FormLayout
            onSubmit={handleEditSubmit}
            onClose={handleEditClose}
            formType="transaction"
            isEdit={true}
            editData={editingTransaction}
          />
        </div>
      )}

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
      />
    </div>
  )
}

export default HalamanTransaksi
