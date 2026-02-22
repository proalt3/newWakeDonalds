const express = require("express")
const router = express.Router()
const db = require("./db")

// Roles: admin, customer, staff only
function normalizeRole(role) {
  const r = (role || "").toLowerCase()
  return r === "admin" || r === "staff" ? r : "customer"
}

// In-memory fallback when MySQL is not available
const fallbackUsers = [
  { id: 1, name: "Admin", email: "admin@wakedonalds.com", password: "admin123", role: "admin" }
]

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" })
  }

  try {
    let usedDb = false
    try {
      const existing = await db.queryOne("SELECT id FROM users WHERE email = ?", [email])
      if (existing) {
        return res.status(400).json({ message: "Email already registered" })
      }
      await db.query(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'customer')",
        [name, email, password]
      )
      usedDb = true
    } catch (_) {}

    if (!usedDb) {
      const existingUser = fallbackUsers.find((u) => u.email === email)
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" })
      }
      fallbackUsers.push({
        id: fallbackUsers.length + 1,
        name,
        email,
        password,
        role: "customer",
      })
    }
    return res.status(201).json({ message: "Account created successfully!" })
  } catch (err) {
    console.error("Register error:", err)
    return res.status(500).json({ message: "Registration failed" })
  }
})

router.post("/login", async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" })
  }

  try {
    let user = null
    try {
      user = await db.queryOne(
        "SELECT id, name, email, password, role FROM users WHERE email = ? AND password = ?",
        [email, password]
      )
    } catch (_) {}

    if (!user) {
      user = fallbackUsers.find((u) => u.email === email && u.password === password) || null
    }
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    const role = normalizeRole(user.role)
    return res.status(200).json({
      message: "Login successful!",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
      },
    })
  } catch (err) {
    console.error("Login error:", err)
    return res.status(500).json({ message: "Login failed" })
  }
})

module.exports = router
