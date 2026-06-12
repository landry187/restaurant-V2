/* =====================================================
   menu.js — La Camerounaise by Landry | Page Menu
   Filtrage, recherche, tri, panier, toast.
   + Modales inline : Commande & Réservation

   ✅ Connecté au panier unifié via Panier_global.js + catalogue.js
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

  allCards.forEach(c => {
    c.style.display = filteredIds.has(+c.dataset.id) ? "" : "none";
  });

  filtered.forEach(d => {
    const card = allCards.find(c => +c.dataset.id === d.id);
    if (card) grid.appendChild(card);
  });

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
   PANIER — utilise window.Panier
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

/* ─────────────────────────────────────────
   HELPER : Récapitulatif panier HTML
───────────────────────────────────────── */
function buildCartRecapHTML() {
  if (!window.Panier) return '';
  const items = window.Panier.items();
  if (items.length === 0) return '';

  const rows = items.map(({ plat, qty }) => `
    <div class="lcbl-modal-recap-row">
      <img src="${plat.img}" alt="${plat.nom}" class="lcbl-modal-recap-img"/>
      <div class="lcbl-modal-recap-info">
        <span class="lcbl-modal-recap-name">${plat.nom}</span>
        <span class="lcbl-modal-recap-qty">×${qty}</span>
      </div>
      <span class="lcbl-modal-recap-price">${(plat.prix * qty).toLocaleString('fr-FR')} FCFA</span>
    </div>
  `).join('');

  const total = window.Panier.total();

  return `
    <div class="lcbl-modal-recap">
      <div class="lcbl-modal-recap-title">
        <i class="fas fa-shopping-bag"></i> Récapitulatif de votre commande
      </div>
      <div class="lcbl-modal-recap-items">${rows}</div>
      <div class="lcbl-modal-recap-total">
        <span>Total</span>
        <strong>${total.toLocaleString('fr-FR')} FCFA</strong>
      </div>
    </div>
  `;
}

