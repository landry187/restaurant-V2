/* =====================================================
   commande.js — La Camerounaise by Landry
   Connecté au serveur Node.js local
===================================================== */

// API_URL défini par api-config.js

/* ===== CATALOGUE IMAGES ===== */
const CATALOGUE = [
  { name:"Ndolé Royal",        price:5000, img:"images/ndole.jpg" },
  { name:"Poulet DG",          price:7000, img:"images/poulet.jpg" },
  { name:"Eru Traditionnel",   price:4000, img:"images/eru.jpg" },
  { name:"Ndolé",              price:3500, img:"images/ndole.jpg" },
  { name:"Eru & Water Fufu",   price:3000, img:"images/eru.jpg" },
  { name:"Jollof Camerounais", price:2500, img:"images/dg.jpg" },
  { name:"Koki",               price:2500, img:"images/koki.jpg" },
  { name:"Poisson Braisé",     price:4000, img:"images/poulet.jpg" },
  { name:"Plantain Frit",      price:800,  img:"images/koki.jpg" },
  { name:"Jus naturel",        price:1500, img:"images/koki.jpg" },
  { name:"Dessert maison",     price:2000, img:"images/koki.jpg" },
];

function getImg(name) {
  const found = CATALOGUE.find(c => c.name === name);
  return found ? found.img : "images/ndole.jpg";
}

/* ===== PANIER ===== */
let panier = JSON.parse(localStorage.getItem("panier")) || [];

/* ===== DOM ===== */
const cartItems       = document.getElementById('cartItems');
const subtotalEl      = document.getElementById('subtotal');
const deliveryPriceEl = document.getElementById('deliveryPrice');
const totalEl         = document.getElementById('total');
const promoBtn        = document.getElementById('promoBtn');
const discountEl      = document.getElementById('discount');
const confirmOrder    = document.getElementById('confirmOrder');
const historyGrid     = document.getElementById('historyGrid');
const deliveryCard    = document.getElementById('deliveryCard');
const placeCard       = document.getElementById('placeCard');
const locationSection = document.getElementById('locationSection');

/* ===== STATE ===== */
let subtotalValue = 0;
let deliveryFee   = 1000;
let reduction     = 0;
let orderNumber   = Number(localStorage.getItem("orderNumber")) || 2000;
let modePaiement  = 'Orange Money';

