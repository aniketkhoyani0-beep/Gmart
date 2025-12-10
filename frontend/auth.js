const backendUrl = 'https://gmart-backend-7kyz.onrender.com';
let userToken = localStorage.getItem('gmartToken') || null;

// Update auth message
function setAuthMsg(msg, isError = false) {
    const el = document.getElementById('auth-msg');
    el.textContent = msg;
    el.style.color = isError ? 'red' : 'green';
}

// ---------- Register ----------
document.getElementById('registerBtn').addEventListener('click', async () => {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    if (!email || !password) return setAuthMsg('Email and password required', true);

    try {
        const res = await fetch(`${backendUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name: email.split('@')[0] })
        });
        const data = await res.json();
        if (data.error) {
            setAuthMsg(data.error, true);
        } else {
            setAuthMsg('Registered successfully! You can login now.');
        }
    } catch (err) {
        console.error(err);
        setAuthMsg('Registration failed', true);
    }
});

// ---------- Login ----------
document.getElementById('loginBtn').addEventListener('click', async () => {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    if (!email || !password) return setAuthMsg('Email and password required', true);

    try {
        const res = await fetch(`${backendUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.token) {
            userToken = data.token;
            localStorage.setItem('gmartToken', userToken);
            setAuthMsg('Logged in successfully!');
            setTimeout(() => window.location.href = 'index.html', 1000);
        } else {
            setAuthMsg(data.error || 'Login failed', true);
        }
    } catch (err) {
        console.error(err);
        setAuthMsg('Login failed', true);
    }
});

// ---------- Dark/Light Mode Toggle ----------
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    themeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
});
