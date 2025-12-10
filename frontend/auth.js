// auth.js (ES module)
const BACK = 'https://gmart-backend-7kyz.onrender.com';
const TOKEN_KEY = 'userToken';

const $ = s => document.querySelector(s);

async function register(){
  const email = $('#email').value.trim();
  const password = $('#password').value;
  $('#authMsg').textContent = 'Working...';
  try{
    const res = await fetch(`${BACK}/api/auth/register`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email, password, name: email.split('@')[0] })
    });
    const j = await res.json();
    $('#authMsg').textContent = j.error ? j.error : 'Registered — please login';
  }catch(e){
    $('#authMsg').textContent = 'Registration failed';
    console.error(e);
  }
}

async function login(){
  const email = $('#email').value.trim();
  const password = $('#password').value;
  $('#authMsg').textContent = 'Logging in...';
  try{
    const res = await fetch(`${BACK}/api/auth/login`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email, password })
    });
    const j = await res.json();
    if(j.token){
      localStorage.setItem(TOKEN_KEY, j.token);
      $('#authMsg').textContent = 'Login successful! Redirecting…';
      setTimeout(()=> location.href='index.html', 700);
    } else {
      $('#authMsg').textContent = j.error || 'Login failed';
    }
  }catch(e){
    $('#authMsg').textContent = 'Login error';
    console.error(e);
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  if($('#registerBtn')) $('#registerBtn').addEventListener('click', register);
  if($('#loginBtn')) $('#loginBtn').addEventListener('click', login);

  // wire theme button
  document.querySelectorAll('#themeToggle').forEach(b=>b.addEventListener('click', ()=>{
    const cur = localStorage.getItem('gmart_theme')||'light';
    document.documentElement.classList.toggle('dark', cur !== 'dark');
    localStorage.setItem('gmart_theme', cur === 'dark' ? 'light' : 'dark');
    location.reload();
  }));
});
