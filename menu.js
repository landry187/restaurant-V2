/* =====================================================
   menu.js — La Camerounaise by Landry | Page Menu
   Filtrage, recherche, tri, panier, toast.

   Les plats sont définis dans le HTML (menu.html).
   Ce fichier LIT le DOM — il ne contient aucune URL
   d'image ni donnée de plat codée en dur.
===================================================== */

/* ─────────────────────────────────────────
   BADGE CONFIG — labels & classes CSS
───────────────────────────────────────── */
const BADGE_CONFIG = {
  popular:    { label: "⭐ Populaire",   cls: "badge-popular" },
  new:        { label: "✨ Nouveau",     cls: "badge-new" },
  spicy:      { label: "🌶️ Épicé",       cls: "badge-spicy" },
  vegetarian: { label: "🥦 Végétarien", cls: "badge-vegetarian" },
  drink:      { label: "🥤 Boisson",    cls: "badge-drink" },
  sweet:      { label: "🍬 Dessert",    cls: "badge-sweet" },
  special:    { label: "⚡ Spécial",    cls: "badge-special" }
};

const CAT_NAMES = {
  all:             "Tous les plats",
  principaux:      "Plats principaux",
  accompagnements: "Accompagnements",
  soupes:          "Soupes",
  boissons:        "Boissons",
  desserts:        "Desserts"
};

/* ─────────────────────────────────────────
   LIRE LES PLATS DEPUIS LE HTML
   Chaque .dish-card porte :
     data-id, data-cat, data-price, data-badges
   L'image reste dans le HTML — on ne la touche pas.
───────────────────────────────────────── */
const allCards = Array.from(document.querySelectorAll('#dishesGrid .dish-card'));

function parseDish(card) {
  return {
    id:     +card.dataset.id,
    cat:    card.dataset.cat,
    price:  +card.dataset.price,
    badges: card.dataset.badges ? card.dataset.badges.split(',').map(b => b.trim()).filter(Boolean) : [],
    name:   card.querySelector('.dish-name').textContent.trim(),
    desc:   card.querySelector('.dish-desc').textContent.trim(),
    img:    card.querySelector('.dish-img-wrap img').src  // lu depuis le HTML, jamais stocké ici
  };
}

/* ─────────────────────────────────────────
   ÉTAT
───────────────────────────────────────── */
let currentCat   = "all";
let currentSort  = "default";
let currentQuery = "";
let cart = JSON.parse(localStorage.getItem("panier")) || [];

/* ─────────────────────────────────────────
   DOM REFS
───────────────────────────────────────── */
const grid        = document.getElementById("dishesGrid");
const emptyState  = document.getElementById("emptyState");
const emptyQuery  = document.getElementById("emptyQuery");
const dishesTitle = document.getElementById("dishesTitle");
const resultsCount= document.getElementById("resultsCount");
const searchInput = document.getElementById("searchInput");
const searchClear = document.getElementById("searchClear");
const sortSelect  = document.getElementById("sortSelect");
const cartToggle  = document.getElementById("cartToggle");
const cartClose   = document.getElementById("cartClose");
const cartOverlay = document.getElementById("cartOverlay");
const cartDrawer  = document.getElementById("cartDrawer");
const cartCount   = document.getElementById("cartCount");
const cartItems   = document.getElementById("cartItems");
const cartEmpty   = document.getElementById("cartEmpty");
const cartFooter  = document.getElementById("cartFooter");
const cartTotal   = document.getElementById("cartTotal");
const clearCartBtn= document.getElementById("clearCartBtn");
const resetBtn    = document.getElementById("resetBtn");
const toast       = document.getElementById("toast");

/* ─────────────────────────────────────────
   INJECTER LES BADGES dans le HTML des cards
   (une seule fois à l'init, pas à chaque render)
───────────────────────────────────────── */
function initBadges() {
  allCards.forEach(card => {
    const dish = parseDish(card);
    const badgesEl = card.querySelector('.badges');
    if (!badgesEl) return;
    badgesEl.innerHTML = dish.badges.map(b => {
      const cfg = BADGE_CONFIG[b];
      return cfg ? `<span class="badge ${cfg.cls}">${cfg.label}</span>` : "";
    }).join("");
    // Cacher le conteneur s'il est vide
    if (!badgesEl.innerHTML.trim()) badgesEl.style.display = 'none';
  });
}

