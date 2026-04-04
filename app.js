// ============================================================
// RCF HIDRATAÇÃO ATIVA — app.js (Modelo A — uso pessoal)
// ============================================================

const TURNOS = [
  { id: 'manha', label: 'Manhã',  icon: '🌅', time: '6h – 12h',  pct: 0.40 },
  { id: 'tarde', label: 'Tarde',  icon: '☀️', time: '12h – 18h', pct: 0.40 },
  { id: 'noite', label: 'Noite',  icon: '🌙', time: '18h – 23h', pct: 0.20 },
];

const DOSES_ML = [150, 200, 250, 300, 500, 750];

// ============================================================
// STATE — single user
// ============================================================
const ST = {
  user: null,       // { name, weight, meta }
  history: [],      // [{ date, meta, turnos: { manha, tarde, noite } }]
  todayEntry: null,
};

// ============================================================
// PERSISTENCE
// ============================================================
function persist() {
  try { localStorage.setItem('rcf_v4', JSON.stringify({ user: ST.user, history: ST.history })); } catch(e) {}
}

function hydrate() {
  try {
    const raw = localStorage.getItem('rcf_v4');
    if (raw) {
      const d = JSON.parse(raw);
      if (d.user)    ST.user    = d.user;
      if (d.history) ST.history = d.history;
    }
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
  return `${days[dt.getDay()]}, ${d}/${m}`;
}

function fmtDateFull(key) {
  const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const dt = new Date(key + 'T12:00:00');
  const [y, m, d] = key.split('-');
  return `${days[dt.getDay()]}, ${d}/${m}/${y}`;
}

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function curTurno() {
  const h = new Date().getHours();
  if (h >= 6  && h < 12) return 'manha';
  if (h >= 12 && h < 18) return 'tarde';
  if (h >= 18) return 'noite';
  return 'manha'; // madrugada → trata como manhã
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

function consecutiveDays() {
  if (!ST.history.length) return 0;
  const sorted = ST.history
    .filter(h => totalConsumed(h) >= h.meta)
    .map(h => h.date)
    .sort((a, b) => b.localeCompare(a));
  if (!sorted.length) return 0;
  let streak = 0;
  let cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  for (const dateStr of sorted) {
    const d = new Date(dateStr + 'T12:00:00');
    const diff = Math.round((cursor - d) / 86400000);
    if (diff === 0 || diff === 1) {
      streak++;
      cursor = d;
    } else {
      break;
    }
  }
  return streak;
}

// ============================================================
// ONBOARDING
// ============================================================
function obPreview() {
  const w    = parseFloat(document.getElementById('ob-weight').value);
  const prev = document.getElementById('ob-preview');
  if (w > 0) {
    prev.classList.add('show');
    document.getElementById('ob-preview-val').textContent = Math.round(w * 35).toLocaleString('pt-BR') + 'ml';
  } else {
    prev.classList.remove('show');
  }
}

function obSave() {
  const name   = (document.getElementById('ob-name').value || '').trim();
  const weight = parseFloat(document.getElementById('ob-weight').value);
  if (!name || name.length < 2)          { toast('Informe seu nome', 'red'); return; }
  if (!weight || weight < 20 || weight > 300) { toast('Peso inválido', 'red'); return; }
  ST.user = { name, weight, meta: Math.round(weight * 35) };
  persist();
  boot();
}

// ============================================================
// ENSURE TODAY ENTRY
// ============================================================
function ensureToday() {
  if (!ST.user) return;
  const key   = todayKey();
  let entry   = ST.history.find(h => h.date === key);
  if (!entry) {
    entry = {
      date: key,
      meta: ST.user.meta,
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
  renderToday();
}

function addCustom(turnoId) {
  const inp = document.getElementById('custom-input-' + turnoId);
  const v   = parseInt(inp.value);
  if (!v || v <= 0 || v > 3000) { toast('Valor inválido (max 3000ml)', 'red'); return; }
  addDose(turnoId, v);
  inp.value = '';
}

function markDone(turnoId) {
  if (!ST.todayEntry) return;
  ST.todayEntry.turnos[turnoId].done = true;
  persist();
  renderToday();
  toast('Turno concluído! 💪', 'green');
}

// ============================================================
// RENDER: HEADER
// ============================================================
function renderHeader() {
  const firstName = ST.user.name.split(' ')[0];
  document.getElementById('header-greeting').textContent = `Olá, ${firstName}!`;
  const streak = consecutiveDays();
  const metaEl = document.getElementById('header-meta');
  metaEl.innerHTML = streak > 0
    ? `🔥 ${streak} dia${streak > 1 ? 's' : ''}<br><span style="font-size:9px;color:var(--rcf-muted);letter-spacing:0.06em">seguidos</span>`
    : `${ST.user.meta.toLocaleString('pt-BR')}ml<br><span style="font-size:9px;color:var(--rcf-muted);letter-spacing:0.06em">meta/dia</span>`;
}

// ============================================================
// RENDER: TODAY
// ============================================================
function renderToday() {
  const entry  = ST.todayEntry;
  if (!entry) return;

  document.getElementById('today-label').textContent = fmtDateFull(todayKey());

  const streak = consecutiveDays();
  const streakEl = document.getElementById('day-streak');
  if (streak >= 2) {
    streakEl.textContent = `🔥 ${streak} dias`;
    streakEl.style.display = '';
  } else {
    streakEl.style.display = 'none';
  }

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
    alertBox.innerHTML = `<div class="alert green">🏆 Meta do dia atingida! Excelente hidratação!</div>`;
  } else if (curEntry.done) {
    alertBox.innerHTML = `<div class="alert green">✓ Turno ${curInfo.icon} ${curInfo.label} concluído! Avance para o próximo.</div>`;
  } else if (curFalt <= 0) {
    alertBox.innerHTML = `<div class="alert yellow">Turno ${curInfo.label}: meta atingida! Marque como concluído.</div>`;
  } else {
    alertBox.innerHTML = `<div class="alert red">⏰ ${curInfo.icon} Turno <strong>${curInfo.label}</strong>: faltam <strong>${curFalt.toLocaleString('pt-BR')}ml</strong></div>`;
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

    let badge = '';
    if (isDone)        badge = `<span class="badge badge-green">✓ Concluído</span>`;
    else if (isActive) badge = `<span class="badge badge-red">● Ativo</span>`;
    else if (isPast)   badge = `<span class="badge badge-yellow">Incompleto</span>`;

    const doses = DOSES_ML.map(d =>
      `<button class="dose-btn" onclick="addDose('${t.id}',${d})">${d >= 1000 ? (d/1000)+'L' : d+'ml'}</button>`
    ).join('');

    const markBtn = !isDone && (isActive || isPast)
      ? `<button class="btn-done" onclick="markDone('${t.id}')">✓ Marcar turno como concluído</button>`
      : '';

    return `<div class="turno-card ${isActive ? 'active-t' : ''} ${isDone ? 'done-t' : ''}">
      <div class="turno-header">
        <span style="font-size:16px">${t.icon}</span>
        <span class="turno-name">${t.label}</span>
        <span class="turno-time">${t.time}</span>
        ${badge}
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${tPct}%;background:${col}"></div></div>
      <div class="turno-stat">
        <span><strong>${(te.consumed||0).toLocaleString('pt-BR')}ml</strong> de ${tMeta.toLocaleString('pt-BR')}ml</span>
        <span><strong>${tPct}%</strong></span>
      </div>
      <div class="dose-grid">${doses}</div>
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
  const items = [...ST.history].sort((a, b) => b.date.localeCompare(a.date));

  // Summary stats
  const total  = items.length;
  const metas  = items.filter(h => totalConsumed(h) >= h.meta).length;
  const avgPct = total
    ? Math.round(items.reduce((s, h) => s + Math.min(100, totalConsumed(h) / h.meta * 100), 0) / total)
    : 0;

  document.getElementById('hist-summary').innerHTML = `
    <div class="stat-box"><div class="stat-box-val">${total}</div><div class="stat-box-lbl">Dias registrados</div></div>
    <div class="stat-box"><div class="stat-box-val" style="color:var(--green)">${metas}</div><div class="stat-box-lbl">Metas atingidas</div></div>
    <div class="stat-box"><div class="stat-box-val">${avgPct}%</div><div class="stat-box-lbl">Média geral</div></div>
  `;

  const list = document.getElementById('hist-list');
  if (!items.length) {
    list.innerHTML = `<div class="empty"><div class="empty-icon">📋</div><p>Nenhum registro ainda.<br>Comece a registrar hoje!</p></div>`;
    return;
  }

  list.innerHTML = items.map(h => {
    const tot = totalConsumed(h);
    const pct = Math.min(100, Math.round(tot / h.meta * 100));
    const col = pctColor(pct);
    const tagCls = pct >= 100 ? 'badge-green' : pct >= 60 ? 'badge-yellow' : 'badge-red';
    const tagLbl = pct >= 100 ? '✓ Meta' : pct >= 60 ? 'Parcial' : 'Baixo';
    return `<div class="hist-item" onclick='openHistDetail(${JSON.stringify(h)})'>
      <div class="hist-top">
        <div>
          <div class="hist-date">${fmtDateFull(h.date)}</div>
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
// RENDER: PERFIL
// ============================================================
function renderPerfil() {
  const u = ST.user;
  document.getElementById('perfil-avatar').textContent = initials(u.name);
  document.getElementById('perfil-name').textContent   = u.name;
  document.getElementById('perfil-sub').textContent    = `${u.weight}kg · Meta: ${u.meta.toLocaleString('pt-BR')}ml/dia`;
}

// ============================================================
// MODAL: HIST DETAIL
// ============================================================
function openHistDetail(h) {
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
    <div class="sheet-title">${fmtDateFull(h.date)}</div>
    ${rows}
    <div class="detail-row" style="border-top:1px solid var(--rcf-red);margin-top:4px;padding-top:12px">
      <strong>Total do dia</strong>
      <strong style="color:${col}">${tot.toLocaleString('pt-BR')}ml / ${h.meta.toLocaleString('pt-BR')}ml (${pct}%)</strong>
    </div>
    <button class="btn-secondary" style="margin-top:16px" onclick="closeSheet()">Fechar</button>
  `);
}

// ============================================================
// MODAL: EDIT PERFIL
// ============================================================
function openEditPerfil() {
  openSheet(`
    <div class="sheet-title">Editar Perfil</div>
    <label>Seu nome</label>
    <input type="text" id="ep-name" value="${ST.user.name}" autocapitalize="words">
    <label>Seu peso atual (kg)</label>
    <input type="number" id="ep-weight" value="${ST.user.weight}" min="30" max="250" oninput="epPreview()">
    <div class="meta-preview show" id="ep-preview">
      <span class="meta-preview-label">Nova meta diária</span>
      <span class="meta-preview-val" id="ep-preview-val">${ST.user.meta.toLocaleString('pt-BR')}ml</span>
    </div>
    <div class="btn-row">
      <button class="btn-secondary" onclick="closeSheet()">Cancelar</button>
      <button class="btn-primary" onclick="savePerfil()">Salvar</button>
    </div>
  `);
}

function epPreview() {
  const w = parseFloat(document.getElementById('ep-weight').value);
  if (w > 0) document.getElementById('ep-preview-val').textContent = Math.round(w * 35).toLocaleString('pt-BR') + 'ml';
}

function savePerfil() {
  const name   = (document.getElementById('ep-name').value || '').trim();
  const weight = parseFloat(document.getElementById('ep-weight').value);
  if (!name || name.length < 2)              { toast('Informe seu nome', 'red'); return; }
  if (!weight || weight < 20 || weight > 300){ toast('Peso inválido', 'red'); return; }
  ST.user = { name, weight, meta: Math.round(weight * 35) };
  // Update today's meta too
  if (ST.todayEntry) ST.todayEntry.meta = ST.user.meta;
  persist();
  closeSheet();
  renderHeader();
  renderPerfil();
  renderToday();
  toast('Perfil atualizado! ✓', 'green');
}

// ============================================================
// CONFIRM RESET
// ============================================================
function confirmReset() {
  openSheet(`
    <div class="sheet-title" style="color:var(--rcf-red)">⚠️ Resetar Dados</div>
    <p style="font-size:14px;color:var(--rcf-muted);line-height:1.6;margin-bottom:20px">
      Isso apagará <strong style="color:var(--rcf-white)">todo o seu histórico e perfil</strong> permanentemente. Esta ação não pode ser desfeita.
    </p>
    <div class="btn-row">
      <button class="btn-secondary" onclick="closeSheet()">Cancelar</button>
      <button class="btn-primary" style="background:var(--rcf-red)" onclick="resetAll()">Apagar tudo</button>
    </div>
  `);
}

function resetAll() {
  try { localStorage.removeItem('rcf_v4'); } catch(e) {}
  closeSheet();
  location.reload();
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
  if (id === 'perfil')    renderPerfil();
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
});

// ============================================================
// SERVICE WORKER
// ============================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

// ============================================================
// BOOT
// ============================================================
function boot() {
  if (!ST.user) {
    // Show onboarding
    document.getElementById('onboarding').style.display = '';
    document.getElementById('app').style.display = 'none';
  } else {
    // Show app
    document.getElementById('onboarding').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    ensureToday();
    renderHeader();
    renderToday();
  }
}

hydrate();
boot();
