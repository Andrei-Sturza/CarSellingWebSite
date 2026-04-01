const STORAGE_CARS = 'automarket_cars';
const STORAGE_AUTH = 'automarket_admin';

const defaultCars = [
  { id: 1, marca: 'Dacia', model: 'Duster', pret: 15900, an: 2019, kilometraj: 86000, combustibil: 'Diesel', cutie: 'Manuală', oras: 'București', categorie: 'SUV', imagine: 'https://images.unsplash.com/photo-1619994121345-4f4f4f9f9e0f?auto=format&fit=crop&w=900&q=80' },
  { id: 2, marca: 'Volkswagen', model: 'Passat', pret: 18700, an: 2018, kilometraj: 112000, combustibil: 'Diesel', cutie: 'Automată', oras: 'Cluj-Napoca', categorie: 'Break', imagine: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80' },
  { id: 3, marca: 'Skoda', model: 'Octavia', pret: 13200, an: 2017, kilometraj: 121000, combustibil: 'Benzină', cutie: 'Manuală', oras: 'Iași', categorie: 'Sedan', imagine: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80' },
  { id: 4, marca: 'BMW', model: 'X5', pret: 23500, an: 2018, kilometraj: 98000, combustibil: 'Diesel', cutie: 'Automată', oras: 'Timișoara', categorie: 'SUV', imagine: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=900&q=80' },
  { id: 5, marca: 'Renault', model: 'Clio', pret: 8900, an: 2019, kilometraj: 69000, combustibil: 'Benzină', cutie: 'Manuală', oras: 'Brașov', categorie: 'Mașină mică', imagine: 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=80' }
];

const state = {
  cars: [],
  category: 'Toate',
  search: '',
  brand: '',
  city: '',
  fuel: '',
  minPrice: '',
  maxPrice: ''
};

const el = {
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
  carModal: document.getElementById('carModal')
};

function getCars() {
  const localCars = JSON.parse(localStorage.getItem(STORAGE_CARS));
  return Array.isArray(localCars) && localCars.length ? localCars : defaultCars;
}

function saveCars() {
  localStorage.setItem(STORAGE_CARS, JSON.stringify(state.cars));
}

function isAdmin() {
  return localStorage.getItem(STORAGE_AUTH) === 'true';
}

function fmtPrice(value) {
  return `${new Intl.NumberFormat('ro-RO').format(value)} €`;
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
    const matchesSearch = !state.search || text.includes(state.search.toLowerCase());
    const matchesCategory = state.category === 'Toate' || car.categorie === state.category;
    const matchesBrand = !state.brand || car.marca === state.brand;
    const matchesCity = !state.city || car.oras === state.city;
    const matchesFuel = !state.fuel || car.combustibil === state.fuel;
    const matchesMin = !state.minPrice || car.pret >= Number(state.minPrice);
    const matchesMax = !state.maxPrice || car.pret <= Number(state.maxPrice);
    return matchesSearch && matchesCategory && matchesBrand && matchesCity && matchesFuel && matchesMin && matchesMax;
  });
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
          <button class="btn primary">Vezi detalii</button>
          <button class="favorite" aria-label="Adaugă la favorite">♡</button>
        </div>
      </div>
    `;
    el.carGrid.append(card);
  });
}

function renderAdminList() {
  if (!isAdmin()) {
    el.adminList.innerHTML = '';
    return;
  }

  el.adminList.innerHTML = '';
  state.cars.forEach((car) => {
    const row = document.createElement('div');
    row.className = 'admin-item';
    row.innerHTML = `
      <span>${car.marca} ${car.model} (${car.an}) - ${fmtPrice(car.pret)}</span>
      <button class="btn ghost" data-delete="${car.id}">Șterge</button>
    `;
    el.adminList.append(row);
  });
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
  state.search = '';
  state.brand = '';
  state.city = '';
  state.fuel = '';
  state.minPrice = '';
  state.maxPrice = '';

  el.searchInput.value = '';
  el.brandFilter.value = '';
  el.cityFilter.value = '';
  el.fuelFilter.value = '';
  el.minPrice.value = '';
  el.maxPrice.value = '';
}

function initEvents() {
  document.querySelectorAll('.category-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.category = btn.dataset.category;
      document.querySelectorAll('.category-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderCars();
    });
  });

  el.searchInput.addEventListener('input', (e) => { state.search = e.target.value; renderCars(); });
  el.brandFilter.addEventListener('change', (e) => { state.brand = e.target.value; renderCars(); });
  el.cityFilter.addEventListener('change', (e) => { state.city = e.target.value; renderCars(); });
  el.fuelFilter.addEventListener('change', (e) => { state.fuel = e.target.value; renderCars(); });
  el.minPrice.addEventListener('input', (e) => { state.minPrice = e.target.value; renderCars(); });
  el.maxPrice.addEventListener('input', (e) => { state.maxPrice = e.target.value; renderCars(); });

  el.resetFilters.addEventListener('click', () => {
    resetFilters();
    renderCars();
  });

  el.authBtn.addEventListener('click', () => {
    el.loginModal.showModal();
  });

  document.getElementById('closeLogin').addEventListener('click', () => {
    el.loginModal.close();
  });

  document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (username === 'admin' && password === 'admin123') {
      localStorage.setItem(STORAGE_AUTH, 'true');
      document.getElementById('loginError').classList.add('hidden');
      el.loginModal.close();
      updateAuthUI();
    } else {
      document.getElementById('loginError').classList.remove('hidden');
    }
  });

  el.logoutBtn.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_AUTH);
    updateAuthUI();
  });

  el.adminBtn.addEventListener('click', () => {
    el.adminPanel.scrollIntoView({ behavior: 'smooth' });
  });

  el.openAddForm.addEventListener('click', () => {
    document.getElementById('carForm').reset();
    el.carModal.showModal();
  });

  document.getElementById('cancelCar').addEventListener('click', () => {
    el.carModal.close();
  });

  document.getElementById('carForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!isAdmin()) return;

    const fd = new FormData(e.target);
    const newCar = {
      id: Date.now(),
      marca: fd.get('marca'),
      model: fd.get('model'),
      pret: Number(fd.get('pret')),
      an: Number(fd.get('an')),
      kilometraj: Number(fd.get('kilometraj')),
      combustibil: fd.get('combustibil'),
      cutie: fd.get('cutie'),
      oras: fd.get('oras'),
      categorie: fd.get('categorie'),
      imagine: fd.get('imagine')
    };

    state.cars.unshift(newCar);
    saveCars();
    renderBrandFilter();
    renderCars();
    renderAdminList();
    el.carModal.close();
  });

  el.adminList.addEventListener('click', (e) => {
    const button = e.target.closest('[data-delete]');
    if (!button || !isAdmin()) return;

    const id = Number(button.dataset.delete);
    state.cars = state.cars.filter((car) => car.id !== id);
    saveCars();
    renderBrandFilter();
    renderCars();
    renderAdminList();
  });
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
