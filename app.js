const STORAGE_CARS = 'automarket_cars';
const STORAGE_AUTH = 'automarket_admin_session';
const STORAGE_LOGIN_GUARD = 'automarket_login_guard';
const ADMIN_USER = 'admin';
const ADMIN_PASS_HASH = '240be518fabd2724ddb6f04eeb8f2410fb97f6db8148cf5e15ec9c5f0f00fabc'; // SHA-256("admin123")
const SESSION_HOURS = 8;

const defaultCars = [
  { id: 1, marca: 'Dacia', model: 'Duster', pret: 15900, an: 2019, kilometraj: 86000, combustibil: 'Diesel', cutie: 'Manuală', oras: 'București', categorie: 'SUV', imagine: 'https://images.unsplash.com/photo-1619994121345-4f4f4f9f9e0f?auto=format&fit=crop&w=1200&q=80', descriere: 'Dacia Duster întreținută, ideală pentru oraș și drumuri lungi.' },
  { id: 2, marca: 'Volkswagen', model: 'Passat', pret: 18700, an: 2018, kilometraj: 112000, combustibil: 'Diesel', cutie: 'Automată', oras: 'Cluj-Napoca', categorie: 'Break', imagine: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80', descriere: 'Volkswagen Passat break, spațioasă, consum redus și confort premium.' },
  { id: 3, marca: 'Skoda', model: 'Octavia', pret: 13200, an: 2017, kilometraj: 121000, combustibil: 'Benzină', cutie: 'Manuală', oras: 'Iași', categorie: 'Sedan', imagine: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80', descriere: 'Skoda Octavia sedan, fiabilă și potrivită pentru familie.' },
  { id: 4, marca: 'BMW', model: 'X5', pret: 23500, an: 2018, kilometraj: 98000, combustibil: 'Diesel', cutie: 'Automată', oras: 'Timișoara', categorie: 'SUV', imagine: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80', descriere: 'BMW X5, pachet business, întreținută la reprezentanță.' },
  { id: 5, marca: 'Renault', model: 'Clio', pret: 8900, an: 2019, kilometraj: 69000, combustibil: 'Benzină', cutie: 'Manuală', oras: 'Brașov', categorie: 'Mașină mică', imagine: 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=80', descriere: 'Renault Clio economică, ideală pentru naveta zilnică.' }
];

const state = { cars: [], category: 'Toate', search: '', brand: '', city: '', fuel: '', minPrice: '', maxPrice: '', currentCarId: null };

const el = {
  homeLink: document.getElementById('homeLink'),
  homeView: document.getElementById('homeView'),
  detailView: document.getElementById('detailView'),
  carGrid: document.getElementById('carGrid'),
  emptyState: document.getElementById('emptyState'),
  brandFilter: document.getElementById('brandFilter'),
  cityFilter: document.getElementById('cityFilter'),
  fuelFilter: document.getElementById('fuelFilter'),
  minPrice: document.getElementById('minPrice'),
  maxPrice: document.getElementById('maxPrice'),
  searchInput: document.getElementById('searchInput'),
  resetFilters: document.getElementById('resetFilters'),
  adminBtn: document.getElementById('adminBtn'),
  authBtn: document.getElementById('authBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  adminPanel: document.getElementById('adminPanel'),
  adminList: document.getElementById('adminList'),
  openAddForm: document.getElementById('openAddForm'),
  loginModal: document.getElementById('loginModal'),
  carModal: document.getElementById('carModal'),
  detailImage: document.getElementById('detailImage'),
  detailTitle: document.getElementById('detailTitle'),
  detailPrice: document.getElementById('detailPrice'),
  detailSpecs: document.getElementById('detailSpecs'),
  detailDesc: document.getElementById('detailDesc'),
  backBtn: document.getElementById('backBtn')
};

const sha256 = async (value) => {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
};

const randomToken = () => crypto.getRandomValues(new Uint32Array(4)).join('-');
const fmtPrice = (value) => `${new Intl.NumberFormat('ro-RO').format(value)} €`;

function getCars() {
  const localCars = JSON.parse(localStorage.getItem(STORAGE_CARS));
  return Array.isArray(localCars) && localCars.length ? localCars : defaultCars;
}
const saveCars = () => localStorage.setItem(STORAGE_CARS, JSON.stringify(state.cars));

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_AUTH));
  } catch {
    return null;
  }
}

function isAdmin() {
  const session = getSession();
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    localStorage.removeItem(STORAGE_AUTH);
    return false;
  }
  return session.role === 'admin' && Boolean(session.token);
}

