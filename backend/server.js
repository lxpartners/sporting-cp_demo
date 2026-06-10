require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', service: 'Sporting CP Demo API' }));

// Routes
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/events',      require('./routes/events'));
app.use('/api/tickets',     require('./routes/tickets'));
app.use('/api/marketplace', require('./routes/marketplace'));

// Members search (also exposed via tickets router internally)
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🟢 Sporting CP API running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Run "npm run seed" to populate demo data\n`);
});
