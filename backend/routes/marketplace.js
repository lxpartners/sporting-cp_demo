const router = require('express').Router();
const auth   = require('../middleware/auth');
const db     = require('../db/schema');
const crypto = require('crypto');
const { v4: uuid } = require('uuid');

// GET /api/marketplace  — all active listings
router.get('/', auth, (req, res) => {
  const listings = db.prepare(`
    SELECT ml.*, t.section, t.row_label, t.seat_number,
           e.name as event_name, e.starts_at, e.venue, e.competition,
           e.home_team, e.away_team,
           m.full_name as seller_name
    FROM marketplace_listings ml
    JOIN tickets t ON t.id = ml.ticket_id
    JOIN events e ON e.id = t.event_id
    JOIN members m ON m.id = ml.seller_id
    WHERE ml.status = 'active' AND e.starts_at > datetime('now')
    ORDER BY e.starts_at ASC
  `).all();
  res.json(listings);
});

// POST /api/marketplace/list  — list my ticket for sale
router.post('/list', auth, (req, res) => {
  const { ticketId, askingPrice } = req.body;
  if (!ticketId || !askingPrice)
    return res.status(400).json({ error: 'ticketId e askingPrice são obrigatórios' });

  const ticket = db.prepare(
    'SELECT * FROM tickets WHERE id = ? AND current_holder = ? AND status = "issued"'
  ).get(ticketId, req.user.id);
  if (!ticket) return res.status(404).json({ error: 'Bilhete não encontrado' });

  if (parseFloat(askingPrice) > ticket.price_paid)
    return res.status(400).json({ error: `Preço não pode exceder o valor original (${ticket.price_paid}€)` });

  const existing = db.prepare(
    'SELECT id FROM marketplace_listings WHERE ticket_id = ? AND status = "active"'
  ).get(ticketId);
  if (existing) return res.status(409).json({ error: 'Bilhete já está no marketplace' });

  const id = uuid();
  db.prepare(`
    INSERT INTO marketplace_listings (id, ticket_id, seller_id, asking_price, original_price)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, ticketId, req.user.id, parseFloat(askingPrice), ticket.price_paid);

  res.status(201).json({ success: true, listing_id: id });
});

// POST /api/marketplace/:id/buy
router.post('/:id/buy', auth, (req, res) => {
  const listing = db.prepare(`
    SELECT ml.*, t.*, t.id as ticket_id
    FROM marketplace_listings ml
    JOIN tickets t ON t.id = ml.ticket_id
    WHERE ml.id = ? AND ml.status = 'active'
  `).get(req.params.id);

  if (!listing) return res.status(404).json({ error: 'Anúncio não encontrado ou já vendido' });
  if (listing.seller_id === req.user.id)
    return res.status(400).json({ error: 'Não podes comprar o teu próprio bilhete' });

  const newNonce = crypto.randomBytes(16).toString('hex');

  db.prepare(`UPDATE tickets SET current_holder = ?, qr_nonce = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(req.user.id, newNonce, listing.ticket_id);

  db.prepare(`UPDATE marketplace_listings SET status = 'sold' WHERE id = ?`)
    .run(listing.id);

  db.prepare(`
    INSERT INTO ticket_log (ticket_id, action, from_member, to_member, meta)
    VALUES (?, 'sold', ?, ?, ?)
  `).run(listing.ticket_id, listing.seller_id, req.user.id,
    JSON.stringify({ price: listing.asking_price, listing_id: listing.id }));

  const buyer = db.prepare('SELECT * FROM members WHERE id = ?').get(req.user.id);
  res.json({
    success: true,
    message: `Bilhete comprado com sucesso! Pago: ${listing.asking_price}€`,
    ticket_id: listing.ticket_id,
  });
});

// DELETE /api/marketplace/:id  — delist my ticket
router.delete('/:id', auth, (req, res) => {
  const listing = db.prepare(
    'SELECT * FROM marketplace_listings WHERE id = ? AND seller_id = ? AND status = "active"'
  ).get(req.params.id, req.user.id);
  if (!listing) return res.status(404).json({ error: 'Anúncio não encontrado' });

  db.prepare('UPDATE marketplace_listings SET status = "cancelled" WHERE id = ?').run(listing.id);
  res.json({ success: true });
});

module.exports = router;
