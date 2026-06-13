/* ============================================================
   reservation.js — La Camerounaise by Landry
   Wizard 3 étapes : Infos & Table → Récap → Paiement
   Synchronisé avec Panier_global.js + catalogue.js
   ============================================================ */

'use strict';

const RESA_KEY = 'lcbl_reservations';

/* ─── État ─── */
let currentStep  = 1;
let selectedTable = '';
let selectedPay  = 'Orange Money';

/* ─── Burger menu ─── */
const burger     = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
if (burger && mobileMenu) {
  burger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    const spans = burger.querySelectorAll('span');
    if (open) {
      spans[0].style.transform = 'rotate(45deg) translate(5px,5px)';
      spans[1].style.opacity   = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px,-5px)';
    } else {
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    burger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  }));
}

/* ─── Date minimum = aujourd'hui ─── */
(function() {
  const d = new Date();
  const dateInp = document.getElementById('r-date');
  if (!dateInp) return;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const j = String(d.getDate()).padStart(2, '0');
  dateInp.min = `${y}-${m}-${j}`;
})();

/* ═══════════════════════════════════════════
   GARDE PANIER VIDE
═══════════════════════════════════════════ */
function checkPanier() {
  const items  = window.Panier ? window.Panier.items() : [];
  const guard  = document.getElementById('emptyGuard');
  const wizard = document.getElementById('wizardWrap');
  if (items.length === 0) {
    guard.classList.add('visible');
    wizard.classList.remove('visible');
  } else {
    guard.classList.remove('visible');
    wizard.classList.add('visible');
  }
}

if (window.Panier) window.Panier.onUpdate(checkPanier);

/* ═══════════════════════════════════════════
   STEPPER
═══════════════════════════════════════════ */
function goTo(step) {
  [1, 2, 3].forEach(n => {
    const panel = document.getElementById(`panel-${n}`);
    const ind   = document.getElementById(`step-ind-${n}`);
    if (!panel || !ind) return;
    panel.classList.toggle('active', n === step);
    ind.classList.remove('active', 'done');
    if (n < step)  ind.classList.add('done');
    if (n === step) ind.classList.add('active');
  });
  currentStep = step;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ═══════════════════════════════════════════
   UTILITAIRES
═══════════════════════════════════════════ */
function fmt(n) {
  return n.toLocaleString('fr-FR') + ' FCFA';
}

function formatDateFr(str) {
  if (!str) return '—';
  const jours = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  const mois  = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  const dt = new Date(str + 'T00:00:00');
  const [y, m, d] = str.split('-');
  return `${jours[dt.getDay()]} ${parseInt(d)} ${mois[parseInt(m)-1]} ${y}`;
}

function formatHeureFr(str) {
  if (!str) return '—';
  const [h, min] = str.split(':');
  return `${h}h${min}`;
}

function heureFermeture(dateStr) {
  if (!dateStr) return '22:00';
  const day = new Date(dateStr + 'T00:00:00').getDay();
  return (day === 0 || day === 6) ? '23:00' : '22:00';
}

function getReservationsLocales() {
  try { return JSON.parse(localStorage.getItem(RESA_KEY) || '[]'); }
  catch(e) { return []; }
}

/* ═══════════════════════════════════════════
   DISPONIBILITÉ DES TABLES
═══════════════════════════════════════════ */
function updateTablesAvailability() {
  const dateStr = (document.getElementById('r-date') || {}).value || '';
  const heure   = (document.getElementById('r-heure') || {}).value || '';
  const occupations = getReservationsLocales().filter(r => r.date_res === dateStr);

  const cards = document.querySelectorAll('.table-wiz');
  cards.forEach(card => {
    const name = card.dataset.table;
    const badge = card.querySelector('.tw-badge');

    const indispo = !!(dateStr && heure) &&
      occupations.some(r => r.table_name === name && r.heure_res === heure);

    card.classList.toggle('unavailable', indispo);

    if (indispo) {
      badge.textContent = 'Occupée';
      badge.style.background = '#fce4e4';
      badge.style.color = '#e53935';
      if (selectedTable === name) {
        selectedTable = '';
        document.getElementById('r-table').value = '';
        card.classList.remove('selected');
      }
    } else {
      const isSelected = selectedTable === name;
      badge.textContent = isSelected ? '✓ Sélectionnée' : 'Disponible';
      badge.style.background = '';
      badge.style.color = '';
    }
  });

  // Mettre à jour max heure selon le jour
  const heureInp = document.getElementById('r-heure');
  if (heureInp && dateStr) heureInp.max = heureFermeture(dateStr);
}

/* Clic sur une table */
document.querySelectorAll('.table-wiz').forEach(card => {
  card.addEventListener('click', () => {
    if (card.classList.contains('unavailable')) return;
    const name = card.dataset.table;
    selectedTable = name;
    document.getElementById('r-table').value = name;
    setErr('r-table', 'err-r-table', '');

    document.querySelectorAll('.table-wiz').forEach(c => {
      const b = c.querySelector('.tw-badge');
      c.classList.remove('selected');
      if (!c.classList.contains('unavailable')) {
        b.textContent = 'Disponible';
        b.style.background = '';
        b.style.color = '';
      }
    });
    card.classList.add('selected');
    const badge = card.querySelector('.tw-badge');
    badge.textContent = '✓ Sélectionnée';
  });
});

/* Réagir aux changements de date/heure */
['r-date', 'r-heure'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('change', updateTablesAvailability);
});

