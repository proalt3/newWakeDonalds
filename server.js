require("dotenv").config()
const express = require("express")
const cors = require("cors")
const path = require("path")
const fs = require("fs")
const authRoutes = require("./auth")
const menuRoutes = require("./routes/menu")
const ordersRoutes = require("./routes/orders")
const db = require("./db")

const app = express()
const PORT = process.env.PORT || 8080
const isProduction = process.env.NODE_ENV === "production"
const distPath = path.join(__dirname, "dist")
const staticRoot = isProduction && fs.existsSync(distPath) ? distPath : __dirname

// ── Security headers (help prevent XSS, clickjacking, MIME sniffing) ──
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.setHeader("X-Frame-Options", "SAMEORIGIN")
  res.setHeader("X-XSS-Protection", "1; mode=block")
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin")
  next()
})

// ── Middleware ──────────────────────────────
app.use(cors())
app.use(express.json({ limit: "512kb" }))

// ── Serve static files (from dist/ in production if built, else project root) ──
app.use(express.static(staticRoot))

// ── API Routes ──────────────────────────────
app.use("/api/auth", authRoutes)
app.use("/api/menu", menuRoutes)
app.use("/api/orders", ordersRoutes)

// ── Home Route ──────────────────────────────
app.get("/", (req, res) => {
  res.sendFile(path.join(staticRoot, "index.html"))
})

// ── Start Server ────────────────────────────
app.listen(PORT, async () => {
  await db.getPool()
  console.log("─────────────────────────────────────")
  console.log(`🍔 Wakedonalds server is running!`)
  console.log(`👉 Open: http://localhost:${PORT}`)
  console.log("─────────────────────────────────────")
})