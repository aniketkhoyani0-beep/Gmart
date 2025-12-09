/* script.js — shared frontend logic
   - Tries backend cart API (if available)
   - Falls back to localStorage
   - Exposes App.initProductsPage() and App.initCartPage()
   - Uses backend baseURL below
*/

const backendBase = 'https://gmart-backend-7kyz.onrender.com'; // your backend
const API = {
  products: `${backendBase}/api/products`,
  product: id => `${backendBase}/api/products/${id}`,
  test: `${backendBase}/api/test`,
  cartGet: `${backendBase}/api/cart`,
  cartAdd: `${backendBase}/api/cart`,         // POST { productId, qty }
  cartUpdate: id => `${backendBase}/api/cart/${id}`, // PUT { qty }
  cartRemove: id => `${backendBase}/api/cart/${id}`, // DELETE
  createPayPalOrder: `${backendBase}/api/create-paypal-order`
};

const localCartKey = 'gmart_cart_v1';
const tokenKey = 'gmart_token'; // optional JWT store (use cookie in production ideally)

const App = (() => {

  // Helpers
  function $, s => document.querySelector(s);

  function nowLocalCart() {
    try { return JSON.parse(localStorage.getItem(localCartKey) || '{}'); }
    catch { return {}; }
  }
  function saveLocalCart(cartObj) {
    localStorage.setItem(localCartKey, JSON.stringify(cartObj));
  }

  async function safeFetch(url, opts = {}) {
    // Attach token if available in localStorage
    const token = localStorage.getItem(tokenKey);
    const headers = opts.headers || {};
    if (token) headers['Authorization'] = 'Bearer ' + token;
    opts.headers = headers;

    try {
      const res = await fetch(url, opts);
      // treat 404 for cart endpoints as "not implemented" (fallback)
      return res;
    } catch (e) {
      // network failure
      return { ok: false, error: e };
    }
  }

  // ----------------------
  // CART API LAYER (tries backend first)
  // ----------------------
  async function backendAvailable() {
    // quick ping to test endpoint
    try {
      const r = await safeFetch(API.test);
      return r && r.ok;
    } catch { return false; }
  }

  async function getCartFromBackend() {
    const res = await safeFetch(API.cartGet, { credentials: 'include' });
    if (res && res.ok) {
      return res.json(); // expected shape: { items: [{ productId, qty }] }
    }
    return null;
  }

  async function setCartAddBackend(productId, qty) {
    const res = await safeFetch(API.cartAdd, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, qty })
    });
    if (res && (res.ok || res.status === 201)) return true;
    return false;
  }

  async function setCartUpdateBackend(productId, qty) {
    const res = await safeFetch(API.cartUpdate(productId), {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qty })
    });
    return res && res.ok;
  }

  async function setCartRemoveBackend(productId) {
    const res = await safeFetch(API.cartRemove(productId), {
      method: 'DELETE',
      credentials: 'include'
    });
    return res && res.ok;
  }

  // ----------------------
  // CART BUSINESS LOGIC (fallback to localStorage)
  // ----------------------
  function getLocalCartItems() {
    const cart = nowLocalCart(); // { productId: qty }
    // convert to array of { id, qty }
    return Object.keys(cart).map(id => ({ id, qty: cart[id] }));
  }

  function setLocalAdd(productId, qty = 1) {
    const c = nowLocalCart();
    c[productId] = (c[productId] || 0) + qty;
    saveLocalCart(c);
  }

  function setLocalUpdate(productId, qty) {
    const c = nowLocalCart();
    if (qty <= 0) delete c[productId];
    else c[productId] = qty;
    saveLocalCart(c);
  }

  function setLocalRemove(productId) {
    const c = nowLocalCart();
    delete c[productId];
    saveLocalCart(c);
  }

  // unified API used by UI
  async function addToCart(productId, qty = 1) {
    // try backend add
    const ok = await setCartAddBackend(productId, qty);
    if (ok) { await syncLocalFromBackend(); return; }

    // fallback
    setLocalAdd(productId, qty);
    updateCartCountUI();
  }

  async function updateCartQty(productId, qty) {
    const ok = await setCartUpdateBackend(productId, qty);
    if (ok) { await syncLocalFromBackend(); return; }

    setLocalUpdate(productId, qty);
    updateCartCountUI();
  }

  async function removeFromCart(productId) {
    const ok = await setCartRemoveBackend(productId);
    if (ok) { await syncLocalFromBackend(); return; }

    setLocalRemove(productId);
    updateCartCountUI();
  }

  async function syncLocalFromBackend() {
    // if backend has cart, pull it and overwrite localStorage
    const b = await getCartFromBackend();
    if (b && b.items) {
      const map = {};
      for (const it of b.items) map[it.productId] = it.qty;
      saveLocalCart(map);
      updateCartCountUI();
      return true;
    }
    // no backend cart
    updateCartCountUI();
    return false;
  }

  async function fetchProduct(id) {
    const r = await safeFetch(API.product(id));
    if (!r || !r.ok) return null;
    return r.json();
  }

  async function fetchProductsList() {
    const r = await safeFetch(API.products);
    if (!r || !r.ok) return [];
    return r.json();
  }

  // ----------------------
  // UI Helpers
  // ----------------------
  function formatEuro(cents) {
    return (cents / 100).toFixed(2);
  }

  async function updateCartCountUI() {
    const items = getLocalCartItems();
    let totalCount = 0;
    for (const it of items) totalCount += it.qty;
    const els = document.querySelectorAll('#cart-count');
    els.forEach(e => e.textContent = totalCount);
  }

  // ----------------------
  // Products Page init
  // ----------------------
  async function initProductsPage() {
    document.getElementById('testBtn')?.addEventListener('click', async () => {
      const res = await safeFetch(API.test);
      if (res && res.ok) {
        const json = await res.json();
        document.getElementById('result').textContent = json.message;
      } else {
        document.getElementById('result').textContent = 'Backend not reachable';
      }
    });

    // load products from backend
    const products = await fetchProductsList();
    const container = document.getElementById('products-container');
    container.innerHTML = '';

    products.forEach(p => {
      const card = document.createElement('div');
      card.className = 'product-card';
      const imgSrc = p.image || 'https://via.placeholder.com/400x300?text=No+Image';
      card.innerHTML = `
        <img class="pimg" src="${imgSrc}" alt="${p.name}">
        <h3>${p.name}</h3>
        <p class="muted desc">${p.description || ''}</p>
        <p class="price">€ ${formatEuro(p.price)}</p>
        <div class="card-actions">
          <button class="btn add" data-id="${p._id}">Add to cart</button>
          <a class="btn small" href="/product.html?id=${p._id}">View</a>
        </div>
      `;

      container.appendChild(card);
      card.querySelector('.add').addEventListener('click', async () => {
        await addToCart(p._id, 1);
        // reflect immediately in UI
        updateCartCountUI();
      });
    });

    // initial cart count
    await syncLocalFromBackend();
  }

  // ----------------------
  // Cart Page init
  // ----------------------
  async function initCartPage() {
    // ensure local cart synced with backend (if possible)
    await syncLocalFromBackend();
    renderCartPage();
  }

  async function renderCartPage() {
    const itemsContainer = document.getElementById('cart-items');
    itemsContainer.innerHTML = '';

    const localItems = getLocalCartItems(); // [{id,qty}]
    if (localItems.length === 0) {
      itemsContainer.innerHTML = '<p>Your cart is empty.</p>';
      document.getElementById('cart-subtotal').textContent = '0.00';
      document.getElementById('cart-total-items').textContent = '0';
      updateCartCountUI();
      return;
    }

    let subtotalCents = 0;
    let totalItems = 0;

    for (const it of localItems) {
      const prod = await fetchProduct(it.id);
      if (!prod) continue;
      const lineTotal = prod.price * it.qty;
      subtotalCents += lineTotal;
      totalItems += it.qty;

      const row = document.createElement('div');
      row.className = 'cart-row';
      row.innerHTML = `
        <div class="cart-row-left">
          <img src="${prod.image || 'https://via.placeholder.com/80'}" alt="${prod.name}" width="80" />
        </div>
        <div class="cart-row-mid">
          <div class="cart-name">${prod.name}</div>
          <div class="cart-price">€ ${formatEuro(prod.price)}</div>
          <div class="cart-qty">
            <button class="qty-btn minus" data-id="${it.id}">−</button>
            <span class="qty-val">${it.qty}</span>
            <button class="qty-btn plus" data-id="${it.id}">+</button>
            <button class="btn remove" data-id="${it.id}">Remove</button>
          </div>
        </div>
        <div class="cart-row-right">
          € ${formatEuro(lineTotal)}
        </div>
      `;
      itemsContainer.appendChild(row);
    }

    document.getElementById('cart-subtotal').textContent = (subtotalCents/100).toFixed(2);
    document.getElementById('cart-total-items').textContent = totalItems;
    updateCartCountUI();

    // attach qty/remove listeners
    document.querySelectorAll('.qty-btn.plus').forEach(b => {
      b.addEventListener('click', async () => {
        const id = b.dataset.id;
        const current = nowLocalCart()[id] || 0;
        await updateCartQty(id, current + 1);
        renderCartPage();
      });
    });
    document.querySelectorAll('.qty-btn.minus').forEach(b => {
      b.addEventListener('click', async () => {
        const id = b.dataset.id;
        const current = nowLocalCart()[id] || 0;
        await updateCartQty(id, current - 1);
        renderCartPage();
      });
    });
    document.querySelectorAll('.btn.remove').forEach(b => {
      b.addEventListener('click', async () => {
        const id = b.dataset.id;
        await removeFromCart(id);
        renderCartPage();
      });
    });

    // checkout button
    document.getElementById('checkout-btn')?.addEventListener('click', async () => {
      // build order lines for backend
      const itemsPayload = getLocalCartItems().map(i => ({ id: i.id, qty: i.qty }));
      // call backend create-paypal-order if available
      const res = await safeFetch(API.createPayPalOrder, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsPayload, customer: { email: localStorage.getItem('gmart_user_email') || '' } })
      });
      if (res && res.ok) {
        const j = await res.json();
        // real integration should redirect to PayPal or open approval URL
        alert('PayPal order created: ' + (j.id || JSON.stringify(j)));
      } else {
        alert('Checkout not available (backend missing).');
      }
    });
  }

  // public API
  return {
    initProductsPage,
    initCartPage,
    addToCart: async (id, qty) => { await addToCart(id, qty); updateCartCountUI(); }
  };
})();

