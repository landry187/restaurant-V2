/* ============================================================
   commande.js — La Camerounaise by Landry
   Wizard 3 étapes : Informations → Récapitulatif → Paiement
   Requiert : catalogue.js, Panier_global.js, api-config.js
   ============================================================ */
'use strict';

/* ── Codes promo ── */
const PROMO_CODES = { 'LANDRY10': 0.10, 'JB': 0.05, 'OFFICIEL': 0.15 };
const DELIVERY_FEE = 1000;

/* ── État ── */
let state = {
  currentStep: 1,
  orderMode: 'delivery',   // 'delivery' | 'place'
  promoApplied: null,       // { code, rate }
  paymentMethod: 'Orange Money',
  clientInfo: {}
};

/* ── Utilitaires ── */
const fmt = n => n.toLocaleString('fr-FR') + ' FCFA';

function today() {
  return new Date().toISOString().split('T')[0];
}

function formatDateFr(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatHeure(heureStr) {
  if (!heureStr) return '—';
  return heureStr.replace(':', 'h');
}

/* ============================================================
   BURGER MENU
   ============================================================ */
function initBurger() {
  const burger = document.getElementById('burger');
  const menu   = document.getElementById('mobileMenu');
  if (!burger || !menu) return;
  burger.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    const [s1, s2, s3] = burger.querySelectorAll('span');
    if (open) {
      s1.style.transform = 'rotate(45deg) translate(5px,5px)';
      s2.style.opacity   = '0';
      s3.style.transform = 'rotate(-45deg) translate(5px,-5px)';
    } else {
      [s1, s2, s3].forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    menu.classList.remove('open');
    burger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  }));
}

/* ============================================================
   DÉTECTION PANIER VIDE
   ============================================================ */
function initCartCheck() {
  const emptyScreen  = document.getElementById('emptyCartScreen');
  const wizardEl     = document.getElementById('commandeWizard');

  function check() {
    const count = window.Panier ? window.Panier.count() : 0;
    if (count === 0) {
      emptyScreen.style.display  = 'flex';
      wizardEl.style.display     = 'none';
    } else {
      emptyScreen.style.display  = 'none';
      wizardEl.style.display     = 'block';
    }
  }

  check();
  if (window.Panier) window.Panier.onUpdate(check);
}

/* ============================================================
   BARRE DE PROGRESSION
   ============================================================ */
function updateProgress(step) {
  state.currentStep = step;
  const fill  = document.getElementById('progressFill');
  const steps = document.querySelectorAll('.progress-step');

  const pct = ((step - 1) / 2) * 100;
  if (fill) fill.style.width = pct + '%';

  steps.forEach(s => {
    const n = parseInt(s.dataset.step);
    s.classList.toggle('active',    n === step);
    s.classList.toggle('completed', n < step);
  });
}

function showStep(n) {
  [1, 2, 3].forEach(i => {
    const el = document.getElementById('step' + i);
    if (el) el.style.display = (i === n) ? 'block' : 'none';
  });
  updateProgress(n);
  window.scrollTo({ top: document.getElementById('commandeWizard').offsetTop - 80, behavior: 'smooth' });
}

/* ============================================================
   ÉTAPE 1 — INFORMATIONS
   ============================================================ */
function initStep1() {
  /* Valeur minimale de date = aujourd'hui */
  const dateInput = document.getElementById('cmd-date');
  if (dateInput) dateInput.min = today();

  /* Mode commande */
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.orderMode = btn.dataset.mode;

      const addrGroup    = document.getElementById('addressGroup');
      const delivBanner  = document.getElementById('deliveryBanner');
      const isDelivery   = state.orderMode === 'delivery';
      if (addrGroup)   addrGroup.style.display   = isDelivery ? '' : 'none';
      if (delivBanner) delivBanner.style.display  = isDelivery ? '' : 'none';
    });
  });

  /* Bouton Suivant */
  document.getElementById('step1Next').addEventListener('click', () => {
    if (!validateStep1()) return;
    collectStep1();
    buildRecap();
    showStep(2);
  });
}

