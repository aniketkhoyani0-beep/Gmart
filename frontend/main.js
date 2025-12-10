const backendUrl = 'https://gmart-backend-7kyz.onrender.com';

// ---------- Elements ----------
const authLink = document.getElementById('authLink');
const logoutBtn = document.getElementById('logoutBtn');
const cartCountEl = document.getElementById('cartCount');
const themeToggle = document.getElementById('themeToggle');
const productsContainer = document.getElementById('products');

// ---------- User State ----------
let userToken = localStorage.getItem('userToken') || null;

// ---------- Header Update ----------
function updateHeader() {
    if (userToken) {
        authLink.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
    } else {
        authLink.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
    }
}
updateHeader();

// ---------- Logout ----------
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('userToken');
    userToken = null;
    updateHeader();
    alert('Logged out successfully');
});

// ---------- Theme Toggle ----------
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    themeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
});

// ---------- Cart Functions ----------
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
    if (existing) existing.qty += 1;
    else cart.push({ ...product, qty: 1 });
    saveCart(cart);
    alert(`${product.name} added to cart`);
}

function updateCartCount() {
    const cart = getCart();
    const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
    cartCountEl.textContent = totalQty;
}
updateCartCount();

// ---------- Fetch & Display Products ----------
async function fetchProducts() {
    try {
        const res = await fetch(`${backendUrl}/api/products`);
        const products = await res.json();
        productsContainer.innerHTML = '';

        if (!products.length) {
            productsContainer.textContent = 'No products available';
            return;
        }

        products.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <h3>${p.name}</h3>
                <p>${p.description}</p>
                <p>Price: €${(p.price / 100).toFixed(2)}</p>
            `;
            // Open product.html with product ID on click
            card.addEventListener('click', () => {
                window.location.href = `product.html?id=${p._id}`;
            });

            // Add to Cart button
            const btn = document.createElement('button');
            btn.textContent = 'Add to Cart';
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // prevent card click
                addToCart(p);
            });
            card.appendChild(btn);

            productsContainer.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        productsContainer.textContent = 'Error loading products';
    }
}

fetchProducts();
