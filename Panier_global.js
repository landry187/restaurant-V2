/* =====================================================
   panier.js — LA CAMEROUNAISE BY LANDRY
   Gestionnaire de panier UNIQUE partagé entre :
     menu.html, commande.html, reservation.html
     et toutes les autres pages.

   Clé localStorage unifiée : "lcbl_panier"
   (remplace l'ancienne "panier" et "lcbl_cart")

   API publique :
     Panier.ajouter(id, qty?)
     Panier.retirer(id, qty?)
     Panier.setQty(id, qty)
     Panier.vider()
     Panier.items()          → [{plat, qty}]
     Panier.total()          → number
     Panier.count()          → nombre d'articles
     Panier.onUpdate(fn)     → abonnement aux changements
===================================================== */

(function() {
  'use strict';

  const CLE = 'lcbl_panier';
  const listeners = [];

  /* ── Lecture / écriture ── */
  function lire() {
    try {
      return JSON.parse(localStorage.getItem(CLE)) || [];
    } catch(e) { return []; }
  }

  function ecrire(items) {
    localStorage.setItem(CLE, JSON.stringify(items));
    /* Compatibilité avec l'ancienne clé "panier" utilisée par Panier_global.js */
    const legacy = items.map(i => ({ qty: i.qty, id: i.id }));
    localStorage.setItem('panier', JSON.stringify(legacy));
    _notifier(items);
  }

  function _notifier(items) {
    listeners.forEach(fn => { try { fn(items); } catch(e) {} });
  }

  /* ── Ajouter ── */
  function ajouter(id, qty) {
    qty = qty || 1;
    const plat = (window.CATALOGUE_BY_ID || {})[id];
    if (!plat) { console.warn('[Panier] Plat introuvable id=', id); return; }

    const items = lire();
    const existant = items.find(i => i.id === id);
    if (existant) {
      existant.qty += qty;
    } else {
      items.push({ id, qty });
    }
    ecrire(items);
  }

  /* ── Retirer (diminuer qty ou supprimer) ── */
  function retirer(id, qty) {
    qty = qty || 1;
    const items = lire();
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return;
    items[idx].qty -= qty;
    if (items[idx].qty <= 0) items.splice(idx, 1);
    ecrire(items);
  }

  /* ── Fixer la quantité exacte ── */
  function setQty(id, qty) {
    const items = lire();
    const idx = items.findIndex(i => i.id === id);
    if (qty <= 0) {
      if (idx !== -1) items.splice(idx, 1);
    } else {
      if (idx !== -1) { items[idx].qty = qty; }
      else {
        const plat = (window.CATALOGUE_BY_ID || {})[id];
        if (plat) items.push({ id, qty });
      }
    }
    ecrire(items);
  }

  /* ── Vider ── */
  function vider() {
    ecrire([]);
  }

  /* ── Données enrichies ── */
  function items() {
    const raw = lire();
    return raw.map(i => ({
      plat: (window.CATALOGUE_BY_ID || {})[i.id] || null,
      qty: i.qty,
      id: i.id
    })).filter(i => i.plat !== null);
  }

  /* ── Totaux ── */
  function total() {
    return items().reduce((s, i) => s + i.plat.prix * i.qty, 0);
  }

  function count() {
    return lire().reduce((s, i) => s + i.qty, 0);
  }

  /* ── Abonnement ── */
  function onUpdate(fn) {
    listeners.push(fn);
  }

  /* ── Écouter les changements depuis d'autres onglets ── */
  window.addEventListener('storage', (e) => {
    if (e.key === CLE) _notifier(lire());
  });

  /* ── Exposition publique ── */
  window.Panier = { ajouter, retirer, setQty, vider, items, total, count, onUpdate };

  /* ── Badge flottant universel ── */
  function creerBadgeFlottant() {
    if (document.getElementById('panier-fab')) return;
    if (window.location.pathname.includes('commande')) return;
    if (window.location.pathname.includes('menu')) return;

    const fab = document.createElement('a');
    fab.id = 'panier-fab';
    fab.href = 'commande.html';
    fab.href = 'menu.html';
    fab.title = 'Voir mon panier';
    fab.innerHTML = `
      <span style="font-size:1.4rem;line-height:1;">🛒</span>
      <span id="panier-fab-count" style="
        position:absolute;top:-6px;right:-6px;
        background:#A87A0A;color:white;
        border-radius:50%;width:20px;height:20px;
        font-size:0.72rem;font-weight:900;
        display:flex;align-items:center;justify-content:center;
        font-family:sans-serif;
      ">0</span>
    `;
    fab.style.cssText = `
      position:fixed;bottom:28px;right:28px;
      background:green;color:white;
      width:58px;height:58px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 6px 22px rgba(0,128,0,0.45);
      text-decoration:none;z-index:800;
      transition:transform .25s,opacity .25s;
      opacity:0;transform:scale(0);
    `;
    document.body.appendChild(fab);

    fab.addEventListener('mouseenter', () => fab.style.transform = 'scale(1.1)');
    fab.addEventListener('mouseleave', () => {
      fab.style.transform = count() > 0 ? 'scale(1)' : 'scale(0)';
    });

    _mettreAJourBadge();
  }

  function _mettreAJourBadge() {
    const fab = document.getElementById('panier-fab');
    if (!fab) return;
    const n = count();
    const countEl = document.getElementById('panier-fab-count');
    if (countEl) countEl.textContent = n;

    if (n > 0) {
      fab.style.opacity = '1';
      fab.style.transform = 'scale(1)';
    } else {
      fab.style.opacity = '0';
      fab.style.transform = 'scale(0)';
    }
  }

  onUpdate(_mettreAJourBadge);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', creerBadgeFlottant);
  } else {
    creerBadgeFlottant();
  }

})();