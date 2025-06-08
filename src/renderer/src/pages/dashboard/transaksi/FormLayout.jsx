import React, { useEffect } from 'react'

import ButtonInput from '../../../components/ButtonInput'
import { HiPlus } from 'react-icons/hi'
import InputField from '../../../components/InputField'
import Modal from '../../../shared/ui/Modal'
import SelectItems from '../../../components/SelectItems'
import { useState } from 'react'

const FormLayout = ({
  onSubmit,
  buttonText = 'Tambah Sumber Dana',
  formType = 'saldo',
  initialData = {}
}) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState(initialData)

  // Generate transaction number when modal is opened for transaction form
  useEffect(() => {
    if (modalOpen && formType === 'transaction' && !formData.transactionNumber) {
      // Generate transaction number format: TRX-YYYYMMDD-RANDOM
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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = () => {
    onSubmit(formData)
    setModalOpen(false)

    // Reset form data after submission if it's a transaction
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

  return (
    <>
      <div className="w-full flex justify-end">
        <ButtonInput size="sm" onClick={() => setModalOpen(true)}>
          <HiPlus size={18} />
          {buttonText}
        </ButtonInput>
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit}>
        {formType === 'saldo' ? (
          // Original saldo form fields
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
            >
              Keterangan
            </InputField>
          </>
        ) : (
          // Transaction form fields
          <>
            <InputField
              name="date"
              type="date"
              value={formData.date || new Date().toISOString().split('T')[0]}
              onChange={handleInputChange}
            >
              Tanggal
            </InputField>
            <InputField
              name="transactionNumber"
              type="text"
              value={formData.transactionNumber || ''}
              onChange={handleInputChange}
              disabled={true}
            >
              No Transaksi
            </InputField>
            {/* <InputField
              name="fundSource"
              type="text"
              value={formData.fundSource || ''}
              onChange={handleInputChange}
            >
              Sumber Dana
            </InputField> */}
            <SelectItems
              options={[
                { label: 'Dana', value: 'Dana' },
                { label: 'BRI', value: 'BRI' },
                { label: 'BNI', value: 'BNI' },
                { label: 'BCA', value: 'BCA' },
                { label: 'Mandiri', value: 'Mandiri' }
              ]}
              label="Sumber Dana"
            />
            <InputField
              name="type"
              type="text"
              value={formData.type || ''}
              onChange={handleInputChange}
            >
              Jenis
            </InputField>
            <InputField
              name="transactionType"
              type="text"
              value={formData.transactionType || ''}
              onChange={handleInputChange}
            >
              Tipe Transaksi
            </InputField>
            <InputField
              name="initialBalance"
              type="number"
              value={formData.initialBalance || 0}
              onChange={handleInputChange}
            >
              Saldo Awal
            </InputField>
            <InputField
              name="amount"
              type="number"
              value={formData.amount || 0}
              onChange={handleInputChange}
            >
              Nominal
            </InputField>
            <InputField
              name="internalAdmin"
              type="number"
              value={formData.internalAdmin || 0}
              onChange={handleInputChange}
            >
              Admin Dalam
            </InputField>
            <InputField
              name="externalAdmin"
              type="number"
              value={formData.externalAdmin || 0}
              onChange={handleInputChange}
            >
              Admin Luar
            </InputField>
            <InputField
              name="bankAdmin"
              type="number"
              value={formData.bankAdmin || 0}
              onChange={handleInputChange}
            >
              Adm Bank
            </InputField>
            <InputField
              name="description"
              className="col-span-2"
              value={formData.description || ''}
              onChange={handleInputChange}
            >
              Keterangan
            </InputField>
          </>
        )}
      </Modal>
    </>
  )
}

export default FormLayout
