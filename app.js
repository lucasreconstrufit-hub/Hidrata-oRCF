// ============================================================
// RCF HIDRATAÇÃO ATIVA — app.js
// ============================================================

const TURNOS = [
  { id: 'manha', label: 'Manhã',  icon: '🌅', time: '6h – 12h',  pct: 0.40, hStart: 6,  hEnd: 12 },
  { id: 'tarde', label: 'Tarde',  icon: '☀️', time: '12h – 18h', pct: 0.40, hStart: 12, hEnd: 18 },
  { id: 'noite', label: 'Noite',  icon: '🌙', time: '18h – 23h', pct: 0.20, hStart: 18, hEnd: 24 },
];

const DOSES_ML = [150, 200, 250, 300, 500, 750];

// ============================================================
// STATE
// ============================================================
const ST = {
  clients: [],
  history: [],
  activeId: null,
  todayEntry: null,
};

// ============================================================
// PERSISTENCE
// ============================================================
function persist() {
  try { localStorage.setItem('rcf_v3', JSON.stringify(ST)); } catch(e) {}
}

function hydrate() {
  try {
    const raw = localStorage.getItem('rcf_v3');
    if (raw) Object.assign(ST, JSON.parse(raw));
  } catch(e) {}
}

// ============================================================
// HELPERS
// ============================================================
function todayKey() { return new Date().toISOString().slice(0, 10); }

function fmtDate(key) {
  const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const dt = new Date(key + 'T12:00:00');
  const [y, m, d] = key.split('-');
  return `${days[dt.getDay()]}, ${d}/${m}/${y}`;
}

function getClient(id) { return ST.clients.find(c => c.id === id); }

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function curTurno() {
  const h = new Date().getHours();
  if (h >= 6  && h < 12) return 'manha';
  if (h >= 12 && h < 18) return 'tarde';
  if (h >= 18) return 'noite';
  return 'manha';
}

function totalConsumed(entry) {
  if (!entry) return 0;
  return Object.values(entry.turnos).reduce((s, t) => s + (t.consumed || 0), 0);
}

function pctColor(pct) {
  if (pct >= 100) return 'var(--green)';
  if (pct >= 60)  return 'var(--yellow)';
  return 'var(--rcf-red)';
}

function turnoIdx(id) { return TURNOS.findIndex(t => t.id === id); }

// ============================================================
// ENSURE TODAY ENTRY
// ============================================================
function ensureToday() {
  if (!ST.activeId) return;
  const cl = getClient(ST.activeId);
  if (!cl) return;
  const key = todayKey();
  let entry = ST.history.find(h => h.clientId === ST.activeId && h.date === key);
  if (!entry) {
    entry = {
      clientId: ST.activeId,
      date: key,
      meta: Math.round(cl.weight * 35),
      turnos: {
        manha: { consumed: 0, done: false },
        tarde: { consumed: 0, done: false },
        noite: { consumed: 0, done: false },
      }
    };
    ST.history.push(entry);
    persist();
  }
  ST.todayEntry = entry;
}

// ============================================================
// ACTIONS
// ============================================================
function addDose(turnoId, ml) {
  if (!ST.todayEntry) return;
  const t    = ST.todayEntry.turnos[turnoId];
  const info = TURNOS.find(x => x.id === turnoId);
  t.consumed += ml;
  const tMeta = Math.round(ST.todayEntry.meta * info.pct);
  if (t.consumed >= tMeta && !t.done) {
    t.done = true;
    toast(`🏅 Meta do turno ${info.label} atingida!`, 'green');
  } else {
    toast(`+${ml}ml adicionado!`, 'green');
  }
  persist();
  renderTracker();
}

function addCustom(turnoId) {
  const inp = document.getElementById('custom-input-' + turnoId);
  const v = parseInt(inp.value);
  if (!v || v <= 0 || v > 3000) { toast('Valor inválido (max 3000ml)', 'red'); return; }
  addDose(turnoId, v);
  inp.value = '';
}

function markDone(turnoId) {
  if (!ST.todayEntry) return;
  ST.todayEntry.turnos[turnoId].done = true;
  persist();
  renderTracker();
  toast('Turno concluído! 💪', 'green');
}

function selectClient(id) {
  ST.activeId = id;
  ensureToday();
  persist();
  renderAll();
  nav('hoje', document.querySelectorAll('.nav-tab')[0]);
  toast('Cliente selecionada!', 'green');
}

