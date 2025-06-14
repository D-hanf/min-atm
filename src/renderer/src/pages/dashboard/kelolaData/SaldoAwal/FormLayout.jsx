import React, { useState } from 'react'

import ButtonInput from '../../../../components/ButtonInput'
import { HiPlus } from 'react-icons/hi'
import InputField from '../../../../components/InputField'
import Modal from '../../../../shared/ui/Modal'

const FormLayout = ({ onSubmit }) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    source: '',
    saldo: '',
    biaya_admin: '',
    description: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = () => {
    onSubmit(formData)
    setFormData({
      source: '',
      saldo: '',
      biaya_admin: '',
      description: ''
    })
    setModalOpen(false)
  }

  return (
    <>
      <div className="w-full flex justify-end">
        <ButtonInput size="xs" onClick={() => setModalOpen(true)}>
          <HiPlus size={18} />
          Tambah Sumber Dana
        </ButtonInput>
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit}>
        <InputField
          name="source"
          type="text"
          value={formData.source}
          onChange={handleChange}
          required
        >
          Sumber Dana
        </InputField>

        <InputField
          name="saldo"
          type="number"
          value={formData.saldo}
          onChange={handleChange}
          required
        >
          Jumlah Saldo
        </InputField>

        <InputField
          name="biaya_admin"
          type="number"
          value={formData.biaya_admin}
          onChange={handleChange}
        >
          Biaya Admin
        </InputField>

        <InputField
          name="description"
          className="col-span-2"
          type="text"
          value={formData.description}
          onChange={handleChange}
        >
          Keterangan
        </InputField>
      </Modal>
    </>
  )
}

export default FormLayout
