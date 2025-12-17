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

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const qty = getCart().reduce((s, i) => s + (i.qty || 0), 0);
  if (cartCountEl) cartCountEl.textContent = qty;
}

function addToCart(product, qty = 1) {
  const cart = getCart();
  const found = cart.find(i => i._id === product._id);
  if (found) {
    found.qty += qty;
  } else {
    cart.push({ ...product, qty });
  }
  saveCart(cart);
}

updateCartCount();

// ================= HELPERS =================
function imgFor(p) {
  if (p.images && p.images.length) return p.images[0];
  if (p.image) return p.image;
  return "assets/default.png";
}

// ================= RENDER PRODUCTS =================
function renderProducts(list) {
  if (!allProductsGrid) return;

  allProductsGrid.innerHTML = "";

  if (!list || list.length === 0) {
    allProductsGrid.innerHTML = `<p class="empty-text">No products found</p>`;
    return;
  }

  const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");

  list.forEach(product => {
    const isWishlisted = wishlist.some(p => p._id === product._id);

    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <div class="product-image-wrap">
        <img src="${imgFor(product)}" alt="${product.name}">
        <button class="wishlist-btn ${isWishlisted ? "active" : ""}">
          ${isWishlisted ? "❤️" : "🤍"}
        </button>
      </div>

      <h4 class="product-title">${product.name}</h4>

      <div class="price-row">
        <span class="price">€${(product.price / 100).toFixed(2)}</span>
        ${
          product.discount
            ? `<span class="price-old">€${(
                product.price /
                (1 - product.discount / 100) /
                100
              ).toFixed(2)}</span>`
            : ""
        }
      </div>

      <button class="add-cart-btn">ADD TO CART</button>
    `;

    // Open product page
    card.addEventListener("click", () => {
      window.location.href = `product.html?id=${product._id}`;
    });

    // Add to cart
    card.querySelector(".add-cart-btn").addEventListener("click", e => {
      e.stopPropagation();
      addToCart(product);
    });

    // Wishlist toggle
    const wishlistBtn = card.querySelector(".wishlist-btn");
    wishlistBtn.addEventListener("click", e => {
      e.stopPropagation();

      let wl = JSON.parse(localStorage.getItem("wishlist") || "[]");
      const exists = wl.find(p => p._id === product._id);

      if (exists) {
        wl = wl.filter(p => p._id !== product._id);
        wishlistBtn.textContent = "🤍";
        wishlistBtn.classList.remove("active");
      } else {
        wl.push(product);
        wishlistBtn.textContent = "❤️";
        wishlistBtn.classList.add("active");
      }

      localStorage.setItem("wishlist", JSON.stringify(wl));
    });

    allProductsGrid.appendChild(card);
  });
}

// ================= FILTER LOGIC =================
function applyFilters(products) {
  let filtered = [...products];

  if (categoryFilter?.value) {
    filtered = filtered.filter(p => p.category === categoryFilter.value);
  }

  if (priceFilter?.value) {
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
  if (!q) {
    renderProducts(applyFilters(ALL_PRODUCTS));
    return;
  }

  const results = await backendSearch(q);
  renderProducts(applyFilters(results));
}

searchBtn?.addEventListener("click", runSearch);
searchInput?.addEventListener("keydown", e => {
  if (e.key === "Enter") runSearch();
});

categoryFilter?.addEventListener("change", runSearch);
priceFilter?.addEventListener("change", runSearch);

// ================= SEARCH SUGGESTIONS =================
searchInput?.addEventListener("input", () => {
  const query = searchInput.value.trim().toLowerCase();
  suggestionsBox.innerHTML = "";

  if (!query || query.length < 2) {
    suggestionsBox.style.display = "none";
    return;
  }

  const matches = ALL_PRODUCTS
    .filter(p => p.name.toLowerCase().includes(query))
    .slice(0, 6);

  if (!matches.length) {
    suggestionsBox.style.display = "none";
    return;
  }

  matches.forEach(product => {
    const div = document.createElement("div");
    div.className = "search-suggestion-item";
    div.innerHTML = `
      <img src="${imgFor(product)}" alt="${product.name}">
      <span>${product.name}</span>
    `;

    div.addEventListener("click", () => {
      window.location.href = `product.html?id=${product._id}`;
    });

    suggestionsBox.appendChild(div);
  });

  suggestionsBox.style.display = "block";
});

// Hide suggestions on outside click
document.addEventListener("click", e => {
  if (!e.target.closest(".search-box")) {
    suggestionsBox.style.display = "none";
  }
});

// ================= LOAD PRODUCTS =================
async function loadProducts() {
  const res = await fetch(`${API}/api/products`);
  ALL_PRODUCTS = await res.json();

  // Populate category filter
  if (categoryFilter) {
    const cats = [
      ...new Set(ALL_PRODUCTS.map(p => p.category).filter(Boolean)),
    ];
    cats.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      categoryFilter.appendChild(opt);
    });
  }

  renderProducts(ALL_PRODUCTS.slice(0, 24));
}

loadProducts();
  if (p.images && p.images.length) return p.images[0];
  if (p.image) return p.image;
  return "assets/default.png";
}

function isTrending(p) {
  return p.popularity >= 80 || p.sales >= 100;
}

// ================= RENDER =================
function renderProducts(list) {
  const grid = document.getElementById("allProductsGrid");
  if (!grid) return;

  grid.innerHTML = "";

  if (!list || list.length === 0) {
    grid.innerHTML = `<p class="empty-text">No products found</p>`;
    return;
  }

  const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");

  list.forEach(product => {
    const isWishlisted = wishlist.some(p => p._id === product._id);

    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <div class="product-image-wrap">
        <img src="${imgFor(product)}" alt="${product.name}">
        <button class="wishlist-btn ${isWishlisted ? "active" : ""}">
          ${isWishlisted ? "❤️" : "🤍"}
        </button>
      </div>

      <h4 class="product-title">${product.name}</h4>

      <div class="price-row">
        <span class="price">€${(product.price / 100).toFixed(2)}</span>
        ${
          product.discount
            ? `<span class="price-old">€${(
                product.price /
                (1 - product.discount / 100) /
                100
              ).toFixed(2)}</span>`
            : ""
        }
      </div>

      <button class="add-cart-btn">ADD TO CART</button>
    `;

    /* ---------- PRODUCT PAGE ---------- */
    card.addEventListener("click", () => {
      window.location.href = `product.html?id=${product._id}`;
    });

    /* ---------- ADD TO CART ---------- */
    card.querySelector(".add-cart-btn").addEventListener("click", e => {
      e.stopPropagation();
      addToCart(product, 1);
    });

    /* ---------- WISHLIST ---------- */
    const wishlistBtn = card.querySelector(".wishlist-btn");
    wishlistBtn.addEventListener("click", e => {
      e.stopPropagation();

      let wl = JSON.parse(localStorage.getItem("wishlist") || "[]");
      const exists = wl.find(p => p._id === product._id);

      if (exists) {
        wl = wl.filter(p => p._id !== product._id);
        wishlistBtn.innerHTML = "🤍";
        wishlistBtn.classList.remove("active");
      } else {
        wl.push(product);
        wishlistBtn.innerHTML = "❤️";
        wishlistBtn.classList.add("active");
      }

      localStorage.setItem("wishlist", JSON.stringify(wl));
    });

    grid.appendChild(card);
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
