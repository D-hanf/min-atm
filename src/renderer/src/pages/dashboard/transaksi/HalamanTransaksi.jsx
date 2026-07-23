import { HiArrowRight, HiCalendar, HiChevronLeft, HiChevronRight, HiPlus } from 'react-icons/hi'
import { IoMdPrint, IoMdSave } from 'react-icons/io'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import AlertDialog from '../../../components/AlertDialog'
import ButtonInput from '../../../components/ButtonInput'
import ConfirmDialog from '../../../components/ConfirmDialog'
import Dropdown from '../../../components/Dropdown'
import FinancialSummaryCards from '../../../components/FinancialSummaryCards'
import FormLayout from './FormLayout'
import FundSourcesCard from '../../../components/FundSourcesCard'
import ModalEdit from '../../../shared/ui/Modal'
import PageContainer from '../../../components/PageContainer'
import ReceiptView from './ReceiptView'
import SaveOptionsDialog from '../../../components/SaveOptionsDialog'
import SearchField from '../../../components/SearchField'
import TableContent from '../../../components/TableContent'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import { useColumnSettings } from '../../../hooks/useColumnSettings'
import { useLock } from '../../../context/LockContext'
import { useTheme } from '../../../context/ThemeContext'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

const HalamanTransaksi = () => {
  const { isDark } = useTheme()
  const { isColumnVisible } = useColumnSettings('transaksi')
  const [stores, setStore] = useState([])
  const [emptyBalances, setEmptyBalances] = useState([])
  const [formValid, setFormValid] = useState(true)
  const [saldo, setSaldo] = useState([])
  const [showAlertDialog, setShowAlertDialog] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [showInfoDialog, setShowInfoDialog] = useState(false)
  const [infoMessage, setInfoMessage] = useState('')
  const [transactions, setTransactions] = useState([]) // Awalnya kosong, akan diisi dari DB
  const [showOnlyEdited, setShowOnlyEdited] = useState(false)
  const [showEmptyBalanceAlert, setShowEmptyBalanceAlert] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showSaveOptionsDialog, setShowSaveOptionsDialog] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [userRole, setUserRole] = useState(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'))
    return storedUser?.role ? storedUser.role.toLowerCase() : 'kasir'
  })

  const { isGloballyLocked, checkGlobalLock, lockGlobal } = useLock()
  
  // State untuk melacak kasir yang print dan logic lock
  const [isTransactionLocked, setIsTransactionLocked] = useState(() => {
    const currentUser = JSON.parse(localStorage.getItem('user'))
    const lockedKasirId = localStorage.getItem('locked_kasir_id')
    
    // Jika admin, tidak pernah lock
    if (currentUser?.role?.toLowerCase() === 'admin') return false
    
    // Jika ada kasir yang terkunci dan ID sama dengan user saat ini
    if (lockedKasirId && currentUser?.id && lockedKasirId === currentUser.id.toString()) {
      return true
    }
    
    return false
  })

  const [formData, setFormData] = useState({
    source: '',
    saldo: '',
    dateCreated: '',
    dateUpdated: '',
    description: ''
  })
  const [filterText, setFilterText] = useState('')
  const [selectedDate, setSelectedDate] = useState('26/12/2024')
  const getTodayWIB = () => dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD')
  const getNowDateTimeLocalWIB = () => dayjs().tz('Asia/Jakarta').format('YYYY-MM-DDTHH:mm')
  const toDbDateTime = (val) => {
    if (!val) return dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss')
    if (val.includes(' ')) { if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(val)) return `${val}:00`; return val }
    if (val.includes('T')) { const base = val.replace('T',' '); return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(base)?`${base}:00`:base }
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return `${val} 00:00:00`
    return val
  }
  const toDisplayDateTime = (val) => (dayjs(val).isValid()? dayjs(val).tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm'): val || '')

  const [transactionFormData, setTransactionFormData] = useState({
  tanggal: getNowDateTimeLocalWIB(),
    no_transaksi: '',
    sumber_dana: '',
    terima_dana_id: '',
    jenis_transaksi: '',
    tipe_transaksi: '',
    saldo_awal: 0,
    nominal_transaksi: 0,
    fee: 0,
    metode_pembayaran: '',
  biaya_admin: 0,
    saldo_akhir: 0,
    keterangan: '',
    nama_pelanggan: '',
    nomor_tujuan: ''
  })

  const [financialSummary, setFinancialSummary] = useState({
    cashWithdrawal: 0,
    transfer: 0,
    bankAdmin: 0,
    profit: 0,
    modePulsa: 0,
    totalAssets: 0
  })

  const fetchToko = async () => {
    try {
      const result = await window.api.getToko()
      setStore(result)
      // console.log('🔥 Toko:', result)
    } catch (error) {
      console.error('❌ Gagal ambil data toko:', error)
    }
  }

  useEffect(() => {
    fetchToko()
    fetchFundSources()
    
    // Cek lock status saat komponen mount
    checkTransactionLock()
  }, [])

  // Fungsi untuk cek apakah transaksi harus di-lock
  const checkTransactionLock = () => {
    const lockStatus = checkGlobalLock()
    setIsTransactionLocked(lockStatus)
    console.log('🔍 Global lock status:', lockStatus)
  }
  const [currentDate, setCurrentDate] = useState(getTodayWIB())

  useEffect(() => {
    const interval = setInterval(
      () => {
        const today = getTodayWIB()

        if (today !== currentDate) {
          setCurrentDate(today)
          fetchTransaksi() // ⬅️ Panggil ulang transaksi saat hari ganti
          fetchFinancialSummary() // (opsional, biar ringkasan juga update)
        }
      },
      5 * 60 * 1000
    ) // Cek tiap 5 menit

    return () => clearInterval(interval)
  }, [currentDate])

  const [fundSources, setFundSources] = useState([])

  const fetchFundSources = async () => {
    try {
      const result = await window.api.getSaldoAwal()
      // console.log('🔥 Saldo Awal:', result)
      setFundSources(result)

      const total = result.reduce((sum, item) => sum + Number(item.saldo || 0), 0)
      setFinancialSummary((prev) => ({
        ...prev,
        totalAssets: total
      }))

      // 🔍 Cek yang saldonya 0
      const kosong = result.filter(
        (item) => Number(item.saldo) < 1000000 || Number(item.saldo) === 1000000
      )
      setEmptyBalances(kosong)
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

  const fetchFinancialSummary = async () => {
    try {
      const res = await window.api.getTransaksiSummary(userRole)
      if (res.success) {
        setFinancialSummary((prev) => ({
          ...prev,
          ...res.data
        }))
      } else {
        console.error('❌ Gagal ambil ringkasan keuangan:', res.error)
      }
    } catch (err) {
      console.error('❌ Gagal fetch summary:', err)
    }
  }

  const getNamaSumberDanaById = (id) => {
    const numericId = Number(id)
    const found = fundSources.find((item) => item.id === numericId)
    // console.log('🔍 Mencari sumber dana:', id, '→ Casted:', numericId, '→ Ditemukan:', found)
    return found ? found.nama_sumber_dana : '-'
  }

  // ✅ Tambahan ambil data transaksi dari DB
  const fetchTransaksi = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'))
      const data = await window.api.getTransaksi(user.role) // ⬅️ kirim role ke IPC

      const formatted = data.map((item) => {
        const nominal = Number(item.nominal_transaksi || 0)
        const fee = Number(item.fee || 0)
        const adminBank = Number(item.biaya_admin_bank || item.biaya_admin || 0)
        const saldoAwal = Number(item.saldo_awal || 0)
        const jenis = item.jenis_transaksi?.toLowerCase() || ''
        const metode = item.tipe_transaksi?.toLowerCase() || ''

        let final = saldoAwal
        const sumberSamaDenganTerima = Number(item.sumber_dana_id) === Number(item.terima_dana_id)

        switch (jenis) {
          case 'tarik tunai':
            final -= nominal
            break
          case 'transfer':
          case 'mode pulsa':
            final -= nominal + adminBank
            if (sumberSamaDenganTerima) {
              final += nominal
            }
            break
          case 'jasa transfer':
            break
        }

        if (Number(item.sumber_dana_id) === Number(item.metode_pembayaran)) {
          final += fee
        }

        return {
          id: item.id,
          tanggal: toDisplayDateTime(item.tanggal),
          no_transaksi: item.no_transaksi,
          sumber_dana: item.sumber_dana,
          terima_dana_nama: item.terima_dana_nama || '-',
          jenis_transaksi: item.jenis_transaksi || '-',
          tipe_transaksi: item.tipe_transaksi || '-',
          saldo_awal: formatRupiah(saldoAwal),
          terima_dana_id: item.terima_dana_id || '-',
          nama_pelanggan: item.nama_pelanggan || '-',
          nomor_tujuan: item.nomor_tujuan || '-',
          nominal_transaksi: formatRupiah(nominal),
          fee: formatRupiah(fee),
          metode_pembayaran: Number(item.metode_pembayaran) || null,
          metode_pembayaran_nama: getNamaSumberDanaById(item.metode_pembayaran) || '-',
          biaya_admin: formatRupiah(adminBank),
          saldo_akhir: formatRupiah(final),
          keterangan: item.keterangan || '-',
          user_name: item.user_name || '-',
          is_edited: !!item.is_edited,
          edited_at: item.edited_at || null
        }
      })

      setTransactions(formatted)
    } catch (error) {
      console.error('❌ Gagal ambil data transaksi:', error)
    }
  }

  useEffect(() => {
    if (fundSources.length > 0) {
      fetchTransaksi()
      fetchFinancialSummary()
    }
  }, [fundSources, userRole])

  const allTransactionColumns = [
    { key: 'tanggal', label: 'Tanggal' },
    { key: 'user_name', label: 'Dibuat Oleh' },
    { key: 'nama_pelanggan', label: 'Nama Pelanggan' },
    { key: 'nomor_tujuan', label: 'Nomor Tujuan' },
    { key: 'no_transaksi', label: 'No Transaksi' },
    { key: 'sumber_dana', label: 'Sumber Dana' },
    { key: 'jenis_transaksi', label: 'Jenis' },
    { key: 'tipe_transaksi', label: 'Tipe Transaksi' },
    { key: 'saldo_awal', label: 'Saldo Awal' },
    { key: 'nominal_transaksi', label: 'Nominal' },
    { key: 'fee', label: 'Fee' },
    { key: 'biaya_admin', label: 'Adm Bank' },
    { key: 'saldo_akhir', label: 'Saldo Akhir' },
    { key: 'terima_dana_nama', label: 'Terima Dana' },
    { key: 'metode_pembayaran_nama', label: 'Pembayaran Fee' },
    { key: 'keterangan', label: 'Keterangan' }
  ]

  // Filter kolom berdasarkan setting
  const transactionColumns = allTransactionColumns.filter(col => 
    isColumnVisible(col.key)
  )

  const handleDelete = (id) => {
    setDeleteId(id)
    setShowConfirmDialog(true)
  }

  const confirmDelete = async () => {
    try {
      const res = await window.api.deleteTransaksi(deleteId)
      if (res.success) {
        setSaldo((prev) => prev.filter((item) => item.id !== deleteId))
        setShowConfirmDialog(false)
        setDeleteId(null)
        fetchTransaksi()
        fetchFundSources()
      } else {
        console.error('Gagal menghapus transaksi')
      }
    } catch (err) {
      console.error('❌ Error saat menghapus transaksi:', err)
    }
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
      const storedUser = JSON.parse(localStorage.getItem('user'))
      console.log('🔍 Stored user data:', storedUser) // Debug log
      const normalized = { 
        ...data, 
        tanggal: toDbDateTime(data.tanggal),
        user_id: storedUser?.id || storedUser?.userId || '',
        user_role: storedUser?.role || 'kasir',
        user_name: storedUser?.name || storedUser?.username || storedUser?.fullName || 'System'
      }
      console.log('🔍 User info being sent:', { user_role: normalized.user_role, user_name: normalized.user_name }) // Debug log
      const newTransaction = await window.api.createTransaksi(normalized)
      // console.log('✅ Transaksi berhasil:', newTransaction)

      // Fetch ulang data setelah insert
      fetchTransaksi()
      fetchFundSources()
    } catch (err) {
      console.error('❌ Gagal menambahkan transaksi:', err)
    }
  }

  const [users, setUsers] = useState([])

  const [editingTransaction, setEditingTransaction] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const parseRupiah = (value) => {
    return Number(value.replace(/[^0-9,-]+/g, '').replace(',', '.')) || 0
  }

  const handleTransactionEdit = (id) => {
    const transactionToEdit = transactions.find((transaction) => transaction.id === id)

    if (!transactionToEdit) return

    const today = getTodayWIB()
    const currentUser = JSON.parse(localStorage.getItem('user'))
    const currentUserId = currentUser?.id || currentUser?.userId || ''
    const currentUserRole = (currentUser?.role || 'kasir').toLowerCase()

    // Debug logging untuk cek data user
    console.log('🔍 Debug Edit Check:', {
      currentUser,
      currentUserId,
      currentUserRole,
      transactionUserId: transactionToEdit.user_id,
      transactionUserName: transactionToEdit.user_name,
      transactionDate: transactionToEdit.tanggal,
      today
    })

    // Pengecekan role dan user ID
    if (currentUserRole === 'kasir') {
      // Cek tanggal - kasir hanya bisa edit transaksi hari ini
      if (toDisplayDateTime(transactionToEdit.tanggal).slice(0,10) !== today) {
        setInfoMessage(
          'Kasir hanya bisa mengedit transaksi hari ini. Hubungi admin untuk mengubah data lama.'
        )
        setShowInfoDialog(true)
        return
      }
      
      // Cek user ID atau nama - kasir hanya bisa edit transaksi milik sendiri
      const transactionUserRole = (transactionToEdit.user_role || '').toLowerCase()
      const currentUserName = (currentUser?.nama || currentUser?.name || currentUser?.username || '').toLowerCase()
      const transactionUserName = (transactionToEdit.user_name || '').toLowerCase()
      
      // Cek apakah transaksi dibuat oleh admin
      if (transactionUserRole === 'admin' || transactionUserName.includes('admin')) {
        setInfoMessage(
          `Anda tidak dapat mengedit transaksi yang dibuat oleh Admin. (Transaksi dibuat oleh: ${transactionToEdit.user_name || 'Admin'})`
        )
        setShowInfoDialog(true)
        return
      }
      
      // Cek apakah transaksi milik user lain (ID ATAU nama harus cocok)
      const isOwner = (transactionToEdit.user_id && transactionToEdit.user_id === currentUserId) || 
                      (transactionUserName && transactionUserName === currentUserName)
      
      if (!isOwner && (transactionToEdit.user_id || transactionUserName)) {
        console.log('❌ Bukan pemilik transaksi:', {
          transactionUserId: transactionToEdit.user_id,
          currentUserId: currentUserId,
          transactionUserName: transactionUserName,
          currentUserName: currentUserName,
          isOwner: isOwner
        })
        setInfoMessage(
          `Anda tidak dapat mengedit transaksi yang dibuat oleh karyawan lain. (Transaksi dibuat oleh: ${transactionToEdit.user_name || 'Unknown'})`
        )
        setShowInfoDialog(true)
        return
      }
    }
    // Admin bisa edit semua transaksi tanpa batasan

    // Jika lolos, ubah format rupiah ke angka
    const cleanedData = {
      ...transactionToEdit,
  saldo_awal: parseRupiah(transactionToEdit.saldo_awal),
      nominal_transaksi: parseRupiah(transactionToEdit.nominal_transaksi),
      fee: parseRupiah(transactionToEdit.fee),
      biaya_admin: parseRupiah(transactionToEdit.biaya_admin || transactionToEdit.biaya_admin_bank),
      saldo_akhir: parseRupiah(transactionToEdit.saldo_akhir),
      metode_pembayaran: transactionToEdit.metode_pembayaran || ''
    }

    setEditingTransaction(cleanedData)
    setShowEditModal(true)
  }

  const handleEditSubmit = async (updatedData) => {
    try {
      const payload = {
        id: editingTransaction.id,
        data: { ...updatedData, tanggal: toDbDateTime(updatedData.tanggal) }
      }

      const result = await window.api.editTransaksi(payload)

      // console.log('✅ Transaksi berhasil diedit:', result)

      // Ambil ulang data transaksi setelah edit (is_edited sudah diset di backend)
      await fetchTransaksi()

      setShowEditModal(false)
      setEditingTransaction(null)
      fetchFundSources()
    } catch (error) {
      console.error('❌ Gagal mengedit transaksi:', error)
    }
  }

  const handleEditClose = () => {
    setShowEditModal(false)
    setEditingTransaction(null)
  }

  const filteredData = transactions
    .filter((item) =>
      Object.values(item).some((val) => String(val).toLowerCase().includes(filterText.toLowerCase()))
    )
    .filter((item) => (showOnlyEdited ? !!item.is_edited : true))
  const printRef = useRef(null)

  const printSummaryOnly = () => {
    const content = document.getElementById('print-summary').innerHTML
    const printWindow = window.open('', '', 'width=800,height=600')

    printWindow.document.write(`
    <html>
      <head>
        <title>Ringkasan Keuangan</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          .card {
            border: 1px solid #ccc;
            padding: 16px;
            margin-bottom: 16px;
            border-radius: 8px;
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }

  // Simpan summary saja tanpa print
  const handleSaveOnly = async () => {
    try {
      const payload = {
        waktu: getNowWIBDateTime(),
        financialSummary: { ...financialSummary },
        saldoAwal: (fundSources || []).map((s) => ({
          nama_sumber_dana: s.nama_sumber_dana,
          saldo: Number(s.saldo || 0)
        }))
      }
      if (window.api && window.api.saveSummaryData) {
        await window.api.saveSummaryData(payload)
        console.log('✅ Summary disimpan tanpa print')
      } else {
        console.warn('⚠️ API saveSummaryData tidak tersedia')
      }
    } catch (err) {
      console.error('❌ Gagal simpan summary:', err)
    } finally {
      // Lock kasir setelah save (kecuali admin)
      const currentUser = JSON.parse(localStorage.getItem('user'))
      if (currentUser && currentUser.role !== 'admin') {
        lockGlobal(currentUser.id)
        console.log('🔒 Kasir terkunci setelah save:', currentUser.id)
        // Trigger recheck untuk update UI
        checkTransactionLock()
      }
      
      setShowSaveOptionsDialog(false)
    }
  }

  // Simpan summary + saldo awal ke summary_log, lalu cetak
  const getNowWIBDateTime = () => dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss')
  const handleSaveSummaryAndPrint = async () => {
    try {
      const payload = {
        waktu: getNowWIBDateTime(),
        financialSummary: { ...financialSummary },
        saldoAwal: (fundSources || []).map((s) => ({
          nama_sumber_dana: s.nama_sumber_dana,
          saldo: Number(s.saldo || 0)
        }))
      }
      if (window.api && window.api.saveSummaryData) {
        await window.api.saveSummaryData(payload)
        console.log('✅ Summary disimpan')
      } else {
        console.warn('⚠️ API saveSummaryData tidak tersedia')
      }
    } catch (err) {
      console.error('❌ Gagal simpan summary sebelum print:', err)
    } finally {
      // Lock kasir setelah print (kecuali admin)
      const currentUser = JSON.parse(localStorage.getItem('user'))
      if (currentUser && currentUser.role !== 'admin') {
        lockGlobal(currentUser.id)
        console.log('🔒 Kasir terkunci setelah print:', currentUser.id)
        // Trigger recheck untuk update UI
        checkTransactionLock()
      }
      
      // Tetap lanjutkan proses print meski simpan gagal
      printSummaryOnly()
      setShowSaveOptionsDialog(false)
    }
  }

  const handleShowSaveOptions = () => {
    setShowSaveOptionsDialog(true)
  }

  return (
    <PageContainer title="Transaksi">
      {isGloballyLocked && (
        <div className={`${isDark ? 'bg-red-900 border-red-800 text-red-200' : 'bg-red-100 border-red-300 text-red-800'} border px-4 py-3 rounded mb-4 mx-4`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">🔒</span>
            <div>
              <strong>Sistem Terkunci!</strong>
              <p className="text-sm mt-1">
                Kasir ID {localStorage.getItem('locked_kasir_id')} telah menyimpan data. Semua fitur terkunci kecuali logout dan ganti tema.
              </p>
            </div>
          </div>
        </div>
      )}


      
      <div className="flex w-full gap-4 items-center mb-6">
        <div className="flex w-full gap-4 items-center p-4">
          <div className="flex items-center">
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Transaksi
            </h1>
          </div>
          <div className="flex gap-6 max-w-xs">
            <ButtonInput 
              size="xs" 
              color={isGloballyLocked ? 'gray' : 'indigo'} 
              onClick={isGloballyLocked ? undefined : handleShowSaveOptions}
              disabled={isGloballyLocked}
              title={isGloballyLocked ? 'Sistem terkunci - kasir lain harus login untuk membuka' : ''}
            >
              <IoMdSave size={20} />
              {isTransactionLocked ? 'Terkunci' : 'Simpan'}
            </ButtonInput>
          </div>
        </div>
      </div>

      <div ref={printRef} id="print-summary" className="hidden print:block">
        <ReceiptView
          financialSummary={financialSummary}
          fundSources={fundSources}
          formatRupiah={formatRupiah}
        />
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

      {emptyBalances.length > 0 && (
        <div
          className={`${isDark ? 'bg-yellow-900 border-yellow-800 text-yellow-200' : 'bg-yellow-100 border-yellow-300 text-yellow-800'} border px-4 py-3 rounded mb-4 mx-4 transition-all duration-300 ease-in-out`}
        >
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowEmptyBalanceAlert(!showEmptyBalanceAlert)}>
            <div>
              <strong>Perhatian:</strong> Ada {emptyBalances.length} sumber dana yang saldonya hampir habis/kosong
            </div>
            <button className={`ml-2 text-lg transform transition-transform duration-300 ${showEmptyBalanceAlert ? 'rotate-180' : 'rotate-0'}`}>
              ▼
            </button>
          </div>
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showEmptyBalanceAlert ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'}`}>
            <ul className="list-disc list-inside ml-4">
              {emptyBalances.map((item) => (
                <li key={item.id}>{item.nama_sumber_dana}</li>
              ))}
            </ul>
          </div>
        </div>
      )}



      <TableContent
        data={filteredData}
        columns={transactionColumns}
        title={'Data Transaksi'}
        info={`Total Transaksi: ${transactions.length}${isGloballyLocked ? ' (Sistem Terkunci - kasir lain harus login)' : ''}`}
        btnSize={'xs'}
        userRole={userRole}
        showJenisTransaksiFilter={true}
        showSumberDanaFilter={true}
        showTerimaDanaFilter={true}
        showPembayarFeeFilter={true}
        showDateFilter={true}
        showEditedFilter={true}
        onDelete={isGloballyLocked ? null : handleDelete}
        onEdit={isGloballyLocked ? null : handleTransactionEdit}
        onAdd={
          <FormLayout
            onValidChange={setFormValid}
            onSubmit={submitTransaction}
            buttonText="Tambah Transaksi"
            formType="transaction"
            initialData={transactionFormData}
          />
        }
        searchValue={filterText}
        onSearchChange={setFilterText}
      />

      {showEditModal && editingTransaction && !isGloballyLocked && (
        <div>
          <FormLayout
            onSubmit={handleEditSubmit}
            onClose={handleEditClose}
            formType="transaction"
            isEdit={true}
            editData={editingTransaction}
            onValidChange={setFormValid}
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
            dateUpdated: getTodayWIB()
          }

          setSaldo((prevData) =>
            prevData.map((item) => (item.id === formData.id ? { ...item, ...updatedEntry } : item))
          )
          setModalOpen(false)
          setFormData({ source: '', saldo: '', dateCreated: '', dateUpdated: '', description: '' })
        }}
      />
      
      <SaveOptionsDialog
        isOpen={showSaveOptionsDialog}
        onClose={() => setShowSaveOptionsDialog(false)}
        onSaveOnly={handleSaveOnly}
        onSaveAndPrint={handleSaveSummaryAndPrint}
      />

      <AlertDialog
        isOpen={showInfoDialog}
        onClose={() => setShowInfoDialog(false)}
        title="Informasi"
        message={infoMessage}
      />
    </PageContainer>
  )
}

export default HalamanTransaksi
