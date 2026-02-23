const nodemailer = require("nodemailer")

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM,
} = process.env

let transporter = null

function getTransporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn(
      "Email disabled: set SMTP_HOST, SMTP_USER, SMTP_PASS (and optionally SMTP_PORT, SMTP_SECURE, MAIL_FROM)"
    )
    return null
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: SMTP_SECURE === "true" || SMTP_SECURE === "1",
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  }
  return transporter
}

async function sendOrderEmail(order) {
  const transport = getTransporter()
  if (!transport) return

  const to = order && order.email ? String(order.email).trim() : ""
  if (!to) {
    console.warn("Order email skipped: no email on order")
    return
  }

  try {
    const itemsList =
      order.items && order.items.length
        ? order.items
            .map(
              (it) =>
                `  • ${it.qty || 1}x ${it.name} — $${Number(it.price || 0).toFixed(2)}`
            )
            .join("\n")
        : "  (no items)"

    const subtotal = Number(order.subtotal || 0).toFixed(2)
    const tax = Number(order.tax || 0).toFixed(2)
    const total = Number(order.total || 0).toFixed(2)
    const from = MAIL_FROM || SMTP_USER || "orders@wakedonalds.com"

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Order #${order.orderNum}</title></head>
<body style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px;color:#333;">
  <h2 style="color:#c8913a;">Your order confirmation</h2>
  <p><strong>Order #${order.orderNum}</strong></p>
  <p>Hi ${(order.customer || "Guest").replace(/</g, "&lt;")},</p>
  <p>Here’s a summary of your order:</p>
  <pre style="background:#f5f5f5;padding:12px;border-radius:8px;font-size:14px;">${itemsList}</pre>
  <p><strong>Subtotal:</strong> $${subtotal}<br/>
  <strong>Tax:</strong> $${tax}<br/>
  <strong>Total:</strong> $${total}</p>
  ${order.notes && String(order.notes).trim() ? `<p><strong>Notes:</strong> ${String(order.notes).replace(/</g, "&lt;")}</p>` : ""}
  <p style="color:#666;font-size:12px;">Thanks for ordering at Wakedonalds.</p>
</body>
</html>`

    const text =
      `Order #${order.orderNum}\n\n` +
      `Customer: ${order.customer || "Guest"}\n` +
      `Items:\n${order.items && order.items.length ? order.items.map((it) => `  ${it.qty || 1}x ${it.name} — $${Number(it.price || 0).toFixed(2)}`).join("\n") : "  (none)"}\n` +
      `Subtotal: $${subtotal}  Tax: $${tax}  Total: $${total}\n` +
      (order.notes && String(order.notes).trim() ? `Notes: ${order.notes}\n` : "")

    await transport.sendMail({
      from: `Wakedonalds <${from}>`,
      to,
      subject: `Order #${order.orderNum} — Wakedonalds`,
      text,
      html,
    })
  } catch (err) {
    console.error("Failed to send order email:", err.message)
  }
}

module.exports = { sendOrderEmail }
