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

  // Set default sumber_dana_id ke 1
  useEffect(() => {
    if (!formData.sumber_dana_id) {
      onChange({
        target: { name: 'sumber_dana_id', value: 1 }
      })
    }
  }, [])

  // Set default fee sekali saat load
  useEffect(() => {
    if (!formData.fee) {
      onChange({
        target: { name: 'fee', value: 5000 }
      })
    }
  }, [])

  useEffect(() => {
    if (
      sumberDanaList.length > 0 &&
      !formData.sumber_dana_id // jika belum dipilih
    ) {
      onChange({
        target: {
          name: 'sumber_dana_id',
          value: sumberDanaList[0].id
        }
      })
    }
  }, [sumberDanaList])

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
      <SelectItems
        className="hidden"
        options={sumberDanaList.map((item) => ({
          label: item.nama_sumber_dana,
          value: item.id
        }))}
        label=""
        name="sumber_dana_id"
        value={formData.sumber_dana_id || ''}
        onChange={onChange}
      />
      <SelectItems
        options={sumberDanaList.map((item) => ({
          label: item.nama_sumber_dana,
          value: item.id
        }))}
        label="Terima Dana"
        name="terima_dana_id"
        value={formData.terima_dana_id || ''}
        onChange={onChange}
        required
      />

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
        Fee
      </InputField>

      <InputField
        name="description"
        type="text"
        value={formData.description || ''}
        onChange={onChange}
        required={false}      >
        Keterangan
      </InputField>
    </>
  )
}

export default JasaTransferForm