function validateStep1() {
  let ok = true;
  const check = (id, errId, msg) => {
    const el  = document.getElementById(id);
    const err = document.getElementById(errId);
    if (!el || !el.value.trim()) {
      if (err) err.textContent = msg;
      if (el)  el.classList.add('input-error');
      ok = false;
    } else {
      if (err) err.textContent = '';
      if (el)  el.classList.remove('input-error');
    }
  };

  check('cmd-nom',   'err-cmd-nom',   'Le nom est requis');
  check('cmd-tel',   'err-cmd-tel',   'Le téléphone est requis');
  check('cmd-date',  'err-cmd-date',  'La date est requise');
  check('cmd-heure', 'err-cmd-heure', "L'heure est requise");

  if (state.orderMode === 'delivery') {
    check('cmd-adresse', 'err-cmd-adresse', "L'adresse de livraison est requise");
  }

  /* Validation heure 10h-22h */
  const heureEl  = document.getElementById('cmd-heure');
  const errHeure = document.getElementById('err-cmd-heure');
  if (heureEl && heureEl.value) {
    const [h] = heureEl.value.split(':').map(Number);
    if (h < 10 || h >= 22) {
      if (errHeure) errHeure.textContent = 'Nous servons entre 10h00 et 22h00';
      heureEl.classList.add('input-error');
      ok = false;
    }
  }

  return ok;
}

function collectStep1() {
  state.clientInfo = {
    nom:     document.getElementById('cmd-nom').value.trim(),
    tel:     document.getElementById('cmd-tel').value.trim(),
    adresse: state.orderMode === 'delivery' ? document.getElementById('cmd-adresse').value.trim() : 'Sur place',
    date:    document.getElementById('cmd-date').value,
    heure:   document.getElementById('cmd-heure').value,
    note:    document.getElementById('cmd-note').value.trim(),
    mode:    state.orderMode
  };
}

/* ============================================================
   ÉTAPE 2 — RÉCAPITULATIF
   ============================================================ */
function buildRecap() {
  buildRecapClient();
  buildRecapItems();
  buildRecapTotals();
}

function buildRecapClient() {
  const el = document.getElementById('recapClient');
  if (!el) return;
  const c = state.clientInfo;
  const modeLabel = c.mode === 'delivery' ? '🛵 Livraison' : '🍽️ Sur place';
  el.innerHTML = `
    <div class="recap-client-grid">
      <div class="recap-client-item"><i class="fas fa-user"></i><div><small>Nom</small><strong>${c.nom}</strong></div></div>
      <div class="recap-client-item"><i class="fas fa-phone"></i><div><small>Téléphone</small><strong>${c.tel}</strong></div></div>
      <div class="recap-client-item"><i class="fas fa-map-marker-alt"></i><div><small>Adresse</small><strong>${c.adresse}</strong></div></div>
      <div class="recap-client-item"><i class="far fa-calendar-alt"></i><div><small>Date</small><strong>${formatDateFr(c.date)}</strong></div></div>
      <div class="recap-client-item"><i class="far fa-clock"></i><div><small>Heure</small><strong>${formatHeure(c.heure)}</strong></div></div>
      <div class="recap-client-item"><i class="fas fa-tag"></i><div><small>Mode</small><strong>${modeLabel}</strong></div></div>
      ${c.note ? `<div class="recap-client-item full"><i class="fas fa-comment-alt"></i><div><small>Note</small><strong>${c.note}</strong></div></div>` : ''}
    </div>
  `;
}

function buildRecapItems() {
  const el = document.getElementById('recapItems');
  if (!el) return;
  const items = window.Panier ? window.Panier.items() : [];
  if (items.length === 0) {
    el.innerHTML = '<p class="empty-msg">Panier vide — <a href="menu.html">Ajouter des plats</a></p>';
    return;
  }
  el.innerHTML = items.map(({ plat, qty }) => `
    <div class="recap-item">
      ${plat.img ? `<img src="${plat.img}" alt="${plat.nom}" class="recap-thumb">` : `<div class="recap-thumb-icon"><i class="fas fa-utensils"></i></div>`}
      <div class="recap-item-info">
        <strong>${plat.nom}</strong>
        <small>× ${qty}</small>
      </div>
      <strong class="recap-item-price">${fmt(plat.prix * qty)}</strong>
    </div>
  `).join('');
}

