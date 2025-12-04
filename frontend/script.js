document.getElementById('testBtn').addEventListener('click', async () => {
    try {
        const response = await fetch('https://gmart-backend-7kyz.onrender.com/api/test', {
  credentials: 'include'
});


        const data = await response.json();
        document.getElementById('result').textContent = data.message;
    } catch (err) {
        document.getElementById('result').textContent = 'Error connecting to API';
    }
});


