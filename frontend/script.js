const backendUrl = 'https://gmart-backend-7kyz.onrender.com';
let userToken = localStorage.getItem('token') || null;

// ---------- AUTH ---------- //
if (window.location.pathname.includes('index.html')) {
    // Redirect to login if not logged in
    if (!userToken) {
        alert('You must login first!');
        window.location.href = 'auth.html';
    } else {
        document.getElementById('welcome-msg').textContent = 'Logged in';
    }

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        alert('Logged out successfully!');
        window.location.href = 'auth.html';
    });
}

if (window.location.pathname.includes('auth.html')) {
    document.getElementById('registerBtn').addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const res = await fetch(`${backendUrl}/api/auth/register`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ email, password, name: email.split('@')[0] })
            });
            const data = await res.json();
            document.getElementById('auth-msg').textContent = data.error || 'Registered successfully! You can login now.';
        } catch (err) {
            console.error(err);
            document.getElementById('auth-msg').textContent = 'Registration failed';
        }
    });

    document.getElementById('loginBtn').addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const res = await fetch(`${backendUrl}/api/auth/login`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (data.token) {
                userToken = data.token;
                localStorage.setItem('token', userToken);
                alert('Logged in successfully!');
                window.location.href = 'index.html';
            } else {
                document.getElementById('auth-msg').textContent = data.error || 'Login failed';
            }
        } catch (err) {
            console.error(err);
            document.getElementById('auth-msg').textContent = 'Login failed';
        }
    });
}

// ---------- TEST API ---------- //
if (document.getElementById('testBtn')) {
    document.getElementById('testBtn').addEventListener('click', async () => {
        try {
            const response = await fetch(`${backendUrl}/api/test`);
            const data = await response.json();
            document.getElementById('result').textContent = data.message;
        } catch (err) {
            console.error('API Error:', err);
            document.getElementById('result').textContent = 'Error connecting to API';
        }
    });
}

// ---------- PRODUCTS ---------- //
async function fetchProducts() {
    try {
        const response = await fetch(`${backendUrl}/api/products`);
        const products = await response.json();
        const container = document.getElementById('products-container');
        container.innerHTML = '';

        if (products.length === 0) {
            container.textContent = 'No products available.';
            return;
        }

        products.forEach(p => {
            const prodDiv = document.createElement('div');
            prodDiv.className = 'product-card';
            prodDiv.innerHTML = `
                <h3>${p.name}</h3>
                <p>${p.description}</p>
                <p>Price: €${(p.price / 100).toFixed(2)}</p>
                <button onclick='addToCart(${JSON.stringify(p)})'>Add to Cart</button>
            `;
            container.appendChild(prodDiv);
        });
    } catch (err) {
        console.error('Products Error:', err);
        document.getElementById('products-container').textContent = 'Error loading products';
    }
}

if (document.getElementById('products-container')) fetchProducts();

// ---------- CART ---------- //
function getCart() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
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
    displayCart();
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

function displayCart() {
    const cart = getCart();
    const container = document.getElementById('cart-container');
    const summary = document.getElementById('cart-summary');
    container.innerHTML = '';
    let total = 0;
    let totalQty = 0;

    if (!cart || cart.length === 0) {
        container.textContent = 'Cart is empty.';
        summary.textContent = '';
        return;
    }

    cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'product-card';
        div.innerHTML = `
            <h3>${item.name}</h3>
            <p>€${(item.price / 100).toFixed(2)}</p>
            <p>Quantity: ${item.qty}</p>
            <button onclick='updateQty("${item._id}", 1)'>+</button>
            <button onclick='updateQty("${item._id}", -1)'>-</button>
        `;
        container.appendChild(div);
        total += item.price * item.qty;
        totalQty += item.qty;
    });

    summary.textContent = `Total Items: ${totalQty}, Total Price: €${(total / 100).toFixed(2)}`;
}

// Display cart on page load
if (document.getElementById('cart-container')) displayCart();
