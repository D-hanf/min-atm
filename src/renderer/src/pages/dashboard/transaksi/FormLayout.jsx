import React, { useEffect, useState } from 'react'

import ButtonInput from '../../../components/ButtonInput'
import { HiPlus } from 'react-icons/hi'
import InputField from '../../../components/InputField'
import JasaTransferForm from './forms/JasaTransferForm'
import Modal from '../../../shared/ui/Modal'
import ModePulsaForm from './forms/ModePulsaForm'
import TarikTunaiForm from './forms/TarikTunaiForm'
import TransactionMenu from './TransactionMenu'
import TransferForm from './forms/TransferForm'

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
  const [modalOpen, setModalOpen] = useState(isEdit)
  const [formData, setFormData] = useState(initialData)
  const [showMenu, setShowMenu] = useState(true)
  const [selectedTransactionType, setSelectedTransactionType] = useState('')
  const [selectedTransactionId, setSelectedTransactionId] = useState('')
  const [formValid, setFormValid] = useState(true)

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
      Pulsa: 'mode-pulsa'
    }
    return typeMap[transactionType] || ''
  }

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
    if (modalOpen && formType === 'transaction' && !isEdit && !formData.no_transaksi) {
      const today = new Date()
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
      const randomStr = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0')
      const transactionNumber = `TRX-${dateStr}${randomStr}`

      setFormData((prev) => ({
        ...prev,
        no_transaksi: transactionNumber,
        tanggal: prev.tanggal || today.toISOString().split('T')[0]
      }))
    }
  }, [modalOpen, formType, isEdit])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleTransactionSelect = (id, name) => {
    setSelectedTransactionId(id)
    setSelectedTransactionType(name)
    setShowMenu(false)
    setFormData((prev) => ({
      ...prev,
      jenis_transaksi: name
    }))
  }

  const handleSubmit = () => {
    onSubmit(formData)
    setModalOpen(false)

    if (formType === 'transaction' && !isEdit) {
      setFormData({
        tanggal: new Date().toISOString().split('T')[0],
        no_transaksi: '',
        sumber_dana_id: '',
        metode_pembayaran: '',
        jenis_transaksi: '',
        saldo_awal: 0,
        nominal_transaksi: 0,
        fee: 0,
        biaya_admin_bank: 0,
        saldo_akhir: 0,
        keterangan: ''
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
      default:
        return null
    }
  }

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
