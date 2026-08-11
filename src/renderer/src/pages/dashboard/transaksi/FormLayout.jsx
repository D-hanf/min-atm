import React, { useEffect, useState } from 'react'

import ButtonInput from '../../../components/ButtonInput'
import CekSaldoForm from './forms/CekSaldo'
import { HiPlus } from 'react-icons/hi'
import InputField from '../../../components/InputField'
import JasaTransferForm from './forms/JasaTransferForm'
import Modal from '../../../shared/ui/Modal'
import ModePulsaForm from './forms/ModePulsaForm'
import TarikTunaiForm from './forms/TarikTunaiForm'
import TransactionMenu from './TransactionMenu'
import TransferForm from './forms/TransferForm'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)
const FormLayout = ({
  onSubmit,
  buttonText = 'Tambah Sumber Dana',
  formType = 'saldo',
  initialData = {},
  isEdit = false,
  editData = null,
  onClose = null,
  onValidChange
}) => {
  // Dipindah ke atas (sebelum useState) supaya bisa dipakai untuk inisialisasi state
  // di bawah — biar pas mode edit, form yang benar langsung tampil di render PERTAMA,
  // tidak nunggu useEffect (itu penyebab modal sempat keliatan kosong sekilas sebelum
  // form aslinya muncul).
  const getTransactionId = (transactionType) => {
    const typeMap = {
      'Cash Withdrawal': 'tarik-tunai',
      'Tarik Tunai': 'tarik-tunai',
      Transfer: 'transfer',
      Briva: 'transfer',
      'Antar Bank': 'transfer',
      'Sesama Bank': 'transfer',
      'Jasa Transfer': 'jasa-transfer',
      'Mode Pulsa': 'mode-pulsa',
      Pulsa: 'mode-pulsa',
      'Cek Saldo': 'cek-saldo'
    }
    return typeMap[transactionType] || ''
  }

  const [modalOpen, setModalOpen] = useState(isEdit)
  const [formData, setFormData] = useState(isEdit && editData ? editData : initialData)
  const [showMenu, setShowMenu] = useState(
    isEdit && editData ? !getTransactionId(editData.jenis_transaksi) : true
  )
  const [selectedTransactionType, setSelectedTransactionType] = useState(
    isEdit && editData ? editData.jenis_transaksi || '' : ''
  )
  const [selectedTransactionId, setSelectedTransactionId] = useState(
    isEdit && editData ? getTransactionId(editData.jenis_transaksi) : ''
  )
  const [formValid, setFormValid] = useState(true)

  // Baseline field-field transaksi yang HARUS di-reset tiap kali kasir pindah
  // ke jenis transaksi yang beda (baik dari menu maupun setelah submit). Dipusatkan
  // di satu tempat supaya tidak dobel-tulis & tidak gampang beda-beda antara
  // handleTransactionSelect dan handleSubmit seperti sebelumnya — itu yang bikin
  // field sisa dari jenis transaksi sebelumnya (mis. `fee` dari Tarik Tunai) bisa
  // nyangkut kebawa ke jenis transaksi lain (mis. Cek Saldo) tanpa disadari.
  const getEmptyTransactionFields = () => ({
    sumber_dana_id: '',
    metode_pembayaran: '',
    tipe_transaksi: '',
    saldo_awal: 0,
    nominal_transaksi: 0,
    fee: 0,
    biaya_admin: 0,
    biaya_admin_bank: 0,
    terima_dana_id: '',
    saldo_akhir: 0,
    keterangan: '',
    nomor_tujuan: '',
    alat_id: '',
    alat_nama: '',
    is_fee_manual: false,
    // Cek Saldo
    bonus: 0,
    is_bonus_manual: false,
    nama_pelanggan: ''
  })

  const getTodayWIB = () => dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD')
  const getNowDateTimeLocalWIB = () => dayjs().tz('Asia/Jakarta').format('YYYY-MM-DDTHH:mm')

  useEffect(() => {
    if (isEdit && editData) {
      setModalOpen(true)
      setFormData(editData)
      const transactionId = getTransactionId(editData.jenis_transaksi)
      if (transactionId) {
        setSelectedTransactionId(transactionId)
        setSelectedTransactionType(editData.jenis_transaksi)
        setShowMenu(false)
      }
    }
  }, [isEdit, editData])

  useEffect(() => {
    if (modalOpen && formType?.toLowerCase() === 'transaction' && !isEdit && !formData.no_transaksi) {
      const nowDate = getTodayWIB()
      const dateStr = nowDate.replace(/-/g, '')
      const randomStr = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0')
      const transactionNumber = `TRX-${dateStr}${randomStr}`
      setFormData((prev) => ({
        ...prev,
        no_transaksi: transactionNumber,
        // If prev.tanggal already provided (e.g. editing), keep it; else set current datetime-local
        tanggal: prev.tanggal && prev.tanggal.includes('T') ? prev.tanggal : getNowDateTimeLocalWIB()
      }))
    }
  }, [modalOpen, formType, isEdit, formData.no_transaksi])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTransactionSelect = (id, name) => {
    setSelectedTransactionId(id)
    setSelectedTransactionType(name)
    setShowMenu(false)
    // Reset SEMUA field spesifik-jenis ke default begitu kasir pilih jenis
    // transaksi (baru atau ganti dari yang lain) — cuma tanggal & no_transaksi
    // (yang sudah digenerate di atas) yang dipertahankan. Ini mencegah field
    // dari jenis transaksi sebelumnya (fee, bonus, alat_id, dll) nyangkut ke
    // jenis transaksi yang baru dipilih.
    setFormData((prev) => ({
      tanggal: prev.tanggal,
      no_transaksi: prev.no_transaksi,
      ...getEmptyTransactionFields(),
      jenis_transaksi: name
    }))
  }

  const handleSubmit = () => {
    // Ensure tanggal saved in DB-friendly datetime format; leave formatting to higher layer if needed
    const normalizedForm = { ...formData }
    if (!normalizedForm.tanggal || !/T\d{2}:\d{2}/.test(normalizedForm.tanggal)) {
      // If somehow only date provided, append current time
      if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedForm.tanggal)) {
        const timePart = dayjs().tz('Asia/Jakarta').format('HH:mm')
        normalizedForm.tanggal = `${normalizedForm.tanggal}T${timePart}`
      } else if (!normalizedForm.tanggal) {
        normalizedForm.tanggal = getNowDateTimeLocalWIB()
      }
    }
    onSubmit(normalizedForm)
    setModalOpen(false)

    if (formType?.toLowerCase() === 'transaction' && !isEdit) {
      setFormData({
        tanggal: getNowDateTimeLocalWIB(),
        no_transaksi: '',
        jenis_transaksi: '',
        ...getEmptyTransactionFields()
      })
    }
  }

  const handleBackToMenu = () => {
    setShowMenu(true)
    setSelectedTransactionType('')
    setSelectedTransactionId('')
  }

  const handleModalClose = () => {
    setModalOpen(false)
    if (isEdit && onClose) {
      onClose()
    } else {
      setShowMenu(true)
      setSelectedTransactionType('')
      setSelectedTransactionId('')
    }
  }

  const renderTransactionForm = () => {
    const formProps = {
      formData,
      onChange: handleInputChange,
      onValidChange: setFormValid
    }

    switch (selectedTransactionId) {
      case 'tarik-tunai':
        return <TarikTunaiForm {...formProps} />
      case 'transfer':
        return <TransferForm {...formProps} />
      case 'jasa-transfer':
        return <JasaTransferForm {...formProps} />
      case 'mode-pulsa':
        return <ModePulsaForm {...formProps} />
      case 'cek-saldo':
        return <CekSaldoForm {...formProps} />
      default:
        return null
    }
  }
  useEffect(() => {
    if (!isEdit && modalOpen && formType?.toLowerCase() === 'transaction') {
      setFormData((prev) => ({
        ...prev,
        tanggal: prev.tanggal && prev.tanggal.includes('T') ? prev.tanggal : getNowDateTimeLocalWIB()
      }))
    }
  }, [modalOpen, isEdit, formType])

  return (
    <>
      {!isEdit && (
        <div className="w-full flex justify-end">
          <ButtonInput size="xs" onClick={() => setModalOpen(true)}>
            <HiPlus size={18} />
            {buttonText}
          </ButtonInput>
        </div>
      )}
      <Modal
        className="max-h-[80vh] overflow-y-auto pr-2"
        isOpen={modalOpen}
        disabled={!formValid && !showMenu && !isEdit}
        onClose={handleModalClose}
        onSubmit={handleSubmit}
        hideSubmit={formType === 'transaction' && showMenu && !isEdit}
        fullWidthCancel={formType === 'transaction' && showMenu && !isEdit}
        showBackButton={formType === 'transaction' && !showMenu && !isEdit}
        onBack={handleBackToMenu}
        title={
          formType === 'transaction' && !showMenu
            ? selectedTransactionType
            : isEdit
              ? `Edit ${selectedTransactionType}`
              : ''
        }
      >
        {formType === 'saldo' ? (
          <>
            <InputField
              name="source"
              type="text"
              value={formData.source || ''}
              onChange={handleInputChange}
            >
              Sumber Dana
            </InputField>
            <InputField
              name="saldo"
              type="number"
              value={formData.saldo || ''}
              onChange={handleInputChange}
            >
              Jumlah Saldo
            </InputField>
            <InputField
              name="keterangan"
              className="col-span-2"
              value={formData.keterangan || ''}
              onChange={handleInputChange}
              required={false}
            >
              Keterangan
            </InputField>
          </>
        ) : (
          <>
            {showMenu && !isEdit ? (
              <TransactionMenu onSelectTransaction={handleTransactionSelect} />
            ) : (
              renderTransactionForm()
            )}
          </>
        )}
      </Modal>
    </>
  )
}

export default FormLayout