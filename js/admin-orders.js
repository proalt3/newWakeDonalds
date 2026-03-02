// Admin-only Live Orders page — DoorDash-style card UI
(function () {
  const API = window.location.origin;
  const userData = localStorage.getItem("wakedonald_user");
  if (!userData) {
    window.location.href = "index.html";
    return;
  }
  const user = JSON.parse(userData);
  function normalizeRole(r) {
    const s = (r || "").toLowerCase();
    return s === "admin" ? "admin" : "customer";
  }
  user.role = normalizeRole(user.role);
  if (user.email === "admin@wakedonalds.com" && user.role === "customer") user.role = "admin";
  if (user.role !== "admin") {
    window.location.replace("restaurant-pos.html");
    return;
  }

  document.getElementById("nav-user").textContent = "👋 " + user.name;

  function logout() {
    localStorage.removeItem("wakedonald_user");
    window.location.href = "index.html";
  }
  window.logout = logout;

  let orderList = [];
  let currentFilter = "all";

  function escapeHtml(s) {
    if (s == null) return "";
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function formatPickupTime(t) {
    if (!t) return "—";
    const s = String(t).trim();
    if (!s) return "—";
    const d = new Date(s);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true });
  }

  function formatScheduledAt(o) {
    const at = o.scheduled_at || o.scheduledAt;
    if (!at) return null;
    try {
      const d = new Date(at);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (_) {
      return null;
    }
  }

  function customerDisplayName(name) {
    if (!name || !String(name).trim()) return "Guest";
    const parts = String(name).trim().split(/\s+/);
    if (parts.length >= 2) {
      const last = parts[parts.length - 1];
      return parts[0] + " " + (last ? last.charAt(0).toUpperCase() : "");
    }
    return parts[0];
  }

  function getOrderCategory(o) {
    const s = (o.status || "").trim();
    if (s === "Ready for Pickup") return "ready";
    if (s === "In Progress") return "in_progress";
    if (s === "Picked Up") return "picked_up";
    return "in_progress";
  }

  function isScheduled(o) {
    const at = o.scheduled_at || o.scheduledAt;
    if (!at) return false;
    try {
      return new Date(at).getTime() > Date.now();
    } catch (_) {
      return false;
    }
  }

  function ordersForFilter(filter) {
    const active = orderList.filter(function (o) {
      return (o.status || "").trim() !== "Picked Up";
    });
    if (filter === "all") return active;
    if (filter === "needs_action" || filter === "in_progress") {
      return active.filter(function (o) {
        return getOrderCategory(o) === "in_progress";
      });
    }
    if (filter === "ready") {
      return active.filter(function (o) {
        return getOrderCategory(o) === "ready";
      });
    }
    if (filter === "scheduled") {
      return orderList.filter(function (o) {
        return isScheduled(o);
      });
    }
    return active;
  }

  function updateCounts() {
    const active = orderList.filter(function (o) {
      return (o.status || "").trim() !== "Picked Up";
    });
    const inProgress = active.filter(function (o) {
      return getOrderCategory(o) === "in_progress";
    });
    const ready = active.filter(function (o) {
      return getOrderCategory(o) === "ready";
    });
    document.getElementById("count-all").textContent = active.length;
    document.getElementById("count-needs_action").textContent = inProgress.length;
    document.getElementById("count-in_progress").textContent = inProgress.length;
    document.getElementById("count-ready").textContent = ready.length;
    document.getElementById("count-scheduled").textContent = scheduledCount();
    const minEl = document.getElementById("minimized-count");
    if (minEl) minEl.textContent = active.length;
  }

  function scheduledCount() {
    return orderList.filter(function (o) {
      return isScheduled(o);
    }).length;
  }

  function showToast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(function () {
      t.classList.remove("show");
    }, 2200);
  }

  function renderCards() {
    const list = ordersForFilter(currentFilter);
    const container = document.getElementById("orders-cards");
    const emptyEl = document.getElementById("orders-empty");

    document.querySelectorAll(".orders-status-tab").forEach(function (tab) {
      tab.classList.toggle("active", tab.getAttribute("data-filter") === currentFilter);
    });

    if (list.length === 0) {
      container.classList.add("empty");
      container.innerHTML = "";
      emptyEl.style.display = "block";
      emptyEl.textContent = (window.t ? window.t("orders_no_orders_filter") : "No orders in this filter.");
      return;
    }
    emptyEl.style.display = "none";
    container.classList.remove("empty");

    container.innerHTML = list
      .map(function (o) {
        const status = (o.status || "In Progress").trim();
        const category = getOrderCategory(o);
        const customerName = customerDisplayName(o.customer);
        const pickupTime = formatPickupTime(o.time);
        const items = Array.isArray(o.items) ? o.items : [];
        const itemCount = items.reduce(function (sum, i) {
          return sum + (Number(i.qty) || 1);
        }, 0);
        const notes = (o.notes || "").trim();
        const orderId = o.id || o.num || null;
        const scheduled = isScheduled(o);
        const scheduledStr = formatScheduledAt(o);

        let statusLabel = status;
        if (scheduled) statusLabel = "Scheduled";
        else if (status === "Ready for Pickup") statusLabel = "Ready";
        else if (status === "In Progress") statusLabel = "In progress";

        let btnHtml = "";
        if (orderId && !scheduled) {
          if (category === "ready") {
            btnHtml =
              '<button type="button" class="order-card-btn picked" onclick="window.markPickedUp(' +
              orderId +
              ')">' +
              (window.t ? window.t("orders_mark_picked_up") : "Mark picked up") +
              "</button>";
          } else if (category === "in_progress") {
            btnHtml =
              '<button type="button" class="order-card-btn" onclick="window.markReadyForPickup(' +
              orderId +
              ')">' +
              (window.t ? window.t("orders_ready_for_pickup") : "Ready for pickup") +
              "</button>";
          } else {
            btnHtml = '<button type="button" class="order-card-btn" disabled>—</button>';
          }
        } else {
          btnHtml = '<button type="button" class="order-card-btn" disabled>' + (scheduled ? "Scheduled" : "—") + "</button>";
        }
        if (orderId) {
          btnHtml +=
            '<button type="button" class="order-card-delete" onclick="window.deleteOrder(' +
            orderId +
            ')" title="' +
            (window.t ? window.t("orders_delete") : "Delete order") +
            '">' +
            (window.t ? window.t("orders_delete") : "Delete order") +
            "</button>";
        }

        const itemsHtml = items
          .map(function (i) {
            const qty = Number(i.qty) || 1;
            const name = escapeHtml(i.name || "Item");
            const price = "$" + (Number(i.price) || 0).toFixed(2);
            return (
              '<div class="order-card-item">' +
              '<span class="order-card-item-qty">' +
              qty +
              "</span> " +
              '<span class="order-card-item-name">' +
              name +
              "</span> " +
              '<span class="order-card-item-price">' +
              price +
              "</span>" +
              "</div>"
            );
          })
          .join("");

        const notesHtml = notes
          ? '<div class="order-card-notes">' +
            '<div class="order-card-notes-title">⚠️ ' +
            (window.t ? window.t("orders_special_instructions") : "Special instructions") +
            "</div>" +
            '<div class="order-card-notes-text">' +
            escapeHtml(notes) +
            "</div>" +
            "</div>"
          : "";

        const subtotal = Number(o.subtotal) || 0;
        const tax = Number(o.tax) || 0;
        const total = Number(o.total) || 0;

        var cardClass = "order-card" + (category === "ready" ? " ready-for-pickup" : "");
        return (
          '<div class="' + cardClass + '" data-order-id="' +
          (orderId || "") +
          '">' +
          '<div class="order-card-header">' +
          '<span class="order-card-status">' +
          escapeHtml(statusLabel) +
          "</span>" +
          '<span class="order-card-customer">' +
          escapeHtml(customerName) +
          "</span>" +
          '<span class="order-card-ready">' +
          (scheduled && scheduledStr ? scheduledStr : (category === "in_progress" ? "—" : "Pickup " + pickupTime)) +
          "</span>" +
          "</div>" +
          '<div class="order-card-body">' +
          '<div class="order-card-meta">' +
          (scheduled && scheduledStr
            ? '<span>📅 ' + (window.t ? window.t("orders_scheduled_for") : "Scheduled for") + " " + escapeHtml(scheduledStr) + "</span>"
            : '<span>🕐 Pickup at ' + pickupTime + "</span>") +
          '<span>🛒 ' +
          itemCount +
          " item" +
          (itemCount !== 1 ? "s" : "") +
          "</span>" +
          "</div>" +
          notesHtml +
          '<div class="order-card-items">' +
          '<div class="order-card-items-title">Items</div>' +
          itemsHtml +
          "</div>" +
          '<div class="order-card-totals">' +
          '<div>Subtotal <span>$' +
          subtotal.toFixed(2) +
          "</span></div>" +
          '<div>Tax <span>$' +
          tax.toFixed(2) +
          "</span></div>" +
          '<div class="total-line">Total <span>$' +
          total.toFixed(2) +
          "</span></div>" +
          "</div>" +
          "</div>" +
          '<div class="order-card-footer">' +
          '<div class="order-card-footer-actions">' +
          btnHtml +
          "</div>" +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  async function loadOrders() {
    try {
      const r = await fetch(API + "/api/orders");
      if (r.ok) {
        const data = await r.json();
        orderList = Array.isArray(data) ? data : [];
      }
    } catch (_) {
      orderList = [];
    }
    updateCounts();
    renderCards();
  }

  async function updateOrderStatus(orderId, newStatus) {
    try {
      const r = await fetch(API + "/api/orders/" + orderId + "/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await r.json().catch(function () {
        return {};
      });
      if (r.ok) {
        showToast(data.message || "Status updated");
        await loadOrders();
      } else {
        showToast(data.message || "Failed to update status");
      }
    } catch (_) {
      showToast("Failed to update status");
    }
  }

  function markReadyForPickup(orderId) {
    updateOrderStatus(orderId, "Ready for Pickup");
  }
  function markPickedUp(orderId) {
    updateOrderStatus(orderId, "Picked Up");
  }
  async function deleteOrder(orderId) {
    var msg = window.t ? window.t("orders_delete_confirm") : "Delete this order? This cannot be undone.";
    if (!orderId || !confirm(msg)) return;
    try {
      var r = await fetch(API + "/api/orders/" + encodeURIComponent(orderId), { method: "DELETE" });
      var data = await r.json().catch(function () { return {}; });
      if (r.ok) {
        showToast(data.message || "Order deleted");
        await loadOrders();
      } else {
        showToast(data.message || "Failed to delete order");
      }
    } catch (e) {
      showToast("Failed to delete order");
    }
  }
  window.markReadyForPickup = markReadyForPickup;
  window.markPickedUp = markPickedUp;
  window.deleteOrder = deleteOrder;

  document.querySelectorAll(".orders-status-tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      currentFilter = tab.getAttribute("data-filter");
      renderCards();
    });
  });

  var panel = document.getElementById("live-orders-panel");
  var minimizeBtn = document.getElementById("live-orders-minimize");
  var expandBtn = document.getElementById("live-orders-expand");
  if (panel && minimizeBtn) {
    minimizeBtn.addEventListener("click", function () {
      panel.classList.add("minimized");
    });
  }
  if (panel && expandBtn) {
    expandBtn.addEventListener("click", function () {
      panel.classList.remove("minimized");
    });
  }

  loadOrders();
})();