// ============================================================
// RENDER: TRACKER
// ============================================================
function renderTracker() {
  const noC = document.getElementById('no-client');
  const tr  = document.getElementById('tracker');

  if (!ST.activeId) {
    noC.style.display = ''; tr.style.display = 'none'; return;
  }
  noC.style.display = 'none'; tr.style.display = '';

  const cl    = getClient(ST.activeId);
  const entry = ST.todayEntry;
  if (!cl || !entry) return;

  document.getElementById('today-label').textContent = fmtDate(todayKey());
  document.getElementById('active-chip').textContent  = cl.name.split(' ')[0].toUpperCase();

  const total  = totalConsumed(entry);
  const meta   = entry.meta;
  const pct    = Math.min(100, Math.round(total / meta * 100));
  const faltam = Math.max(0, meta - total);

  // Ring
  const circ = 251.2;
  const ring  = document.getElementById('ring');
  ring.style.strokeDashoffset = circ - (circ * pct / 100);
  ring.style.stroke = pctColor(pct);
  document.getElementById('ring-pct').textContent = pct + '%';
  document.getElementById('ring-pct').style.color  = pctColor(pct);
  document.getElementById('ring-sub').textContent  = total.toLocaleString('pt-BR') + 'ml';

  document.getElementById('p-total').textContent = total.toLocaleString('pt-BR');
  document.getElementById('p-meta').textContent  = meta.toLocaleString('pt-BR') + 'ml';

  const faltamEl = document.getElementById('p-faltam');
  if (faltam <= 0) {
    faltamEl.textContent = '✓ Meta atingida!';
    faltamEl.style.color = 'var(--green)';
  } else {
    faltamEl.textContent = faltam.toLocaleString('pt-BR') + 'ml';
    faltamEl.style.color = 'var(--rcf-white)';
  }

  // Alert
  const cur      = curTurno();
  const curInfo  = TURNOS.find(t => t.id === cur);
  const curEntry = entry.turnos[cur];
  const curMeta  = Math.round(meta * curInfo.pct);
  const curFalt  = Math.max(0, curMeta - curEntry.consumed);
  const alertBox = document.getElementById('alert-box');

  if (pct >= 100) {
    alertBox.innerHTML = `<div class="alert green">🏆 Meta do dia atingida! Excelente hidratação hoje!</div>`;
  } else if (curEntry.done) {
    alertBox.innerHTML = `<div class="alert green">✓ Turno ${curInfo.icon} ${curInfo.label} concluído! Avance para o próximo.</div>`;
  } else if (curFalt <= 0) {
    alertBox.innerHTML = `<div class="alert yellow">Turno ${curInfo.label}: meta do turno atingida! Marque como concluído.</div>`;
  } else {
    alertBox.innerHTML = `<div class="alert red">⏰ ${curInfo.icon} Turno <strong>${curInfo.label}</strong>: faltam <strong>${curFalt.toLocaleString('pt-BR')}ml</strong> para a meta deste turno.</div>`;
  }

  // Turnos
  const curIdx = turnoIdx(cur);
  document.getElementById('turnos').innerHTML = TURNOS.map((t, idx) => {
    const te    = entry.turnos[t.id];
    const tMeta = Math.round(meta * t.pct);
    const tPct  = Math.min(100, Math.round((te.consumed || 0) / tMeta * 100));
    const isActive = t.id === cur;
    const isPast   = idx < curIdx;
    const isDone   = te.done;
    const col      = isDone ? 'var(--green)' : pctColor(tPct);

    let badgeHtml = '';
    if (isDone)        badgeHtml = `<span class="badge badge-green">✓ Concluído</span>`;
    else if (isActive) badgeHtml = `<span class="badge badge-red">● Ativo</span>`;
    else if (isPast)   badgeHtml = `<span class="badge badge-yellow">Incompleto</span>`;

    const dosesHtml = DOSES_ML.map(d =>
      `<button class="dose-btn" onclick="addDose('${t.id}',${d})">${d >= 1000 ? (d/1000) + 'L' : d + 'ml'}</button>`
    ).join('');

    const markBtn = !isDone && (isActive || isPast)
      ? `<button class="btn-done" onclick="markDone('${t.id}')">✓ Marcar turno como concluído</button>`
      : '';

    return `<div class="turno-card ${isActive ? 'active-t' : ''} ${isDone ? 'done-t' : ''}">
      <div class="turno-header">
        <span style="font-size:16px">${t.icon}</span>
        <span class="turno-name">${t.label}</span>
        <span class="turno-time">${t.time}</span>
        ${badgeHtml}
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${tPct}%;background:${col}"></div></div>
      <div class="turno-stat">
        <span><strong>${(te.consumed || 0).toLocaleString('pt-BR')}ml</strong> de ${tMeta.toLocaleString('pt-BR')}ml</span>
        <span><strong>${tPct}%</strong></span>
      </div>
      <div class="dose-grid">${dosesHtml}</div>
      <div class="dose-input-row">
        <input type="number" id="custom-input-${t.id}" placeholder="Outro (ml)" min="1" max="3000">
        <button class="btn-primary" style="width:auto;padding:10px 14px;font-size:12px" onclick="addCustom('${t.id}')">+ Add</button>
      </div>
      ${markBtn}
    </div>`;
  }).join('');
}

