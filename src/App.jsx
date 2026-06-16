import { useState, useEffect, useRef } from "react";

// ─── SHARED DATA ────────────────────────────────────────────────────────────

const INITIAL_MENU = [
  { id: 1, category: "Cold Brew", name: "Original Cold Brew", desc: "18hr steeped, smooth & dark", price: 12, available: true, emoji: "🖤" },
  { id: 2, category: "Cold Brew", name: "Salted Caramel Cold Brew", desc: "House caramel, Himalayan salt finish", price: 15, available: true, emoji: "🧂" },
  { id: 3, category: "Cold Brew", name: "Coconut Cold Brew", desc: "Cold brew + fresh coconut water, no milk", price: 15, available: true, emoji: "🥥" },
  { id: 4, category: "Espresso", name: "Kofvee White", desc: "Double ristretto, steamed oat milk", price: 13, available: true, emoji: "☁️" },
  { id: 5, category: "Espresso", name: "Iced Americano", desc: "Double shot, cold water, ice", price: 11, available: true, emoji: "🧊" },
  { id: 6, category: "Espresso", name: "Oat Latte", desc: "Espresso, oat milk, light foam", price: 14, available: true, emoji: "🌾" },
  { id: 7, category: "Signature", name: "Kofvee Signature", desc: "Housemade concentrate, condensed milk, ice", price: 16, available: true, emoji: "⭐" },
  { id: 8, category: "Signature", name: "Brown Sugar Oat", desc: "Espresso, tiger stripes, oat milk", price: 17, available: true, emoji: "🍯" },
  { id: 9, category: "Non-Coffee", name: "Matcha Oat", desc: "Ceremonial grade, oat milk, honey", price: 14, available: true, emoji: "🍵" },
  { id: 10, category: "Non-Coffee", name: "Hojicha Latte", desc: "Roasted green tea, creamy, mild caffeine", price: 14, available: true, emoji: "🌿" },
];

const OUTLETS = [
  { id: "kl", name: "Kofvee KL Sentral", area: "Kuala Lumpur" },
  { id: "pj", name: "Kofvee PJ Section 17", area: "Petaling Jaya" },
  { id: "sg", name: "Kofvee Shah Alam", area: "Selangor" },
];

const CATEGORIES = ["All", "Cold Brew", "Espresso", "Signature", "Non-Coffee"];

// ─── TOKENS ─────────────────────────────────────────────────────────────────
const T = {
  bg: "#F7F4EF",
  surface: "#FFFFFF",
  surfaceAlt: "#F0ECE5",
  ink: "#1A1410",
  inkMid: "#6B5E52",
  inkLight: "#A8998C",
  accent: "#2C1810",      // deep espresso brown
  accentWarm: "#8B4513",  // saddlebrown — mid roast
  gold: "#C4973A",
  border: "#E2DAD0",
  green: "#2D6A4F",
  red: "#C0392B",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${T.bg}; color: ${T.ink}; font-family: 'DM Sans', system-ui, sans-serif; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 2px; }
  input, select, textarea { font-family: inherit; }
  button { font-family: inherit; }
