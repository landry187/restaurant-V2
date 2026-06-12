/* =====================================================
   reservation.js — LA CAMEROUNAISE BY LANDRY
   Connecté au panier partagé via panier.js + catalogue.js
===================================================== */

'use strict';

/* ── Burger menu ── */
const burgerBtn  = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
if (burgerBtn && mobileMenu) {
  burgerBtn.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    const spans = burgerBtn.querySelectorAll('span');
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
      burgerBtn.querySelectorAll('span').forEach(s => { s.style.transform=''; s.style.opacity=''; });
    });
  });
}

/* ─────────────────────────────────────────────
   RÉFÉRENCES & ÉTAT
───────────────────────────────────────────── */
const form          = document.getElementById('reservationForm');
const dateInput     = document.getElementById('reservationDate');
const heureInput    = document.getElementById('reservationTime');
const tableInput    = document.getElementById('selectedTable');
const confirmBtn    = document.getElementById('confirmBtn');
const btnText       = document.getElementById('confirm-btn-text');
const btnLoader     = document.getElementById('confirm-btn-loader');
const tableCards    = Array.from(document.querySelectorAll('.table-card'));
const TOTAL_TABLES  = tableCards.length;

const RESA_KEY = 'lcbl_reservations';

/* ─────────────────────────────────────────────
   UTILITAIRES
───────────────────────────────────────────── */
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getReservationsLocal() {
  try {
    return JSON.parse(localStorage.getItem(RESA_KEY) || '[]');
  } catch (e) { return []; }
}

/* Heure de fermeture selon le jour de la semaine choisi */
function heureFermeture(dateStr) {
  if (!dateStr) return '22:00';
  const day = new Date(dateStr + 'T00:00:00').getDay(); // 0 = dimanche, 6 = samedi
  return (day === 0 || day === 6) ? '23:00' : '22:00';
}

/* ─────────────────────────────────────────────
   VALIDATION DU FORMULAIRE (style contact.js)
───────────────────────────────────────────── */
function setError(inputId, errId, msg) {
  const el  = document.getElementById(inputId);
  const err = document.getElementById(errId);
  const group = el.closest('.form-group');
  err.textContent = msg;
  group.classList.toggle('has-error', !!msg);
  return !msg;
}

function validerNom() {
  const val = document.getElementById('clientName').value.trim();
  return setError('clientName', 'err-nom', val ? '' : 'Veuillez indiquer votre nom complet.');
}

function validerTelephone() {
  const raw = document.getElementById('clientPhone').value.trim();
  const clean = raw.replace(/[\s.-]/g, '');
  const ok = /^(?:\+?237)?6\d{8}$/.test(clean);
  return setError('clientPhone', 'err-tel', ok ? '' : 'Numéro invalide (ex : 6XX XXX XXX).');
}

function validerDate() {
  const val = dateInput.value;
  if (!val) return setError('reservationDate', 'err-date', 'Veuillez choisir une date.');
  if (val < todayStr()) return setError('reservationDate', 'err-date', 'La date ne peut pas être dans le passé.');
  return setError('reservationDate', 'err-date', '');
}

function validerHeure() {
  const val = heureInput.value;
  if (!val) return setError('reservationTime', 'err-heure', 'Veuillez choisir une heure.');
  const fermeture = heureFermeture(dateInput.value);
  if (val < '10:00' || val > fermeture) {
    return setError('reservationTime', 'err-heure', `Le restaurant est ouvert de 10h00 à ${fermeture.replace(':', 'h')}.`);
  }
  return setError('reservationTime', 'err-heure', '');
}

function validerTable() {
  const val = tableInput.value;
  return setError('selectedTable', 'err-table', val ? '' : 'Veuillez choisir une table disponible ci-dessus.');
}

/* Validation en direct */
document.getElementById('clientName').addEventListener('blur', validerNom);
document.getElementById('clientPhone').addEventListener('blur', validerTelephone);

