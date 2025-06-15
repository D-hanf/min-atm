import React, { useState } from 'react'

import ButtonInput from '../../../../components/ButtonInput'
import { HiPlus } from 'react-icons/hi'
import InputField from '../../../../components/InputField'
import Modal from '../../../../shared/ui/Modal'
import SelectItems from '../../../../components/SelectItems'

const FormLayout = ({ onSubmit }) => {
  const [modalOpen, setModalOpen] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    phone: '',
    address: '',
    role: '',
  })

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    onSubmit(formData)
    setModalOpen(false)
    setFormData({
      name: '',
      username: '',
      password: '',
      phone: '',
      address: '',
      role: '',
    })
  }

  return (
    <>
      <div>
        <ButtonInput size="xs" onClick={() => setModalOpen(true)}>
          <HiPlus size={18} />
          Tambah Karyawan
        </ButtonInput>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit}>
        <InputField
          name="name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required={true}
        >
          Nama
        </InputField>

        <InputField
        required={true}
          name="username"
          value={formData.username}
          onChange={(e) => handleChange('username', e.target.value)}
        >
          Username
        </InputField>

        <InputField
          name="password"
          type="password"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
        >
          Password
        </InputField>

        <InputField
          name="phone"
          type="number"
          placeholder="08xxxxxxxx"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
        >
          No. Telp
        </InputField>

        <InputField
          name="address"
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
        >
          Alamat
        </InputField>

        <InputField   value={formData.role}
          onChange={(e) => handleChange('role', e.target.value)}
        name='role'>
          Jabatan
        </InputField>
      </Modal>
    </>
  )
}

export default FormLayout
