/* =====================================================
   contact.js — La Camerounaise by Landry
   Burger / FAQ accordéon / Chips sujet / Formulaire
===================================================== */
'use strict';

/* ── Burger menu ── */
const burger     = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
if (burger && mobileMenu) {
  burger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    const [s1, s2, s3] = burger.querySelectorAll('span');
    if (open) {
      s1.style.transform = 'rotate(45deg) translate(5px,5px)';
      s2.style.opacity   = '0';
      s3.style.transform = 'rotate(-45deg) translate(5px,-5px)';
    } else {
      [s1, s2, s3].forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    burger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  }));
}

/* ── FAQ accordéon ── */
document.querySelectorAll('.faq-item').forEach(item => {
  const btn = item.querySelector('.faq-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    /* Fermer tous les autres */
    document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

/* ── Chips sujet ── */
document.querySelectorAll('.s-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.s-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const sujetInput = document.getElementById('cf-sujet');
    if (sujetInput) sujetInput.value = chip.dataset.val;
  });
});

/* ── Validation helpers ── */
function setErr(inputId, errId, msg) {
  const el  = document.getElementById(inputId);
  const err = document.getElementById(errId);
  if (err) err.textContent = msg;
  if (el)  el.style.borderColor = msg ? '#e53935' : '';
  return !msg;
}

function showStatus(msg, type) {
  const el = document.getElementById('form-status');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  el.style.cssText = `
    display:block; padding:14px 20px; border-radius:12px;
    font-weight:700; font-size:.9rem; margin-bottom:10px;
    background:${type === 'success' ? '#e8f5e9' : '#fff0f0'};
    color:${type === 'success' ? '#2e7d32' : '#e53935'};
    border:1.5px solid ${type === 'success' ? '#a5d6a7' : '#ffcdd2'};
  `;
  if (type === 'success') setTimeout(() => { el.style.display = 'none'; }, 7000);
}

/* ── Formulaire contact ── */
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const nom     = document.getElementById('cf-nom').value.trim();
    const email   = document.getElementById('cf-email').value.trim();
    const message = document.getElementById('cf-message').value.trim();

    let ok = true;
    ok &= setErr('cf-nom',     'err-nom',     nom     ? '' : 'Votre nom est requis.');
    ok &= setErr('cf-email',   'err-email',   /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Email invalide.');
    ok &= setErr('cf-message', 'err-message', message ? '' : 'Votre message est requis.');
    if (!ok) return;

    const btn   = document.getElementById('submitBtn');
    const btext = document.getElementById('btn-text');
    const bload = document.getElementById('btn-loader');
    btn.disabled = true;
    btext.style.display = 'none';
    bload.style.display = 'inline';

    try {
      const res = await fetch(`${window.API_URL || 'http://localhost:3000'}/messages`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_name:  nom,
          from_email: email,
          subject:    document.getElementById('cf-sujet').value.trim() || 'Contact site web',
          message
        })
      });
      const data = await res.json();
      if (data.ok) {
        showStatus('✅ Message envoyé ! Nous vous répondrons très bientôt.', 'success');
        contactForm.reset();
        document.querySelectorAll('.s-chip').forEach(c => c.classList.remove('active'));
      } else {
        showStatus('❌ ' + (data.message || 'Une erreur est survenue.'), 'error');
      }
    } catch(err) {
      showStatus('❌ Serveur non accessible. Lancez DEMARRER.bat !', 'error');
    } finally {
      btn.disabled = false;
      btext.style.display = 'inline';
      bload.style.display = 'none';
    }
  });
}