function buildRecapTotals() {
  const el = document.getElementById('recapTotals');
  if (!el) return;

  const items     = window.Panier ? window.Panier.items() : [];
  const sousTotal = items.reduce((s, { plat, qty }) => s + plat.prix * qty, 0);
  const livraison = state.orderMode === 'delivery' ? DELIVERY_FEE : 0;
  const remise    = state.promoApplied ? Math.round(sousTotal * state.promoApplied.rate) : 0;
  const total     = sousTotal + livraison - remise;

  el.innerHTML = `
    <div class="totals-line"><span>Sous-total</span><strong>${fmt(sousTotal)}</strong></div>
    ${state.orderMode === 'delivery' ? `<div class="totals-line"><span>Livraison</span><strong>${fmt(livraison)}</strong></div>` : ''}
    ${remise > 0 ? `<div class="totals-line discount"><span>Réduction (${state.promoApplied.code})</span><strong>− ${fmt(remise)}</strong></div>` : ''}
    <div class="totals-line total"><span>Total</span><strong>${fmt(total)}</strong></div>
  `;

  /* Aussi mettre à jour le résumé final (étape 3) */
  buildFinalSummary(sousTotal, livraison, remise, total);
}

function initStep2() {
  /* Code promo */
  document.getElementById('promoBtn').addEventListener('click', applyPromo);
  document.getElementById('promoInput').addEventListener('keypress', e => {
    if (e.key === 'Enter') applyPromo();
  });

  document.getElementById('step2Prev').addEventListener('click', () => showStep(1));
  document.getElementById('step2Next').addEventListener('click', () => {
    buildFinalSummaryFromState();
    showStep(3);
  });
}

function applyPromo() {
  const input    = document.getElementById('promoInput');
  const feedback = document.getElementById('promoFeedback');
  const code     = input.value.trim().toUpperCase();

  if (PROMO_CODES[code]) {
    state.promoApplied = { code, rate: PROMO_CODES[code] };
    feedback.className = 'promo-feedback promo-ok';
    feedback.textContent = `✅ Code « ${code} » appliqué — ${Math.round(PROMO_CODES[code] * 100)}% de réduction !`;
    buildRecapTotals();
  } else {
    state.promoApplied = null;
    feedback.className = 'promo-feedback promo-err';
    feedback.textContent = '❌ Code promo invalide';
    buildRecapTotals();
  }
}

/* ============================================================
   ÉTAPE 3 — PAIEMENT
   ============================================================ */
function buildFinalSummaryFromState() {
  const items     = window.Panier ? window.Panier.items() : [];
  const sousTotal = items.reduce((s, { plat, qty }) => s + plat.prix * qty, 0);
  const livraison = state.orderMode === 'delivery' ? DELIVERY_FEE : 0;
  const remise    = state.promoApplied ? Math.round(sousTotal * state.promoApplied.rate) : 0;
  const total     = sousTotal + livraison - remise;
  buildFinalSummary(sousTotal, livraison, remise, total);
}

function buildFinalSummary(sousTotal, livraison, remise, total) {
  const el = document.getElementById('finalSummary');
  if (!el) return;
  const c = state.clientInfo;
  el.innerHTML = `
    <div class="final-summary-inner">
      <div class="final-row"><span>Client</span><strong>${c.nom || '—'}</strong></div>
      <div class="final-row"><span>Mode</span><strong>${c.mode === 'delivery' ? '🛵 Livraison' : '🍽️ Sur place'}</strong></div>
      <div class="final-row"><span>Date & Heure</span><strong>${formatDateFr(c.date)} à ${formatHeure(c.heure)}</strong></div>
      <hr>
      <div class="final-row"><span>Sous-total</span><strong>${fmt(sousTotal)}</strong></div>
      ${livraison > 0 ? `<div class="final-row"><span>Livraison</span><strong>${fmt(livraison)}</strong></div>` : ''}
      ${remise > 0    ? `<div class="final-row discount"><span>Réduction</span><strong>− ${fmt(remise)}</strong></div>` : ''}
      <div class="final-row big-total"><span>Total</span><strong>${fmt(total)}</strong></div>
    </div>
  `;
}