// ============================================================
// RENDER: HISTORICO
// ============================================================
function renderHist() {
  const sel  = document.getElementById('h-filter');
  const curV = sel.value;
  sel.innerHTML = '<option value="">Todas as clientes</option>';
  ST.clients.forEach(c => {
    const o = document.createElement('option');
    o.value = c.id; o.textContent = c.name; sel.appendChild(o);
  });
  sel.value = curV;

  const items = ST.history
    .filter(h => !sel.value || h.clientId === sel.value)
    .sort((a, b) => b.date.localeCompare(a.date));

  const list = document.getElementById('hist-list');
  if (!items.length) {
    list.innerHTML = `<div class="empty"><div class="empty-icon">📋</div><p>Nenhum registro encontrado.</p></div>`;
    return;
  }

  list.innerHTML = items.map(h => {
    const cl  = getClient(h.clientId);
    const tot = totalConsumed(h);
    const pct = Math.min(100, Math.round(tot / h.meta * 100));
    const col = pctColor(pct);
    const tagCls = pct >= 100 ? 'badge-green' : pct >= 60 ? 'badge-yellow' : 'badge-red';
    const tagLbl = pct >= 100 ? '✓ Meta' : pct >= 60 ? 'Parcial' : 'Baixo';
    return `<div class="hist-item" onclick='openHistDetail(${JSON.stringify(h)})'>
      <div class="hist-top">
        <div>
          <div class="hist-date">${fmtDate(h.date)}</div>
          <div class="hist-client">${cl ? cl.name : '—'}</div>
        </div>
        <div>
          <div class="hist-pct" style="color:${col}">${pct}%</div>
          <div class="hist-ml">${tot.toLocaleString('pt-BR')}ml</div>
        </div>
      </div>
      <div class="hist-bar-track"><div class="hist-bar-fill" style="width:${pct}%;background:${col}"></div></div>
      <div style="margin-top:7px;text-align:right"><span class="badge ${tagCls}">${tagLbl}</span></div>
    </div>`;
  }).join('');
}

// ============================================================
// RENDER: CLIENTES
// ============================================================
function renderClients() {
  const list = document.getElementById('clients-list');
  if (!ST.clients.length) {
    list.innerHTML = `<div class="empty"><div class="empty-icon">👩</div><p>Nenhuma cliente cadastrada.<br>Toque em <strong style="color:var(--rcf-red)">+ Cliente</strong> para começar.</p></div>`;
    return;
  }
  list.innerHTML = ST.clients.map(c => {
    const days     = ST.history.filter(h => h.clientId === c.id && totalConsumed(h) >= h.meta).length;
    const isActive = ST.activeId === c.id;
    return `<div class="client-item ${isActive ? 'selected' : ''}" onclick="selectClient('${c.id}')">
      <div class="avatar">${initials(c.name)}</div>
      <div class="client-info">
        <div class="client-name-text">${c.name}</div>
        <div class="client-sub">${c.weight}kg · Meta: ${Math.round(c.weight * 35).toLocaleString('pt-BR')}ml/dia</div>
        ${isActive ? `<div style="font-size:10px;margin-top:3px;color:var(--rcf-red)"><span class="active-dot"></span>Selecionada</div>` : ''}
      </div>
      <div class="client-right">
        <div class="client-streak">${days}<small>metas atingidas</small></div>
      </div>
    </div>`;
  }).join('');
}

function renderAll() {
  renderTracker();
  renderHist();
  renderClients();
}

