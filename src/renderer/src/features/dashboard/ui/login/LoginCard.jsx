import React, { useState } from 'react'
import ButtonInput from '../../../../components/ButtonInput'
import InputField from '../../../../components/InputField'
import { useNavigate } from "react-router-dom"

const credential = {
  username: 'admin',
  password: 'admin123'
}

const LoginCard = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  
  const handleLogin = (e) => {
    e.preventDefault()
    if (username === credential.username && password === credential.password) {
      setError('')
      navigate('/dashboard')
    } else {
      setError('Invalid username or password')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo and App Name */}
        <div className="text-center mb-8">
          {/* Logo Icon */}
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <svg 
              className="w-8 h-8 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" 
              />
            </svg>
          </div>
          
          {/* App Name */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">MINI ATM</h1>
          <p className="text-gray-600 text-sm">Sistem Kasir Digital</p>
        </div>

        {/* Login Form */}
        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <InputField
              id="username"
              name="username"
              value={username}
              type="text"
              onChange={(e) => setUsername(e.target.value)}
              required
            >
              Username
            </InputField>
          </div>

          <div>
            <InputField
              id="password"
              name="password"
              value={password}
              type="password"
              onChange={(e) => setPassword(e.target.value)}
              required
            >
              Password
            </InputField>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}

          <div>
            <ButtonInput 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200"
            >
              Sign in
            </ButtonInput>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            © 2025 Mini ATM. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginCard