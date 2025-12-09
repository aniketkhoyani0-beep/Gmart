const backendUrl = 'https://gmart-backend-7kyz.onrender.com';
let userToken = null; // JWT token for logged-in users

// ---------- Test API ----------
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

// ---------- Auth ----------
document.getElementById('registerBtn').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch(`${backendUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.token) {
            userToken = data.token;
            document.getElementById('auth-msg').textContent = `Logged in as ${email}`;
            await displayCart(); // Load backend cart after login
        } else {
            document.getElementById('auth-msg').textContent = data.error || 'Login failed';
        }
    } catch (err) {
        console.error(err);
        document.getElementById('auth-msg').textContent = 'Login failed';
    }
});

// ---------- Cart functions ----------
async function getCart() {
    if (userToken) {
        try {
            const res = await fetch(`${backendUrl}/api/cart`, {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            const data = await res.json();
            return data.items || [];
        } catch (err) {
            console.error('Fetch backend cart error:', err);
            return [];
        }
    } else {
        return JSON.parse(localStorage.getItem('cart') || '[]');
    }
}

async function saveCart(cart) {
    if (userToken) {
        try {
            await fetch(`${backendUrl}/api/cart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify({ items: cart })
            });
        } catch (err) {
            console.error('Save backend cart error:', err);
        }
    } else {
        localStorage.setItem('cart', JSON.stringify(cart));
    }
}

async function addToCart(product) {
    const cart = await getCart();
    const existing = cart.find(item => item._id === product._id);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    await saveCart(cart);
    displayCart();
}

async function updateQty(productId, delta) {
    const cart = await getCart();
    const item = cart.find(i => i._id === productId);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
        const index = cart.indexOf(item);
        cart.splice(index, 1);
    }
    await saveCart(cart);
    displayCart();
}

async function displayCart() {
    const cart = await getCart();
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

// ---------- Fetch & display products ----------
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

// Fetch products immediately
fetchProducts();
// Display cart initially
displayCart();
