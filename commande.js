/* ============================================================
   commande.js — La Camerounaise by Landry
   Gestion complète de la page de commande
   ============================================================ */

'use strict';

/* ============================================================
   1. DONNÉES DU CATALOGUE
   ============================================================ */
const CATALOG = {
  'Ndolé':         { price: 5000,  img: 'images/ndolesoins.jpg',          sub: 'Cuisine traditionnelle premium',   icon: null },
  'Mbongo-Tchobi': { price: 7000,  img: 'images/Mbongo-Tchobi.jpg',       sub: 'Saveur camerounaise unique',       icon: null },
  'Taro':          { price: 4000,  img: 'images/Taro-Sauce-Rouge-1024x683.webp', sub: 'Recette africaine authentique', icon: null },
  'Jus naturel':   { price: 1500,  img: null, sub: 'Suggestion', icon: 'fa-glass-water' },
  'Dessert maison':{ price: 2000,  img: null, sub: 'Suggestion', icon: 'fa-cake-candles' },
  'Sauce pimentée':{ price: 500,   img: null, sub: 'Suggestion', icon: 'fa-pepper-hot' },
  'Café / Thé':    { price: 800,   img: null, sub: 'Suggestion', icon: 'fa-mug-hot' },
};

const PROMO_CODES = {
  'LANDRY10': 0.10,
  'JB':  0.05,
  'OFFICIEL': 0.15,
};

const DELIVERY_FEE = 1000;

/* ============================================================
   2. ÉTAT GLOBAL
   ============================================================ */
let state = {
  orderMode: 'delivery',   // 'delivery' | 'place'
  cart: [],                 // [{ name, price, img, icon, sub, qty }]
  promoApplied: null,       // null | { code, rate }
  notification: null,       // timer id
};

/* ============================================================
   3. UTILITAIRES
   ============================================================ */
function formatPrice(n) {
  return n.toLocaleString('fr-FR') + ' FCFA';
}

function generateId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

/* ============================================================
   4. PERSISTANCE (localStorage)
   ============================================================ */
function saveCart() {
  try { localStorage.setItem('lcbl_cart', JSON.stringify(state.cart)); } catch(e) {}
}

function loadCart() {
  try {
    const raw = localStorage.getItem('lcbl_cart');
    if (raw) state.cart = JSON.parse(raw);
  } catch(e) { state.cart = []; }
}

/* ============================================================
   5. BADGE PANIER (flottant + navbar)
   ============================================================ */
function createCartBadge() {
  // Badge flottant (FAB)
  if (document.getElementById('cartFab')) return;

  const fab = document.createElement('div');
  fab.id = 'cartFab';
  fab.innerHTML = `
    <button id="cartFabBtn" aria-label="Voir le panier" title="">
      <i class="fas fa-shopping-basket"></i>
      <span id="cartBadgeCount" class="cart-badge-count">0</span>
    </button>
    <div id="cartFabTooltip" class="cart-fab-tooltip"></div>
  `;
  document.body.appendChild(fab);

  fab.querySelector('#cartFabBtn').addEventListener('click', () => {
    const cartSection = document.getElementById('cart');
    if (cartSection) {
      cartSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      cartSection.classList.add('cart-section--highlight');
      setTimeout(() => cartSection.classList.remove('cart-section--highlight'), 1200);
    }
  });
}

function updateBadge() {
  const total = state.cart.reduce((s, i) => s + i.qty, 0);
  const badge = document.getElementById('cartBadgeCount');
  if (!badge) return;
  badge.textContent = total;
  badge.style.display = total > 0 ? 'flex' : 'none';

  const fab = document.getElementById('cartFab');
  if (fab) {
    fab.classList.toggle('cart-fab--visible', total > 0 || state.cart.length === 0);
    fab.style.display = 'block'; // always visible after first item
  }
}

/* ============================================================
   6. NOTIFICATIONS TOAST
   ============================================================ */
function createToastContainer() {
  if (document.getElementById('toastContainer')) return;
  const el = document.createElement('div');
  el.id = 'toastContainer';
  document.body.appendChild(el);
}

