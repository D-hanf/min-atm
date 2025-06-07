import React, { useEffect, useRef, useState } from 'react'

import ButtonInput from '../components/ButtonInput'

const DropdownHover = ({ label, items = [] }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(label)
  const dropdownRef = useRef(null)

  const handleSelect = (item) => {
    setSelectedItem(item)
    setIsOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div
      className="relative inline-block text-left"
      ref={dropdownRef}
      onMouseEnter={() => setIsOpen(true)}
      
    >
      <ButtonInput type="button" color="gray">
        {selectedItem}
      </ButtonInput>

      {isOpen && (
        <div className="absolute z-10 mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow-sm w-44 dark:bg-gray-700"
        onMouseLeave={() => setIsOpen(false)}>
          <ul className="py-2 text-sm text-gray-700 dark:text-gray-200">
            {items.map((item) => (
              <li key={item}>
                <button
                  onClick={() => handleSelect(item)}
                  className="w-full text-left block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default DropdownHover
