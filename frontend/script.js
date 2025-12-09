let userToken = null; // Store JWT token

// ---------- Register ----------
document.getElementById('registerBtn').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch('https://gmart-backend-7kyz.onrender.com/api/auth/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email, password, name: email.split('@')[0] })
        });

        const data = await res.json();
        if (data.error) {
            document.getElementById('auth-msg').textContent = data.error;
        } else {
            document.getElementById('auth-msg').textContent = 'Registered successfully! You can login now.';
        }
    } catch (err) {
        console.error(err);
        document.getElementById('auth-msg').textContent = 'Registration failed';
    }
});

// ---------- Login ----------
document.getElementById('loginBtn').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch('https://gmart-backend-7kyz.onrender.com/api/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (data.token) {
            userToken = data.token;
            document.getElementById('auth-msg').textContent = 'Logged in successfully!';
        } else {
            document.getElementById('auth-msg').textContent = data.error || 'Login failed';
        }
    } catch (err) {
        console.error(err);
        document.getElementById('auth-msg').textContent = 'Login failed';
    }
});



// ---------- Cart functionality ----------
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

