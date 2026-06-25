const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.post('/', async (req, res) => {
  const {
    // Format modal menu
    client_name, client_phone, reservation_date, reservation_time,
    table_name, payment_method, total_price, advance_amount, items,
    // Format page réservation
    nom, telephone, date_res, heure, total, acompte, plats
  } = req.body;

  // Accepte les deux formats
  const finalNom     = client_name || nom;
  const finalTel     = client_phone || telephone;
  const finalDate    = reservation_date || date_res;
  const finalHeure   = reservation_time || heure;
  const finalTable   = table_name || '';
  const finalTotal   = total_price || total || 0;
  const finalAcompte = advance_amount || acompte || Math.round(finalTotal * 0.5);
  const finalPlats   = items ? JSON.stringify(items) : (plats || '[]');

  if (!finalNom || !finalTel || !finalDate || !finalHeure) {
    return res.status(400).json({ ok: false, message: 'Champs obligatoires manquants.' });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO reservations (nom, telephone, date_res, heure, table_name, plats, total, acompte)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [finalNom, finalTel, finalDate, finalHeure, finalTable, finalPlats, finalTotal, finalAcompte]
    );

    res.json({
      ok: true,
      message: `✅ Réservation confirmée ! Numéro : #${result.insertId}`,
      id: result.insertId
    });

  } catch (err) {
    console.error('Erreur réservation :', err.message);
    res.status(500).json({ ok: false, message: 'Erreur serveur. Réessayez.' });
  }
});

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM reservations ORDER BY created_at DESC');
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;