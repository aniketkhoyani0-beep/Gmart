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
