// main.js
const backendUrl = 'https://gmart-backend-7kyz.onrender.com';

// --------- User authentication ----------
let userToken = localStorage.getItem('userToken') || null;
const authLink = document.getElementById('authLink');
const logoutBtn = document.getElementById('logoutBtn');

// Update header based on login status
function updateAuthUI() {
    if (userToken) {
        authLink.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
    } else {
        authLink.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
    }
}
updateAuthUI();

// Logout functionality
logoutBtn.addEventListener('click', () => {
    userToken = null;
    localStorage.removeItem('userToken');
    updateAuthUI();
    alert('Logged out successfully!');
});

// --------- Cart functionality ----------
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

function updateCartCount() {
    const count = getCart().reduce((sum, item) => sum + item.qty, 0);
    document.getElementById('cartCount').textContent = count;
}
updateCartCount();

// --------- Theme toggle ----------
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
    const body = document.body;
    body.classList.toggle('dark-mode');
    themeToggle.textContent = body.classList.contains('dark-mode') ? '☀️' : '🌙';
});

// Apply saved theme
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark-mode');
    themeToggle.textContent = '☀️';
}

// --------- Test API ----------
const apiStatus = document.getElementById('apiStatus');
async function testAPI() {
    try {
        const res = await fetch(`${backendUrl}/api/test`);
        const data = await res.json();
        apiStatus.textContent = data.message;
    } catch (err) {
        apiStatus.textContent = 'Error connecting to API';
    }
}
testAPI();

// --------- Fetch & display products ----------
const productsContainer = document.getElementById('products');

async function fetchProducts() {
    try {
        const res = await fetch(`${backendUrl}/api/products`);
        const products = await res.json();
        productsContainer.innerHTML = '';

        if (products.length === 0) {
            productsContainer.textContent = 'No products available.';
            return;
        }

        products.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="${p.image || 'assets/default-product.png'}" alt="${p.name}" class="product-img" />
                <h3>${p.name}</h3>
                <p>${p.description}</p>
                <p>Price: €${(p.price/100).toFixed(2)}</p>
                <button class="add-cart-btn">Add to Cart</button>
            `;
            productsContainer.appendChild(card);

            // Click on card opens product.html
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('add-cart-btn')) {
                    e.stopPropagation();
                    addToCart(p);
                } else {
                    localStorage.setItem('selectedProduct', JSON.stringify(p));
                    window.location.href = 'product.html';
                }
            });
        });
    } catch (err) {
        console.error('Products fetch error:', err);
        productsContainer.textContent = 'Error loading products';
    }
}

fetchProducts();
