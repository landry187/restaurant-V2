const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.post('/', async (req, res) => {
  const {
    // Format modal menu
    items, total_price, delivery_type, delivery_address,
    payment_method, client_name, client_phone,
    // Format page commande
    mode, adresse, total, paiement
  } = req.body;

  // Accepte les deux formats
  const finalItems    = items;
  const finalTotal    = total_price || total;
  const finalMode     = delivery_type || mode || 'livraison';
  const finalAdresse  = delivery_address || adresse || '';
  const finalPaiement = payment_method || paiement || 'Orange Money';

  if (!finalItems || !finalTotal) {
    return res.status(400).json({ ok: false, message: 'Panier vide ou total manquant.' });
  }

  try {
    const itemsJSON = JSON.stringify(finalItems);

    const [result] = await db.execute(
      `INSERT INTO commandes (mode, adresse, items, total, paiement)
       VALUES (?, ?, ?, ?, ?)`,
      [finalMode, finalAdresse, itemsJSON, finalTotal, finalPaiement]
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