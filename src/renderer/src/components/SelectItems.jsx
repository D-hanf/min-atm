import React from 'react'
import { useTheme } from '../context/ThemeContext'

const SelectItems = ({ 
  label, 
  name, 
  value, 
  onChange, 
  options = [], 
  required = true 
}) => {
  const { isDark } = useTheme()
  
  return (
    <div className="mb-4">
      <label 
        htmlFor={name} 
        className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full px-3 py-2 border ${
          isDark 
            ? 'border-gray-600 bg-gray-700 text-white' 
            : 'border-gray-300 bg-white text-gray-800'
        } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
      >
        <option value="">{`-- Pilih ${label} --`}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default SelectItems
