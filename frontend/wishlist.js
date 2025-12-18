// ================= DOM =================
const grid = document.getElementById("wishlistGrid");
const emptyText = document.getElementById("emptyWishlist");

// ================= HELPERS =================
function getWishlist() {
  return JSON.parse(localStorage.getItem("wishlist") || "[]");
}

function saveWishlist(list) {
  localStorage.setItem("wishlist", JSON.stringify(list));
}

function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// ================= RENDER =================
function renderWishlist() {
  const wishlist = getWishlist();
  grid.innerHTML = "";

  if (!wishlist.length) {
    emptyText.style.display = "block";
    return;
  }

  emptyText.style.display = "none";

  wishlist.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <div class="product-image-wrap">
        <img src="${p.image || p.images?.[0] || "assets/default.png"}" alt="${p.name}">
        <button class="wishlist-btn active">❤️</button>
      </div>

      <h4 class="product-title">${p.name}</h4>

      <div class="price-row">
        <span class="price">€${(p.price / 100).toFixed(2)}</span>
      </div>

      <button class="add-cart-btn">ADD TO CART</button>
    `;

    // Remove from wishlist
    card.querySelector(".wishlist-btn").addEventListener("click", () => {
      removeFromWishlist(p._id);
    });

    // Add to cart
    card.querySelector(".add-cart-btn").addEventListener("click", () => {
      addToCart(p);
    });

    // Product page
    card.addEventListener("click", () => {
      window.location.href = `product.html?id=${p._id}`;
    });

    grid.appendChild(card);
  });
}

// ================= ACTIONS =================
function removeFromWishlist(id) {
  let wl = getWishlist().filter(p => p._id !== id);
  saveWishlist(wl);
  renderWishlist();
}

function addToCart(product) {
  let cart = getCart();
  const found = cart.find(i => i._id === product._id);

  if (found) {
    found.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  saveCart(cart);
}

// ================= INIT =================
renderWishlist();
