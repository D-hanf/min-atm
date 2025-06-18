import React, { useEffect, useState } from 'react'

import ButtonInput from '../../../components/ButtonInput'
import InputField from '../../../components/InputField'
import { useNavigate } from 'react-router-dom'

const HalamanEditProfilAdmin = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    username: '',
    password: '',
    phone: '',
    role: ''
  })

  const [message, setMessage] = useState(null)

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'))
    if (storedUser) {
      setFormData({
        id: storedUser.id,
        name: storedUser.nama,
        username: storedUser.username,
        password: '',
        phone: storedUser.no_telepon || '',
        role: storedUser.role
      })
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const updateData = {
        user_id: formData.id,
        nama: formData.name,
        username: formData.username,
        no_telepon: formData.phone,
        role: formData.role
      }

      // hanya tambahkan password kalau diisi
      if (formData.password && formData.password.trim() !== '') {
        updateData.password = formData.password
      }

      await window.api.updateKaryawan(updateData)

      // Update localStorage (tanpa password)
      const updatedUser = {
        id: formData.id,
        nama: formData.name,
        username: formData.username,
        no_telepon: formData.phone,
        role: formData.role
      }
      localStorage.setItem('user', JSON.stringify(updatedUser))

      setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' })
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (err) {
      console.error('❌ Gagal update profil:', err)
      setMessage({ type: 'error', text: 'Gagal memperbarui profil.' })
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow-md rounded-lg mt-6">
      <h2 className="text-xl font-semibold mb-4">Edit Profil Admin</h2>

      {message && (
        <div
          className={`mb-4 text-sm px-3 py-2 rounded ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        >
          Nama Lengkap
        </InputField>

        <InputField
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
        >
          Username
        </InputField>

        <InputField
          name="password"
          value={formData.password}
          onChange={handleChange}
          type="password"
        >
          Password (isi jika ingin ubah)
        </InputField>

        <InputField
          name="phone"
          value={formData.phone}
          onChange={handleChange}
        >
          Nomor Telepon
        </InputField>

        <div className="flex justify-end">
          <ButtonInput type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
            Simpan Perubahan
          </ButtonInput>
        </div>
      </form>
    </div>
  )
}

export default HalamanEditProfilAdmin
