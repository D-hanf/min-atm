import React, { createContext, useContext, useEffect, useState } from 'react'

const LockContext = createContext()

export const useLock = () => {
  const context = useContext(LockContext)
  if (!context) {
    throw new Error('useLock must be used within a LockProvider')
  }
  return context
}

export const LockProvider = ({ children }) => {
  const [isGloballyLocked, setIsGloballyLocked] = useState(false)

  const checkGlobalLock = () => {
    const currentUser = JSON.parse(localStorage.getItem('user'))
    const lockedKasirId = localStorage.getItem('locked_kasir_id')
    
    // Jika admin, tidak pernah lock
    if (currentUser?.role?.toLowerCase() === 'admin') {
      setIsGloballyLocked(false)
      return false
    }
    
    // Jika ada kasir yang terkunci dan ID sama dengan user saat ini
    if (lockedKasirId && currentUser?.id && lockedKasirId === currentUser.id.toString()) {
      setIsGloballyLocked(true)
      return true
    }
    
    setIsGloballyLocked(false)
    return false
  }

  const unlockGlobal = () => {
    localStorage.removeItem('locked_kasir_id')
    setIsGloballyLocked(false)
    console.log('🔓 Global lock removed')
  }

  const lockGlobal = (userId) => {
    const currentUser = JSON.parse(localStorage.getItem('user'))
    if (currentUser?.role?.toLowerCase() !== 'admin') {
      localStorage.setItem('locked_kasir_id', userId.toString())
      setIsGloballyLocked(true)
      console.log('🔒 Global lock applied for user:', userId)
    }
  }

  // Check lock status on mount and when localStorage changes
  useEffect(() => {
    checkGlobalLock()

    // Listen for storage changes from other tabs/windows
    const handleStorageChange = (e) => {
      if (e.key === 'locked_kasir_id' || e.key === 'user') {
        checkGlobalLock()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const value = {
    isGloballyLocked,
    checkGlobalLock,
    unlockGlobal,
    lockGlobal
  }

  return (
    <LockContext.Provider value={value}>
      {children}
    </LockContext.Provider>
  )
}