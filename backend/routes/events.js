const router = require('express').Router();
const auth   = require('../middleware/auth');
const db     = require('../db/schema');

// GET /api/events  — upcoming events with my ticket status
router.get('/', auth, (req, res) => {
  const events = db.prepare(`
    SELECT e.*,
      (SELECT COUNT(*) FROM tickets t
       WHERE t.event_id = e.id AND t.current_holder = ? AND t.status = 'issued') as has_ticket
    FROM events e
    WHERE e.starts_at > datetime('now')
    ORDER BY e.starts_at ASC
  `).all(req.user.id);
  res.json(events);
});

// GET /api/events/:id
router.get('/:id', auth, (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Jogo não encontrado' });
  res.json(event);
});

module.exports = router;
