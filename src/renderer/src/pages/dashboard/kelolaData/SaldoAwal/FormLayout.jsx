import React, { useState } from 'react'

import ButtonInput from '../../../../components/ButtonInput'
import { HiPlus } from 'react-icons/hi'
import InputField from '../../../../components/InputField'
import Modal from '../../../../shared/ui/Modal'
import { useTheme } from '../../../../context/ThemeContext'

const FormLayout = ({ onSubmit }) => {
  const { isDark } = useTheme()
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    source: '',
    saldo: '',
    biaya_admin: '',
    description: ''
  })

  const formatRupiah = (value) => {
    if (!value || value === '') return ''
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  // Initialize modal with formatted empty values
  const handleOpenModal = () => {
    setFormData({
      source: '',
      saldo: formatRupiah(0),
      biaya_admin: formatRupiah(0),
      description: ''
    })
    setModalOpen(true)
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    // For fields that need Rupiah formatting
    if (name === 'biaya_admin' || name === 'saldo') {
      // Remove non-numeric characters for processing
      const numericValue = value.replace(/[^0-9]/g, '')

      if (numericValue === '') {
        setFormData((prev) => ({
          ...prev,
          [name]: formatRupiah(0) // Show Rp 0 instead of empty
        }))
      } else {
        // Format as Rupiah for display
        const formattedValue = formatRupiah(numericValue)
        setFormData((prev) => ({
          ...prev,
          [name]: formattedValue
        }))
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = () => {
    // Clean up biaya_admin and saldo values before submission
    const cleanedFormData = {
      ...formData,
      saldo: formData.saldo ? formData.saldo.replace(/[^0-9]/g, '') : '0',
      biaya_admin: formData.biaya_admin ? formData.biaya_admin.replace(/[^0-9]/g, '') : '0'
    }
    onSubmit(cleanedFormData)
    setModalOpen(false)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    // Reset form data when closing
    setFormData({
      source: '',
      saldo: '',
      biaya_admin: '',
      description: ''
    })
  }

  return (
    <>
      <div className="w-full flex justify-end">
        <ButtonInput size="xs" onClick={handleOpenModal}>
          <HiPlus size={18} />
          Tambah Sumber Dana
        </ButtonInput>
      </div>
      <Modal isOpen={modalOpen} onClose={handleCloseModal} onSubmit={handleSubmit}>
        <InputField
          name="source"
          type="text"
          value={formData.source}
          onChange={handleChange}
          placeholder="Contoh: BCA, Mandiri, Gopay"
          required
        >
          Sumber Dana
        </InputField>

        <InputField
          name="saldo"
          type="text"
          value={formData.saldo}
          onChange={handleChange}
          placeholder="Rp 0"
          required
        >
          Jumlah Saldo
        </InputField>

        <InputField
          name="biaya_admin"
          type="text"
          value={formData.biaya_admin}
          onChange={handleChange}
          placeholder="Rp 0"
        >
          Biaya Admin
        </InputField>

        <InputField
          name="description"
          className="col-span-2"
          type="text"
          value={formData.description}
          onChange={handleChange}
          required={false}
          placeholder="Tambahkan keterangan (opsional)"
        >
          Keterangan
        </InputField>
      </Modal>
    </>
  )
}

export default FormLayout
