// main.js (paste into frontend/main.js)
const API = 'https://gmart-backend-7kyz.onrender.com';
const bannerCarousel = document.getElementById('bannerCarousel');
const carouselDots = document.getElementById('carouselDots');
const categoriesRow = document.getElementById('categoriesRow');
const homeSections = document.getElementById('homeSections');
const allProductsGrid = document.getElementById('allProductsGrid');
const cartCountEl = document.getElementById('cartCount');
const themeToggle = document.getElementById('themeToggle');
const authLink = document.getElementById('authLink');
const logoutBtn = document.getElementById('logoutBtn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

// Basic user/token handling
let userToken = localStorage.getItem('userToken') || null;
function updateAuthUI(){
  if(userToken){ authLink.style.display='none'; logoutBtn.style.display='inline-block'; }
  else { authLink.style.display='inline-block'; logoutBtn.style.display='none'; }
}
logoutBtn?.addEventListener('click', ()=>{
  localStorage.removeItem('userToken'); userToken = null; updateAuthUI(); alert('Logged out');
});
updateAuthUI();

// Theme toggle
if(localStorage.getItem('gm-theme') === 'dark') document.body.classList.add('dark-mode');
themeToggle?.addEventListener('click', ()=>{
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('gm-theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
});

// Cart helpers
function getCart(){ return JSON.parse(localStorage.getItem('cart') || '[]'); }
function saveCart(c){ localStorage.setItem('cart', JSON.stringify(c)); updateCartCount(); }
function updateCartCount(){ const c = getCart(); const qty = c.reduce((s,i)=>s + (i.qty||0),0); cartCountEl && (cartCountEl.textContent = qty); }
function addToCart(product, qty=1){
  const cart = getCart();
  const existing = cart.find(i => i._id === product._id);
  if(existing) existing.qty = (existing.qty||0) + qty;
  else cart.push({...product, qty});
  saveCart(cart);
}

// Safe image helper
function imgFor(p){ if(p.images && p.images.length) return p.images[0]; if(p.image) return p.image; return 'assets/default.png' }

// --- Banner carousel data (you can replace urls with your banner images) ---
const banners = [
  {img:'assets/banner1.jpg', alt:'Daily Savings'},
  {img:'assets/banner2.jpg', alt:'Winter Store'},
  {img:'assets/banner3.jpg', alt:'Half Price Deals'},
];

// build banner carousel
function initCarousel(){
  if(!bannerCarousel) return;
  bannerCarousel.innerHTML = '';
  banners.forEach((b, idx)=>{
    const slide = document.createElement('div'); slide.className='slide';
    slide.style.flex='0 0 100%';
    slide.innerHTML = `<img src="${b.img}" alt="${b.alt}">`;
    bannerCarousel.appendChild(slide);

    const dot = document.createElement('button');
    dot.className='dot'; dot.dataset.idx=idx;
    dot.addEventListener('click', ()=>goToSlide(idx));
    carouselDots.appendChild(dot);
  });
  let cur = 0, slides = bannerCarousel.children;
  function setActive(i){
    const w = bannerCarousel.clientWidth;
    bannerCarousel.style.transform = `translateX(-${i*100}%)`;
    Array.from(carouselDots.children).forEach((d,ii)=>d.style.opacity = (ii===i?1:0.4));
    cur = i;
  }
  window.goToSlide = setActive;
  setActive(0);
  setInterval(()=> setActive((cur+1) % slides.length), 5000);
}
initCarousel();

// --- categories (top row) default labels if server has none ---
const defaultCategories = [
  {name:'Dairy', icon:'assets/cats/dairy.png'},
  {name:'Snacks', icon:'assets/cats/snacks.png'},
  {name:'Beverages', icon:'assets/cats/tea.png'},
  {name:'Personal Care', icon:'assets/cats/shampoo.png'},
  {name:'Household', icon:'assets/cats/homecare.png'},
  {name:'Baby', icon:'assets/cats/baby.png'},
  {name:'Pet', icon:'assets/cats/pet.png'},
];

function buildCategories(cats = defaultCategories){
  if(!categoriesRow) return;
  categoriesRow.innerHTML = '';
  cats.forEach(c=>{
    const card = document.createElement('div'); card.className='cat-card';
    card.innerHTML = `<img src="${c.icon||'assets/cats/default.png'}" alt="${c.name}"/><p>${c.name}</p>`;
    card.addEventListener('click', ()=> { window.location.href = `index.html?cat=${encodeURIComponent(c.name)}` });
    categoriesRow.appendChild(card);
  });
}

// --- dynamic section builders ---
// mapping of sectionName -> filter function
const sectionMap = [
  {id:'winter', title:'The Winter Store', filter: p => p.tags && p.tags.includes('winter')},
  {id:'halfprice', title:'Half Price Store', filter: p => (p.discount && p.discount >= 30)},
  {id:'merry', title:'Merry Shopping', filter: p => p.tags && p.tags.includes('festive')},
  {id:'exclusive', title:'Gmart Exclusive', filter: p => p.tags && p.tags.includes('exclusive')},
  {id:'clearance', title:'Clearance Carnival', filter: p => (p.discount && p.discount >= 40)},
  {id:'popular', title:'Most Popular Picks', filter: p => (p.popularity && p.popularity > 50)},
  {id:'kitchen', title:'Home & Kitchen Deals', filter: p => p.category && p.category.toLowerCase().includes('kitchen')},
  {id:'pet', title:'Paw-some Delights', filter: p => p.category && p.category.toLowerCase().includes('pet')},
];

// build a one horizontal section
function makeSection(title, products){
  const sec = document.createElement('div'); sec.className='section';
  sec.innerHTML = `<div class="section-header"><h3>${title}</h3><a class="link-btn" href="#">View All</a></div>`;
  const row = document.createElement('div'); row.className='row products-grid-horizontal';
  products.forEach(p=>{
    const card = document.createElement('div'); card.className='product-card';
    card.innerHTML = `
      <img src="${imgFor(p)}" alt="${p.name}">
      <h4 title="${p.name}">${p.name}</h4>
      <div class="price-row">
        <div>
          <div class="price">€${(p.price/100).toFixed(2)}</div>
          ${p.discount ? `<div class="price-old">€${((p.price/(1 - p.discount/100))/100).toFixed(2)}</div>` : ''}
        </div>
      </div>
      <button class="add-cart-btn">ADD TO CART</button>
    `;
    // add button
    card.querySelector('.add-cart-btn').addEventListener('click', (ev)=>{
      ev.stopPropagation();
      addToCart(p, 1);
    });
    // click card open product page
    card.addEventListener('click', ()=> {
      // navigate to product page by id
      window.location.href = `product.html?id=${p._id}`;
    });
    row.appendChild(card);
  });
  sec.appendChild(row);
  return sec;
}

// fetch products and render sections
async function loadAndRender(){
  try{
    const res = await fetch(`${API}/api/products`);
    const products = await res.json();

    // build categories - try derive from products
    const catCounts = {};
    products.forEach(p=> {
      const cat = p.category || 'Other';
      catCounts[cat] = (catCounts[cat]||0)+1;
    });
    const cats = Object.keys(catCounts).slice(0,8).map(c=>({name:c, icon:`assets/cats/${c.toLowerCase()}.png`})); // try product derived icons
    buildCategories(cats.length ? cats : undefined);

    // build each named section by filter
    homeSections.innerHTML = '';
    sectionMap.forEach(map => {
      const filtered = products.filter(map.filter);
      if(filtered && filtered.length){
        // pick top N
        const sorted = filtered.slice().sort((a,b)=> (b.popularity||0) - (a.popularity||0)).slice(0,8);
        const sec = makeSection(map.title, sorted);
        homeSections.appendChild(sec);
      }
    });

    // fallback: all products grid small
    if(allProductsGrid){
      allProductsGrid.innerHTML = '';
      const show = products.slice(0,24);
      show.forEach(p=>{
        const card = document.createElement('div'); card.className='product-card';
        card.innerHTML = `<img src="${imgFor(p)}" alt="${p.name}"><h4>${p.name}</h4><div class="price-row"><div class="price">€${(p.price/100).toFixed(2)}</div></div><button class="add-cart-btn">ADD TO CART</button>`;
        card.querySelector('.add-cart-btn').addEventListener('click', (ev)=>{
          ev.stopPropagation(); addToCart(p, 1);
        });
        card.addEventListener('click', ()=> window.location.href = `product.html?id=${p._id}`);
        allProductsGrid.appendChild(card);
      });
    }

    // update cart count
    updateCartCount();
  } catch (err){
    console.error('Failed to load products', err);
    homeSections.innerHTML = '<div style="padding:20px">Could not load sections. Try again later.</div>';
  }
}
loadAndRender();

// search behaviour (simple filter redirect)
searchBtn?.addEventListener('click', ()=>{
  const q = (searchInput.value || '').trim();
  if(!q) return;
  // simple search approach: open index with query param (you can implement search on backend)
  window.location.href = `index.html?search=${encodeURIComponent(q)}`;
});

// small helper to update cart count after other pages
function updateCartCount(){ const q = getCart(); const qty = q.reduce((s,i)=> s + (i.qty||0), 0); cartCountEl && (cartCountEl.innerText = qty); }
function getCart(){ return JSON.parse(localStorage.getItem('cart') || '[]'); }

window.addToCart = addToCart;
window.updateCartCount = updateCartCount;
updateCartCount();

// searchbox suggestions
const searchInput = document.getElementById("searchInput");
const suggestionsBox = document.getElementById("searchSuggestions");

if (searchInput) {
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    suggestionsBox.innerHTML = "";

    if (!query || query.length < 2) {
      suggestionsBox.style.display = "none";
      return;
    }

    const matches = allProducts
      .filter(p => p.name.toLowerCase().includes(query))
      .slice(0, 6); // max 6 suggestions

    if (matches.length === 0) {
      suggestionsBox.style.display = "none";
      return;
    }

    matches.forEach(product => {
      const div = document.createElement("div");
      div.className = "search-suggestion-item";
      div.innerHTML = `
        <img src="${product.image}" alt="${product.name}">
        <span>${product.name}</span>
      `;

      div.addEventListener("click", () => {
        window.location.href = `product.html?id=${product._id}`;
      });

      suggestionsBox.appendChild(div);
    });

    suggestionsBox.style.display = "block";
  });

  // Hide when clicking outside
  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
      suggestionsBox.style.display = "none";
    }
  });
}

