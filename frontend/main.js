const API = "https://gmart-backend-7kyz.onrender.com";

// ================= DOM =================
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const suggestionsBox = document.getElementById("searchSuggestions");
const categoryFilter = document.getElementById("categoryFilter");
const priceFilter = document.getElementById("priceFilter");
const allProductsGrid = document.getElementById("allProductsGrid");
const cartCountEl = document.getElementById("cartCount");

// ================= STATE =================
let ALL_PRODUCTS = [];

// ================= CART =================
function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}
function saveCart(c) {
  localStorage.setItem("cart", JSON.stringify(c));
  updateCartCount();
}
function updateCartCount() {
  const q = getCart().reduce((s, i) => s + (i.qty || 0), 0);
  cartCountEl && (cartCountEl.textContent = q);
}
function addToCart(p) {
  const cart = getCart();
  const f = cart.find(i => i._id === p._id);
  f ? f.qty++ : cart.push({ ...p, qty: 1 });
  saveCart(cart);
}
updateCartCount();

// ================= HELPERS =================
function imgFor(p) {
  return p.images?.[0] || p.image || "assets/default.png";
}
function isTrending(p) {
  return p.popularity >= 80 || p.sales >= 100;
}

// ================= RENDER =================
function renderProducts(list) {
  allProductsGrid.innerHTML = "";

  if (!list.length) {
    allProductsGrid.innerHTML = "<p>No products found</p>";
    return;
  }

  list.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      ${isTrending(p) ? `<span class="badge">Trending</span>` : ""}
      <img src="${imgFor(p)}">
      <h4>${p.name}</h4>
      <div class="price">€${(p.price / 100).toFixed(2)}</div>
      <button class="add-cart-btn">ADD TO CART</button>
    `;

    card.querySelector("button").onclick = e => {
      e.stopPropagation();
      addToCart(p);
    };

    card.onclick = () => {
      window.location.href = `product.html?id=${p._id}`;
    };

    allProductsGrid.appendChild(card);
  });
}

// ================= FILTER LOGIC =================
function applyFilters(products) {
  let filtered = [...products];

  // Category
  if (categoryFilter.value) {
    filtered = filtered.filter(
      p => p.category === categoryFilter.value
    );
  }

  // Price
  if (priceFilter.value) {
    const [min, max] = priceFilter.value.split("-").map(Number);
    filtered = filtered.filter(p => {
      if (!max) return p.price >= min;
      return p.price >= min && p.price <= max;
    });
  }

  return filtered;
}

// ================= SEARCH =================
async function backendSearch(query) {
  try {
    const res = await fetch(`${API}/api/products?search=${query}`);
    if (!res.ok) throw new Error("fallback");
    return await res.json();
  } catch {
    return ALL_PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase())
    );
  }
}

async function runSearch() {
  const q = searchInput.value.trim();
  if (!q) return renderProducts(applyFilters(ALL_PRODUCTS));

  const results = await backendSearch(q);
  renderProducts(applyFilters(results));
}

searchBtn?.addEventListener("click", runSearch);
searchInput?.addEventListener("keydown", e => {
  if (e.key === "Enter") runSearch();
});

// ================= FILTER EVENTS =================
categoryFilter?.addEventListener("change", runSearch);
priceFilter?.addEventListener("change", runSearch);

// ================= LOAD PRODUCTS =================
async function loadProducts() {
  const res = await fetch(`${API}/api/products`);
  ALL_PRODUCTS = await res.json();

  // Populate categories
  const cats = [...new Set(ALL_PRODUCTS.map(p => p.category).filter(Boolean))];
  cats.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    categoryFilter.appendChild(opt);
  });

  renderProducts(ALL_PRODUCTS.slice(0, 24));
}
loadProducts();

function toggleWishlist(productId) {
  let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
  const product = allProducts.find(p => p._id === productId);

  if (!product) return;

  const exists = wishlist.find(p => p._id === productId);

  if (exists) {
    wishlist = wishlist.filter(p => p._id !== productId);
  } else {
    wishlist.push(product);
  }

  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  renderHome(); // re-render products
}