/* ─────────────────────────────────────────────
   BANNIÈRE DE STATUT (#form-status)
───────────────────────────────────────────── */
function showStatus(msg, type) {
  const el = document.getElementById('form-status');
  el.textContent = msg;
  el.className = type; // 'success' | 'error'
  el.style.display = 'block';
  if (type === 'success') {
    setTimeout(() => { el.style.display = 'none'; }, 7000);
  }
}

/* ─────────────────────────────────────────────
   DISPONIBILITÉ DES TABLES
   Une table est "occupée" si une réservation existe
   pour la même table + même date + même heure.
───────────────────────────────────────────── */
function getOccupations(dateStr) {
  if (!dateStr) return [];
  return getReservationsLocal().filter(r => r.date_res === dateStr);
}

function updateTablesAvailability() {
  const dateStr = dateInput.value;
  const heure   = heureInput.value;
  const occupations = getOccupations(dateStr);

  tableCards.forEach(card => {
    const name  = card.dataset.table;
    const badge = card.querySelector('.table-badge');
    const btn   = card.querySelector('.reserve-btn');

    const indispo = !!(dateStr && heure) &&
      occupations.some(r => r.table_name === name && r.heure === heure);

    card.classList.toggle('is-unavailable', indispo);
    if (badge) badge.textContent = indispo ? 'Réservée' : 'Disponible';
    if (btn) btn.disabled = indispo;

    /* Si la table sélectionnée devient indisponible, on désélectionne */
    if (indispo && card.classList.contains('is-selected')) {
      card.classList.remove('is-selected');
      tableInput.value = '';
    }
  });

  updateStatusCounts(dateStr, heure, occupations);
}

function updateStatusCounts(dateStr, heure, occupations) {
  const avEl = document.getElementById('availableCount');
  const waEl = document.getElementById('waitingCount');
  const ocEl = document.getElementById('occupiedCount');
  if (!avEl || !waEl || !ocEl) return;

  const list = dateStr ? occupations : getOccupations(todayStr());

  let occupiedTables, waitingTables;
  if (heure) {
    occupiedTables = new Set(list.filter(r => r.heure === heure).map(r => r.table_name));
    waitingTables  = new Set(list.filter(r => r.heure !== heure).map(r => r.table_name));
  } else {
    occupiedTables = new Set(list.map(r => r.table_name));
    waitingTables  = new Set();
  }

  const occupied  = Math.min(occupiedTables.size, TOTAL_TABLES);
  const waiting   = Math.min(waitingTables.size, TOTAL_TABLES - occupied);
  const available = Math.max(0, TOTAL_TABLES - occupied);

  avEl.textContent = available;
  waEl.textContent = waiting;
  ocEl.textContent = occupied;
}

dateInput.addEventListener('change', () => { updateTablesAvailability(); validerDate(); validerHeure(); });
heureInput.addEventListener('change', () => { updateTablesAvailability(); validerHeure(); });

/* Date minimum = aujourd'hui */
dateInput.min = todayStr();

/* ─────────────────────────────────────────────
   SÉLECTION DE TABLE
───────────────────────────────────────────── */
tableCards.forEach(card => {
  const btn = card.querySelector('.reserve-btn');
  btn.addEventListener('click', () => {
    if (card.classList.contains('is-unavailable')) return;

    if (!dateInput.value || !heureInput.value) {
      showStatus('⚠️ Veuillez d\'abord choisir une date et une heure pour réserver une table.', 'error');
      dateInput.focus();
      return;
    }

    tableInput.value = card.dataset.table;
    tableCards.forEach(c => c.classList.remove('is-selected'));
    card.classList.add('is-selected');
    validerTable();
  });
});

/* ─────────────────────────────────────────────
   PAIEMENT — sélection au clic et au clavier
───────────────────────────────────────────── */
document.querySelectorAll('.payment-card').forEach(card => {
  function selectPayment() {
    document.querySelectorAll('.payment-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
  }
  card.addEventListener('click', selectPayment);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectPayment();
    }
  });
});