/* =====================================================
   TOAST
===================================================== */
function showToast(msg, type = 'success') {
  const old = document.getElementById('toast-notif');
  if (old) old.remove();
  const el = document.createElement('div');
  el.id = 'toast-notif';
  el.style.cssText = `
    position:fixed;bottom:30px;left:50%;transform:translateX(-50%);
    background:${type==='error'?'#e8336d':'#1a1a1a'};
    color:white;padding:14px 28px;border-radius:50px;
    font-family:'Nunito',sans-serif;font-weight:700;font-size:0.9rem;
    z-index:9999;box-shadow:0 6px 24px rgba(0,0,0,0.25);
    white-space:nowrap;pointer-events:none;
  `;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* =====================================================
   SAUVEGARDE
===================================================== */
function sauvegarder() {
  localStorage.setItem("panier", JSON.stringify(panier));
  updateBadgeFlottant();
}

/* =====================================================
   BADGE FLOTTANT
===================================================== */
function updateBadgeFlottant() {
  const count = panier.reduce((s, p) => s + p.qty, 0);
  let badge = document.getElementById('floating-cart');
  if (!badge) {
    badge = document.createElement('a');
    badge.id = 'floating-cart';
    badge.href = '#cartItems';
    badge.style.cssText = `
      position:fixed;bottom:28px;right:28px;
      background:#e8336d;color:white;
      width:54px;height:54px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-family:'Nunito',sans-serif;font-weight:900;font-size:1.1rem;
      box-shadow:0 6px 20px rgba(232,48,106,0.45);
      cursor:pointer;z-index:800;text-decoration:none;
      transition:transform .2s,opacity .2s;
    `;
    document.body.appendChild(badge);
  }
  badge.textContent = count > 0 ? count : '';
  badge.style.opacity   = count > 0 ? '1' : '0';
  badge.style.transform = count > 0 ? 'scale(1)' : 'scale(0)';
}

/* =====================================================
   AFFICHAGE PANIER
===================================================== */
function afficherPanier() {
  cartItems.innerHTML = '';
  subtotalValue = 0;

  if (panier.length === 0) {
    cartItems.innerHTML = `
      <div style="text-align:center;padding:50px 20px;color:#aaa;">
        <div style="font-size:3rem;margin-bottom:14px;">🛒</div>
        <p style="font-weight:700;color:#666;">Votre panier est vide</p>
        <p style="font-size:0.85rem;margin-top:8px;">
          Ajoutez des plats depuis le
          <a href="menu.html" style="color:#e8336d;font-weight:700;">menu</a>
          ou depuis la section ci-dessus
        </p>
      </div>`;
    updateTotal();
    return;
  }

  panier.forEach((plat, index) => {
    subtotalValue += plat.price * plat.qty;
    const imgSrc = plat.img || getImg(plat.name);
    const item = document.createElement('div');
    item.classList.add('cart-item');
    item.style.cssText = `
      display:flex;align-items:center;gap:16px;
      padding:16px 0;border-bottom:1px solid #f0f0f0;
    `;
    item.innerHTML = `
      <img src="${imgSrc}" alt="${plat.name}"
        style="width:64px;height:64px;border-radius:12px;object-fit:cover;flex-shrink:0;"
        onerror="this.style.display='none'">
      <div style="flex:1;min-width:0;">
        <h4 style="margin:0 0 4px;font-size:0.95rem;">${plat.name}</h4>
        <p style="color:#e8336d;font-weight:800;margin:0;">${(plat.price*plat.qty).toLocaleString('fr-FR')} FCFA</p>
        <p style="color:#aaa;font-size:0.78rem;margin:2px 0 0;">${plat.price.toLocaleString('fr-FR')} FCFA / unité</p>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
        <button class="qty-minus" data-index="${index}"
          style="width:30px;height:30px;border:1.5px solid #e8336d;border-radius:50%;
          background:white;color:#e8336d;font-weight:900;cursor:pointer;font-size:1.1rem;">−</button>
        <span style="font-weight:800;min-width:22px;text-align:center;">${plat.qty}</span>
        <button class="qty-plus" data-index="${index}"
          style="width:30px;height:30px;border:none;border-radius:50%;
          background:#e8336d;color:white;font-weight:900;cursor:pointer;font-size:1.1rem;">+</button>
        <button class="remove-btn" data-index="${index}"
          style="width:30px;height:30px;border:none;border-radius:50%;
          background:#fff0f5;color:#e8336d;cursor:pointer;font-size:0.9rem;margin-left:4px;">✕</button>
      </div>
    `;
    cartItems.appendChild(item);
  });

  cartItems.querySelectorAll('.qty-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = +btn.dataset.index;
      panier[i].qty--;
      if (panier[i].qty <= 0) panier.splice(i, 1);
      sauvegarder(); afficherPanier();
    });
  });
  cartItems.querySelectorAll('.qty-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      panier[+btn.dataset.index].qty++;
      sauvegarder(); afficherPanier();
    });
  });
  cartItems.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const nom = panier[+btn.dataset.index].name;
      panier.splice(+btn.dataset.index, 1);
      sauvegarder(); afficherPanier();
      showToast(`🗑️ ${nom} retiré`);
    });
  });

  updateTotal();
}

