// src/main/db.js

import { app } from 'electron'
import path from 'path'
import sqlite3 from 'sqlite3'

const dbPath = path.join(app.getPath('userData'), 'miniAtm.db')
console.log('📁 Lokasi fix database:', dbPath)

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message)
  } else {
    console.log('✅ Connected to the SQLite database.')
  }
})

export default db
