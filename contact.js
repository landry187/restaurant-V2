/* =====================================================
   Script contact — remplace EmailJS par le serveur local
===================================================== */

// API_URL défini par api-config.js

/* ── Burger menu ── */
const burger     = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
burger.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  const [s1,s2,s3] = burger.querySelectorAll('span');
  if (open) {
    s1.style.transform = 'rotate(45deg) translate(5px,5px)';
    s2.style.opacity   = '0';
    s3.style.transform = 'rotate(-45deg) translate(5px,-5px)';
  } else {
    [s1,s2,s3].forEach(s => { s.style.transform=''; s.style.opacity=''; });
  }
});
mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  mobileMenu.classList.remove('open');
  burger.querySelectorAll('span').forEach(s => { s.style.transform=''; s.style.opacity=''; });
}));

/* ── Validation ── */
function valider(id, errId, msg) {
  const el  = document.getElementById(id);
  const err = document.getElementById(errId);
  if (!el.value.trim()) {
    err.textContent      = msg;
    el.style.borderColor = '#e8336d';
    return false;
  }
  err.textContent = '';
  el.style.borderColor = '';
  return true;
}
function validerEmail(id, errId) {
  const el  = document.getElementById(id);
  const err = document.getElementById(errId);
  const ok  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
  err.textContent      = ok ? '' : 'Adresse email invalide';
  el.style.borderColor = ok ? '' : '#e8336d';
  return ok;
}

/* ── Statut ── */
function showStatus(msg, type) {
  const el = document.getElementById('form-status');
  el.textContent   = msg;
  el.style.display = 'block';
  el.style.cssText = `
    display:block;padding:14px 20px;border-radius:12px;
    font-weight:700;font-size:0.9rem;margin-bottom:14px;
    background:${type==='success'?'#e8f5e9':'#fff0f5'};
    color:${type==='success'?'#2e7d32':'#e8336d'};
    border:1.5px solid ${type==='success'?'#a5d6a7':'#f5a8c0'};
  `;
  if (type === 'success') setTimeout(() => { el.style.display='none'; }, 6000);
}

/* ── Soumission → serveur local ── */
document.getElementById('contactForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const v1 = valider('cf-nom',     'err-nom',     'Votre nom est requis');
  const v2 = validerEmail('cf-email', 'err-email');
  const v3 = valider('cf-message', 'err-message', 'Votre message est requis');
  if (!v1 || !v2 || !v3) return;

  const btn   = document.getElementById('submitBtn');
  const btext = document.getElementById('btn-text');
  const bload = document.getElementById('btn-loader');
  btn.disabled        = true;
  btext.style.display = 'none';
  bload.style.display = 'inline';

  try {
    const res = await fetch(`${window.API_URL}/messages`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from_name:  document.getElementById('cf-nom').value.trim(),
        from_email: document.getElementById('cf-email').value.trim(),
        subject:    document.getElementById('cf-sujet').value.trim(),
        message:    document.getElementById('cf-message').value.trim()
      })
    });

    const data = await res.json();

    if (data.ok) {
      showStatus('✅ Message envoyé ! Nous vous répondrons très bientôt.', 'success');
      this.reset();
    } else {
      showStatus('❌ ' + data.message, 'error');
    }

  } catch(err) {
    showStatus('❌ Serveur non accessible. Lancez DEMARRER.bat !', 'error');
    console.error(err);
  } finally {
    btn.disabled        = false;
    btext.style.display = 'inline';
    bload.style.display = 'none';
  }
});