function initStep3() {
  /* Sélection méthode paiement */
  document.querySelectorAll('#paymentGrid .payment-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('#paymentGrid .payment-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      state.paymentMethod = card.dataset.method;
    });
  });

  document.getElementById('step3Prev').addEventListener('click', () => showStep(2));
  document.getElementById('confirmBtn').addEventListener('click', submitOrder);
}

/* ============================================================
   SOUMISSION
   ============================================================ */
async function submitOrder() {
  const btn      = document.getElementById('confirmBtn');
  const btnText  = document.getElementById('confirmBtnText');
  const btnLoad  = document.getElementById('confirmBtnLoader');
  const statusEl = document.getElementById('step3Status');

  btn.disabled        = true;
  btnText.style.display = 'none';
  btnLoad.style.display = 'inline';

  const items     = window.Panier ? window.Panier.items() : [];
  const sousTotal = items.reduce((s, { plat, qty }) => s + plat.prix * qty, 0);
  const livraison = state.orderMode === 'delivery' ? DELIVERY_FEE : 0;
  const remise    = state.promoApplied ? Math.round(sousTotal * state.promoApplied.rate) : 0;
  const total     = sousTotal + livraison - remise;

  const payload = {
    client_name:     state.clientInfo.nom,
    client_phone:    state.clientInfo.tel,
    delivery_address: state.clientInfo.adresse,
    order_date:      state.clientInfo.date,
    order_time:      state.clientInfo.heure,
    note:            state.clientInfo.note,
    order_mode:      state.orderMode,
    payment_method:  state.paymentMethod,
    promo_code:      state.promoApplied ? state.promoApplied.code : null,
    items: items.map(({ plat, qty }) => ({ name: plat.nom, price: plat.prix, qty })),
    sous_total:      sousTotal,
    delivery_fee:    livraison,
    discount:        remise,
    total
  };

  try {
    const res  = await fetch(`${window.API_URL}/orders`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.ok) {
      if (window.Panier) window.Panier.vider();
      showSuccessModal(total, data.order_id || '—');
    } else {
      showStatus(statusEl, '❌ ' + (data.message || 'Erreur serveur'), 'error');
    }
  } catch(err) {
    /* Mode hors-ligne : simuler confirmation */
    const fakeId = 'CMD-' + Date.now().toString(36).toUpperCase();
    if (window.Panier) window.Panier.vider();
    showSuccessModal(total, fakeId);
  } finally {
    btn.disabled        = false;
    btnText.style.display = 'inline';
    btnLoad.style.display = 'none';
  }
}

function showStatus(el, msg, type) {
  if (!el) return;
  el.textContent   = msg;
  el.className     = 'wizard-status wizard-status--' + type;
  el.style.display = 'block';
  if (type === 'success') setTimeout(() => { el.style.display = 'none'; }, 5000);
}

/* ============================================================
   MODAL SUCCÈS
   ============================================================ */
function showSuccessModal(total, orderId) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box modal-box--celebrate">
      <div class="modal-confetti">🎉</div>
      <div class="modal-success-icon"><i class="fas fa-check-circle"></i></div>
      <h3>Commande confirmée !</h3>
      <p class="modal-order-id">Référence : <strong>${orderId}</strong></p>
      <p>Votre commande a bien été enregistrée.<br>Nous vous contacterons rapidement.</p>
      <p class="modal-total-confirm">Total : ${fmt(total)}</p>
      <div class="modal-actions">
        <button class="modal-btn modal-btn--success" id="modalCloseBtn">
          <i class="fas fa-home"></i> Accueil
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('modal-overlay--show'));
  overlay.querySelector('#modalCloseBtn').addEventListener('click', () => {
    window.location.href = 'index.html';
  });
}