// ============================================================
// MODAL: HIST DETAIL
// ============================================================
function openHistDetail(h) {
  const cl  = getClient(h.clientId);
  const tot = totalConsumed(h);
  const pct = Math.min(100, Math.round(tot / h.meta * 100));
  const col = pctColor(pct);

  const rows = TURNOS.map(t => {
    const te    = h.turnos[t.id];
    const tMeta = Math.round(h.meta * t.pct);
    const tp    = Math.min(100, Math.round((te.consumed || 0) / tMeta * 100));
    return `<div class="detail-row">
      <span>${t.icon} ${t.label} <small style="color:var(--rcf-muted)">(${t.time})</small></span>
      <span class="val" style="color:${pctColor(tp)}">${(te.consumed||0).toLocaleString('pt-BR')}ml / ${tMeta.toLocaleString('pt-BR')}ml</span>
    </div>`;
  }).join('');

  openSheet(`
    <div class="sheet-title">${fmtDate(h.date)}</div>
    <div style="font-size:12px;color:var(--rcf-muted);margin-bottom:14px;letter-spacing:0.06em;text-transform:uppercase">${cl ? cl.name : '—'}</div>
    ${rows}
    <div class="detail-row" style="border-top:1px solid var(--rcf-red);margin-top:4px;padding-top:12px">
      <strong>Total do dia</strong>
      <strong style="color:${col}">${tot.toLocaleString('pt-BR')}ml / ${h.meta.toLocaleString('pt-BR')}ml (${pct}%)</strong>
    </div>
    <button class="btn-secondary" style="margin-top:16px" onclick="closeSheet()">Fechar</button>
  `);
}

// ============================================================
// MODAL: NEW CLIENT
// ============================================================
function openNewClient() {
  openSheet(`
    <div class="sheet-title">Nova Cliente</div>
    <label>Nome completo</label>
    <input type="text" id="nc-name" placeholder="Ex: Ana Carolina Silva" autocomplete="off">
    <label>Peso atual (kg)</label>
    <input type="number" id="nc-weight" placeholder="Ex: 65" min="30" max="250" oninput="previewMeta()">
    <div class="meta-preview" id="meta-prev">
      <span class="meta-preview-label">Meta diária estimada</span>
      <span class="meta-preview-val" id="meta-prev-val">—</span>
    </div>
    <div class="btn-row">
      <button class="btn-secondary" onclick="closeSheet()">Cancelar</button>
      <button class="btn-primary" onclick="saveClient()">Salvar</button>
    </div>
  `);
}

function previewMeta() {
  const w    = parseFloat(document.getElementById('nc-weight').value);
  const prev = document.getElementById('meta-prev');
  if (w > 0) {
    prev.classList.add('show');
    document.getElementById('meta-prev-val').textContent = Math.round(w * 35).toLocaleString('pt-BR') + 'ml';
  } else {
    prev.classList.remove('show');
  }
}

function saveClient() {
  const name   = (document.getElementById('nc-name').value || '').trim();
  const weight = parseFloat(document.getElementById('nc-weight').value);
  if (!name || name.length < 2)          { toast('Informe o nome completo', 'red'); return; }
  if (!weight || weight < 20 || weight > 300) { toast('Peso inválido', 'red'); return; }
  const c = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    name,
    weight,
  };
  ST.clients.push(c);
  persist();
  closeSheet();
  renderClients();
  toast('Cliente cadastrada! ✓', 'green');
}

// ============================================================
// SHEET
// ============================================================
function openSheet(html) {
  document.getElementById('sheet-body').innerHTML = html;
  document.getElementById('overlay').classList.add('open');
}

function closeSheet() {
  document.getElementById('overlay').classList.remove('open');
}

document.getElementById('overlay').addEventListener('click', function(e) {
  if (e.target === this) closeSheet();
});

// ============================================================
// NAV
// ============================================================
function nav(id, tab) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  if (tab) tab.classList.add('active');
  if (id === 'historico') renderHist();
  if (id === 'clientes')  renderClients();
}

// ============================================================
// TOAST
// ============================================================
function toast(msg, type = 'green') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast t-${type} show`;
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.className = 'toast'; }, 2800);
}

// ============================================================
// PWA — INSTALL PROMPT
// ============================================================
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const card = document.getElementById('install-card');
  if (card) card.style.display = 'block';
});

function installPWA() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(() => {
    deferredPrompt = null;
    const card = document.getElementById('install-card');
    if (card) card.style.display = 'none';
  });
}

window.addEventListener('appinstalled', () => {
  toast('App instalado com sucesso! 🎉', 'green');
  deferredPrompt = null;
});

// ============================================================
// SERVICE WORKER REGISTRATION
// ============================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(() => console.log('[RCF] Service Worker registrado'))
      .catch(err => console.warn('[RCF] SW falhou:', err));
  });
}

// ============================================================
// BOOT
// ============================================================
hydrate();
ensureToday();
renderAll();