`;

// ─── UTILS ──────────────────────────────────────────────────────────────────
let orderCounter = 1000;
const newOrderId = () => `KV-${++orderCounter}`;

function genOrder(cart, outlet, name) {
  return {
    id: newOrderId(),
    customerName: name,
    outlet,
    items: cart.map(i => ({ ...i })),
    total: cart.reduce((s, i) => s + i.price * i.qty, 0),
    status: "Preparing",
    placedAt: new Date(),
  };
}

// ─── SHARED COMPONENTS ──────────────────────────────────────────────────────
function Badge({ label, color = T.border, textColor = T.inkMid, small }) {
  return (
    <span style={{
      display: "inline-block",
      background: color, color: textColor,
      borderRadius: "20px",
      padding: small ? "2px 8px" : "4px 12px",
      fontSize: small ? "11px" : "12px",
      fontWeight: "600", letterSpacing: "0.04em",
      whiteSpace: "nowrap"
    }}>{label}</span>
  );
}

function StatusBadge({ status }) {
  const map = {
    Preparing: { bg: "#FFF3CD", text: "#856404" },
    Ready:     { bg: "#D1FAE5", text: "#065F46" },
    Collected: { bg: "#E5E7EB", text: "#374151" },
  };
  const s = map[status] || map.Preparing;
  return <Badge label={status} color={s.bg} textColor={s.text} />;
}

function Btn({ children, onClick, variant = "primary", disabled, full, small, style: extra = {} }) {
  const base = {
    border: "none", borderRadius: "10px", cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: "600", fontSize: small ? "13px" : "15px",
    padding: small ? "8px 16px" : "13px 24px",
    width: full ? "100%" : "auto",
    opacity: disabled ? 0.45 : 1,
    transition: "opacity 0.15s, transform 0.1s",
    ...extra
  };
  const variants = {
    primary: { background: T.accent, color: "#FFF" },
    secondary: { background: T.surfaceAlt, color: T.ink, border: `1px solid ${T.border}` },
    gold: { background: T.gold, color: "#FFF" },
    danger: { background: T.red, color: "#FFF" },
    ghost: { background: "transparent", color: T.accentWarm, border: `1px solid ${T.accentWarm}` },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
}

// ─── CUSTOMER SIDE ──────────────────────────────────────────────────────────

function MenuItemCard({ item, onAdd }) {
  const [pop, setPop] = useState(false);
  const handle = () => {
    if (!item.available) return;
    setPop(true); onAdd(item); setTimeout(() => setPop(false), 500);
  };
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: "14px", padding: "20px",
      display: "flex", gap: "16px", alignItems: "flex-start",
      opacity: item.available ? 1 : 0.45,
    }}>
      <div style={{ fontSize: "32px", lineHeight: 1, flexShrink: 0 }}>{item.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "11px", color: T.gold, fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "2px" }}>{item.category}</div>
        <div style={{ fontSize: "16px", fontWeight: "600", color: T.ink, fontFamily: "'DM Serif Display', Georgia, serif" }}>{item.name}</div>
        <div style={{ fontSize: "13px", color: T.inkMid, marginTop: "3px" }}>{item.desc}</div>
        {!item.available && <div style={{ fontSize: "12px", color: T.red, marginTop: "4px", fontWeight: "600" }}>Sold out</div>}
      </div>
      <div style={{ flexShrink: 0, textAlign: "right", display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
        <div style={{ fontWeight: "700", fontSize: "16px" }}>RM {item.price}</div>
        {item.available && (
          <button onClick={handle} style={{
            background: pop ? T.green : T.accent,
            color: "#FFF", border: "none", borderRadius: "8px",
            width: "34px", height: "34px", fontSize: "18px",
            cursor: "pointer", transition: "background 0.2s",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>{pop ? "✓" : "+"}</button>
        )}
      </div>
    </div>
  );
}

function CustomerCart({ cart, onRemove, onQty, outlet, setOutlet, onPlaceOrder }) {
  const [name, setName] = useState("");
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const canOrder = cart.length > 0 && outlet && name.trim();

  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: "16px", padding: "24px",
      position: "sticky", top: "80px",
      display: "flex", flexDirection: "column", gap: "16px"
    }}>
      <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "20px" }}>Your order</div>

      {/* Outlet */}
      <div>
        <label style={{ fontSize: "12px", fontWeight: "600", color: T.inkMid, display: "block", marginBottom: "6px" }}>PICK UP AT</label>
        <select value={outlet} onChange={e => setOutlet(e.target.value)} style={{
          width: "100%", padding: "10px 12px", borderRadius: "8px",
          border: `1px solid ${T.border}`, background: T.surfaceAlt,
          color: T.ink, fontSize: "14px"
        }}>
          <option value="">Select outlet…</option>
          {OUTLETS.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>

      {/* Name */}
      <div>
        <label style={{ fontSize: "12px", fontWeight: "600", color: T.inkMid, display: "block", marginBottom: "6px" }}>YOUR NAME</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Amir"
          style={{
            width: "100%", padding: "10px 12px", borderRadius: "8px",
            border: `1px solid ${T.border}`, background: T.surfaceAlt,
            color: T.ink, fontSize: "14px", outline: "none"
          }} />
      </div>

      {/* Items */}
      {cart.length === 0 ? (
        <div style={{ color: T.inkLight, fontSize: "14px", padding: "20px 0", textAlign: "center" }}>
          Add drinks from the menu
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {cart.map(item => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>{item.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "14px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                <div style={{ fontSize: "12px", color: T.inkMid }}>RM {item.price} each</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                <button onClick={() => onQty(item.id, -1)} style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: "6px", width: "26px", height: "26px", cursor: "pointer", fontSize: "14px" }}>−</button>
                <span style={{ fontSize: "14px", fontWeight: "600", minWidth: "16px", textAlign: "center" }}>{item.qty}</span>
                <button onClick={() => onQty(item.id, 1)} style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: "6px", width: "26px", height: "26px", cursor: "pointer", fontSize: "14px" }}>+</button>
                <button onClick={() => onRemove(item.id)} style={{ background: "none", border: "none", color: T.inkLight, cursor: "pointer", fontSize: "16px", marginLeft: "2px" }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {cart.length > 0 && (
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: T.inkMid }}>Total</span>
          <span style={{ fontSize: "20px", fontWeight: "700" }}>RM {total}</span>
        </div>
      )}

      <Btn full onClick={() => canOrder && onPlaceOrder(name)} disabled={!canOrder}>
        Place Order
      </Btn>
      {!canOrder && cart.length > 0 && (
        <div style={{ fontSize: "12px", color: T.inkLight, textAlign: "center" }}>
          {!outlet ? "Choose an outlet" : "Enter your name"} to continue
        </div>
      )}
    </div>
  );
}

function OrderConfirmModal({ order, onClose }) {
  if (!order) return null;
  const outlet = OUTLETS.find(o => o.id === order.outlet);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,20,16,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div style={{ background: T.surface, borderRadius: "20px", padding: "40px 32px", maxWidth: "380px", width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: "52px", marginBottom: "12px" }}>☕</div>
        <div style={{ fontSize: "12px", color: T.gold, fontWeight: "700", letterSpacing: "0.12em", marginBottom: "8px" }}>ORDER PLACED</div>
        <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "28px", marginBottom: "4px" }}>{order.id}</div>
        <div style={{ fontSize: "15px", color: T.inkMid, marginBottom: "24px" }}>
          Hey {order.customerName} — your order is being prepared.<br />
          Pick up at <strong style={{ color: T.ink }}>{outlet?.name}</strong>.
        </div>
        <div style={{ background: T.surfaceAlt, borderRadius: "12px", padding: "16px", marginBottom: "24px", textAlign: "left" }}>
          {order.items.map((i, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: T.inkMid, marginBottom: idx < order.items.length - 1 ? "6px" : 0 }}>
              <span>{i.name} × {i.qty}</span>
              <span style={{ color: T.ink, fontWeight: "600" }}>RM {i.price * i.qty}</span>
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${T.border}`, marginTop: "10px", paddingTop: "10px", display: "flex", justifyContent: "space-between", fontWeight: "700" }}>
            <span>Total</span><span>RM {order.total}</span>
          </div>
        </div>
        <Btn full onClick={onClose}>Done</Btn>
      </div>
    </div>
  );
}

