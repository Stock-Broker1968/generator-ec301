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

// 1. Recopilar respuestas
app.post('/api/collect-responses', (req, res) => {
  const courseId = req.body.courseId;
  // Simula extracción de BD o in-memory
  const header = {/* curso,instructor,lugar,fecha extraídos de BD o localStorage */};
  const diagnostica = [ /* {num,correcta,texto} */ ];
  const sumativa   = [ /* {num,correcta,texto} */ ];
  const formativaCotejo = [ /* {num,descripcion} */ ];
  const formativaGuia   = [ /* {num,descripcion,maxPuntos} */ ];
  res.json({ header, diagnostica, sumativa, formativaCotejo, formativaGuia });
});

// 2. Generar PDF unificado
app.post('/api/generate-unified-sheet', (req, res) => {
  const { header, diagnostica, sumativa, formativaCotejo, formativaGuia } = req.body;
  const { FPDF } = require('fpdf2');
  const pdf = new FPDF();
  pdf.addPage();
  pdf.setFont('Arial','B',16);
  pdf.cell(0,10,'Hoja de Respuestas Unificada',0,1,'C');
  pdf.setFont('Arial','',12);
  // Encabezado
  ['curso','instructor','lugar','fecha'].forEach(key=>{
    pdf.cell(0,6,`${key.charAt(0).toUpperCase()+key.slice(1)}: ${header[key]}`,0,1);
  });
  pdf.ln(4);
  // Sumativa
  pdf.setFont('Arial','B',14).cell(0,6,'Respuestas Sumativa',0,1);
  pdf.setFont('Arial','',12);
  sumativa.forEach(r=>pdf.cell(0,6,`${r.num}. ${r.correcta}) ${r.texto}`,0,1));
  pdf.ln(4);
  // Formativa – Lista de Cotejo
  pdf.setFont('Arial','B',14).cell(0,6,'Criterios Logro (Lista de Cotejo)',0,1);
  pdf.setFont('Arial','',12);
  formativaCotejo.forEach(r=>pdf.cell(0,6,`* ${r.descripcion} → Resultado Esperado: Sí`,0,1));
  pdf.ln(4);
  // Formativa – Guía
  pdf.setFont('Arial','B',14).cell(0,6,'Criterios Logro (Guía de Observación)',0,1);
  pdf.setFont('Arial','',12);
  formativaGuia.forEach(r=>pdf.cell(0,6,`* ${r.descripcion} → Logro Máximo (${r.maxPuntos} pts)`,0,1));
  pdf.ln(4);
  // Diagnóstica
  pdf.setFont('Arial','B',14).cell(0,6,'Respuestas Diagnóstica',0,1);
  pdf.setFont('Arial','',12);
  diagnostica.forEach(r=>pdf.cell(0,6,`${r.num}. ${r.correcta}) ${r.texto}`,0,1));
  // Enviar PDF
  const buffer = pdf.output('arraybuffer');
  res.setHeader('Content-Type','application/pdf');
  res.send(Buffer.from(buffer));
});

