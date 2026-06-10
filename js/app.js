// ─────────────────────────────────────────────────────────────
// app.js  —  Sessão, autenticação, routing, lógica de negócio
//            (login, logout, transferir, vender, comprar)
// ─────────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════════
// SESSION
// ══════════════════════════════════════════════════════════
// ── ESTADO GLOBAL ───────────────────────────────────────────────────────────
let currentUser = null;
let activeTicketId = null;
let selectedTransferMember = null;
let transferTicketId = null;
let sellTicketId = null;

const TIER_COLORS = { bronze:'#CD7F32', silver:'#C0C0C0', gold:'#FFD700', platinum:'#E5E4E2' };
const AVATAR_COLORS = ['#4CAF50','#2196F3','#FF9800','#9C27B0','#F44336','#00BCD4','#795548'];
function avatarColor(name){ return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]; }
function initials(name){ return name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(); }
function nonce(){ return Math.random().toString(36).slice(2,10).toUpperCase(); }

// ══════════════════════════════════════════════════════════
// ROUTING
// ══════════════════════════════════════════════════════════
// ── ROUTING / NAVEGAÇÃO ─────────────────────────────────────────────────────
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-'+id);
  if(el){ el.classList.add('active'); el.scrollTop = 0; }
}

function goTab(tab){
  if(tab === 'home')        { renderHome(); showScreen('home'); }
  else if(tab === 'tickets'){ renderTickets(); showScreen('tickets'); }
  else if(tab === 'marketplace'){ renderMarketplace(); showScreen('marketplace'); }
  else if(tab === 'profile'){ renderProfile(); showScreen('profile'); }
}

// ══════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════
// ── AUTENTICAÇÃO ────────────────────────────────────────────────────────────
function doLogin(){
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const pass  = document.getElementById('login-pass').value;
  const user  = MEMBERS.find(m => m.email === email && m.password === pass);
  if(!user){ showToast('Email ou password incorretos ❌'); return; }
  currentUser = user;
  renderHome();
  showScreen('home');
}

function doRegister(){
  const name  = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const pass  = document.getElementById('reg-pass').value;
  if(!name||!email||!pass){ showToast('Preenche todos os campos'); return; }
  if(pass.length < 6){ showToast('Password deve ter 6+ caracteres'); return; }
  if(MEMBERS.find(m=>m.email===email)){ showToast('Email já registado'); return; }
  const newMember = {
    id: 'm'+Date.now(), email, password: pass, full_name: name,
    member_number: String(7000000+MEMBERS.length+1).padStart(9,'0'),
    tier:'bronze', points:0, member_since: new Date().toISOString().slice(0,10)
  };
  MEMBERS.push(newMember);
  currentUser = newMember;
  showToast('Conta criada! Bem-vindo, '+name.split(' ')[0]+' 🎉');
  renderHome();
  showScreen('home');
}

function doLogout(){
  currentUser = null;
  showScreen('login');
}

// ══════════════════════════════════════════════════════════
// RENDER: HOME
// ══════════════════════════════════════════════════════════
function renderHome(){
  const u = currentUser;
  document.getElementById('home-firstname').textContent = u.full_name.split(' ')[0]+' 👋';

  // Member card
  document.getElementById('home-member-card').innerHTML = `
    <div class="member-card">
      <div class="mc-top">
        <div><div class="mc-label">Sócio Nº</div>
          <div class="mc-number">${u.member_number.replace(/(\d{3})(\d{3})(\d{3})/,'$1 · $2 · $3')}</div></div>
        <div class="mc-tier" style="background:${TIER_COLORS[u.tier]};color:#004D29">⭐ ${u.tier.toUpperCase()}</div>
      </div>
      <div class="mc-name">${u.full_name}</div>
      <div class="mc-bottom">
        <div><div class="mc-since">Sócio desde ${new Date(u.member_since).getFullYear()}</div></div>
        <div class="mc-points">
          <div class="mc-pts-num">${u.points.toLocaleString('pt')}</div>
          <div class="mc-pts-label">pontos sporting</div>
        </div>
      </div>
    </div>`;

  // Events
  const myTicketEventIds = TICKETS.filter(t=>t.holder===u.id&&t.status==='issued').map(t=>t.event_id);
  const html = EVENTS.map(ev=>{
    const d = new Date(ev.date+'T12:00:00');
    const hasTicket = myTicketEventIds.includes(ev.id);
    return `<div class="game-card${hasTicket?' has-ticket':''}" onclick="${hasTicket?`openTicketForEvent('${ev.id}')`:``}">
      <div class="date-box"><div class="date-day">${d.getDate()}</div><div class="date-month">${d.toLocaleDateString('pt',{month:'short'}).toUpperCase()}</div></div>
      <div class="divider-v"></div>
      <div class="game-info">
        <div class="game-teams">${ev.home} vs ${ev.away}</div>
        <div class="game-meta">⏰ ${ev.time} · ${ev.venue.replace('Estádio de ','')}</div>
        <div class="game-comp">${ev.competition}</div>
      </div>
      ${hasTicket?`<div class="ticket-badge">Tenho bilhete</div>`:''}
    </div>`;
  }).join('');
  document.getElementById('home-events').innerHTML = html;
}

