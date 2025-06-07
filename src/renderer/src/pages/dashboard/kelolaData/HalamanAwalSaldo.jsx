import React, { useState } from 'react'

import Dropdown from '../../../components/Dropdown'
import SearchField from '../../../components/SearchField'

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


  return (
    <>
      <div className="flex w-full gap-4 items-center mb-4">
        <div className="flex w-full h-full align-middle  gap-4 items-center">
          <SearchField placeholder={'Search'}></SearchField>
          <Dropdown className="my-auto" label={'Pindah Toko'} items={stores.map((store) => store.name)}></Dropdown>
        </div>
      </div>
      <div></div>
    </>
  )
}

export default HalamanAwalSaldo