function toast(msg, type = 'success', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const t = document.createElement('div');
  t.className = `toast toast--${type}`;
  const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle', warn: 'fa-exclamation-triangle' };
  t.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${msg}</span>`;
  container.appendChild(t);

  requestAnimationFrame(() => t.classList.add('toast--show'));
  setTimeout(() => {
    t.classList.remove('toast--show');
    setTimeout(() => t.remove(), 400);
  }, duration);
}

/* ============================================================
   7. RENDU DU PANIER
   ============================================================ */
function renderCart() {
  const itemsContainer = document.querySelector('.cart-items');
  if (!itemsContainer) return;

  // Vider le contenu actuel (sauf la note en bas)
  itemsContainer.innerHTML = '';

  if (state.cart.length === 0) {
    itemsContainer.innerHTML = `
      <div class="cart-empty-state">
        <i class="fas fa-shopping-basket"></i>
        <p>Votre panier est vide</p>
        <a href="#" class="btn btn-primary" onclick="document.querySelector('.menu-section').scrollIntoView({behavior:'smooth'});return false;">
          Parcourir le menu
        </a>
      </div>
    `;
  } else {
    state.cart.forEach((item) => {
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.dataset.itemId = item.id;

      const thumb = item.img
        ? `<img src="${item.img}" alt="${item.name}" class="cart-thumb" loading="lazy">`
        : `<div class="cart-thumb-icon"><i class="fas ${item.icon}"></i></div>`;

      div.innerHTML = `
        <div class="cart-item-info">
          ${thumb}
          <div>
            <h4>${item.name}</h4>
            <p class="cart-item-sub">${item.sub}</p>
          </div>
        </div>
        <div class="cart-item-qty">
          <button class="qty-btn" data-action="dec" data-id="${item.id}">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" data-action="inc" data-id="${item.id}">+</button>
        </div>
        <strong class="cart-item-price">${formatPrice(item.price * item.qty)}</strong>
        <button class="cart-remove" data-id="${item.id}" title="Retirer"><i class="fas fa-trash-alt"></i></button>
      `;
      itemsContainer.appendChild(div);
    });

    // Note info
    const note = document.createElement('p');
    note.className = 'cart-empty-note';
    note.innerHTML = `<i class="fas fa-info-circle"></i> Pour ajouter d'autres plats, rendez-vous sur la page <a href="menu.html">Menu complet</a>.`;
    itemsContainer.appendChild(note);
  }

  // Bouton "Vider le panier"
  renderClearCartButton(itemsContainer);

  // Attacher les événements
  attachCartItemEvents(itemsContainer);

  // Mettre à jour le résumé
  updateSummary();
  updateBadge();
  saveCart();
}

function renderClearCartButton(container) {
  // Retirer l'ancien bouton s'il existe
  const existing = document.getElementById('clearCartBtn');
  if (existing) existing.remove();

  if (state.cart.length === 0) return;

  const btn = document.createElement('button');
  btn.id = 'clearCartBtn';
  btn.className = 'clear-cart-btn';
  btn.innerHTML = `<i class="fas fa-trash"></i> Vider le panier`;
  btn.addEventListener('click', confirmClearCart);

  // Insérer après .cart-items dans le DOM parent
  const cartItemsEl = document.querySelector('.cart-items');
  if (cartItemsEl && cartItemsEl.parentNode) {
    cartItemsEl.parentNode.insertBefore(btn, cartItemsEl.nextSibling);
  }
}

function attachCartItemEvents(container) {
  container.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const item = state.cart.find(i => i.id === id);
      if (!item) return;
      if (action === 'inc') {
        item.qty++;
        toast(`${item.name} : ${item.qty}×`, 'info', 1500);
      } else {
        item.qty--;
        if (item.qty <= 0) {
          state.cart = state.cart.filter(i => i.id !== id);
          toast(`${item.name} retiré du panier`, 'warn');
        }
      }
      renderCart();
    });
  });

  container.querySelectorAll('.cart-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const item = state.cart.find(i => i.id === id);
      if (!item) return;
      state.cart = state.cart.filter(i => i.id !== id);
      toast(`${item.name} retiré du panier`, 'warn');
      renderCart();
    });
  });
}

/* ============================================================
   8. RÉSUMÉ COMMANDE
   ============================================================ */
