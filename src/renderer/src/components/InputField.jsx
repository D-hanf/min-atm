import { HiEye, HiEyeSlash } from 'react-icons/hi2'
import React, { useState } from 'react'

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
  onChange={onChange},
  showToggle,
  showPassword,
  togglePassword,
  ...props
}) => {
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
        {...props}
        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-sky-600 sm:text-sm/6"
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
  id,
  type = 'text',
  name,
  placeholder,
  value,
  onChange,
  required,
  className,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false)

  const togglePassword = () => setShowPassword((prev) => !prev)

  const isPasswordField = type === 'password'

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <LabelInput id={id}>{children}</LabelInput>
      </div>
      <InputHere
        id={id}
        type={type}
        name={name}
        placeholder={placeholder}
        value={value ?? ''}
        required={required}
        onChange={onChange}
        showToggle={isPasswordField}
        showPassword={showPassword}
        togglePassword={togglePassword}
        {...props}
      />
    </div>
  )
}

export default InputField
