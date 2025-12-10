const backendUrl = "https://gmart-backend-7kyz.onrender.com";

// GLOBAL TOKEN
let userToken = localStorage.getItem("userToken") || null;

/* ------------------- AUTH --------------------- */

// REGISTER
if (document.getElementById("registerBtn")) {
    document.getElementById("registerBtn").addEventListener("click", async () => {
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            const res = await fetch(`${backendUrl}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, name: email.split("@")[0] })
            });

            const data = await res.json();
            document.getElementById("auth-msg").textContent =
                data.error ? data.error : "Registered successfully!";
        } catch (err) {
            document.getElementById("auth-msg").textContent = "Error registering";
        }
    });
}

// LOGIN
if (document.getElementById("loginBtn")) {
    document.getElementById("loginBtn").addEventListener("click", async () => {
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            const res = await fetch(`${backendUrl}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (data.token) {
                userToken = data.token;
                localStorage.setItem("userToken", data.token);

                document.getElementById("auth-msg").textContent = "Login successful!";

                setTimeout(() => {
                    window.location.href = "index.html"; // redirect home
                }, 800);
            } else {
                document.getElementById("auth-msg").textContent = data.error || "Login failed";
            }
        } catch {
            document.getElementById("auth-msg").textContent = "Login error";
        }
    });
}

/* ------------------- LOGOUT --------------------- */

if (document.getElementById("logoutBtn")) {
    document.getElementById("logoutBtn").addEventListener("click", () => {
        localStorage.removeItem("userToken");
        userToken = null;

        alert("Logged out!");
        window.location.reload();
    });
}


/* ------------------- PRODUCTS --------------------- */

async function fetchProducts() {
    const container = document.getElementById("products-container");
    if (!container) return;

    try {
        const response = await fetch(`${backendUrl}/api/products`);
        const products = await response.json();

        container.innerHTML = "";

        products.forEach(p => {
            const div = document.createElement("div");
            div.className = "product-card";
            div.innerHTML = `
                <img src="${p.image}" class="product-img" onerror="this.src='placeholder.png'">
                <h3>${p.name}</h3>
                <p>${p.description}</p>
                <p>€${(p.price / 100).toFixed(2)}</p>
                <button onclick='addToCart(${JSON.stringify(p)})'>Add to Cart</button>
            `;
            container.appendChild(div);
        });

    } catch (err) {
        container.textContent = "Failed to load products";
    }
}


/* ------------------- CART --------------------- */

function getCart() {
    return JSON.parse(localStorage.getItem("cart") || "[]");
}

function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart(product) {
    const cart = getCart();
    const existing = cart.find(i => i._id === product._id);

    if (existing) existing.qty++;
    else cart.push({ ...product, qty: 1 });

    saveCart(cart);
    alert("Added to cart!");
}