function openTicketForEvent(eventId){
  const ticket = TICKETS.find(t=>t.event_id===eventId&&t.holder===currentUser.id&&t.status==='issued');
  if(ticket){ openTicketDetail(ticket.id); }
}

// ══════════════════════════════════════════════════════════
// RENDER: TICKETS
// ══════════════════════════════════════════════════════════
function renderTickets(){
  const myTickets = TICKETS.filter(t=>t.holder===currentUser.id&&t.status==='issued');
  document.getElementById('tickets-count').textContent = myTickets.length+' bilhete'+(myTickets.length!==1?'s':'');
  if(myTickets.length===0){
    document.getElementById('tickets-list').innerHTML = `<div style="text-align:center;padding:80px 20px"><div style="font-size:48px">🎫</div><div style="font-size:20px;font-weight:700;margin-top:12px">Sem bilhetes</div><p style="color:var(--gray);margin-top:6px">Não tens bilhetes ativos.</p></div>`;
    return;
  }
  document.getElementById('tickets-list').innerHTML = myTickets.map(t=>{
    const ev = EVENTS.find(e=>e.id===t.event_id);
    const d  = new Date(ev.date+'T12:00:00');
    return `<div class="ticket-card" onclick="openTicketDetail('${t.id}')">
      <div class="ticket-card-header">
        <div class="ticket-card-match">${ev.home} vs ${ev.away}</div>
        <div class="ticket-card-meta">📅 ${d.toLocaleDateString('pt',{day:'numeric',month:'long'})} · ⏰ ${ev.time} · ${ev.competition}</div>
      </div>
      <div class="ticket-card-seats">
        ${[['Setor',t.section],['Fila',t.row],['Lugar',t.seat],['Preço',t.price+'€']].map(([l,v])=>`<div class="seat-f"><div class="seat-lbl">${l}</div><div class="seat-val">${v}</div></div>`).join('')}
      </div>
      <div class="ticket-hint">🎫  Toca para ver o QR code de entrada</div>
    </div>`;
  }).join('');
}

