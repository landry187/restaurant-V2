const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.post('/', async (req, res) => {
  const {
    client_name, client_phone, date_res, heure_res,
    table_name, items, total, acompte
  } = req.body;

  if (!client_name || !client_phone || !date_res || !heure_res) {
    return res.status(400).json({ ok: false, message: 'Champs obligatoires manquants.' });
  }

  try {
    const platsJSON = JSON.stringify(items || []);
    const acompteVal = acompte || Math.round((total || 0) / 2);

    const [result] = await db.execute(
      `INSERT INTO reservations
        (nom, telephone, date_res, heure, table_name, plats, total, acompte)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [client_name, client_phone, date_res, heure_res,
       table_name || '', platsJSON, total || 0, acompteVal]
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