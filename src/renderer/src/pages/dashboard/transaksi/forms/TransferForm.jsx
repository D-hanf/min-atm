import React, { useState, useEffect } from 'react'
import InputField from '../../../../components/InputField'
import SelectItems from '../../../../components/SelectItems'
import RupiahInput from '../../../../components/RupiahInput'

const TransferForm = ({ formData, onChange }) => {
  const [nominalError, setNominalError] = useState('')
  const [feeType, setFeeType] = useState('Digital')

  // Handle fee type change
  const handleFeeTypeChange = (e) => {
    setFeeType(e.target.value)
  }

  // Update fee based on nominal amount
  useEffect(() => {
    // Set default fee if not already set
    if (!formData.amount) {
      onChange({
        target: { name: 'amount', value: '2500' }
      })
    }

    if (formData.initialBalance) {
      const numValue = parseInt(formData.initialBalance, 10)
      if (!isNaN(numValue)) {
        // Set fee based on nominal
        const newFee = numValue > 5000000 ? '5000' : '2500'

        // Only update if different
        if (formData.amount !== newFee) {
          onChange({
            target: { name: 'amount', value: newFee }
          })
        }

        // Set error if exceeds maximum
        if (numValue > 10000000) {
          setNominalError('Tidak boleh melebihi Rp 10.000.000')
          onChange({
            target: { name: 'initialBalance', value: '10000000' }
          })
        } else {
          setNominalError('')
        }
      }
    }
  }, [formData.initialBalance, formData.amount])

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

      {/* New RupiahInput component */}
      <RupiahInput
        name="initialBalance"
        value={formData.initialBalance}
        onChange={onChange}
        label="Nominal"
        error={nominalError}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Fee</label>
        <div className="relative">
          <input
            name="fee"
            type="text"
            value={
              formData.amount
                ? new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(formData.amount)
                : ''
            }
            readOnly
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
