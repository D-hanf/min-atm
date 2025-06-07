import ButtonInput from '../../../../components/ButtonInput'
import InputField from '../../../../components/InputField'
import Modal from '../../../../shared/ui/Modal'
import React from 'react'
import { useState } from 'react'

const FormLayout = ({ onSubmit }) => {
  const [modalOpen, setModalOpen] = useState(false)
  return (
    <>
      <div className="w-1/5">
        <ButtonInput size="sm" onClick={() => setModalOpen(true)}>
          Tambah toko
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
        <InputField name="namaToko">Nama toko</InputField>
        <InputField placeholder={'08xxxxxxxx'} type='number' name="noTlp">No.Telp</InputField>   
        <InputField name="jumlahKaryawan"type='number'>Jumlah Karyawan</InputField>   
        <InputField name="alamat" className="">
          alamat
        </InputField>
      </Modal>
    </>
  )
}

export default FormLayout
