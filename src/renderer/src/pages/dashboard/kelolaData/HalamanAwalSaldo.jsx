import React, { useState } from 'react'

import ButtonInput from '../../../components/ButtonInput'
import Dropdown from '../../../components/Dropdown'
import SearchField from '../../../components/SearchField'
import TableContent from '../../../components/TableContent'

const HalamanAwalSaldo = () => {
  const [stores, setStores] = useState([
    {
      id: 1,
      name: 'Toko Pusat',
      totalEmployees: 8,
      address: 'Jl. Raya Pusat No. 123',
      phone: '081234567890'
    },
    {
      id: 2,
      name: 'Cabang Malang',
      totalEmployees: 5,
      address: 'Jl. Soekarno Hatta No. 45, Malang',
      phone: '081234567891'
    },
    {
      id: 3,
      name: 'Cabang Surabaya',
      totalEmployees: 6,
      address: 'Jl. Pemuda No. 56, Surabaya',
      phone: '081234567892'
    },
    {
      id: 4,
      name: 'Cabang Jakarta',
      totalEmployees: 10,
      address: 'Jl. Sudirman No. 78, Jakarta',
      phone: '081234567893'
    }
  ])
  const [saldo, setSaldo] = useState([
    {
      id: 1,
      source: 'DANA',
      saldo: 1000000,
      dateCreated: '2023-10-01',
      dateUpdated: '2023-10-01',
      description: 'Saldo di Dana'
    },
    {
      id: 2,
      source: 'CASH',
      saldo: 5000000,
      dateCreated: '2023-10-02',
      dateUpdated: '2023-10-02',
      description: 'Saldo awal yang tersedia di kasir'
    },
    {
      id: 3,
      source: 'BTN',
      saldo: 7500000,
      dateCreated: '2023-10-03',
      dateUpdated: '2023-10-03',
      description: 'Saldo awal di Bank BTN'
    }
  ])

  const columns = [
    { key: 'source', label: 'Sumber' },
    { key: 'saldo', label: 'Saldo' },
    { key: 'dateCreated', label: 'Tanggal Dibuat' },
    { key: 'dateUpdated', label: 'Tanggal Diubah' },
    { key: 'description', label: 'Deskripsi' }
  ]

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  const formattedSaldo = saldo.map((item) => ({
    ...item,
    saldo: formatRupiah(item.saldo)
  }))

  return (
    <>
      <div className="flex w-full gap-4 items-center mb-4">
        <div className="flex w-full h-full align-middle  gap-4 items-center">
          <SearchField placeholder={'Search'}></SearchField>
          <Dropdown
            className="my-auto"
            label={'Pindah Toko'}
            items={stores.map((store) => store.name)}
          ></Dropdown>
        </div>
      </div>
      <div>
        <TableContent data={formattedSaldo} columns={columns}></TableContent>
      </div>
    </>
  )
}
export default HalamanAwalSaldo