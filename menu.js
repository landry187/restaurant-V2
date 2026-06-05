




/* =====================================================
   menu.js — Saveurs du Cameroun | Page Menu
   Fonctions : filtrage, recherche, tri, panier, toast
===================================================== */

/* ─────────────── DATA ─────────────── */
const DISHES = [
  {
    id: 1,
    name: "Ndolé",
    desc: "Feuilles amères, arachides, poisson fumé ou viande. Le plat national du Cameroun.",
    price: 3500,
    cat: "principaux",
    badges: ["popular"],
    img: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=300&q=80"
  },
  {
    id: 2,
    name: "Eru & Water Fufu",
    desc: "Feuilles de forêt cuites avec viande, crevettes séchées et fufu de manioc.",
    price: 3000,
    cat: "principaux",
    badges: ["spicy"],
    img: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&q=80"
  },
  {
    id: 3,
    name: "Jollof Camerounais",
    desc: "Riz parfumé cuit dans une sauce tomate épicée avec viande et légumes.",
    price: 2500,
    cat: "principaux",
    badges: ["popular", "spicy"],
    img: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300&q=80"
  },
  {
    id: 4,
    name: "Poulet DG",
    desc: "Poulet sauté aux légumes frais et plantains dorés, façon « Directeur Général ».",
    price: 3500,
    cat: "principaux",
    badges: ["popular"],
    img: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=300&q=80"
  },
  {
    id: 5,
    name: "Koki",
    desc: "Haricots cuits à la vapeur avec viande, bananes plantains et épices de saison.",
    price: 2500,
    cat: "principaux",
    badges: [],
    img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=300&q=80"
  },
  {
    id: 6,
    name: "Poisson Braisé",
    desc: "Poisson grillé au feu de bois, accompagné d'attiéké ou de plantain.",
    price: 4000,
    cat: "principaux",
    badges: ["new", "spicy"],
    img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&q=80"
  },
  {
    id: 7,
    name: "Plantain Frit",
    desc: "Tranches de plantain mûr frites à l'huile, dorées et caramélisées.",
    price: 800,
    cat: "accompagnements",
    badges: ["vegetarian"],
    img: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&q=80"
  },
  {
    id: 8,
    name: "Miondo (Bâtons de manioc)",
    desc: "Bâtons de manioc fermenté emballés dans des feuilles de bananier.",
    price: 500,
    cat: "accompagnements",
    badges: ["vegetarian"],
    img: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=300&q=80"
  },
  {
    id: 9,
    name: "Soupe de Légumes",
    desc: "Bouillon chaud aux légumes frais de saison, légèrement épicé.",
    price: 1200,
    cat: "soupes",
    badges: ["vegetarian", "new"],
    img: "https://images.unsplash.com/photo-1547592180-85f173990554?w=300&q=80"
  },
  {
    id: 10,
    name: "Pepper Soup",
    desc: "Soupe épicée à la viande ou au poisson, aux épices africaines traditionnelles.",
    price: 2000,
    cat: "soupes",
    badges: ["spicy"],
    img: "https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?w=300&q=80"
  },
  {
    id: 11,
    name: "Jus de Gingembre & Citron",
    desc: "Jus frais maison au gingembre, citron vert et sucre de canne.",
    price: 700,
    cat: "boissons",
    badges: ["drink"],
    img: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=300&q=80"
  },
  {
    id: 12,
    name: "Gâteau au Manioc",
    desc: "Douceur traditionnelle à base de manioc râpé, coco et sucre vanillé.",
    price: 1000,
    cat: "desserts",
    badges: ["sweet", "new"],
    img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&q=80"
  }
];

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
  all:            "Tous les plats",
  principaux:     "Plats principaux",
  accompagnements:"Accompagnements",
  soupes:         "Soupes",
  boissons:       "Boissons",
  desserts:       "Desserts"
};


/* ─────────────── STATE ─────────────── */
let currentCat   = "all";
let currentSort  = "default";
let currentQuery = "";
let cart =
JSON.parse(localStorage.getItem("panier"))
|| [];


/* ─────────────── DOM REFS ─────────────── */
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

/* ─────────────── RENDER DISHES ─────────────── */
function getFiltered() {
  let list = [...DISHES];

  // Category filter
  if (currentCat !== "all") {
    list = list.filter(d => d.cat === currentCat);
  }

  // Search filter
  if (currentQuery) {
    const q = currentQuery.toLowerCase();
    list = list.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.desc.toLowerCase().includes(q) ||
      d.cat.toLowerCase().includes(q)
    );
  }

  // Sort
  switch (currentSort) {
    case "price-asc":  list.sort((a, b) => a.price - b.price); break;
    case "price-desc": list.sort((a, b) => b.price - a.price); break;
    case "name":       list.sort((a, b) => a.name.localeCompare(b.name)); break;
  }

  return list;
}