function CustomerView({ menu, onPlaceOrder }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [outlet, setOutlet] = useState("");
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  const filtered = activeCategory === "All" ? menu : menu.filter(m => m.category === activeCategory);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const addToCart = (item) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === item.id);
      if (ex) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
  };
  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const changeQty = (id, delta) => setCart(prev =>
    prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)
  );
  const placeOrder = (name) => {
    const order = genOrder(cart, outlet, name);
    onPlaceOrder(order);
    setConfirmedOrder(order);
    setCart([]);
    setOutlet("");
    setMobileCartOpen(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg }}>
      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 200,
        background: "rgba(247,244,239,0.95)", backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${T.border}`,
        padding: "14px 24px",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div>
          <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "22px", letterSpacing: "0.01em" }}>Kofvee</div>
          <div style={{ fontSize: "11px", color: T.gold, fontWeight: "600", letterSpacing: "0.12em" }}>GRAB & GO · KL · PJ · SELANGOR</div>
        </div>
        {/* Mobile cart button */}
        <button onClick={() => setMobileCartOpen(true)} style={{
          display: "none", background: T.accent, color: "#FFF",
          border: "none", borderRadius: "10px", padding: "10px 16px",
          fontWeight: "600", fontSize: "14px", cursor: "pointer",
          "@media (max-width: 768px)": { display: "flex" }
        }} className="mobile-cart-btn">
          Order · RM {cartTotal} ({cartCount})
        </button>
      </header>

      <div style={{ maxWidth: "1140px", margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 340px", gap: "32px" }}>
        {/* Left: menu */}
        <div>
          {/* Hero strip */}
          <div style={{ background: T.accent, borderRadius: "16px", padding: "28px 32px", marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "28px", color: "#FFF", marginBottom: "4px" }}>Order ahead.<br />Skip the queue.</div>
              <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)" }}>Ready in 5–8 mins. Grab and go.</div>
            </div>
            <div style={{ fontSize: "52px" }}>☕</div>
          </div>

          {/* Category tabs */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setActiveCategory(c)} style={{
                background: activeCategory === c ? T.accent : T.surface,
                color: activeCategory === c ? "#FFF" : T.inkMid,
                border: `1px solid ${activeCategory === c ? T.accent : T.border}`,
                borderRadius: "20px", padding: "7px 18px",
                fontSize: "13px", fontWeight: "600", cursor: "pointer",
                transition: "all 0.15s"
              }}>{c}</button>
            ))}
          </div>

          {/* Menu grid */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filtered.map(item => <MenuItemCard key={item.id} item={item} onAdd={addToCart} />)}
          </div>
        </div>

        {/* Right: cart (desktop) */}
        <div>
          <CustomerCart
            cart={cart} onRemove={removeFromCart} onQty={changeQty}
            outlet={outlet} setOutlet={setOutlet} onPlaceOrder={placeOrder}
          />
        </div>
      </div>

      {/* Mobile cart overlay */}
      {mobileCartOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,20,16,0.6)", zIndex: 500, display: "flex", alignItems: "flex-end" }}>
          <div style={{ background: T.surface, borderRadius: "20px 20px 0 0", padding: "24px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "20px" }}>Your order</span>
              <button onClick={() => setMobileCartOpen(false)} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: T.inkMid }}>✕</button>
            </div>
            <CustomerCart cart={cart} onRemove={removeFromCart} onQty={changeQty} outlet={outlet} setOutlet={setOutlet} onPlaceOrder={placeOrder} />
          </div>
        </div>
      )}

      <OrderConfirmModal order={confirmedOrder} onClose={() => setConfirmedOrder(null)} />

      <style>{`
        @media (max-width: 860px) {
          .kofvee-grid { grid-template-columns: 1fr !important; }
          .kofvee-cart-desktop { display: none !important; }
          .mobile-cart-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

// ─── ADMIN SIDE ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: accent ? T.accent : T.surface, border: `1px solid ${accent ? "transparent" : T.border}`, borderRadius: "14px", padding: "20px 24px" }}>
      <div style={{ fontSize: "12px", fontWeight: "600", color: accent ? "rgba(255,255,255,0.6)" : T.inkLight, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>{label}</div>
      <div style={{ fontSize: "28px", fontWeight: "700", fontFamily: "'DM Serif Display', serif", color: accent ? "#FFF" : T.ink }}>{value}</div>
      {sub && <div style={{ fontSize: "12px", color: accent ? "rgba(255,255,255,0.5)" : T.inkLight, marginTop: "4px" }}>{sub}</div>}
    </div>
  );
}

function AdminOrders({ orders, onStatusChange, outletFilter }) {
  const filtered = outletFilter === "all" ? orders : orders.filter(o => o.outlet === outletFilter);
  const sorted = [...filtered].sort((a, b) => b.placedAt - a.placedAt);

  if (sorted.length === 0) return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: T.inkLight }}>
      <div style={{ fontSize: "40px", marginBottom: "12px" }}>📋</div>
      <div>No orders yet for this outlet.</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {sorted.map(order => {
        const outlet = OUTLETS.find(o => o.id === order.outlet);
        return (
          <div key={order.id} style={{
            background: T.surface, border: `1px solid ${order.status === "Ready" ? "#A7F3D0" : T.border}`,
            borderRadius: "14px", padding: "20px",
            display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "flex-start"
          }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <span style={{ fontWeight: "700", fontSize: "16px", fontFamily: "'DM Serif Display', serif" }}>{order.id}</span>
                <StatusBadge status={order.status} />
              </div>
              <div style={{ fontSize: "14px", color: T.inkMid, marginBottom: "4px" }}>
                <strong style={{ color: T.ink }}>{order.customerName}</strong> · {outlet?.name}
              </div>
              <div style={{ fontSize: "12px", color: T.inkLight }}>
                {order.placedAt.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
            <div style={{ flex: 2, minWidth: "200px" }}>
              {order.items.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: T.inkMid, marginBottom: "3px" }}>
                  <span>{item.emoji} {item.name} × {item.qty}</span>
                  <span style={{ fontWeight: "600", color: T.ink }}>RM {item.price * item.qty}</span>
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${T.border}`, marginTop: "8px", paddingTop: "6px", display: "flex", justifyContent: "space-between", fontWeight: "700" }}>
                <span>Total</span><span>RM {order.total}</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 }}>
              {order.status === "Preparing" && (
                <Btn small variant="gold" onClick={() => onStatusChange(order.id, "Ready")}>Mark Ready</Btn>
              )}
              {order.status === "Ready" && (
                <Btn small variant="secondary" onClick={() => onStatusChange(order.id, "Collected")}>Collected</Btn>
              )}
              {order.status === "Collected" && (
                <span style={{ fontSize: "12px", color: T.inkLight }}>Done</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AdminMenu({ menu, onToggle, onAddItem }) {
  const [form, setForm] = useState({ name: "", category: "Cold Brew", desc: "", price: "", emoji: "☕" });
  const [adding, setAdding] = useState(false);

  const submit = () => {
    if (!form.name || !form.price) return;
    onAddItem({ ...form, price: parseInt(form.price), available: true, id: Date.now() });
    setForm({ name: "", category: "Cold Brew", desc: "", price: "", emoji: "☕" });
    setAdding(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "20px" }}>Menu Items</div>
        <Btn small onClick={() => setAdding(!adding)}>{adding ? "Cancel" : "+ Add Item"}</Btn>
      </div>

      {adding && (
        <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: "14px", padding: "20px", marginBottom: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ gridColumn: "1/-1", fontWeight: "600", fontSize: "14px" }}>New menu item</div>
          {[
            { key: "name", label: "Name", full: true },
            { key: "desc", label: "Description", full: true },
          ].map(f => (
            <div key={f.key} style={{ gridColumn: f.full ? "1/-1" : "auto" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", color: T.inkMid, display: "block", marginBottom: "4px" }}>{f.label}</label>
              <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: `1px solid ${T.border}`, background: T.surface, fontSize: "14px" }} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: T.inkMid, display: "block", marginBottom: "4px" }}>Category</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: `1px solid ${T.border}`, background: T.surface, fontSize: "14px" }}>
              {["Cold Brew", "Espresso", "Signature", "Non-Coffee"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: T.inkMid, display: "block", marginBottom: "4px" }}>Price (RM)</label>
            <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
              style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: `1px solid ${T.border}`, background: T.surface, fontSize: "14px" }} />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: T.inkMid, display: "block", marginBottom: "4px" }}>Emoji</label>
            <input value={form.emoji} onChange={e => setForm(p => ({ ...p, emoji: e.target.value }))}
              style={{ width: "80px", padding: "9px 12px", borderRadius: "8px", border: `1px solid ${T.border}`, background: T.surface, fontSize: "18px" }} />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <Btn onClick={submit}>Add to menu</Btn>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {menu.map(item => (
          <div key={item.id} style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: "10px", padding: "14px 16px",
            display: "flex", alignItems: "center", gap: "12px"
          }}>
            <span style={{ fontSize: "22px" }}>{item.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "600", fontSize: "14px" }}>{item.name}</div>
              <div style={{ fontSize: "12px", color: T.inkLight }}>{item.category} · RM {item.price}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Badge label={item.available ? "Available" : "Sold out"} color={item.available ? "#D1FAE5" : "#FEE2E2"} textColor={item.available ? "#065F46" : "#991B1B"} small />
              <button onClick={() => onToggle(item.id)} style={{
                background: T.surfaceAlt, border: `1px solid ${T.border}`,
                borderRadius: "6px", padding: "6px 12px", cursor: "pointer", fontSize: "12px", fontWeight: "600", color: T.inkMid
              }}>{item.available ? "Mark Sold Out" : "Mark Available"}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminView({ orders, menu, onStatusChange, onToggleItem, onAddItem }) {
  const [tab, setTab] = useState("orders");
  const [outletFilter, setOutletFilter] = useState("all");

  const todayOrders = orders.filter(o => {
    const d = new Date(o.placedAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
  const preparing = orders.filter(o => o.status === "Preparing").length;
  const ready = orders.filter(o => o.status === "Ready").length;

  return (
    <div style={{ minHeight: "100vh", background: "#F0ECE6" }}>
      {/* Admin header */}
      <header style={{
        background: T.accent, padding: "16px 28px",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div>
          <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "20px", color: "#FFF", letterSpacing: "0.01em" }}>Kofvee Admin</div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em" }}>OPERATIONS DASHBOARD</div>
        </div>
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>
          {new Date().toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long" })}
        </div>
      </header>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "28px 24px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px", marginBottom: "28px" }}>
          <StatCard label="Today's Revenue" value={`RM ${todayRevenue}`} sub={`${todayOrders.length} orders`} accent />
          <StatCard label="Preparing" value={preparing} sub="in progress" />
          <StatCard label="Ready" value={ready} sub="awaiting pickup" />
          <StatCard label="Total Orders" value={orders.length} sub="all time" />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "24px", background: T.surface, borderRadius: "12px", padding: "4px", border: `1px solid ${T.border}`, width: "fit-content" }}>
          {[["orders", "Live Orders"], ["menu", "Menu"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              background: tab === key ? T.accent : "transparent",
              color: tab === key ? "#FFF" : T.inkMid,
              border: "none", borderRadius: "9px", padding: "9px 22px",
              fontSize: "14px", fontWeight: "600", cursor: "pointer"
            }}>{label}</button>
          ))}
        </div>

        {tab === "orders" && (
          <>
            {/* Outlet filter */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
              <button onClick={() => setOutletFilter("all")} style={{
                background: outletFilter === "all" ? T.accentWarm : T.surface,
                color: outletFilter === "all" ? "#FFF" : T.inkMid,
                border: `1px solid ${outletFilter === "all" ? T.accentWarm : T.border}`,
                borderRadius: "8px", padding: "7px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer"
              }}>All Outlets</button>
              {OUTLETS.map(o => (
                <button key={o.id} onClick={() => setOutletFilter(o.id)} style={{
                  background: outletFilter === o.id ? T.accentWarm : T.surface,
                  color: outletFilter === o.id ? "#FFF" : T.inkMid,
                  border: `1px solid ${outletFilter === o.id ? T.accentWarm : T.border}`,
                  borderRadius: "8px", padding: "7px 16px", fontSize: "13px", fontWeight: "600", cursor: "pointer"
                }}>{o.area}</button>
              ))}
            </div>
            <AdminOrders orders={orders} onStatusChange={onStatusChange} outletFilter={outletFilter} />
          </>
        )}

        {tab === "menu" && (
          <AdminMenu menu={menu} onToggle={onToggleItem} onAddItem={onAddItem} />
        )}
      </div>
    </div>
  );
}

// ─── ROOT ────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState("customer");
  const [menu, setMenu] = useState(INITIAL_MENU);
  const [orders, setOrders] = useState([]);

  const handleNewOrder = (order) => setOrders(prev => [...prev, order]);
  const handleStatusChange = (id, status) => setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  const handleToggleItem = (id) => setMenu(prev => prev.map(i => i.id === id ? { ...i, available: !i.available } : i));
  const handleAddItem = (item) => setMenu(prev => [...prev, item]);

  // Seed a few demo orders
  useEffect(() => {
    const demo = [
      { id: "KV-1001", customerName: "Amir", outlet: "pj", items: [{ ...INITIAL_MENU[6], qty: 1 }, { ...INITIAL_MENU[4], qty: 2 }], total: 38, status: "Preparing", placedAt: new Date(Date.now() - 300000) },
      { id: "KV-1002", customerName: "Siti", outlet: "kl", items: [{ ...INITIAL_MENU[1], qty: 1 }], total: 15, status: "Ready", placedAt: new Date(Date.now() - 600000) },
      { id: "KV-1003", customerName: "Raj", outlet: "sg", items: [{ ...INITIAL_MENU[7], qty: 1 }, { ...INITIAL_MENU[8], qty: 1 }], total: 31, status: "Collected", placedAt: new Date(Date.now() - 900000) },
    ];
    setOrders(demo);
  }, []);

  return (
    <>
      <style>{css}</style>

      {/* View switcher (dev/demo tool) */}
      <div style={{
        position: "fixed", bottom: "20px", right: "20px", zIndex: 9999,
        background: T.ink, borderRadius: "12px", padding: "6px",
        display: "flex", gap: "4px", boxShadow: "0 4px 20px rgba(0,0,0,0.25)"
      }}>
        {[["customer", "☕ Customer"], ["admin", "⚙️ Admin"]].map(([key, label]) => (
          <button key={key} onClick={() => setView(key)} style={{
            background: view === key ? T.gold : "transparent",
            color: view === key ? T.ink : "rgba(255,255,255,0.6)",
            border: "none", borderRadius: "8px", padding: "8px 14px",
            fontSize: "13px", fontWeight: "600", cursor: "pointer"
          }}>{label}</button>
        ))}
      </div>

      {view === "customer"
        ? <CustomerView menu={menu} onPlaceOrder={handleNewOrder} />
        : <AdminView orders={orders} menu={menu} onStatusChange={handleStatusChange} onToggleItem={handleToggleItem} onAddItem={handleAddItem} />
      }
    </>
  );
}
