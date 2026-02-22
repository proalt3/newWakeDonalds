const express = require("express")
const router = express.Router()
const db = require("../db")

// GET all orders (customer + items in one place)
router.get("/", async (req, res) => {
  try {
    const rows = await db.query(
      "SELECT id, order_num AS num, customer, phone, notes, items, subtotal, tax, total, status, created_at AS time FROM orders ORDER BY id DESC"
    )
    if (!rows || !rows.length) {
      return res.json([])
    }
    const orders = rows.map((o) => {
      let items = []
      if (o.items) {
        try {
          items = typeof o.items === "string" ? JSON.parse(o.items) : o.items
        } catch (_) {}
      }
      return {
        num: o.num,
        customer: o.customer,
        phone: o.phone || "—",
        notes: o.notes || "",
        items: Array.isArray(items)
          ? items.map((i) => ({
              name: i.name,
              price: Number(i.price),
              qty: i.qty || 1,
            }))
          : [],
        subtotal: Number(o.subtotal),
        tax: Number(o.tax),
        total: Number(o.total),
        status: o.status,
        time: o.time ? String(o.time).replace("T", " ").slice(0, 19) : "",
      }
    })
    return res.json(orders)
  } catch (err) {
    console.error("GET orders error:", err)
    return res.status(500).json({ message: "Failed to load orders" })
  }
})

// POST create order (items stored in orders.items as JSON)
router.post("/", async (req, res) => {
  try {
    const { customer, phone, notes, items, subtotal, tax, total } = req.body
    if (!items || !items.length || total === undefined) {
      return res.status(400).json({ message: "Items and total required" })
    }
    const orderNum = String(Date.now()).slice(-6)
    const itemsJson = JSON.stringify(
      items.map((it) => ({
        name: it.name,
        price: Number(it.price),
        qty: it.qty || 1,
      }))
    )
    await db.query(
      "INSERT INTO orders (order_num, customer, phone, notes, items, subtotal, tax, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'In Progress')",
      [
        orderNum,
        customer || "Guest",
        phone || null,
        notes || null,
        itemsJson,
        Number(subtotal) || 0,
        Number(tax) || 0,
        Number(total) || 0,
      ]
    )
    const [orderRow] = await db.query("SELECT LAST_INSERT_ID() AS id")
    return res.status(201).json({ orderNum, id: orderRow.id, message: "Order placed" })
  } catch (err) {
    console.error("POST order error:", err)
    return res.status(500).json({ message: "Failed to place order" })
  }
})

module.exports = router
