import ButtonInput from '../../../../components/ButtonInput'
import { HiPlus } from 'react-icons/hi'
import InputField from '../../../../components/InputField'
import Modal from '../../../../shared/ui/Modal'
import React, { useEffect } from 'react'
import { useState } from 'react'
import Dropdown from '../../../../components/Dropdown'

const FormLayout = ({ onSubmit, buttonText = 'Tambah Pemindahan Saldo', initialData = {} }) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState(initialData)

  // Sample current user (would come from auth context in real app)
  const currentUser = {
    name: 'Ahmad Sulaiman',
    role: 'Admin'
  }

  // Platform options
  const platformOptions = [
    'BRI',
    'BNI',
    'Mandiri',
    'BTN',
    'DANA',
    'OVO',
    'GoPay',
    'ShopeePay',
    'LinkAja'
  ]

  // Format currency
  const formatRupiah = (value) => {
    if (!value) return ''

    // Remove all non-numeric characters
    const numeric = value.toString().replace(/[^0-9]/g, '')

    // Format as currency
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(numeric)
  }

  // Extract numeric value from formatted string
  const extractNumeric = (formattedValue) => {
    if (!formattedValue) return ''
    return formattedValue.toString().replace(/[^0-9]/g, '')
  }

  useEffect(() => {
    // Auto-fill user when modal opens
    if (modalOpen) {
      setFormData((prevData) => ({
        ...prevData,
        user: currentUser.name
      }))
    }
  }, [modalOpen])

  const handleInputChange = (e) => {
    const { name, value } = e.target

    // Special handling for amount and operational fields
    if (name === 'amount' || name === 'operational'|| name === 'senderBalance' || name === 'receiverBalance') {
      const numericValue = extractNumeric(value)
      setFormData({
        ...formData,
        [name]: formatRupiah(numericValue),
        [`${name}Raw`]: numericValue // Store raw value for submission
      })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handlePlatformChange = (selectedPlatform) => {
    setFormData({
      ...formData,
      platform: selectedPlatform
    })
  }

  const handleSubmit = () => {
    // Prepare data for submission - extract raw values from formatted currency
    const submissionData = {
      ...formData,
      amount: formData.amountRaw || extractNumeric(formData.amount),
      operational: formData.operationalRaw || extractNumeric(formData.operational)
    }

    onSubmit(submissionData)
    setModalOpen(false)

    // Reset form data after submission
    setFormData({
      user: '',
      platform: '',
      senderBalance: '',
      receiverBalance: '',
      amount: '',
      operational: '',
      description: ''
    })
  }

  return (
    <>
      <div className="w-full flex justify-end">
        <ButtonInput size="md" onClick={() => setModalOpen(true)}>
          <HiPlus size={18} />
          {buttonText}
        </ButtonInput>
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit}>
        <InputField
          name="user"
          type="text"
          value={formData.user || currentUser.name}
          onChange={handleInputChange}
          disabled={true}
          className="bg-gray-100" // Visual indication that it's read-only
        >
          User Pemindah
        </InputField>

        <div className="col-span-2 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
          <Dropdown
            className="w-full"
            label="Pilih Platform"
            value={formData.platform}
            items={platformOptions}
            onChange={handlePlatformChange}
          />
        </div>

        <InputField
          name="senderBalance"
          type="text"
          value={formData.senderBalance || ''}
          onChange={handleInputChange}
        >
          Saldo Pengirim
        </InputField>

        <InputField
          name="receiverBalance"
          type="text"
          value={formData.receiverBalance || ''}
          onChange={handleInputChange}
        >
          Saldo Penerima
        </InputField>

        <InputField
          name="amount"
          type="text" // Changed from number to text to allow formatting
          value={formData.amount || ''}
          onChange={handleInputChange}
          placeholder="Rp 0"
        >
          Nominal
        </InputField>

        <InputField
          name="operational"
          type="text" // Changed from number to text to allow formatting
          value={formData.operational || ''}
          onChange={handleInputChange}
          placeholder="Rp 0"
        >
          Operasional
        </InputField>

        <InputField
          name="description"
          className="col-span-2"
          value={formData.description || ''}
          onChange={handleInputChange}
        >
          Keterangan
        </InputField>
      </Modal>
    </>
  )
}

export default FormLayout
