// server.js
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos desde /public
app.use(express.static(path.join(__dirname, 'public')));

// Healthcheck
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'OK',
    service: 'EC0301 Generator Pro',
    version: '3.0.0',
    timestamp: new Date().toISOString()
  });
});

// API simulada: procesar pago
app.post('/api/process-payment', (req, res) => {
  const { cardNumber, cardName, amount } = req.body || {};
  const clean = (cardNumber || '').replace(/\s/g, '');
  if (clean !== '4111111111111111') {
    return res.status(400).json({ success: false, message: 'Use la tarjeta de prueba 4111 1111 1111 1111' });
  }
  setTimeout(() => {
    res.json({
      success: true,
      transactionId: 'TXN-' + Date.now(),
      amount: amount || 2500,
      name: cardName || 'Test Card',
      timestamp: new Date().toISOString()
    });
  }, 1200);
});

// API simulada: generar clave
app.post('/api/generate-access-key', (_req, res) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = 'EC01-';
  for (let i = 0; i < 8; i++) {
    if (i === 4) key += '-';
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + 3);
  res.json({ success: true, accessKey: key, expiry: expiry.toISOString() });
});

// API simulada: registro
app.post('/api/register-user', (req, res) => {
  const { name, email, whatsapp, accessKey } = req.body || {};
  if (!name || !email || !whatsapp || !accessKey || !/^EC01-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(accessKey)) {
    return res.status(400).json({ success: false, message: 'Datos inválidos o clave con formato incorrecto' });
  }
  res.json({ success: true, userId: 'USR-' + Date.now() });
});

// Fallback: siempre servir index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`EC0301 Generator Pro listening on port ${PORT}`);
});
