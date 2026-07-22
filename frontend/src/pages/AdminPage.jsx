import { useState, useEffect } from "react";
import { 
  Plus, 
  Minus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  LogOut, 
  RefreshCw, 
  Calendar, 
  TrendingUp, 
  Clock, 
  ClipboardList, 
  Check, 
  ChefHat, 
  UtensilsCrossed,
  LayoutDashboard,
  Menu,
  Sparkles,
  Lock,
  User,
  Activity,
  Loader2
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────
function toDateString(date) {
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
    PENDING:   { bg: "bg-amber-50 text-amber-700 border-amber-200/50", label: "Pending" },
    PREPARING: { bg: "bg-blue-50 text-blue-700 border-blue-200/50", label: "Preparing" },
    READY:     { bg: "bg-emerald-50 text-emerald-700 border-emerald-200/50", label: "Ready" },
    COMPLETED: { bg: "bg-stone-100 text-stone-600 border-stone-200", label: "Completed" },
  };
  const current = map[status] || { bg: "bg-stone-50 text-stone-500 border-stone-200", label: status };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border tracking-wide uppercase ${current.bg}`}>
      {current.label}
    </span>
  );
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
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 selection:bg-orange-100 selection:text-orange-950">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 border border-stone-200/80 shadow-2xl flex flex-col items-center animate-scale-in">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-orange-500/20 hover:scale-105 transition-transform duration-300">
          <Lock className="w-5 h-5 stroke-[2.5]" />
        </div>
        <h2 className="font-extrabold text-xl text-stone-900 tracking-tight">Admin Console</h2>
        <p className="text-stone-400 text-xs mt-1 mb-6 font-semibold uppercase tracking-wider">Access control panel</p>

        <div className="w-full space-y-4">
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold outline-none focus:border-orange-500 transition duration-200 bg-stone-50/50 focus:bg-white"
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && submit()}
              autoFocus
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold outline-none focus:border-orange-500 transition duration-200 bg-stone-50/50 focus:bg-white"
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && submit()}
            />
          </div>

          {error && <div className="text-red-500 text-xs font-bold text-center animate-pop">{error}</div>}

          <button 
            className="w-full bg-gradient-to-r from-orange-600 to-amber-500 text-white py-2.5 rounded-xl font-extrabold text-xs shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35 hover:-translate-y-0.5 active:translate-y-0 transition duration-150"
            onClick={submit} 
            disabled={loading}
          >
            {loading ? "Verifying..." : "Sign In"}
          </button>
        </div>
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
      variants: [...f.variants, { label: "", price: "" }]
    }));
  };

  const updateVariant = (index, field, value) => {
    setForm(f => ({
      ...f,
      variants: f.variants.map((v, i) => i === index ? { ...v, [field]: value } : v)
    }));
  };

  const removeVariant = (index) => {
    setForm(f => ({
      ...f,
      variants: f.variants.filter((_, i) => i !== index)
    }));
  };

  const fetchFoods = () => {
    setLoading(true);
    fetch("http://localhost:8080/foods")
      .then(r => r.json())
      .then(data => { setFoods(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchFoods(); }, []);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3000);
  };

  const handleAdd = async () => {
    if (!form.name.trim()) return showMsg("error", "Name is required.");

    let payload = {
      name: form.name,
      category: form.category,
      description: form.description,
      available: form.available,
      basePrice: null,
      variants: []
    };

    if (form.hasVariants) {
      if (form.variants.length === 0) return showMsg("error", "At least one variant required.");
      const invalidVariant = form.variants.find(
        v => !v.label.trim() || !v.price || isNaN(v.price) || Number(v.price) < 0
      );
      if (invalidVariant) return showMsg("error", "All variants need name and non-negative price.");
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      showMsg("success", "Item added successfully!");
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
      if (editData.basePrice === "" || isNaN(editData.basePrice) || Number(editData.basePrice) < 0) return;
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) { setEditId(null); fetchFoods(); }
  };

  const deleteFood = async (id) => {
    await fetch(`http://localhost:8080/foods/${id}`, { method: "DELETE" });
    fetchFoods();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Creation form card */}
      <div className="bg-white rounded-2xl border border-stone-200/60 p-5 shadow-sm">
        <h3 className="font-extrabold text-stone-900 text-sm mb-4 tracking-tight">Create Menu Item</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <input 
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 outline-none focus:border-orange-500 focus:bg-stone-50/5 transition" 
            placeholder="Item name (e.g. Garlic Naan)" 
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
          />
          <input 
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 outline-none focus:border-orange-500 focus:bg-stone-50/5 transition" 
            placeholder="Category (e.g. Mains, Beverages)" 
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))} 
          />
          <input 
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 outline-none focus:border-orange-500 focus:bg-stone-50/5 transition sm:col-span-2" 
            placeholder="Description (optional details)" 
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-semibold text-stone-600 cursor-pointer select-none">
            <input 
              type="checkbox" 
              className="w-4 h-4 accent-orange-600 cursor-pointer" 
              checked={form.hasVariants}
              onChange={e => setForm(f => ({ ...f, hasVariants: e.target.checked }))} 
            />
            <span>This item has variants (e.g. sizes or portions)</span>
          </label>
        </div>

        {/* Pricing variants inputs */}
        {!form.hasVariants ? (
          <div className="mt-3">
            <input 
              className="w-full max-w-xs px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 outline-none focus:border-orange-500 focus:bg-stone-50/5 transition" 
              type="number" 
              placeholder="Price (₹)" 
              value={form.price}
              onChange={e => setForm(f => ({ ...f, price: e.target.value }))} 
            />
          </div>
        ) : (
          <div className="mt-4 border-t border-stone-100 pt-4 space-y-3">
            <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">Portion Options</span>
            <div className="space-y-2">
              {form.variants.map((variant, index) => (
                <div key={index} className="flex gap-2 items-center animate-fade-in">
                  <input
                    className="flex-1 px-3.5 py-2 rounded-xl border border-stone-200 text-xs outline-none focus:border-orange-500"
                    placeholder="Size label (e.g. Medium)"
                    value={variant.label}
                    onChange={(e) => updateVariant(index, "label", e.target.value)}
                  />
                  <input
                    className="w-24 px-3.5 py-2 rounded-xl border border-stone-200 text-xs outline-none focus:border-orange-500"
                    type="number"
                    placeholder="Price"
                    value={variant.price}
                    onChange={(e) => updateVariant(index, "price", e.target.value)}
                  />
                  <button
                    type="button"
                    className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-all duration-200"
                    onClick={() => removeVariant(index)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-100 rounded-xl text-xs font-bold transition duration-200"
              onClick={addVariant}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Option</span>
            </button>
          </div>
        )}

        {/* Creation actions */}
        <div className="mt-5 border-t border-stone-100 pt-4 flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-semibold text-stone-600 cursor-pointer">
            <input 
              type="checkbox" 
              className="w-4 h-4 accent-orange-600" 
              checked={form.available}
              onChange={e => setForm(f => ({ ...f, available: e.target.checked }))} 
            />
            <span>Available on Menu</span>
          </label>

          <div className="flex items-center gap-4">
            {msg.text && (
              <span className={`text-xs font-bold animate-pop ${msg.type === "success" ? "text-emerald-600" : "text-red-500"}`}>
                {msg.text}
              </span>
            )}
            <button 
              className="bg-stone-900 text-white px-5 py-2 rounded-xl font-extrabold text-xs shadow-md hover:bg-stone-850 active:scale-98 transition duration-200" 
              onClick={handleAdd}
            >
              Add to Menu
            </button>
          </div>
        </div>
      </div>

      {/* Grid list table */}
      <div className="bg-white rounded-2xl border border-stone-200/60 p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-extrabold text-stone-900 text-sm tracking-tight">Active Menu ({foods.length})</h3>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
        ) : foods.length === 0 ? (
          <p className="text-stone-400 text-xs py-6 text-center">No menu items found. Get started above.</p>
        ) : (
          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-100 text-stone-400 font-bold uppercase tracking-wider">
                  <th className="py-2.5 pr-4">Item details</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Pricing</th>
                  <th className="py-2.5 px-4">Availability</th>
                  <th className="py-2.5 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100/60">
                {foods.map(food => {
                  const isEditing = editId === food.id;
                  return (
                    <tr key={food.id} className={`transition duration-200 ${isEditing ? "bg-orange-50/20" : "hover:bg-stone-50/30"}`}>
                      <td className="py-3 pr-4 font-semibold text-stone-850">
                        {isEditing ? (
                          <div className="space-y-1">
                            <input 
                              className="px-2 py-1 rounded-lg border outline-none text-xs focus:border-orange-500 font-semibold text-stone-900 bg-white" 
                              value={editData.name}
                              onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} 
                            />
                            <input 
                              className="w-full px-2 py-1 rounded-lg border outline-none text-[10px] focus:border-orange-500 font-medium text-stone-500 bg-white" 
                              placeholder="Description"
                              value={editData.description}
                              onChange={e => setEditData(d => ({ ...d, description: e.target.value }))} 
                            />
                          </div>
                        ) : (
                          <div>
                            <span className="block font-bold text-stone-900">{food.name}</span>
                            {food.description && <span className="block text-[10px] text-stone-400 font-medium mt-0.5 line-clamp-1">{food.description}</span>}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <input 
                            className="px-2 py-1 rounded-lg border outline-none text-xs focus:border-orange-500 bg-white" 
                            value={editData.category}
                            onChange={e => setEditData(d => ({ ...d, category: e.target.value }))} 
                          />
                        ) : (
                          <span className="px-2 py-1 bg-stone-100 rounded-lg text-stone-600 font-bold uppercase tracking-wider text-[9px]">{food.category || "General"}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-stone-850">
                        {isEditing ? (
                          editData.hasVariants ? (
                            <span className="text-[10px] text-stone-400 italic">Configure above</span>
                          ) : (
                            <input 
                              type="number"
                              className="w-20 px-2 py-1 rounded-lg border outline-none text-xs focus:border-orange-500 bg-white" 
                              value={editData.basePrice}
                              onChange={e => setEditData(d => ({ ...d, basePrice: e.target.value }))} 
                            />
                          )
                        ) : (
                          food.variants && food.variants.length > 0 ? (
                            <div className="space-y-0.5">
                              {food.variants.map(v => (
                                <span key={v.id} className="block text-[10px] whitespace-nowrap text-stone-600 font-medium">
                                  <strong>{v.label}</strong>: ₹{v.price}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span>₹{food.basePrice}</span>
                          )
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={editData.available}
                              onChange={e => setEditData(d => ({ ...d, available: e.target.checked }))} 
                            />
                            <span className="text-[10px] font-semibold">{editData.available ? "Active" : "Hidden"}</span>
                          </label>
                        ) : (
                          <span className={`inline-block w-2.5 h-2.5 rounded-full transition-all duration-300 ${food.available ? "bg-emerald-500" : "bg-stone-300"}`} title={food.available ? "Available" : "Unavailable"} />
                        )}
                      </td>
                      <td className="py-3 pl-4 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-1.5">
                            <button className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition" onClick={() => saveEdit(food)}>
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-500 rounded-lg transition" onClick={() => setEditId(null)}>
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1.5">
                            <button className="p-1.5 hover:bg-stone-100 text-stone-500 rounded-lg transition" onClick={() => startEdit(food)}>
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition" onClick={() => deleteFood(food.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

// ── Orders Tab ────────────────────────────────────────────
function OrdersTab() {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [updating, setUpdating]   = useState(null);
  const [selectedDate, setSelectedDate] = useState(todayString());

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

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  const changeStatus = async (id, status) => {
    setUpdating(id);
    await fetch(`http://localhost:8080/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
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
      console.error(e);
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
      console.error(e);
      setLoading(false);
    }
  };

  const clearAllOrders = async () => {
    setLoading(true);
    try {
      await fetch("http://localhost:8080/orders", { method: "DELETE" });
      await fetchOrders();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (!order.createdAt) return false;
    return toDateString(new Date(order.createdAt)) === selectedDate;
  });

  const isToday = selectedDate === todayString();
  const pendingCount  = filteredOrders.filter(o => o.status === "PENDING" || o.status === "PREPARING").length;
  const revenue       = filteredOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const totalPending  = orders.filter(o => o.status === "PENDING").length;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Date filter & summaries */}
      <div className="bg-white rounded-2xl border border-stone-200/60 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Calendar className="w-5 h-5 text-orange-500" />
          <span className="text-xs font-bold text-stone-600">Viewing Date:</span>
          <input
            className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold outline-none focus:border-orange-500 cursor-pointer bg-stone-50"
            type="date"
            value={selectedDate}
            max={todayString()}
            onChange={e => setSelectedDate(e.target.value)}
          />
          {!isToday && (
            <button 
              className="text-xs font-bold bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200/50 px-3 py-1.5 rounded-xl transition duration-200 active:scale-97" 
              onClick={() => setSelectedDate(todayString())}
            >
              Today
            </button>
          )}
        </div>

        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          <button 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-100 rounded-xl text-xs font-bold transition duration-200 active:scale-97 whitespace-nowrap"
            onClick={fetchOrders}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          {orders.filter(o => o.status === "COMPLETED").length > 0 && (
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 border border-red-200/40 rounded-xl text-xs font-bold transition duration-200 active:scale-97 whitespace-nowrap"
              onClick={deleteCompletedOrders}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Completed</span>
            </button>
          )}
          {orders.length > 0 && (
            <button 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 border border-red-200/40 rounded-xl text-xs font-bold transition duration-200 active:scale-97 whitespace-nowrap" 
              onClick={clearAllOrders}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Ledger</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3.5">
        <div className="bg-white rounded-2xl border border-stone-200/60 p-4 shadow-sm flex flex-col justify-between hover:scale-102 transition duration-300">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Orders</span>
          <span className="font-extrabold text-2xl text-stone-900">{filteredOrders.length}</span>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200/60 p-4 shadow-sm flex flex-col justify-between hover:scale-102 transition duration-300">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Revenue</span>
          <span className="font-extrabold text-2xl text-emerald-600">₹{revenue.toFixed(0)}</span>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200/60 p-4 shadow-sm flex flex-col justify-between hover:scale-102 transition duration-300">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Queue</span>
          <span className="font-extrabold text-2xl text-amber-500">{pendingCount}</span>
        </div>
      </div>

      {/* Main feed header */}
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-orange-500" />
        <h4 className="font-extrabold text-stone-900 text-sm tracking-tight">{formatDisplayDate(selectedDate)}</h4>
        {totalPending > 0 && isToday && (
          <span className="text-[9px] font-bold text-orange-600 bg-orange-50 border border-orange-200/40 px-2 py-0.5 rounded-full animate-pulse ml-2 uppercase">
            {totalPending} new
          </span>
        )}
      </div>

      {/* Orders console feed list */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border border-stone-200/50 rounded-2xl p-10 text-center flex flex-col items-center animate-scale-in">
          <ClipboardList className="w-8 h-8 text-stone-300 mb-3" />
          <h5 className="font-bold text-sm text-stone-700">No orders recorded</h5>
          <p className="text-stone-400 text-xs mt-0.5">{isToday ? "Fresh orders will queue here dynamically." : "Choose another date using the selector."}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border border-stone-200/60 overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 animate-scale-in">
              
              {/* Header card info */}
              <div className="p-4 bg-stone-50/50 border-b border-stone-100 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-orange-650 tracking-tight">#{order.dailyNumber}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="mt-1.5">
                    <span className="block font-bold text-sm text-stone-900 leading-snug">{order.customerName}</span>
                    {order.customerPhone && <span className="block text-[10px] text-stone-400 font-semibold tracking-wide mt-0.5">📞 {order.customerPhone}</span>}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-bold text-stone-400 block tracking-wider">{formatTime(order.createdAt)}</span>
                  <span className="font-extrabold text-sm text-stone-950 block mt-1">₹{order.totalPrice?.toFixed(2)}</span>
                </div>
              </div>

              {/* Items row */}
              <div className="p-4 flex-1 space-y-2.5">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex justify-between items-start text-xs border-b border-stone-100/40 pb-2 last:border-b-0 last:pb-0">
                    <div className="pr-4">
                      <span className="font-semibold text-stone-850">{item.foodItem?.name || "Deleted item"}</span>
                      {item.variant?.label && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 text-[8px] font-bold uppercase tracking-wider">{item.variant.label}</span>
                      )}
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <span className="text-stone-400 font-bold text-[10px] mr-2">x{item.quantity}</span>
                      <span className="font-bold text-stone-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer status buttons */}
              <div className="p-3 border-t border-stone-100 bg-stone-50/20 flex items-center justify-between gap-2">
                <div>
                  {order.status === "PENDING" && (
                    <button 
                      className="flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/50 hover:scale-102 active:scale-98 px-3.5 py-1.5 rounded-xl text-xs font-bold transition duration-200"
                      disabled={updating === order.id}
                      onClick={() => changeStatus(order.id, "PREPARING")}
                    >
                      <ChefHat className="w-3.5 h-3.5" />
                      <span>Prepare</span>
                    </button>
                  )}
                  {order.status === "PREPARING" && (
                    <button 
                      className="flex items-center gap-1 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/50 hover:scale-102 active:scale-98 px-3.5 py-1.5 rounded-xl text-xs font-bold transition duration-200"
                      disabled={updating === order.id}
                      onClick={() => changeStatus(order.id, "READY")}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Ready</span>
                    </button>
                  )}
                  {order.status === "READY" && (
                    <button 
                      className="flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/50 hover:scale-102 active:scale-98 px-3.5 py-1.5 rounded-xl text-xs font-bold transition duration-200"
                      disabled={updating === order.id}
                      onClick={() => changeStatus(order.id, "COMPLETED")}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Complete</span>
                    </button>
                  )}
                  {order.status === "COMPLETED" && (
                    <span className="text-xs font-bold text-stone-400 block ml-2">Delivered & Closed</span>
                  )}
                </div>

                <button
                  className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition duration-200"
                  disabled={updating === order.id}
                  onClick={() => deleteOrder(order.id)}
                >
                  <Trash2 className="w-4 h-4" />
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
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-16 selection:bg-orange-100 selection:text-orange-950 transition-colors duration-300">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-stone-200/80 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-stone-900 flex items-center justify-center text-white">
              <LayoutDashboard className="w-4.5 h-4.5 text-orange-500" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-stone-900 block leading-tight">Home Kitchen</span>
              <span className="text-[9px] text-orange-600 font-extrabold block tracking-wider uppercase leading-none mt-0.5">Admin Panel</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-stone-100 p-0.5 rounded-xl border border-stone-200/30">
              <button 
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition duration-300 ${tab === "menu" ? "bg-white text-stone-900 shadow-sm scale-102" : "text-stone-500 hover:text-stone-850"}`}
                onClick={() => setTab("menu")}
              >
                Menu
              </button>
              <button 
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition duration-300 ${tab === "orders" ? "bg-white text-stone-900 shadow-sm scale-102" : "text-stone-500 hover:text-stone-850"}`}
                onClick={() => setTab("orders")}
              >
                Orders
              </button>
            </div>

            <button 
              className="p-2 hover:bg-stone-100 border border-stone-200/60 rounded-xl text-stone-500 hover:text-stone-800 transition duration-200 active:scale-95" 
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Workspace view */}
      <main className="max-w-4xl mx-auto px-4 mt-6">
        {tab === "menu" && <MenuTab />}
        {tab === "orders" && <OrdersTab />}
      </main>

    </div>
  );
}