/* =====================================================
   BOUTONS AJOUTER (menu local)
===================================================== */
function initAddButtons() {
  document.querySelectorAll('.add-btn').forEach(button => {
    button.addEventListener('click', () => {
      const name  = button.dataset.name;
      const price = Number(button.dataset.price);
      const img   = getImg(name);
      const exist = panier.find(p => p.name === name);
      if (exist) { exist.qty++; } else { panier.push({ name, price, img, qty:1 }); }
      sauvegarder(); afficherPanier();
      const orig = button.textContent;
      button.textContent = '✓ Ajouté !';
      button.style.background = '#35c66b';
      setTimeout(() => { button.textContent=orig; button.style.background=''; }, 1400);
      showToast(`✅ ${name} ajouté au panier`);
      document.querySelector('.cart-section')?.scrollIntoView({behavior:'smooth',block:'start'});
    });
  });
}

/* =====================================================
   SUGGESTIONS
===================================================== */
function initSuggestions() {
  document.querySelectorAll('.suggestion-card').forEach(card => {
    const h3    = card.querySelector('h3');
    const price = card.querySelector('strong');
    if (!h3 || !price || card.querySelector('.sugg-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'sugg-btn';
    btn.textContent = '+ Ajouter';
    btn.style.cssText = `margin-top:14px;width:100%;height:40px;border:none;
      border-radius:10px;background:#e8336d;color:white;
      font-weight:700;cursor:pointer;font-family:'Nunito',sans-serif;`;
    card.appendChild(btn);
    btn.addEventListener('click', () => {
      const name = h3.textContent.trim();
      const p    = parseInt(price.textContent.replace(/[^0-9]/g,''));
      const exist = panier.find(x => x.name === name);
      if (exist) { exist.qty++; } else { panier.push({ name, price:p, img:getImg(name), qty:1 }); }
      sauvegarder(); afficherPanier();
      showToast(`✅ ${name} ajouté !`);
    });
  });
}

/* =====================================================
   MODE LIVRAISON
===================================================== */
deliveryCard.addEventListener('click', () => {
  deliveryCard.classList.add('active');
  placeCard.classList.remove('active');
  locationSection.style.display = 'block';
  deliveryFee = 1000;
  updateTotal();
});
placeCard.addEventListener('click', () => {
  placeCard.classList.add('active');
  deliveryCard.classList.remove('active');
  locationSection.style.display = 'none';
  deliveryFee = 0;
  updateTotal();
});

/* =====================================================
   TOTAL
===================================================== */
function updateTotal() {
  subtotalEl.textContent      = subtotalValue.toLocaleString('fr-FR') + ' FCFA';
  deliveryPriceEl.textContent = deliveryFee.toLocaleString('fr-FR') + ' FCFA';
  const final = Math.max(0, subtotalValue + deliveryFee - reduction);
  totalEl.textContent = final.toLocaleString('fr-FR') + ' FCFA';
}

/* ===== PROMO ===== */
const PROMOS = { 'LANDRY10':2000, 'BIENVENUE':1000, 'CAMEROUN':1500 };
promoBtn.addEventListener('click', () => {
  const input = document.getElementById('promoInput');
  const code  = input.value.trim().toUpperCase();
  if (PROMOS[code]) {
    reduction = PROMOS[code];
    discountEl.textContent = '-' + reduction.toLocaleString('fr-FR') + ' FCFA';
    input.style.border = '2px solid #35c66b';
    updateTotal();
    showToast(`🎉 Réduction de ${reduction.toLocaleString('fr-FR')} FCFA appliquée !`);
  } else {
    input.style.border = '2px solid #e8336d';
    showToast('❌ Code promo invalide', 'error');
  }
});

/* ===== PAIEMENT ===== */
document.querySelectorAll('.payment-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.payment-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    modePaiement = card.textContent.trim();
  });
});

