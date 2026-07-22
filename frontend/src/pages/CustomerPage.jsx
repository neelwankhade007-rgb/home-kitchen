import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  X, 
  CheckCircle2, 
  ChevronRight, 
  Loader2, 
  User, 
  Phone, 
  UtensilsCrossed,
  Flame,
  Sparkles,
  Coffee,
  IceCream,
  Pizza,
  ArrowRight,
  Clock,
  ChefHat,
  Check
} from "lucide-react";

const CATEGORY_ICONS = {
  rolls: Pizza,
  meals: Flame,
  drinks: Coffee,
  snacks: Sparkles,
  desserts: IceCream,
  specials: Sparkles,
};

function getCategoryIcon(category) {
  return CATEGORY_ICONS[category?.toLowerCase()] || UtensilsCrossed;
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
  const [customerPhone, setCustomerPhone] = useState("");
  const [formError, setFormError] = useState("");
  const [customizingFood, setCustomizingFood] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "error" });
  const sectionRefs = useRef({});

  // Real-time Order Tracking States
  const [activeOrderId, setActiveOrderId] = useState(() => localStorage.getItem("activeOrderId"));
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  useEffect(() => {
    axios
      .get("http://localhost:8080/foods")
      .then((res) => {
        setFoods(res.data);
        if (res.data.length > 0) {
          setActiveCategory(res.data[0].category);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Check if active order has already completed and expired (5-min cutoff)
    const savedOrderId = localStorage.getItem("activeOrderId");
    if (savedOrderId) {
      axios.get(`http://localhost:8080/orders/${savedOrderId}`)
        .then((res) => {
          if (res.data.status === "COMPLETED" && res.data.completedAt) {
            const diffMs = new Date().getTime() - new Date(res.data.completedAt).getTime();
            if (diffMs >= 5 * 60 * 1000) {
              localStorage.removeItem("activeOrderId");
              setActiveOrderId(null);
            }
          }
        })
        .catch(() => {
          localStorage.removeItem("activeOrderId");
          setActiveOrderId(null);
        });
    }
  }, []);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast(t => ({ ...t, show: false })), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Real-time tracking polling when tracking view is active
  useEffect(() => {
    let interval;
    if (trackingOpen && activeOrderId) {
      // Immediate fetch
      setTrackingLoading(true);
      axios.get(`http://localhost:8080/orders/${activeOrderId}`)
        .then((res) => {
          setTrackingOrder(res.data);
          setTrackingLoading(false);
        })
        .catch(() => {
          setTrackingLoading(false);
          localStorage.removeItem("activeOrderId");
          setActiveOrderId(null);
          setTrackingOpen(false);
          showToast("Active order not found or deleted by kitchen.");
        });

      // Poll every 4 seconds for immediate responsive status updates
      interval = setInterval(() => {
        axios.get(`http://localhost:8080/orders/${activeOrderId}`)
          .then((res) => {
            setTrackingOrder(res.data);
            if (res.data.status === "COMPLETED" && res.data.completedAt) {
              const diffMs = new Date().getTime() - new Date(res.data.completedAt).getTime();
              if (diffMs >= 5 * 60 * 1000) {
                localStorage.removeItem("activeOrderId");
                setActiveOrderId(null);
                setTrackingOpen(false);
                setTrackingOrder(null);
                showToast("Order completed and closed.");
              }
            }
          })
          .catch(() => {
            localStorage.removeItem("activeOrderId");
            setActiveOrderId(null);
            setTrackingOpen(false);
            showToast("Your order was removed or finalized by the kitchen.");
          });
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [trackingOpen, activeOrderId]);

  const showToast = (message, type = "error") => {
    setToast({ show: true, message, type });
  };

  const closeTracking = () => {
    if (trackingOrder?.status === "COMPLETED") {
      localStorage.removeItem("activeOrderId");
      setActiveOrderId(null);
      setTrackingOrder(null);
    }
    setTrackingOpen(false);
  };

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
        foodId: food.id,
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
            unitPrice: variant.price,
            foodId: variant.foodId
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
            unitPrice: food.basePrice,
            foodId: food.id
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
      showToast("Please enter your name.");
      return;
    }
    if (!customerPhone.trim()) {
      setFormError("Please enter your contact number.");
      showToast("Please enter your contact number.");
      return;
    }
    if (!/^\d{10}$/.test(customerPhone.trim())) {
      setFormError("Please enter a valid 10-digit number.");
      showToast("Please enter a valid 10-digit phone number.");
      return;
    }
    setFormError("");

    const order = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      items: cartItems.map((item) => ({
        foodItem: { id: item.foodId },
        variant: item.key.startsWith("variant-") ? { id: item.id } : null,
        price: item.unitPrice,
        quantity: item.qty,
      })),
    };

    axios.post("http://localhost:8080/orders", order)
      .then((res) => {
        setTokenNumber(res.data.dailyNumber);
        
        // Save the active order ID in local storage for real-time tracking
        localStorage.setItem("activeOrderId", res.data.id);
        setActiveOrderId(res.data.id);

        setCart({});
        setCartOpen(false);
        setCustomerName("");
        setCustomerPhone("");
        setOrderPlaced(true);
      })
      .catch(() => showToast("Failed to place order. Please try again."));
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-28 selection:bg-amber-100 selection:text-amber-900 transition-colors duration-300">
      
      {/* Custom sliding notification toast at the top */}
      {toast.show && (
        <div className="fixed top-4 left-4 right-4 z-50 max-w-sm mx-auto animate-slide-in-up">
          <div className={`p-4.5 rounded-2xl shadow-xl flex items-center justify-between border ${
            toast.type === "success" 
              ? "bg-emerald-50 text-emerald-800 border-emerald-250/60" 
              : "bg-red-50 text-red-800 border-red-250/60"
          }`}>
            <span className="text-xs font-bold">{toast.message}</span>
            <button onClick={() => setToast(t => ({ ...t, show: false }))} className="p-1 hover:bg-stone-200/20 rounded-lg transition duration-150">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Premium Navbar */}
      <nav className="sticky top-0 z-40 bg-white/85 backdrop-blur-lg border-b border-stone-200/60 shadow-sm transition-all duration-300">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 hover:scale-105 transition-transform duration-300">
              <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
                Home Kitchen
              </span>
              <span className="block text-[10px] text-stone-500 font-semibold tracking-wider uppercase leading-none mt-0.5">
                Fresh & Homemade
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeOrderId && (
              <button 
                className="group flex items-center gap-1.5 bg-orange-50 border border-orange-200/40 hover:bg-orange-100/75 text-orange-700 px-3.5 py-2 rounded-xl font-bold text-xs transition duration-200 active:scale-97"
                onClick={() => setTrackingOpen(true)}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-650"></span>
                </span>
                <span>Track Order</span>
              </button>
            )}
            
            {cartCount > 0 && (
              <button 
                className="group flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-500 text-white px-4.5 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 transition duration-200"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingBag className="w-4 h-4 group-hover:scale-110 transition duration-200" />
                <span key={cartCount} className="inline-block animate-pop">
                  {cartCount} {cartCount === 1 ? "item" : "items"}
                </span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Category Navigation Pills */}
      {!loading && categories.length > 0 && (
        <div className="sticky top-16 z-30 bg-stone-50/90 backdrop-blur-md border-b border-stone-200/30 py-3 transition-all duration-300">
          <div className="max-w-4xl mx-auto px-4 overflow-x-auto scrollbar-none flex gap-2">
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat);
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                    isActive 
                      ? "bg-stone-900 text-white shadow-md shadow-stone-900/10 scale-102" 
                      : "bg-white text-stone-600 hover:bg-stone-100/80 border border-stone-200/50 hover:scale-102"
                  }`}
                  onClick={() => scrollToCategory(cat)}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-orange-500" : ""}`} />
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Menu Feed */}
      <main className="max-w-3xl mx-auto px-4 mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <p className="text-stone-500 font-semibold text-xs tracking-wide">Assembling delicious options...</p>
          </div>
        ) : foods.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-4">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-stone-850">Menu is empty</h3>
            <p className="text-stone-500 text-xs max-w-xs mt-1">Check back later or check in with the administrator.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat);
              return (
                <section
                  key={cat}
                  className="scroll-mt-36"
                  ref={(el) => (sectionRefs.current[cat] = el)}
                >
                  <div className="flex items-center gap-2 mb-4 border-b border-stone-200/30 pb-2">
                    <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h2 className="font-extrabold text-stone-900 text-base capitalize tracking-tight">{cat}</h2>
                    <span className="text-[10px] font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full ml-auto">
                      {grouped[cat].length} items
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {grouped[cat].map((food) => {
                      const soldOut = !food.available;
                      return (
                        <div 
                          className={`group relative bg-white rounded-2xl border border-stone-200/50 p-4.5 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:shadow-stone-200/40 hover:-translate-y-0.5 active:translate-y-0 ${
                            soldOut ? "opacity-60 bg-stone-50/50" : ""
                          }`}
                          key={food.id}
                        >
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-bold text-stone-900 leading-snug group-hover:text-orange-600 transition-colors duration-200">{food.name}</h4>
                            </div>
                            {food.description && (
                              <p className="text-stone-500 text-xs mt-1.5 leading-relaxed line-clamp-2">
                                {food.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-5">
                            <span className="font-extrabold text-lg text-stone-950">
                              ₹{food.variants && food.variants.length > 0 
                                ? Math.min(...food.variants.map(v => v.price)) 
                                : food.basePrice}
                              {food.variants && food.variants.length > 0 && (
                                <span className="text-[10px] text-stone-400 font-semibold block leading-none">Starting from</span>
                              )}
                            </span>

                            {soldOut ? (
                              <span className="text-xs font-bold text-stone-400 bg-stone-100 px-3.5 py-2 rounded-xl border border-stone-200/20">
                                Sold Out
                              </span>
                            ) : food.variants && food.variants.length > 0 ? (
                              <div className="flex flex-col items-end gap-1">
                                {(() => {
                                  const totalQty = food.variants.reduce((sum, v) => sum + (cart[`variant-${v.id}`] || 0), 0);
                                  return totalQty === 0 ? (
                                    <button
                                      className="flex items-center gap-1 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:scale-103 active:scale-97 px-4 py-2 rounded-xl font-bold text-xs border border-amber-200/60 transition-all duration-200"
                                      onClick={() => {
                                        setCustomizingFood(food);
                                        setSelectedVariant(food.variants[0]);
                                      }}
                                    >
                                      <Plus className="w-3 h-3 stroke-[2.5]" />
                                      <span>Add</span>
                                    </button>
                                  ) : (
                                    <div className="flex items-center bg-stone-900 text-white rounded-xl overflow-hidden text-xs font-bold shadow-md shadow-stone-900/10">
                                      <button
                                        className="px-2.5 py-2 hover:bg-stone-850 active:bg-stone-800 transition"
                                        onClick={() => {
                                          const activeVariant = [...food.variants].reverse().find(v => (cart[`variant-${v.id}`] || 0) > 0);
                                          if (activeVariant) {
                                            removeFromCart(`variant-${activeVariant.id}`);
                                          }
                                        }}
                                      >
                                        <Minus className="w-3.5 h-3.5" />
                                      </button>
                                      <span key={totalQty} className="px-2.5 min-w-[20px] text-center animate-pop">{totalQty}</span>
                                      <button
                                        className="px-2.5 py-2 hover:bg-stone-850 active:bg-stone-800 transition"
                                        onClick={() => {
                                          setCustomizingFood(food);
                                          setSelectedVariant(food.variants[0]);
                                        }}
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  );
                                })()}
                                <span className="text-[9px] text-amber-600 font-bold tracking-wider uppercase">Customizable</span>
                              </div>
                            ) : (
                              <div>
                                {(() => {
                                  const qty = cart[`food-${food.id}`] || 0;
                                  return qty === 0 ? (
                                    <button 
                                      className="flex items-center gap-1 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:scale-103 active:scale-97 px-4 py-2 rounded-xl font-bold text-xs border border-amber-200/60 transition-all duration-200" 
                                      onClick={() => addToCart(`food-${food.id}`)}
                                    >
                                      <Plus className="w-3 h-3 stroke-[2.5]" />
                                      <span>Add</span>
                                    </button>
                                  ) : (
                                    <div className="flex items-center bg-stone-900 text-white rounded-xl overflow-hidden text-xs font-bold shadow-md shadow-stone-900/10">
                                      <button className="px-2.5 py-2 hover:bg-stone-850 active:bg-stone-800 transition" onClick={() => removeFromCart(`food-${food.id}`)}>
                                        <Minus className="w-3.5 h-3.5" />
                                      </button>
                                      <span key={qty} className="px-2.5 min-w-[20px] text-center animate-pop">{qty}</span>
                                      <button className="px-2.5 py-2 hover:bg-stone-850 active:bg-stone-800 transition" onClick={() => addToCart(`food-${food.id}`)}>
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>
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
              );
            })}
          </div>
        )}
      </main>

      {/* Sticky Cart Summary Bar */}
      {cartCount > 0 && !cartOpen && (
        <div 
          className="fixed bottom-4 left-4 right-4 max-w-md mx-auto bg-stone-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-2xl cursor-pointer hover:-translate-y-1 hover:bg-stone-950 active:-translate-y-0.5 transition duration-300 z-40 animate-slide-in-up"
          onClick={() => setCartOpen(true)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center animate-pulse">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-sm block">{cartCount} {cartCount === 1 ? "item" : "items"} in cart</span>
              <span className="text-[11px] text-stone-400 block line-clamp-1">
                {cartItems.map((item) => `${item.name} x${item.qty}`).join(", ")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-xl transition duration-200">
            <span className="font-extrabold text-sm">₹{cartTotal}</span>
            <ChevronRight className="w-4 h-4 text-orange-500" />
          </div>
        </div>
      )}

      {/* Cart Drawer Modal */}
      {cartOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex justify-end animate-fade-in" onClick={() => setCartOpen(false)}>
          <div className="w-full max-w-md bg-white h-full flex flex-col justify-between shadow-2xl animate-slide-in-right" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-600" />
                <h3 className="font-extrabold text-lg text-stone-900">Your Basket</h3>
              </div>
              <button 
                className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-700 transition" 
                onClick={() => setCartOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable area: Items & Forms */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-none">
              
              {/* Item List */}
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-stone-100 bg-stone-50/50 hover:bg-stone-50 transition duration-200" key={item.key}>
                    <div className="pr-4">
                      <span className="font-bold text-sm text-stone-850 block">{item.name}</span>
                      <span className="text-xs text-stone-500 font-semibold mt-0.5">₹{item.price * item.qty}</span>
                    </div>
                    <div className="flex items-center bg-white border border-stone-200 text-stone-850 rounded-lg overflow-hidden text-xs font-bold">
                      <button className="px-2 py-1.5 hover:bg-stone-50 transition" onClick={() => removeFromCart(item.key)}>
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 min-w-[20px] text-center">{item.qty}</span>
                      <button className="px-2 py-1.5 hover:bg-stone-50 transition" onClick={() => addToCart(item.key)}>
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Checkout Form */}
              <div className="border-t border-stone-100 pt-6 space-y-4">
                <h4 className="font-extrabold text-sm text-stone-900 tracking-tight">Checkout Details</h4>
                <div className="space-y-3">
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-semibold outline-none transition duration-200 ${
                        formError && !customerName.trim() 
                          ? "border-red-400 bg-red-50/5 focus:border-red-500" 
                          : "border-stone-250 focus:border-orange-500 focus:bg-stone-50/10"
                      }`}
                      type="text"
                      placeholder="Your name"
                      value={customerName}
                      onChange={(e) => { setCustomerName(e.target.value); setFormError(""); }}
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-semibold outline-none transition duration-200 ${
                        formError && !customerPhone.trim() 
                          ? "border-red-400 bg-red-50/5 focus:border-red-500" 
                          : "border-stone-250 focus:border-orange-500 focus:bg-stone-50/10"
                      }`}
                      type="tel"
                      placeholder="Your contact number"
                      value={customerPhone}
                      onChange={(e) => { setCustomerPhone(e.target.value); setFormError(""); }}
                    />
                  </div>
                  {formError && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{formError}</p>}
                </div>
              </div>

            </div>

            {/* Footer Total */}
            <div className="p-4 border-t border-stone-100 bg-stone-50/60">
              <div className="flex items-center justify-between mb-4">
                <span className="text-stone-500 font-bold text-sm">Grand Total</span>
                <span className="font-extrabold text-xl text-stone-950">₹{cartTotal}</span>
              </div>
              <button 
                className="w-full bg-gradient-to-r from-orange-600 to-amber-500 text-white py-3 rounded-xl font-extrabold text-sm shadow-xl shadow-orange-500/20 hover:shadow-orange-500/35 hover:-translate-y-0.5 active:translate-y-0 transition duration-200 flex items-center justify-center gap-2"
                onClick={placeOrder}
              >
                <span>Place Order</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Customizable Variants Modal Overlay */}
      {customizingFood && selectedVariant && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setCustomizingFood(null)}>
          <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-stone-900">{customizingFood.name}</h3>
                <span className="text-[10px] text-stone-400 font-bold tracking-wider uppercase">Select Portion Size</span>
              </div>
              <button 
                className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-700 transition" 
                onClick={() => setCustomizingFood(null)}
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Options list */}
            <div className="p-4 space-y-2">
              {customizingFood.variants.map((variant) => {
                const isSelected = selectedVariant.id === variant.id;
                return (
                  <div 
                    key={variant.id} 
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'border-orange-500 bg-orange-50/20 text-orange-950 scale-101' 
                        : 'border-stone-150 hover:bg-stone-50 text-stone-700'
                    }`}
                    onClick={() => setSelectedVariant(variant)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-255 ${
                        isSelected ? 'border-orange-500 text-orange-500' : 'border-stone-300'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                      </div>
                      <span className="font-bold text-sm">{variant.label}</span>
                    </div>
                    <span className="font-extrabold text-sm text-orange-650">₹{variant.price}</span>
                  </div>
                );
              })}
            </div>

            {/* Action Footer */}
            <div className="p-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between">
              <span className="font-extrabold text-lg text-stone-900">₹{selectedVariant.price}</span>
              <button 
                className="bg-stone-900 hover:bg-stone-950 active:scale-97 text-white px-5 py-2 rounded-xl font-extrabold text-xs transition duration-150"
                onClick={() => {
                  addToCart(`variant-${selectedVariant.id}`);
                  setCustomizingFood(null);
                }}
              >
                Add to Basket
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Success Order Confirmation Overlay */}
      {orderPlaced && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center shadow-2xl border border-stone-100 flex flex-col items-center animate-scale-in">
            
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <h2 className="font-extrabold text-xl text-stone-900">Order Received!</h2>
            <p className="text-stone-500 text-xs mt-1">Your delicious meal is now queueing up.</p>

            <div className="my-6 bg-stone-50 border border-stone-100 rounded-2xl p-4 w-full">
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest block">Token Number</span>
              <span className="font-black text-5xl text-orange-650 block mt-1 tracking-tight">#{tokenNumber}</span>
            </div>

            <p className="text-stone-500 text-xs leading-relaxed max-w-xs mb-6">
              Kindly present this token number when collecting your order from the kitchen counter.
            </p>

            <div className="flex flex-col w-full gap-2">
              <button
                className="w-full bg-gradient-to-r from-orange-600 to-amber-500 text-white py-3 rounded-xl font-extrabold text-sm hover:opacity-90 transition duration-150 shadow-md shadow-orange-500/20"
                onClick={() => {
                  setOrderPlaced(false);
                  setTrackingOpen(true);
                }}
              >
                Track Order Status
              </button>
              <button
                className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 py-3 rounded-xl font-extrabold text-sm transition duration-150"
                onClick={() => setOrderPlaced(false)}
              >
                Back to Menu
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Real-time Order Tracking Drawer/Modal */}
      {trackingOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={closeTracking}>
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="p-4.5 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-600"></span>
                </span>
                <h3 className="font-extrabold text-base text-stone-900">Live Status Tracker</h3>
              </div>
              <button 
                className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-700 transition" 
                onClick={closeTracking}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tracking Content */}
            {trackingLoading && !trackingOrder ? (
              <div className="p-8 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
                <span className="text-stone-500 font-bold text-xs">Locating your token...</span>
              </div>
            ) : trackingOrder ? (
              <div className="p-5 space-y-6">
                
                {/* Order Summary Metadata */}
                <div className="flex justify-between items-center bg-stone-50 border border-stone-150/40 p-4 rounded-2xl">
                  <div>
                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Token ID</span>
                    <span className="font-black text-2xl text-stone-900">#{trackingOrder.dailyNumber}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Customer</span>
                    <span className="font-bold text-sm text-stone-850 block">{trackingOrder.customerName}</span>
                  </div>
                </div>

                {/* Progress Steps Timeline */}
                <div className="space-y-4 py-2">
                  {(() => {
                    const steps = [
                      { statusKey: "PENDING", label: "Order Received", desc: "Successfully registered in the queue", icon: Clock },
                      { statusKey: "PREPARING", label: "Preparing Meal", desc: "Our chef is baking/rolling your dish now", icon: ChefHat },
                      { statusKey: "READY", label: "Ready for Pickup", desc: "Fresh & hot! Grab it from the counter", icon: CheckCircle2 },
                      { statusKey: "COMPLETED", label: "Picked Up", desc: "Enjoy your food! Come back soon", icon: Check }
                    ];

                    const statusOrder = ["PENDING", "PREPARING", "READY", "COMPLETED"];
                    const currentIdx = statusOrder.indexOf(trackingOrder.status);

                    return steps.map((step, idx) => {
                      const StepIcon = step.icon;
                      const isPast = idx < currentIdx;
                      const isCurrent = idx === currentIdx;
                      const isUpcoming = idx > currentIdx;

                      return (
                        <div key={idx} className="flex gap-4 relative">
                          {/* Connector Line */}
                          {idx < steps.length - 1 && (
                            <div className={`absolute left-5 top-10 bottom-0 w-0.5 -translate-x-1/2 -z-10 ${
                              isPast ? "bg-orange-500" : "bg-stone-200"
                            }`} />
                          )}

                          {/* Node Icon */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${
                            isPast 
                              ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20" 
                              : isCurrent
                              ? "bg-white text-orange-600 border-orange-500 ring-4 ring-orange-100 animate-pulse shadow-md"
                              : "bg-stone-50 text-stone-400 border-stone-200"
                          }`}>
                            <StepIcon className="w-5 h-5" />
                          </div>

                          {/* Text labels */}
                          <div className="flex-1 pt-0.5">
                            <h4 className={`text-xs font-extrabold transition duration-200 ${
                              isUpcoming ? "text-stone-400" : "text-stone-900"
                            }`}>
                              {step.label}
                            </h4>
                            <p className="text-[10px] text-stone-500 mt-0.5 leading-snug">
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Items Summary list */}
                <div className="border-t border-stone-100 pt-4">
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-2">Order details</span>
                  <div className="max-h-24 overflow-y-auto space-y-1.5 scrollbar-none">
                    {trackingOrder.items?.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-stone-700">
                          {item.foodItem?.name || "Item"} {item.variant?.label && `(${item.variant.label})`} x{item.quantity}
                        </span>
                        <span className="font-bold text-stone-900">₹{(item.price * item.quantity).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-3 border-t border-stone-100/60 pt-2 text-xs">
                    <span className="font-bold text-stone-600">Total Charged</span>
                    <span className="font-black text-orange-700">₹{trackingOrder.totalPrice}</span>
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-8 text-center text-xs text-stone-400">No active tracking info found.</div>
            )}

            {/* Modal Footer */}
            <div className="p-4 border-t border-stone-100 bg-stone-50/50 flex justify-end gap-2">
              <button 
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition duration-200"
                onClick={closeTracking}
              >
                Close Tracking
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}