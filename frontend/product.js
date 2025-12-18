const API = "https://gmart-backend-7kyz.onrender.com";

// ================= DOM =================
const detailWrap = document.getElementById("productDetail");
const relatedGrid = document.getElementById("relatedGrid");
const cartCountEl = document.getElementById("cartCount");

// ================= HELPERS =================
function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const qty = getCart().reduce((s, i) => s + (i.qty || 0), 0);
  cartCountEl.textContent = qty;
}

function getWishlist() {
  return JSON.parse(localStorage.getItem("wishlist") || "[]");
}

function saveWishlist(wl) {
  localStorage.setItem("wishlist", JSON.stringify(wl));
}

function imgFor(p) {
  return p.image || p.images?.[0] || "assets/default.png";
}

// ================= LOAD PRODUCT =================
async function loadProduct() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    detailWrap.innerHTML = "<p>Product not found</p>";
    return;
  }

  const res = await fetch(`${API}/api/products`);
  const products = await res.json();

  const product = products.find(p => p._id === id);
  if (!product) {
    detailWrap.innerHTML = "<p>Product not found</p>";
    return;
  }

  renderProduct(product);
  renderRelated(products, product);
  updateCartCount();
}

// ================= RENDER PRODUCT =================
function renderProduct(p) {
  const wishlist = getWishlist();
  const isWishlisted = wishlist.some(w => w._id === p._id);

  detailWrap.innerHTML = `
    <div class="product-detail-grid">

      <div class="product-gallery">
        <img class="main-image" src="${imgFor(p)}" alt="${p.name}">
      </div>

      <div class="product-info">
        <h1>${p.name}</h1>
        <p class="product-desc">${p.description || "No description available"}</p>

        <div class="price-row big">
          <span class="price">€${(p.price / 100).toFixed(2)}</span>
        </div>

        <div class="product-actions">
          <button id="addCartBtn" class="add-cart-btn">ADD TO CART</button>
          <button id="wishBtn" class="wishlist-btn ${isWishlisted ? "active" : ""}">
            ${isWishlisted ? "❤️" : "🤍"}
          </button>
        </div>
      </div>

    </div>
  `;

  document.getElementById("addCartBtn").onclick = () => addToCart(p);
  document.getElementById("wishBtn").onclick = () => toggleWishlist(p);
}

// ================= RELATED =================
function renderRelated(all, current) {
  relatedGrid.innerHTML = "";

  const related = all
    .filter(p => p._id !== current._id)
    .slice(0, 4);

  related.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img src="${imgFor(p)}" alt="${p.name}">
      <h4>${p.name}</h4>
      <span class="price">€${(p.price / 100).toFixed(2)}</span>
    `;

    card.onclick = () => {
      window.location.href = `product.html?id=${p._id}`;
    };

    relatedGrid.appendChild(card);
  });
}

// ================= ACTIONS =================
function addToCart(product) {
  let cart = getCart();
  const found = cart.find(i => i._id === product._id);

  if (found) found.qty++;
  else cart.push({ ...product, qty: 1 });

  saveCart(cart);
}

function toggleWishlist(product) {
  let wl = getWishlist();
  const exists = wl.find(p => p._id === product._id);

  if (exists) {
    wl = wl.filter(p => p._id !== product._id);
  } else {
    wl.push(product);
  }

  saveWishlist(wl);
  renderProduct(product);
}

// ================= INIT =================
loadProduct();
