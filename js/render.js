// ─────────────────────────────────────────────────────────────
// render.js  —  Funções que constroem o HTML de cada ecrã
//               (home, bilhetes, marketplace, perfil, etc.)
// ─────────────────────────────────────────────────────────────

const _renderHome=renderHome;
// ── HOME ────────────────────────────────────────────────────────────────────
renderHome=function(){
  const u=currentUser;
  document.getElementById('home-firstname').textContent=u.full_name.split(' ')[0]+' 👋';
  const TC={bronze:'#CD7F32',silver:'#A8A9AD',gold:'#F0A500',platinum:'#E5E4E2'};
  document.getElementById('home-member-card').innerHTML=`
    <div class="mc">
      <div class="mc-r">
        <div><div class="mc-lbl">Sócio Nº</div><div class="mc-num">${u.member_number.replace(/(\d{3})(\d{3})(\d{3})/,'$1 · $2 · $3')}</div></div>
        <div class="mc-badge" style="background:${TC[u.tier]||'#F0A500'};color:#003D2E">⭐ ${u.tier.toUpperCase()}</div>
      </div>
      <div class="mc-name">${u.full_name}</div>
      <div class="mc-r">
        <div class="mc-since">Sócio desde ${new Date(u.member_since).getFullYear()}</div>
        <div style="text-align:right"><div class="mc-pts">${u.points.toLocaleString('pt')}</div><div class="mc-ptslbl">pontos sporting</div></div>
      </div>
    </div>`;
  const myEvIds=TICKETS.filter(t=>t.holder===u.id&&t.status==='issued').map(t=>t.event_id);
  document.getElementById('home-events').innerHTML=EVENTS.map(ev=>{
    const d=new Date(ev.date+'T12:00:00');
    const has=myEvIds.includes(ev.id);
    return `<div class="gc ${has?'has':''}" onclick="${has?`openTicketForEvent('${ev.id}')`:``}">
      <div class="db"><div class="dd">${d.getDate()}</div><div class="dm">${d.toLocaleDateString('pt',{month:'short'}).replace('.','').toUpperCase()}</div></div>
      <div class="vd"></div>
      <div class="gi">
        <div class="gim">${ev.home} vs ${ev.away}</div>
        <div class="gix">⏰ ${ev.time} · ${ev.venue.replace('Estádio de ','')}</div>
        <div class="gic">${ev.competition}</div>
      </div>
      ${has?'<div class="hb">Tenho bilhete</div>':''}
    </div>`}).join('')+'<div style="height:20px"></div>';
};
const _renderTickets=renderTickets;
// ── LISTA DE BILHETES ───────────────────────────────────────────────────────
renderTickets=function(){
  const my=TICKETS.filter(t=>t.holder===currentUser.id&&t.status==='issued');
  document.getElementById('tickets-count').textContent=my.length+' bilhete'+(my.length!==1?'s':'');
  if(!my.length){document.getElementById('tickets-list').innerHTML='<div class="empty"><div class="empty-ic">🎫</div><div class="empty-t">Sem bilhetes</div><div class="empty-x">Não tens bilhetes ativos de momento.</div></div>';return;}
  document.getElementById('tickets-list').innerHTML=my.map(t=>{
    const ev=EVENTS.find(e=>e.id===t.event_id);
    const d=new Date(ev.date+'T12:00:00');
    return `<div class="tc" onclick="openTicketDetail('${t.id}')">
      <div class="tch"><div class="tcm">${ev.home} vs ${ev.away}</div>
      <div class="tcx">📅 ${d.toLocaleDateString('pt',{day:'numeric',month:'long'})} · ⏰ ${ev.time} · ${ev.competition}</div></div>
      <div class="tcs">${[['Setor',t.section],['Fila',t.row],['Lugar',t.seat],['Preço',t.price+'€']].map(([l,v])=>`<div class="tsf"><div class="tsl">${l}</div><div class="tsv">${v}</div></div>`).join('')}</div>
      <div class="tht">🎫 Toca para ver o QR code de entrada</div></div>`;
  }).join('')+'<div style="height:16px"></div>';
};
const _openTicketDetail=openTicketDetail;
// ── DETALHE DO BILHETE + QR CODE ────────────────────────────────────────────
openTicketDetail=function(ticketId){
  activeTicketId=ticketId;
  const t=TICKETS.find(x=>x.id===ticketId);
  const ev=EVENTS.find(e=>e.id===t.event_id);
  const d=new Date(ev.date+'T12:00:00');
  const isListed=LISTINGS.some(l=>l.ticket_id===ticketId&&l.status==='active');
  const qrPayload=JSON.stringify({ticketId:t.id,eventId:t.event_id,holder:t.holder,seat:`${t.section}-${t.row}-${t.seat}`,nonce:nonce(),event:ev.name});
  document.getElementById('ticket-detail-body').innerHTML=`
    <div class="tdh">
      <div class="tdb">${ev.competition}</div>
      <div class="tdmt">${ev.home} × ${ev.away}</div>
      <div class="tdi"><span>📅 ${d.toLocaleDateString('pt',{weekday:'short',day:'numeric',month:'long'})}</span><span>⏰ ${ev.time}</span><span>🏟 ${ev.venue}</span></div>
    </div>
    <div class="tdsep"><div class="tdsep-c"></div><div class="tdsep-l"></div><div class="tdsep-c"></div></div>
    <div class="tdseat">${[['SETOR',t.section],['FILA',t.row],['LUGAR',t.seat]].map(([l,v])=>`<div class="tdsf"><div class="tdsl">${l}</div><div class="tdsv">${v}</div></div>`).join('')}</div>
    <div class="qrz"><div id="qr-canvas"></div><div class="qref">SCP-${t.id.toUpperCase()}-${nonce()}</div></div>
    <div class="tdact">
      ${isListed
        ?`<button class="btn btn-o sm" onclick="delistTicket('${ticketId}')">✕ Retirar do Marketplace</button>`
        :`<button class="btn btn-p sm" onclick="openTransfer('${ticketId}')">↗ Transferir</button>
          <button class="btn btn-g sm" onclick="openSell('${ticketId}','${t.price}')">💰 Vender</button>`
      }
    </div>
    <div class="tddisc">⚠️ QR válido para uma entrada. Expira após utilização.</div>`;
  showScreen('ticket-detail');
  setTimeout(()=>{
    document.getElementById('qr-canvas').innerHTML='';
    try{new QRCode(document.getElementById('qr-canvas'),{text:qrPayload,width:200,height:200,colorDark:'#005C42',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});}
    catch(e){document.getElementById('qr-canvas').innerHTML='<div style="width:200px;height:200px;background:var(--g4);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:40px">🎫</div>';}
  },60);
};
const _renderMarketplace=renderMarketplace;
// ── MARKETPLACE ─────────────────────────────────────────────────────────────
renderMarketplace=function(){
  const active=LISTINGS.filter(l=>l.status==='active');
  if(!active.length){document.getElementById('marketplace-list').innerHTML='<div class="empty"><div class="empty-ic">🏪</div><div class="empty-t">Sem anúncios</div><div class="empty-x">Nenhum bilhete disponível de momento.</div></div>';return;}
  document.getElementById('marketplace-list').innerHTML=active.map(l=>{
    const t=TICKETS.find(x=>x.id===l.ticket_id);
    const ev=EVENTS.find(e=>e.id===t.event_id);
    const sel=MEMBERS.find(m=>m.id===l.seller_id);
    const d=new Date(ev.date+'T12:00:00');
    const sv=(l.original_price-l.asking_price).toFixed(2);
    const isOwn=l.seller_id===currentUser.id;
    return `<div class="lc">
      <div class="lch">
        <div class="lcc">${ev.competition}</div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div class="lcm">${ev.home} vs ${ev.away}</div>
          ${parseFloat(sv)>0?`<span class="svtag">-${sv}€</span>`:''}
        </div>
        <div class="lcx">📅 ${d.toLocaleDateString('pt',{day:'numeric',month:'short'})} · ⏰ ${ev.time}</div>
      </div>
      <div class="lcb">
        <div class="lcsrow">${[['Setor',t.section],['Fila',t.row],['Lugar',t.seat]].map(([lb,v])=>`<div class="lcsf"><div class="lcsl">${lb}</div><div class="lcsv">${v}</div></div>`).join('')}</div>
        <div class="lcpr">
          <div><div class="lcseller-l">Vendido por</div><div class="lcseller-n">${isOwn?'Tu ('+sel.full_name+')':sel.full_name}</div></div>
          <div style="text-align:right"><div class="lcprice">${l.asking_price}€</div>${parseFloat(sv)>0?`<div class="lcorig">${l.original_price}€</div>`:''}</div>
        </div>
        ${isOwn
          ?`<button class="btn btn-o sm" onclick="delistListing('${l.id}')">Retirar anúncio</button>`
          :`<button class="btn btn-p sm" onclick="buyListing('${l.id}')">Comprar — ${l.asking_price}€</button>`
        }
      </div></div>`;
  }).join('')+'<div style="height:16px"></div>';
};
const _renderProfile=renderProfile;
// ── PERFIL ───────────────────────────────────────────────────────────────────
renderProfile=function(){
  const u=currentUser;
  const TC={bronze:'#CD7F32',silver:'#A8A9AD',gold:'#F0A500',platinum:'#E5E4E2'};
  document.getElementById('profile-header').innerHTML=`
    <div class="prav">${initials(u.full_name)}</div>
    <div class="prname">${u.full_name}</div>
    <div class="premail">${u.email}</div>
    <div class="prtier" style="background:${TC[u.tier]||'#F0A500'};color:var(--g2)">⭐ ${u.tier.charAt(0).toUpperCase()+u.tier.slice(1)}</div>`;
  document.getElementById('profile-stats').innerHTML=[
    {label:'Número de Sócio',value:u.member_number.replace(/(\d{3})(\d{3})(\d{3})/,'$1·$2·$3')},
    {label:'Pontos',value:u.points.toLocaleString('pt')},
    {label:'Sócio desde',value:new Date(u.member_since).getFullYear()},
  ].map(s=>`<div class="stc"><div class="stv">${s.value}</div><div class="stl">${s.label}</div></div>`).join('');
};
const _searchMembers=searchMembers;
// ── PESQUISA DE SÓCIOS (TRANSFERÊNCIA) ──────────────────────────────────────
searchMembers=function(q){
  selectedTransferMember=null;
  document.getElementById('transfer-confirm').style.display='none';
  document.getElementById('transfer-submit-btn').style.display='none';
  if(q.length<2){document.getElementById('transfer-results').innerHTML='';return;}
  const m=MEMBERS.filter(x=>x.id!==currentUser.id&&(x.full_name.toLowerCase().includes(q.toLowerCase())||x.email.toLowerCase().includes(q.toLowerCase())||x.member_number.includes(q)));
  document.getElementById('transfer-results').innerHTML=m.length===0
    ?'<p style="color:var(--muted);padding:12px 0;font-size:14px">Nenhum sócio encontrado</p>'
    :m.map(x=>`<div class="mr" id="mr-${x.id}" onclick="selectTransferMember('${x.id}')">
        <div class="mrav" style="background:${avatarColor(x.full_name)}">${initials(x.full_name)}</div>
        <div><div class="mrn">${x.full_name}</div><div class="mrx">Sócio nº ${x.member_number}</div></div>
      </div>`).join('');
};
const _selectTransferMember=selectTransferMember;
selectTransferMember=function(memberId){
  selectedTransferMember=MEMBERS.find(m=>m.id===memberId);
  document.querySelectorAll('.mr').forEach(el=>{el.classList.toggle('sel',el.id==='mr-'+memberId);const c=el.querySelector('.mrck');if(c)c.remove();});
  const el=document.getElementById('mr-'+memberId);
  if(el)el.insertAdjacentHTML('beforeend','<span class="mrck">✓</span>');
  document.getElementById('transfer-confirm').style.display='block';
  document.getElementById('transfer-confirm').innerHTML=`<div class="cfbox"><div class="cflbl">Transferir para</div><div class="cfname">${selectedTransferMember.full_name}</div><div class="cfsub">Sócio nº ${selectedTransferMember.member_number}</div></div>`;
  document.getElementById('transfer-submit-btn').style.display='block';
};
const _updateSellBreakdown=updateSellBreakdown;
// ── CÁLCULO DE PREÇO (VENDA) ────────────────────────────────────────────────
updateSellBreakdown=function(){
  const t=TICKETS.find(x=>x.id===sellTicketId);if(!t)return;
  const val=parseFloat(document.getElementById('sell-price-input').value)||0;
  const max=t.price;const over=val>max;
  document.getElementById('sell-price-input').classList.toggle('over',over);
  document.getElementById('sell-price-error').style.display=over?'block':'none';
  document.getElementById('sell-price-error').textContent=`Máximo: ${max}€`;
  document.getElementById('sell-submit-btn').disabled=over;
  const c=(val*0.05).toFixed(2);const r=(val*0.95).toFixed(2);
  document.getElementById('sell-breakdown').innerHTML=
    `${[{l:'Preço original',v:`${max}€`},{l:'Preço de venda',v:`${val}€`},{l:'Comissão (5%)',v:`- ${c}€`}].map(x=>`<div class="brow"><span class="bl">${x.l}</span><span class="bv">${x.v}</span></div>`).join('')}
    <div class="brow"><span class="bl">Recebes</span><span class="bv">${r}€</span></div>`;
};
const _showSuccessScreen=showSuccessScreen;
// ── ECRÃ DE SUCESSO ─────────────────────────────────────────────────────────
showSuccessScreen=function(icon,title,sub,details,onDone){
  document.getElementById('success-body').innerHTML=`
    <div class="suci">${icon}</div>
    <div class="suct">${title}</div>
    <div class="sucx">${sub}</div>
    <div class="sucd">${details.map(d=>`<div class="srow"><span class="sk">${d.key}</span><span class="sv">${d.val}</span></div>`).join('')}</div>
    <button class="btn btn-p" id="success-done-btn">Continuar</button>`;
  document.getElementById('success-done-btn').onclick=onDone;
  showScreen('success');
};