/* ================= SEARCH WITH SUGGESTIONS ================= */

const searchInput = document.getElementById("searchInput");
const suggestionsBox = document.getElementById("searchSuggestions");

let selectedIndex = -1;

// IMPORTANT: this must match your products array
// Example: products = [{ title, category, price, image }]
function getAllProducts() {
  return window.products || [];
}

function showSuggestions(value) {
  const query = value.toLowerCase().trim();
  suggestionsBox.innerHTML = "";
  selectedIndex = -1;

  if (!query) {
    suggestionsBox.classList.remove("active");
    return;
  }

  const results = getAllProducts().filter(p =>
    p.title.toLowerCase().includes(query) ||
    p.category?.toLowerCase().includes(query)
  );

  if (results.length === 0) {
    suggestionsBox.innerHTML =
      `<div class="search-no-results">No products found</div>`;
    suggestionsBox.classList.add("active");
    return;
  }

  results.slice(0, 8).forEach((product, index) => {
    const div = document.createElement("div");
    div.className = "search-suggestion";
    div.innerHTML = `
      <strong>${product.title}</strong>
      <span>${product.category || "Product"}</span>
    `;

    div.addEventListener("click", () => {
      searchInput.value = product.title;
      suggestionsBox.classList.remove("active");
      filterProducts(product.title);
    });

    suggestionsBox.appendChild(div);
  });

  suggestionsBox.classList.add("active");
}

searchInput.addEventListener("input", e => {
  showSuggestions(e.target.value);
});

/* Keyboard navigation */
searchInput.addEventListener("keydown", e => {
  const items = suggestionsBox.querySelectorAll(".search-suggestion");
  if (!items.length) return;

  if (e.key === "ArrowDown") {
    selectedIndex = (selectedIndex + 1) % items.length;
  } else if (e.key === "ArrowUp") {
    selectedIndex = (selectedIndex - 1 + items.length) % items.length;
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (items[selectedIndex]) items[selectedIndex].click();
    return;
  } else {
    return;
  }

  items.forEach(i => i.classList.remove("active"));
  items[selectedIndex].classList.add("active");
});

/* Close suggestions on outside click */
document.addEventListener("click", e => {
  if (!e.target.closest(".search-box")) {
    suggestionsBox.classList.remove("active");
  }
});
