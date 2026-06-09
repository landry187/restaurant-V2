/* =====================================================
   panier-global.js — La Camerounaise by Landry
   Badge panier flottant sur toutes les pages
   À inclure dans : index.html, reservation.html,
                    contact.html, apropos.html
===================================================== */

(function() {
  function getPanierCount() {
    const panier = JSON.parse(localStorage.getItem('panier')) || [];
    return panier.reduce((s, p) => s + p.qty, 0);
  }

  function creerBadge() {
    /* Ne pas créer sur commande.html (déjà géré par commande.js) */
    if (window.location.pathname.includes('commande')) return;

    const count = getPanierCount();

    const badge = document.createElement('a');
    badge.id    = 'floating-cart-global';
    badge.href  = 'commande.html';
    badge.title = 'Voir mon panier';
    badge.style.cssText = `
      position:fixed;bottom:28px;right:28px;
      background:#008000;color:white;
      width:58px;height:58px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      flex-direction:column;gap:1px;
      font-family:'Nunito',sans-serif;font-weight:900;
      font-size:0.75rem;text-align:center;line-height:1.1;
      box-shadow:0 6px 22px rgba(232,48,106,0.5);
      text-decoration:none;
      z-index:800;
      transition:transform .25s, opacity .25s, box-shadow .25s;
      opacity:${count > 0 ? '1' : '0'};
      transform:${count > 0 ? 'scale(1)' : 'scale(0)'};
    `;
    badge.innerHTML = `
      <span style="font-size:1.3rem;line-height:1;">🛒</span>
      <span id="badge-count">${count > 0 ? count : ''}</span>
    `;
    badge.addEventListener('mouseenter', () => {
      badge.style.transform = 'scale(1.1)';
      badge.style.boxShadow = '0 10px 30px rgba(232,48,106,0.6)';
    });
    badge.addEventListener('mouseleave', () => {
      badge.style.transform = count > 0 ? 'scale(1)' : 'scale(0)';
      badge.style.boxShadow = '0 6px 22px rgba(232,48,106,0.5)';
    });
    document.body.appendChild(badge);
  }

  function mettreAJour() {
    const badge = document.getElementById('floating-cart-global');
    if (!badge) return;
    const count = getPanierCount();
    const countEl = badge.querySelector('#badge-count');
    if (countEl) countEl.textContent = count > 0 ? count : '';

    if (count > 0) {
      badge.style.opacity   = '1';
      badge.style.transform = 'scale(1)';
      /* Petite animation de rebond */
      badge.style.transition = 'transform .15s ease';
      badge.style.transform   = 'scale(1.2)';
      setTimeout(() => { badge.style.transform = 'scale(1)'; }, 150);
    } else {
      badge.style.opacity   = '0';
      badge.style.transform = 'scale(0)';
    }
  }

  /* Créer le badge au chargement */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', creerBadge);
  } else {
    creerBadge();
  }

  /* Écouter les changements localStorage (ex: ajout depuis menu.html) */
  window.addEventListener('storage', (e) => {
    if (e.key === 'panier') mettreAJour();
  });

  /* Vérifier toutes les 2s au cas où (même onglet) */
  let lastCount = getPanierCount();
  setInterval(() => {
    const current = getPanierCount();
    if (current !== lastCount) {
      lastCount = current;
      mettreAJour();
    }
  }, 1000);

})();