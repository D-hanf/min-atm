import React, { useEffect, useState } from 'react'
import ButtonInput from '../../../components/ButtonInput'
import { HiPlus } from 'react-icons/hi'
import InputField from '../../../components/InputField'
import Modal from '../../../shared/ui/Modal'
import TransactionMenu from './TransactionMenu'
import TarikTunaiForm from './forms/TarikTunaiForm'
import TransferForm from './forms/TransferForm'
import JasaTransferForm from './forms/JasaTransferForm'
import ModePulsaForm from './forms/ModePulsaForm'

const FormLayout = ({
  onSubmit,
  buttonText = 'Tambah Sumber Dana',
  formType = 'saldo',
  initialData = {}
}) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState(initialData)
  const [showMenu, setShowMenu] = useState(true)
  const [selectedTransactionType, setSelectedTransactionType] = useState('')
  const [selectedTransactionId, setSelectedTransactionId] = useState('')

  // Generate transaction number when modal is opened for transaction form
  useEffect(() => {
    if (modalOpen && formType === 'transaction' && !formData.transactionNumber) {
      const today = new Date()
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
      const randomStr = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0')

      const transactionNumber = `TRX-${dateStr}-${randomStr}`

      setFormData((prev) => ({
        ...prev,
        transactionNumber,
        date: prev.date || today.toISOString().split('T')[0]
      }))
    }
  }, [modalOpen, formType])

  // Reset menu when modal is closed
  useEffect(() => {
    if (!modalOpen) {
      setShowMenu(true)
      setSelectedTransactionType('')
      setSelectedTransactionId('')
    }
  }, [modalOpen])

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
      transactionType: name
    }))
  }

  const handleSubmit = () => {
    onSubmit(formData)
    setModalOpen(false)

    // Reset form data after submission
    if (formType === 'transaction') {
      setFormData({
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
    }
  }

  const handleBackToMenu = () => {
    setShowMenu(true)
    setSelectedTransactionType('')
    setSelectedTransactionId('')
  }

  const renderTransactionForm = () => {
    const formProps = {
      formData,
      onChange: handleInputChange
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
      <div className="w-full flex justify-end">
        <ButtonInput size="xs" onClick={() => setModalOpen(true)}>
          <HiPlus size={18} />
          {buttonText}
        </ButtonInput>
      </div>
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        hideSubmit={formType === 'transaction' && showMenu}
        fullWidthCancel={formType === 'transaction' && showMenu}
        showBackButton={formType === 'transaction' && !showMenu}
        onBack={handleBackToMenu}
        title={formType === 'transaction' && !showMenu ? selectedTransactionType : ''}
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
              name="description"
              className="col-span-2"
              value={formData.description || ''}
              onChange={handleInputChange}
              required={false}
            >
              Keterangan
            </InputField>
          </>
        ) : (
          <>
            {showMenu ? (
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
