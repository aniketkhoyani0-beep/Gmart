document.getElementById('testBtn').addEventListener('click', async () => {
    try {
        const response = await fetch('https://gmart-backend-7kyz.onrender.com/api/test', {
            method: 'GET',
            credentials: 'include',   // Important: allows cookies/auth headers
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        document.getElementById('result').textContent = data.message;
    } catch (err) {
        console.error('API Error:', err);  // Helpful to debug
        document.getElementById('result').textContent = 'Error connecting to API';
    }
});