/* ─────────────────────────────────────────────
   RÉSUMÉ DU PANIER dans la page réservation
   Affiche les plats ajoutés depuis menu.html
───────────────────────────────────────────── */
function afficherPanierReservation() {
  const totalEl   = document.getElementById('totalPrice');
  const acompteEl = document.getElementById('advancePrice');

  const montant = window.Panier ? window.Panier.total() : 0;
  const articles = window.Panier ? window.Panier.items() : [];

  /* Mettre à jour les totaux */
  if (totalEl)   totalEl.textContent   = montant.toLocaleString('fr-FR') + ' FCFA';
  if (acompteEl) acompteEl.textContent = Math.ceil(montant / 2).toLocaleString('fr-FR') + ' FCFA';

  /* Afficher la liste des plats dans le résumé */
  let listeEl = document.getElementById('panier-liste-reservation');
  if (!listeEl) {
    /* Créer la liste juste avant le bloc payment-summary */
    const summary = document.querySelector('.payment-summary');
    if (summary) {
      listeEl = document.createElement('div');
      listeEl.id = 'panier-liste-reservation';
      listeEl.style.cssText = `
        background:#fff;border-radius:18px;padding:22px 26px;
        margin-bottom:16px;border:1.5px solid #d4edda;
      `;
      summary.insertAdjacentElement('beforebegin', listeEl);
    }
  }

  if (!listeEl) return;

  if (articles.length === 0) {
    listeEl.innerHTML = `
      <p style="text-align:center;color:#888;padding:10px 0;font-size:0.9rem;">
        🛒 Aucun plat dans votre panier.
        <a href="menu.html" style="color:green;font-weight:700;text-decoration:underline;">
          Ajouter des plats →
        </a>
      </p>
    `;
    return;
  }

  let html = `
    <h4 style="margin-bottom:14px;font-size:1rem;color:#1a1a1a;">
      🍽️ Votre commande (${articles.length} plat${articles.length > 1 ? 's' : ''})
    </h4>
    <ul style="list-style:none;padding:0;margin:0 0 10px;">
  `;

  articles.forEach(({ plat, qty }) => {
    const sous_total = (plat.prix * qty).toLocaleString('fr-FR');
    html += `
      <li style="
        display:flex;justify-content:space-between;align-items:center;
        padding:9px 0;border-bottom:1px solid #f0f0f0;font-size:0.88rem;
      ">
        <span>
          <strong>${plat.nom}</strong>
          <span style="color:#888;margin-left:6px;">× ${qty}</span>
        </span>
        <span style="font-weight:700;color:green;">${sous_total} FCFA</span>
      </li>
    `;
  });

  html += `</ul>
    <div style="display:flex;justify-content:flex-end;padding-top:8px;">
      <a href="menu.html" style="
        font-size:0.82rem;color:green;font-weight:700;
        text-decoration:underline;
      ">Modifier le panier →</a>
    </div>
  `;

  listeEl.innerHTML = html;
}

/* Appel initial + re-render si panier change */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', afficherPanierReservation);
} else {
  afficherPanierReservation();
}

if (window.Panier) {
  window.Panier.onUpdate(afficherPanierReservation);
}

