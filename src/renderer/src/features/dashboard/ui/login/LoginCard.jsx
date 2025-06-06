import React, { useState } from 'react'

import ButtonInput from '../../../../components/ButtonInput'
import InputField from '../../../../components/InputField'
import { useNavigate } from "react-router-dom";

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
    <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
      <form className="space-y-6" onSubmit={handleLogin}>
        <InputField
          id="username"
          name="username"
          value={username}
          type="text"
          onChange={(e) => setUsername(e.target.value)}
        >
          Username
        </InputField>

        <InputField
          id="password"
          name="password"
          value={password}
          type="password"
          onChange={(e) => setPassword(e.target.value)}
        >
          Password
        </InputField>
        {error && <p className="text-sm text-red-600 -mt-4">{error}</p>}

        <div>
          <ButtonInput type="submit">Sign in</ButtonInput>
        </div>
      </form>
    </div>
  )
}
export default LoginCard
