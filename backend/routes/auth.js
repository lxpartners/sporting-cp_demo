const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const db      = require('../db/schema');

const sign = (member) =>
  jwt.sign({ id: member.id, memberNumber: member.member_number }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { full_name, email, password } = req.body;
  if (!full_name || !email || !password)
    return res.status(400).json({ error: 'Preenche todos os campos' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password deve ter pelo menos 6 caracteres' });

  const existing = db.prepare('SELECT id FROM members WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email já registado' });

  // Generate member number
  const count = db.prepare('SELECT COUNT(*) as c FROM members').get().c;
  const memberNumber = String(7000000 + count + 1).padStart(9, '0');

  const id = uuid();
  db.prepare(`
    INSERT INTO members (id, member_number, full_name, email, password, tier, points, member_since)
    VALUES (?, ?, ?, ?, ?, 'bronze', 0, date('now'))
  `).run(id, memberNumber, full_name, email, bcrypt.hashSync(password, 10));

  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(id);
  res.status(201).json({ token: sign(member), member: sanitize(member) });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const member = db.prepare('SELECT * FROM members WHERE email = ?').get(email);
  if (!member || !bcrypt.compareSync(password, member.password))
    return res.status(401).json({ error: 'Email ou password incorretos' });
  res.json({ token: sign(member), member: sanitize(member) });
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth'), (req, res) => {
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.user.id);
  if (!member) return res.status(404).json({ error: 'Sócio não encontrado' });
  res.json(sanitize(member));
});

function sanitize(m) {
  const { password, ...rest } = m;
  return rest;
}

module.exports = router;
