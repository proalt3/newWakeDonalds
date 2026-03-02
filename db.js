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
let migrationPromise = null

async function ensureOrdersColumns(p) {
  try {
    const [tables] = await p.query("SHOW TABLES LIKE 'orders'")
    if (!tables || tables.length === 0) return

    const required = [
      {
        name: "email",
        ddl: "ALTER TABLE orders ADD COLUMN email VARCHAR(255) DEFAULT NULL",
      },
      {
        name: "ready_email_sent",
        ddl: "ALTER TABLE orders ADD COLUMN ready_email_sent TINYINT(1) NOT NULL DEFAULT 0",
      },
      {
        name: "picked_up_email_sent",
        ddl: "ALTER TABLE orders ADD COLUMN picked_up_email_sent TINYINT(1) NOT NULL DEFAULT 0",
      },
    ]

    for (const col of required) {
      const [cols] = await p.query("SHOW COLUMNS FROM orders LIKE ?", [col.name])
      if (!cols || cols.length === 0) {
        await p.query(col.ddl)
        console.log(`🛠️  Migrated orders: added column '${col.name}'`)
      }
    }
  } catch (err) {
    console.warn("⚠️ Orders table migration skipped:", err.message)
  }
}

async function migrateIfNeeded(p) {
  if (migrationPromise) return migrationPromise
  migrationPromise = ensureOrdersColumns(p).finally(() => {
    // Keep the promise for the process lifetime to avoid repeated SHOW COLUMNS.
  })
  return migrationPromise
}

async function getPool() {
  if (pool) return pool
  try {
    pool = mysql.createPool(config)
    await pool.query("SELECT 1")
    await migrateIfNeeded(pool)
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
