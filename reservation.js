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

/* ── Sélection de table ── */
document.querySelectorAll('.reserve-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tableName = btn.closest('.table-card').dataset.table;
    document.getElementById('selectedTable').value = tableName;
    document.querySelectorAll('.table-card').forEach(c => c.style.outline = '');
    btn.closest('.table-card').style.outline = '3px solid green';
  });
});

/* ── Paiement actif ── */
document.querySelectorAll('.payment-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.payment-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
  });
});

/* ───────────────────────────────────────────────
   RÉSUMÉ DU PANIER dans la page réservation
   Affiche les plats ajoutés depuis menu.html
─────────────────────────────────────────────── */
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

/* ── Soumission du formulaire ── */
document.getElementById('reservationForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const articles = window.Panier ? window.Panier.items() : [];
  const platsStr = articles.map(({ plat, qty }) => `${plat.nom} ×${qty}`).join(', ');
  const montant  = window.Panier ? window.Panier.total() : 0;

  const paiementActif = document.querySelector('.payment-card.active p');

  const data = {
    nom:        document.getElementById('clientName').value.trim(),
    telephone:  document.querySelector('input[type="tel"]').value.trim(),
    date_res:   document.querySelector('input[type="date"]').value,
    heure:      document.querySelector('input[type="time"]').value,
    table_name: document.getElementById('selectedTable').value,
    plats:      platsStr || 'Aucun plat sélectionné',
    total:      montant,
    paiement:   paiementActif ? paiementActif.textContent : 'Orange Money'
  };

  if (!data.nom || !data.telephone || !data.date_res || !data.heure) {
    alert('⚠️ Veuillez remplir tous les champs obligatoires (nom, téléphone, date, heure).');
    return;
  }
  if (!data.table_name) {
    alert('⚠️ Veuillez sélectionner une table.');
    return;
  }

  try {
    const res = await fetch(`${window.API_URL}/reservation`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data)
    });

    const result = await res.json();
    alert(result.message);

    if (result.ok) {
      e.target.reset();
      if (window.Panier) window.Panier.vider();
      afficherPanierReservation();
    }

  } catch (err) {
    /* Fallback sans serveur — confirmation locale */
    const confirmLocal = confirm(
      `✅ Réservation prête !\n\n` +
      `Nom : ${data.nom}\nTéléphone : ${data.telephone}\n` +
      `Date : ${data.date_res} à ${data.heure}\nTable : ${data.table_name}\n` +
      `Plats : ${data.plats}\nTotal : ${montant.toLocaleString('fr-FR')} FCFA\n\n` +
      `Confirmer la réservation ?`
    );
    if (confirmLocal) {
      /* Sauvegarder en localStorage pour la section "historique" */
      const reservations = JSON.parse(localStorage.getItem('lcbl_reservations') || '[]');
      reservations.unshift({
        id: Date.now(),
        ...data,
        date_creation: new Date().toISOString()
      });
      localStorage.setItem('lcbl_reservations', JSON.stringify(reservations.slice(0, 20)));

      alert('🎉 Réservation confirmée ! Nous vous contacterons pour le paiement.');
      e.target.reset();
      if (window.Panier) window.Panier.vider();
      afficherPanierReservation();
      afficherHistorique();
    }
  }
});

/* ── Historique des réservations ── */
function afficherHistorique() {
  const grid = document.getElementById('historyGrid');
  if (!grid) return;

  const reservations = JSON.parse(localStorage.getItem('lcbl_reservations') || '[]');

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

/* ── Compteurs de tables (statiques pour l'instant) ── */
document.addEventListener('DOMContentLoaded', () => {
  const avEl = document.getElementById('availableCount');
  const waEl = document.getElementById('waitingCount');
  const ocEl = document.getElementById('occupiedCount');

  const reservations = JSON.parse(localStorage.getItem('lcbl_reservations') || '[]');
  const today = new Date().toISOString().slice(0, 10);
  const reservesAujourdHui = reservations.filter(r => r.date_res === today).length;

  if (avEl) avEl.textContent = Math.max(0, 3 - reservesAujourdHui);
  if (waEl) waEl.textContent = Math.min(reservesAujourdHui, 1);
  if (ocEl) ocEl.textContent = Math.max(0, reservesAujourdHui - 1);
});