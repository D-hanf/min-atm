import ConfirmDialog from '../components/ConfirmDialog'
import FormLayout from '../features/dashboard/ui/kelola-toko/FormLayout'
import React from 'react'
import TableContent from '../features/dashboard/ui/kelola-toko/TableContent'
import { useState } from 'react'

const dataToko = []

const KelolaToko = () => {
  // state to manage data toko
  const [data, setData] = useState(dataToko)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

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
    setData((prev) => [...prev, newData])
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
        onEdit={(item) => console.log('Edit', item)}
        onDelete={handleDelete}
      />

      {/* pop up confirm to delete */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmDelete}
      />
    </>
  )
}

export default KelolaToko
