import { useEffect, useState, useRef } from "react";
import axios from "axios";
import "../App.css";

const CATEGORY_EMOJIS = {
  rolls: "🌯",
  meals: "🍛",
  drinks: "🥤",
  snacks: "🥪",
  desserts: "🍮",
  specials: "⭐",
};

function getCategoryEmoji(category) {
  return CATEGORY_EMOJIS[category?.toLowerCase()] || "🍽";
}

export default function CustomerPage() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [formError, setFormError] = useState("");
  const sectionRefs = useRef({});

  useEffect(() => {
    axios
      .get("http://localhost:8080/foods")
      .then((res) => {
        setFoods(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const categories = [...new Set(foods.map((f) => f.category).filter(Boolean))];

  const grouped = categories.reduce((acc, cat) => {
    acc[cat] = foods.filter((f) => f.category === cat);
    return acc;
  }, {});

  const cartItems = Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const food = foods.find((f) => String(f.id) === id);
      return { food, qty };
    });

  const cartTotal = cartItems.reduce((sum, { food, qty }) => sum + food.price * qty, 0);
  const cartCount = cartItems.reduce((sum, { qty }) => sum + qty, 0);

  const addToCart = (id) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id) => {
    setCart((prev) => {
      const next = { ...prev, [id]: (prev[id] || 1) - 1 };
      if (next[id] <= 0) delete next[id];
      return next;
    });
  };

  const scrollToCategory = (cat) => {
    setActiveCategory(cat);
    sectionRefs.current[cat]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const placeOrder = () => {
    if (!customerName.trim()) {
      setFormError("Please enter your name.");
      return;
    }
    if (!/^\d{10}$/.test(contactNumber.trim())) {
      setFormError("Please enter a valid 10-digit contact number.");
      return;
    }
    setFormError("");

    const order = {
      customerName: customerName.trim(),
      items: cartItems.map(({ food, qty }) => ({
        foodName: food.name,
        price: food.price,
        quantity: qty,
      })),
    };

    axios.post("http://localhost:8080/orders", order)
      .then(() => {
        setCart({});
        setCartOpen(false);
        setCustomerName("");
        setContactNumber("");
        setOrderPlaced(true);
        setTimeout(() => setOrderPlaced(false), 4000);
      })
      .catch(() => alert("Failed to place order. Try again."));
  };

  return (
    <div className="app">

      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-logo">
          <span className="navbar-emoji">🍽</span>
          <span className="navbar-name">Home Kitchen</span>
        </div>
        {cartCount > 0 && (
          <button className="navbar-cart-btn" onClick={() => setCartOpen(true)}>
            <span>🛒</span>
            <span>{cartCount} {cartCount === 1 ? "item" : "items"}</span>
          </button>
        )}
      </nav>

      {/* Category pills */}
      {!loading && categories.length > 0 && (
        <div className="category-bar">
          <div className="category-pills">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`cat-pill ${activeCategory === cat ? "cat-pill-active" : ""}`}
                onClick={() => scrollToCategory(cat)}
              >
                <span>{getCategoryEmoji(cat)}</span>
                <span>{cat}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="main">
        {loading ? (
          <div className="state-box">
            <div className="spinner" />
            <p>Loading menu...</p>
          </div>
        ) : foods.length === 0 ? (
          <div className="state-box">
            <span className="state-emoji">🍽</span>
            <p>Menu is empty right now.</p>
          </div>
        ) : (
          <div className="menu">
            {categories.map((cat) => (
              <section
                key={cat}
                className="menu-section"
                ref={(el) => (sectionRefs.current[cat] = el)}
              >
                <div className="section-heading">
                  <span className="section-emoji">{getCategoryEmoji(cat)}</span>
                  <h2 className="section-title">{cat}</h2>
                  <span className="section-count">{grouped[cat].length} items</span>
                </div>

                <div className="food-list">
                  {grouped[cat].map((food) => {
                    const qty = cart[food.id] || 0;
                    const soldOut = !food.available;
                    return (
                      <div className={`food-card ${soldOut ? "food-card-soldout" : ""}`} key={food.id}>
                        <div className="food-img">
                          <span className="food-img-emoji">{getCategoryEmoji(food.category)}</span>
                        </div>
                        <div className="food-info">
                          <span className="food-name">{food.name}</span>
                          {food.description && (
                            <p className="food-desc">{food.description}</p>
                          )}
                          <div className="food-bottom">
                            {soldOut ? (
                              <span className="sold-out-label">Sold out</span>
                            ) : (
                              <span className="food-price">₹{food.price}</span>
                            )}
                            {!soldOut && (
                              qty === 0 ? (
                                <button className="add-btn" onClick={() => addToCart(food.id)}>
                                  + Add
                                </button>
                              ) : (
                                <div className="counter">
                                  <button className="counter-btn" onClick={() => removeFromCart(food.id)}>−</button>
                                  <span className="counter-num">{qty}</span>
                                  <button className="counter-btn" onClick={() => addToCart(food.id)}>+</button>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Sticky cart bar */}
      {cartCount > 0 && !cartOpen && (
        <div className="sticky-cart" onClick={() => setCartOpen(true)}>
          <div className="sticky-cart-left">
            <span className="sticky-cart-count">{cartCount} {cartCount === 1 ? "item" : "items"}</span>
            <span className="sticky-cart-preview">
              {cartItems.slice(0, 2).map(({ food, qty }) => `${food.name} x${qty}`).join(", ")}
              {cartItems.length > 2 ? "..." : ""}
            </span>
          </div>
          <div className="sticky-cart-right">
            <span className="sticky-cart-total">₹{cartTotal}</span>
            <span>→</span>
          </div>
        </div>
      )}

      {/* Cart drawer */}
      {cartOpen && (
        <div className="overlay" onClick={() => setCartOpen(false)}>
          <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="cart-header">
              <h3 className="cart-title">Your Order</h3>
              <button className="cart-close" onClick={() => setCartOpen(false)}>✕</button>
            </div>

            {/* Scrollable area: items + customer fields */}
            <div className="cart-items">

              {/* Cart items */}
              {cartItems.map(({ food, qty }) => (
                <div className="cart-item" key={food.id}>
                  <div className="cart-item-info">
                    <span className="cart-item-name">{food.name}</span>
                    <span className="cart-item-price">₹{food.price * qty}</span>
                  </div>
                  <div className="counter">
                    <button className="counter-btn" onClick={() => removeFromCart(food.id)}>−</button>
                    <span className="counter-num">{qty}</span>
                    <button className="counter-btn" onClick={() => addToCart(food.id)}>+</button>
                  </div>
                </div>
              ))}

              {/* Divider */}
              <div className="cart-section-label">Your Details</div>

              {/* Name + Contact fields */}
              <div className="cart-customer-fields">
                <input
                  className={`cart-input ${formError && !customerName.trim() ? "cart-input-error" : ""}`}
                  type="text"
                  placeholder="Your name"
                  value={customerName}
                  onChange={(e) => { setCustomerName(e.target.value); setFormError(""); }}
                />
                <input
                  className={`cart-input ${formError && !/^\d{10}$/.test(contactNumber.trim()) ? "cart-input-error" : ""}`}
                  type="tel"
                  placeholder="Contact number (10 digits)"
                  value={contactNumber}
                  maxLength={10}
                  onChange={(e) => { setContactNumber(e.target.value.replace(/\D/g, "")); setFormError(""); }}
                />
                {formError && <p className="cart-form-error">{formError}</p>}
              </div>

            </div>

            {/* Footer: total + button */}
            <div className="cart-footer">
              <div className="cart-total-row">
                <span>Total</span>
                <span className="cart-total-amount">₹{cartTotal}</span>
              </div>
              <button className="place-order-btn" onClick={placeOrder}>
                Place Order · ₹{cartTotal}
              </button>
            </div>

          </div>
        </div>
      )}

      {orderPlaced && (
        <div className="order-toast">
          ✅ Order placed! We'll get it ready soon.
        </div>
      )}
    </div>
  );
}