function render() {
  const list = getFiltered();

  // Update title
  dishesTitle.textContent = CAT_NAMES[currentCat] || "Tous les plats";

  // Results count
  if (currentQuery) {
    resultsCount.textContent = list.length
      ? `${list.length} plat${list.length > 1 ? "s" : ""} trouvé${list.length > 1 ? "s" : ""} pour « ${currentQuery} »`
      : "";
  } else {
    resultsCount.textContent = "";
  }

  // Clear grid
  grid.innerHTML = "";

  if (list.length === 0) {
    emptyState.classList.add("show");
    emptyQuery.textContent = currentQuery || currentCat;
    return;
  }

  emptyState.classList.remove("show");

  list.forEach((dish, i) => {
    const inCart    = cart.find(c => c.id === dish.id);
    const qty       = inCart ? inCart.qty : 0;

    const badgeHtml = dish.badges.map(b => {
      const cfg = BADGE_CONFIG[b];
      return cfg ? `<span class="badge ${cfg.cls}">${cfg.label}</span>` : "";
    }).join("");

    const card = document.createElement("div");
    card.className = "dish-card";
    card.dataset.id = dish.id;
    card.style.animationDelay = `${i * 0.05}s`;

    card.innerHTML = `
      <div class="dish-img-wrap">
        <img src="${dish.img}" alt="${dish.name}" loading="lazy"/>
      </div>
      <div class="dish-body">
        <div class="dish-top">
          <div class="dish-name-wrap">
            ${badgeHtml ? `<div class="badges">${badgeHtml}</div>` : ""}
            <div class="dish-name">${dish.name}</div>
            <div class="dish-desc">${dish.desc}</div>
          </div>
          <div class="dish-price">${dish.price.toLocaleString("fr-FR")} FCFA</div>
        </div>
        <div class="dish-bottom">
          <button class="add-btn ${qty > 0 ? "hidden" : ""}" data-id="${dish.id}">
            <i class="fas fa-plus"></i> Ajouter au panier
          </button>
          <div class="qty-stepper ${qty > 0 ? "show" : ""}" data-id="${dish.id}">
            <button class="qty-btn minus-btn" data-id="${dish.id}">−</button>
            <span class="qty-value">${qty}</span>
            <button class="qty-btn plus-btn" data-id="${dish.id}">+</button>
          </div>
          <span></span>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  // Attach events
  grid.querySelectorAll(".add-btn").forEach(btn => {
    btn.addEventListener("click", () => addToCart(+btn.dataset.id));
  });
  grid.querySelectorAll(".plus-btn").forEach(btn => {
    btn.addEventListener("click", () => changeQty(+btn.dataset.id, 1));
  });
  grid.querySelectorAll(".minus-btn").forEach(btn => {
    btn.addEventListener("click", () => changeQty(+btn.dataset.id, -1));
  });
}

/* ─────────────── CART LOGIC ─────────────── */
function addToCart(id) {
  const dish = DISHES.find(d => d.id === id);
  if (!dish) return;

  const existing = cart.find(c => c.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id, name: dish.name, price: dish.price, img: dish.img, qty: 1 });
  }

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

  updateCartUI();
  render();
}

function clearCart() {
  cart = [];
  updateCartUI();
  render();
  showToast("🗑️ Panier vidé");
}

function updateCartUI() {
  localStorage.setItem(
  "panier",
  JSON.stringify(cart)
);
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const totalQty = cart.reduce((s, c) => s + c.qty, 0);

  // Count badge
  cartCount.textContent = totalQty;
  if (totalQty > 0) {
    cartCount.classList.add("visible");
  } else {
    cartCount.classList.remove("visible");
  }

  // Drawer body
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

  // Cart item events
  cartItems.querySelectorAll(".ci-btn").forEach(btn => {
    btn.addEventListener("click", () => changeQty(+btn.dataset.id, +btn.dataset.delta));
  });
  cartItems.querySelectorAll(".ci-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      cart = cart.filter(c => c.id !== +btn.dataset.id);
      updateCartUI();
      render();
      showToast("🗑️ Plat retiré du panier");
    });
  });

  cartTotal.textContent = total.toLocaleString("fr-FR") + " FCFA";
}

/* ─────────────── TOAST ─────────────── */
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
}

/* ─────────────── CART DRAWER TOGGLE ─────────────── */
function openCart()  { cartDrawer.classList.add("open"); cartOverlay.classList.add("show"); }
function closeCart() { cartDrawer.classList.remove("open"); cartOverlay.classList.remove("show"); }

cartToggle.addEventListener("click", openCart);
cartClose .addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);
clearCartBtn.addEventListener("click", clearCart);

/* ─────────────── CATEGORY FILTER ─────────────── */
document.querySelectorAll(".cat-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentCat = btn.dataset.cat;
    currentQuery = "";
    searchInput.value = "";
    searchClear.classList.remove("show");
    render();
  });
});

/* ─────────────── SEARCH ─────────────── */
searchInput.addEventListener("input", () => {
  currentQuery = searchInput.value.trim();
  searchClear.classList.toggle("show", currentQuery.length > 0);
  // Reset to "all" when searching
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

/* ─────────────── SORT ─────────────── */
sortSelect.addEventListener("change", () => {
  currentSort = sortSelect.value;
  render();
});

/* ─────────────── RESET SEARCH (empty state) ─────────────── */
resetBtn.addEventListener("click", () => {
  currentQuery = "";
  currentCat   = "all";
  searchInput.value = "";
  searchClear.classList.remove("show");
  document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
  document.querySelector('[data-cat="all"]').classList.add("active");
  render();
});

/* ─────────────── UPDATE CATEGORY BADGES ─────────────── */
function updateCatBadges() {
  const cats = ["principaux","accompagnements","soupes","boissons","desserts"];
  document.getElementById("badge-all").textContent = DISHES.length;
  cats.forEach(cat => {
    const el = document.getElementById(`badge-${cat}`);
    if (el) el.textContent = DISHES.filter(d => d.cat === cat).length;
  });
}

/* ─────────────── INIT ─────────────── */
updateCatBadges();
render();
updateCartUI();