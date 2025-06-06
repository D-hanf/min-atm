import ConfirmDialog from '../components/ConfirmDialog'
import FormLayout from '../features/dashboard/ui/kelola-toko/FormLayout'
import InputField from '../components/InputField'
import ModalEdit from '../../src/shared/ui/Modal'
import React from 'react'
import TableContent from '../features/dashboard/ui/kelola-toko/TableContent'
import { useState } from 'react'

const dataToko = [
  { id: 1, namaToko: 'Toko A', noTlp: '08123456789', alamat: 'Jl. A', jumlahKaryawan: 10 },
  { id: 2, namaToko: 'Toko B', noTlp: '08123456789', alamat: 'Jl. B', jumlahKaryawan: 20 },
  { id: 3, namaToko: 'Toko C', noTlp: '08123456789', alamat: 'Jl. C', jumlahKaryawan: 30 }
]

const KelolaToko = () => {
  // state to manage data toko
  const [data, setData] = useState(dataToko)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    namaToko: '',
    noTlp: '',
    alamat: '',
    jumlahKaryawan: 0
  })

  // function to handle delete action
  const handleDelete = (id) => {
    setDeleteId(id)
    setShowConfirmDialog(true)
  }

  const confirmDelete = () => {
    setData((prev) => prev.filter((item) => item.id !== deleteId))
    setShowConfirmDialog(false)
    setDeleteId(null)
  }

  // function to handle form submit
  const handleFormSubmit = (formData) => {
    const newData = {
      id: Date.now(), // unique id based on timestamp
      namaToko: formData.namaToko,
      noTlp: formData.noTlp,
      alamat: formData.alamat,
      jumlahKaryawan: Number(formData.jumlahKaryawan || 0)
    }
    setData((data) => [...data, newData])
  }

  const handleEdit = (id) => {
    const itemToEdit = data.find((item) => item.id === id)
    if (itemToEdit) {
      setFormData(itemToEdit)
      setModalOpen(true)
    }
  }

  return (
    <>
      <div className="flex justify-end mb-4 w-full">
        {/* add new data */}
        <FormLayout onSubmit={handleFormSubmit}></FormLayout>
      </div>

      {/* show all data  */}
      <TableContent
        data={data}
        columns={[
          { key: 'namaToko', label: 'Nama Toko' },
          { key: 'noTlp', label: 'No. Telp' },
          { key: 'jumlahKaryawan', label: 'Jumlah Karyawan' },
          { key: 'alamat', label: 'Alamat' }
        ]}
        // onEdit={(item) => console.log('Edit', item)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* pop up confirm to delete */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmDelete}
      />

      <ModalEdit
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(updatedData) => {
          setData((prevData) =>
            prevData.map((item) => (item.id === formData.id ? { ...item, ...updatedData } : item))
          )
          setModalOpen(false)
          setFormData({ namaToko: '', noTlp: '', alamat: '', jumlahKaryawan: 0 })
        }}
      >
        <InputField
          name="namaToko"
          value={formData.namaToko}
          onChange={(e) => setFormData({ ...formData, namaToko: e.target.value })}
        >
          Nama Toko
        </InputField>
        <InputField
          name="noTlp"
          value={formData.noTlp}
          type="number"
          onChange={(e) => setFormData({ ...formData, noTlp: e.target.value })}
        >
          No. Telp
        </InputField>
        <InputField
          name="jumlahKaryawan"
          value={formData.jumlahKaryawan}
          type="number"
          onChange={(e) => setFormData({ ...formData, jumlahKaryawan: e.target.value })}
        >
          Jumlah Karyawan
        </InputField>
        <InputField
          name="alamat"
          value={formData.alamat}
          onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
        >
          Alamat
        </InputField>
      </ModalEdit>
    </>
  )
}

export default KelolaToko
