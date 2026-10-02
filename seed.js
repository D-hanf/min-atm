const sqlite3 = require('sqlite3').verbose()

const dbPath = 'C:\\Users\\LOQ\\AppData\\Roaming\\mini-atm-jaya-mart\\miniAtm.db'
const db = new sqlite3.Database(dbPath)

function generateMember(i) {
  const member_id = `MB-TEST-${Date.now()}-${i}`
  const nama = `Member Test ${i}`
  const telepon = `0812${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`
  const alamat = `Jl. Test No. ${i}`
  const is_active = 1
  return [member_id, nama, telepon, alamat, is_active]
}

db.serialize(() => {
  db.run("BEGIN TRANSACTION")
  
  const stmt = db.prepare(`INSERT INTO members (member_id, nama, telepon, alamat, is_active) VALUES (?, ?, ?, ?, ?)`)
  
  for (let i = 0; i < 200; i++) {
    stmt.run(generateMember(i))
  }
  
  stmt.finalize()
  
  db.run("COMMIT", (err) => {
    if (err) console.error("Error committing:", err)
    else console.log("Successfully inserted 200 members!")
    db.close()
  })
})
