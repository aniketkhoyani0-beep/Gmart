// main.js (ES module)
const BACKEND = 'https://gmart-backend-7kyz.onrender.com';
const CART_KEY = 'gmart_cart_v1';
const TOKEN_KEY = 'userToken';
const THEME_KEY = 'gmart_theme';

// simple helpers
const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

function getToken(){ return localStorage.getItem(TOKEN_KEY); }
function setToken(t){ if(t) localStorage.setItem(TOKEN_KEY,t); else localStorage.removeItem(TOKEN_KEY); }
function getCart(){ return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
function saveCart(c){ localStorage.setItem(CART_KEY, JSON.stringify(c)); }
function formatPrice(cents){ return `€${(cents/100).toFixed(2)}`; }

// THEME handling
function applyTheme(theme){
  if(theme === 'dark') document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
  localStorage.setItem(THEME_KEY, theme);
}
function toggleTheme(){
  const cur = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(cur === 'dark' ? 'light' : 'dark');
}
(function initTheme(){ const t = localStorage.getItem(THEME_KEY) || 'light'; applyTheme(t); const btns = $$('#themeToggle'); btns.forEach(b=>b?.addEventListener('click', toggleTheme)); })();

// AUTH UI: show/hide login link / logout
function refreshAuthUI(){
  const token = getToken();
  if(!$('#authLink')) return;
  if(token){
    $('#authLink').style.display = 'none';
    if($('#logoutBtn')) { $('#logoutBtn').style.display = 'inline-block'; $('#logoutBtn').addEventListener('click', ()=>{ setToken(null); location.reload(); }); }
  } else {
    if($('#logoutBtn')) $('#logoutBtn').style.display = 'none';
    if($('#authLink')) $('#authLink').style.display = 'inline-block';
  }
}
refreshAuthUI();

// API test small indicator
async function testApi(){
  if(!$('#apiStatus')) return;
  try{
    const r = await fetch(`${BACKEND}/api/test`);
    const j = await r.json();
    $('#apiStatus').textContent = j.message || 'ok';
  }catch(e){
    $('#apiStatus').textContent = 'error';
  }
}
testApi();

// PRODUCTS rendering
async function fetchProducts(){
  const container = $('#products');
  if(!container) return;
  container.innerHTML = `<div class="muted">Loading…</div>`;
  try{
    const res = await fetch(`${BACKEND}/api/products`);
    const products = await res.json();
    container.innerHTML = '';
    if(!products || products.length === 0){ container.innerHTML = `<div class="muted">No products</div>`; return; }

    products.forEach(p=>{
      const card = document.createElement('div');
      card.className = 'product-card';
      const img = p.image || 'placeholder.png';
      card.innerHTML = `
        <img class="product-img" src="${img}" alt="${p.name}" onerror="this.src='placeholder.png'">
        <h3>${p.name}</h3>
        <p class="muted">${p.description || ''}</p>
        <div class="product-actions">
          <div class="price">${formatPrice(p.price)}</div>
          <div>
            <button class="secondary viewBtn" data-id="${p._id}">View</button>
            <button class="primary addBtn" data-id="${p._id}">Add to cart</button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });

    // attach events (delegation)
    container.querySelectorAll('.addBtn').forEach(b=>{
      b.addEventListener('click', async (ev)=>{
        const id = ev.currentTarget.dataset.id;
        // find product object
        const p = (await fetch(`${BACKEND}/api/products/${id}`).then(r=>r.json())).catch(()=>null);
        const obj = p || { _id:id, name:'Item', price:0, image:'placeholder.png' };
        addToCart(obj);
      });
    });
    // viewBtn can later open product-details page (not implemented here)
  }catch(e){
    container.innerHTML = `<div class="muted">Failed to load products</div>`;
    console.error(e);
  }
}

// CART functions
function cartCount(){
  return getCart().reduce((s,i)=>s + (i.qty||0),0);
}
function renderCartCount(){
  const el = $('#cartCount'); if(el) el.textContent = cartCount();
}

// add product to cart
function addToCart(prod){
  const cart = getCart();
  const found = cart.find(i=>i._id === prod._id);
  if(found) found.qty = (found.qty||1) + 1;
  else cart.push({ _id: prod._id, name: prod.name, price: prod.price, image: prod.image || 'placeholder.png', qty: 1 });
  saveCart(cart);
  renderCartCount();
  alert(`${prod.name} added to cart`);
}

// CART PAGE rendering (cart.html)
function renderCartPage(){
  const list = $('#cartList');
  if(!list) return;
  const cart = getCart();
  list.innerHTML = '';
  if(!cart.length){ list.innerHTML = `<div class="muted">Cart is empty</div>`; updateCartSummary(); return; }

  cart.forEach(item=>{
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <img src="${item.image || 'placeholder.png'}" onerror="this.src='placeholder.png'">
      <div style="flex:1">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <strong>${item.name}</strong>
          <div>${formatPrice(item.price)}</div>
        </div>
        <div class="qty-controls">
          <button class="secondary dec" data-id="${item._id}">-</button>
          <div style="min-width:40px;text-align:center">${item.qty}</div>
          <button class="primary inc" data-id="${item._id}">+</button>
        </div>
      </div>
    `;
    list.appendChild(row);
  });

  // wire controls
  list.querySelectorAll('.inc').forEach(b=>b.addEventListener('click', e=>{ changeQty(e.currentTarget.dataset.id, 1); }));
  list.querySelectorAll('.dec').forEach(b=>b.addEventListener('click', e=>{ changeQty(e.currentTarget.dataset.id, -1); }));

  updateCartSummary();
}

function changeQty(id, delta){
  const cart = getCart();
  const item = cart.find(i=>i._id === id);
  if(!item) return;
  item.qty = (item.qty||1) + delta;
  if(item.qty <= 0) cart.splice(cart.indexOf(item),1);
  saveCart(cart);
  renderCartPage();
  renderCartCount();
}

function updateCartSummary(){
  const cart = getCart();
  const totalQty = cart.reduce((s,i)=>s + (i.qty||0),0);
  const totalPrice = cart.reduce((s,i)=>s + (i.qty||0) * (i.price||0),0);
  if($('#totalQty')) $('#totalQty').textContent = totalQty;
  if($('#totalPrice')) $('#totalPrice').textContent = formatPrice(totalPrice);
  if($('#cartSummary')) $('#cartSummary').style.display = cart.length ? 'flex' : 'none';
}

// clear cart
if($('#clearCart')) $('#clearCart').addEventListener('click', ()=>{ if(confirm('Clear cart?')){ saveCart([]); renderCartPage(); renderCartCount(); } });

// checkout stub
if($('#checkoutBtn')) $('#checkoutBtn').addEventListener('click', ()=>{ alert('Checkout integration (PayPal) will be next step'); });

// page init
document.addEventListener('DOMContentLoaded', ()=>{
  renderCartCount();
  if($('#products')) fetchProducts();
  if($('#cartList')) renderCartPage();
  refreshAuthUI();
});
