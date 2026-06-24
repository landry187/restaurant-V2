const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const reservationsRouter = require('./routes/reservations');
const commandesRouter    = require('./routes/commandes');
const messagesRouter     = require('./routes/messages');
const statsRouter        = require('./routes/stats');

app.use('/reservation', reservationsRouter);
app.use('/commandes',   commandesRouter);
app.use('/messages',    messagesRouter);
app.use('/stats',       statsRouter);

app.get('/', (req, res) => {
  res.json({ message: '🍲 Serveur La Camerounaise by Landry — actif !' });
});

// Gestionnaire d'erreurs global (obligatoire avec Express 5)
app.use((err, req, res, next) => {
  console.error('Erreur Express:', err.message);
  res.status(500).json({ ok: false, message: 'Erreur serveur : ' + err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré → http://localhost:${PORT}`);
});