/* ─────────────────────────────────────────
   FILTRAGE & TRI (sur les cards HTML)
───────────────────────────────────────── */
function getFiltered() {
  let list = allCards.map(parseDish);

  if (currentCat !== "all") {
    list = list.filter(d => d.cat === currentCat);
  }

  if (currentQuery) {
    const q = currentQuery.toLowerCase();
    list = list.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.desc.toLowerCase().includes(q) ||
      d.cat.toLowerCase().includes(q)
    );
  }

  switch (currentSort) {
    case "price-asc":  list.sort((a, b) => a.price - b.price); break;
    case "price-desc": list.sort((a, b) => b.price - a.price); break;
    case "name":       list.sort((a, b) => a.name.localeCompare(b.name)); break;
  }

  return list;
}

/* ─────────────────────────────────────────
   RENDER — déplace les cards existantes du DOM
   dans le bon ordre ; cache/affiche selon filtre.
   Les images ne sont JAMAIS recréées.
───────────────────────────────────────── */
function render() {
  const filtered = getFiltered();
  const filteredIds = new Set(filtered.map(d => d.id));

  // Titre
  dishesTitle.textContent = CAT_NAMES[currentCat] || "Tous les plats";

  // Compteur de résultats
  resultsCount.textContent = currentQuery
    ? (filtered.length
        ? `${filtered.length} plat${filtered.length > 1 ? "s" : ""} trouvé${filtered.length > 1 ? "s" : ""} pour « ${currentQuery} »`
        : "")
    : "";

  // État vide
  if (filtered.length === 0) {
    emptyState.classList.add("show");
    emptyQuery.textContent = currentQuery || currentCat;
  } else {
    emptyState.classList.remove("show");
  }

  // Réordonner & afficher/cacher les cards (sans les recréer)
  filtered.forEach((dish, i) => {
    const card = allCards.find(c => +c.dataset.id === dish.id);
    if (!card) return;

    card.style.display = "";
    card.style.animationDelay = `${i * 0.05}s`;

    // Synchroniser le stepper avec le panier
    const inCart = cart.find(c => c.id === dish.id);
    const qty    = inCart ? inCart.qty : 0;
    const addBtn = card.querySelector(".add-btn");
    const stepper= card.querySelector(".qty-stepper");
    const qtyVal = card.querySelector(".qty-value");

    if (addBtn)  addBtn.classList.toggle("hidden", qty > 0);
    if (stepper) stepper.classList.toggle("show", qty > 0);
    if (qtyVal)  qtyVal.textContent = qty;

    grid.appendChild(card); // déplace en fin (réordonne)
  });

  // Cacher les cards non filtrées
  allCards.forEach(card => {
    if (!filteredIds.has(+card.dataset.id)) {
      card.style.display = "none";
    }
  });
}

/* ─────────────────────────────────────────
   PANIER
───────────────────────────────────────── */
function addToCart(id) {
  const card = allCards.find(c => +c.dataset.id === id);
  if (!card) return;
  const dish = parseDish(card);

  const existing = cart.find(c => c.id === id);
  if (existing) {
    existing.qty++;
  } else {
    // On lit l'image depuis le HTML de la card, pas depuis DISHES[]
    cart.push({ id, name: dish.name, price: dish.price, img: dish.img, qty: 1 });
  }

  saveCart();
  updateCartUI();
  render();
  showToast(`✅ ${dish.name} ajouté au panier`);
}

function changeQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(c => c.id !== id);
    showToast("🗑️ Plat retiré du panier");
  }

  saveCart();
  updateCartUI();
  render();
}

function clearCart() {
  cart = [];
  saveCart();
  updateCartUI();
  render();
  showToast("🗑️ Panier vidé");
}

function saveCart() {
  localStorage.setItem("panier", JSON.stringify(cart));
}

