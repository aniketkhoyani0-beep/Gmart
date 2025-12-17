// ================= CONFIG =================
const API = "https://gmart-backend-7kyz.onrender.com";

// ================= DOM =================
const bannerCarousel = document.getElementById("bannerCarousel");
const carouselDots = document.getElementById("carouselDots");
const categoriesRow = document.getElementById("categoriesRow");
const homeSections = document.getElementById("homeSections");
const allProductsGrid = document.getElementById("allProductsGrid");
const cartCountEl = document.getElementById("cartCount");
const themeToggle = document.getElementById("themeToggle");
const authLink = document.getElementById("authLink");
const logoutBtn = document.getElementById("logoutBtn");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const suggestionsBox = document.getElementById("searchSuggestions");

// ================= GLOBAL STATE =================
let ALL_PRODUCTS = [];
let userToken = localStorage.getItem("userToken");

// ================= AUTH =================
function updateAuthUI() {
  if (userToken) {
    authLink.style.display = "none";
    logoutBtn.style.display = "inline-block";
  } else {
    authLink.style.display = "inline-block";
    logoutBtn.style.display = "none";
  }
}

logoutBtn?.addEventListener("click", () => {
  localStorage.removeItem("userToken");
  userToken = null;
  updateAuthUI();
  alert("Logged out");
});
updateAuthUI();

// ================= THEME =================
if (
  localStorage.getItem("gm-theme") === "dark" ||
  (!localStorage.getItem("gm-theme") &&
    window.matchMedia("(prefers-color-scheme: dark)").matches)
) {
  document.body.classList.add("dark-mode");
}

themeToggle?.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem(
    "gm-theme",
    document.body.classList.contains("dark-mode") ? "dark" : "light"
  );
});

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
  const found = cart.find((i) => i._id === product._id);
  if (found) found.qty += qty;
  else cart.push({ ...product, qty });
  saveCart(cart);
}
updateCartCount();

// ================= HELPERS =================
function imgFor(p) {
  return p.images?.[0] || p.image || "assets/default.png";
}
function highlight(text, q) {
  const re = new RegExp(`(${q})`, "ig");
  return text.replace(re, `<mark>$1</mark>`);
}

// ================= SEARCH HISTORY =================
const HISTORY_KEY = "gm-search-history";

function getHistory() {
  return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
}
function saveHistory(q) {
  let h = getHistory().filter(i => i !== q);
  h.unshift(q);
  h = h.slice(0, 6);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
}

// ================= RENDER PRODUCTS =================
function renderProducts(products) {
  if (!allProductsGrid) return;
  allProductsGrid.innerHTML = "";

  products.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${imgFor(p)}">
      <h4>${p.name}</h4>
      <div class="price">€${(p.price / 100).toFixed(2)}</div>
      <button class="add-cart-btn">ADD TO CART</button>
    `;
    card.querySelector("button").onclick = (e) => {
      e.stopPropagation();
      addToCart(p);
    };
    card.onclick = () =>
      (window.location.href = `product.html?id=${p._id}`);
    allProductsGrid.appendChild(card);
  });
}

// ================= STEP 3: FILTER =================
function filterProducts(query) {
  const q = query.toLowerCase();
  const filtered = ALL_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
  );
  renderProducts(filtered);
}

// ================= SEARCH + SUGGESTIONS =================
let selectedIndex = -1;

function showSuggestions(query) {
  suggestionsBox.innerHTML = "";
  selectedIndex = -1;

  if (!query) {
    const history = getHistory();
    if (!history.length) return;

    history.forEach((h) => {
      const div = document.createElement("div");
      div.className = "search-suggestion";
      div.innerHTML = `🕘 <span>${h}</span>`;
      div.onclick = () => {
        searchInput.value = h;
        filterProducts(h);
        suggestionsBox.classList.remove("active");
      };
      suggestionsBox.appendChild(div);
    });

    suggestionsBox.classList.add("active");
    return;
  }

  const q = query.toLowerCase();

  const results = ALL_PRODUCTS
    .filter(p => p.name.toLowerCase().includes(q))
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 8);

  if (!results.length) {
    suggestionsBox.innerHTML =
      `<div class="search-no-results">No products found</div>`;
    suggestionsBox.classList.add("active");
    return;
  }

  results.forEach((p) => {
    const div = document.createElement("div");
    div.className = "search-suggestion";
    div.innerHTML = `
      <strong>${highlight(p.name, query)}</strong>
      <span>€${(p.price / 100).toFixed(2)}</span>
    `;
    div.onclick = () =>
      (window.location.href = `product.html?id=${p._id}`);
    suggestionsBox.appendChild(div);
  });

  suggestionsBox.classList.add("active");
}

searchInput?.addEventListener("input", (e) => {
  showSuggestions(e.target.value.trim());
});

searchInput?.addEventListener("focus", () => {
  showSuggestions(searchInput.value.trim());
});

searchInput?.addEventListener("keydown", (e) => {
  const items = suggestionsBox.querySelectorAll(".search-suggestion");
  if (!items.length) return;

  if (e.key === "ArrowDown") selectedIndex = (selectedIndex + 1) % items.length;
  if (e.key === "ArrowUp")
    selectedIndex = (selectedIndex - 1 + items.length) % items.length;

  if (e.key === "Enter") {
    e.preventDefault();
    const q = searchInput.value.trim();
    if (q) {
      saveHistory(q);
      filterProducts(q);
      suggestionsBox.classList.remove("active");
    }
    items[selectedIndex]?.click();
  }

  items.forEach(i => i.classList.remove("active"));
  items[selectedIndex]?.classList.add("active");
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-box")) {
    suggestionsBox.classList.remove("active");
  }
});

// ================= LOAD PRODUCTS =================
async function loadProducts() {
  const res = await fetch(`${API}/api/products`);
  ALL_PRODUCTS = await res.json();
  renderProducts(ALL_PRODUCTS.slice(0, 24));
}
loadProducts();
