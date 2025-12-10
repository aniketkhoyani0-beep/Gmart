// main.js
const backendUrl = 'https://gmart-backend-7kyz.onrender.com';

// ------------------ Theme Toggle ------------------
const themeToggle = document.getElementById('themeToggle');
function loadTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.body.dataset.theme = theme;
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}
themeToggle?.addEventListener('click', () => {
    const current = document.body.dataset.theme;
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.body.dataset.theme = newTheme;
    localStorage.setItem('theme', newTheme);
    themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
});
loadTheme();

// ------------------ Auth ------------------
let userToken = null;

function updateAuthUI() {
    const loginLink = document.getElementById('authLink');
    const logoutBtn = document.getElementById('logoutBtn');
    if (!loginLink || !logoutBtn) return;
    if (userToken) {
        loginLink.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
    } else {
        loginLink.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
    }
}

document.getElementById('registerBtn')?.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
        const res = await fetch(`${backendUrl}/api/auth/register`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, password, name: email.split('@')[0]})
        });
        const data = await res.json();
        document.getElementById('auth-msg').textContent = data.error || 'Registered! Login now.';
    } catch (err) {
        console.error(err);
        document.getElementById('auth-msg').textContent = 'Registration failed';
    }
});

document.getElementById('loginBtn')?.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
        const res = await fetch(`${backendUrl}/api/auth/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, password})
        });
        const data = await res.json();
        if (data.token) {
            userToken = data.token;
            document.getElementById('auth-msg').textContent = 'Logged in successfully!';
            updateAuthUI();
        } else {
            document.getElementById('auth-msg').textContent = data.error || 'Login failed';
        }
    } catch (err) {
        console.error(err);
        document.getElementById('auth-msg').textContent = 'Login failed';
    }
});

document.getElementById('logoutBtn')?.addEventListener('click', () => {
    userToken = null;
    updateAuthUI();
});

// ------------------ Cart ------------------
function getCart() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
}
function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}
function updateCartCount() {
    const countEl = document.getElementById('cartCount');
    if (!countEl) return;
    const cart = getCart();
    const totalQty = cart.reduce((sum, i) => sum + i.qty, 0);
    countEl.textContent = totalQty;
}
function addToCart(product) {
    const cart = getCart();
    const existing = cart.find(i => i._id === product._id);
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

// ------------------ Display Products ------------------
async function fetchProducts() {
    const productsEl = document.getElementById('products');
    if (!productsEl) return;
    try {
        const res = await fetch(`${backendUrl}/api/products`);
        const products = await res.json();
        productsEl.innerHTML = '';

        if (!products.length) {
            productsEl.textContent = 'No products available.';
            return;
        }

        products.forEach(p => {
            const div = document.createElement('div');
            div.className = 'product-card';
            div.innerHTML = `
                <img src="${p.image || 'placeholder.png'}" alt="${p.name}" class="product-img">
                <h3>${p.name}</h3>
                <p>${p.description}</p>
                <p>Price: €${(p.price/100).toFixed(2)}</p>
                <button>Add to Cart</button>
            `;
            div.querySelector('button').addEventListener('click', e => {
                e.stopPropagation();
                addToCart(p);
            });
            div.addEventListener('click', () => {
                alert(`${p.name}\n\n${p.description}\nPrice: €${(p.price/100).toFixed(2)}`);
            });
            productsEl.appendChild(div);
        });
    } catch(err) {
        console.error('Products fetch error', err);
        productsEl.textContent = 'Error loading products';
    }
}

// ------------------ Display Cart ------------------
function displayCart() {
    const container = document.getElementById('cartList');
    const totalQtyEl = document.getElementById('totalQty');
    const totalPriceEl = document.getElementById('totalPrice');
    const cart = getCart();

    if (!container || !totalQtyEl || !totalPriceEl) return;

    container.innerHTML = '';
    let total = 0;
    let totalQty = 0;

    if (!cart.length) {
        container.innerHTML = `<p>Your cart is empty.</p><a href="index.html" class="primary">Shop Now</a>`;
        totalQtyEl.textContent = '0';
        totalPriceEl.textContent = '€0.00';
        return;
    }

    cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'product-card';
        div.innerHTML = `
            <h3>${item.name}</h3>
            <p>€${(item.price/100).toFixed(2)}</p>
            <p>Quantity: ${item.qty}</p>
            <button class="qty-btn">+</button>
            <button class="qty-btn">-</button>
        `;
        div.querySelectorAll('button')[0].addEventListener('click', () => updateQty(item._id, 1));
        div.querySelectorAll('button')[1].addEventListener('click', () => updateQty(item._id, -1));
        container.appendChild(div);

        total += item.price * item.qty;
        totalQty += item.qty;
    });

    totalQtyEl.textContent = totalQty;
    totalPriceEl.textContent = `€${(total/100).toFixed(2)}`;
}

// ------------------ Initialize ------------------
updateAuthUI();
updateCartCount();
fetchProducts();
displayCart();
