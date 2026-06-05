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
  const [tokenNumber, setTokenNumber] = useState(null);
  const [customerName, setCustomerName] = useState("");
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

  const variantMap = {};
  foods.forEach(food => {
    food.variants?.forEach(variant => {
      variantMap[variant.id] = {
        ...variant,
        foodName: food.name,
        foodCategory: food.category
      };
    });
  });

  const cartItems = Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([key, qty]) => {
      if (key.startsWith("variant-")) {
        const variantId = key.replace("variant-", "");
        const variant = variantMap[variantId];
        if (variant) {
          return {
            key,
            id: variant.id,
            name: `${variant.foodName} (${variant.label})`,
            price: variant.price,
            qty,
            foodName: variant.foodName,
            variantName: variant.label,
            unitPrice: variant.price
          };
        }
      } else if (key.startsWith("food-")) {
        const foodId = key.replace("food-", "");
        const food = foods.find(f => String(f.id) === foodId);
        if (food) {
          return {
            key,
            id: food.id,
            name: food.name,
            price: food.basePrice,
            qty,
            foodName: food.name,
            variantName: null,
            unitPrice: food.basePrice
          };
        }
      }
      return null;
    })
    .filter(Boolean);

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);

  const addToCart = (key) => {
    setCart((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  };

  const removeFromCart = (key) => {
    setCart((prev) => {
      const next = { ...prev, [key]: (prev[key] || 1) - 1 };
      if (next[key] <= 0) delete next[key];
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
    setFormError("");

    const order = {
      customerName: customerName.trim(),
      items: cartItems.map((item) => ({
        foodName: item.foodName,
        variantName: item.variantName,
        price: item.unitPrice,
        quantity: item.qty,
      })),
    };

    axios.post("http://localhost:8080/orders", order)
      .then((res) => {

        setTokenNumber(res.data.dailyNumber);

        setCart({});
        setCartOpen(false);
        setCustomerName("");

        setOrderPlaced(true);

        setTimeout(() => {
          setOrderPlaced(false);
        }, 5000);
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
                          {soldOut ? (
                            <span className="sold-out-label">Sold out</span>
                          ) : food.variants && food.variants.length > 0 ? (
                            <div className="food-variants">
                              {food.variants.map((variant) => {
                                const qty = cart[`variant-${variant.id}`] || 0;
                                return (
                                  <div key={variant.id} className="variant-row">
                                    <div className="variant-info">
                                      <span className="variant-name">{variant.label}</span>
                                      <span className="variant-price">₹{variant.price}</span>
                                    </div>
                                    {qty === 0 ? (
                                      <button className="add-btn" onClick={() => addToCart(`variant-${variant.id}`)}>
                                        + Add
                                      </button>
                                    ) : (
                                      <div className="counter">
                                        <button className="counter-btn" onClick={() => removeFromCart(`variant-${variant.id}`)}>−</button>
                                        <span className="counter-num">{qty}</span>
                                        <button className="counter-btn" onClick={() => addToCart(`variant-${variant.id}`)}>+</button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="food-bottom">
                              <span className="food-price">₹{food.basePrice}</span>
                              {(() => {
                                const qty = cart[`food-${food.id}`] || 0;
                                return qty === 0 ? (
                                  <button className="add-btn" onClick={() => addToCart(`food-${food.id}`)}>
                                    + Add
                                  </button>
                                ) : (
                                  <div className="counter">
                                    <button className="counter-btn" onClick={() => removeFromCart(`food-${food.id}`)}>−</button>
                                    <span className="counter-num">{qty}</span>
                                    <button className="counter-btn" onClick={() => addToCart(`food-${food.id}`)}>+</button>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
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
              {cartItems.slice(0, 2).map((item) => `${item.name} x${item.qty}`).join(", ")}
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
              {cartItems.map((item) => (
                <div className="cart-item" key={item.key}>
                  <div className="cart-item-info">
                    <span className="cart-item-name">{item.name}</span>
                    <span className="cart-item-price">₹{item.price * item.qty}</span>
                  </div>
                  <div className="counter">
                    <button className="counter-btn" onClick={() => removeFromCart(item.key)}>−</button>
                    <span className="counter-num">{item.qty}</span>
                    <button className="counter-btn" onClick={() => addToCart(item.key)}>+</button>
                  </div>
                </div>
              ))}

              {/* Divider */}
              <div className="cart-section-label">Your Details</div>

              {/* Name field */}
              <div className="cart-customer-fields">
                <input
                  className={`cart-input ${formError && !customerName.trim() ? "cart-input-error" : ""}`}
                  type="text"
                  placeholder="Your name"
                  value={customerName}
                  onChange={(e) => { setCustomerName(e.target.value); setFormError(""); }}
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
        <div className="success-overlay">
          <div className="success-card">

            <h2>✅ Order Received</h2>

            <p>Your Token Number</p>

            <div className="token-number">
              #{tokenNumber}
            </div>

            <p>
              Please collect your order using this token.
            </p>

            <button
              onClick={() => setOrderPlaced(false)}
            >
              OK
            </button>

          </div>
        </div>
      )}
    </div>
  );
}