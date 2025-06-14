import ButtonInput from '../../../../components/ButtonInput'
import { HiPlus } from 'react-icons/hi'
import InputField from '../../../../components/InputField'
import Modal from '../../../../shared/ui/Modal'
import React from 'react'
import SelectItems from '../../../../components/SelectItems'
import { useState } from 'react'

const FormLayout = ({ onSubmit }) => {
  const [modalOpen, setModalOpen] = useState(false)
  const sumberDanaOptions = [
    { value: 'DANA', label: 'DANA' },
    { value: 'CASH', label: 'Cash' },
    { value: 'BTN', label: 'Bank BTN' }
  ]
  const [formData, setFormData] = useState({})
  return (
    <>
      <div className="w-full flex justify-end">
        <ButtonInput size="xs" onClick={() => setModalOpen(true)}>
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
        <SelectItems
          options={sumberDanaOptions}
          name="source"
          label="Sumber Dana"
          value={formData.source}
          onChange={(e) => setFormData({ ...formData, source: e.target.value })}
        />

        <InputField name="saldo" type="number">
          Jumlah Saldo
        </InputField>
        <InputField name="biaya_admin" type="number">
          biaya admin
        </InputField>
        <InputField name="description" className="col-span-2" required={false}>
          Keterangan
        </InputField>
      </Modal>
    </>
  )
}

export default FormLayout