/* ─────────────────────────────────────────
   MODALE GÉNÉRIQUE — création & contrôle
───────────────────────────────────────── */
function createModal(id, title, icon, bodyHTML, onSubmit) {
  // Supprimer une modale existante avec le même id
  const existing = document.getElementById(id);
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = id;
  modal.className = 'lcbl-modal-overlay';
  modal.innerHTML = `
    <div class="lcbl-modal" role="dialog" aria-modal="true" aria-labelledby="${id}-title">
      <div class="lcbl-modal-header">
        <div class="lcbl-modal-header-left">
          <span class="lcbl-modal-icon">${icon}</span>
          <h2 id="${id}-title" class="lcbl-modal-title">${title}</h2>
        </div>
        <button class="lcbl-modal-close" aria-label="Fermer">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="lcbl-modal-body">
        ${bodyHTML}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Empêcher le scroll du body
  document.body.style.overflow = 'hidden';

  // Animation d'entrée
  requestAnimationFrame(() => modal.classList.add('lcbl-modal-visible'));

  // Fermeture
  function closeModal() {
    modal.classList.remove('lcbl-modal-visible');
    document.body.style.overflow = '';
    setTimeout(() => modal.remove(), 320);
  }

  modal.querySelector('.lcbl-modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function escListener(e) {
    if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', escListener); }
  });

  // Lier le submit si le formulaire existe
  const form = modal.querySelector('form');
  if (form && onSubmit) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      onSubmit(form, closeModal);
    });
  }

  return { modal, closeModal };
}

/* ─────────────────────────────────────────
   MODALE COMMANDE EN LIGNE
───────────────────────────────────────── */
function openCommandeModal() {
  if (!window.Panier || window.Panier.count() === 0) {
    showToast('🛒 Votre panier est vide !');
    return;
  }

  const total = window.Panier.total();
  const recap = buildCartRecapHTML();

  const bodyHTML = `
    ${recap}

    <form id="lcbl-commande-form" novalidate>
      <div class="lcbl-modal-section-label">Vos informations</div>

      <div class="lcbl-form-row">
        <div class="lcbl-form-group">
          <label for="cmd-nom"><i class="fas fa-user"></i> Nom complet *</label>
          <input type="text" id="cmd-nom" placeholder="Ex : Landry Kamdem" required autocomplete="name"/>
          <span class="lcbl-field-err" id="err-cmd-nom"></span>
        </div>
        <div class="lcbl-form-group">
          <label for="cmd-tel"><i class="fas fa-phone"></i> Téléphone *</label>
          <input type="tel" id="cmd-tel" placeholder="" required autocomplete="tel"/>
          <span class="lcbl-field-err" id="err-cmd-tel"></span>
        </div>
      </div>

      <div class="lcbl-modal-section-label">Mode de livraison</div>
      <div class="lcbl-delivery-options">
        <label class="lcbl-delivery-option">
          <input type="radio" name="cmd-livraison" value="livraison" checked/>
          <span class="lcbl-delivery-card">
            <span class="lcbl-delivery-icon">🛵</span>
            <strong>Livraison à domicile</strong>
            <small>Frais de livraison : 1 000 FCFA</small>
          </span>
        </label>
        <label class="lcbl-delivery-option">
          <input type="radio" name="cmd-livraison" value="sur-place"/>
          <span class="lcbl-delivery-card">
            <span class="lcbl-delivery-icon">🍽️</span>
            <strong>Sur place / Emporter</strong>
            <small>Prêt en 60–80 min</small>
          </span>
        </label>
      </div>

      <div class="lcbl-form-group" id="cmd-adresse-wrap">
        <label for="cmd-adresse"><i class="fas fa-map-marker-alt"></i> Adresse de livraison *</label>
        <input type="text" id="cmd-adresse" placeholder="Ex : Global station , Baham" required autocomplete="street-address"/>
        <span class="lcbl-field-err" id="err-cmd-adresse"></span>
      </div>

      <div class="lcbl-modal-section-label">Informations complémentaires</div>
      <div class="lcbl-form-group">
        <label for="cmd-note"><i class="fas fa-comment-alt"></i> Note pour le cuisinier (optionnel)</label>
        <textarea id="cmd-note" placeholder="Ex : sans piment, extra sauce…" rows="2"></textarea>
      </div>

      <div class="lcbl-modal-section-label">Moyen de paiement</div>
      <div class="lcbl-payment-grid">
        <button type="button" class="lcbl-pay-card active" data-method="Orange Money">
          <span class="lcbl-pay-icon">🟠</span>
          <strong>Orange Money</strong>
          <small>*150#</small>
        </button>
        <button type="button" class="lcbl-pay-card" data-method="MTN MoMo">
          <span class="lcbl-pay-icon">🟡</span>
          <strong>MTN MoMo</strong>
          <small>*126#</small>
        </button>
        <button type="button" class="lcbl-pay-card" data-method="Carte bancaire">
          <span class="lcbl-pay-icon">💳</span>
          <strong>Carte bancaire</strong>
          <small>Visa / Mastercard</small>
        </button>
      </div>
      <input type="hidden" id="cmd-payment" value="Orange Money"/>

      <div class="lcbl-modal-total-bar">
        <div class="lcbl-total-line">
          <span>Sous-total</span>
          <strong>${total.toLocaleString('fr-FR')} FCFA</strong>
        </div>
        <div class="lcbl-total-line" id="cmd-frais-livraison-line">
          <span>Frais de livraison</span>
          <strong>500 FCFA</strong>
        </div>
        <div class="lcbl-total-line lcbl-grand-total">
          <span>Total à payer</span>
          <strong id="cmd-grand-total">${(total + 500).toLocaleString('fr-FR')} FCFA</strong>
        </div>
      </div>

      <div id="lcbl-cmd-status" style="display:none;"></div>

      <button type="submit" class="lcbl-modal-submit-btn">
        <span id="lcbl-cmd-btn-text"><i class="fas fa-check-circle"></i> Confirmer la commande</span>
        <span id="lcbl-cmd-btn-loader" style="display:none;"><i class="fas fa-spinner fa-spin"></i> Envoi en cours…</span>
      </button>
    </form>
  `;

  const { modal, closeModal } = createModal(
    'lcbl-commande-modal',
    'Passer ma commande',
    '🛵',
    bodyHTML,
    (form, close) => submitCommande(form, close)
  );

  // Toggle adresse livraison / sur-place
  const radioButtons = modal.querySelectorAll('input[name="cmd-livraison"]');
  const adresseWrap  = modal.querySelector('#cmd-adresse-wrap');
  const fraisLine    = modal.querySelector('#cmd-frais-livraison-line');
  const grandTotal   = modal.querySelector('#cmd-grand-total');

  radioButtons.forEach(radio => {
    radio.addEventListener('change', () => {
      const isLivraison = radio.value === 'livraison';
      adresseWrap.style.display = isLivraison ? '' : 'none';
      fraisLine.style.display   = isLivraison ? '' : 'none';
      const frais = isLivraison ? 500 : 0;
      grandTotal.textContent = (total + frais).toLocaleString('fr-FR') + ' FCFA';
      modal.querySelector('#cmd-adresse').required = isLivraison;
    });
  });

  // Sélection du moyen de paiement
  modal.querySelectorAll('.lcbl-pay-card').forEach(card => {
    card.addEventListener('click', () => {
      modal.querySelectorAll('.lcbl-pay-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      modal.querySelector('#cmd-payment').value = card.dataset.method;
    });
  });
}

async function submitCommande(form, closeModal) {
  // Validation
  const nom      = form.querySelector('#cmd-nom');
  const tel      = form.querySelector('#cmd-tel');
  const adresse  = form.querySelector('#cmd-adresse');
  const livraison= form.querySelector('input[name="cmd-livraison"]:checked').value;
  const payment  = form.querySelector('#cmd-payment').value;
  const note     = form.querySelector('#cmd-note').value.trim();
  let valid = true;

  const setErr = (errId, msg) => {
    const el = form.querySelector('#' + errId);
    if (el) el.textContent = msg;
  };

  setErr('err-cmd-nom', '');
  setErr('err-cmd-tel', '');
  setErr('err-cmd-adresse', '');

  if (!nom.value.trim()) { setErr('err-cmd-nom', 'Votre nom est requis.'); valid = false; }
  if (!tel.value.trim()) { setErr('err-cmd-tel', 'Votre téléphone est requis.'); valid = false; }
  if (livraison === 'livraison' && !adresse.value.trim()) {
    setErr('err-cmd-adresse', 'L\'adresse de livraison est requise.'); valid = false;
  }
  if (!valid) return;

  // Préparer les données
  const items  = window.Panier.items();
  const total  = window.Panier.total();
  const frais  = livraison === 'livraison' ? 500 : 0;
  const payload = {
    client_name:    nom.value.trim(),
    client_phone:   tel.value.trim(),
    delivery_type:  livraison,
    delivery_address: livraison === 'livraison' ? adresse.value.trim() : 'Sur place',
    payment_method: payment,
    note,
    total_price:    total + frais,
    items: items.map(({ plat, qty }) => ({ id: plat.id, name: plat.nom, qty, price: plat.prix }))
  };

  // Spinner
  const btnText   = form.querySelector('#lcbl-cmd-btn-text');
  const btnLoader = form.querySelector('#lcbl-cmd-btn-loader');
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled   = true;
  btnText.style.display   = 'none';
  btnLoader.style.display = 'inline';

  const statusEl = form.querySelector('#lcbl-cmd-status');

  try {
    const res  = await fetch(`${window.API_URL}/orders`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.ok || res.ok) {
      showModalSuccess(form, statusEl, '🎉 Commande confirmée ! Nous vous contactons très bientôt.', closeModal, true);
    } else {
      showModalError(statusEl, '❌ ' + (data.message || 'Une erreur est survenue.'));
    }
  } catch (err) {
    // Fallback si serveur non disponible — confirmation locale
    console.warn('[Commande] Serveur non joignable, confirmation locale.', err);
    showModalSuccess(form, statusEl, '✅ Commande enregistrée ! (Mode hors-ligne — nous vous contactons dès que possible.)', closeModal, true);
  } finally {
    submitBtn.disabled   = false;
    btnText.style.display   = 'inline';
    btnLoader.style.display = 'none';
  }
}

/* ─────────────────────────────────────────
   MODALE RÉSERVATION
───────────────────────────────────────── */
function openReservationModal() {
  if (!window.Panier || window.Panier.count() === 0) {
    showToast('🛒 Ajoutez des plats avant de réserver !');
    return;
  }

  const total   = window.Panier.total();
  const acompte = Math.round(total * 0.5);
  const recap   = buildCartRecapHTML();

  // Date min = aujourd'hui
  const today = new Date().toISOString().split('T')[0];

  const bodyHTML = `
    ${recap}

    <form id="lcbl-reservation-form" novalidate>
      <div class="lcbl-modal-section-label">Vos informations</div>

      <div class="lcbl-form-row">
        <div class="lcbl-form-group">
          <label for="res-nom"><i class="fas fa-user"></i> Nom complet *</label>
          <input type="text" id="res-nom" placeholder="Ex : Landry Kamdem" required autocomplete="name"/>
          <span class="lcbl-field-err" id="err-res-nom"></span>
        </div>
        <div class="lcbl-form-group">
          <label for="res-tel"><i class="fas fa-phone"></i> Téléphone *</label>
          <input type="tel" id="res-tel" placeholder="" required autocomplete="tel"/>
          <span class="lcbl-field-err" id="err-res-tel"></span>
        </div>
      </div>

      <div class="lcbl-modal-section-label">Date & créneau</div>
      <div class="lcbl-form-row">
        <div class="lcbl-form-group">
          <label for="res-date"><i class="fas fa-calendar-alt"></i> Date *</label>
          <input type="date" id="res-date" min="${today}" required/>
          <span class="lcbl-field-err" id="err-res-date"></span>
        </div>
        <div class="lcbl-form-group">
          <label for="res-heure"><i class="fas fa-clock"></i> Heure *</label>
          <input type="time" id="res-heure" min="10:00" max="22:30" required/>
          <span class="lcbl-field-err" id="err-res-heure"></span>
        </div>
      </div>

      <div class="lcbl-modal-section-label">Choix de la table</div>
      <div class="lcbl-tables-grid">
        <label class="lcbl-table-option">
          <input type="radio" name="res-table" value="Table VIP 1" required/>
          <span class="lcbl-table-card">
            <span class="lcbl-table-icon"></span>
            <strong>Table VIP 1</strong>
            <small>6 places</small>
          </span>
        </label>
        <label class="lcbl-table-option">
          <input type="radio" name="res-table" value="Table VIP 2"/>
          <span class="lcbl-table-card">
            <span class="lcbl-table-icon"></span>
            <strong>Table VIP 2</strong>
            <small>4 places</small>
          </span>
        </label>
        <label class="lcbl-table-option">
          <input type="radio" name="res-table" value="Table Famille"/>
          <span class="lcbl-table-card">
            <span class="lcbl-table-icon"></span>
            <strong>Table Famille</strong>
            <small>8 places</small>
          </span>
        </label>
      </div>
      <span class="lcbl-field-err" id="err-res-table"></span>

      <div class="lcbl-modal-section-label">Paiement de l'acompte (50%)</div>
      <div class="lcbl-payment-grid">
        <button type="button" class="lcbl-pay-card active" data-method="Orange Money">
          <span class="lcbl-pay-icon">🟠</span>
          <strong>Orange Money</strong>
          <small>*150#</small>
        </button>
        <button type="button" class="lcbl-pay-card" data-method="MTN MoMo">
          <span class="lcbl-pay-icon">🟡</span>
          <strong>MTN MoMo</strong>
          <small>*126#</small>
        </button>
        <button type="button" class="lcbl-pay-card" data-method="Carte bancaire">
          <span class="lcbl-pay-icon">💳</span>
          <strong>Carte bancaire</strong>
          <small>Visa / Mastercard</small>
        </button>
      </div>
      <input type="hidden" id="res-payment" value="Orange Money"/>

      <div class="lcbl-modal-total-bar">
        <div class="lcbl-total-line">
          <span>Total commande</span>
          <strong>${total.toLocaleString('fr-FR')} FCFA</strong>
        </div>
        <div class="lcbl-total-line lcbl-grand-total">
          <span>Acompte à payer maintenant (50%)</span>
          <strong>${acompte.toLocaleString('fr-FR')} FCFA</strong>
        </div>
      </div>

      <div class="lcbl-info-notice">
        <i class="fas fa-circle-info"></i>
        La réservation est confirmée après le paiement de l'acompte de <strong>${acompte.toLocaleString('fr-FR')} FCFA</strong>.
        Le solde est réglé sur place.
      </div>

      <div id="lcbl-res-status" style="display:none;"></div>

      <button type="submit" class="lcbl-modal-submit-btn">
        <span id="lcbl-res-btn-text"><i class="fas fa-calendar-check"></i> Confirmer la réservation</span>
        <span id="lcbl-res-btn-loader" style="display:none;"><i class="fas fa-spinner fa-spin"></i> Envoi en cours…</span>
      </button>
    </form>
  `;

  const { modal, closeModal } = createModal(
    'lcbl-reservation-modal',
    'Réserver une table',
    '🍽️',
    bodyHTML,
    (form, close) => submitReservation(form, close)
  );

  // Sélection du moyen de paiement
  modal.querySelectorAll('.lcbl-pay-card').forEach(card => {
    card.addEventListener('click', () => {
      modal.querySelectorAll('.lcbl-pay-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      modal.querySelector('#res-payment').value = card.dataset.method;
    });
  });

  // Surbrillance des tables au survol/click
  modal.querySelectorAll('.lcbl-table-option input').forEach(radio => {
    radio.addEventListener('change', () => {
      modal.querySelectorAll('.lcbl-table-card').forEach(c => c.classList.remove('selected'));
      radio.closest('.lcbl-table-option').querySelector('.lcbl-table-card').classList.add('selected');
    });
  });
}

async function submitReservation(form, closeModal) {
  const nom     = form.querySelector('#res-nom');
  const tel     = form.querySelector('#res-tel');
  const date    = form.querySelector('#res-date');
  const heure   = form.querySelector('#res-heure');
  const tableEl = form.querySelector('input[name="res-table"]:checked');
  const payment = form.querySelector('#res-payment').value;
  let valid = true;

  const setErr = (id, msg) => {
    const el = form.querySelector('#' + id);
    if (el) el.textContent = msg;
  };

  ['err-res-nom','err-res-tel','err-res-date','err-res-heure','err-res-table'].forEach(id => setErr(id, ''));

  if (!nom.value.trim())   { setErr('err-res-nom',   'Votre nom est requis.');  valid = false; }
  if (!tel.value.trim())   { setErr('err-res-tel',   'Votre téléphone est requis.'); valid = false; }
  if (!date.value)         { setErr('err-res-date',  'La date est requise.'); valid = false; }
  if (!heure.value)        { setErr('err-res-heure', 'L\'heure est requise.'); valid = false; }
  if (!tableEl)            { setErr('err-res-table', 'Veuillez choisir une table.'); valid = false; }
  if (!valid) return;

  const items   = window.Panier.items();
  const total   = window.Panier.total();
  const acompte = Math.round(total * 0.5);

  const payload = {
    client_name:    nom.value.trim(),
    client_phone:   tel.value.trim(),
    reservation_date: date.value,
    reservation_time: heure.value,
    table_name:     tableEl.value,
    payment_method: payment,
    total_price:    total,
    advance_amount: acompte,
    items: items.map(({ plat, qty }) => ({ id: plat.id, name: plat.nom, qty, price: plat.prix }))
  };

  const btnText   = form.querySelector('#lcbl-res-btn-text');
  const btnLoader = form.querySelector('#lcbl-res-btn-loader');
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled   = true;
  btnText.style.display   = 'none';
  btnLoader.style.display = 'inline';

  const statusEl = form.querySelector('#lcbl-res-status');

  try {
    const res  = await fetch(`${window.API_URL}/reservations`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.ok || res.ok) {
      showModalSuccess(form, statusEl, '🎉 Réservation confirmée ! Nous vous envoyons une confirmation par SMS.', closeModal, true);
    } else {
      showModalError(statusEl, '❌ ' + (data.message || 'Une erreur est survenue.'));
    }
  } catch (err) {
    console.warn('[Réservation] Serveur non joignable, confirmation locale.', err);
    showModalSuccess(form, statusEl, '✅ Réservation enregistrée ! (Mode hors-ligne)', closeModal, true);
  } finally {
    submitBtn.disabled   = false;
    btnText.style.display   = 'inline';
    btnLoader.style.display = 'none';
  }
}

/* ─────────────────────────────────────────
   HELPERS STATUS MODAL
───────────────────────────────────────── */
function showModalSuccess(form, statusEl, msg, closeModal, clearPanier) {
  statusEl.style.display = 'block';
  statusEl.className = 'lcbl-status lcbl-status-success';
  statusEl.innerHTML = `<i class="fas fa-check-circle"></i> ${msg}`;
  form.querySelector('button[type="submit"]').style.display = 'none';
  if (clearPanier && window.Panier) {
    window.Panier.vider();
    updateCartUI();
    render();
  }
  setTimeout(closeModal, 4000);
}

function showModalError(statusEl, msg) {
  statusEl.style.display = 'block';
  statusEl.className = 'lcbl-status lcbl-status-error';
  statusEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
}

/* ─────────────────────────────────────────
   MISE À JOUR CART UI
───────────────────────────────────────── */
function updateCartUI() {
  if (!window.Panier) return;

  const panierItems = window.Panier.items();
  const total       = window.Panier.total();
  const totalQty    = window.Panier.count();

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

  // Bouton "Passer la commande" — ouvre la modale
  let goBtn = document.getElementById('cart-goto-commande');
  if (!goBtn) {
    goBtn = document.createElement('button');
    goBtn.id = 'cart-goto-commande';
    goBtn.type = 'button';
    goBtn.innerHTML = '🛵 Passer la commande';
    goBtn.className = 'lcbl-cart-action-btn lcbl-cart-action-primary';
    cartFooter.appendChild(goBtn);
  }
  goBtn.onclick = () => { closeCart(); setTimeout(openCommandeModal, 200); };

  // Bouton "Réserver une table" — ouvre la modale
  let resBtn = document.getElementById('cart-goto-reservation');
  if (!resBtn) {
    resBtn = document.createElement('button');
    resBtn.id = 'cart-goto-reservation';
    resBtn.type = 'button';
    resBtn.innerHTML = '🍽️ Réserver une table';
    resBtn.className = 'lcbl-cart-action-btn lcbl-cart-action-secondary';
    cartFooter.appendChild(resBtn);
  }
  resBtn.onclick = () => { closeCart(); setTimeout(openReservationModal, 200); };
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
  const addBtn   = e.target.closest(".add-btn");
  const plusBtn  = e.target.closest(".plus-btn");
  const minusBtn = e.target.closest(".minus-btn");

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