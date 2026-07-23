import { IoMdPrint, IoMdSave } from 'react-icons/io'

import ButtonInput from './ButtonInput'
import React from 'react'
import { useTheme } from '../context/ThemeContext'

const SaveOptionsDialog = ({
  isOpen,
  onClose,
  onSaveOnly,
  onSaveAndPrint,
  title = 'Pilihan Simpan',
  message = 'Pilih aksi yang ingin dilakukan:'
}) => {
  const { isDark } = useTheme()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div
        className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 w-full max-w-sm relative`}
      >
        <h2 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h2>
        <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{message}</p>
        <div className="flex flex-col gap-2 mb-4">
          <ButtonInput color="blue" onClick={onSaveOnly} size="md" className="w-full justify-center">
            <IoMdSave className="mr-2" size={16} />
            Simpan Saja
          </ButtonInput>
          <ButtonInput color="green" onClick={onSaveAndPrint} size="md" className="w-full justify-center">
            <IoMdPrint className="mr-2" size={16} />
            Simpan dan Print
          </ButtonInput>
        </div>
        <div className="flex justify-center">
          <ButtonInput color="gray" onClick={onClose} size="md">
            Batal
          </ButtonInput>
        </div>
      </div>
    </div>
  )
}

export default SaveOptionsDialog