/* ═══════════════════════════════════════════
   VALIDATION ÉTAPE 1
═══════════════════════════════════════════ */
function setErr(id, errId, msg) {
  const el  = document.getElementById(id);
  const err = document.getElementById(errId);
  if (!err) return !msg;
  err.textContent = msg;
  if (el) el.classList.toggle('err', !!msg);
  return !msg;
}

function validateStep1() {
  const nom    = document.getElementById('r-nom').value.trim();
  const tel    = document.getElementById('r-tel').value.trim().replace(/[\s.-]/g, '');
  const guests = document.getElementById('r-guests').value;
  const date   = document.getElementById('r-date').value;
  const heure  = document.getElementById('r-heure').value;
  const table  = document.getElementById('r-table').value;

  let ok = true;

  ok &= setErr('r-nom',    'err-r-nom',    nom    ? '' : 'Votre nom est requis.');
  ok &= setErr('r-tel',    'err-r-tel',    /^(?:\+?237)?6\d{8}$/.test(tel) ? '' : 'Numéro invalide (ex : 6XX XXX XXX).');
  ok &= setErr('r-guests', 'err-r-guests', guests ? '' : 'Veuillez indiquer le nombre de personnes.');

  if (!date) {
    ok &= setErr('r-date', 'err-r-date', 'Veuillez choisir une date.');
  } else {
    const today = new Date(); today.setHours(0,0,0,0);
    const chosen = new Date(date + 'T00:00:00');
    ok &= setErr('r-date', 'err-r-date', chosen >= today ? '' : 'La date ne peut pas être dans le passé.');
  }

  if (!heure) {
    ok &= setErr('r-heure', 'err-r-heure', 'Veuillez choisir une heure.');
  } else {
    const fermeture = heureFermeture(date);
    const heureOk = heure >= '10:00' && heure <= fermeture;
    ok &= setErr('r-heure', 'err-r-heure',
      heureOk ? '' : `Horaires : 10h00 – ${fermeture.replace(':', 'h')}.`);
  }

  ok &= setErr('r-table', 'err-r-table', table ? '' : 'Veuillez sélectionner une table ci-dessus.');

  return !!ok;
}

/* ═══════════════════════════════════════════
   REMPLISSAGE ÉTAPE 2
═══════════════════════════════════════════ */
function fillRecap() {
  const nom    = document.getElementById('r-nom').value.trim();
  const tel    = document.getElementById('r-tel').value.trim();
  const guests = document.getElementById('r-guests').value;
  const date   = document.getElementById('r-date').value;
  const heure  = document.getElementById('r-heure').value;
  const table  = document.getElementById('r-table').value;

  document.getElementById('recap-nom').textContent    = nom    || '—';
  document.getElementById('recap-tel').textContent    = tel    || '—';
  document.getElementById('recap-guests').textContent = guests ? `${guests} personne(s)` : '—';
  document.getElementById('recap-table').textContent  = table  || '—';
  document.getElementById('recap-date').textContent   = formatDateFr(date);
  document.getElementById('recap-heure').textContent  = formatHeureFr(heure);

  // Plats du panier
  const items = window.Panier ? window.Panier.items() : [];
  const list  = document.getElementById('cartRecapList');
  if (items.length === 0) {
    list.innerHTML = '<div class="cart-empty-msg">Aucun plat — <a href="menu.html">Ajouter des plats</a></div>';
  } else {
    list.innerHTML = items.map(({ plat, qty }) => `
      <div class="cart-recap-item">
        ${plat.img
          ? `<img src="${plat.img}" alt="${plat.nom}" class="cart-recap-thumb">`
          : `<div class="cart-recap-thumb-icon"><i class="fas fa-utensils"></i></div>`
        }
        <div>
          <div class="cart-recap-name">${plat.nom}</div>
          <div class="cart-recap-qty">× ${qty}</div>
        </div>
        <div class="cart-recap-price">${fmt(plat.prix * qty)}</div>
      </div>
    `).join('');
  }

  updateTotauxDisplay();
}

