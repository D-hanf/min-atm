import React, { useEffect, useState } from 'react'

import InputField from '../../../../components/InputField'
import SelectItems from '../../../../components/SelectItems'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import { useTheme } from '../../../../context/ThemeContext'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)
const JasaTransferForm = ({ formData, onChange }) => {
  const { isDark } = useTheme()
  const [sumberDanaList, setSumberDanaList] = useState([])
  const getTodayWIB = () => {
  return dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD')
}
  useEffect(() => {
    const fetchSaldo = async () => {
      try {
        const result = await window.api.getSaldoAwal()
        setSumberDanaList(result)
      } catch (error) {
        console.error('❌ Gagal ambil data saldo:', error)
      }
    }
    fetchSaldo()
  }, [])

  useEffect(() => {
    if (!formData.fee) {
      onChange({ target: { name: 'fee', value: 5000 } })
    }
  }, [])

  // Sinkronkan sumber dana agar sama dengan metode pembayaran
  useEffect(() => {
    if (formData.metode_pembayaran) {
      onChange({ target: { name: 'sumber_dana_id', value: formData.metode_pembayaran } })
    }
  }, [formData.metode_pembayaran])

  const formatFee = (value) =>
    value
      ? new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0
        }).format(value)
      : ''

  const handleFeeChange = (e) => {
    const numericFee = parseInt(e.target.value.replace(/[^\d]/g, ''), 10) || 0
    onChange({ target: { name: 'fee', value: numericFee } })
  }

  return (
    <>
      {/* Nomor Transaksi */}
      <div
        className={`${isDark ? 'bg-gray-700 border-blue-700' : 'bg-gray-50 border-blue-500'} p-4 rounded-lg mb-4 border-l-4`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Nomor Transaksi:
          </span>
          <span
            className={`${isDark ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-800'} text-sm font-semibold px-3 py-1 rounded-full`}
          >
            {formData.transactionNumber || 'Generating...'}
          </span>
        </div>
      </div>

      <InputField
        name="tanggal"
        type="date"
        value={formData.date ||getTodayWIB()}
        onChange={onChange}
      >
        Tanggal
      </InputField>

      <InputField
        name="nama_pelanggan"
        type="text"
        value={formData.nama_pelanggan || ''}
        onChange={onChange}
      >
        Nama Pelanggan
      </InputField>

      <InputField
        name="nomor_tujuan"
        type="text"
        value={formData.nomor_tujuan || ''}
        onChange={onChange}
      >
        Nomor Rekening Tujuan
      </InputField>

      {/* Metode Pembayaran */}
      <SelectItems
        options={sumberDanaList.map((item) => ({
          label: item.nama_sumber_dana,
          value: item.id
        }))}
        label="Metode Pembayaran"
        name="metode_pembayaran"
        value={formData.metode_pembayaran || ''}
        onChange={(e) => {
          const id = e.target.value
          onChange({ target: { name: 'metode_pembayaran', value: id } })
        }}
      />

      {/* Fee */}
      <InputField
        name="fee"
        type="text"
        value={formatFee(formData.fee)}
        onChange={handleFeeChange}
      >
        Biaya Jasa
      </InputField>

      <InputField
        name="description"
        type="text"
        value={formData.description || ''}
        onChange={onChange}
        required={false}
      >
        Keterangan
      </InputField>
    </>
  )
}

export default JasaTransferForm
