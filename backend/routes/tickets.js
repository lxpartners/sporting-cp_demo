const router   = require('express').Router();
const auth     = require('../middleware/auth');
const db       = require('../db/schema');
const QRCode   = require('qrcode');
const crypto   = require('crypto');
const { v4: uuid } = require('uuid');

const SECRET = process.env.JWT_SECRET || 'sporting_demo';

function makeQRPayload(ticket, event) {
  const payload = {
    ticketId:  ticket.id,
    eventId:   ticket.event_id,
    holderId:  ticket.current_holder,
    seat:      `${ticket.section}-${ticket.row_label}-${ticket.seat_number}`,
    nonce:     ticket.qr_nonce,
    expiresAt: new Date(new Date(event.starts_at).getTime() + event.qr_ttl_minutes * 60000).toISOString(),
  };
  const sig = crypto.createHmac('sha256', SECRET)
    .update(JSON.stringify(payload))
    .digest('hex')
    .slice(0, 16);
  return { ...payload, sig };
}

// GET /api/tickets  — my tickets
router.get('/', auth, (req, res) => {
  const tickets = db.prepare(`
    SELECT t.*, e.name as event_name, e.starts_at, e.venue, e.competition,
           e.home_team, e.away_team
    FROM tickets t
    JOIN events e ON e.id = t.event_id
    WHERE t.current_holder = ? AND t.status != 'used'
    ORDER BY e.starts_at ASC
  `).all(req.user.id);
  res.json(tickets);
});

// GET /api/tickets/:id  — ticket detail + QR
router.get('/:id', auth, (req, res) => {
  const ticket = db.prepare(`
    SELECT t.*, e.name as event_name, e.starts_at, e.venue, e.competition,
           e.home_team, e.away_team, e.qr_ttl_minutes,
           m.full_name as holder_name
    FROM tickets t
    JOIN events e ON e.id = t.event_id
    JOIN members m ON m.id = t.current_holder
    WHERE t.id = ? AND t.current_holder = ?
  `).get(req.params.id, req.user.id);

  if (!ticket) return res.status(404).json({ error: 'Bilhete não encontrado' });

  const qrPayload = makeQRPayload(ticket, ticket);
  res.json({ ...ticket, qr_data: JSON.stringify(qrPayload) });
});

// GET /api/tickets/:id/qr.png  — QR code as PNG image
router.get('/:id/qr.png', auth, async (req, res) => {
  const ticket = db.prepare(`
    SELECT t.*, e.starts_at, e.qr_ttl_minutes
    FROM tickets t JOIN events e ON e.id = t.event_id
    WHERE t.id = ? AND t.current_holder = ?
  `).get(req.params.id, req.user.id);

  if (!ticket) return res.status(404).send('Not found');

  // Refresh nonce on every QR render (rolling token)
  const newNonce = crypto.randomBytes(16).toString('hex');
  db.prepare('UPDATE tickets SET qr_nonce = ?, updated_at = datetime("now") WHERE id = ?')
    .run(newNonce, ticket.id);
  ticket.qr_nonce = newNonce;

  const payload = makeQRPayload(ticket, ticket);
  const png = await QRCode.toBuffer(JSON.stringify(payload), {
    errorCorrectionLevel: 'M',
    width: 300,
    margin: 2,
    color: { dark: '#006B38', light: '#ffffff' },
  });

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-store');
  res.send(png);
});

// POST /api/tickets/:id/transfer
router.post('/:id/transfer', auth, (req, res) => {
  const { targetEmail, targetMemberNumber } = req.body;
  if (!targetEmail && !targetMemberNumber)
    return res.status(400).json({ error: 'Indica o email ou número de sócio do destinatário' });

  const ticket = db.prepare(
    'SELECT * FROM tickets WHERE id = ? AND current_holder = ? AND status = "issued"'
  ).get(req.params.id, req.user.id);
  if (!ticket) return res.status(404).json({ error: 'Bilhete não encontrado ou já transferido' });

  // Can't transfer if listed on marketplace
  const listed = db.prepare(
    'SELECT id FROM marketplace_listings WHERE ticket_id = ? AND status = "active"'
  ).get(ticket.id);
  if (listed) return res.status(400).json({ error: 'Retira o bilhete do marketplace primeiro' });

  const target = db.prepare(
    'SELECT * FROM members WHERE email = ? OR member_number = ?'
  ).get(targetEmail || '', targetMemberNumber || '');
  if (!target) return res.status(404).json({ error: 'Sócio não encontrado' });
  if (target.id === req.user.id) return res.status(400).json({ error: 'Não podes transferir para ti mesmo' });

  const newNonce = crypto.randomBytes(16).toString('hex');
  db.prepare(`
    UPDATE tickets SET current_holder = ?, qr_nonce = ?, status = 'issued', updated_at = datetime('now')
    WHERE id = ?
  `).run(target.id, newNonce, ticket.id);

  db.prepare(`
    INSERT INTO ticket_log (ticket_id, action, from_member, to_member, meta)
    VALUES (?, 'transferred', ?, ?, ?)
  `).run(ticket.id, req.user.id, target.id, JSON.stringify({ ref: `TRF-${Date.now()}` }));

  res.json({
    success: true,
    message: `Bilhete transferido para ${target.full_name}`,
    recipient: { full_name: target.full_name, member_number: target.member_number },
  });
});

// POST /api/tickets/:id/validate  (for turnstile/demo)
router.post('/:id/validate', (req, res) => {
  const { qr_data } = req.body;
  if (!qr_data) return res.status(400).json({ valid: false, reason: 'QR data em falta' });

  try {
    const payload = JSON.parse(qr_data);
    const { sig, ...rest } = payload;
    const expected = crypto.createHmac('sha256', SECRET)
      .update(JSON.stringify(rest))
      .digest('hex')
      .slice(0, 16);

    if (sig !== expected) return res.json({ valid: false, reason: 'Assinatura inválida' });
    if (new Date(payload.expiresAt) < new Date()) return res.json({ valid: false, reason: 'QR expirado' });

    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ? AND qr_nonce = ?')
      .get(payload.ticketId, payload.nonce);
    if (!ticket) return res.json({ valid: false, reason: 'Bilhete já utilizado ou inválido' });
    if (ticket.status === 'used') return res.json({ valid: false, reason: 'Bilhete já utilizado' });

    db.prepare('UPDATE tickets SET status = "used", updated_at = datetime("now") WHERE id = ?')
      .run(ticket.id);

    res.json({ valid: true, seat: payload.seat, message: 'Entrada válida ✓' });
  } catch {
    res.json({ valid: false, reason: 'QR inválido' });
  }
});

// GET /api/members/search
router.get('/members/search', auth, (req, res) => {
  const q = `%${req.query.q || ''}%`;
  const results = db.prepare(`
    SELECT id, member_number, full_name, email, tier
    FROM members WHERE (full_name LIKE ? OR member_number LIKE ? OR email LIKE ?) AND id != ?
    LIMIT 10
  `).all(q, q, q, req.user.id);
  res.json(results);
});

module.exports = router;
