/* ── Calcul du total selon les plats cochés ── */
const foods      = document.querySelectorAll('.food');
const totalPrice = document.getElementById('totalPrice');
const advancePrice = document.getElementById('advancePrice');

foods.forEach(food => {
  food.addEventListener('change', () => {
    let total = 0;
    foods.forEach(item => { if (item.checked) total += Number(item.value); });
    totalPrice.textContent   = total + ' FCFA';
    advancePrice.textContent = (total / 2) + ' FCFA';
  });
});

/* ── Sélection de table ── */
document.querySelectorAll('.reserve-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tableName = btn.closest('.table-card').dataset.table;
    document.getElementById('selectedTable').value = tableName;
    document.querySelectorAll('.table-card').forEach(c => c.style.outline = '');
    btn.closest('.table-card').style.outline = '3px solid #e8336d';
  });
});

/* ── Paiement actif ── */
document.querySelectorAll('.payment-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.payment-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
  });
});

/* ── Soumission du formulaire ── */
document.getElementById('reservationForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const platsChoisis = [];
  foods.forEach(f => { if (f.checked) platsChoisis.push(f.parentElement.textContent.trim()); });

  const paiementActif = document.querySelector('.payment-card.active');

  const data = {
    nom:        document.getElementById('clientName').value.trim(),
    telephone:  document.querySelector('input[type="tel"]').value.trim(),
    date_res:   document.querySelector('input[type="date"]').value,
    heure:      document.querySelector('input[type="time"]').value,
    table_name: document.getElementById('selectedTable').value,
    plats:      platsChoisis.join(', '),
    total:      parseInt(totalPrice.textContent) || 0,
    paiement:   paiementActif ? paiementActif.querySelector('p').textContent : 'Orange Money'
  };

  if (!data.nom || !data.telephone || !data.date_res || !data.heure) {
    alert('⚠️ Veuillez remplir tous les champs obligatoires.');
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
      totalPrice.textContent   = '0 FCFA';
      advancePrice.textContent = '0 FCFA';
    }

  } catch (err) {
    alert('❌ Serveur non accessible. Lance XAMPP et node server.js !');
    console.error(err);
  }
});

/* ── Burger menu ── */
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
      spans.forEach(s => { s.style.transform=''; s.style.opacity=''; });
    }
  });
}