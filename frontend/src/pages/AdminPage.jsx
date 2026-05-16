import { useState, useEffect } from "react";
import axios from "axios";
import "../Admin.css";

const ADMIN_PASSWORD = "kitchen123";

const EMPTY_FORM = {
  name: "",
  price: "",
  category: "",
  description: "",
  available: true,
};

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // ── Auth ──
  const handleUnlock = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setUnlocked(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
      setPasswordInput("");
    }
  };

  // ── Fetch ──
  const fetchFoods = () => {
    setLoading(true);
    axios
      .get("http://localhost:8080/foods")
      .then((res) => { setFoods(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (unlocked) fetchFoods();
  }, [unlocked]);

  // ── Add food ──
  const handleAdd = () => {
    setFormError("");
    setFormSuccess("");

    if (!form.name.trim()) return setFormError("Name is required.");
    if (!form.category.trim()) return setFormError("Category is required.");
    if (form.price === "" || isNaN(form.price) || Number(form.price) < 0)
      return setFormError("Enter a valid price.");

    axios
      .post("http://localhost:8080/foods", {
        ...form,
        price: Number(form.price),
      })
      .then(() => {
        setForm(EMPTY_FORM);
        setFormSuccess("Item added successfully!");
        fetchFoods();
        setTimeout(() => setFormSuccess(""), 3000);
      })
      .catch(() => setFormError("Failed to add item."));
  };

  // ── Edit ──
  const startEdit = (food) => {
    setEditingId(food.id);
    setEditForm({
      name: food.name,
      price: food.price,
      category: food.category,
      description: food.description || "",
      available: food.available,
    });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  const saveEdit = (id) => {
    axios
      .put(`http://localhost:8080/foods/${id}`, {
        ...editForm,
        price: Number(editForm.price),
      })
      .then(() => { cancelEdit(); fetchFoods(); })
      .catch(() => alert("Failed to update item."));
  };

  // ── Delete ──
  const handleDelete = (id) => {
    if (!window.confirm("Delete this item?")) return;
    axios
      .delete(`http://localhost:8080/foods/${id}`)
      .then(() => fetchFoods())
      .catch(() => alert("Failed to delete item."));
  };

  // ══════════════════════════════
  // PASSWORD GATE
  // ══════════════════════════════
  if (!unlocked) {
    return (
      <div className="gate-wrapper">
        <div className="gate-card">
          <div className="gate-icon">🔒</div>
          <h1 className="gate-title">Admin Access</h1>
          <p className="gate-sub">Enter your password to manage the menu</p>
          <input
            className={`gate-input ${passwordError ? "gate-input-error" : ""}`}
            type="password"
            placeholder="Password"
            value={passwordInput}
            onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            autoFocus
          />
          {passwordError && <p className="gate-error">Incorrect password. Try again.</p>}
          <button className="gate-btn" onClick={handleUnlock}>Unlock</button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════
  // ADMIN PANEL
  // ══════════════════════════════
  return (
    <div className="admin-app">

      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-logo">
            <span>🍽</span>
            <span className="admin-logo-text">Home Kitchen</span>
            <span className="admin-badge">Admin</span>
          </div>
          <button className="admin-logout" onClick={() => setUnlocked(false)}>
            Lock panel
          </button>
        </div>
      </header>

      <div className="admin-body">

        {/* Add item form */}
        <section className="admin-card">
          <h2 className="admin-section-title">Add New Item</h2>
          <div className="add-form">
            <div className="add-form-row">
              <input
                className="admin-input"
                placeholder="Item name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                className="admin-input"
                placeholder="Category *"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <input
                className="admin-input"
                type="number"
                placeholder="Price (₹) *"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <input
              className="admin-input"
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className="add-form-footer">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={form.available}
                  onChange={(e) => setForm({ ...form, available: e.target.checked })}
                />
                <span>Available</span>
              </label>
              <div className="form-messages">
                {formError && <span className="msg-error">{formError}</span>}
                {formSuccess && <span className="msg-success">{formSuccess}</span>}
              </div>
              <button className="admin-btn-primary" onClick={handleAdd}>
                + Add Item
              </button>
            </div>
          </div>
        </section>

        {/* Menu table */}
        <section className="admin-card">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Menu Items</h2>
            <span className="admin-count">{foods.length} items</span>
          </div>

          {loading ? (
            <div className="admin-state">
              <div className="admin-spinner" />
              <p>Loading...</p>
            </div>
          ) : foods.length === 0 ? (
            <div className="admin-state">
              <p>No items yet. Add one above.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {foods.map((food) =>
                    editingId === food.id ? (
                      // ── Editing row ──
                      <tr key={food.id} className="editing-row">
                        <td>
                          <input
                            className="table-input"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            className="table-input"
                            value={editForm.category}
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            className="table-input table-input-sm"
                            type="number"
                            value={editForm.price}
                            onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            className="table-input"
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          />
                        </td>
                        <td>
                          <label className="toggle-label">
                            <input
                              type="checkbox"
                              checked={editForm.available}
                              onChange={(e) => setEditForm({ ...editForm, available: e.target.checked })}
                            />
                            <span>{editForm.available ? "Available" : "Unavailable"}</span>
                          </label>
                        </td>
                        <td>
                          <div className="action-btns">
                            <button className="btn-save" onClick={() => saveEdit(food.id)}>Save</button>
                            <button className="btn-cancel" onClick={cancelEdit}>Cancel</button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      // ── Normal row ──
                      <tr key={food.id}>
                        <td className="td-name">{food.name}</td>
                        <td>
                          <span className="cat-tag">{food.category}</span>
                        </td>
                        <td className="td-price">₹{food.price}</td>
                        <td className="td-desc">{food.description || <span className="td-empty">—</span>}</td>
                        <td>
                          <span className={`status-tag ${food.available ? "status-available" : "status-unavailable"}`}>
                            {food.available ? "Available" : "Unavailable"}
                          </span>
                        </td>
                        <td>
                          <div className="action-btns">
                            <button className="btn-edit" onClick={() => startEdit(food)}>Edit</button>
                            <button className="btn-delete" onClick={() => handleDelete(food.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}