// ══════════════════════════════════════════════════════════
// TICKET DETAIL + QR
// ══════════════════════════════════════════════════════════
function openTicketDetail(ticketId){
  activeTicketId = ticketId;
  const t  = TICKETS.find(x=>x.id===ticketId);
  const ev = EVENTS.find(e=>e.id===t.event_id);
  const d  = new Date(ev.date+'T12:00:00');
  const dateStr = d.toLocaleDateString('pt',{weekday:'short',day:'numeric',month:'long'});
  const isListed = LISTINGS.some(l=>l.ticket_id===ticketId&&l.status==='active');

  const qrPayload = JSON.stringify({
    ticketId: t.id, eventId: t.event_id, holder: t.holder,
    seat: `${t.section}-${t.row}-${t.seat}`,
    nonce: nonce(),
    event: ev.name,
    expires: new Date(ev.date+'T'+ev.time+':00').getTime() + 7200000,
  });

  document.getElementById('ticket-detail-body').innerHTML = `
    <div class="td-header">
      <div class="td-comp">${ev.competition}</div>
      <div class="td-match">${ev.home}  ×  ${ev.away}</div>
      <div class="td-info">
        <span>📅 ${dateStr}</span>
        <span>⏰ ${ev.time}</span>
        <span>🏟 ${ev.venue}</span>
      </div>
    </div>
    <div class="perforation"><div class="perf-circle"></div><div class="perf-line"></div><div class="perf-circle"></div></div>
    <div class="td-seats">
      ${[['SETOR',t.section],['FILA',t.row],['LUGAR',t.seat]].map(([l,v])=>`<div class="td-seat"><div class="td-seat-lbl">${l}</div><div class="td-seat-val">${v}</div></div>`).join('')}
    </div>
    <div class="qr-area">
      <div id="qr-canvas"></div>
      <div class="ticket-ref">SCP-${t.id.toUpperCase()}-${nonce()}</div>
    </div>
    <div class="ticket-actions">
      ${isListed
        ? `<button class="btn-outline" onclick="delistTicket('${ticketId}')">✕ Retirar do Marketplace</button>`
        : `<button class="btn-green" style="font-size:14px" onclick="openTransfer('${ticketId}')">↗ Transferir</button>
           <button class="btn-gold" style="font-size:14px" onclick="openSell('${ticketId}','${t.price}')">💰 Vender</button>`
      }
    </div>
    <div class="ticket-disclaimer">⚠️ QR code válido para uma entrada. Expira após utilização.</div>`;

  showScreen('ticket-detail');

  // Generate real QR code
  setTimeout(()=>{
    document.getElementById('qr-canvas').innerHTML = '';
    try {
      new QRCode(document.getElementById('qr-canvas'), {
        text: qrPayload, width:200, height:200,
        colorDark:'#006B38', colorLight:'#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    } catch(e){ document.getElementById('qr-canvas').innerHTML='<div style="width:200px;height:200px;background:#e8f5e9;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:40px">🎫</div>'; }
  }, 50);
}

// ══════════════════════════════════════════════════════════
// TRANSFER
// ══════════════════════════════════════════════════════════
// ── TRANSFERÊNCIA DE BILHETE ────────────────────────────────────────────────
function openTransfer(ticketId){
  transferTicketId = ticketId;
  selectedTransferMember = null;
  document.getElementById('transfer-query').value = '';
  document.getElementById('transfer-results').innerHTML = '';
  document.getElementById('transfer-confirm').style.display = 'none';
  document.getElementById('transfer-submit-btn').style.display = 'none';
  document.getElementById('transfer-back-btn').onclick = ()=>{ openTicketDetail(ticketId); };
  showScreen('transfer');
}

function searchMembers(q){
  selectedTransferMember = null;
  document.getElementById('transfer-confirm').style.display = 'none';
  document.getElementById('transfer-submit-btn').style.display = 'none';
  if(q.length < 2){ document.getElementById('transfer-results').innerHTML=''; return; }
  const matches = MEMBERS.filter(m=>
    m.id !== currentUser.id &&
    (m.full_name.toLowerCase().includes(q.toLowerCase()) ||
     m.email.toLowerCase().includes(q.toLowerCase()) ||
     m.member_number.includes(q))
  );
  document.getElementById('transfer-results').innerHTML = matches.length === 0
    ? '<p style="color:var(--gray);padding:12px 0">Nenhum sócio encontrado</p>'
    : matches.map(m=>`
      <div class="member-result" id="mr-${m.id}" onclick="selectTransferMember('${m.id}')">
        <div class="mr-avatar" style="background:${avatarColor(m.full_name)}">${initials(m.full_name)}</div>
        <div><div class="mr-name">${m.full_name}</div><div class="mr-num">Sócio nº ${m.member_number}</div></div>
      </div>`).join('');
}

function selectTransferMember(memberId){
  selectedTransferMember = MEMBERS.find(m=>m.id===memberId);
  document.querySelectorAll('.member-result').forEach(el=>{
    el.classList.toggle('selected', el.id==='mr-'+memberId);
    const check = el.querySelector('.mr-check');
    if(check) check.remove();
  });
  const el = document.getElementById('mr-'+memberId);
  if(el) el.insertAdjacentHTML('beforeend','<span class="mr-check">✓</span>');

  document.getElementById('transfer-confirm').style.display = 'block';
  document.getElementById('transfer-confirm').innerHTML = `
    <div class="confirm-box">
      <div class="confirm-label">Transferir para</div>
      <div class="confirm-name">${selectedTransferMember.full_name}</div>
      <div class="confirm-sub">Sócio nº ${selectedTransferMember.member_number}</div>
    </div>`;
  document.getElementById('transfer-submit-btn').style.display = 'block';
}

function doTransfer(){
  if(!selectedTransferMember || !transferTicketId) return;
  const ticket = TICKETS.find(t=>t.id===transferTicketId);
  ticket.holder = selectedTransferMember.id;
  ticket.status = 'issued';

  showSuccessScreen(
    '✅', 'Bilhete Transferido!',
    `O bilhete foi enviado com sucesso para <strong>${selectedTransferMember.full_name}</strong>.`,
    [
      { key:'Jogo', val: EVENTS.find(e=>e.id===ticket.event_id)?.name },
      { key:'Lugar', val: `Sect. ${ticket.section} · Fila ${ticket.row} · Lugar ${ticket.seat}` },
      { key:'Enviado para', val: selectedTransferMember.full_name },
      { key:'Referência', val: 'TRF-'+Date.now() },
    ],
    ()=>goTab('tickets')
  );
}

// ══════════════════════════════════════════════════════════
// SELL
// ══════════════════════════════════════════════════════════
// ── VENDA DE BILHETE ────────────────────────────────────────────────────────
function openSell(ticketId, price){
  sellTicketId = ticketId;
  document.getElementById('sell-price-input').value = price;
  document.getElementById('sell-back-btn').onclick = ()=>{ openTicketDetail(ticketId); };
  updateSellBreakdown();
  showScreen('sell');
}

function updateSellBreakdown(){
  const ticket = TICKETS.find(t=>t.id===sellTicketId);
  if(!ticket) return;
  const val = parseFloat(document.getElementById('sell-price-input').value)||0;
  const max = ticket.price;
  const over = val > max;
  document.getElementById('sell-price-input').classList.toggle('over', over);
  document.getElementById('sell-price-error').style.display = over?'block':'none';
  document.getElementById('sell-price-error').textContent = `Máximo permitido: ${max}€`;
  document.getElementById('sell-submit-btn').disabled = over;
  const commission = (val*0.05).toFixed(2);
  const receives   = (val*0.95).toFixed(2);
  document.getElementById('sell-breakdown').innerHTML = `
    ${[
      { l:'Preço original', v:`${max}€` },
      { l:'Preço de venda', v:`${val}€` },
      { l:'Comissão (5%)', v:`- ${commission}€` },
    ].map(r=>`<div class="bd-row"><span class="bd-label">${r.l}</span><span class="bd-value">${r.v}</span></div>`).join('')}
    <div class="bd-row highlight"><span class="bd-label">Recebes</span><span class="bd-value">${receives}€</span></div>`;
}

function doSell(){
  const ticket = TICKETS.find(t=>t.id===sellTicketId);
  const price = parseFloat(document.getElementById('sell-price-input').value);
  if(!ticket || price > ticket.price) return;
  const listingId = 'l'+Date.now();
  LISTINGS.push({ id:listingId, ticket_id:ticket.id, seller_id:currentUser.id, asking_price:price, original_price:ticket.price, status:'active' });
  showSuccessScreen(
    '🏪', 'Publicado!',
    'O teu bilhete está agora no marketplace. Receberás uma notificação quando for vendido.',
    [
      { key:'Jogo', val: EVENTS.find(e=>e.id===ticket.event_id)?.name },
      { key:'Lugar', val:`Sect. ${ticket.section} · Fila ${ticket.row} · Lugar ${ticket.seat}` },
      { key:'Preço', val:`${price}€` },
      { key:'Recebes', val:`${(price*0.95).toFixed(2)}€` },
    ],
    ()=>goTab('marketplace')
  );
}

function delistTicket(ticketId){
  const listing = LISTINGS.find(l=>l.ticket_id===ticketId&&l.status==='active');
  if(listing){ listing.status='cancelled'; showToast('Bilhete retirado do marketplace'); setTimeout(()=>openTicketDetail(ticketId),600); }
}

// ══════════════════════════════════════════════════════════
// MARKETPLACE
// ══════════════════════════════════════════════════════════
// ── MARKETPLACE ─────────────────────────────────────────────────────────────
function renderMarketplace(){
  const active = LISTINGS.filter(l=>l.status==='active');
  if(active.length === 0){
    document.getElementById('marketplace-list').innerHTML = `<div style="text-align:center;padding:80px 20px"><div style="font-size:48px">🏪</div><div style="font-size:20px;font-weight:700;margin-top:12px">Sem anúncios</div><p style="color:var(--gray);margin-top:6px">Nenhum bilhete disponível de momento.</p></div>`;
    return;
  }
  document.getElementById('marketplace-list').innerHTML = active.map(l=>{
    const ticket = TICKETS.find(t=>t.id===l.ticket_id);
    const ev     = EVENTS.find(e=>e.id===ticket.event_id);
    const seller = MEMBERS.find(m=>m.id===l.seller_id);
    const d      = new Date(ev.date+'T12:00:00');
    const saving = (l.original_price - l.asking_price).toFixed(2);
    const isOwn  = l.seller_id === currentUser.id;
    return `<div class="listing-card">
      <div class="lc-top">
        <div>
          <div class="lc-comp">${ev.competition}</div>
          <div class="lc-match">${ev.home} vs ${ev.away}</div>
          <div class="lc-meta">📅 ${d.toLocaleDateString('pt',{day:'numeric',month:'short'})} · ⏰ ${ev.time} · ${ev.venue.replace('Estádio de ','')}</div>
        </div>
        ${parseFloat(saving)>0?`<div class="saving-tag">- ${saving}€</div>`:''}
      </div>
      <div class="lc-body">
        <div class="lc-seats">
          ${[['Setor',ticket.section],['Fila',ticket.row],['Lugar',ticket.seat]].map(([lb,v])=>`<div class="seat-f"><div class="seat-lbl">${lb}</div><div class="seat-val">${v}</div></div>`).join('')}
        </div>
        <div class="lc-price-row">
          <div class="lc-seller">Vendido por<strong>${isOwn?'Tu ('+seller.full_name+')':seller.full_name}</strong></div>
          <div>
            <div class="lc-price">${l.asking_price}€</div>
            ${parseFloat(saving)>0?`<div class="lc-orig">${l.original_price}€</div>`:''}
          </div>
        </div>
        ${isOwn
          ? `<button class="btn-outline" onclick="delistListing('${l.id}')">Retirar anúncio</button>`
          : `<button class="buy-btn" onclick="buyListing('${l.id}')">Comprar Bilhete — ${l.asking_price}€</button>`
        }
      </div>
    </div>`;
  }).join('');
}

function buyListing(listingId){
  const l      = LISTINGS.find(x=>x.id===listingId);
  const ticket = TICKETS.find(t=>t.id===l.ticket_id);
  const ev     = EVENTS.find(e=>e.id===ticket.event_id);
  if(!confirm(`Confirmar compra?\n\n${ev.name}\nSetor ${ticket.section} · Fila ${ticket.row} · Lugar ${ticket.seat}\n\nPreço: ${l.asking_price}€`)) return;
  l.status = 'sold';
  ticket.holder = currentUser.id;
  showSuccessScreen(
    '✅', 'Bilhete Comprado!',
    `O bilhete foi adicionado à tua carteira.`,
    [
      { key:'Jogo',   val: ev.name },
      { key:'Lugar',  val:`Sect. ${ticket.section} · Fila ${ticket.row} · Lugar ${ticket.seat}` },
      { key:'Pago',   val:`${l.asking_price}€` },
    ],
    ()=>goTab('tickets')
  );
}

function delistListing(listingId){
  const l = LISTINGS.find(x=>x.id===listingId);
  if(l){ l.status='cancelled'; showToast('Anúncio removido'); renderMarketplace(); }
}

// ══════════════════════════════════════════════════════════
// PROFILE
// ══════════════════════════════════════════════════════════
function renderProfile(){
  const u = currentUser;
  document.getElementById('profile-header').innerHTML = `
    <div class="prof-avatar">${initials(u.full_name)}</div>
    <div class="prof-name">${u.full_name}</div>
    <div class="prof-email">${u.email}</div>
    <div class="prof-tier" style="background:${TIER_COLORS[u.tier]}">⭐ ${u.tier.charAt(0).toUpperCase()+u.tier.slice(1)}</div>`;

  document.getElementById('profile-stats').innerHTML = [
    { label:'Número de Sócio', value:u.member_number.replace(/(\d{3})(\d{3})(\d{3})/,'$1·$2·$3') },
    { label:'Pontos',          value:u.points.toLocaleString('pt') },
    { label:'Sócio desde',     value:new Date(u.member_since).getFullYear() },
  ].map(s=>`<div class="stat-card"><div class="stat-val">${s.value}</div><div class="stat-lbl">${s.label}</div></div>`).join('');
}

// ══════════════════════════════════════════════════════════
// SUCCESS
// ══════════════════════════════════════════════════════════
// ── ECRÃ DE SUCESSO ─────────────────────────────────────────────────────────
function showSuccessScreen(icon, title, sub, details, onDone){
  document.getElementById('success-body').innerHTML = `
    <div class="success-icon">${icon}</div>
    <div class="success-title">${title}</div>
    <div class="success-sub">${sub}</div>
    <div class="success-detail">
      ${details.map(d=>`<div class="sd-row"><span class="sd-key">${d.key}</span><span class="sd-val">${d.val}</span></div>`).join('')}
    </div>
    <button class="btn-green" style="width:100%" id="success-done-btn">Continuar</button>`;
  document.getElementById('success-done-btn').onclick = onDone;
  showScreen('success');
}

// ══════════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════════
// ── TOAST / NOTIFICAÇÕES ────────────────────────────────────────────────────
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2500);
}

// ══════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════
// Pre-fill login for easy demo
document.getElementById('login-email').value = 'andre@demo.pt';
document.getElementById('login-pass').value  = 'sporting123';
