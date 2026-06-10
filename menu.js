/* =====================================================
   menu.js — La Camerounaise by Landry | Page Menu
   Filtrage, recherche, tri, panier, toast.

   ✅ Connecté au panier unifié via panier.js + catalogue.js
   Les plats sont définis dans le HTML (menu.html).
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
    img:    card.querySelector('.dish-img-wrap img').src
  };
}

/* ─────────────────────────────────────────
   ÉTAT
───────────────────────────────────────── */
let currentCat   = "all";
let currentSort  = "default";
let currentQuery = "";

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
   INJECTER LES BADGES dans le HTML
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
    if (!badgesEl.innerHTML.trim()) badgesEl.style.display = 'none';
  });
}

/* ─────────────────────────────────────────
   FILTRAGE & TRI
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
   RENDER
───────────────────────────────────────── */
function render() {
  const filtered    = getFiltered();
  const filteredIds = new Set(filtered.map(d => d.id));

  dishesTitle.textContent = CAT_NAMES[currentCat] || "Tous les plats";

  resultsCount.textContent = currentQuery
    ? (filtered.length
        ? `${filtered.length} plat${filtered.length > 1 ? "s" : ""} trouvé${filtered.length > 1 ? "s" : ""} pour « ${currentQuery} »`
        : "")
    : "";

  if (filtered.length === 0) {
    if (emptyState)  emptyState.style.display = "flex";
    if (emptyQuery)  emptyQuery.textContent = currentQuery;
    allCards.forEach(c => { c.style.display = "none"; });
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  // Afficher / cacher les cards
  allCards.forEach(c => {
    c.style.display = filteredIds.has(+c.dataset.id) ? "" : "none";
  });

  // Réordonner selon le tri
  filtered.forEach(d => {
    const card = allCards.find(c => +c.dataset.id === d.id);
    if (card) grid.appendChild(card);
  });

  // Synchroniser les steppers avec le panier
  syncSteppers();
}

/* ─────────────────────────────────────────
   SYNC STEPPERS avec le panier unifié
───────────────────────────────────────── */
function syncSteppers() {
  allCards.forEach(card => {
    const id = +card.dataset.id;
    const panierItems = window.Panier ? window.Panier.items() : [];
    const item = panierItems.find(i => i.id === id);
    const qty  = item ? item.qty : 0;

    const addBtn  = card.querySelector('.add-btn');
    const stepper = card.querySelector('.qty-stepper');
    const valEl   = card.querySelector('.qty-value');

    if (addBtn && stepper) {
      if (qty > 0) {
        addBtn.style.display  = 'none';
        stepper.style.display = 'flex';
        if (valEl) valEl.textContent = qty;
      } else {
        addBtn.style.display  = '';
        stepper.style.display = 'none';
      }
    }
  });
}

/* ─────────────────────────────────────────
   PANIER — utilise window.Panier (panier.js)
───────────────────────────────────────── */
function addToCart(id) {
  if (window.Panier) {
    const card = allCards.find(c => +c.dataset.id === id);
    if (!card) return;
    const dish = parseDish(card);
    window.Panier.ajouter(id);
    updateCartUI();
    render();
    showToast(`✅ ${dish.name} ajouté au panier`);
  }
}

function changeQty(id, delta) {
  if (!window.Panier) return;
  const panierItems = window.Panier.items();
  const item = panierItems.find(i => i.id === id);
  if (!item && delta > 0) { addToCart(id); return; }
  if (item) {
    const newQty = item.qty + delta;
    if (newQty <= 0) {
      window.Panier.setQty(id, 0);
      showToast("🗑️ Plat retiré du panier");
    } else {
      window.Panier.setQty(id, newQty);
    }
    updateCartUI();
    render();
  }
}

function clearCart() {
  if (window.Panier) window.Panier.vider();
  updateCartUI();
  render();
  showToast("🗑️ Panier vidé");
}

function updateCartUI() {
  if (!window.Panier) return;

  const panierItems = window.Panier.items();
  const total    = window.Panier.total();
  const totalQty = window.Panier.count();

  cartCount.textContent = totalQty;
  cartCount.classList.toggle("visible", totalQty > 0);

  cartItems.innerHTML = "";

  if (panierItems.length === 0) {
    cartEmpty.style.display = "flex";
    cartFooter.classList.remove("show");
    cartItems.appendChild(cartEmpty);
    return;
  }

  cartEmpty.style.display = "none";
  cartFooter.classList.add("show");

  panierItems.forEach(({ plat, qty, id }) => {
    const el = document.createElement("div");
    el.className = "cart-item";
    el.innerHTML = `
      <img class="cart-item-img" src="${plat.img}" alt="${plat.nom}"/>
      <div class="cart-item-info">
        <div class="cart-item-name">${plat.nom}</div>
        <div class="cart-item-price">${(plat.prix * qty).toLocaleString("fr-FR")} FCFA</div>
      </div>
      <div class="cart-item-controls">
        <div class="ci-qty">
          <button class="ci-btn" data-id="${id}" data-delta="-1">−</button>
          <span class="ci-count">${qty}</span>
          <button class="ci-btn" data-id="${id}" data-delta="1">+</button>
        </div>
        <button class="ci-remove" data-id="${id}" title="Supprimer"><i class="fas fa-trash-alt"></i></button>
      </div>
    `;
    cartItems.appendChild(el);
  });

  cartItems.querySelectorAll(".ci-btn").forEach(btn => {
    btn.addEventListener("click", () => changeQty(+btn.dataset.id, +btn.dataset.delta));
  });
  cartItems.querySelectorAll(".ci-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      window.Panier.setQty(+btn.dataset.id, 0);
      updateCartUI();
      render();
      showToast("🗑️ Plat retiré du panier");
    });
  });

  cartTotal.textContent = total.toLocaleString("fr-FR") + " FCFA";

  /* Bouton "Voir ma commande complète" */
  let goBtn = document.getElementById('cart-goto-commande');
  if (!goBtn) {
    goBtn = document.createElement('a');
    goBtn.id = 'cart-goto-commande';
    goBtn.href = 'commande.html';
    goBtn.style.cssText = `
      display:block;text-align:center;margin-top:12px;
      background:green;color:white;padding:12px 20px;
      border-radius:12px;font-weight:700;font-size:0.9rem;
      text-decoration:none;
    `;
    goBtn.innerHTML = '🛵 Passer la commande';
    cartFooter.appendChild(goBtn);
  }

  /* Bouton "Réserver une table avec ces plats" */
  let resBtn = document.getElementById('cart-goto-reservation');
  if (!resBtn) {
    resBtn = document.createElement('a');
    resBtn.id = 'cart-goto-reservation';
    resBtn.href = 'reservation.html';
    resBtn.style.cssText = `
      display:block;text-align:center;margin-top:8px;
      background:white;color:green;padding:11px 20px;
      border-radius:12px;font-weight:700;font-size:0.9rem;
      text-decoration:none;border:2px solid green;
    `;
    resBtn.innerHTML = '🍽️ Réserver une table avec ces plats';
    cartFooter.appendChild(resBtn);
  }
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
   Burger menu
───────────────────────────────────────── */
const burgerEl   = document.getElementById('burgerMenu');
const mobileMenu = document.getElementById('mobileMenu');
if (burgerEl && mobileMenu) {
  burgerEl.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    const spans = burgerEl.querySelectorAll('span');
    if (open) {
      spans[0].style.transform = 'rotate(45deg) translate(5px,5px)';
      spans[1].style.opacity   = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px,-5px)';
    } else {
      spans.forEach(s => { s.style.transform=''; s.style.opacity=''; });
    }
  });
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      burgerEl.querySelectorAll('span').forEach(s => { s.style.transform=''; s.style.opacity=''; });
    });
  });
}

/* ─────────────────────────────────────────
   Mettre à jour le panier si changement externe
───────────────────────────────────────── */
if (window.Panier) {
  window.Panier.onUpdate(() => {
    updateCartUI();
    syncSteppers();
  });
}

/* ─────────────────────────────────────────
   INIT
───────────────────────────────────────── */
initBadges();
updateCatBadges();
render();
updateCartUI();