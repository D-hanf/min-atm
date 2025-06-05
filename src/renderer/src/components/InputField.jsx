import Hyperlink from './HyperLink'
import React from 'react'

const LabelInput = ({ id, type = 'text', children, name, placeholder, value, ...props }) => {
  return (
    <label htmlFor="password" className="block text-sm/6 font-medium text-gray-900">
      {children}
    </label>
  )
}
const InputHere = ({ id, type = 'text', name , value,placeholder, ...props }) => {
  return (
    <div className="mt-2">
      <input
        id={id}
        name={name}
        type={type}
        required
        placeholder={placeholder}
        value={value}
        {...props}
        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-sky-600 sm:text-sm/6"
      />
    </div>
  )
}

const InputField = ({ children, id, type = 'text', name, placeholder, value, ...props }) => {
  return (
    <div>
      <div className="flex items-center justify-between">
        <LabelInput id={id} type={type} name={name}> {children} </LabelInput> 
      </div>
        <InputHere id={id} type={type} name={name} placeholder={placeholder} value={value} {...props} />
    </div>
  )
}

export default InputField
