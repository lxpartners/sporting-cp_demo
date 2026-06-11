require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();
app.use(cors());

// ── Webhook Stripe ANTES do express.json() ─────────────────────────────────
// O Stripe precisa do raw body para verificar a assinatura do webhook
app.use('/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  require('./routes/payments')
);

// JSON parsing para todas as outras rotas
app.use(express.json());

// ── Health check ───────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({
  status: 'ok',
  service: 'Sporting CP Demo API',
  stripe: !!process.env.STRIPE_SECRET_KEY,
}));

// ── Rotas ──────────────────────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/events',      require('./routes/events'));
app.use('/api/tickets',     require('./routes/tickets'));
app.use('/api/marketplace', require('./routes/marketplace'));
app.use('/api/payments',    require('./routes/payments'));

// ── Pesquisa de sócios ─────────────────────────────────────────────────────
const db   = require('./db/schema');
const auth = require('./middleware/auth');
app.get('/api/members/search', auth, (req, res) => {
  const q = `%${req.query.q || ''}%`;
  const results = db.prepare(`
    SELECT id, member_number, full_name, email, tier
    FROM members WHERE (full_name LIKE ? OR member_number LIKE ? OR email LIKE ?) AND id != ?
    LIMIT 10
  `).all(q, q, q, req.user.id);
  res.json(results);
});

// ── 404 handler ────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Endpoint não encontrado' }));

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🟢 Sporting CP API  →  http://localhost:${PORT}`);
  console.log(`   Stripe:  ${process.env.STRIPE_SECRET_KEY ? '✅ configurado' : '⚠️  STRIPE_SECRET_KEY em falta'}`);
  console.log(`   DB:      SQLite`);
  console.log(`\n   Corre "npm run seed" para popular a base de dados\n`);
});
