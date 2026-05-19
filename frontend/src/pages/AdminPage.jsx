import { useState, useEffect, useCallback, useMemo } from "react";
import "../Admin.css";

// ── Helpers ──────────────────────────────────────────────
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
    PENDING:   { cls: "order-status-pending",   label: "Pending" },
    CONFIRMED: { cls: "order-status-confirmed", label: "Confirmed" },
    DONE:      { cls: "order-status-done",      label: "Done" },
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
      if (res.ok && data.token) {
        onLogin(data.token);
      } else {
        setError(data.error || "Invalid credentials.");
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
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => { setUsername(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && submit()}
          autoFocus
        />
        <input
          className={`gate-input ${error ? "gate-input-error" : ""}`}
          type="password"
          placeholder="Password"
          value={password}
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
function MenuTab({ token }) {
  const [foods, setFoods]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editId, setEditId]     = useState(null);
  const [editData, setEditData] = useState({});
  const [form, setForm]         = useState({ name: "", price: "", category: "", description: "", available: true });
  const [msg, setMsg]           = useState({ type: "", text: "" });

  const authHeaders = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
  
  const memoAuthHeaders = useMemo(() => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  }), [token]);
  

  const fetchFoods = () => {
    setLoading(true);
    fetch("http://localhost:8080/foods", { headers: authHeaders })
      .then(r => r.json())
      .then(data => { setFoods(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const fetchFoodsCb = useCallback(() => {
    setLoading(true);
    return fetch("http://localhost:8080/foods", { headers: memoAuthHeaders })
      .then(r => r.json())
      .then(data => { setFoods(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [memoAuthHeaders]);

  useEffect(() => { (async () => { await fetchFoodsCb(); })(); }, [fetchFoodsCb]);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3000);
  };

  const handleAdd = async () => {
    if (!form.name.trim()) return showMsg("error", "Name is required.");
    if (!form.price || isNaN(form.price)) return showMsg("error", "Valid price required.");
    const res = await fetch("http://localhost:8080/foods", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ ...form, price: parseFloat(form.price) }),
    });
    if (res.ok) {
      showMsg("success", "Item added!");
      setForm({ name: "", price: "", category: "", description: "", available: true });
      fetchFoods();
    } else showMsg("error", "Failed to add item.");
  };

  const startEdit = (food) => {
    setEditId(food.id);
    setEditData({ name: food.name, price: food.price, category: food.category, description: food.description || "", available: food.available });
  };

  const saveEdit = async (id) => {
    const res = await fetch(`http://localhost:8080/foods/${id}`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ ...editData, price: parseFloat(editData.price) }),
    });
    if (res.ok) { setEditId(null); fetchFoods(); }
  };

  const deleteFood = async (id) => {
    await fetch(`http://localhost:8080/foods/${id}`, { method: "DELETE", headers: authHeaders });
    fetchFoods();
  };

  return (
    <>
      <div className="admin-card">
        <div className="admin-section-title">Add New Item</div>
        <div className="add-form">
          <div className="add-form-row">
            <input className="admin-input" placeholder="Item name" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input className="admin-input" placeholder="Price (₹)" type="number" value={form.price}
              onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            <input className="admin-input" placeholder="Category" value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
          </div>
          <input className="admin-input" placeholder="Description (optional)" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="add-form-footer">
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
                  <th>Name</th><th>Price</th><th>Category</th>
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
                        <td><input className="table-input table-input-sm" type="number" value={editData.price}
                          onChange={e => setEditData(d => ({ ...d, price: e.target.value }))} /></td>
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
                            <button className="btn-save" onClick={() => saveEdit(food.id)}>Save</button>
                            <button className="btn-cancel" onClick={() => setEditId(null)}>Cancel</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="td-name">{food.name}</td>
                        <td className="td-price">₹{food.price}</td>
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
function OrdersTab({ token }) {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [updating, setUpdating] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  const authHeaders = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
  const memoAuthHeaders = useMemo(() => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  }), [token]);
  const fetchOrdersCb = useCallback(() => {
    setLoading(true);
    return fetch("http://localhost:8080/orders", { headers: memoAuthHeaders })
      .then(r => r.json())
      .then(data => {
        const sorted = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [memoAuthHeaders]);

  const fetchOrders = fetchOrdersCb;

  useEffect(() => {
    (async () => { await fetchOrdersCb(); })();

    let es = null;
    let retryCount = 0;
    let reconnectTimer = null;

    const connect = () => {
      // note: SSE endpoint currently unauthenticated; secure later if needed
      es = new EventSource("http://localhost:8080/orders/stream");
      setConnectionStatus("connecting");

      es.addEventListener("open", () => {
        retryCount = 0;
        setConnectionStatus("connected");
      });

      es.addEventListener("orderPlaced", (e) => {
        try {
          const order = JSON.parse(e.data);
          setOrders(prev => {
            if (prev.some(o => o.id === order.id)) return prev;
            return [order, ...prev];
          });
        } catch (err) {
          console.error("Failed to parse SSE order", err);
          // fallback: refetch full list
          fetchOrdersCb();
        }
      });

      es.addEventListener("error", () => {
        setConnectionStatus("disconnected");
        if (es) es.close();
        // exponential backoff reconnect
        retryCount += 1;
        const delay = Math.min(30000, 1000 * Math.pow(2, Math.min(retryCount, 6)));
        reconnectTimer = setTimeout(connect, delay);
      });
    };

    connect();

    return () => {
      if (es) es.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [fetchOrdersCb]);

  const changeStatus = async (id, status) => {
    setUpdating(id);
    await fetch(`http://localhost:8080/orders/${id}/status`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ status }),
    });
    await fetchOrders();
    setUpdating(null);
  };

  const deleteOrder = async (id) => {
    setUpdating(id);
    try {
      await fetch(`http://localhost:8080/orders/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
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
      await fetch("http://localhost:8080/orders/completed", {
        method: "DELETE",
        headers: authHeaders,
      });
      await fetchOrders();
    } catch (e) {
      console.error("Failed to delete completed orders", e);
      setLoading(false);
    }
  };

  const clearAllOrders = async () => {
    setLoading(true);
    try {
      await fetch("http://localhost:8080/orders", {
        method: "DELETE",
        headers: authHeaders,
      });
      await fetchOrders();
    } catch (e) {
      console.error("Failed to clear all orders", e);
      setLoading(false);
    }
  };

  const pendingCount = orders.filter(o => o.status === "PENDING").length;

  return (
    <div className="admin-card">
      <div className="admin-section-header">
        <div className="admin-section-title">Incoming Orders</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ConnectionIndicator status={connectionStatus} />
          </div>
          {pendingCount > 0 && (
            <span className="order-pending-badge">{pendingCount} new</span>
          )}
          <span className="admin-count">{orders.length} total</span>
          <button className="btn-edit" onClick={fetchOrders}>↻ Refresh</button>
          {orders.length > 0 && (
            <>
              <button 
                className="btn-delete" 
                onClick={deleteCompletedOrders}
                disabled={orders.filter(o => o.status === "DONE").length === 0}
                style={{
                  opacity: orders.filter(o => o.status === "DONE").length === 0 ? 0.5 : 1,
                  cursor: orders.filter(o => o.status === "DONE").length === 0 ? "not-allowed" : "pointer"
                }}
              >
                🧹 Delete Completed
              </button>
              <button className="btn-delete" onClick={clearAllOrders}>
                🗑️ Clear All
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="admin-state"><div className="admin-spinner" /></div>
      ) : orders.length === 0 ? (
        <div className="admin-state">
          <span style={{ fontSize: 32 }}>📋</span>
          No orders yet.
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className={`order-card order-card-${order.status?.toLowerCase()}`}>
              <div className="order-card-header">
                <div className="order-card-left">
                  <span className="order-id">#{order.id}</span>
                  <span className="order-customer">{order.customerName}</span>
                  <StatusBadge status={order.status} />
                </div>
                <div className="order-card-right">
                  <span className="order-time">{formatTime(order.createdAt)}</span>
                  <span className="order-total">₹{order.totalPrice?.toFixed(2)}</span>
                </div>
              </div>

              <div className="order-items-list">
                {order.items?.map((item, i) => (
                  <div key={i} className="order-item-row">
                    <span className="order-item-name">{item.foodName}</span>
                    <span className="order-item-qty">× {item.quantity}</span>
                    <span className="order-item-price">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="order-card-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                <div>
                  {order.status === "PENDING" && (
                    <button className="order-btn order-btn-confirm"
                      disabled={updating === order.id}
                      onClick={() => changeStatus(order.id, "CONFIRMED")}>
                      {updating === order.id ? "..." : "✓ Confirm"}
                    </button>
                  )}
                  {order.status === "CONFIRMED" && (
                    <button className="order-btn order-btn-done"
                      disabled={updating === order.id}
                      onClick={() => changeStatus(order.id, "DONE")}>
                      {updating === order.id ? "..." : "🏁 Mark Done"}
                    </button>
                  )}
                  {order.status === "DONE" && (
                    <span className="order-done-label">✓ Completed</span>
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
  const [token, setToken] = useState(null);
  const [tab, setTab]     = useState("menu");

  if (!token) return <LoginGate onLogin={setToken} />;

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
            <button className="admin-logout" onClick={() => setToken(null)}>Logout</button>
          </div>
        </div>
      </header>

      <div className="admin-body">
        {tab === "menu"   && <MenuTab token={token} />}
        {tab === "orders" && <OrdersTab token={token} />}
      </div>
    </div>
  );
}

function ConnectionIndicator({ status }) {
  const color = status === "connected" ? "#22c55e" : status === "connecting" ? "#f59e0b" : "#ef4444";
  const label = status === "connected" ? "Live" : status === "connecting" ? "Connecting" : "Offline";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 10, height: 10, borderRadius: 10, background: color }} />
      <div style={{ fontSize: 12, color: "#666" }}>{label}</div>
    </div>
  );
}