function getGuard() {
  const guard = JSON.parse(localStorage.getItem(STORAGE_LOGIN_GUARD) || '{"attempts":0,"blockedUntil":0}');
  if (!guard.attempts) guard.attempts = 0;
  if (!guard.blockedUntil) guard.blockedUntil = 0;
  return guard;
}

function setGuard(guard) {
  localStorage.setItem(STORAGE_LOGIN_GUARD, JSON.stringify(guard));
}

function renderBrandFilter() {
  const brands = [...new Set(state.cars.map((c) => c.marca))].sort((a, b) => a.localeCompare(b));
  el.brandFilter.innerHTML = '<option value="">Toate mărcile</option>';
  brands.forEach((brand) => {
    const option = document.createElement('option');
    option.value = brand;
    option.textContent = brand;
    el.brandFilter.append(option);
  });
}

function filteredCars() {
  return state.cars.filter((car) => {
    const text = `${car.marca} ${car.model}`.toLowerCase();
    return (!state.search || text.includes(state.search.toLowerCase())) &&
      (state.category === 'Toate' || car.categorie === state.category) &&
      (!state.brand || car.marca === state.brand) &&
      (!state.city || car.oras === state.city) &&
      (!state.fuel || car.combustibil === state.fuel) &&
      (!state.minPrice || car.pret >= Number(state.minPrice)) &&
      (!state.maxPrice || car.pret <= Number(state.maxPrice));
  });
}

