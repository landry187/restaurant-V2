const express = require('express');
const router  = express.Router();
const db      = require('../db');

// POST /reservation — Enregistrer une nouvelle réservation
router.post('/', async (req, res) => {
  const { nom, telephone, date_res, heure, table_name, plats, total } = req.body;

  // Vérification : les champs obligatoires sont-ils présents ?
  if (!nom || !telephone || !date_res || !heure) {
    return res.status(400).json({ ok: false, message: 'Champs obligatoires manquants.' });
  }

  try {
    const acompte = Math.round(total / 2);

    const [result] = await db.execute(
      `INSERT INTO reservations
        (nom, telephone, date_res, heure, table_name, plats, total, acompte)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nom, telephone, date_res, heure, table_name || '', plats || '', total || 0, acompte]
    );

    res.json({
      ok: true,
      message: `✅ Réservation confirmée ! Votre numéro : #${result.insertId}`,
      id: result.insertId
    });

  } catch (err) {
    console.error('Erreur réservation :', err.message);
    res.status(500).json({ ok: false, message: 'Erreur serveur. Réessayez.' });
  }
});

// GET /reservation — Lister toutes les réservations (pour le dashboard)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM reservations ORDER BY created_at DESC'
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;