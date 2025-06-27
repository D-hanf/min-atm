import ButtonInput from '../../components/ButtonInput'
import React from 'react'
import { useTheme } from '../../context/ThemeContext'

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

    const result = onSubmit(data)
    if (result !== false) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600/25 dark:bg-black/40">
      <div
        className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white'}
          rounded-2xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header */}
          {title && (
            <div className={`text-center border-b pb-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className="text-lg font-semibold">{title}</h3>
            </div>
          )}

          {/* Konten form */}
          <div className="space-y-4">{children}</div>

          {/* Tombol */}
          <div className="flex justify-between items-center gap-2 pt-4 mt-2">
            <div className="flex">
              {showBackButton && (
                <ButtonInput onClick={onBack} color="gray" type="button">
                  Kembali
                </ButtonInput>
              )}
            </div>
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