function updateCartUI() {
  const total    = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const totalQty = cart.reduce((s, c) => s + c.qty, 0);

  cartCount.textContent = totalQty;
  cartCount.classList.toggle("visible", totalQty > 0);

  cartItems.innerHTML = "";

  if (cart.length === 0) {
    cartEmpty.style.display = "flex";
    cartFooter.classList.remove("show");
    cartItems.appendChild(cartEmpty);
    return;
  }

  cartEmpty.style.display = "none";
  cartFooter.classList.add("show");

  cart.forEach(item => {
    const el = document.createElement("div");
    el.className = "cart-item";
    el.innerHTML = `
      <img class="cart-item-img" src="${item.img}" alt="${item.name}"/>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${(item.price * item.qty).toLocaleString("fr-FR")} FCFA</div>
      </div>
      <div class="cart-item-controls">
        <div class="ci-qty">
          <button class="ci-btn" data-id="${item.id}" data-delta="-1">−</button>
          <span class="ci-count">${item.qty}</span>
          <button class="ci-btn" data-id="${item.id}" data-delta="1">+</button>
        </div>
        <button class="ci-remove" data-id="${item.id}" title="Supprimer"><i class="fas fa-trash-alt"></i></button>
      </div>
    `;
    cartItems.appendChild(el);
  });

  cartItems.querySelectorAll(".ci-btn").forEach(btn => {
    btn.addEventListener("click", () => changeQty(+btn.dataset.id, +btn.dataset.delta));
  });
  cartItems.querySelectorAll(".ci-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      cart = cart.filter(c => c.id !== +btn.dataset.id);
      saveCart();
      updateCartUI();
      render();
      showToast("🗑️ Plat retiré du panier");
    });
  });

  cartTotal.textContent = total.toLocaleString("fr-FR") + " FCFA";
}

/* ─────────────────────────────────────────
   TOAST
───────────────────────────────────────── */
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
}

/* ─────────────────────────────────────────
   CART DRAWER TOGGLE
───────────────────────────────────────── */
function openCart()  { cartDrawer.classList.add("open");    cartOverlay.classList.add("show"); }
function closeCart() { cartDrawer.classList.remove("open"); cartOverlay.classList.remove("show"); }

cartToggle.addEventListener("click", openCart);
cartClose .addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);
clearCartBtn.addEventListener("click", clearCart);

/* ─────────────────────────────────────────
   DÉLÉGATION D'ÉVÉNEMENTS SUR LA GRILLE
   (fonctionne même après réordonnage)
───────────────────────────────────────── */
grid.addEventListener("click", e => {
  const addBtn  = e.target.closest(".add-btn");
  const plusBtn = e.target.closest(".plus-btn");
  const minusBtn= e.target.closest(".minus-btn");

  if (addBtn)   addToCart(+addBtn.dataset.id);
  if (plusBtn)  changeQty(+plusBtn.dataset.id, 1);
  if (minusBtn) changeQty(+minusBtn.dataset.id, -1);
});

/* ─────────────────────────────────────────
   CATEGORY FILTER
───────────────────────────────────────── */
document.querySelectorAll(".cat-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentCat   = btn.dataset.cat;
    currentQuery = "";
    searchInput.value = "";
    searchClear.classList.remove("show");
    render();
  });
});

/* ─────────────────────────────────────────
   SEARCH
───────────────────────────────────────── */
searchInput.addEventListener("input", () => {
  currentQuery = searchInput.value.trim();
  searchClear.classList.toggle("show", currentQuery.length > 0);
  if (currentQuery) {
    currentCat = "all";
    document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
    document.querySelector('[data-cat="all"]').classList.add("active");
  }
  render();
});

searchClear.addEventListener("click", () => {
  searchInput.value = "";
  currentQuery = "";
  searchClear.classList.remove("show");
  render();
  searchInput.focus();
});

/* ─────────────────────────────────────────
   SORT
───────────────────────────────────────── */
sortSelect.addEventListener("change", () => {
  currentSort = sortSelect.value;
  render();
});

/* ─────────────────────────────────────────
   RESET (empty state)
───────────────────────────────────────── */
resetBtn.addEventListener("click", () => {
  currentQuery = "";
  currentCat   = "all";
  searchInput.value = "";
  searchClear.classList.remove("show");
  document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
  document.querySelector('[data-cat="all"]').classList.add("active");
  render();
});

/* ─────────────────────────────────────────
   BADGES DES CATÉGORIES (sidebar)
───────────────────────────────────────── */
function updateCatBadges() {
  document.getElementById("badge-all").textContent = allCards.length;
  ["principaux","accompagnements","soupes","boissons","desserts"].forEach(cat => {
    const el = document.getElementById(`badge-${cat}`);
    if (el) el.textContent = allCards.filter(c => c.dataset.cat === cat).length;
  });
}

/* ─────────────────────────────────────────
   INIT
───────────────────────────────────────── */
initBadges();       // injecte les badges dans le HTML des cards
updateCatBadges();  // met à jour les compteurs dans la sidebar
render();           // affiche / filtre les cards
updateCartUI();     // synchronise le panier (depuis localStorage)