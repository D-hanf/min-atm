import { useTheme } from '../../context/ThemeContext'
import ButtonInput from '../../components/ButtonInput'
import React from 'react'

const Modal = ({
  isOpen,
  onClose,
  onSubmit,
  children,
  hideSubmit = false,
  fullWidthCancel = false,
  showBackButton = false,
  onBack,
  title,
  disabled = false
}) => {
  const { isDark } = useTheme()

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData.entries())

    // Call onSubmit and check the result
    const result = onSubmit(data)

    // Only close the modal if onSubmit doesn't return false
    if (result !== false) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600/25 dark:bg-black/40">
      <div
        className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white'} rounded-2xl shadow-lg w-full max-w-lg p-6 relative`}
      >
        {/* Modal Header with optional title */}
        {title && (
          <div
            className={`flex justify-center items-center mb-4 pb-4 ${isDark ? 'border-gray-700' : 'border-b'}`}
          >
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="">{children}</div>
          <div className="flex justify-between items-center gap-2 mt-4">
            {/* Left side - Back button */}
            <div className="flex">
              {showBackButton && (
                <ButtonInput onClick={onBack} color="gray" type="button">
                  Kembali
                </ButtonInput>
              )}
            </div>

            {/* Right side - Cancel and Submit buttons */}
            <div className={`flex gap-2 ${fullWidthCancel && !showBackButton ? 'w-full' : ''}`}>
              <ButtonInput
                onClick={onClose}
                color="red"
                type="button"
                className={fullWidthCancel && !showBackButton ? 'w-full' : ''}
              >
                Cancel
              </ButtonInput>

              {!hideSubmit && (
                <ButtonInput disabled={disabled} type="submit">
                  Simpan
                </ButtonInput>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Modal
