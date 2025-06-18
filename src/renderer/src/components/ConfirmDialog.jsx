import ButtonInput from './ButtonInput'
import React from 'react'

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi',
  message = 'Apakah Anda yakin ingin menghapus item ini?'
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-sm relative">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="text-sm text-gray-600 mb-4">{message}</p>
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
