require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const db = require('./schema');

console.log('🌱 Seeding database...');

// Clear existing data
db.exec(`
  DELETE FROM marketplace_listings;
  DELETE FROM ticket_log;
  DELETE FROM tickets;
  DELETE FROM events;
  DELETE FROM members;
`);

// ── MEMBERS ──────────────────────────────────────────────────────────────────
const password = bcrypt.hashSync('sporting123', 10);

const members = [
  { id: uuid(), member_number: '004728391', full_name: 'André Domingues',    email: 'andre@demo.pt',   tier: 'gold',     points: 2840, member_since: '2008-03-15' },
  { id: uuid(), member_number: '004821002', full_name: 'João Matos',         email: 'joao@demo.pt',    tier: 'silver',   points: 1200, member_since: '2012-09-01' },
  { id: uuid(), member_number: '005103887', full_name: 'Maria Santos',       email: 'maria@demo.pt',   tier: 'bronze',   points:  640, member_since: '2019-01-10' },
  { id: uuid(), member_number: '003991241', full_name: 'Rui Pereira',        email: 'rui@demo.pt',     tier: 'platinum', points: 5100, member_since: '2001-07-22' },
  { id: uuid(), member_number: '006234518', full_name: 'Ana Costa',          email: 'ana@demo.pt',     tier: 'bronze',   points:  320, member_since: '2022-06-05' },
];

const insertMember = db.prepare(`
  INSERT INTO members (id, member_number, full_name, email, password, tier, points, member_since)
  VALUES (@id, @member_number, @full_name, @email, @password, @tier, @points, @member_since)
`);
members.forEach(m => insertMember.run({ ...m, password }));
console.log(`✅ ${members.length} members created (password: sporting123)`);

// ── EVENTS ────────────────────────────────────────────────────────────────────
const events = [
  { id: uuid(), name: 'Sporting CP vs FC Porto',       competition: 'Liga Portugal Betclic',  home_team: 'Sporting CP', away_team: 'FC Porto',      venue: 'Estádio de Alvalade', starts_at: '2026-06-14T21:00:00', qr_ttl_minutes: 120 },
  { id: uuid(), name: 'Sporting CP vs SL Benfica',     competition: 'Liga Portugal Betclic',  home_team: 'Sporting CP', away_team: 'SL Benfica',    venue: 'Estádio de Alvalade', starts_at: '2026-06-21T20:30:00', qr_ttl_minutes: 120 },
  { id: uuid(), name: 'Sporting CP vs SC Braga',       competition: 'Taça de Portugal',       home_team: 'Sporting CP', away_team: 'SC Braga',      venue: 'Estádio de Alvalade', starts_at: '2026-06-28T18:00:00', qr_ttl_minutes: 120 },
  { id: uuid(), name: 'Sporting CP vs Vitória SC',     competition: 'Liga Portugal Betclic',  home_team: 'Sporting CP', away_team: 'Vitória SC',    venue: 'Estádio de Alvalade', starts_at: '2026-07-05T19:00:00', qr_ttl_minutes: 120 },
];

const insertEvent = db.prepare(`
  INSERT INTO events (id, name, competition, home_team, away_team, venue, starts_at, qr_ttl_minutes)
  VALUES (@id, @name, @competition, @home_team, @away_team, @venue, @starts_at, @qr_ttl_minutes)
`);
events.forEach(e => insertEvent.run(e));
console.log(`✅ ${events.length} events created`);

// ── TICKETS ───────────────────────────────────────────────────────────────────
const { randomBytes } = require('crypto');
const andre = members[0];
const joao  = members[1];
const rui   = members[3];

const ticketData = [
  // André has tickets to game 1 and 2
  { id: uuid(), event_id: events[0].id, original_holder: andre.id, current_holder: andre.id, section: '14', row_label: 'C', seat_number: '22', price_paid: 35.00, status: 'issued' },
  { id: uuid(), event_id: events[1].id, original_holder: andre.id, current_holder: andre.id, section: '14', row_label: 'C', seat_number: '23', price_paid: 45.00, status: 'issued' },
  // João has ticket to game 1
  { id: uuid(), event_id: events[0].id, original_holder: joao.id,  current_holder: joao.id,  section: '08', row_label: 'A', seat_number: '7',  price_paid: 35.00, status: 'issued' },
  // Rui has tickets to games 1, 3, 4
  { id: uuid(), event_id: events[0].id, original_holder: rui.id,   current_holder: rui.id,   section: '20', row_label: 'F', seat_number: '11', price_paid: 35.00, status: 'issued' },
  { id: uuid(), event_id: events[2].id, original_holder: rui.id,   current_holder: rui.id,   section: '06', row_label: 'B', seat_number: '3',  price_paid: 25.00, status: 'issued' },
  { id: uuid(), event_id: events[3].id, original_holder: rui.id,   current_holder: rui.id,   section: '14', row_label: 'D', seat_number: '9',  price_paid: 20.00, status: 'issued' },
];

const insertTicket = db.prepare(`
  INSERT INTO tickets (id, event_id, original_holder, current_holder, section, row_label, seat_number, price_paid, status, qr_nonce)
  VALUES (@id, @event_id, @original_holder, @current_holder, @section, @row_label, @seat_number, @price_paid, @status, @qr_nonce)
`);
ticketData.forEach(t => insertTicket.run({ ...t, qr_nonce: randomBytes(16).toString('hex') }));
console.log(`✅ ${ticketData.length} tickets created`);

// ── MARKETPLACE LISTINGS ──────────────────────────────────────────────────────
// Rui lists his game 4 ticket
const ruiGame4Ticket = ticketData[5];
db.prepare(`
  INSERT INTO marketplace_listings (id, ticket_id, seller_id, asking_price, original_price, status)
  VALUES (?, ?, ?, ?, ?, 'active')
`).run(uuid(), ruiGame4Ticket.id, rui.id, 18.00, 20.00);

// Rui also lists game 3 ticket
const ruiGame3Ticket = ticketData[4];
db.prepare(`
  INSERT INTO marketplace_listings (id, ticket_id, seller_id, asking_price, original_price, status)
  VALUES (?, ?, ?, ?, ?, 'active')
`).run(uuid(), ruiGame3Ticket.id, rui.id, 22.00, 25.00);

console.log('✅ 2 marketplace listings created');

console.log('\n📋 Demo accounts (password: sporting123):');
members.forEach(m => console.log(`   ${m.email}  |  Sócio nº ${m.member_number}  |  ${m.tier}`));
console.log('\n🎉 Seed complete!\n');