/* ─────────────────────────────────────────────
   SOUMISSION DU FORMULAIRE
───────────────────────────────────────────── */
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const v1 = validerNom();
  const v2 = validerTelephone();
  const v3 = validerDate();
  const v4 = validerHeure();
  const v5 = validerTable();

  if (!v1 || !v2 || !v3 || !v4 || !v5) {
    showStatus('⚠️ Veuillez corriger les champs en rouge avant de continuer.', 'error');
    const firstError = form.querySelector('.has-error input');
    if (firstError) firstError.focus();
    return;
  }

  /* Vérification finale anti double-réservation */
  const occupations = getOccupations(dateInput.value);
  const conflit = occupations.some(r => r.table_name === tableInput.value && r.heure === heureInput.value);
  if (conflit) {
    showStatus('❌ Cette table vient d\'être réservée pour ce créneau. Merci d\'en choisir une autre.', 'error');
    updateTablesAvailability();
    return;
  }

  const articles = window.Panier ? window.Panier.items() : [];
  const platsStr = articles.map(({ plat, qty }) => `${plat.nom} ×${qty}`).join(', ');
  const montant  = window.Panier ? window.Panier.total() : 0;

  const paiementActif = document.querySelector('.payment-card.active p');

  const data = {
    nom:        document.getElementById('clientName').value.trim(),
    telephone:  document.getElementById('clientPhone').value.trim(),
    date_res:   dateInput.value,
    heure:      heureInput.value,
    table_name: tableInput.value,
    plats:      platsStr || 'Aucun plat sélectionné',
    total:      montant,
    paiement:   paiementActif ? paiementActif.textContent.trim() : 'Orange Money'
  };

  /* État de chargement du bouton */
  confirmBtn.disabled = true;
  btnText.style.display   = 'none';
  btnLoader.style.display = 'inline';

  /* Enregistrement local (historique + disponibilité des tables) */
  function enregistrerLocal() {
    const reservations = getReservationsLocal();
    reservations.unshift({
      id: Date.now(),
      ...data,
      date_creation: new Date().toISOString()
    });
    localStorage.setItem(RESA_KEY, JSON.stringify(reservations.slice(0, 50)));
  }

  function reinitialiserApresSucces(message) {
    enregistrerLocal();
    showStatus(message, 'success');
    form.reset();
    document.getElementById('clientName').value = '';
    tableCards.forEach(c => c.classList.remove('is-selected', 'has-error'));
    form.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-error'));
    form.querySelectorAll('.field-error').forEach(s => s.textContent = '');
    if (window.Panier) window.Panier.vider();
    afficherPanierReservation();
    afficherHistorique();
    updateTablesAvailability();
  }

  try {
    const res = await fetch(`${window.API_URL}/reservation`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data)
    });

    const result = await res.json();

    if (result.ok) {
      reinitialiserApresSucces('🎉 Réservation envoyée ! Notre équipe vous contactera pour confirmer le paiement de l\'acompte.');
    } else {
      showStatus('❌ ' + (result.message || 'Une erreur est survenue. Merci de réessayer.'), 'error');
    }

  } catch (err) {
    /* Pas de serveur disponible — confirmation locale */
    reinitialiserApresSucces('🎉 Réservation enregistrée ! (Mode hors-ligne) Notre équipe vous contactera pour confirmer le paiement de l\'acompte.');
  } finally {
    confirmBtn.disabled = false;
    btnText.style.display   = 'inline';
    btnLoader.style.display = 'none';
  }
});

/* ─────────────────────────────────────────────
   HISTORIQUE DES RÉSERVATIONS
───────────────────────────────────────────── */
function afficherHistorique() {
  const grid = document.getElementById('historyGrid');
  if (!grid) return;

  const reservations = getReservationsLocal();

  if (reservations.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;color:#888;padding:40px 20px;font-size:0.9rem;">
        Aucune réservation confirmée pour le moment.
      </div>
    `;
    return;
  }

  grid.innerHTML = reservations.map(r => {
    const date = new Date(r.date_creation).toLocaleDateString('fr-FR');
    return `
      <div class="history-card">
        <h3>${r.nom}</h3>
        <p>📅 ${r.date_res} à ${r.heure}</p>
        <p>🍽️ <span>${r.table_name}</span></p>
        <p>🥘 ${r.plats || '—'}</p>
        <p>💳 ${r.paiement || '—'}</p>
        <p>💰 Total : <span>${(r.total || 0).toLocaleString('fr-FR')} FCFA</span></p>
        <small style="color:#aaa;font-size:0.75rem;">Confirmée le ${date}</small>
      </div>
    `;
  }).join('');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', afficherHistorique);
} else {
  afficherHistorique();
}

/* ─────────────────────────────────────────────
   INITIALISATION
───────────────────────────────────────────── */
updateTablesAvailability();