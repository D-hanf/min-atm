import ButtonInput from '../../../../components/ButtonInput'
import { HiPlus } from 'react-icons/hi'
import InputField from '../../../../components/InputField'
import Modal from '../../../../shared/ui/Modal'
import React from 'react'
import { useState } from 'react'

const FormLayout = ({ onSubmit }) => {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <div className="w-full flex justify-end">
        <ButtonInput size="md" onClick={() => setModalOpen(true)}>
          <HiPlus size={18} />
          Tambah Sumber Dana
        </ButtonInput>
      </div>
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(data) => {
          onSubmit(data)
          setModalOpen(false)
        }}
      >
        <InputField name="source" type="text">
          Sumber Dana
        </InputField>
        <InputField name="saldo" type="number">
          Jumlah Saldo
        </InputField>
        <InputField name="description" className="col-span-2">
          Keterangan
        </InputField>
      </Modal>
    </>
  )
}

export default FormLayout
