import ButtonInput from '../../../../components/ButtonInput'
import { HiPlus } from 'react-icons/hi'
import InputField from '../../../../components/InputField'
import Modal from '../../../../shared/ui/Modal'
import React from 'react'
import SelectItems from '../../../../components/SelectItems'
import { useState } from 'react'

const FormLayout = ({ onSubmit }) => {
  const [modalOpen, setModalOpen] = useState(false)
  return (
    <>
      <div className="">
        <ButtonInput size="xs" onClick={() => setModalOpen(true)}>
          <HiPlus size={18} />
          Tambah Karyawan
        </ButtonInput>
      </div>
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(data) => {
          onSubmit(data) // teruskan ke parent (KelolaToko)
          setModalOpen(false)
        }}
      >
        <InputField name="name">Nama</InputField>
        <InputField placeholder={'08xxxxxxxx'} type="number" name="phone">
          No.Telp
        </InputField>
        <InputField name="address" className="">
          alamat
        </InputField>
        <SelectItems
        label='Jabatan'
          options={[
            { label: 'Admin', value: 'admin' },
            { label: 'Kasir', value: 'kasir' },
            { label: 'Manager', value: 'manager' },
          ]}
          />
      </Modal>
    </>
  )
}

export default FormLayout
