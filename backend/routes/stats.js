const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', async (req, res) => {
  try {
    const [[{ commandes }]]      = await db.execute('SELECT COUNT(*) as commandes FROM commandes');
    const [[{ reservations }]]   = await db.execute('SELECT COUNT(*) as reservations FROM reservations');
    const [[{ messages }]]       = await db.execute('SELECT COUNT(*) as messages FROM messages');
    const [[{ messagesNonLus }]] = await db.execute('SELECT COUNT(*) as messagesNonLus FROM messages WHERE lu = 0');
    const [[{ chiffreAffaires }]]= await db.execute('SELECT COALESCE(SUM(total),0) as chiffreAffaires FROM commandes');

    res.json({
      ok: true,
      commandes,
      reservations,
      messages,
      messagesNonLus,
      chiffreAffaires: chiffreAffaires.toLocaleString('fr-FR') + ' FCFA'
    });

  } catch(err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;