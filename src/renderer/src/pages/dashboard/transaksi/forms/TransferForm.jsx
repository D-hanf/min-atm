import React, { useState } from 'react'
import InputField from '../../../../components/InputField'
import SelectItems from '../../../../components/SelectItems'

const TransferForm = ({ formData, onChange }) => {
  const [nominalError, setNominalError] = useState('')
  const [feeType, setFeeType] = useState('Digital')

  // Format number to Rupiah
  const formatRupiah = (value) => {
    if (!value) return ''

    // Remove non-numeric characters
    const numericValue = value.toString().replace(/[^0-9]/g, '')

    // Format to Indonesian Rupiah
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numericValue)
  }

  // Handle currency input change
  const handleCurrencyChange = (e) => {
    const { name, value } = e.target

    // Remove currency formatting to get numeric value
    const numericValue = value.replace(/[^0-9]/g, '')

    // Validate nominal (initialBalance) - max 10,000,000
    if (name === 'initialBalance') {
      const numValue = parseInt(numericValue) || 0
      if (numValue > 10000000) {
        return // Don't update if exceeds limit
      }

      // Update nominal
      onChange({
        target: { name: 'initialBalance', value: numericValue }
      })

      return
    }

    // Create synthetic event with numeric value for the parent handler
    const syntheticEvent = {
      target: {
        name,
        value: numericValue
      }
    }

    onChange(syntheticEvent)
  }

  // Handle nominal change and auto-update fee
  const handleNominalChange = (e) => {
    const { value } = e.target
    const numericValue = value.replace(/[^0-9]/g, '')
    let numValue = parseInt(numericValue) || 0

    // Cap at maximum and show error
    if (numValue > 10000000) {
      numValue = 10000000
      setNominalError('Tidak boleh melebihi Rp 10.000.000')
    } else {
      setNominalError('')
    }

    // Auto-update fee based on nominal amount
    const newFee = numValue > 5000000 ? '5000' : '2500'

    // Update both values
    onChange({
      target: { name: 'initialBalance', value: numValue.toString() }
    })

    // Update fee if it's different from current
    if (formData.amount !== newFee) {
      onChange({
        target: { name: 'amount', value: newFee }
      })
    }
  }

  // Handle fee type change
  const handleFeeTypeChange = (e) => {
    setFeeType(e.target.value)
  }

  return (
    <>
      {/* Transaction Number Header */}
      <div className="bg-gray-50 p-4 rounded-lg mb-4 border-l-4 border-blue-500">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Nomor Transaksi:</span>
          <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
            {formData.transactionNumber || 'Generating...'}
          </span>
        </div>
      </div>

      {/* <InputField
        name="date"
        type="date"
        value={formData.date || new Date().toISOString().split('T')[0]}
        onChange={onChange}
      >
        Tanggal
      </InputField> */}

      <SelectItems
        options={[
          { label: 'Briva', value: 'Briva' },
          { label: 'Antar Bank', value: 'Antar Bank' },
          { label: 'Sesama Bank', value: 'Sesama Bank' }
        ]}
        label="Tipe Transaksi"
        name="transactionType"
        value={formData.transactionType || ''}
        onChange={onChange}
      />

      <SelectItems
        options={[
          { label: 'Laci', value: 'Laci' },
          { label: 'Dana', value: 'Dana' },
          { label: 'BRI', value: 'BRI' },
          { label: 'BNI', value: 'BNI' },
          { label: 'BCA', value: 'BCA' },
          { label: 'Mandiri', value: 'Mandiri' }
        ]}
        label="Sumber Dana"
        name="fundSource"
        value={formData.fundSource || ''}
        onChange={onChange}
      />

      <SelectItems
        options={[
          { label: 'Dana', value: 'Dana' },
          { label: 'BRI', value: 'BRI' },
          { label: 'BNI', value: 'BNI' },
          { label: 'BCA', value: 'BCA' },
          { label: 'Mandiri', value: 'Mandiri' }
        ]}
        label="Terima Dana"
        name="receiveFund"
        value={formData.receiveFund || ''}
        onChange={onChange}
      />

      <div>
        <InputField
          name="initialBalance"
          type="text"
          value={formatRupiah(formData.initialBalance)}
          onChange={handleNominalChange}
          placeholder="Rp 0"
        >
          Nominal
        </InputField>
        {nominalError && <p className="mt-1 text-sm text-red-600">{nominalError}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Fee</label>
        <div className="relative">
          <input
            name="fee"
            type="text"
            value={formatRupiah(formData.amount || '2500')}
            onChange={handleCurrencyChange}
            placeholder="Rp 2.500"
            className="w-full pl-3 pr-24 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={feeType}
            onChange={handleFeeTypeChange}
            className="absolute right-0 top-0 h-full px-3 py-2 border-l border-gray-300 bg-gray-50 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Digital">Digital</option>
            <option value="Cash">Cash</option>
          </select>
        </div>
      </div>

      {/* Large textarea for description */}
      <div className="col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">Keterangan</label>
        <textarea
          name="description"
          rows={4}
          value={formData.description || ''}
          onChange={onChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
          placeholder="Masukkan keterangan transaksi..."
        />
      </div>
    </>
  )
}

export default TransferForm
