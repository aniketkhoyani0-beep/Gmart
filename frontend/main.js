// main.js
const backendUrl = 'https://gmart-backend-7kyz.onrender.com';
let userToken = localStorage.getItem('userToken') || null;

// ---------- Theme Toggle ----------
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
  });
}

// ---------- Auth Links ----------
function updateAuthUI() {
  const authLink = document.getElementById('authLink');
  const logoutBtn = document.getElementById('logoutBtn');
  if (!authLink || !logoutBtn) return;

  if (userToken) {
    authLink.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
  } else {
    authLink.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
  }
}
updateAuthUI();

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    userToken = null;
    localStorage.removeItem('userToken');
    updateAuthUI();
  });
}

// ---------- Register ----------
const registerBtn = document.getElementById('registerBtn');
if (registerBtn) {
  registerBtn.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
      const res = await fetch(`${backendUrl}/api/auth/register`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email, password, name: email.split('@')[0] })
      });
      const data = await res.json();
      document.getElementById('auth-msg').textContent = data.error || 'Registered! Login now.';
    } catch (err) {
      document.getElementById('auth-msg').textContent = 'Registration failed';
      console.error(err);
    }
  });
}

// ---------- Login ----------
const loginBtn = document.getElementById('loginBtn');
if (loginBtn) {
  loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
      const res = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.token) {
        userToken = data.token;
        localStorage.setItem('userToken', userToken);
        document.getElementById('auth-msg').textContent = 'Logged in successfully!';
        updateAuthUI();
      } else {
        document.getElementById('auth-msg').textContent = data.error || 'Login failed';
      }
    } catch (err) {
      document.getElementById('auth-msg').textContent = 'Login failed';
      console.error(err);
    }
  });
}

// ---------- Cart Functions ----------
function getCart() {
  return JSON.parse(localStorage.getItem('cart') || '[]');
}
function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}
function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(item => item._id === product._id);
  if (existing) existing.qty += 1;
  else cart.push({...product, qty: 1});
  saveCart(cart);
  alert(`${product.name} added to cart`);
}
function updateQty(productId, delta) {
  const cart = getCart();
  const item = cart.find(i => i._id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart.splice(cart.indexOf(item), 1);
  saveCart(cart);
  displayCart();
}
function clearCart() {
  localStorage.removeItem('cart');
  displayCart();
}
function updateCartCount() {
  const countElem = document.getElementById('cartCount');
  if (!countElem) return;
  const cart = getCart();
  const totalQty = cart.reduce((sum, i) => sum + i.qty, 0);
  countElem.textContent = totalQty;
}
updateCartCount();

function displayCart() {
  const container = document.getElementById('cartList');
  const summary = document.getElementById('cartSummary');
  if (!container || !summary) return;
  const cart = getCart();
  container.innerHTML = '';

  if (!cart || cart.length === 0) {
    container.innerHTML = '<p>Your cart is empty. <a href="index.html" class="primary">Shop Now</a></p>';
    summary.textContent = '';
    return;
  }

  let total = 0, totalQty = 0;
  cart.forEach(item => {
    const div = document.createElement('div');
    div.className = 'product-card';
    div.innerHTML = `
      <h3>${item.name}</h3>
      <p>€${(item.price/100).toFixed(2)}</p>
      <p>Quantity: ${item.qty}</p>
      <button onclick='updateQty("${item._id}",1)'>+</button>
      <button onclick='updateQty("${item._id}",-1)'>-</button>
    `;
    container.appendChild(div);
    total += item.price*item.qty;
    totalQty += item.qty;
  });
  summary.innerHTML = `Total items: ${totalQty}, Total price: €${(total/100).toFixed(2)}<br>
    <button id="clearCartBtn" class="secondary">Clear Cart</button>`;
  document.getElementById('clearCartBtn').addEventListener('click', clearCart);
}

// ---------- Products Listing ----------
const productsContainer = document.getElementById('products');
if (productsContainer) {
  async function fetchProducts() {
    try {
      const res = await fetch(`${backendUrl}/api/products`);
      const products = await res.json();
      productsContainer.innerHTML = '';
      if (!products.length) {
        productsContainer.textContent = 'No products available';
        return;
      }
      products.forEach(p => {
        const div = document.createElement('div');
        div.className = 'product-card';
        div.innerHTML = `
          <h3>${p.name}</h3>
          <p>${p.description}</p>
          <p>€${(p.price/100).toFixed(2)}</p>
          <button onclick='addToCart(${JSON.stringify(p)})'>Add to Cart</button>
        `;
        div.addEventListener('click', e => {
          if (e.target.tagName !== 'BUTTON') {
            window.location.href = `product.html?id=${p._id}`;
          }
        });
        productsContainer.appendChild(div);
      });
    } catch (err) {
      productsContainer.textContent = 'Error loading products';
      console.error(err);
    }
  }
  fetchProducts();
}

// ---------- Product Detail Page ----------
const productDetailContainer = document.getElementById('productDetail');
if (productDetailContainer) {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  async function fetchProductDetail() {
    try {
      const res = await fetch(`${backendUrl}/api/products/${id}`);
      const p = await res.json();
      productDetailContainer.innerHTML = `
        <h2>${p.name}</h2>
        <p>${p.description}</p>
        <p>Price: €${(p.price/100).toFixed(2)}</p>
        <button onclick='addToCart(${JSON.stringify(p)})'>Add to Cart</button>
      `;
    } catch (err) {
      productDetailContainer.textContent = 'Error loading product';
      console.error(err);
    }
  }
  if (id) fetchProductDetail();
}

// ---------- API Test ----------
const testBtn = document.getElementById('testBtn');
if (testBtn) {
  const apiStatus = document.getElementById('apiStatus');
  testBtn.addEventListener('click', async () => {
    try {
      const res = await fetch(`${backendUrl}/api/test`);
      const data = await res.json();
      if (apiStatus) apiStatus.textContent = data.message;
    } catch (err) {
      if (apiStatus) apiStatus.textContent = 'Error';
      console.error(err);
    }
  });
}

// ---------- Make functions global for inline onclicks ----------
window.addToCart = addToCart;
window.updateQty = updateQty;
window.clearCart = clearCart;
