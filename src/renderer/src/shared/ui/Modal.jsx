import ButtonInput from '../../../../renderer/src/components/ButtonInput'
import React from 'react'

const Modal = ({ isOpen, onClose, onSubmit, children }) => {
  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData.entries())
    onSubmit(data)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600/25">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6 relative">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className='grid grid-cols-2 w-full gap-4'>
              {children}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <ButtonInput onClick={onClose} color="red" type="button">
              Cancel
            </ButtonInput>
            <ButtonInput type="submit">Simpan</ButtonInput>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Modal
