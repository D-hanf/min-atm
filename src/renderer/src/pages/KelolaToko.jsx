import ConfirmDialog from '../components/ConfirmDialog'
import FormLayout from '../features/dashboard/ui/kelola-toko/FormLayout'
import React from 'react'
import TableContent from '../features/dashboard/ui/kelola-toko/TableContent'
import { useState } from 'react'

const dataToko = [
  { id: 1, namaToko: 'Toko Maju Jaya', alamat: 'Jakarta', jumlahKaryawan: 10 },
  { id: 2, namaToko: 'Toko Sumber Rezeki', alamat: 'Bandung', jumlahKaryawan: 8 },
  { id: 3, namaToko: 'Toko Sentosa', alamat: 'Surabaya', jumlahKaryawan: 6 },
  { id: 4, namaToko: 'Toko Amanah', alamat: 'Yogyakarta', jumlahKaryawan: 12 },
  { id: 5, namaToko: 'Toko Berkah', alamat: 'Bekasi', jumlahKaryawan: 5 },
  { id: 6, namaToko: 'Toko Makmur', alamat: 'Depok', jumlahKaryawan: 9 },
  { id: 7, namaToko: 'Toko Jaya Abadi', alamat: 'Tangerang', jumlahKaryawan: 7 },
  { id: 8, namaToko: 'Toko Rizki', alamat: 'Semarang', jumlahKaryawan: 4 },
  { id: 9, namaToko: 'Toko Sejahtera', alamat: 'Medan', jumlahKaryawan: 11 },
  { id: 10, namaToko: 'Toko Mandiri', alamat: 'Palembang', jumlahKaryawan: 3 }
]

const formFields = [
  { name: 'namaToko', label: 'Nama Toko', type: 'text', required: true },
  { name: 'alamat', label: 'Alamat', type: 'text', required: true },
  { name: 'jumlahKaryawan', label: 'Jumlah Karyawan', type: 'number', required: true }
]

const KelolaToko = () => {
  const [data, setData] = useState(dataToko)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const handleDelete = (id) => {
    setDeleteId(id)
    setShowConfirmDialog(true)
  }

  const confirmDelete = () => {
    setData((prev) => prev.filter((item) => item.id !== deleteId))
    setShowConfirmDialog(false)
    setDeleteId(null)
  }
  return (
    <>
      <div className="flex justify-end mb-4 w-full">
        <FormLayout></FormLayout>
      </div>
      <TableContent
        data={data}
        columns={[
          { key: 'namaToko', label: 'Nama Toko' },
          { key: 'jumlahKaryawan', label: 'Jumlah Karyawan' },
          { key: 'alamat', label: 'Alamat' }
        ]}
        onEdit={(item) => console.log('Edit', item)}
        onDelete={handleDelete}
      />
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmDelete}
      />
    </>
  )
}

export default KelolaToko
