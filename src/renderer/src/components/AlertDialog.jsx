import ButtonInput from './ButtonInput'
import { HiOutlineExclamationTriangle, HiOutlineCheckCircle } from 'react-icons/hi2'
import React from 'react'

const AlertDialog = ({
  isOpen,
  onClose,
  title = 'Peringatan',
  message = 'Konfirmasi pada admin untuk melakukan delete/edit',
  variant = 'warning' // 'warning' or 'success'
}) => {
  if (!isOpen) return null

  const isSuccess = variant === 'success'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-sm relative">
        <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${
          isSuccess ? 'bg-green-100' : 'bg-yellow-100'
        }`}>
          {isSuccess ? (
            <HiOutlineCheckCircle className="h-6 w-6 text-green-600" />
          ) : (
            <HiOutlineExclamationTriangle className="h-6 w-6 text-yellow-600" />
          )}
        </div>
        <h2 className="text-lg font-semibold text-center mb-2">{title}</h2>
        <p className="text-sm text-gray-600 text-center mb-6">{message}</p>
        <div className="flex justify-center">
          <ButtonInput 
            color={isSuccess ? "success" : "warning"} 
            onClick={onClose} 
            size="md" 
            className="w-full justify-center"
          >
            Oke
          </ButtonInput>
        </div>
      </div>
    </div>
  )
}

export default AlertDialog
