import React from 'react'
import InputField from '../../../../components/InputField'
import SelectItems from '../../../../components/SelectItems'

const TransferForm = ({ formData, onChange }) => {
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

    // Create synthetic event with numeric value for the parent handler
    const syntheticEvent = {
      target: {
        name,
        value: numericValue
      }
    }

    onChange(syntheticEvent)
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

      <InputField
        name="nominal"
        type="text"
        value={formatRupiah(formData.nominal)}
        onChange={handleCurrencyChange}
        placeholder="Rp 0"
      >
        Nominal
      </InputField>

      <InputField
        name="adminLoket"
        type="text"
        value={formatRupiah(formData.adminLoket)}
        onChange={handleCurrencyChange}
        placeholder="Rp 0"
      >
        Admin Loket
      </InputField>

      <InputField
        name="adminBank"
        type="text"
        value={formatRupiah(formData.adminBank)}
        onChange={handleCurrencyChange}
        placeholder="Rp 0"
      >
        Admin Bank
      </InputField>

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