/* ============================================================
   STYLES INJECTÉS
   ============================================================ */
function injectStyles() {
  const s = document.createElement('style');
  s.textContent = `
    /* ── Page hero ── */
    .page-hero {
      background: linear-gradient(135deg, #f0faf0 0%, #fffbf0 100%);
      text-align: center;
      padding: 80px 7% 60px;
      border-bottom: 1px solid #E0D5C0;
    }
    .page-hero .hero-label {
      color: #2E7D32;
      font-weight: 800;
      letter-spacing: 3px;
      font-size: 0.8rem;
      margin-bottom: 12px;
    }
    .page-hero h1 {
      font-family: 'Playfair Display', serif;
      font-size: 3rem;
      color: #1a1a1a;
      margin-bottom: 16px;
    }
    .page-hero h1 span { color: #2E7D32; }
    .page-hero .hero-text { color: #666; max-width: 560px; margin: auto; line-height: 1.7; }

    /* ── Écran panier vide ── */
    .empty-cart-screen {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      padding: 60px 5%;
    }
    .empty-cart-inner {
      text-align: center;
      max-width: 520px;
    }
    .empty-cart-icon {
      font-size: 5rem;
      margin-bottom: 20px;
      animation: bounce 1.5s infinite alternate;
    }
    @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-12px); } }
    .empty-cart-inner h2 {
      font-family: 'Playfair Display', serif;
      font-size: 2rem;
      color: #1a1a1a;
      margin-bottom: 12px;
    }
    .empty-cart-inner > p { color: #666; margin-bottom: 32px; line-height: 1.7; }
    .empty-cart-steps {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-bottom: 36px;
      text-align: left;
    }
    .step-hint {
      display: flex;
      align-items: center;
      gap: 16px;
      background: #f9f9f9;
      border-radius: 14px;
      padding: 14px 20px;
    }
    .step-num {
      width: 32px; height: 32px;
      background: #2E7D32;
      color: #fff;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800;
      flex-shrink: 0;
    }
    .btn-go-menu {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: #2E7D32;
      color: #fff;
      padding: 16px 36px;
      border-radius: 50px;
      font-weight: 800;
      font-size: 1rem;
      text-decoration: none;
      transition: background 0.25s, transform 0.2s;
      box-shadow: 0 6px 20px rgba(200,150,12,0.45);
    }
    .btn-go-menu:hover { background: #A87A0A;; transform: translateY(-2px);box-shadow: 0 6px 20px rgba(200,150,12,0.45); }

    /* ── Wizard container ── */
    .wizard-container { max-width: 820px; margin: 0 auto; padding: 48px 5% 80px; }

    /* ── Barre de progression ── */
    .wizard-progress { margin-bottom: 48px; }
    .progress-track {
      height: 6px;
      background: #E0D5C0;
      border-radius: 6px;
      margin-bottom: 20px;
      position: relative;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #2E7D32, #DAA520);
      border-radius: 6px;
      transition: width 0.4s ease;
      width: 0%;
    }
    .progress-steps {
      display: flex;
      justify-content: space-between;
    }
    .progress-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      flex: 1;
    }
    .step-circle {
      width: 48px; height: 48px;
      border-radius: 50%;
      background: #E0D5C0;
      color: #999;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem;
      transition: all 0.3s;
      border: 3px solid transparent;
    }
    .progress-step.active .step-circle {
      background: #2E7D32;
      color: #fff;
      border-color: #DAA520;
      box-shadow: 0 4px 14px rgba(46,125,50,0.35);
    }
    .progress-step.completed .step-circle {
      background: #81C784;
      color: #fff;
      border-color: #2E7D32;
    }
    .progress-step span {
      font-size: 0.78rem;
      font-weight: 700;
      color: #999;
      text-align: center;
    }
    .progress-step.active span,
    .progress-step.completed span { color: #2E7D32; }

    /* ── Step card ── */
    .step-card {
      background: #fff;
      border-radius: 24px;
      padding: 40px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.08);
      border: 1px solid #E0D5C0;
    }
    .step-header { margin-bottom: 32px; }
    .step-header h2 {
      font-family: 'Playfair Display', serif;
      font-size: 1.8rem;
      color: #1a1a1a;
      margin-bottom: 6px;
      display: flex; align-items: center; gap: 12px;
    }
    .step-header h2 i { color: #2E7D32; }
    .step-header p { color: #888; font-size: 0.92rem; }

    /* ── Mode selector ── */
    .mode-selector {
      display: flex; gap: 14px; margin-bottom: 28px;
    }
    .mode-btn {
      flex: 1;
      display: flex; align-items: center; justify-content: center; gap: 10px;
      padding: 16px;
      border: 2px solid #E0D5C0;
      border-radius: 14px;
      background: #fff;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.25s;
      font-family: 'Nunito', sans-serif;
      color: #555;
    }
      .mode-btn:hover{border-color: #2E7D32;
      background: #f0faf0;
      color: #2E7D32;
      box-shadow: 0 4px 14px rgba(46,125,50,0.2); }
    .mode-btn i { font-size: 1.3rem; }
    .mode-btn.active {
      border-color: #2E7D32;
      background: #f0faf0;
      color: #2E7D32;
      box-shadow: 0 4px 14px rgba(46,125,50,0.2);
    }

    /* ── Form grid ── */
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
      margin-bottom: 24px;
    }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group.full-col { grid-column: 1 / -1; }
    .form-group label { font-weight: 700; font-size: 0.88rem; color: #444; }
    .form-group input,
    .form-group textarea {
      padding: 14px 16px;
      border: 2px solid #E0D5C0;
      border-radius: 12px;
      font-size: 0.95rem;
      font-family: 'Nunito', sans-serif;
      outline: none;
      transition: border-color 0.2s;
      color: #1a1a1a;
    }
    .form-group input:focus,
    .form-group textarea:focus { border-color: #2E7D32; }
    .form-group textarea { resize: vertical; }
    .required { color: #e53935; }
    .optional { color: #aaa; font-weight: 400; }
    .field-error { font-size: 0.78rem; color: #e53935; font-weight: 700; min-height: 16px; }
    .input-error { border-color: #e53935 !important; }

    /* ── Delivery banner ── */
    .delivery-banner {
      display: flex; align-items: center; gap: 14px;
      background: #FFF8E1;
      border: 1.5px solid #FFD54F;
      border-radius: 12px;
      padding: 14px 20px;
      margin-bottom: 28px;
      color: #F57F17;
      font-size: 0.9rem;
    }
    .delivery-banner i { font-size: 1.2rem; flex-shrink: 0; }

    /* ── Navigation wizard ── */
    .wizard-nav {
      display: flex; align-items: center; justify-content: space-between;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #E0D5C0;
    }
    .btn-next, .btn-prev, .btn-confirm {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 14px 32px;
      border-radius: 50px;
      font-weight: 800;
      font-size: 0.95rem;
      cursor: pointer;
      border: none;
      transition: all 0.25s;
      font-family: 'Nunito', sans-serif;
    }
    .btn-next, .btn-confirm {
      background: #2E7D32; color: #fff;
      box-shadow: 0 4px 16px rgba(46,125,50,0.35);
    }
    .btn-next:hover, .btn-confirm:hover { background: #1B5E20; transform: translateY(-2px); }
    .btn-prev {
      background: #f5f5f5; color: #555;
    }
    .btn-prev:hover { background: #e0e0e0; }
    .btn-confirm { background: linear-gradient(135deg, #2E7D32, #DAA520); }
    .btn-confirm:hover { opacity: 0.92; transform: translateY(-2px); }
    .btn-confirm:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

    /* ── Récapitulatif client ── */
    .recap-client {
      background: #f9fafb;
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 28px;
      border: 1px solid #E0D5C0;
    }
    .recap-client-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
    }
    .recap-client-item {
      display: flex; align-items: flex-start; gap: 12px;
    }
    .recap-client-item.full { grid-column: 1 / -1; }
    .recap-client-item i { color: #2E7D32; margin-top: 2px; width: 18px; flex-shrink: 0; }
    .recap-client-item small { display: block; font-size: 0.74rem; color: #999; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .recap-client-item strong { font-size: 0.92rem; color: #1a1a1a; }

    /* ── Items récap ── */
    .recap-section-title {
      font-size: 1rem; font-weight: 800; color: #1a1a1a;
      margin-bottom: 14px; display: flex; align-items: center; gap: 8px;
    }
    .recap-section-title i { color: #2E7D32; }
    .recap-items { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }
    .recap-item {
      display: flex; align-items: center; gap: 14px;
      background: #f9fafb; border-radius: 12px; padding: 12px 16px;
      border: 1px solid #eee;
    }
    .recap-thumb { width: 52px; height: 52px; object-fit: cover; border-radius: 10px; }
    .recap-thumb-icon {
      width: 52px; height: 52px;
      background: #E0D5C0; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      color: #A87A0A; font-size: 1.3rem;
    }
    .recap-item-info { flex: 1; }
    .recap-item-info strong { display: block; font-size: 0.9rem; color: #1a1a1a; }
    .recap-item-info small { color: #888; font-size: 0.82rem; }
    .recap-item-price { color: #2E7D32; font-weight: 800; font-size: 0.95rem; white-space: nowrap; }

    /* ── Code promo ── */
    .promo-row {
      display: flex; gap: 10px; margin-bottom: 8px;
    }
    .promo-row input {
      flex: 1; padding: 12px 16px;
      border: 2px solid #E0D5C0; border-radius: 12px;
      font-size: 0.9rem; font-family: 'Nunito', sans-serif; outline: none;
      transition: border-color 0.2s; text-transform: uppercase;
    }
    .promo-row input:focus { border-color: #2E7D32; }
    .promo-row button {
      padding: 12px 20px; background: #DAA520; color: #fff;
      border: none; border-radius: 12px; font-weight: 700;
      cursor: pointer; font-family: 'Nunito', sans-serif;
      transition: background 0.2s;
    }
    .promo-row button:hover { background: #A87A0A; }
    .promo-feedback { font-size: 0.84rem; font-weight: 700; margin-bottom: 16px; min-height: 20px; }
    .promo-ok { color: #2E7D32; }
    .promo-err { color: #e53935; }

    /* ── Totaux ── */
    .recap-totals {
      background: #f0faf0; border-radius: 14px; padding: 18px 20px;
      border: 1px solid #c8e6c9; margin-bottom: 24px;
    }
    .totals-line {
      display: flex; justify-content: space-between;
      font-size: 0.9rem; padding: 5px 0; color: #555;
    }
    .totals-line.discount strong { color: #e53935; }
    .totals-line.total {
      border-top: 2px solid #c8e6c9; margin-top: 8px; padding-top: 12px;
      font-size: 1.1rem; font-weight: 800; color: #2E7D32;
    }
    .totals-line.total strong { color: #2E7D32; font-size: 1.15rem; }

    /* ── Paiement ── */
    .payment-grid {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px;
      margin-bottom: 28px;
    }
    .payment-card {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 24px 16px;
      border: 2px solid #E0D5C0; border-radius: 16px;
      cursor: pointer; transition: all 0.25s; text-align: center;
      background: #fff;
    }
    .payment-card i { font-size: 1.8rem; color: #2E7D32; }
    .payment-card strong { font-size: 0.9rem; color: #1a1a1a; }
    .payment-card small { font-size: 0.76rem; color: #999; }
    .payment-card.active {
      border-color: #2E7D32; background: #f0faf0;
      box-shadow: 0 4px 14px rgba(46,125,50,0.2);
    }
    .payment-card:hover { border-color: #2E7D32; background: #f9fff9; }

    /* ── Résumé final ── */
    .final-summary { margin-bottom: 24px; }
    .final-summary-inner {
      background: #f9fafb; border-radius: 14px; padding: 20px 24px;
      border: 1px solid #E0D5C0;
    }
    .final-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 6px 0; font-size: 0.9rem; color: #555;
    }
    .final-row.discount strong { color: #e53935; }
    .final-row.big-total {
      border-top: 2px solid #E0D5C0; margin-top: 10px; padding-top: 12px;
      font-size: 1.1rem; font-weight: 800; color: #2E7D32;
    }
    .final-row.big-total strong { color: #2E7D32; font-size: 1.2rem; }
    .final-summary hr { border: none; border-top: 1px solid #E0D5C0; margin: 10px 0; }

    /* ── Status ── */
    .wizard-status {
      padding: 14px 20px; border-radius: 12px;
      font-weight: 700; font-size: 0.9rem;
      margin-bottom: 16px;
    }
    .wizard-status--error { background: #fff0f5; color: #e53935; border: 1.5px solid #f5a8c0; }
    .wizard-status--success { background: #e8f5e9; color: #2E7D32; border: 1.5px solid #a5d6a7; }

    /* ── Modals ── */
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.55);
      display: flex; align-items: center; justify-content: center;
      z-index: 10000; opacity: 0; transition: opacity 0.3s; padding: 20px;
    }
    .modal-overlay--show { opacity: 1; }
    .modal-box {
      background: #fff; border-radius: 24px; padding: 40px 36px;
      max-width: 440px; width: 100%;
      box-shadow: 0 24px 60px rgba(0,0,0,0.22);
      text-align: center;
      transform: scale(0.93); transition: transform 0.3s cubic-bezier(0.34,1.4,0.64,1);
    }
    .modal-overlay--show .modal-box { transform: scale(1); }
    .modal-confetti { font-size: 3rem; margin-bottom: 10px; animation: confettiBounce 0.7s ease; }
    @keyframes confettiBounce {
      0%   { transform: scale(0) rotate(-20deg); }
      80%  { transform: scale(1.15) rotate(5deg); }
      100% { transform: scale(1) rotate(0); }
    }
    .modal-success-icon i { font-size: 3rem; color: #2E7D32; margin-bottom: 12px; display: block; }
    .modal-box h3 { font-size: 1.4rem; font-weight: 800; margin-bottom: 10px; color: #1a1a1a; }
    .modal-box p  { font-size: 0.9rem; color: #666; margin-bottom: 6px; line-height: 1.6; }
    .modal-order-id { color: #888 !important; font-size: 0.85rem !important; }
    .modal-total-confirm { font-weight: 800; color: #2E7D32 !important; font-size: 1.05rem !important; margin-top: 12px !important; }
    .modal-actions { display: flex; gap: 12px; margin-top: 28px; justify-content: center; }
    .modal-btn {
      flex: 1; padding: 13px 18px; border-radius: 14px; border: none;
      font-weight: 700; font-size: 0.9rem; font-family: 'Nunito', sans-serif;
      cursor: pointer; transition: all 0.2s;
      display: inline-flex; align-items: center; justify-content: center; gap: 7px;
    }
    .modal-btn--success { background: #2E7D32; color: #fff; }
    .modal-btn--success:hover { background: #1B5E20; }

    /* ── Responsive ── */
    @media (max-width: 640px) {
      .wizard-container { padding: 24px 4% 60px; }
      .step-card { padding: 24px 20px; }
      .form-grid { grid-template-columns: 1fr; }
      .recap-client-grid { grid-template-columns: 1fr; }
      .payment-grid { grid-template-columns: 1fr 1fr; }
      .mode-selector { flex-direction: column; }
      .page-hero h1 { font-size: 2rem; }
      .progress-step span { font-size: 0.68rem; }
    }
  `;
  document.head.appendChild(s);
}

/* ============================================================
   INITIALISATION
   ============================================================ */
function init() {
  injectStyles();
  initBurger();
  initCartCheck();
  initStep1();
  initStep2();
  initStep3();
  showStep(1);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}