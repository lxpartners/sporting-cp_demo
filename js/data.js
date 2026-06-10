// ─────────────────────────────────────────────────────────────
// data.js  —  Dados de demo (membros, eventos, bilhetes)
// Para ligar ao backend real: substituir por chamadas fetch()
// ─────────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════════
// DATA STORE
// ══════════════════════════════════════════════════════════
const MEMBERS = [
  { id:'m1', member_number:'004728391', full_name:'André Domingues', email:'andre@demo.pt', password:'sporting123', tier:'gold',     points:2840, member_since:'2008-03-15' },
  { id:'m2', member_number:'004821002', full_name:'João Matos',       email:'joao@demo.pt',  password:'sporting123', tier:'silver',   points:1200, member_since:'2012-09-01' },
  { id:'m3', member_number:'003991241', full_name:'Rui Pereira',      email:'rui@demo.pt',   password:'sporting123', tier:'platinum', points:5100, member_since:'2001-07-22' },
  { id:'m4', member_number:'005103887', full_name:'Maria Santos',     email:'maria@demo.pt', password:'sporting123', tier:'bronze',   points: 640, member_since:'2019-01-10' },
  { id:'m5', member_number:'006234518', full_name:'Ana Costa',        email:'ana@demo.pt',   password:'sporting123', tier:'bronze',   points: 320, member_since:'2022-06-05' },
];

const EVENTS = [
  { id:'e1', name:'Sporting CP vs FC Porto',   competition:'Liga Portugal Betclic', home:'Sporting CP', away:'FC Porto',   venue:'Estádio de Alvalade', date:'2026-06-14', time:'21:00' },
  { id:'e2', name:'Sporting CP vs SL Benfica', competition:'Liga Portugal Betclic', home:'Sporting CP', away:'SL Benfica', venue:'Estádio de Alvalade', date:'2026-06-21', time:'20:30' },
  { id:'e3', name:'Sporting CP vs SC Braga',   competition:'Taça de Portugal',      home:'Sporting CP', away:'SC Braga',   venue:'Estádio de Alvalade', date:'2026-06-28', time:'18:00' },
  { id:'e4', name:'Sporting CP vs Vitória SC', competition:'Liga Portugal Betclic', home:'Sporting CP', away:'Vitória SC', venue:'Estádio de Alvalade', date:'2026-07-05', time:'19:00' },
];

let TICKETS = [
  { id:'t1', event_id:'e1', original:'m1', holder:'m1', section:'14', row:'C', seat:'22', price:35, status:'issued' },
  { id:'t2', event_id:'e2', original:'m1', holder:'m1', section:'14', row:'C', seat:'23', price:45, status:'issued' },
  { id:'t3', event_id:'e1', original:'m2', holder:'m2', section:'08', row:'A', seat:'7',  price:35, status:'issued' },
  { id:'t4', event_id:'e1', original:'m3', holder:'m3', section:'20', row:'F', seat:'11', price:35, status:'issued' },
  { id:'t5', event_id:'e3', original:'m3', holder:'m3', section:'06', row:'B', seat:'3',  price:25, status:'issued' },
  { id:'t6', event_id:'e4', original:'m3', holder:'m3', section:'14', row:'D', seat:'9',  price:20, status:'issued' },
];

let LISTINGS = [
  { id:'l1', ticket_id:'t5', seller_id:'m3', asking_price:22, original_price:25, status:'active' },
  { id:'l2', ticket_id:'t6', seller_id:'m3', asking_price:18, original_price:20, status:'active' },
];
