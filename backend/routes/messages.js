const express = require('express');
const router  = express.Router();
const db      = require('../db');

// POST /messages — Enregistrer un message de contact
router.post('/', async (req, res) => {
  const { from_name, from_email, subject, message } = req.body;

  if (!from_name || !from_email || !message) {
    return res.status(400).json({ ok: false, message: 'Nom, email et message sont requis.' });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO messages (nom, email, sujet, message)
       VALUES (?, ?, ?, ?)`,
      [from_name, from_email, subject || '', message]
    );

    res.json({
      ok: true,
      message: '✅ Message envoyé ! Nous vous répondrons très bientôt.',
      id: result.insertId
    });

  } catch (err) {
    console.error('Erreur message :', err.message);
    res.status(500).json({ ok: false, message: 'Erreur serveur. Réessayez.' });
  }
});

// GET /messages — Lister tous les messages (pour le dashboard)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM messages ORDER BY created_at DESC'
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});
// PATCH /messages/:id/lu — Marquer un message comme lu
router.patch('/:id/lu', async (req, res) => {
  try {
    await db.execute('UPDATE messages SET lu = 1 WHERE id = ?', [req.params.id]);
    res.json({ ok: true, message: 'Message marqué comme lu.' });
  } catch(err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});
module.exports = router;