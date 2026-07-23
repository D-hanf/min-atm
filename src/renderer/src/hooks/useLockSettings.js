import { useState, useEffect } from 'react'

// Default lock configurations
const defaultLockSettings = {
  transaksi: {
    editOnly: false, // true = hanya edit yang dikunci, false = edit & tambah dikunci
    lockAfterSave: false // true = fitur dikunci setelah save, false = tidak dikunci
  },
  pindahSaldo: {
    editOnly: false,
    lockAfterSave: false
  },
  hutang: {
    editOnly: false, 
    lockAfterSave: false
  },
  ambilSaldo: {
    editOnly: false,
    lockAfterSave: false
  }
}

export const useLockSettings = (pageName) => {
  const [lockSettings, setLockSettings] = useState(defaultLockSettings[pageName] || {})

  // Load settings from localStorage
  useEffect(() => {
    const loadSettings = () => {
      const savedSettings = localStorage.getItem('lockSettings')
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings)
          if (parsed[pageName]) {
            setLockSettings(parsed[pageName])
          }
        } catch (error) {
          console.error('Error parsing lock settings:', error)
        }
      }
    }

    loadSettings()

    // Listen for settings changes
    const handleSettingsChange = (event) => {
      if (event.detail[pageName]) {
        setLockSettings(event.detail[pageName])
      }
    }

    window.addEventListener('lockSettingsChanged', handleSettingsChange)
    
    return () => {
      window.removeEventListener('lockSettingsChanged', handleSettingsChange)
    }
  }, [pageName])

  // Check if editing is locked
  const isEditLocked = () => {
    const currentUser = JSON.parse(localStorage.getItem('user'))
    const isKasir = currentUser?.role?.toLowerCase() === 'kasir'
    
    if (!isKasir) return false // Admin tidak terkena lock
    
    // Jika lockAfterSave TIDAK aktif, tidak ada lock
    if (!lockSettings.lockAfterSave) return false
    
    // Jika lockAfterSave aktif, cek apakah kasir sudah save transaksi
    const lockedKasirId = localStorage.getItem('locked_kasir_id')
    if (lockedKasirId && currentUser?.id && lockedKasirId === currentUser.id.toString()) {
      return true // Edit dikunci
    }
    
    return false
  }

  // Check if adding new data is locked
  const isAddLocked = () => {
    const currentUser = JSON.parse(localStorage.getItem('user'))
    const isKasir = currentUser?.role?.toLowerCase() === 'kasir'
    
    if (!isKasir) return false // Admin tidak terkena lock
    
    // Jika lockAfterSave TIDAK aktif, tidak ada lock
    if (!lockSettings.lockAfterSave) return false
    
    // Jika editOnly aktif, add tidak dikunci (hanya edit yang dikunci)
    if (lockSettings.editOnly) return false
    
    // Jika lockAfterSave aktif dan BUKAN editOnly, cek lock status
    const lockedKasirId = localStorage.getItem('locked_kasir_id')
    if (lockedKasirId && currentUser?.id && lockedKasirId === currentUser.id.toString()) {
      return true // Add juga dikunci
    }
    
    return false
  }

  // Get lock status info
  const getLockInfo = () => {
    const editLocked = isEditLocked()
    const addLocked = isAddLocked()
    
    // Debug info
    const currentUser = JSON.parse(localStorage.getItem('user'))
    const lockedKasirId = localStorage.getItem('locked_kasir_id')
    
    console.log('🔍 Lock Debug Info:', {
      pageName,
      lockSettings,
      editLocked,
      addLocked,
      currentUserId: currentUser?.id,
      lockedKasirId,
      isKasir: currentUser?.role?.toLowerCase() === 'kasir'
    })
    
    if (editLocked && addLocked) {
      return {
        isLocked: true,
        message: 'Mode Full Lock: Edit dan tambah data dikunci setelah save transaksi.',
        type: 'full'
      }
    } else if (editLocked && !addLocked) {
      return {
        isLocked: true,
        message: 'Mode Lock Terbatas: Hanya edit yang dikunci. Anda masih bisa menambah data baru.',
        type: 'editOnly'
      }
    }
    
    return {
      isLocked: false,
      message: '',
      type: 'none'
    }
  }

  return {
    lockSettings,
    isEditLocked,
    isAddLocked,
    getLockInfo
  }
}