function updateSummary() {
  const subtotal = state.cart.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = (state.orderMode === 'delivery' && state.cart.length > 0) ? DELIVERY_FEE : 0;
  const discountRate = state.promoApplied ? state.promoApplied.rate : 0;
  const discount = Math.round(subtotal * discountRate);
  const total = subtotal + delivery - discount;

  const lines = document.querySelectorAll('.summary-line');
  lines.forEach(line => {
    const label = line.querySelector('span')?.textContent?.trim();
    const valueEl = line.querySelector('strong');
    if (!valueEl) return;

    if (label === 'Sous-total') valueEl.textContent = formatPrice(subtotal);
    if (label === 'Livraison') {
      if (state.orderMode === 'place') {
        valueEl.textContent = 'Gratuit';
        valueEl.style.color = '#2E7D32';
      } else {
        valueEl.textContent = state.cart.length > 0 ? formatPrice(DELIVERY_FEE) : formatPrice(0);
        valueEl.style.color = '';
      }
    }
    if (label === 'Réduction') {
      valueEl.textContent = discount > 0 ? `− ${formatPrice(discount)}` : '− 0 FCFA';
    }
    if (line.classList.contains('total')) {
      valueEl.textContent = formatPrice(total);
    }
  });

  // Mettre à jour le bouton confirmer
  const btn = document.querySelector('.confirm-btn');
  if (btn && state.cart.length > 0) {
    btn.innerHTML = `<i class="fas fa-check-circle"></i> Confirmer — ${formatPrice(total)}`;
  } else if (btn) {
    btn.innerHTML = `<i class="fas fa-check-circle"></i> Confirmer la commande`;
  }
}

/* ============================================================
   9. AJOUTER AU PANIER
   ============================================================ */
function addToCart(name) {
  const data = CATALOG[name];
  if (!data) return;

  const existing = state.cart.find(i => i.name === name);
  if (existing) {
    existing.qty++;
    toast(`${name} : quantité augmentée (${existing.qty}×)`, 'success');
  } else {
    state.cart.push({
      id: generateId(),
      name,
      price: data.price,
      img: data.img,
      icon: data.icon,
      sub: data.sub,
      qty: 1,
    });
    toast(`${name} ajouté au panier !`, 'success');
  }
  renderCart();
  animateCartFab();
}

function animateCartFab() {
  const fab = document.getElementById('cartFabBtn');
  if (!fab) return;
  fab.classList.add('cart-fab--bounce');
  setTimeout(() => fab.classList.remove('cart-fab--bounce'), 600);
}

/* ============================================================
   10. VIDER LE PANIER
   ============================================================ */
function confirmClearCart() {
  // Modal de confirmation
  const modal = document.createElement('div');
  modal.id = 'clearModal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-icon"><i class="fas fa-trash-alt"></i></div>
      <h3>Vider le panier ?</h3>
      <p>Tous les articles seront supprimés. Cette action est irréversible.</p>
      <div class="modal-actions">
        <button id="modalCancel" class="modal-btn modal-btn--cancel">Annuler</button>
        <button id="modalConfirm" class="modal-btn modal-btn--danger">Oui, vider</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('modal-overlay--show'));

  modal.querySelector('#modalCancel').addEventListener('click', closeModal);
  modal.querySelector('#modalConfirm').addEventListener('click', () => {
    closeModal();
    state.cart = [];
    state.promoApplied = null;
    renderCart();
    toast('Panier vidé', 'warn');
  });
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  function closeModal() {
    modal.classList.remove('modal-overlay--show');
    setTimeout(() => modal.remove(), 300);
  }
}

/* ============================================================
   11. MODE DE COMMANDE (livraison / sur place)
   ============================================================ */
function initOrderMode() {
  const deliveryCard = document.getElementById('deliveryCard');
  const placeCard    = document.getElementById('placeCard');
  const locationSection = document.getElementById('locationSection');

  if (!deliveryCard || !placeCard || !locationSection) return;

  function setMode(mode) {
    state.orderMode = mode;
    deliveryCard.classList.toggle('active', mode === 'delivery');
    placeCard.classList.toggle('active',    mode === 'place');

    if (mode === 'delivery') {
      locationSection.classList.remove('location-section--hidden');
      locationSection.style.maxHeight = locationSection.scrollHeight + 'px';
      locationSection.style.opacity = '1';
    } else {
      locationSection.style.maxHeight = '0';
      locationSection.style.opacity = '0';
      setTimeout(() => {
        if (state.orderMode === 'place') locationSection.classList.add('location-section--hidden');
      }, 400);
    }

    updateSummary();

    // Indicateur visuel dans le résumé
    const modeLabel = document.getElementById('summaryModeLabel');
    if (modeLabel) {
      modeLabel.textContent = mode === 'delivery' ? '🛵 Livraison' : '🍽️ Sur place';
    }
  }

  deliveryCard.addEventListener('click', () => setMode('delivery'));
  placeCard.addEventListener('click',    () => setMode('place'));

  // Initialiser en mode livraison
  setMode('delivery');
}

