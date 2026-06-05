import { useState, useEffect } from "react";
import "../Admin.css";

// ── Helpers ──────────────────────────────────────────────
function toDateString(date) {
  // Returns "YYYY-MM-DD" in local time
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function todayString() {
  return toDateString(new Date());
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  const date = new Date(+y, +m - 1, +d);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function StatusBadge({ status }) {
  const map = {
    PENDING: { cls: "order-status-pending", label: "Pending" },
    READY:   { cls: "order-status-done",    label: "Ready" },
  };
  const { cls, label } = map[status] || { cls: "", label: status };
  return <span className={`order-status-badge ${cls}`}>{label}</span>;
}

// ── Login Gate ────────────────────────────────────────────
function LoginGate({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const submit = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onLogin(true);
      } else {
        setError(data.message || "Invalid credentials.");
      }
    } catch {
      setError("Cannot reach server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gate-wrapper">
      <div className="gate-card">
        <div className="gate-icon">🍽️</div>
        <div className="gate-title">Admin Login</div>
        <div className="gate-sub">Sign in to manage your kitchen</div>
        <input
          className={`gate-input ${error ? "gate-input-error" : ""}`}
          type="text" placeholder="Username" value={username}
          onChange={e => { setUsername(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && submit()}
          autoFocus
        />
        <input
          className={`gate-input ${error ? "gate-input-error" : ""}`}
          type="password" placeholder="Password" value={password}
          onChange={e => { setPassword(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && submit()}
        />
        {error && <div className="gate-error">{error}</div>}
        <button className="gate-btn" onClick={submit} disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </div>
    </div>
  );
}

// ── Menu Tab ──────────────────────────────────────────────
function MenuTab() {
  const [foods, setFoods]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editId, setEditId]     = useState(null);
  const [editData, setEditData] = useState({});
  const [form, setForm]         = useState({
    name: "",
    category: "",
    description: "",
    available: true,
    hasVariants: false,
    price: "",
    variants: [
      { label: "Half", price: "" },
      { label: "Full", price: "" }
    ]
  });
  const [msg, setMsg]           = useState({ type: "", text: "" });

  const addVariant = () => {
    setForm(f => ({
      ...f,
      variants: [
        ...f.variants,
        { label: "", price: "" }
      ]
    }));
  };

  const updateVariant = (index, field, value) => {
    setForm(f => ({
      ...f,
      variants: f.variants.map((v, i) =>
        i === index
          ? { ...v, [field]: value }
          : v
      )
    }));
  };

  const removeVariant = (index) => {
    setForm(f => ({
      ...f,
      variants: f.variants.filter((_, i) => i !== index)
    }));
  };

  const headers = {
    "Content-Type": "application/json",
  };

  const fetchFoods = () => {
    setLoading(true);
    fetch("http://localhost:8080/foods")
      .then(r => r.json())
      .then(data => { setFoods(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchFoods(); }, []);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3000);
  };

  const handleAdd = async () => {
    if (!form.name.trim())
      return showMsg("error", "Name is required.");

    let payload = {
      name: form.name,
      category: form.category,
      description: form.description,
      available: form.available,
      basePrice: null,
      variants: []
    };

    if (form.hasVariants) {
      if (form.variants.length === 0)
        return showMsg("error", "At least one variant required.");

      const invalidVariant = form.variants.find(
        v =>
          !v.label.trim() ||
          !v.price ||
          isNaN(v.price) ||
          Number(v.price) < 0
      );

      if (invalidVariant)
        return showMsg(
          "error",
          "All variants need name and non-negative price."
        );

      payload.variants = form.variants.map(v => ({
        label: v.label,
        price: Number(v.price),
        available: true
      }));
    } else {
      if (!form.price || isNaN(form.price) || Number(form.price) < 0) {
        return showMsg("error", "Valid non-negative price is required.");
      }
      payload.basePrice = Number(form.price);
    }

    const res = await fetch("http://localhost:8080/foods", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      showMsg("success", "Item added!");
      setForm({
        name: "",
        category: "",
        description: "",
        available: true,
        hasVariants: false,
        price: "",
        variants: [
          { label: "Half", price: "" },
          { label: "Full", price: "" }
        ]
      });
      fetchFoods();
    } else {
      showMsg("error", "Failed to add item.");
    }
  };

  const startEdit = (food) => {
    setEditId(food.id);
    setEditData({
      name: food.name,
      basePrice: food.basePrice != null ? food.basePrice : "",
      category: food.category,
      description: food.description || "",
      available: food.available,
      hasVariants: food.variants && food.variants.length > 0
    });
  };

  const saveEdit = async (food) => {
    if (!editData.name.trim()) return;

    const hasVars = editData.hasVariants;
    let basePriceVal = null;

    if (!hasVars) {
      if (editData.basePrice === "" || isNaN(editData.basePrice) || Number(editData.basePrice) < 0) {
        return;
      }
      basePriceVal = Number(editData.basePrice);
    }

    const payload = {
      name: editData.name,
      category: editData.category,
      description: editData.description,
      available: editData.available,
      basePrice: basePriceVal,
      variants: hasVars ? food.variants : []
    };

    const res = await fetch(`http://localhost:8080/foods/${food.id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });
    if (res.ok) { setEditId(null); fetchFoods(); }
  };

  const deleteFood = async (id) => {
    await fetch(`http://localhost:8080/foods/${id}`, { method: "DELETE" });
    fetchFoods();
  };

  return (
    <>
      <div className="admin-card">
        <div className="admin-section-title">Add New Item</div>
        <div className="add-form">
          <div className="add-form-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <input className="admin-input" placeholder="Item name" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input className="admin-input" placeholder="Category" value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
          </div>
          <input className="admin-input" placeholder="Description (optional)" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />

          <div style={{ margin: "4px 0" }}>
            <label className="toggle-label" style={{ fontWeight: "600" }}>
              <input type="checkbox" checked={form.hasVariants}
                onChange={e => setForm(f => ({ ...f, hasVariants: e.target.checked }))} />
              This item has variants
            </label>
          </div>

          {!form.hasVariants ? (
            <input className="admin-input" type="number" placeholder="Price (₹)" value={form.price}
              onChange={e => setForm(f => ({ ...f, price: e.target.value }))} style={{ marginTop: "4px" }} />
          ) : (
            <div className="variant-section" style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", marginTop: "4px" }}>
              <div className="admin-section-title" style={{ fontSize: "14px", marginBottom: "12px" }}>Variants</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px" }}>
                {form.variants.map((variant, index) => (
                  <div key={index} className="add-form-row" style={{ gridTemplateColumns: "2fr 2fr auto", alignItems: "center", gap: "10px" }}>
                    <input
                      className="admin-input"
                      placeholder="Variant Name (e.g. Half, Full)"
                      value={variant.label}
                      onChange={(e) => updateVariant(index, "label", e.target.value)}
                    />
                    <input
                      className="admin-input"
                      type="number"
                      placeholder="Price"
                      value={variant.price}
                      onChange={(e) => updateVariant(index, "price", e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-delete"
                      onClick={() => removeVariant(index)}
                      style={{ padding: "10px 14px", height: "100%", display: "flex", alignItems: "center" }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="btn-edit"
                onClick={addVariant}
                style={{ padding: "8px 16px" }}
              >
                + Add Variant
              </button>
            </div>
          )}

          <div className="add-form-footer" style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
            <label className="toggle-label">
              <input type="checkbox" checked={form.available}
                onChange={e => setForm(f => ({ ...f, available: e.target.checked }))} />
              Available
            </label>
            <div className="form-messages">
              {msg.type === "error"   && <span className="msg-error">{msg.text}</span>}
              {msg.type === "success" && <span className="msg-success">{msg.text}</span>}
            </div>
            <button className="admin-btn-primary" onClick={handleAdd}>+ Add Item</button>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-section-header">
          <div className="admin-section-title">Menu Items</div>
          <span className="admin-count">{foods.length} items</span>
        </div>
        {loading ? (
          <div className="admin-state"><div className="admin-spinner" /></div>
        ) : foods.length === 0 ? (
          <div className="admin-state">No items yet. Add one above!</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th><th>Variants</th><th>Category</th>
                  <th>Description</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {foods.map(food => (
                  <tr key={food.id} className={editId === food.id ? "editing-row" : ""}>
                    {editId === food.id ? (
                      <>
                        <td><input className="table-input" value={editData.name}
                          onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} /></td>
                        <td>
                          {editData.hasVariants ? (
                            food.variants?.map(v => (
                              <div key={v.id} style={{ fontSize: "13px", whiteSpace: "nowrap" }}>
                                {v.label} - ₹{v.price}
                              </div>
                            ))
                          ) : (
                            <input className="table-input" type="number" value={editData.basePrice}
                              onChange={e => setEditData(d => ({ ...d, basePrice: e.target.value }))} style={{ width: "80px" }} />
                          )}
                        </td>
                        <td><input className="table-input" value={editData.category}
                          onChange={e => setEditData(d => ({ ...d, category: e.target.value }))} /></td>
                        <td><input className="table-input" value={editData.description}
                          onChange={e => setEditData(d => ({ ...d, description: e.target.value }))} /></td>
                        <td>
                          <label className="toggle-label">
                            <input type="checkbox" checked={editData.available}
                              onChange={e => setEditData(d => ({ ...d, available: e.target.checked }))} />
                            {editData.available ? "Available" : "Unavailable"}
                          </label>
                        </td>
                        <td>
                          <div className="action-btns">
                            <button className="btn-save" onClick={() => saveEdit(food)}>Save</button>
                            <button className="btn-cancel" onClick={() => setEditId(null)}>Cancel</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="td-name">{food.name}</td>
                        <td>
                          {food.variants && food.variants.length > 0 ? (
                            food.variants.map(v => (
                              <div key={v.id} style={{ fontSize: "13px", whiteSpace: "nowrap" }}>
                                <strong>{v.label}</strong>: ₹{v.price}
                              </div>
                            ))
                          ) : (
                            <div style={{ fontSize: "13px" }}>₹{food.basePrice}</div>
                          )}
                        </td>
                        <td><span className="cat-tag">{food.category || "—"}</span></td>
                        <td className="td-desc">{food.description || <span className="td-empty">—</span>}</td>
                        <td>
                          <span className={`status-tag ${food.available ? "status-available" : "status-unavailable"}`}>
                            {food.available ? "Available" : "Unavailable"}
                          </span>
                        </td>
                        <td>
                          <div className="action-btns">
                            <button className="btn-edit" onClick={() => startEdit(food)}>Edit</button>
                            <button className="btn-delete" onClick={() => deleteFood(food.id)}>Delete</button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// ── Orders Tab ────────────────────────────────────────────
function OrdersTab() {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [updating, setUpdating]   = useState(null);
  const [selectedDate, setSelectedDate] = useState(todayString());

  const headers = {
    "Content-Type": "application/json",
  };

  const fetchOrders = () => {
    setLoading(true);
    fetch("http://localhost:8080/orders")
      .then(r => r.json())
      .then(data => {
        const sorted = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  const changeStatus = async (id, status) => {
    setUpdating(id);
    await fetch(`http://localhost:8080/orders/${id}/status`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status }),
    });
    await fetchOrders();
    setUpdating(null);
  };

  const deleteOrder = async (id) => {
    setUpdating(id);
    try {
      await fetch(`http://localhost:8080/orders/${id}`, { method: "DELETE" });
      await fetchOrders();
    } catch (e) {
      console.error("Failed to delete order", e);
    } finally {
      setUpdating(null);
    }
  };

  const deleteCompletedOrders = async () => {
    setLoading(true);
    try {
      await fetch("http://localhost:8080/orders/completed", { method: "DELETE" });
      await fetchOrders();
    } catch (e) {
      console.error("Failed to delete completed orders", e);
      setLoading(false);
    }
  };

  const clearAllOrders = async () => {
    setLoading(true);
    try {
      await fetch("http://localhost:8080/orders", { method: "DELETE" });
      await fetchOrders();
    } catch (e) {
      console.error("Failed to clear all orders", e);
      setLoading(false);
    }
  };

  // Filter orders by selected date (match on local date string)
  const filteredOrders = orders.filter(order => {
    if (!order.createdAt) return false;
    return toDateString(new Date(order.createdAt)) === selectedDate;
  });

  const isToday = selectedDate === todayString();
  const pendingCount  = filteredOrders.filter(o => o.status === "PENDING").length;
  const revenue       = filteredOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const totalPending  = orders.filter(o => o.status === "PENDING").length;

  return (
    <div className="admin-card">

      {/* ── Date Selector ── */}
      <div className="date-filter-bar">
        <div className="date-filter-left">
          <span className="date-filter-icon">📅</span>
          <span className="date-filter-label">Viewing orders for</span>
          <input
            className="date-filter-input"
            type="date"
            value={selectedDate}
            max={todayString()}
            onChange={e => setSelectedDate(e.target.value)}
          />
        </div>
        {!isToday && (
          <button className="today-pill" onClick={() => setSelectedDate(todayString())}>
            ↩ Back to Today
          </button>
        )}
        {isToday && (
          <span className="today-chip">Today</span>
        )}
      </div>

      {/* ── Day Summary ── */}
      <div className="day-summary">
        <div className="day-summary-card">
          <span className="day-summary-label">Orders</span>
          <span className="day-summary-val">{filteredOrders.length}</span>
        </div>
        <div className="day-summary-card">
          <span className="day-summary-label">Revenue</span>
          <span className="day-summary-val day-summary-green">₹{revenue.toFixed(0)}</span>
        </div>
        <div className="day-summary-card">
          <span className="day-summary-label">Pending</span>
          <span className="day-summary-val day-summary-amber">{pendingCount}</span>
        </div>
      </div>

      {/* ── Section header ── */}
      <div className="admin-section-header" style={{ marginBottom: 16 }}>
        <div>
          <div className="admin-section-title" style={{ marginBottom: 0 }}>
            {formatDisplayDate(selectedDate)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {totalPending > 0 && isToday && (
            <span className="order-pending-badge">{totalPending} new</span>
          )}
          <span className="admin-count">{filteredOrders.length} orders</span>
          <button className="btn-edit" onClick={fetchOrders}>↻ Refresh</button>
          {orders.filter(o => o.status === "READY").length > 0 && (
            <button
              className="btn-delete"
              onClick={deleteCompletedOrders}
            >
              🧹 Delete Completed
            </button>
          )}
          {orders.length > 0 && (
            <button className="btn-delete" onClick={clearAllOrders}>
              🗑️ Clear All
            </button>
          )}
        </div>
      </div>

      {/* ── Orders List ── */}
      {loading ? (
        <div className="admin-state"><div className="admin-spinner" /></div>
      ) : filteredOrders.length === 0 ? (
        <div className="admin-state">
          <span style={{ fontSize: 32 }}>📋</span>
          {isToday ? "No orders today yet." : `No orders on ${formatDisplayDate(selectedDate)}.`}
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map(order => (
            <div key={order.id} className={`order-card order-card-${order.status?.toLowerCase()}`}>
              <div className="order-card-header">
                <div className="order-card-left">
                  <div className="order-token-hero">#{order.dailyNumber}</div>
                  <div className="order-card-meta">
                    <span className="order-customer">{order.customerName}</span>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
                <div className="order-card-right">
                  <span className="order-time">{formatTime(order.createdAt)}</span>
                  <span className="order-total">₹{order.totalPrice?.toFixed(2)}</span>
                </div>
              </div>

              <div className="order-items-list">
                {order.items?.map((item, i) => (
                  <div key={i} className="order-item-row">
                    <span className="order-item-name">
                      <strong>{item.foodName}</strong>
                      {item.variantName && (
                        <span className="variant-chip">{item.variantName}</span>
                      )}
                    </span>
                    <span className="order-item-qty">x{item.quantity}</span>
                    <span className="order-item-price">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="order-card-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                <div>
                  {order.status === "PENDING" && (
                    <button className="order-btn order-btn-done"
                      disabled={updating === order.id}
                      onClick={() => changeStatus(order.id, "READY")}>
                      {updating === order.id ? "..." : "🏁 Mark Ready"}
                    </button>
                  )}
                  {order.status === "READY" && (
                    <span className="order-done-label">✅ Ready for pickup</span>
                  )}
                </div>
                <button
                  className="btn-delete"
                  disabled={updating === order.id}
                  onClick={() => deleteOrder(order.id)}
                  style={{ padding: "6px 12px", fontSize: "12px" }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────
export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tab, setTab]     = useState("menu");

  useEffect(() => {
    const loggedIn = localStorage.getItem("adminLoggedIn");
    if (loggedIn === "true") {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (val) => {
    if (val) {
      localStorage.setItem("adminLoggedIn", "true");
      setIsLoggedIn(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) return <LoginGate onLogin={handleLogin} />;

  return (
    <div className="admin-app">
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-logo">
            <span>🍽️</span>
            <span className="admin-logo-text">HomeKitchen</span>
            <span className="admin-badge">ADMIN</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div className="admin-tabs">
              <button className={`admin-tab ${tab === "menu" ? "admin-tab-active" : ""}`}
                onClick={() => setTab("menu")}>🍕 Menu</button>
              <button className={`admin-tab ${tab === "orders" ? "admin-tab-active" : ""}`}
                onClick={() => setTab("orders")}>📋 Orders</button>
            </div>
            <button className="admin-logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      <div className="admin-body">
        {tab === "menu"   && <MenuTab />}
        {tab === "orders" && <OrdersTab />}
      </div>
    </div>
  );
}