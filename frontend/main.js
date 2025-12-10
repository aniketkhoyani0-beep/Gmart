// main.js
const backendUrl = 'https://gmart-backend-7kyz.onrender.com';

// ---------- User Authentication ----------
let userToken = null;

const authLink = document.getElementById('authLink');
const logoutBtn = document.getElementById('logoutBtn');

function updateAuthUI() {
    if (userToken) {
        authLink.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
    } else {
        authLink.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
    }
}

// Logout functionality
logoutBtn.addEventListener('click', () => {
    userToken = null;
    localStorage.removeItem('userToken');
    updateAuthUI();
});

// Load token from localStorage
if (localStorage.getItem('userToken')) {
    userToken = localStorage.getItem('userToken');
    updateAuthUI();
}

// ---------- Dark / Light Mode ----------
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    if(document.body.classList.contains('dark-mode')){
        themeToggle.textContent = '☀️';
    } else {
        themeToggle.textContent = '🌙';
    }
});

// ---------- Cart ----------
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
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({...product, qty: 1});
    }
    saveCart(cart);
    alert(`${product.name} added to cart`);
}

function updateQty(productId, delta) {
    const cart = getCart();
    const item = cart.find(i => i._id === productId);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
        const index = cart.indexOf(item);
        cart.splice(index, 1);
    }
    saveCart(cart);
    displayCart();
}

function updateCartCount() {
    const cartCount = getCart().reduce((acc, item) => acc + item.qty, 0);
    document.getElementById('cartCount')?.textContent = cartCount;
}

// ---------- Display Products ----------
const productsContainer = document.getElementById('products');
async function fetchProducts() {
    try {
        const res = await fetch(`${backendUrl}/api/products`);
        const products = await res.json();

        if (!productsContainer) return;

        productsContainer.innerHTML = '';

        products.forEach(p => {
            const div = document.createElement('div');
            div.className = 'product-card';
            div.innerHTML = `
                <img src="${p.image || 'assets/default.png'}" alt="${p.name}">
                <h3>${p.name}</h3>
                <p>${p.description}</p>
                <p>€${(p.price / 100).toFixed(2)}</p>
            `;

            // Click on product to open product.html with query param
            div.addEventListener('click', () => {
                window.location.href = `product.html?id=${p._id}`;
            });

            // Add to Cart button
            const addBtn = document.createElement('button');
            addBtn.textContent = 'Add to Cart';
            addBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering product click
                addToCart(p);
            });
            div.appendChild(addBtn);

            productsContainer.appendChild(div);
        });
    } catch (err) {
        console.error('Products fetch error:', err);
        productsContainer.textContent = 'Error loading products';
    }
}

// ---------- Display Cart Page ----------
function displayCart() {
    const cartList = document.getElementById('cartList');
    const totalQtyEl = document.getElementById('totalQty');
    const totalPriceEl = document.getElementById('totalPrice');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (!cartList) return;

    const cart = getCart();
    cartList.innerHTML = '';

    if (cart.length === 0) {
        cartList.innerHTML = `<p>Your cart is empty. <a href="index.html">Shop Now</a></p>`;
        if(totalQtyEl) totalQtyEl.textContent = 0;
        if(totalPriceEl) totalPriceEl.textContent = '€0.00';
        if(checkoutBtn) checkoutBtn.disabled = true;
        return;
    }

    let totalQty = 0;
    let totalPrice = 0;

    cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'product-card';
        div.innerHTML = `
            <h3>${item.name}</h3>
            <p>€${(item.price / 100).toFixed(2)}</p>
            <p>Quantity: ${item.qty}</p>
        `;

        const plusBtn = document.createElement('button');
        plusBtn.textContent = '+';
        plusBtn.addEventListener('click', () => updateQty(item._id, 1));

        const minusBtn = document.createElement('button');
        minusBtn.textContent = '-';
        minusBtn.addEventListener('click', () => updateQty(item._id, -1));

        div.appendChild(plusBtn);
        div.appendChild(minusBtn);

        cartList.appendChild(div);

        totalQty += item.qty;
        totalPrice += item.price * item.qty;
    });

    if(totalQtyEl) totalQtyEl.textContent = totalQty;
    if(totalPriceEl) totalPriceEl.textContent = `€${(totalPrice / 100).toFixed(2)}`;
    if(checkoutBtn) checkoutBtn.disabled = false;
}

// Clear Cart button
document.getElementById('clearCart')?.addEventListener('click', () => {
    saveCart([]);
    displayCart();
});

// ---------- API Test ----------
const apiStatusEl = document.getElementById('apiStatus');
async function testAPI() {
    try {
        const res = await fetch(`${backendUrl}/api/test`);
        const data = await res.json();
        if(apiStatusEl) apiStatusEl.textContent = data.message;
    } catch {
        if(apiStatusEl) apiStatusEl.textContent = 'Error';
    }
}

// ---------- Initialize ----------
fetchProducts();
displayCart();
testAPI();
updateCartCount();
updateAuthUI();