/* ============================================================
   12. CODE PROMO
   ============================================================ */
function initPromo() {
  const promoBox = document.querySelector('.promo-box');
  if (!promoBox) return;

  const input = promoBox.querySelector('input');
  const btn   = promoBox.querySelector('button');
  if (!input || !btn) return;

  btn.addEventListener('click', applyPromo);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') applyPromo(); });

  function applyPromo() {
    const code = input.value.trim().toUpperCase();
    if (!code) { toast('Entrez un code promo', 'warn'); return; }

    if (state.promoApplied) {
      toast('Un code promo est déjà appliqué', 'warn');
      return;
    }

    const rate = PROMO_CODES[code];
    if (rate) {
      state.promoApplied = { code, rate };
      toast(`Code "${code}" appliqué — ${Math.round(rate * 100)}% de réduction !`, 'success', 4000);
      input.value = '';
      input.disabled = true;
      btn.textContent = '✓ Appliqué';
      btn.disabled = true;
      btn.style.background = '#388E3C';
      updateSummary();
    } else {
      toast('Code promo invalide', 'error');
      input.classList.add('promo-input--invalid');
      setTimeout(() => input.classList.remove('promo-input--invalid'), 1000);
    }
  }
}

/* ============================================================
   13. PLANIFICATION (date & heure)
   ============================================================ */
function initPlanning() {
  const planningBox = document.querySelector('.planning-box');
  if (!planningBox) return;

  const inputs = planningBox.querySelectorAll('input');
  const dateInput = inputs[0];
  const timeInput = inputs[1];

  // Définir la date minimale = aujourd'hui
  const today = new Date();
  const yyyy  = today.getFullYear();
  const mm    = String(today.getMonth() + 1).padStart(2, '0');
  const dd    = String(today.getDate()).padStart(2, '0');
  if (dateInput) dateInput.min = `${yyyy}-${mm}-${dd}`;

  // Ajouter un badge "ASAP" en option rapide
  if (dateInput && timeInput) {
    const asapBtn = document.createElement('button');
    asapBtn.type = 'button';
    asapBtn.className = 'asap-btn';
    asapBtn.innerHTML = `<i class="fas fa-bolt"></i> Dès que possible`;
    planningBox.insertBefore(asapBtn, dateInput);

    asapBtn.addEventListener('click', () => {
      dateInput.value = `${yyyy}-${mm}-${dd}`;
      const h = String(today.getHours()).padStart(2, '0');
      const min = String(today.getMinutes()).padStart(2, '0');
      timeInput.value = `${h}:${min}`;
      asapBtn.classList.add('asap-btn--active');
      toast('Commande planifiée dès que possible', 'info', 2000);
    });

    dateInput.addEventListener('change', () => asapBtn.classList.remove('asap-btn--active'));
    timeInput.addEventListener('change', () => asapBtn.classList.remove('asap-btn--active'));
  }
}

/* ============================================================
   14. PAIEMENT
   ============================================================ */
function initPayment() {
  document.querySelectorAll('.payment-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.payment-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const method = card.querySelector('input[type="radio"]');
      if (method) method.checked = true;
    });
  });
}

/* ============================================================
   15. CONFIRMATION DE COMMANDE
   ============================================================ */
