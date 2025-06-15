import ButtonInput from '../../../../components/ButtonInput'
import { HiPlus } from 'react-icons/hi'
import InputField from '../../../../components/InputField'
import Modal from '../../../../shared/ui/Modal'
import React from 'react'
import { useState } from 'react'

const FormLayout = ({ onSubmit }) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
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
      name: '',
      phone: '',
      totalEmployees: 0,
      address: ''
    })
    setModalOpen(false)
  }
  return (
    <>
      <div className="">
        <ButtonInput size="xs" onClick={() => setModalOpen(true)}>
          <HiPlus size={18} />
          Tambah toko
        </ButtonInput>
      </div>
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      >
        <InputField name="name" value={formData.name} onChange={handleChange}>Nama toko</InputField>
        <InputField placeholder={'08xxxxxxxx'} type="number" name="phone" onChange={handleChange} value={formData.phone}>
          No.Telp
        </InputField>
        <InputField name="address" className="" onChange={handleChange} value={formData.address}>
          alamat
        </InputField>
      </Modal>
    </>
  )
}

export default FormLayout
