const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Estáticos desde /public
app.use(express.static(path.join(__dirname, 'public')));

// APIs simuladas
app.post('/api/process-payment', (req, res) => {
  const { cardNumber } = req.body || {};
  const clean = (cardNumber || '').replace(/\s/g, '');
  if (clean !== '4111111111111111') {
    return res.status(400).json({ success: false, message: 'Use 4111 1111 1111 1111' });
  }
  setTimeout(() => {
    res.json({ success: true, transactionId: 'TXN-' + Date.now(), amount: 2500 });
  }, 800);
});

app.post('/api/generate-access-key', (_req, res) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = 'EC01-';
  for (let i = 0; i < 8; i++) { if (i === 4) key += '-'; key += chars[Math.floor(Math.random() * chars.length)]; }
  const expiry = new Date(); expiry.setMonth(expiry.getMonth() + 3);
  res.json({ success: true, accessKey: key, expiry: expiry.toISOString() });
});

app.post('/api/register-user', (req, res) => {
  const { name, email, whatsapp, accessKey } = req.body || {};
  if (!name || !email || !whatsapp || !/^EC01-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(accessKey || '')) {
    return res.status(400).json({ success: false, message: 'Datos inválidos o clave con formato incorrecto' });
  }
  res.json({ success: true, userId: 'USR-' + Date.now() });
});

app.get('/api/health', (_req, res) => res.json({ status: 'OK', ts: new Date().toISOString() }));

// Fallback SPA
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log('EC0301 Pro escuchando en', PORT));
