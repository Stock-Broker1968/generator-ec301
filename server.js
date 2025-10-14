// server.js
const express = require('express');
const path = require('path');
const cors = require('cors');
const { FPDF } = require('fpdf2');
const { Configuration, OpenAIApi } = require('openai');
const { PDFDocument } = require('pdf-lib');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de OpenAI
const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde /public
app.use(express.static(path.join(__dirname, 'public')));

// API: Pago simulado
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

// API: Generar clave de acceso
app.post('/api/generate-access-key', (_req, res) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = 'EC01-';
  for (let i = 0; i < 8; i++) {
    if (i === 4) key += '-';
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + 3);
  res.json({ success: true, accessKey: key, expiry: expiry.toISOString() });
});

// API: Registro de usuario simulado
app.post('/api/register-user', (req, res) => {
  const { name, email, whatsapp, accessKey } = req.body || {};
  if (!name || !email || !whatsapp || !/^EC01-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(accessKey || '')) {
    return res.status(400).json({ success: false, message: 'Datos inválidos o clave con formato incorrecto' });
  }
  res.json({ success: true, userId: 'USR-' + Date.now() });
});

// API Healthcheck
app.get('/api/health', (_req, res) => res.json({ status: 'OK', ts: new Date().toISOString() }));

// API: Generar evaluación diagnóstica PDF
app.post('/api/generate-diag-pdf', (req, res) => {
  const { encabezado, preguntas } = req.body;
  const pdf = new FPDF();
  pdf.addPage();
  pdf.setFont('Arial', 'B', 16).text('Evaluación Diagnóstica', 10, 10);
  pdf.setFont('Arial', '', 12);
  pdf.text(`Curso: ${encabezado.curso}`, 10, 20);
  pdf.text(`Instructor: ${encabezado.instructor}`, 10, 26);
  pdf.text(`Lugar: ${encabezado.lugar}`, 10, 32);
  pdf.text(`Duración: ${encabezado.duracion} hrs | Fecha: ${encabezado.fecha}`, 10, 38);
  pdf.ln(10);
  preguntas.forEach((q, i) => {
    pdf.multiCell(0, 6, `${i + 1}. ${q.texto}`);
    pdf.ln(2);
  });
  const buffer = pdf.output('arraybuffer');
  res.setHeader('Content-Type', 'application/pdf');
  res.send(Buffer.from(buffer));
});

// API: Generar evaluación formativa / sumativa / encuesta / asistencia / contrato / verificación
// (Implementados de manera similar, omitiendo aquí por brevedad)

// API: Recopilar respuestas para hoja unificada
app.post('/api/collect-responses', (req, res) => {
  // Simulación: en producción consulta tu BD real
  const header = { curso: 'Curso Ejemplo', instructor: 'Instructor Ejemplo', lugar: 'Lugar Ejemplo', fecha: '01/01/2025' };
  const diagnostica = [{ num: 1, correcta: 'a', texto: 'Pregunta diagnóstica 1' }];
  const sumativa   = [{ num: 1, correcta: 'b', texto: 'Pregunta sumativa 1' }];
  const formativaCotejo = [{ num: 1, descripcion: 'Criterio 1' }];
  const formativaGuia   = [{ num: 1, descripcion: 'Criterio observación 1', maxPuntos: 2 }];
  res.json({ header, diagnostica, sumativa, formativaCotejo, formativaGuia });
});

// API: Generar Hoja de Respuestas Unificada
app.post('/api/generate-unified-sheet', async (req, res) => {
  const { header, diagnostica, sumativa, formativaCotejo, formativaGuia } = req.body;
  // Crear PDF base
  const pdf = new FPDF();
  pdf.addPage();
  pdf.setFont('Arial','B',16).cell(0,10,'Hoja de Respuestas Unificada',0,1,'C');
  pdf.setFont('Arial','',12);
  ['curso','instructor','lugar','fecha'].forEach(key => {
    pdf.cell(0,6,`${key.charAt(0).toUpperCase() + key.slice(1)}: ${header[key]}`,0,1);
  });
  pdf.ln(4);
  // Sumativa
  pdf.setFont('Arial','B',14).cell(0,6,'Respuestas Sumativa',0,1);
  pdf.setFont('Arial','',12);
  sumativa.forEach(r => pdf.cell(0,6,`${r.num}. ${r.correcta}) ${r.texto}`,0,1));
  pdf.ln(4);
  // Formativa – Lista de Cotejo
  pdf.setFont('Arial','B',14).cell(0,6,'Criterios Logro (Lista de Cotejo)',0,1);
  pdf.setFont('Arial','',12);
  formativaCotejo.forEach(r => pdf.cell(0,6,`* ${r.descripcion} → Resultado Esperado: Sí`,0,1));
  pdf.ln(4);
  // Formativa – Guía
  pdf.setFont('Arial','B',14).cell(0,6,'Criterios Logro (Guía de Observación)',0,1);
  pdf.setFont('Arial','',12);
  formativaGuia.forEach(r => pdf.cell(0,6,`* ${r.descripcion} → Logro Máximo (${r.maxPuntos} pts)`,0,1));
  pdf.ln(4);
  // Diagnóstica
  pdf.setFont('Arial','B',14).cell(0,6,'Respuestas Diagnóstica',0,1);
  pdf.setFont('Arial','',12);
  diagnostica.forEach(r => pdf.cell(0,6,`${r.num}. ${r.correcta}) ${r.texto}`,0,1));
  // Enviar PDF
  const buffer = pdf.output('arraybuffer');
  res.setHeader('Content-Type','application/pdf');
  res.send(Buffer.from(buffer));
});

// Fallback: SPA
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Arrancar servidor
app.listen(PORT, () => console.log(`EC0301 Pro escuchando en ${PORT}`));