function initConfirmBtn() {
  const btn = document.querySelector('.confirm-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    if (state.cart.length === 0) {
      toast('Votre panier est vide !', 'warn');
      return;
    }

    // Validation adresse si livraison
    if (state.orderMode === 'delivery') {
      const addrInput = document.querySelector('.location-section input[type="text"]');
      if (addrInput && !addrInput.value.trim()) {
        toast('Veuillez entrer votre adresse de livraison', 'error');
        addrInput.focus();
        addrInput.classList.add('input--error');
        setTimeout(() => addrInput.classList.remove('input--error'), 1500);
        return;
      }
    }

    // Validation date
    const dateInput = document.querySelector('.planning-box input[type="date"]');
    const timeInput = document.querySelector('.planning-box input[type="time"]');
    if (dateInput && !dateInput.value) {
      toast('Veuillez choisir une date', 'warn');
      dateInput.focus();
      return;
    }

    showOrderConfirmation();
  });
}

function showOrderConfirmation() {
  const subtotal = state.cart.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = state.orderMode === 'delivery' ? DELIVERY_FEE : 0;
  const discount = state.promoApplied ? Math.round(subtotal * state.promoApplied.rate) : 0;
  const total    = subtotal + delivery - discount;

  const itemsList = state.cart.map(i => `<li>${i.qty}× ${i.name} — <strong>${formatPrice(i.price * i.qty)}</strong></li>`).join('');

  const modal = document.createElement('div');
  modal.id = 'confirmModal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box modal-box--success">
      <div class="modal-success-icon"><i class="fas fa-check-circle"></i></div>
      <h3>Confirmer la commande</h3>
      <div class="modal-order-summary">
        <ul class="modal-items-list">${itemsList}</ul>
        <div class="modal-total">
          <span>Mode :</span>
          <strong>${state.orderMode === 'delivery' ? '🛵 Livraison' : '🍽️ Sur place'}</strong>
        </div>
        ${discount > 0 ? `<div class="modal-total"><span>Réduction :</span><strong style="color:#e53935">− ${formatPrice(discount)}</strong></div>` : ''}
        <div class="modal-total modal-total--big">
          <span>Total à payer :</span>
          <strong>${formatPrice(total)}</strong>
        </div>
      </div>
      <div class="modal-actions">
        <button id="confirmCancel" class="modal-btn modal-btn--cancel">Modifier</button>
        <button id="confirmPlace" class="modal-btn modal-btn--success">
          <i class="fas fa-paper-plane"></i> Passer la commande
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('modal-overlay--show'));

  modal.querySelector('#confirmCancel').addEventListener('click', closeConfirmModal);
  modal.querySelector('#confirmPlace').addEventListener('click', () => {
    closeConfirmModal();
    placeOrder(total);
  });
  modal.addEventListener('click', e => { if (e.target === modal) closeConfirmModal(); });

  function closeConfirmModal() {
    modal.classList.remove('modal-overlay--show');
    setTimeout(() => modal.remove(), 300);
  }
}

function placeOrder(total) {
  // Simuler l'envoi de la commande
  const btn = document.querySelector('.confirm-btn');
  if (btn) {
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Traitement en cours…`;
    btn.disabled = true;
  }

  setTimeout(() => {
    showOrderSuccess(total);
    state.cart = [];
    state.promoApplied = null;
    renderCart();
    if (btn) {
      btn.innerHTML = `<i class="fas fa-check-circle"></i> Confirmer la commande`;
      btn.disabled = false;
    }
  }, 1800);
}

function showOrderSuccess(total) {
  const orderId = 'LCB-' + Date.now().toString().slice(-6);
  const modal = document.createElement('div');
  modal.className = 'modal-overlay modal-overlay--show';
  modal.innerHTML = `
    <div class="modal-box modal-box--celebrate">
      <div class="modal-confetti">🎉</div>
      <div class="modal-success-icon modal-success-icon--green"><i class="fas fa-check-circle"></i></div>
      <h3>Commande envoyée !</h3>
      <p class="modal-order-id">N° <strong>${orderId}</strong></p>
      <p>Votre commande a été reçue. Vous serez contacté sous peu pour confirmation.</p>
      <p class="modal-total-confirm">Montant : <strong>${formatPrice(total)}</strong></p>
      <button class="modal-btn modal-btn--success" id="successClose">
        <i class="fas fa-home"></i> Parfait, merci !
      </button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('#successClose').addEventListener('click', () => {
    modal.classList.remove('modal-overlay--show');
    setTimeout(() => modal.remove(), 300);
  });
}

/* ============================================================
   16. BOUTONS "AJOUTER" (menu & suggestions)
   ============================================================ */
function initAddButtons() {
  // Menu cards
  document.querySelectorAll('.menu-card').forEach(card => {
    const nameEl = card.querySelector('h3');
    const btn    = card.querySelector('.add-btn');
    if (!nameEl || !btn) return;

    btn.addEventListener('click', e => {
      e.preventDefault();
      addToCart(nameEl.textContent.trim());
    });
  });

  // Suggestions
  document.querySelectorAll('.suggestion-card').forEach(card => {
    const nameEl = card.querySelector('h3');
    const btn    = card.querySelector('.add-btn-sm');
    if (!nameEl || !btn) return;

    btn.addEventListener('click', e => {
      e.preventDefault();
      addToCart(nameEl.textContent.trim());
    });
  });
}

/* ============================================================
   17. RECOMMANDER (historique)
   ============================================================ */
function initReorder() {
  const REORDER_MAP = {
    'Ndolé + Jus': ['Ndolé', 'Jus naturel'],
    'Mbongo-Tchobi × 2': ['Mbongo-Tchobi'],
    'Taro + Dessert': ['Taro', 'Dessert maison'],
  };

  document.querySelectorAll('.btn-reorder:not(.btn-reorder--track)').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const card = btn.closest('.history-card');
      if (!card) return;
      const title = card.querySelector('h3')?.textContent?.trim();
      const items = REORDER_MAP[title];
      if (items) {
        items.forEach(name => addToCart(name));
        toast(`Commande "${title}" rechargée dans le panier`, 'success', 3500);
        document.getElementById('cart').scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Bouton "Suivre"
  document.querySelectorAll('.btn-reorder--track').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      toast('Suivi en cours : votre commande est en préparation 🍳', 'info', 4000);
    });
  });
}

