import React from 'react'
import { useTheme } from '../context/ThemeContext'

const RupiahInput = ({ label, name, value = '', onChange, required = true, error = '' }) => {
  const { isDark } = useTheme()

  const handleChange = (e) => {
    // Extract numeric value
    const numericValue = e.target.value.replace(/[^\d]/g, '')

    // Call the onChange with the raw numeric value
    onChange({
      target: {
        name,
        value: numericValue
      }
    })
  }

  // Format the display value with Rupiah formatting
  const displayValue = value
    ? new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value)
    : ''

  return (
    <div className="mb-4">
      <label
        htmlFor={name}
        className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        id={name}
        name={name}
        value={displayValue}
        onChange={handleChange}
        className={`w-full px-3 py-2 border ${
          isDark
            ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
            : 'border-gray-300 bg-white text-gray-800 placeholder-gray-500'
        } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-500' : ''
        }`}
        placeholder="Rp 0"
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
}

export default RupiahInput
