import ButtonInput from './ButtonInput'
import React from 'react'
import { useTheme } from '../context/ThemeContext'

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi',
  message = 'Apakah Anda yakin ingin menghapus item ini?'
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
        <div className="flex justify-end gap-2">
          <ButtonInput color="gray" onClick={onClose} size="md">
            Batal
          </ButtonInput>
          <ButtonInput color="red" onClick={onConfirm} size="md">
            Ya
          </ButtonInput>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