/* =====================================================
   CONFIRMATION — ENVOI AU SERVEUR
===================================================== */
confirmOrder.addEventListener('click', async () => {
  if (subtotalValue === 0) {
    showToast('⚠️ Votre panier est vide', 'error'); return;
  }

  /* Vérifier adresse si livraison */
  let adresse = 'Sur place';
  if (locationSection.style.display !== 'none') {
    const adresseInput = locationSection.querySelector('input[type="text"]');
    if (adresseInput && adresseInput.value.trim() === '') {
      adresseInput.style.border = '2px solid #e8336d';
      adresseInput.focus();
      showToast('⚠️ Veuillez entrer votre adresse', 'error');
      return;
    }
    adresse = adresseInput ? adresseInput.value.trim() : 'Non renseignée';
  }

  /* Désactiver le bouton pendant l'envoi */
  confirmOrder.disabled = true;
  confirmOrder.textContent = '⏳ Envoi en cours…';

  try {
    /* Envoyer au serveur */
    const res = await fetch(`${window.API_URL}/commandes`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plats:    panier,
        total:    totalEl.textContent,
        mode:     deliveryFee > 0 ? 'livraison' : 'sur place',
        adresse,
        paiement: modePaiement
      })
    });

    const data = await res.json();

    if (data.ok) {
      /* Carte historique */
      const num  = data.id;
      const card = document.createElement('div');
      card.classList.add('history-card');
      card.innerHTML = `
        <h3 style="color:#e8336d;margin-bottom:10px;">Commande ${num}</h3>
        <ul style="list-style:none;padding:0;margin:0 0 10px;font-size:0.85rem;">
          ${panier.map(p=>`<li>${p.name} × ${p.qty} — ${(p.price*p.qty).toLocaleString('fr-FR')} FCFA</li>`).join('')}
        </ul>
        <p><span style="color:#e8336d;font-weight:700;">Total :</span> ${totalEl.textContent}</p>
        <p><span style="color:#e8336d;font-weight:700;">Mode :</span> ${deliveryFee>0?'🛵 Livraison':'🍽️ Sur place'}</p>
        <p><span style="color:#e8336d;font-weight:700;">Statut :</span> ✅ Confirmée</p>
        <p style="font-size:0.75rem;color:#aaa;margin-top:8px;">
          ${new Date().toLocaleDateString('fr-FR',{day:'2-digit',month:'long',hour:'2-digit',minute:'2-digit'})}
        </p>
      `;
      historyGrid.appendChild(card);

      /* Reset */
      panier    = [];
      reduction = 0;
      localStorage.setItem("orderNumber", orderNumber++);
      discountEl.textContent = '0 FCFA';
      document.getElementById('promoInput').value = '';
      sauvegarder(); afficherPanier(); updateTotal();
      showToast(`✅ ${data.message} 🎉`);
      setTimeout(() => historyGrid.scrollIntoView({behavior:'smooth'}), 500);

    } else {
      showToast('❌ ' + data.message, 'error');
    }

  } catch(e) {
    showToast('❌ Serveur non accessible. Lancez DEMARRER.bat !', 'error');
    console.error(e);
  } finally {
    confirmOrder.disabled = false;
    confirmOrder.textContent = 'Confirmer la commande';
  }
});

/* ===== VIDER PANIER ===== */
const viderBtn = document.getElementById('viderPanier');
if (viderBtn) {
  viderBtn.addEventListener('click', () => {
    if (!panier.length) return;
    panier = []; reduction = 0;
    discountEl.textContent = '0 FCFA';
    document.getElementById('promoInput').value = '';
    sauvegarder(); afficherPanier(); updateTotal();
    showToast('🗑️ Panier vidé');
  });
}

/* ===== SYNC localStorage ===== */
window.addEventListener('storage', (e) => {
  if (e.key === 'panier') {
    panier = JSON.parse(e.newValue) || [];
    afficherPanier(); updateBadgeFlottant();
  }
});

/* ===== INIT ===== */
initAddButtons();
initSuggestions();
afficherPanier();
updateTotal();
updateBadgeFlottant();