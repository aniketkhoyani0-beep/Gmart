const backendUrl = 'https://gmart-backend-7kyz.onrender.com';
let userToken = null;

// ---------- Register ----------
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

// ---------- Login ----------
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
            document.getElementById('auth-msg').textContent = 'Logged in successfully!';
            window.location.href = 'index.html';
        } else {
            document.getElementById('auth-msg').textContent = data.error || 'Login failed';
        }
    } catch (err) {
        console.error(err);
        document.getElementById('auth-msg').textContent = 'Login failed';
    }
});