/* ============================================================
   18. NAVBAR — scroll effect + burger
   ============================================================ */
function initNavbar() {
  // Scroll effect
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('navbar--scrolled', window.scrollY > 50);
    }, { passive: true });
  }
 
  const burger     = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (!burger || !mobileMenu) return;
 
  /* --- Helpers --- */
  function openMenu() {
    mobileMenu.classList.add('open');
    const spans = burger.querySelectorAll('span');
    spans[0].style.transform = 'rotate(45deg) translate(5px,5px)';
    spans[1].style.opacity   = '0';
    spans[2].style.transform = 'rotate(-45deg) translate(5px,-5px)';
    burger.setAttribute('aria-expanded', 'true');
  }
 
  function closeMenu() {
    mobileMenu.classList.remove('open');
    burger.querySelectorAll('span').forEach(s => {
      s.style.transform = '';
      s.style.opacity   = '';
    });
    burger.setAttribute('aria-expanded', 'false');
  }
 
  function toggleMenu() {
    mobileMenu.classList.contains('open') ? closeMenu() : openMenu();
  }
 
  /* --- Remplacer tous les anciens listeners en clonant le nœud --- */
  const newBurger = burger.cloneNode(true);
  burger.parentNode.replaceChild(newBurger, burger);
  newBurger.addEventListener('click', toggleMenu);
 
  /* --- Fermeture au clic sur un lien du menu mobile --- */
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });
 
  /* --- Fermeture au clic en dehors du menu --- */
  document.addEventListener('click', e => {
    if (
      mobileMenu.classList.contains('open') &&
      !mobileMenu.contains(e.target) &&
      !newBurger.contains(e.target)
    ) {
      closeMenu();
    }
  });
 
  /* --- Fermeture avec la touche Echap --- */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) closeMenu();
  });
}
 
