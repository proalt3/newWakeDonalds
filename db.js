const mysql = require("mysql2/promise")

const config = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "12345",
  database: process.env.DB_NAME || "wakedonalds",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}

let pool = null

async function getPool() {
  if (pool) return pool
  try {
    pool = mysql.createPool(config)
    await pool.query("SELECT 1")
    console.log("✅ MySQL connected:", config.database)
    return pool
  } catch (err) {
    console.warn("⚠️ MySQL not available:", err.message, "| Using in-memory/localStorage fallback.")
    return null
  }
}

async function query(sql, params = []) {
  const p = await getPool()
  if (!p) return null
  const [rows] = await p.execute(sql, params)
  return rows
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params)
  return rows && rows[0] ? rows[0] : null
}

module.exports = { getPool, query, queryOne }
