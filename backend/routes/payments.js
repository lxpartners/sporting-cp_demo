// ─────────────────────────────────────────────────────────────────────────────
// routes/payments.js  —  Stripe: Google Pay + Mastercard + outros cartões
// ─────────────────────────────────────────────────────────────────────────────
const router = require('express').Router();
const auth   = require('../middleware/auth');
const db     = require('../db/schema');

// Stripe só inicializa se a chave existir
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('⚠️  STRIPE_SECRET_KEY não definida — endpoints de pagamento desativados');
}

function requireStripe(req, res, next) {
  if (!stripe) return res.status(503).json({ error: 'Pagamentos não configurados. Adiciona STRIPE_SECRET_KEY ao .env' });
  next();
}

// ── POST /api/payments/intent ─────────────────────────────────────────────────
// Cria um PaymentIntent para comprar um bilhete do marketplace
// O frontend usa este client_secret para confirmar o pagamento com Stripe.js
router.post('/intent', auth, requireStripe, async (req, res) => {
  const { listingId } = req.body;
  if (!listingId) return res.status(400).json({ error: 'listingId obrigatório' });

  const listing = db.prepare(`
    SELECT ml.*, t.section, t.row_label, t.seat_number,
           e.name as event_name, e.starts_at
    FROM marketplace_listings ml
    JOIN tickets t ON t.id = ml.ticket_id
    JOIN events  e ON e.id = t.event_id
    WHERE ml.id = ? AND ml.status = 'active'
  `).get(listingId);

  if (!listing) return res.status(404).json({ error: 'Anúncio não encontrado ou já vendido' });
  if (listing.seller_id === req.user.id) return res.status(400).json({ error: 'Não podes comprar o teu próprio bilhete' });

  const amountCents = Math.round(listing.asking_price * 100); // Stripe usa cêntimos

  try {
    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'eur',
      metadata: {
        listingId:  listing.id,
        ticketId:   listing.ticket_id,
        buyerId:    req.user.id,
        sellerId:   listing.seller_id,
        eventName:  listing.event_name,
        seat:       `Sect ${listing.section} · Fila ${listing.row_label} · Lugar ${listing.seat_number}`,
      },
      // Ativa Google Pay, Apple Pay e Link automaticamente
      payment_method_types: ['card'],
      automatic_payment_methods: { enabled: true },
      description: `Sporting CP — ${listing.event_name} | Sect ${listing.section}-${listing.row_label}-${listing.seat_number}`,
      statement_descriptor_suffix: 'SPORTINGCP',
    });

    res.json({
      clientSecret:    intent.client_secret,
      paymentIntentId: intent.id,
      amount:          listing.asking_price,
      currency:        'EUR',
      listing,
    });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/payments/confirm ────────────────────────────────────────────────
// Chamado pelo frontend após Stripe confirmar o pagamento
// Transfere o bilhete para o comprador e marca o anúncio como vendido
router.post('/confirm', auth, requireStripe, async (req, res) => {
  const { paymentIntentId } = req.body;
  if (!paymentIntentId) return res.status(400).json({ error: 'paymentIntentId obrigatório' });

  try {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (intent.status !== 'succeeded') {
      return res.status(400).json({ error: `Pagamento com estado: ${intent.status}` });
    }

    const { listingId, buyerId } = intent.metadata;

    // Verificar que o comprador é quem diz ser
    if (buyerId !== req.user.id) return res.status(403).json({ error: 'Não autorizado' });

    const listing = db.prepare(
      'SELECT * FROM marketplace_listings WHERE id = ? AND status = "active"'
    ).get(listingId);

    if (!listing) return res.status(409).json({ error: 'Bilhete já foi vendido' });

    // Transferir bilhete
    const crypto = require('crypto');
    const newNonce = crypto.randomBytes(16).toString('hex');

    db.prepare(`UPDATE tickets SET current_holder = ?, qr_nonce = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(req.user.id, newNonce, listing.ticket_id);

    db.prepare(`UPDATE marketplace_listings SET status = 'sold' WHERE id = ?`)
      .run(listing.id);

    db.prepare(`
      INSERT INTO ticket_log (ticket_id, action, from_member, to_member, meta)
      VALUES (?, 'sold_stripe', ?, ?, ?)
    `).run(listing.ticket_id, listing.seller_id, req.user.id,
      JSON.stringify({ paymentIntentId, amount: listing.asking_price }));

    res.json({
      success:   true,
      message:   'Pagamento confirmado. Bilhete adicionado à tua carteira.',
      ticket_id: listing.ticket_id,
    });
  } catch (err) {
    console.error('Stripe confirm error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/payments/webhook ────────────────────────────────────────────────
// Webhook Stripe (opcional mas recomendado para produção)
// Confirma pagamentos de forma assíncrona / resiliente a falhas de rede
router.post('/webhook', require('express').raw({ type: 'application/json' }), async (req, res) => {
  const sig     = req.headers['stripe-signature'];
  const secret  = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) return res.status(200).send('Webhook secret não configurado');

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const { listingId, buyerId } = intent.metadata;

    if (listingId && buyerId) {
      const listing = db.prepare(
        'SELECT * FROM marketplace_listings WHERE id = ? AND status = "active"'
      ).get(listingId);

      if (listing) {
        const crypto = require('crypto');
        db.prepare(`UPDATE tickets SET current_holder = ?, qr_nonce = ?, updated_at = datetime('now') WHERE id = ?`)
          .run(buyerId, crypto.randomBytes(16).toString('hex'), listing.ticket_id);
        db.prepare(`UPDATE marketplace_listings SET status = 'sold' WHERE id = ?`).run(listing.id);
        console.log(`✅ Webhook: bilhete ${listing.ticket_id} transferido para ${buyerId}`);
      }
    }
  }

  res.json({ received: true });
});

// ── GET /api/payments/config ──────────────────────────────────────────────────
// Devolve a chave pública Stripe para o frontend inicializar o Stripe.js
router.get('/config', (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
    available: !!process.env.STRIPE_SECRET_KEY,
  });
});

module.exports = router;
