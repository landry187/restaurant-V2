const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

// ── Middlewares ──────────────────────────────────────────
// CORS : autorise ton frontend (fichiers HTML) à appeler ce serveur
app.use(cors());

// Permet de lire le JSON envoyé par le frontend
app.use(express.json());

// ── Routes ───────────────────────────────────────────────
const reservationsRouter = require('./routes/reservations');
const commandesRouter    = require('./routes/commandes');
const messagesRouter     = require('./routes/messages');
const statsRouter = require('./routes/stats');

app.use('/reservation', reservationsRouter);
app.use('/commandes',   commandesRouter);
app.use('/messages',    messagesRouter);
app.use('/stats', statsRouter);

// ── Route de test ─────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: '🍲 Serveur La Camerounaise by Landry — actif !',
    routes: [
      'POST /reservation',
      'GET  /reservation',
      'POST /commandes',
      'GET  /commandes',
      'POST /messages',
      'GET  /messages',
    ]
  });
});

// ── Démarrage ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré → http://localhost:${PORT}`);
});