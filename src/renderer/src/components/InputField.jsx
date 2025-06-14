import React from 'react'

const LabelInput = ({ id, children }) => {
  return (
    <label htmlFor={id} className="block text-sm/6 font-medium text-gray-900">
      {children}
    </label>
  )
}

const InputHere = ({
  id,
  type = 'text',
  name,
  value,
  placeholder,
  onChange,
  ...props
  
}) => {
  return (
    <div className="mt-2">
      <input
        id={id}
        name={name}
        type={type}
        required
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...props}
        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-sky-600 sm:text-sm/6"
      />
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
        value={value ?? '' }
        required={required}
        onChange={onChange}
        {...props}
      />
    </div>
  )
}

export default InputField