/* ============================================================
   19. INJECT CSS DYNAMIQUE
   ============================================================ */
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
 
    /* ---------- Toast ---------- */
    #toastContainer {
      position: fixed;
      bottom: 90px;
      right: 24px;
      display: flex;
      flex-direction: column-reverse;
      gap: 10px;
      z-index: 9999;
      pointer-events: none;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #1a1a1a;
      color: #fff;
      padding: 13px 20px;
      border-radius: 14px;
      font-size: 0.88rem;
      font-weight: 600;
      box-shadow: 0 8px 30px rgba(0,0,0,0.22);
      max-width: 320px;
      transform: translateX(110%);
      opacity: 0;
      transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s;
    }
    .toast--show { transform: translateX(0); opacity: 1; }
    .toast--success i { color: #66BB6A; }
    .toast--error   i { color: #EF5350; }
    .toast--warn    i { color: #FFA726; }
    .toast--info    i { color: #42A5F5; }
 
    /* ---------- FAB Panier ---------- */
    #cartFab {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 9000;
    }
    #cartFabBtn {
      width: 62px;
      height: 62px;
      border-radius: 50%;
      background: var(--green, #2E7D32);
      color: #fff;
      border: none;
      cursor: pointer;
      font-size: 1.35rem;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 28px rgba(46,125,50,0.45);
      position: relative;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    #cartFabBtn:hover {
      transform: translateY(-3px) scale(1.08);
      box-shadow: 0 14px 36px rgba(46,125,50,0.50);
    }
    .cart-badge-count {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 22px;
      height: 22px;
      background: #e53935;
      color: #fff;
      border-radius: 11px;
      font-size: 0.72rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 5px;
      border: 2px solid #fff;
      animation: badgePop 0.3s ease;
    }
    @keyframes badgePop {
      0%   { transform: scale(0.5); }
      70%  { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
    .cart-fab--bounce { animation: fabBounce 0.5s ease; }
    @keyframes fabBounce {
      0%,100% { transform: scale(1); }
      40%     { transform: scale(1.22); }
      70%     { transform: scale(0.92); }
    }
 
    /* ---------- Section location (animation) ---------- */
    #locationSection {
      overflow: hidden;
      transition: max-height 0.4s ease, opacity 0.4s ease;
    }
    .location-section--hidden { visibility: hidden; padding: 0 7% !important; }
 
    /* ---------- Surbrillance panier ---------- */
    .cart-section--highlight {
      animation: highlightSection 1.2s ease;
    }
    @keyframes highlightSection {
      0%,100% { box-shadow: none; }
      30%     { box-shadow: inset 0 0 0 3px var(--green, #2E7D32); border-radius: 20px; }
    }
 
    /* ---------- État vide du panier ---------- */
    .cart-empty-state {
      text-align: center;
      padding: 50px 20px;
      color: #aaa;
    }
    .cart-empty-state i { font-size: 3.5rem; color: #d0d0d0; margin-bottom: 16px; display: block; }
    .cart-empty-state p { font-size: 1rem; margin-bottom: 20px; color: #999; }
 
    /* ---------- Bouton vider le panier ---------- */
    .clear-cart-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 18px auto 0;
      background: none;
      border: 1.5px solid #e53935;
      color: #e53935;
      border-radius: 12px;
      padding: 9px 20px;
      font-weight: 700;
      font-size: 0.86rem;
      font-family: var(--font-body, sans-serif);
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
    }
    .clear-cart-btn:hover { background: #e53935; color: #fff; }
 
    /* ---------- Modals ---------- */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.3s;
      padding: 20px;
    }
    .modal-overlay--show { opacity: 1; }
    .modal-box {
      background: #fff;
      border-radius: 24px;
      padding: 40px 36px;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 24px 60px rgba(0,0,0,0.22);
      text-align: center;
      transform: scale(0.93);
      transition: transform 0.3s cubic-bezier(0.34,1.4,0.64,1);
    }
    .modal-overlay--show .modal-box { transform: scale(1); }
    .modal-icon { font-size: 2.8rem; color: #e53935; margin-bottom: 16px; }
    .modal-box h3 { font-size: 1.3rem; font-weight: 800; margin-bottom: 10px; }
    .modal-box p  { font-size: 0.9rem; color: #666; margin-bottom: 6px; line-height: 1.6; }
    .modal-actions {
      display: flex;
      gap: 12px;
      margin-top: 28px;
      justify-content: center;
    }
    .modal-btn {
      flex: 1;
      padding: 13px 18px;
      border-radius: 14px;
      border: none;
      font-weight: 700;
      font-size: 0.9rem;
      font-family: var(--font-body, sans-serif);
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
    }
    .modal-btn--cancel  { background: #f5f5f5; color: #444; }
    .modal-btn--cancel:hover  { background: #e0e0e0; }
    .modal-btn--danger  { background: #e53935; color: #fff; }
    .modal-btn--danger:hover  { background: #b71c1c; }
    .modal-btn--success { background: var(--green, #2E7D32); color: #fff; }
    .modal-btn--success:hover { background: #1B5E20; }
 
    /* ---------- Modal résumé commande ---------- */
    .modal-order-summary {
      background: #f9f9f9;
      border-radius: 14px;
      padding: 18px 20px;
      margin: 16px 0;
      text-align: left;
    }
    .modal-items-list { padding: 0; list-style: none; margin-bottom: 12px; }
    .modal-items-list li {
      font-size: 0.86rem;
      color: #444;
      padding: 4px 0;
      border-bottom: 1px solid #eee;
    }
    .modal-items-list li:last-child { border: none; }
    .modal-total {
      display: flex;
      justify-content: space-between;
      font-size: 0.88rem;
      color: #555;
      margin-top: 8px;
    }
    .modal-total--big {
      border-top: 1.5px solid #ddd;
      padding-top: 10px;
      margin-top: 10px;
      font-size: 1rem;
      font-weight: 800;
      color: var(--green, #2E7D32);
    }
    .modal-total--big strong { font-size: 1.1rem; color: var(--green, #2E7D32); }
 
    /* ---------- Modal succès ---------- */
    .modal-box--celebrate { position: relative; overflow: hidden; }
    .modal-confetti { font-size: 2.5rem; margin-bottom: 8px; animation: confettiBounce 0.7s ease; }
    @keyframes confettiBounce {
      0%   { transform: scale(0) rotate(-20deg); }
      80%  { transform: scale(1.15) rotate(5deg); }
      100% { transform: scale(1) rotate(0); }
    }
    .modal-success-icon i { font-size: 3rem; color: var(--green, #2E7D32); margin-bottom: 12px; display: block; }
    .modal-order-id { font-size: 0.9rem; color: #888; margin-bottom: 8px; }
    .modal-total-confirm { font-weight: 800; color: var(--green, #2E7D32); font-size: 1.05rem; margin-top: 12px; }
 
    /* ---------- ASAP button ---------- */
    .asap-btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: #FFF8E1;
      border: 1.5px solid #FFD54F;
      color: #F57F17;
      font-weight: 700;
      font-size: 0.84rem;
      font-family: var(--font-body, sans-serif);
      border-radius: 10px;
      padding: 8px 14px;
      cursor: pointer;
      margin-bottom: 10px;
      transition: all 0.2s;
    }
    .asap-btn:hover { background: #FFD54F; }
    .asap-btn--active { background: #FFD54F; border-color: #F9A825; }
 
    /* ---------- Input erreur ---------- */
    .input--error, .promo-input--invalid {
      border-color: #e53935 !important;
      animation: shake 0.4s ease;
    }
    @keyframes shake {
      0%,100% { transform: translateX(0); }
      20%,60%  { transform: translateX(-6px); }
      40%,80%  { transform: translateX(6px); }
    }
 
    /* ---------- Navbar scrolled ---------- */
    .navbar--scrolled {
      box-shadow: 0 4px 20px rgba(0,0,0,0.12) !important;
    }
 
    /* ---------- Responsive FAB ---------- */
    @media (max-width: 600px) {
      #cartFab { bottom: 18px; right: 18px; }
      #cartFabBtn { width: 54px; height: 54px; font-size: 1.15rem; }
      .modal-box { padding: 28px 20px; }
    }
  `;
  document.head.appendChild(style);
}
 
/* ============================================================
   20. INITIALISATION
   ============================================================ */
function init() {
  injectStyles();
  createToastContainer();
  createCartBadge();
  loadCart();
 
  initOrderMode();
  initAddButtons();
  initPromo();
  initPlanning();
  initPayment();
  initConfirmBtn();
  initReorder();
  initNavbar();
 
  renderCart();
 
  // Ajouter un label de mode dans le résumé
  const summaryH3 = document.querySelector('.cart-summary h3');
  if (summaryH3) {
    const modeLabel = document.createElement('span');
    modeLabel.id = 'summaryModeLabel';
    modeLabel.style.cssText = 'display:block;font-size:0.78rem;color:#888;font-weight:600;margin-top:4px;font-family:var(--font-body,sans-serif);';
    modeLabel.textContent = '🛵 Livraison';
    summaryH3.appendChild(modeLabel);
  }
}
 
/* ============================================================
   DÉMARRAGE
   ============================================================ */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}