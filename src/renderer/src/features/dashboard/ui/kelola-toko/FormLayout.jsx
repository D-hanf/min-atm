import ButtonInput from '../../../../components/ButtonInput'
import InputField from '../../../../components/InputField'
import Modal from '../../../../shared/ui/Modal'
import React from 'react'
import { useState } from 'react'

const FormLayout = ({ isOpen, onClose, onSubmit, children }) => {
  const [modalOpen, setModalOpen] = useState(false)

  const handleFormSubmit = (data) => {
    console.log('Form submitted:', data)
  }
  return (
    <>
      <div className="w-1/5">
        <ButtonInput size="sm" onClick={() => setModalOpen(true)}>
          Tambah toko
        </ButtonInput>
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleFormSubmit}>
        <InputField name="nama">Nama</InputField>
        <InputField name="noTelp">No.Telp</InputField>
        <InputField name="alamat">alamat</InputField>
      </Modal>
    </>
  )
}

export default FormLayout
