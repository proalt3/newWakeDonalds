const express = require("express")
const cors = require("cors")
const authRoutes = require("./auth")

const app = express()
const PORT = 5000

app.use(cors())
app.use(express.json())
app.use("/api/auth", authRoutes)

app.get("/", (req, res) => {
  res.send("Wakedonalds server is running! 🍔")
})

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`)
})
