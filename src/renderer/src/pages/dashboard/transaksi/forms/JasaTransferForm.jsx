import React, { useEffect, useState } from 'react'

import InputField from '../../../../components/InputField'
import SelectItems from '../../../../components/SelectItems'

const JasaTransferForm = ({ formData, onChange }) => {
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

  return (
    <>
      {/* Header Nomor Transaksi */}
      <div className="bg-gray-50 p-4 rounded-lg mb-4 border-l-4 border-blue-500">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Nomor Transaksi:</span>
          <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
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
        options={sumberDanaList.map((item) => ({
          label: item.nama_sumber_dana,
          value: item.id
        }))}
        label="Sumber Dana"
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
      >
        Keterangan
      </InputField>
    </>
  )
}

export default JasaTransferForm
