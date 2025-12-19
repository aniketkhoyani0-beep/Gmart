const API = "https://gmart-backend-7kyz.onrender.com";

// ================= USER ACCOUNT MENU =================

const accountBtn = document.getElementById("accountBtn");
const accountDropdown = document.getElementById("accountDropdown");
const accountName = document.getElementById("accountName");
const userNameEl = document.getElementById("userName");
const userEmailEl = document.getElementById("userEmail");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const logoutBtn = document.getElementById("logoutBtn");

// Example stored user (adjust to your backend later)
const user = JSON.parse(localStorage.getItem("user"));

function updateAccountUI() {
  if (user) {
    accountName.textContent = user.name;
    userNameEl.textContent = user.name;
    userEmailEl.textContent = user.email;

    document.getElementById("accountInfo").style.display = "block";
    loginBtn.style.display = "none";
    registerBtn.style.display = "none";
    logoutBtn.style.display = "block";
  } else {
    accountName.textContent = "Account";
    document.getElementById("accountInfo").style.display = "none";
    loginBtn.style.display = "block";
    registerBtn.style.display = "block";
    logoutBtn.style.display = "none";
  }
}

updateAccountUI();

// Toggle dropdown
accountBtn?.addEventListener("click", () => {
  accountDropdown.style.display =
    accountDropdown.style.display === "flex" ? "none" : "flex";
});

// Close when clicking outside
document.addEventListener("click", e => {
  if (!e.target.closest(".account-menu")) {
    accountDropdown.style.display = "none";
  }
});

// Logout
function logout() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  location.reload();
}


/* ================= DOM ================= */
const allProductsGrid = document.getElementById("allProductsGrid");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const suggestionsBox = document.getElementById("searchSuggestions");
const cartCountEl = document.getElementById("cartCount");

/* ================= STATE ================= */
let ALL_PRODUCTS = [];

/* ================= CART ================= */
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
function addToCart(product) {
  const cart = getCart();
  const found = cart.find(p => p._id === product._id);
  found ? found.qty++ : cart.push({ ...product, qty: 1 });
  saveCart(cart);
}

/* ================= HELPERS ================= */
function imgFor() {
  return "assets/default.png"; // backend has no images yet
}

/* ================= WISHLIST ================= */
function toggleWishlist(product) {
  let wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
  const exists = wishlist.find(p => p._id === product._id);

  if (exists) {
    wishlist = wishlist.filter(p => p._id !== product._id);
  } else {
    wishlist.push(product);
  }

  localStorage.setItem("wishlist", JSON.stringify(wishlist));
}

/* ================= RENDER PRODUCTS ================= */
function renderProducts(list) {
  if (!allProductsGrid) return;

  allProductsGrid.innerHTML = "";

  if (!list.length) {
    allProductsGrid.innerHTML = `<p>No products found</p>`;
    return;
  }

  const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");

  list.forEach(product => {
    const wished = wishlist.some(w => w._id === product._id);

    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img src="${imgFor()}" alt="${product.name}">
      <h4>${product.name}</h4>
      <p class="muted">${product.description}</p>

      <div class="price-row">
        <strong>€${(product.price / 100).toFixed(2)}</strong>
        <button class="wishlist-btn">${wished ? "❤️" : "🤍"}</button>
      </div>

      <button class="add-cart-btn">Add to Cart</button>
    `;

    /* open product page */
    card.addEventListener("click", () => {
      window.location.href = `product.html?id=${product._id}`;
    });

    /* add to cart */
    card.querySelector(".add-cart-btn").addEventListener("click", e => {
      e.stopPropagation();
      addToCart(product);
    });

    /* wishlist */
    card.querySelector(".wishlist-btn").addEventListener("click", e => {
      e.stopPropagation();
      toggleWishlist(product);
      renderProducts(ALL_PRODUCTS);
    });

    allProductsGrid.appendChild(card);
  });
}

/* ================= SEARCH SUGGESTIONS ================= */
function showSuggestions(value) {
  suggestionsBox.innerHTML = "";
  if (!value || value.length < 2) {
    suggestionsBox.style.display = "none";
    return;
  }

  const matches = ALL_PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(value.toLowerCase())
  ).slice(0, 5);

  if (!matches.length) {
    suggestionsBox.style.display = "none";
    return;
  }

  matches.forEach(p => {
    const div = document.createElement("div");
    div.className = "search-suggestion-item";
    div.textContent = p.name;
    div.onclick = () => {
      window.location.href = `product.html?id=${p._id}`;
    };
    suggestionsBox.appendChild(div);
  });

  suggestionsBox.style.display = "block";
}

/* ================= EVENTS ================= */
searchInput?.addEventListener("input", e => showSuggestions(e.target.value));
searchBtn?.addEventListener("click", () => {
  const q = searchInput.value.toLowerCase();
  renderProducts(
    ALL_PRODUCTS.filter(p => p.name.toLowerCase().includes(q))
  );
});

/* ================= LOAD PRODUCTS ================= */
async function loadProducts() {
  const res = await fetch(`${API}/api/products`);
  ALL_PRODUCTS = await res.json();
  renderProducts(ALL_PRODUCTS);
  updateCartCount();
}

loadProducts();