// ---------- Cart Management ----------
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Add product to cart
function addToCart(product) {
    const existing = cart.find(p => p.id === product._id);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ id: product._id, name: product.name, price: product.price, qty: 1 });
    }
    saveCart();
    renderCart();
}

// Remove product from cart
function removeFromCart(productId) {
    cart = cart.filter(p => p.id !== productId);
    saveCart();
    renderCart();
}

// Update quantity
function updateQuantity(productId, qty) {
    const item = cart.find(p => p.id === productId);
    if (item) {
        item.qty = qty;
        if (item.qty <= 0) removeFromCart(productId);
    }
    saveCart();
    renderCart();
}

// Render cart on cart.html
function renderCart() {
    const container = document.getElementById('cart-container');
    container.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        container.textContent = 'Cart is empty.';
        document.getElementById('cart-summary').textContent = '';
        return;
    }

    cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div>
                <h4>${item.name}</h4>
                <p>Price: €${(item.price / 100).toFixed(2)}</p>
            </div>
            <div class="quantity-controls">
                <button onclick="updateQuantity('${item.id}', ${item.qty - 1})">-</button>
                <span>${item.qty}</span>
                <button onclick="updateQuantity('${item.id}', ${item.qty + 1})">+</button>
                <button onclick="removeFromCart('${item.id}')">Remove</button>
            </div>
        `;
        container.appendChild(div);
        total += item.price * item.qty;
    });

    document.getElementById('cart-summary').innerHTML = `<p>Total: €${(total / 100).toFixed(2)}</p>`;
}

