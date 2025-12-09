const backendUrl = 'https://gmart-backend-7kyz.onrender.com';
let userToken = localStorage.getItem('token') || null;

// ---------- Test API ----------
document.getElementById('testBtn').addEventListener('click', async () => {
    try {
        const response = await fetch(`${backendUrl}/api/test`);
        const data = await response.json();
        document.getElementById('result').textContent = data.message;
    } catch (err) {
        console.error(err);
        document.getElementById('result').textContent = 'Error connecting to API';
    }
});

// ---------- Fetch & display products ----------
async function fetchProducts() {
    try {
        const response = await fetch(`${backendUrl}/api/products`);
        const products = await response.json();
        const container = document.getElementById('products-container');
        container.innerHTML = '';

        if (!products || products.length === 0) {
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
        console.error(err);
        document.getElementById('products-container').textContent = 'Error loading products';
    }
}

fetchProducts();

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
    if (existing) existing.qty += 1;
    else cart.push({...product, qty: 1});
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
displayCart();