function calcTotal() {
  const items = window.Panier ? window.Panier.items() : [];
  return items.reduce((s, i) => s + i.plat.prix * i.qty, 0);
}

function updateTotauxDisplay() {
  const total   = calcTotal();
  const acompte = Math.round(total * 0.5);

  ['rc-total-plats','rc-total','pay-total-plats','pay-total'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = fmt(total);
  });
  ['rc-acompte','pay-acompte'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = fmt(acompte);
  });
}

/* ═══════════════════════════════════════════
   SÉLECTION PAIEMENT
═══════════════════════════════════════════ */
document.querySelectorAll('.pay-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.pay-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    selectedPay = card.dataset.pay;
  });
});

/* ═══════════════════════════════════════════
   NAVIGATION ÉTAPES
═══════════════════════════════════════════ */
document.getElementById('btnNext1').addEventListener('click', () => {
  if (!validateStep1()) return;
  fillRecap();
  goTo(2);
});

document.getElementById('btnPrev2').addEventListener('click', () => goTo(1));
document.getElementById('btnNext2').addEventListener('click', () => {
  updateTotauxDisplay();
  goTo(3);
});
document.getElementById('btnPrev3').addEventListener('click', () => goTo(2));

/* ═══════════════════════════════════════════
   CONFIRMATION RÉSERVATION
═══════════════════════════════════════════ */
document.getElementById('btnConfirm').addEventListener('click', async () => {
  const btn = document.getElementById('btnConfirm');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours…';

  const items  = window.Panier ? window.Panier.items() : [];
  const total  = calcTotal();
  const acompte = Math.round(total * 0.5);
  const nom    = document.getElementById('r-nom').value.trim();
  const tel    = document.getElementById('r-tel').value.trim();
  const guests = document.getElementById('r-guests').value;
  const date   = document.getElementById('r-date').value;
  const heure  = document.getElementById('r-heure').value;
  const table  = document.getElementById('r-table').value;

  const ref = 'RES-' + Date.now().toString().slice(-6);

  const payload = {
    ref,
    client_name:  nom,
    client_phone: tel,
    guests:       parseInt(guests),
    table_name:   table,
    date_res:     date,
    heure_res:    heure,
    payment:      selectedPay,
    total,
    acompte,
    items: items.map(i => ({ id: i.plat.id, nom: i.plat.nom, prix: i.plat.prix, qty: i.qty })),
    created_at:   new Date().toISOString()
  };

  /* Sauvegarde locale */
  try {
    const hist = getReservationsLocales();
    hist.unshift(payload);
    localStorage.setItem(RESA_KEY, JSON.stringify(hist.slice(0, 50)));
  } catch(e) {}

  /* Envoi serveur (optionnel) */
  try {
    await fetch(`${window.API_URL || 'http://localhost:3000'}/reservations`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch(e) { /* serveur non dispo, on continue */ }

  /* Vider le panier */
  if (window.Panier) window.Panier.vider();

  /* Afficher la modale */
  document.getElementById('confirmRef').textContent = ref;
  document.getElementById('confirmDetails').innerHTML =
    `Nom : <strong>${nom}</strong> — Table : <strong>${table}</strong><br>` +
    `<strong>${formatDateFr(date)} à ${formatHeureFr(heure)}</strong> · ${guests} pers.<br>` +
    `Acompte via <strong>${selectedPay}</strong> : <strong>${fmt(acompte)}</strong>`;
  document.getElementById('confirmOverlay').classList.add('open');

  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-check-circle"></i> Confirmer la réservation';
});

document.getElementById('confirmClose').addEventListener('click', () => {
  window.location.href = 'index.html';
});

/* ═══════════════════════════════════════════
   INITIALISATION
═══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  checkPanier();
  goTo(1);
  updateTablesAvailability();
});