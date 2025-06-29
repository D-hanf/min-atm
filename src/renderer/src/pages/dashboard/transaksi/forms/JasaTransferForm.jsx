import React, { useEffect, useState } from 'react'

import InputField from '../../../../components/InputField'
import SelectItems from '../../../../components/SelectItems'
import { useTheme } from '../../../../context/ThemeContext'

const JasaTransferForm = ({ formData, onChange }) => {
  const { isDark } = useTheme()
  const [sumberDanaList, setSumberDanaList] = useState([])
  const [manualFee, setManualFee] = useState(false)

  // Ambil data sumber dana dari DB
  const fetchSaldo = async () => {
    try {
      const result = await window.api.getSaldoAwal()
      setSumberDanaList(result)
    } catch (error) {
      console.error('❌ Gagal ambil data saldo:', error)
    }
  }

  useEffect(() => {
    fetchSaldo()
  }, [])

  // Set default fee sekali saat load
  useEffect(() => {
    if (!formData.fee) {
      onChange({
        target: { name: 'fee', value: 5000 }
      })
    }
  }, [])

  // Set default sumber_dana_id ke laci (kalau belum ada)
  useEffect(() => {
    const laci = sumberDanaList.find((item) => item.nama_sumber_dana.toLowerCase() === 'laci')
    if (laci && !formData.sumber_dana_id) {
      onChange({
        target: {
          name: 'sumber_dana_id',
          value: laci.id
        }
      })
    }
  }, [sumberDanaList])

  // Sinkronisasi metode_pembayaran ke sumber_dana_id dan terima_dana_id
  useEffect(() => {
    if (formData.metode_pembayaran) {
      onChange({
        target: { name: 'sumber_dana_id', value: formData.metode_pembayaran }
      })
      onChange({
        target: { name: 'terima_dana_id', value: formData.metode_pembayaran }
      })
    }
  }, [formData.metode_pembayaran])

  return (
    <>
      {/* Header Nomor Transaksi */}
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
        name="date"
        type="date"
        value={formData.date || new Date().toISOString().split('T')[0]}
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
      {/* Hidden: Sumber Dana */}
      <SelectItems
        hidden={true}
        options={sumberDanaList.map((item) => ({
          label: item.nama_sumber_dana,
          value: item.id
        }))}
        label=""
        name="sumber_dana_id"
        value={formData.sumber_dana_id || ''}
        onChange={onChange}
      />

      {/* Hidden: Terima Dana */}
      <SelectItems
        hidden={true}
        options={sumberDanaList.map((item) => ({
          label: item.nama_sumber_dana,
          value: item.id
        }))}
        label=""
        name="terima_dana_id"
        value={formData.terima_dana_id || ''}
        onChange={onChange}
      />

      {/* Input Fee */}
      <InputField
        name="fee"
        type="text"
        value={
          formData.fee
            ? new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(formData.fee)
            : ''
        }
        onChange={(e) => {
          setManualFee(true)
          const numericFee = parseInt(e.target.value.replace(/[^\d]/g, ''), 10) || 0
          onChange({
            target: { name: 'fee', value: numericFee }
          })
        }}
      >
        Biaya jasa
      </InputField>

      {/* Metode Pembayaran (Fee masuk ke mana) */}
      <SelectItems
        options={sumberDanaList.map((item) => ({
          label: item.nama_sumber_dana,
          value: item.id
        }))}
        label="Metode Pembayaran (Fee Masuk ke)"
        name="metode_pembayaran"
        value={formData.metode_pembayaran || ''}
        onChange={onChange}
        required
      />

      {/* Keterangan */}
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
