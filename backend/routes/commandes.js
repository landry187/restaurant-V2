const express = require('express');
const router  = express.Router();
const db      = require('../db');

// POST /commandes — Enregistrer une nouvelle commande
router.post('/', async (req, res) => {
  const { mode, adresse, items, total, paiement } = req.body;

  if (!items || !total) {
    return res.status(400).json({ ok: false, message: 'Panier vide ou total manquant.' });
  }

  try {
    const itemsJSON = JSON.stringify(items); // on stocke le panier en JSON

    const [result] = await db.execute(
      `INSERT INTO commandes (mode, adresse, items, total, paiement)
       VALUES (?, ?, ?, ?, ?)`,
      [mode || 'livraison', adresse || '', itemsJSON, total, paiement || 'Orange Money']
    );

    res.json({
      ok: true,
      message: `✅ Commande enregistrée ! Numéro : #${result.insertId}`,
      id: result.insertId
    });

  } catch (err) {
    console.error('Erreur commande :', err.message);
    res.status(500).json({ ok: false, message: 'Erreur serveur. Réessayez.' });
  }
});

// GET /commandes — Lister toutes les commandes (pour le dashboard)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM commandes ORDER BY created_at DESC'
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;