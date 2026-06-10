/* =====================================================
   commande-sync.js — LA CAMEROUNAISE BY LANDRY
   
   Pont entre le panier unifié (panier.js) et commande.js
   À inclure APRÈS catalogue.js + panier.js
   et AVANT commande.js dans commande.html
   
   Rôle : au chargement de commande.html, copie le contenu
   de window.Panier dans localStorage['lcbl_cart'] 
   (format attendu par commande.js) pour que les plats
   ajoutés depuis menu.html apparaissent automatiquement.
===================================================== */

(function() {
  'use strict';

  function syncPanierVersCommande() {
    if (!window.Panier || !window.CATALOGUE_BY_ID) return;

    const articles = window.Panier.items();
    if (articles.length === 0) return;

    /* Convertir au format attendu par commande.js */
    const cartCommande = articles.map(({ plat, qty }) => ({
      id:    '_sync_' + plat.id,
      name:  plat.nom,
      price: plat.prix,
      img:   plat.img || null,
      icon:  null,
      sub:   'Plat principal',
      qty
    }));

    /* Écrire dans la clé de commande.js */
    try {
      localStorage.setItem('lcbl_cart', JSON.stringify(cartCommande));
    } catch(e) {}
  }

  /* Synchroniser au chargement */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncPanierVersCommande);
  } else {
    syncPanierVersCommande();
  }

  /* Re-synchroniser si le panier change (autre onglet) */
  if (window.Panier) {
    window.Panier.onUpdate(function() {
      syncPanierVersCommande();
      /* Forcer un re-render du panier commande.js si dispo */
      if (typeof renderCart === 'function') renderCart();
    });
  }

})();