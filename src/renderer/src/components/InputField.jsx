import { HiEye, HiEyeSlash } from 'react-icons/hi2'
import React, { useState } from 'react'
import { useTheme } from '../context/ThemeContext'

const LabelInput = ({ id, children }) => {
  return (
    <label htmlFor={id} className="block text-sm/6 font-medium text-gray-900">
      {children}
    </label>
  )
}

const InputHere = ({
  id,
  type,
  name,
  value,
  placeholder,
  onChange = { onChange },
  showToggle,
  showPassword,
  togglePassword,
  disabled = false,
  ...props
}) => {
  const { isDark } = useTheme()

  return (
    <div className="relative mt-2">
      <input
        id={id}
        name={name}
        type={showPassword ? 'text' : type}
        required
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        {...props}
        className={`block w-full rounded-md px-3 py-1.5 text-base outline-1 -outline-offset-1 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 sm:text-sm/6 ${isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} ${showPassword ? 'border-blue-500' : 'border-gray-300'} ${showToggle ? 'pr-10' : ''} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      />
      {showToggle && (
        <button
          type="button"
          onClick={togglePassword}
          className="absolute inset-y-0 right-3 flex items-center text-gray-500 focus:outline-none"
        >
          {showPassword ? <HiEyeSlash /> : <HiEye />}
        </button>
      )}
    </div>
  )
}

const InputField = ({
  children,
  name,
  type = 'text',
  value,
  onChange,
  required = true,
  className = '',
  placeholder = '',
  disabled = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false)

  const togglePassword = () => setShowPassword((prev) => !prev)

  const isPasswordField = type === 'password'
  const { isDark } = useTheme()

  return (
    <div className={`mb-4 ${className}`}>
      <div className="flex items-center justify-between">
        <LabelInput id={name}>{children}</LabelInput>
      </div>
      <InputHere
        id={name}
        type={type}
        name={name}
        placeholder={placeholder}
        value={value ?? ''}
        required={required}
        onChange={onChange}
        showToggle={isPasswordField}
        showPassword={showPassword}
        togglePassword={togglePassword}
        disabled={disabled}
        {...props}
      />
    </div>
  )
}

export default InputField
