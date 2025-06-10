import React from 'react'

const SelectItems = ({ options = [], value, onChange, label = 'Select an option' }) => {
  return (
    <div>
      <label htmlFor="countries" className="block mb-2 text-sm font-medium text-gray-900">
        {label}
      </label>
      <select
        required
        {...(value !== undefined ? { value } : {})}
        {...(onChange ? { onChange } : {})}
        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
      >
        <option value="" disabled selected>
          -- Pilih --
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default SelectItems