function openDetails(id) {
  state.currentCarId = id;
  const car = state.cars.find((item) => item.id === id);
  if (!car) return;

  el.detailImage.src = car.imagine || 'https://placehold.co/800x500?text=Auto';
  el.detailTitle.textContent = `${car.marca} ${car.model} ${car.an}`;
  el.detailPrice.textContent = fmtPrice(car.pret);
  el.detailDesc.textContent = car.descriere || 'Mașină verificată, publicată de dealer autorizat AutoMarket România.';

  const specs = [
    ['Kilometraj', `${new Intl.NumberFormat('ro-RO').format(car.kilometraj)} km`],
    ['Combustibil', car.combustibil],
    ['Cutie viteze', car.cutie],
    ['Oraș', car.oras],
    ['Categorie', car.categorie],
    ['An', car.an]
  ];

  el.detailSpecs.innerHTML = specs.map(([k, v]) => `<div class="spec"><span>${k}</span><strong>${v}</strong></div>`).join('');
  el.homeView.classList.add('hidden');
  el.detailView.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openHome() {
  el.detailView.classList.add('hidden');
  el.homeView.classList.remove('hidden');
}

function renderCars() {
  const cars = filteredCars();
  el.carGrid.innerHTML = '';
  el.emptyState.classList.toggle('hidden', cars.length > 0);

  cars.forEach((car) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <img src="${car.imagine || 'https://placehold.co/600x400?text=Auto'}" alt="${car.marca} ${car.model}" loading="lazy">
      <div class="card-content">
        <h3 class="card-title">${car.marca} ${car.model} ${car.an}</h3>
        <p class="price">${fmtPrice(car.pret)}</p>
        <div class="details">
          <span>${new Intl.NumberFormat('ro-RO').format(car.kilometraj)} km</span>
          <span>${car.combustibil} • ${car.cutie}</span>
          <span>${car.oras}</span>
        </div>
        <div class="card-footer">
          <button class="btn primary" data-details="${car.id}">Vezi detalii</button>
          <button class="favorite" aria-label="Adaugă la favorite">♡</button>
        </div>
      </div>`;
    el.carGrid.append(card);
  });
}

function renderAdminList() {
  if (!isAdmin()) return (el.adminList.innerHTML = '');
  el.adminList.innerHTML = state.cars.map((car) => `
    <div class="admin-item">
      <span>${car.marca} ${car.model} (${car.an}) - ${fmtPrice(car.pret)}</span>
      <button class="btn ghost" data-delete="${car.id}">Șterge</button>
    </div>
  `).join('');
}

function updateAuthUI() {
  const admin = isAdmin();
  el.adminBtn.classList.toggle('hidden', !admin);
  el.logoutBtn.classList.toggle('hidden', !admin);
  el.authBtn.classList.toggle('hidden', admin);
  el.adminPanel.classList.toggle('hidden', !admin);
  renderAdminList();
}

function resetFilters() {
  state.search = state.brand = state.city = state.fuel = state.minPrice = state.maxPrice = '';
  el.searchInput.value = el.brandFilter.value = el.cityFilter.value = el.fuelFilter.value = el.minPrice.value = el.maxPrice.value = '';
}

async function handleLogin(e) {
  e.preventDefault();
  const guard = getGuard();
  const now = Date.now();
  const loginError = document.getElementById('loginError');

  if (guard.blockedUntil > now) {
    const mins = Math.ceil((guard.blockedUntil - now) / 60000);
    loginError.textContent = `Prea multe încercări. Reîncearcă peste ${mins} minute.`;
    loginError.classList.remove('hidden');
    return;
  }

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const hash = await sha256(password);

  if (username === ADMIN_USER && hash === ADMIN_PASS_HASH) {
    localStorage.setItem(STORAGE_AUTH, JSON.stringify({ role: 'admin', token: randomToken(), expiresAt: now + SESSION_HOURS * 60 * 60 * 1000 }));
    setGuard({ attempts: 0, blockedUntil: 0 });
    loginError.classList.add('hidden');
    el.loginModal.close();
    updateAuthUI();
  } else {
    const attempts = guard.attempts + 1;
    const blockedUntil = attempts >= 5 ? now + 5 * 60 * 1000 : 0;
    setGuard({ attempts: blockedUntil ? 0 : attempts, blockedUntil });
    loginError.textContent = blockedUntil ? 'Cont blocat temporar 5 minute din motive de securitate.' : 'Datele de autentificare sunt incorecte.';
    loginError.classList.remove('hidden');
  }
}

function initEvents() {
  document.querySelectorAll('.category-btn').forEach((btn) => btn.addEventListener('click', () => {
    state.category = btn.dataset.category;
    document.querySelectorAll('.category-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    renderCars();
  }));

  el.searchInput.addEventListener('input', (e) => { state.search = e.target.value; renderCars(); });
  el.brandFilter.addEventListener('change', (e) => { state.brand = e.target.value; renderCars(); });
  el.cityFilter.addEventListener('change', (e) => { state.city = e.target.value; renderCars(); });
  el.fuelFilter.addEventListener('change', (e) => { state.fuel = e.target.value; renderCars(); });
  el.minPrice.addEventListener('input', (e) => { state.minPrice = e.target.value; renderCars(); });
  el.maxPrice.addEventListener('input', (e) => { state.maxPrice = e.target.value; renderCars(); });
  el.resetFilters.addEventListener('click', () => { resetFilters(); renderCars(); });

  el.authBtn.addEventListener('click', () => el.loginModal.showModal());
  document.getElementById('closeLogin').addEventListener('click', () => el.loginModal.close());
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  el.logoutBtn.addEventListener('click', () => { localStorage.removeItem(STORAGE_AUTH); updateAuthUI(); });

  el.adminBtn.addEventListener('click', () => el.adminPanel.scrollIntoView({ behavior: 'smooth' }));
  el.openAddForm.addEventListener('click', () => { document.getElementById('carForm').reset(); el.carModal.showModal(); });
  document.getElementById('cancelCar').addEventListener('click', () => el.carModal.close());

  document.getElementById('carForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!isAdmin()) return;
    const fd = new FormData(e.target);
    state.cars.unshift({
      id: Date.now(), marca: fd.get('marca'), model: fd.get('model'), pret: Number(fd.get('pret')), an: Number(fd.get('an')),
      kilometraj: Number(fd.get('kilometraj')), combustibil: fd.get('combustibil'), cutie: fd.get('cutie'), oras: fd.get('oras'),
      categorie: fd.get('categorie'), imagine: fd.get('imagine'), descriere: `${fd.get('marca')} ${fd.get('model')} în stare excelentă.`
    });
    saveCars(); renderBrandFilter(); renderCars(); renderAdminList(); el.carModal.close();
  });

  el.adminList.addEventListener('click', (e) => {
    const button = e.target.closest('[data-delete]');
    if (!button || !isAdmin()) return;
    state.cars = state.cars.filter((car) => car.id !== Number(button.dataset.delete));
    saveCars(); renderBrandFilter(); renderCars(); renderAdminList();
  });

  el.carGrid.addEventListener('click', (e) => {
    const button = e.target.closest('[data-details]');
    if (!button) return;
    openDetails(Number(button.dataset.details));
  });

  el.backBtn.addEventListener('click', openHome);
  el.homeLink.addEventListener('click', (e) => { e.preventDefault(); openHome(); });
}

function init() {
  state.cars = getCars();
  saveCars();
  renderBrandFilter();
  initEvents();
  updateAuthUI();
  renderCars();
}

init();
