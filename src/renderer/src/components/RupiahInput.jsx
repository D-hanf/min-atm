import React from 'react'

const RupiahInput = ({ name, value, onChange, label, placeholder, error }) => {
  // Format number to Rupiah for display only
  const formatRupiah = (value) => {
    if (!value || value === '') return ''

    // Format to Indonesian Rupiah
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // Handle input change - extract numbers only
  const handleChange = (e) => {
    const rawValue = e.target.value

    // Remove all non-numeric characters, including the currency formatting
    const numericOnly = rawValue.replace(/[^0-9]/g, '')

    // Call the parent's onChange with the numeric value
    onChange({
      target: {
        name,
        value: numericOnly
      }
    })
  }

  return (
    <div className="">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <input
        type="text"
        name={name}
        value={value ? formatRupiah(value) : ''}
        onChange={handleChange}
        placeholder={placeholder || 'Rp 0'}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

export default RupiahInput
